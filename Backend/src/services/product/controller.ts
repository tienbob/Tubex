import { Request, Response } from 'express';
import { AppDataSource } from '../../database/ormconfig';
import { Product } from '../../database/models/sql/product';
import { Company } from '../../database/models/sql/company';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../app';
import { In } from 'typeorm';

interface AuthRequest extends Request {
    user: Express.User;
}

export const productController = {
    async createProduct(req: AuthRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { name, description, base_price, unit, supplier_id, status } = req.body;
            
            // Verify supplier exists and is of type 'supplier'
            const supplier = await queryRunner.manager.findOne(Company, { 
                where: { id: supplier_id, type: 'supplier' },
                lock: { mode: "pessimistic_read" }
            });

            if (!supplier) {
                throw new AppError(404, 'Supplier not found');
            }

            // Check if user has permission to create products for this supplier
            if (req.user.companyId !== supplier_id && req.user.role !== 'admin') {
                throw new AppError(403, 'Unauthorized to create products for this supplier');
            }

            const product = new Product();
            product.name = name;
            product.description = description;
            product.base_price = base_price;
            product.unit = unit;
            product.supplier_id = supplier_id;
            product.status = status || 'active';

            const savedProduct = await queryRunner.manager.save(product);
            await queryRunner.commitTransaction();
            
            res.status(201).json(savedProduct);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error creating product:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to create product');
        } finally {
            await queryRunner.release();
        }
    },

    async updateProduct(req: AuthRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { id } = req.params;
            const updates = req.body;
            
            // Find product with lock for update
            const product = await queryRunner.manager.findOne(Product, { 
                where: { id },
                relations: ['supplier'],
                lock: { mode: "pessimistic_write" }
            });

            if (!product) {
                throw new AppError(404, 'Product not found');
            }

            // Check authorization
            if (req.user.companyId !== product.supplier_id && req.user.role !== 'admin') {
                throw new AppError(403, 'Unauthorized to update this product');
            }

            // If supplier_id is being updated, verify new supplier exists
            if (updates.supplier_id && updates.supplier_id !== product.supplier_id) {
                const supplier = await queryRunner.manager.findOne(Company, { 
                    where: { id: updates.supplier_id, type: 'supplier' }
                });

                if (!supplier) {
                    throw new AppError(404, 'New supplier not found');
                }

                // Only admins can change supplier
                if (req.user.role !== 'admin') {
                    throw new AppError(403, 'Unauthorized to change product supplier');
                }
            }

            // Update product with version check
            Object.assign(product, updates);
            const updatedProduct = await queryRunner.manager.save(Product, product);
            
            await queryRunner.commitTransaction();
            res.json(updatedProduct);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error updating product:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to update product');
        } finally {
            await queryRunner.release();
        }
    },

    async getProduct(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const product = await AppDataSource.getRepository(Product).findOne({ 
                where: { id },
                relations: ['supplier']
            });

            if (!product) {
                throw new AppError(404, 'Product not found');
            }

            res.json(product);
        } catch (error) {
            logger.error('Error fetching product:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to fetch product');
        }
    },

    async listProducts(req: AuthRequest, res: Response) {
        try {
            const { supplier_id, status, page = 1, limit = 10, search } = req.query;
            
            const queryBuilder = AppDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.supplier', 'supplier');

            if (supplier_id) {
                queryBuilder.andWhere('product.supplier_id = :supplier_id', { supplier_id });
            }

            if (status) {
                queryBuilder.andWhere('product.status = :status', { status });
            }

            // Add search functionality
            if (search) {
                queryBuilder.andWhere(
                    '(product.name ILIKE :search OR product.description ILIKE :search)',
                    { search: `%${search}%` }
                );
            }

            // Add sorting
            queryBuilder.orderBy('product.created_at', 'DESC');

            const [products, total] = await queryBuilder
                .skip((+page - 1) * +limit)
                .take(+limit)
                .getManyAndCount();

            res.json({
                products,
                pagination: {
                    total,
                    page: +page,
                    limit: +limit,
                    totalPages: Math.ceil(total / +limit)
                }
            });
        } catch (error) {
            logger.error('Error listing products:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to list products');
        }
    },

    async deleteProduct(req: AuthRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { id } = req.params;
            
            const product = await queryRunner.manager.findOne(Product, { 
                where: { id },
                relations: ['supplier'],
                lock: { mode: "pessimistic_write" }
            });

            if (!product) {
                throw new AppError(404, 'Product not found');
            }

            // Check authorization
            if (req.user.companyId !== product.supplier_id && req.user.role !== 'admin') {
                throw new AppError(403, 'Unauthorized to delete this product');
            }

            // Soft delete by updating status
            product.status = 'inactive';
            await queryRunner.manager.save(product);
            
            await queryRunner.commitTransaction();
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error deleting product:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to delete product');
        } finally {
            await queryRunner.release();
        }
    },

    async bulkUpdateStatus(req: AuthRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { productIds, status } = req.body;
            
            // Fetch all products with lock
            const products = await queryRunner.manager.find(Product, {
                where: { id: In(productIds) },
                relations: ['supplier'],
                lock: { mode: "pessimistic_write" }
            });

            // Verify user has permission for all products
            for (const product of products) {
                if (req.user.companyId !== product.supplier_id && req.user.role !== 'admin') {
                    throw new AppError(403, 'Unauthorized to update one or more products');
                }
            }

            // Update all products
            await queryRunner.manager.update(Product, 
                { id: In(productIds) },
                { status, updated_at: new Date() }
            );
            
            await queryRunner.commitTransaction();
            res.json({ message: `Successfully updated ${products.length} products` });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error bulk updating products:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to bulk update products');
        } finally {
            await queryRunner.release();
        }
    }
};