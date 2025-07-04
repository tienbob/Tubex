import { Request, Response } from "express";
import { AppDataSource } from "../../database"; // Import from database module instead of directly from ormconfig
import { Inventory, Product, Company, Warehouse, Batch } from "../../database/models/sql";
import { AppError } from "../../middleware/errorHandler";
import { FindOptionsWhere, QueryRunner, MoreThan } from "typeorm";
import { inventoryValidation } from "./validation";
import { logger } from "../../app";

const inventoryRepository = AppDataSource.getRepository(Inventory);
const batchRepository = AppDataSource.getRepository(Batch);
const warehouseRepository = AppDataSource.getRepository(Warehouse);

// Add a helper function to check user's access to company data
const checkCompanyAccess = (req: Request, companyId: string): boolean => {
    const user = (req as any).user;
    
    // CRITICAL SECURITY FIX: Remove blanket admin access that could lead to horizontal privilege escalation
    // All users (including admins) must belong to the company they're trying to access
    if (!user || !user.companyId) {
        return false;
    }
    
    // Strict company isolation: users can only access their own company's data
    return user.companyId === companyId;
};

// Add enhanced authorization check for multi-tenant security
const checkResourceAccess = (req: Request, companyId: string, resourceOwnerId?: string): boolean => {
    const user = (req as any).user;
    
    // First check company access
    if (!checkCompanyAccess(req, companyId)) {
        return false;
    }
    
    // Additional check for resource-specific access based on role
    if (resourceOwnerId && user.role !== 'admin') {
        // Non-admin users must own the resource or have explicit permission
        return user.companyId === resourceOwnerId;
    }
    
    return true;
};

export const getInventory = async (req: Request, res: Response) => {
    const { companyId, warehouseId } = req.params;
    const { batchFilter } = req.query;
    
    // SECURITY FIX: Strict company access validation
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const user = (req as any).user;
    const userRole = user?.role;
    
    // SECURITY FIX: Get user's company type from company entity instead of user object
    const userCompany = await AppDataSource.getRepository(Company).findOne({
        where: { id: user.companyId }
    });
    
    if (!userCompany) {
        throw new AppError(403, "Invalid company association");
    }
    
    const userCompanyType = userCompany.type;    // Build query using QueryBuilder to handle all relationships
    const queryBuilder = inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .leftJoinAndSelect('inventory.warehouse', 'warehouse')
        .leftJoinAndSelect('product.supplier', 'supplier')
        .where('inventory.company_id = :companyId', { companyId });
    
    // SECURITY FIX: Enhanced role-based filtering with proper company type validation
    if (userCompanyType === 'dealer') {
        // Dealers should only see inventory for products they have added to their catalog
        queryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
    } else if (userCompanyType === 'supplier') {
        // Suppliers should see inventory for their own products
        queryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
    } else {
        // SECURITY: Unknown company type should not have access
        throw new AppError(403, "Invalid company type for inventory access");
    }
    
    if (warehouseId) {
        // SECURITY FIX: Validate warehouse ownership
        const warehouse = await AppDataSource.getRepository(Warehouse).findOne({
            where: { id: warehouseId, company_id: companyId }
        });
        
        if (!warehouse) {
            throw new AppError(403, "Warehouse does not belong to your company");        }
        
        queryBuilder.andWhere('inventory.warehouse_id = :warehouseId', { warehouseId });
    }    const inventory = await queryBuilder.getMany();    // Get batch information for all inventory items
    const inventoryIds = inventory.map(item => item.id);
    let batches: Batch[] = [];
    
    if (inventoryIds.length > 0) {
        const batchQuery = batchRepository
            .createQueryBuilder('batch')
            .where('batch.company_id = :companyId', { companyId })
            .andWhere('batch.status = :status', { status: 'active' });
        
        // Apply batch filter if provided
        if (batchFilter) {
            batchQuery.andWhere('batch.batch_number ILIKE :batchFilter', { 
                batchFilter: `%${batchFilter}%` 
            });
        }
        
        batches = await batchQuery.getMany();
    }

    // Create a map of batches by product_id and warehouse_id for faster lookup
    const batchMap = new Map();
    batches.forEach(batch => {
        const key = `${batch.product_id}-${batch.warehouse_id}`;
        if (!batchMap.has(key)) {
            batchMap.set(key, []);
        }
        batchMap.get(key).push(batch);
    });

    // Transform inventory data to include flat properties that frontend expects
    const transformedInventory = inventory.map(item => {
        const batchKey = `${item.product_id}-${item.warehouse_id}`;
        const itemBatches = batchMap.get(batchKey) || [];
        const primaryBatch = itemBatches.length > 0 ? itemBatches[0] : null;
        
        return {
            ...item,
            product_name: item.product?.name || '',
            warehouse_name: item.warehouse?.name || '',
            supplier_name: item.product?.supplier?.name || '',
            // Add flat properties for compatibility
            threshold: item.min_threshold,
            warehouse_capacity: item.warehouse?.capacity || 1000,
            last_updated: item.updated_at,
            batch_number: primaryBatch?.batch_number || null,
            batches: itemBatches, // Include all batches for this inventory item
        };
    });
    
    res.json(transformedInventory);
};

