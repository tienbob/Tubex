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
    
    // If user is admin, allow access to any company
    if (user && user.role === 'admin') {
        return true;
    }
    
    // For non-admin users, verify they belong to the requested company
    return user && user.companyId === companyId;
};

export const getInventory = async (req: Request, res: Response) => {
    const { companyId, warehouseId } = req.params;
    
    // Check if user has access to this company's data
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const query: FindOptionsWhere<Inventory> = { company_id: companyId };
    
    if (warehouseId) {
        query.warehouse_id = warehouseId;
    }

    const inventory = await inventoryRepository.find({
        where: query,
        relations: ["product", "warehouse"],
    });
    res.json(inventory);
};

export const getInventoryItem = async (req: Request, res: Response) => {
    const { id, companyId } = req.params;
    
    // Check if user has access to this company's data
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const item = await inventoryRepository.findOne({
        where: { id, company_id: companyId },
        relations: ["product", "warehouse"],
    });
    if (!item) {
        throw new AppError(404, "Inventory item not found");
    }
    res.json(item);
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
        await inventoryValidation.validateWarehouseAccess(warehouse_id, companyId, queryRunner);

        // Check if product exists
        const product = await queryRunner.manager.findOne(Product, { where: { id: product_id } });
        if (!product) {
            throw new AppError(404, "Product not found");
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
        });

        await queryRunner.manager.save(newItem);

        // Check if initial quantity requires batch tracking
        if (quantity > 0) {
            const initialBatch = new Batch();
            initialBatch.batch_number = `INIT-${product_id}-${Date.now()}`;
            initialBatch.product_id = product_id;
            initialBatch.warehouse_id = warehouse_id;
            initialBatch.quantity = quantity;
            initialBatch.unit = unit;
            initialBatch.metadata = { 
                type: 'initial_stock',
                created_by: (req as any).user?.id 
            };
            
            await queryRunner.manager.save(initialBatch);
        }

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
    
    const { quantity, min_threshold, max_threshold, reorder_point, reorder_quantity, auto_reorder, status } = req.body;

    const item = await inventoryRepository.findOne({
        where: { id, company_id: companyId },
    });

    if (!item) {
        throw new AppError(404, "Inventory item not found");
    }

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
        
        const { adjustment, reason, batch_number, manufacturing_date, expiry_date } = req.body;

        const item = await queryRunner.manager.findOne(Inventory, {
            where: { id, company_id: companyId },
            relations: ["warehouse", "product"],
            lock: { mode: "pessimistic_write" }
        });

        if (!item) {
            throw new AppError(404, "Inventory item not found");
        }

        const newQuantity = Number(item.quantity) + Number(adjustment);
        if (newQuantity < 0) {
            throw new AppError(400, "Insufficient inventory");
        }

        // Update inventory quantity
        item.quantity = newQuantity;
        await queryRunner.manager.save(item);

        // Create batch record for incoming stock
        if (batch_number && adjustment > 0) {
            const batch = new Batch();
            batch.batch_number = batch_number;
            batch.product_id = item.product_id;
            batch.warehouse_id = item.warehouse_id;
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
    
    const item = await inventoryRepository.findOne({
        where: { id, company_id: companyId },
    });

    if (!item) {
        throw new AppError(404, "Inventory item not found");
    }

    await inventoryRepository.remove(item);
    res.status(204).send();
};

export const checkLowStock = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    
    // Check if user has access to this company's data
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }
    
    const lowStockItems = await inventoryRepository
        .createQueryBuilder("inventory")
        .leftJoinAndSelect("inventory.product", "product")
        .leftJoinAndSelect("inventory.warehouse", "warehouse")
        .where("inventory.company_id = :companyId", { companyId })
        .andWhere("inventory.quantity <= inventory.min_threshold")
        .andWhere("inventory.status = :status", { status: "active" })
        .getMany();

    res.json(lowStockItems);
};

export const getExpiringBatches = async (req: Request, res: Response) => {
    const { companyId } = req.params;
    const { days = 30 } = req.query;
    
    // Check if user has access to this company's data
    if (!checkCompanyAccess(req, companyId)) {
        throw new AppError(403, "Unauthorized access to company data");
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(days));

    const expiringBatches = await batchRepository
        .createQueryBuilder("batch")
        .leftJoinAndSelect("batch.product", "product")
        .leftJoinAndSelect("batch.warehouse", "warehouse")
        .where("warehouse.company_id = :companyId", { companyId })
        .andWhere("batch.expiry_date <= :expiryDate", { expiryDate })
        .andWhere("batch.expiry_date >= :now", { now: new Date() })
        .andWhere("batch.quantity > 0")
        .andWhere("batch.status = :status", { status: "active" })
        .getMany();

    res.json(expiringBatches);
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
        }

        targetInventory.quantity += quantity;
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
    });

    res.json({ message: "Stock transferred successfully" });
};