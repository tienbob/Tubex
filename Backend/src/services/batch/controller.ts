import { Request, Response } from 'express';
import { AppDataSource } from '../../database';
import { Batch, Company, Warehouse, Product } from '../../database/models/sql';
import { AppError } from '../../middleware/errorHandler';
import { FindOptionsWhere, QueryRunner, MoreThan, Between } from 'typeorm';
import { logger } from '../../app';

const batchRepository = AppDataSource.getRepository(Batch);
const warehouseRepository = AppDataSource.getRepository(Warehouse);
const productRepository = AppDataSource.getRepository(Product);
const companyRepository = AppDataSource.getRepository(Company);

/**
 * Multi-tenant batch service with strict company isolation
 */
export class BatchService {
    
    /**
     * Helper function to check user's access to company data
     */
    private static checkCompanyAccess(req: Request, companyId: string): boolean {
        const user = (req as any).user;
        
        if (!user || !user.companyId) {
            return false;
        }
        
        // Strict company isolation: users can only access their own company's data
        return user.companyId === companyId;
    }

    /**
     * Create a new batch with proper company isolation
     */
    static async createBatch(req: Request, res: Response) {
        const { companyId } = req.params;
        const {
            batch_number,
            product_id,
            warehouse_id,
            quantity,
            unit,
            manufacturing_date,
            expiry_date,
            metadata
        } = req.body;

        // Security validation
        if (!BatchService.checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }

        const user = (req as any).user;
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate warehouse belongs to company
            const warehouse = await warehouseRepository.findOne({
                where: { id: warehouse_id, company_id: companyId }
            });

            if (!warehouse) {
                throw new AppError(404, "Warehouse not found or doesn't belong to your company");
            }

            // Validate product access
            const product = await productRepository.findOne({
                where: { id: product_id },
                relations: ['supplier', 'dealer']
            });

            if (!product) {
                throw new AppError(404, "Product not found");
            }

            // Check if company has access to this product
            const isSupplier = product.supplier_id === companyId;
            const isAuthorizedDealer = product.dealer_id === companyId || product.dealer_id === null;

            if (!isSupplier && !isAuthorizedDealer) {
                throw new AppError(403, "Your company doesn't have access to this product");
            }

            // Check for duplicate batch number within company
            const existingBatch = await batchRepository.findOne({
                where: { batch_number, company_id: companyId }
            });

            if (existingBatch) {
                throw new AppError(409, "Batch number already exists for your company");
            }

            // Create new batch
            const batch = new Batch();
            batch.batch_number = batch_number;
            batch.product_id = product_id;
            batch.warehouse_id = warehouse_id;
            batch.company_id = companyId; // Critical: Set company context
            batch.quantity = quantity;
            batch.unit = unit;
            batch.manufacturing_date = manufacturing_date ? new Date(manufacturing_date) : null;
            batch.expiry_date = expiry_date ? new Date(expiry_date) : null;
            batch.metadata = {
                ...metadata,
                created_by: user.id,
                created_at: new Date()
            };

            const savedBatch = await queryRunner.manager.save(batch);

            await queryRunner.commitTransaction();

            res.status(201).json({
                success: true,
                data: savedBatch,
                message: 'Batch created successfully'
            });

        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error creating batch:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get batches with proper company filtering
     */
    static async getBatches(req: Request, res: Response) {
        const { companyId } = req.params;
        const { 
            warehouse_id, 
            product_id, 
            status = 'active',
            expiring_days,
            page = 1,
            limit = 50
        } = req.query;

        // Security validation
        if (!BatchService.checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }

        try {
            const queryBuilder = batchRepository
                .createQueryBuilder('batch')
                .leftJoinAndSelect('batch.product', 'product')
                .leftJoinAndSelect('batch.warehouse', 'warehouse')
                .leftJoinAndSelect('product.supplier', 'supplier')
                .where('batch.company_id = :companyId', { companyId })
                .andWhere('batch.status = :status', { status });

            // Additional filters
            if (warehouse_id) {
                queryBuilder.andWhere('batch.warehouse_id = :warehouse_id', { warehouse_id });
            }

            if (product_id) {
                queryBuilder.andWhere('batch.product_id = :product_id', { product_id });
            }

            // Filter for expiring batches
            if (expiring_days) {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + Number(expiring_days));
                
                queryBuilder.andWhere('batch.expiry_date IS NOT NULL')
                           .andWhere('batch.expiry_date <= :futureDate', { futureDate })
                           .andWhere('batch.expiry_date >= :now', { now: new Date() });
            }

            // Pagination
            const skip = (Number(page) - 1) * Number(limit);
            queryBuilder.skip(skip).take(Number(limit));

            // Ordering
            queryBuilder.orderBy('batch.expiry_date', 'ASC', 'NULLS LAST')
                       .addOrderBy('batch.created_at', 'DESC');

            const [batches, totalCount] = await queryBuilder.getManyAndCount();

            res.json({
                success: true,
                data: batches,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalCount,
                    pages: Math.ceil(totalCount / Number(limit))
                }
            });

        } catch (error) {
            logger.error('Error fetching batches:', error);
            throw error;
        }
    }

    /**
     * Get batch by ID with company validation
     */
    static async getBatchById(req: Request, res: Response) {
        const { companyId, batchId } = req.params;

        // Security validation
        if (!BatchService.checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }

        try {
            const batch = await batchRepository.findOne({
                where: { 
                    id: batchId,
                    company_id: companyId // Critical: Filter by company
                },
                relations: ['product', 'warehouse', 'product.supplier']
            });

            if (!batch) {
                throw new AppError(404, "Batch not found or access denied");
            }

            res.json({
                success: true,
                data: batch
            });

        } catch (error) {
            logger.error('Error fetching batch:', error);
            throw error;
        }
    }

    /**
     * Update batch with company validation
     */
    static async updateBatch(req: Request, res: Response) {
        const { companyId, batchId } = req.params;
        const updateData = req.body;

        // Security validation
        if (!BatchService.checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }

        const user = (req as any).user;

        try {
            const batch = await batchRepository.findOne({
                where: { 
                    id: batchId,
                    company_id: companyId // Critical: Filter by company
                }
            });

            if (!batch) {
                throw new AppError(404, "Batch not found or access denied");
            }            // Update allowed fields
            if (updateData.quantity !== undefined) batch.quantity = updateData.quantity;
            if (updateData.manufacturing_date !== undefined) {
                batch.manufacturing_date = updateData.manufacturing_date ? new Date(updateData.manufacturing_date) : null;
            }
            if (updateData.expiry_date !== undefined) {
                batch.expiry_date = updateData.expiry_date ? new Date(updateData.expiry_date) : null;
            }
            if (updateData.status !== undefined) batch.status = updateData.status;
            if (updateData.metadata !== undefined) {
                batch.metadata = {
                    ...batch.metadata,
                    ...updateData.metadata,
                    updated_by: user.id,
                    updated_at: new Date()
                };
            }

            const updatedBatch = await batchRepository.save(batch);

            res.json({
                success: true,
                data: updatedBatch,
                message: 'Batch updated successfully'
            });

        } catch (error) {
            logger.error('Error updating batch:', error);
            throw error;
        }
    }

    /**
     * Delete/deactivate batch with company validation
     */
    static async deleteBatch(req: Request, res: Response) {
        const { companyId, batchId } = req.params;

        // Security validation
        if (!BatchService.checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }

        try {
            const batch = await batchRepository.findOne({
                where: { 
                    id: batchId,
                    company_id: companyId // Critical: Filter by company
                }
            });

            if (!batch) {
                throw new AppError(404, "Batch not found or access denied");
            }

            // Soft delete by changing status
            batch.status = 'inactive';
            batch.metadata = {
                ...batch.metadata,
                deactivated_by: (req as any).user?.id,
                deactivated_at: new Date()
            };

            await batchRepository.save(batch);

            res.json({
                success: true,
                message: 'Batch deactivated successfully'
            });

        } catch (error) {
            logger.error('Error deleting batch:', error);
            throw error;
        }
    }

    /**
     * Get batch statistics for company
     */
    static async getBatchStats(req: Request, res: Response) {
        const { companyId } = req.params;

        // Security validation
        if (!BatchService.checkCompanyAccess(req, companyId)) {
            throw new AppError(403, "Unauthorized access to company data");
        }

        try {
            const stats = await batchRepository
                .createQueryBuilder('batch')
                .select([
                    'COUNT(*) as total_batches',
                    'SUM(CASE WHEN batch.status = \'active\' THEN 1 ELSE 0 END) as active_batches',
                    'SUM(CASE WHEN batch.expiry_date <= CURRENT_DATE + INTERVAL \'30 days\' AND batch.expiry_date >= CURRENT_DATE THEN 1 ELSE 0 END) as expiring_soon',
                    'SUM(CASE WHEN batch.expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) as expired_batches',
                    'SUM(batch.quantity) as total_quantity'
                ])
                .where('batch.company_id = :companyId', { companyId })
                .getRawOne();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Error fetching batch stats:', error);
            throw error;
        }
    }
}