export const getInventoryItem = async (req: Request, res: Response) => {
    const { id, companyId } = req.params;
    
    // SECURITY FIX: Strict company access validation
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const user = (req as any).user;
    
    // SECURITY FIX: Get user's company type from company entity
    const userCompany = await AppDataSource.getRepository(Company).findOne({
        where: { id: user.companyId }
    });
    
    if (!userCompany) {
        throw new AppError(403, "Invalid company association");
    }
    
    const userCompanyType = userCompany.type;
    
    // Build query using QueryBuilder to handle product relationships
    const queryBuilder = inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .leftJoinAndSelect('inventory.warehouse', 'warehouse')
        .leftJoinAndSelect('product.supplier', 'supplier')
        .where('inventory.id = :id', { id })
        .andWhere('inventory.company_id = :companyId', { companyId });
    
    // SECURITY FIX: Enhanced role-based filtering
    if (userCompanyType === 'dealer') {
        // Dealers should only see inventory for products they have added to their catalog
        queryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
    } else if (userCompanyType === 'supplier') {
        // Suppliers should see inventory for their own products
        queryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
    } else {
        throw new AppError(403, "Invalid company type for inventory access");
    }
      const item = await queryBuilder.getOne();
    if (!item) {
        throw new AppError(404, "Inventory item not found or access denied");
    }    // Transform inventory item to include flat properties that frontend expects
    const transformedItem = {
        ...item,
        product_name: item.product?.name || '',
        warehouse_name: item.warehouse?.name || '',
        supplier_name: item.product?.supplier?.name || '',
        // Add flat properties for compatibility
        threshold: item.min_threshold,
        warehouse_capacity: item.warehouse?.capacity || 1000,
        last_updated: item.updated_at,
        batch_number: null, // Placeholder for batch functionality
    };
    
    res.json(transformedItem);
};

