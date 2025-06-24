import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../database/ormconfig';
import { Warehouse } from '../../database/models/sql/warehouse';
import { AppError } from '../../middleware/errorHandler';
import { Inventory } from '../../database/models/sql/inventory';
import { Not } from 'typeorm';

/**
 * Get all warehouses for a company
 */
export const getAllWarehouses = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { companyId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

        const warehouseRepository = AppDataSource.getRepository(Warehouse);
        
        const [warehouses, total] = await warehouseRepository.findAndCount({
            where: { company_id: companyId },
            take: limit,
            skip: offset,
            order: { name: 'ASC' }
        });

        return res.status(200).json({
            status: 'success',
            data: {
                warehouses,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Get a specific warehouse by ID
 */
export const getWarehouseById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { companyId, warehouseId } = req.params;
        
        const warehouseRepository = AppDataSource.getRepository(Warehouse);
        const warehouse = await warehouseRepository.findOne({
            where: { 
                id: warehouseId,
                company_id: companyId
            }
        });

        if (!warehouse) {
            return next(new AppError(404, 'Warehouse not found'));
        }

        return res.status(200).json({
            status: 'success',
            data: warehouse
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Create a new warehouse
 */
export const createWarehouse = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { companyId } = req.params;
        const { name, address, capacity, contactInfo, type } = req.body;

        const warehouseRepository = AppDataSource.getRepository(Warehouse);
        
        // Check if warehouse with same name already exists for this company
        const existingWarehouse = await warehouseRepository.findOne({
            where: {
                name,
                company_id: companyId
            }
        });

        if (existingWarehouse) {
            return next(new AppError(400,'A warehouse with this name already exists'));
        }

        const newWarehouse = warehouseRepository.create({
            name,
            address,
            capacity,
            contact_info: contactInfo,
            type,
            company_id: companyId
        });

        const savedWarehouse = await warehouseRepository.save(newWarehouse);

        return res.status(201).json({
            status: 'success',
            data: savedWarehouse
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Update a warehouse
 */
export const updateWarehouse = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { companyId, warehouseId } = req.params;
        const { name, address, capacity, contactInfo, type, status } = req.body;

        const warehouseRepository = AppDataSource.getRepository(Warehouse);
        
        // Find the warehouse to update
        const warehouse = await warehouseRepository.findOne({
            where: { 
                id: warehouseId,
                company_id: companyId
            }
        });

        if (!warehouse) {
            return next(new AppError(404,'Warehouse not found'));
        }

        // Check for duplicate name if name is being changed
        if (name && name !== warehouse.name) {
            const existingWarehouse = await warehouseRepository.findOne({
                where: {
                    name,
                    company_id: companyId,
                    id: Not(warehouseId) // Exclude current warehouse from check
                }
            });

            if (existingWarehouse) {
                return next(new AppError(400,'A warehouse with this name already exists'));
            }
        }

        // Update warehouse properties
        if (name) warehouse.name = name;
        if (address) warehouse.address = address;
        if (capacity !== undefined) warehouse.capacity = capacity;
        if (contactInfo) warehouse.contact_info = contactInfo;
        if (type) warehouse.type = type;
        if (status) warehouse.status = status;

        const updatedWarehouse = await warehouseRepository.save(warehouse);

        return res.status(200).json({
            status: 'success',
            data: updatedWarehouse
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Delete a warehouse
 */
export const deleteWarehouse = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { companyId, warehouseId } = req.params;
        
        const warehouseRepository = AppDataSource.getRepository(Warehouse);
        
        // Check if warehouse exists
        const warehouse = await warehouseRepository.findOne({
            where: { 
                id: warehouseId,
                company_id: companyId
            }
        });

        if (!warehouse) {
            return next(new AppError(404,'Warehouse not found'));
        }

        // Check if warehouse has inventory items
        const inventoryRepository = AppDataSource.getRepository(Inventory);
        const inventoryCount = await inventoryRepository.count({
            where: { warehouse_id: warehouseId }
        });

        if (inventoryCount > 0) {
            return next(
                new AppError(400,'Cannot delete warehouse with existing inventory items')
            );
        }

        await warehouseRepository.remove(warehouse);

        return res.status(200).json({
            status: 'success',
            message: 'Warehouse deleted successfully'
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Get warehouse capacity usage
 */
export const getCapacityUsage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { companyId, warehouseId } = req.params;
        
        const warehouseRepository = AppDataSource.getRepository(Warehouse);
        const warehouse = await warehouseRepository.findOne({
            where: { 
                id: warehouseId,
                company_id: companyId
            }
        });

        if (!warehouse) {
            return next(new AppError(404,'Warehouse not found'));
        }

        // Calculate current usage based on inventory items
        const inventoryRepository = AppDataSource.getRepository(Inventory);
        const inventoryItems = await inventoryRepository.find({
            where: { warehouse_id: warehouseId }
        });

        let currentUsage = 0;
        for (const item of inventoryItems) {
            // Add logic to calculate usage based on product dimensions and quantity
            // For now, this is a simplified calculation
            currentUsage += item.quantity;
        }

        const capacityUsage = {
            totalCapacity: warehouse.capacity || 0,
            currentUsage,
            availableCapacity: (warehouse.capacity || 0) - currentUsage,
            utilizationPercentage: warehouse.capacity ? (currentUsage / warehouse.capacity) * 100 : 0
        };

        return res.status(200).json({
            status: 'success',
            data: {
                warehouse,
                capacityUsage
            }
        });
    } catch (error) {
        return next(error);
    }
};
