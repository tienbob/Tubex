import { Request, Response } from "express";
import { AppDataSource } from "../../database/ormconfig";
import { Inventory, Product, Company, Warehouse, Batch } from "../../database/models/sql";
import { AppError } from "../../middleware/errorHandler";
import { FindOptionsWhere } from "typeorm";

const inventoryRepository = AppDataSource.getRepository(Inventory);
const batchRepository = AppDataSource.getRepository(Batch);
const warehouseRepository = AppDataSource.getRepository(Warehouse);

export const getInventory = async (req: Request, res: Response) => {
    const { companyId, warehouseId } = req.params;
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
    const { product_id, warehouse_id, quantity, unit, min_threshold, max_threshold, reorder_point, reorder_quantity, auto_reorder } = req.body;

    const company = await AppDataSource.getRepository(Company).findOneBy({ id: companyId });
    if (!company) {
        throw new AppError(404, "Company not found");
    }

    const product = await AppDataSource.getRepository(Product).findOneBy({ id: product_id });
    if (!product) {
        throw new AppError(404, "Product not found");
    }

    const warehouse = await warehouseRepository.findOne({
        where: { id: warehouse_id, company_id: companyId },
    });
    if (!warehouse) {
        throw new AppError(404, "Warehouse not found");
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

    await inventoryRepository.save(newItem);
    res.status(201).json(newItem);
};

export const updateInventoryItem = async (req: Request, res: Response) => {
    const { id, companyId } = req.params;
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
    const { adjustment, reason, batch_number, manufacturing_date, expiry_date } = req.body;

    const item = await inventoryRepository.findOne({
        where: { id, company_id: companyId },
        relations: ["warehouse"],
    });

    if (!item) {
        throw new AppError(404, "Inventory item not found");
    }

    const newQuantity = Number(item.quantity) + Number(adjustment);
    if (newQuantity < 0) {
        throw new AppError(400, "Insufficient inventory");
    }

    // Start transaction for inventory adjustment
    await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Update inventory quantity
        item.quantity = newQuantity;
        await transactionalEntityManager.save(item);

        // Create batch record if batch info provided
        if (batch_number && adjustment > 0) {
            const batch = new Batch();
            batch.batch_number = batch_number;
            batch.product_id = item.product_id;
            batch.warehouse_id = item.warehouse_id;
            batch.quantity = adjustment;
            batch.unit = item.unit;
            batch.manufacturing_date = manufacturing_date;
            batch.expiry_date = expiry_date;
            batch.metadata = { reason };
            
            await transactionalEntityManager.save(batch);
        }

        // Check if reorder is needed
        if (item.auto_reorder && item.reorder_point && newQuantity <= item.reorder_point) {
            // TODO: Implement reorder notification or automatic purchase order creation
            item.last_reorder_date = new Date();
            await transactionalEntityManager.save(item);
        }
    });

    res.json(item);
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
    const { id, companyId } = req.params;
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