export const createInventoryItem = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
        // Check user access
        if (!checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }
        
        const { product_id, warehouse_id, quantity, unit, min_threshold, max_threshold, reorder_point, reorder_quantity, auto_reorder } = req.body;

        // Validate warehouse access
        await inventoryValidation.validateWarehouseAccess(warehouse_id, companyId, queryRunner);        // Check if product exists and belongs to this company
        const user = (req as any).user;
        const userRole = user?.role;
        const userCompanyType = user?.companyType;
        
        const productQueryBuilder = queryRunner.manager
            .createQueryBuilder(Product, 'product')
            .where('product.id = :product_id', { product_id });
        
        // Apply dealer/supplier filtering based on user role and company type
        if (userRole === 'dealer' || (userRole === 'admin' && userCompanyType === 'dealer')) {
            // Dealers and admins in dealer companies can only create inventory for products they have added
            productQueryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
        } else if (userRole === 'supplier' || (userRole === 'admin' && userCompanyType === 'supplier')) {
            // Suppliers and admins in supplier companies can create inventory for their products
            productQueryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
        }
        
        const product = await productQueryBuilder.getOne();
        if (!product) {
            throw new AppError(404, "Product not found or you don't have permission to manage inventory for this product");
        }

        // Check if inventory record already exists
        const existingInventory = await queryRunner.manager.findOne(Inventory, {
            where: {
                product_id,
                warehouse_id,
                company_id: companyId
            }
        });

        if (existingInventory) {
            throw new AppError(400, "Inventory record already exists for this product in the warehouse");
        }

        const newItem = inventoryRepository.create({
            company_id: companyId,
            product_id,
            warehouse_id,
            quantity,
            unit,
            min_threshold,
            max_threshold,
            reorder_point,
            reorder_quantity,
            auto_reorder,
        });        await queryRunner.manager.save(newItem);        
        await queryRunner.commitTransaction();
        res.status(201).json(newItem);
    } catch (error) {
        await queryRunner.rollbackTransaction();
        logger.error('Error creating inventory item:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, "Failed to create inventory item");
    } finally {
        await queryRunner.release();
    }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
    const { id, companyId } = req.params;
    
    // Check if user has access to this company's data
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const user = (req as any).user;
    const userRole = user?.role;
    const userCompanyType = user?.companyType;
    
    // Build query using QueryBuilder to handle product relationships
    const queryBuilder = inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .where('inventory.id = :id', { id })
        .andWhere('inventory.company_id = :companyId', { companyId });
    
    // Apply dealer/supplier filtering based on user role and company type
    if (userRole === 'dealer' || (userRole === 'admin' && userCompanyType === 'dealer')) {
        // Dealers and admins in dealer companies should only update inventory for products they have added
        queryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
    } else if (userRole === 'supplier' || (userRole === 'admin' && userCompanyType === 'supplier')) {
        // Suppliers and admins in supplier companies should update inventory for their products
        queryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
    }
    
    const item = await queryBuilder.getOne();

    if (!item) {
        throw new AppError(404, "Inventory item not found or you don't have permission to manage this inventory");
    }
    
    const { quantity, min_threshold, max_threshold, reorder_point, reorder_quantity, auto_reorder, status } = req.body;

    Object.assign(item, {
        quantity,
        min_threshold,
        max_threshold,
        reorder_point,
        reorder_quantity,
        auto_reorder,
        status,
    });

    await inventoryRepository.save(item);
    res.json(item);
};

