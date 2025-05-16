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
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            // If companyId is provided in the route, use it instead of the body's supplier_id
            const effectiveSupplierID = companyId || supplier_id;
            
            // Verify supplier exists and is of type 'supplier'
            const supplier = await queryRunner.manager.findOne(Company, { 
                where: { id: effectiveSupplierID, type: 'supplier' },
                lock: { mode: "pessimistic_read" }
            });

            if (!supplier) {
                throw new AppError(404, 'Supplier not found');
            }

            // Check if user has permission to create products for this supplier
            if (req.user.companyId !== effectiveSupplierID && req.user.role !== 'admin') {
                throw new AppError(403, 'Unauthorized to create products for this supplier');
            }            const product = new Product();
            product.name = name;
            product.description = description;
            product.base_price = base_price;
            product.unit = unit;
            product.supplier_id = effectiveSupplierID;
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
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            // Find product with lock for update
            const product = await queryRunner.manager.findOne(Product, { 
                where: { id },
                relations: ['supplier'],
                lock: { mode: "pessimistic_write" }
            });

            if (!product) {
                throw new AppError(404, 'Product not found');
            }
            
            // If accessing via company-specific route, verify the product belongs to that company
            if (companyId && product.supplier_id !== companyId) {
                throw new AppError(404, 'Product not found in the specified company');
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
                
                // If using company-specific route, the supplier must match the route's company ID
                if (companyId && updates.supplier_id !== companyId) {
                    throw new AppError(403, 'Cannot change product to a different company when using company-specific route');
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
    },    async getProduct(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            // Get the company ID if it exists in the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            const product = await AppDataSource.getRepository(Product).findOne({ 
                where: { id },
                relations: ['supplier']
            });

            if (!product) {
                throw new AppError(404, 'Product not found');
            }
            
            // Check access permissions based on role and company
            const userRole = req.user.role;
            const userCompanyId = req.user.companyId;
            
            // If accessing via company-specific route, verify the product belongs to that company
            if (companyId && product.supplier_id !== companyId) {
                throw new AppError(404, 'Product not found in the specified company');
            }
            
            if (userRole === 'admin') {
                // Admin can access all products or company-specific products if companyId is provided
                if (companyId && product.supplier_id !== companyId) {
                    throw new AppError(404, 'Product not found in the specified company');
                }
            } else if (userRole === 'supplier') {
                // Suppliers can only view their own products
                if (product.supplier_id !== userCompanyId) {
                    throw new AppError(403, 'Access denied: You can only view your own products');
                }
            } else if (userRole === 'dealer') {
                // For dealers, verify the supplier is active before allowing access
                const supplierStatus = product.supplier?.status;
                if (supplierStatus !== 'active') {
                    throw new AppError(403, 'Access denied: Product supplier is not active');
                }
            } else {
                // All other users can only view products from their company
                if (product.supplier_id !== userCompanyId) {
                    throw new AppError(403, 'Access denied: Product does not belong to your company');
                }
            }

            res.json(product);
        } catch (error) {
            logger.error('Error fetching product:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to fetch product');
        }
    },async listProducts(req: AuthRequest, res: Response) {
        try {
            const { supplier_id, status, page = 1, limit = 10, search } = req.query;
            
            const queryBuilder = AppDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.supplier', 'supplier');

            // Get user's company info
            const userCompanyId = req.user.companyId;
            const userRole = req.user.role;
            const userCompanyType = req.user.companyType;
            
            // Extract company ID from params or query if present for company-specific endpoint
            const companyIdParam = req.params.companyId || req.query.companyId;
            
            // Filter by company based on role
            if (userRole === 'supplier') {
                // Suppliers should only see their own products
                queryBuilder.andWhere('product.supplier_id = :userCompanyId', { userCompanyId });
            } else if (userRole === 'dealer') {
                // Dealers should only see products from active suppliers
                queryBuilder.innerJoin('supplier', 'company', 'company.id = product.supplier_id')
                    .andWhere('company.status = :companyStatus', { companyStatus: 'active' });
            } else if (userRole === 'admin') {
                // Admin users should filter by company ID if provided in the request
                if (companyIdParam) {
                    queryBuilder.andWhere('product.supplier_id = :companyIdParam', { companyIdParam });
                }
                // If supplier_id filter is provided, add that filter
                if (supplier_id) {
                    queryBuilder.andWhere('product.supplier_id = :supplier_id', { supplier_id });
                }
            } else {
                // All other roles should only see products related to their company
                queryBuilder.andWhere('product.supplier_id = :userCompanyId', { userCompanyId });
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
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            const product = await queryRunner.manager.findOne(Product, { 
                where: { id },
                relations: ['supplier'],
                lock: { mode: "pessimistic_write" }
            });

            if (!product) {
                throw new AppError(404, 'Product not found');
            }
            
            // If accessing via company-specific route, verify the product belongs to that company
            if (companyId && product.supplier_id !== companyId) {
                throw new AppError(404, 'Product not found in the specified company');
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
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            // Build the where condition for finding products
            let whereCondition: any = { id: In(productIds) };
            
            // If company-specific route, add company filter
            if (companyId) {
                whereCondition.supplier_id = companyId;
            }
            
            // Fetch all products with lock
            const products = await queryRunner.manager.find(Product, {
                where: whereCondition,
                relations: ['supplier'],
                lock: { mode: "pessimistic_write" }
            });
            
            // Verify we found all the requested products
            if (products.length !== productIds.length) {
                throw new AppError(404, 'One or more products not found or not accessible in this company');
            }

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
