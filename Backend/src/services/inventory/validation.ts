import { AppDataSource } from '../../database';
import { Inventory, Product, Warehouse, Batch } from '../../database/models/sql';
import { AppError } from '../../middleware/errorHandler';
import { QueryRunner } from 'typeorm';

export interface InventoryValidationService {
    validateStockAvailability(
        productId: string,
        warehouseId: string,
        quantity: number,
        queryRunner?: QueryRunner
    ): Promise<boolean>;
    
    validateBatchAvailability(
        batchNumber: string,
        quantity: number,
        queryRunner?: QueryRunner
    ): Promise<boolean>;
    
    validateWarehouseAccess(
        warehouseId: string,
        companyId: string,
        queryRunner?: QueryRunner
    ): Promise<boolean>;
    
    checkLowStockThresholds(
        inventoryId: string,
        queryRunner?: QueryRunner
    ): Promise<{
        isLow: boolean;
        currentQuantity: number;
        threshold: number;
    }>;
}

class InventoryValidationServiceImpl implements InventoryValidationService {
    async validateStockAvailability(
        productId: string,
        warehouseId: string,
        quantity: number,
        queryRunner?: QueryRunner
    ): Promise<boolean> {
        const manager = queryRunner?.manager || AppDataSource.manager;
        
        const inventory = await manager.findOne(Inventory, {
            where: { 
                product_id: productId,
                warehouse_id: warehouseId
            },
            lock: queryRunner ? { mode: "pessimistic_read" } : undefined
        });

        if (!inventory) {
            throw new AppError(404, "Inventory record not found");
        }

        if (inventory.quantity < quantity) {
            throw new AppError(400, `Insufficient stock. Available: ${inventory.quantity}, Requested: ${quantity}`);
        }

        return true;
    }

    async validateBatchAvailability(
        batchNumber: string,
        quantity: number,
        queryRunner?: QueryRunner
    ): Promise<boolean> {
        const manager = queryRunner?.manager || AppDataSource.manager;
        
        const batch = await manager.findOne(Batch, {
            where: { batch_number: batchNumber },
            lock: queryRunner ? { mode: "pessimistic_read" } : undefined
        });

        if (!batch) {
            throw new AppError(404, "Batch not found");
        }

        if (batch.quantity < quantity) {
            throw new AppError(400, `Insufficient batch quantity. Available: ${batch.quantity}, Requested: ${quantity}`);
        }

        // Check if batch is expired
        if (batch.expiry_date && batch.expiry_date < new Date()) {
            throw new AppError(400, "Cannot use expired batch");
        }

        return true;
    }

    async validateWarehouseAccess(
        warehouseId: string,
        companyId: string,
        queryRunner?: QueryRunner
    ): Promise<boolean> {
        const manager = queryRunner?.manager || AppDataSource.manager;
        
        const warehouse = await manager.findOne(Warehouse, {
            where: { 
                id: warehouseId,
                company_id: companyId
            }
        });

        if (!warehouse) {
            throw new AppError(403, "Unauthorized access to warehouse");
        }

        return true;
    }

    async checkLowStockThresholds(
        inventoryId: string,
        queryRunner?: QueryRunner
    ): Promise<{
        isLow: boolean;
        currentQuantity: number;
        threshold: number;
    }> {
        const manager = queryRunner?.manager || AppDataSource.manager;
        
        const inventory = await manager.findOne(Inventory, {
            where: { id: inventoryId }
        });

        if (!inventory) {
            throw new AppError(404, "Inventory record not found");
        }

        const isLow = inventory.min_threshold !== null && 
                     inventory.quantity <= inventory.min_threshold;

        return {
            isLow,
            currentQuantity: inventory.quantity,
            threshold: inventory.min_threshold || 0
        };
    }
}



export const inventoryValidation = new InventoryValidationServiceImpl();