export const adjustInventoryQuantity = async (req: Request, res: Response) => {
    const { id, companyId } = req.params;
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // Check user access
        if (!checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }
        
        const { adjustment, reason, batch_number, manufacturing_date, expiry_date } = req.body;        const user = (req as any).user;
        const userRole = user?.role;
        const userCompanyType = user?.companyType;
        
        // Build query using QueryBuilder to handle product relationships
        const itemQueryBuilder = queryRunner.manager
            .createQueryBuilder(Inventory, 'inventory')
            .leftJoinAndSelect('inventory.product', 'product')
            .leftJoinAndSelect('inventory.warehouse', 'warehouse')
            .where('inventory.id = :id', { id })
            .andWhere('inventory.company_id = :companyId', { companyId });
        
        // Apply dealer/supplier filtering based on user role and company type
        if (userRole === 'dealer' || (userRole === 'admin' && userCompanyType === 'dealer')) {
            // Dealers and admins in dealer companies should only adjust inventory for products they have added
            itemQueryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
        } else if (userRole === 'supplier' || (userRole === 'admin' && userCompanyType === 'supplier')) {
            // Suppliers and admins in supplier companies should adjust inventory for their products
            itemQueryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
        }

        const item = await itemQueryBuilder
            .setLock("pessimistic_write")
            .getOne();

        if (!item) {
            throw new AppError(404, "Inventory item not found or you don't have permission to adjust this inventory");
        }

        const newQuantity = Number(item.quantity) + Number(adjustment);
        if (newQuantity < 0) {
            throw new AppError(400, "Insufficient inventory");
        }

        // Update inventory quantity
        item.quantity = newQuantity;
        await queryRunner.manager.save(item);        // Create batch record for incoming stock
        if (adjustment > 0) {
            const batch = new Batch();
            // Generate a clean batch number if not provided
            batch.batch_number = batch_number || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
            batch.product_id = item.product_id;
            batch.warehouse_id = item.warehouse_id;
            batch.company_id = companyId; // CRITICAL FIX: Add company_id for multi-tenant isolation
            batch.quantity = adjustment;
            batch.unit = item.unit;
            batch.manufacturing_date = manufacturing_date ? new Date(manufacturing_date) : null;
            batch.expiry_date = expiry_date ? new Date(expiry_date) : null;
            batch.metadata = { 
                reason, 
                adjustment_date: new Date(),
                adjusted_by: (req as any).user?.id
            };
            
            await queryRunner.manager.save(batch);
        }

        // Handle outgoing stock with FIFO
        if (adjustment < 0) {
            const remainingReduction = await handleOutgoingStock(
                Math.abs(adjustment),
                item.product_id,
                item.warehouse_id,
                reason,
                queryRunner
            );

            if (remainingReduction > 0) {
                throw new AppError(400, `Could not allocate full quantity from batches. Unallocated: ${remainingReduction}`);
            }
        }

        // Check stock levels and trigger reorder if needed
        const stockStatus = await inventoryValidation.checkLowStockThresholds(id, queryRunner);
        if (stockStatus.isLow) {
            await handleLowStockAlert(item, stockStatus, queryRunner);
        }

        await queryRunner.commitTransaction();
        res.json({
            ...item,
            stockStatus
        });
    } catch (error) {
        await queryRunner.rollbackTransaction();
        logger.error('Error adjusting inventory:', error);
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, "Failed to adjust inventory");
    } finally {
        await queryRunner.release();
    }
};

// Helper function to handle outgoing stock
async function handleOutgoingStock(
    quantity: number,
    productId: string,
    warehouseId: string,
    reason: string,
    queryRunner: QueryRunner
): Promise<number> {
    let remainingQuantity = quantity;
    
    const batches = await queryRunner.manager.find(Batch, {
        where: {
            product_id: productId,
            warehouse_id: warehouseId,
            quantity: MoreThan(0)
        },
        order: {
            expiry_date: "ASC",
            created_at: "ASC"
        },
        lock: { mode: "pessimistic_write" }
    });

    for (const batch of batches) {
        if (remainingQuantity <= 0) break;

        const deduction = Math.min(batch.quantity, remainingQuantity);
        batch.quantity -= deduction;
        remainingQuantity -= deduction;

        batch.metadata = {
            ...batch.metadata,
            last_deduction: {
                amount: deduction,
                date: new Date(),
                reason
            }
        };

        await queryRunner.manager.save(batch);
    }

    return remainingQuantity;
}

// Helper function to handle low stock alerts
async function handleLowStockAlert(
    item: Inventory,
    stockStatus: { isLow: boolean; currentQuantity: number; threshold: number },
    queryRunner: QueryRunner
) {
    if (item.auto_reorder && item.reorder_point && item.reorder_quantity) {
        item.last_reorder_date = new Date();
        await queryRunner.manager.save(item);

        // TODO: Implement reorder notification or automatic purchase order creation
        logger.info(`Low stock alert: Product ${item.product_id} needs reorder. Current: ${stockStatus.currentQuantity}, Threshold: ${stockStatus.threshold}`);
    }
}

export const deleteInventoryItem = async (req: Request, res: Response) => {
    const { id, companyId } = req.params;
    
    // Check if user has access to this company's data
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const user = (req as any).user;
    const userRole = user?.role;
    const userCompanyType = user?.companyType;
    
    // Build query using QueryBuilder to handle product relationships
    const queryBuilder = inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .where('inventory.id = :id', { id })
        .andWhere('inventory.company_id = :companyId', { companyId });
    
    // Apply dealer/supplier filtering based on user role and company type
    if (userRole === 'dealer' || (userRole === 'admin' && userCompanyType === 'dealer')) {
        // Dealers and admins in dealer companies should only delete inventory for products they have added
        queryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
    } else if (userRole === 'supplier' || (userRole === 'admin' && userCompanyType === 'supplier')) {
        // Suppliers and admins in supplier companies should delete inventory for their products
        queryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
    }
    
    const item = await queryBuilder.getOne();

    if (!item) {
        throw new AppError(404, "Inventory item not found or you don't have permission to delete this inventory");
    }

    await inventoryRepository.remove(item);
    res.status(204).send();
};

export const checkLowStock = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const inventoryRepository = AppDataSource.getRepository(Inventory);
    
    const user = (req as any).user;
    const userCompany = await AppDataSource.getRepository(Company).findOne({
        where: { id: user.companyId }
    });
    
    if (!userCompany) {
        throw new AppError(403, "Invalid company association");
    }
    
    const userCompanyType = userCompany.type;
    
    // Build query for low stock items
    const queryBuilder = inventoryRepository
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .leftJoinAndSelect('inventory.warehouse', 'warehouse')
        .leftJoinAndSelect('product.supplier', 'supplier')
        .where('inventory.company_id = :companyId', { companyId })
        .andWhere('inventory.min_threshold IS NOT NULL')
        .andWhere('CAST(inventory.quantity AS DECIMAL) <= CAST(inventory.min_threshold AS DECIMAL)');
    
    // Apply role-based filtering
    if (userCompanyType === 'dealer') {
        queryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
    } else if (userCompanyType === 'supplier') {
        queryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
    } else {
        throw new AppError(403, "Invalid company type for inventory access");
    }
    
    const lowStockItems = await queryBuilder.getMany();
    
    // Transform data to include flat properties
    const transformedItems = lowStockItems.map(item => ({
        ...item,
        product_name: item.product?.name || '',
        warehouse_name: item.warehouse?.name || '',
        supplier_name: item.product?.supplier?.name || '',
        threshold: item.min_threshold,
        warehouse_capacity: item.warehouse?.capacity || 1000,
        last_updated: item.updated_at,
    }));
    
    res.json(transformedItems);
};

export const getExpiringBatches = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const { daysThreshold = 30, warehouseId } = req.query;
    
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const user = (req as any).user;
    const userCompany = await AppDataSource.getRepository(Company).findOne({
        where: { id: user.companyId }
    });
    
    if (!userCompany) {
        throw new AppError(403, "Invalid company association");
    }
    
    const userCompanyType = userCompany.type;
    const batchRepository = AppDataSource.getRepository(Batch);
    
    // Calculate the expiry date threshold
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + Number(daysThreshold));
    
    // Build query for expiring batches
    const queryBuilder = batchRepository
        .createQueryBuilder('batch')
        .leftJoinAndSelect('batch.product', 'product')
        .leftJoinAndSelect('batch.warehouse', 'warehouse')
        .leftJoinAndSelect('product.supplier', 'supplier')
        .where('batch.company_id = :companyId', { companyId })
        .andWhere('batch.expiry_date IS NOT NULL')
        .andWhere('batch.expiry_date <= :expiryThreshold', { expiryThreshold })
        .andWhere('batch.status = :status', { status: 'active' });
    
    // Apply role-based filtering
    if (userCompanyType === 'dealer') {
        queryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
    } else if (userCompanyType === 'supplier') {
        queryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
    } else {
        throw new AppError(403, "Invalid company type for inventory access");
    }
    
    if (warehouseId) {
        // Validate warehouse ownership
        const warehouse = await AppDataSource.getRepository(Warehouse).findOne({
            where: { id: warehouseId as string, company_id: companyId }
        });
        
        if (!warehouse) {
            throw new AppError(403, "Warehouse does not belong to your company");
        }
        
        queryBuilder.andWhere('batch.warehouse_id = :warehouseId', { warehouseId });
    }
    
    const expiringBatches = await queryBuilder.getMany();
      // Calculate days to expiry and transform data
    const transformedBatches = expiringBatches.map(batch => {
        const now = new Date();
        const expiryDate = batch.expiry_date ? new Date(batch.expiry_date) : null;
        const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        return {
            ...batch,
            product_name: batch.product?.name || '',
            warehouse_name: batch.warehouse?.name || '',
            supplier_name: batch.product?.supplier?.name || '',
            daysToExpiry,
            isExpired: daysToExpiry !== null && daysToExpiry < 0,
            expiryStatus: daysToExpiry === null ? 'no_expiry' : 
                         daysToExpiry < 0 ? 'expired' : 
                         daysToExpiry <= 7 ? 'critical' : 'warning'
        };
    });
    
    res.json(transformedBatches);
};

export const transferStock = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    
    // Check if user has access to this company's data
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const { source_warehouse_id, target_warehouse_id, product_id, quantity, batch_numbers } = req.body;

    // Validate warehouses belong to company
    const warehouses = await warehouseRepository.find({
        where: [
            { id: source_warehouse_id, company_id: companyId },
            { id: target_warehouse_id, company_id: companyId }
        ]
    });

    if (warehouses.length !== 2) {
        throw new AppError(404, "Invalid warehouse IDs");
    }    const user = (req as any).user;
    const userRole = user?.role;
    const userCompanyType = user?.companyType;
    
    // Validate that the product belongs to this company based on role
    const productQueryBuilder = AppDataSource.getRepository(Product)
        .createQueryBuilder('product')
        .where('product.id = :product_id', { product_id });
    
    // Apply dealer/supplier filtering based on user role and company type
    if (userRole === 'dealer' || (userRole === 'admin' && userCompanyType === 'dealer')) {
        // Dealers and admins in dealer companies can only transfer inventory for products they have added
        productQueryBuilder.andWhere('product.dealer_id = :companyId', { companyId });
    } else if (userRole === 'supplier' || (userRole === 'admin' && userCompanyType === 'supplier')) {
        // Suppliers and admins in supplier companies can transfer inventory for their products
        productQueryBuilder.andWhere('product.supplier_id = :companyId', { companyId });
    }
    
    const product = await productQueryBuilder.getOne();
    if (!product) {
        throw new AppError(404, "Product not found or you don't have permission to transfer inventory for this product");
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Deduct from source
        const sourceInventory = await inventoryRepository.findOne({
            where: {
                warehouse_id: source_warehouse_id,
                product_id,
                company_id: companyId
            }
        });

        if (!sourceInventory || sourceInventory.quantity < quantity) {
            throw new AppError(400, "Insufficient stock in source warehouse");
        }

        sourceInventory.quantity -= quantity;
        await transactionalEntityManager.save(sourceInventory);

        // Add to target
        let targetInventory = await inventoryRepository.findOne({
            where: {
                warehouse_id: target_warehouse_id,
                product_id,
                company_id: companyId
            }
        });

        if (!targetInventory) {
            targetInventory = inventoryRepository.create({
                warehouse_id: target_warehouse_id,
                product_id,
                company_id: companyId,
                quantity: 0,
                unit: sourceInventory.unit
            });
        }        targetInventory.quantity += quantity;
        await transactionalEntityManager.save(targetInventory);

        // Update batch locations if specified
        if (batch_numbers && batch_numbers.length > 0) {
            await transactionalEntityManager
                .createQueryBuilder()
                .update(Batch)
                .set({ warehouse_id: target_warehouse_id })
                .where("batch_number IN (:...batch_numbers)", { batch_numbers })
                .andWhere("warehouse_id = :source_warehouse_id", { source_warehouse_id })
                .execute();
        }
    });    res.json({ message: "Stock transferred successfully" });
};