import { Request, Response } from 'express';
import { AppDataSource } from '../../database/ormconfig';
import { Product, ProductPriceHistory } from '../../database/models/sql';
import { Company } from '../../database/models/sql/company';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../app';
import { In } from 'typeorm';
import { AuthenticatedRequest } from '../../types/express';

export const productController = {
    async createProduct(req: AuthenticatedRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();        try {
            const { name, description, base_price, unit, supplier_id, category_id, status } = req.body;
            
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
            }            // Check if user has permission to create products for this supplier
            if (req.user.role === 'admin') {
                // Admin can create products for any supplier
            } else if (req.user.role === 'supplier' && req.user.companyId === effectiveSupplierID) {
                // Suppliers can create products for themselves
            } else if (req.user.role === 'dealer') {
                // Dealers can create products for any active supplier
                if (supplier.status !== 'active') {
                    throw new AppError(403, 'Cannot create products for inactive suppliers');
                }
            } else {
                throw new AppError(403, 'Unauthorized to create products for this supplier');
            }            const product = new Product();
            product.name = name;
            product.description = description;
            product.base_price = base_price;
            product.unit = unit;
            product.supplier_id = effectiveSupplierID;
            product.category_id = category_id || null; // Set the category_id
            product.dealer_id = req.user.companyId; // Add the dealer who created this product
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

    async updateProduct(req: AuthenticatedRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { id } = req.params;
            const updates = req.body;
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId;
              // Find product with lock for update (without relations to avoid lock conflicts)
            const product = await queryRunner.manager.findOne(Product, { 
                where: { id },
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
            }            // Update product with version check
            const oldPrice = product.base_price;
            Object.assign(product, updates);
              // If price has changed, create a price history record
            if (updates.base_price && updates.base_price !== oldPrice) {
                const priceHistory = new ProductPriceHistory();
                priceHistory.product_id = product.id;
                priceHistory.old_price = oldPrice;
                priceHistory.new_price = updates.base_price;
                priceHistory.changed_by_id = req.user.id;
                priceHistory.reason = updates.priceChangeReason || 'Price update';
                priceHistory.metadata = {
                    updated_via: 'api'
                };
                
                await queryRunner.manager.save(ProductPriceHistory, priceHistory);
            }
            
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
    },    async getProduct(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            // Get the company ID if it exists in the path params (for company-specific route)
            const companyId = req.params.companyId;
              const product = await AppDataSource.getRepository(Product).findOne({ 
                where: { id },
                relations: ['supplier', 'category']
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
        }    },async listProducts(req: AuthenticatedRequest, res: Response) {
        try {
            const { supplier_id, status, page = 1, limit = 10, search } = req.query;            const queryBuilder = AppDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.supplier', 'supplier')
                .leftJoinAndSelect('product.category', 'category');

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
                if (companyIdParam) {
                    // When dealer is accessing products from a specific company (supplier), 
                    // show original supplier products, not dealer products
                    queryBuilder.andWhere('product.supplier_id = :companyIdParam', { companyIdParam });
                    // Also ensure suppliers are active
                    queryBuilder.innerJoin('supplier', 'company', 'company.id = product.supplier_id')
                        .andWhere('company.status = :companyStatus', { companyStatus: 'active' });
                } else {
                    // Show products added by this dealer to their catalog
                    queryBuilder.andWhere('product.dealer_id = :userCompanyId', { userCompanyId });
                    // Also ensure suppliers are active
                    queryBuilder.innerJoin('supplier', 'company', 'company.id = product.supplier_id')
                        .andWhere('company.status = :companyStatus', { companyStatus: 'active' });
                }
            } else if (userRole === 'admin') {
                // Admin users should treat like dealers when viewing dealer company products
                console.log('Admin user accessing dealer company products');                if (companyIdParam) {
                    // Check if the companyIdParam is a supplier or dealer by checking the URL context
                    // If accessing /products/company/{id}, we want to show that company's products
                    const companyEntity = await AppDataSource.getRepository(Company).findOne({
                        where: { id: companyIdParam as string }
                    });
                    
                    if (companyEntity?.type === 'supplier') {
                        // Show supplier's original products
                        queryBuilder.andWhere('product.supplier_id = :companyIdParam', { companyIdParam });
                    } else {
                        // Show dealer's catalog products
                        queryBuilder.andWhere('product.dealer_id = :companyIdParam', { companyIdParam });
                    }
                } else {
                    console.log('Filtering by dealer_id =', userCompanyId);
                    queryBuilder.andWhere('product.dealer_id = :userCompanyId', { userCompanyId });
                }
                // Ensure suppliers are active (using existing supplier join)
                queryBuilder.andWhere('supplier.status = :companyStatus', { companyStatus: 'active' });
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
            }            // Add sorting
            queryBuilder.orderBy('product.created_at', 'DESC');

            // First get products with count for pagination
            const [products, total] = await queryBuilder
                .skip((+page - 1) * +limit)
                .take(+limit)
                .getManyAndCount();

            // Then get inventory data for these specific products
            const productIds = products.map(p => p.id);
            
            if (productIds.length > 0) {
                const inventoryData = await AppDataSource.query(`
                    SELECT product_id, COALESCE(SUM(quantity), 0) as total_stock
                    FROM inventory
                    WHERE product_id = ANY($1)
                    GROUP BY product_id
                `, [productIds]);

                // Create a map for quick lookup
                const inventoryMap = new Map();
                inventoryData.forEach((item: any) => {
                    inventoryMap.set(item.product_id, parseInt(item.total_stock));
                });

                // Add inventory data to products
                const productsWithInventory = products.map(product => ({
                    ...product,
                    inventory: {
                        quantity: inventoryMap.get(product.id) || 0
                    }
                }));

                res.json({
                    products: productsWithInventory,
                    pagination: {
                        total,
                        page: +page,
                        limit: +limit,
                        totalPages: Math.ceil(total / +limit)
                    }
                });
            } else {
                res.json({
                    products: [],
                    pagination: {
                        total: 0,
                        page: +page,
                        limit: +limit,
                        totalPages: 0
                    }
                });
            }
        } catch (error) {
            logger.error('Error listing products:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to list products');
        }
    },

    async deleteProduct(req: AuthenticatedRequest, res: Response) {
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

    async bulkUpdateStatus(req: AuthenticatedRequest, res: Response) {
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
            throw new AppError(500, 'Failed to bulk update products');        } finally {
            await queryRunner.release();
        }
    },

    async getPriceHistory(req: AuthenticatedRequest, res: Response) {
        try {
            const { companyId, productId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            // Security check: ensure user has access to this company's data
            if (!req.user) {
                throw new AppError(401, 'Authentication required');
            }
            
            // For now, let's allow access if user belongs to the company or is an admin
            if (req.user.role !== 'admin' && req.user.companyId !== companyId) {
                throw new AppError(403, 'Unauthorized access to company data');
            }
            
            // Verify the product exists and belongs to the company
            const product = await AppDataSource.getRepository(Product).findOne({
                where: { 
                    id: productId,
                    supplier_id: companyId 
                }
            });
            
            if (!product) {
                throw new AppError(404, 'Product not found');
            }
            
            const priceHistoryRepository = AppDataSource.getRepository(ProductPriceHistory);
            
            // Calculate pagination
            const pageNum = parseInt(page as string, 10) || 1;
            const limitNum = parseInt(limit as string, 10) || 10;
            const skip = (pageNum - 1) * limitNum;
              // Get price history with pagination
            const [priceHistory, total] = await priceHistoryRepository.findAndCount({
                where: { product_id: productId },
                relations: ['user'],
                order: { created_at: 'DESC' },
                skip,
                take: limitNum
            });
            
            res.json({
                data: priceHistory,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            logger.error('Error fetching price history:', error);
            if (error instanceof AppError) {
                throw error;
            }            throw new AppError(500, 'Failed to fetch price history');
        }
    },

    async createPriceHistoryEntry(req: AuthenticatedRequest, res: Response) {
        try {
            const { companyId, productId } = req.params;
            const { old_price, new_price, reason } = req.body;
            
            // Security check
            if (!req.user) {
                throw new AppError(401, 'Authentication required');
            }
            
            if (req.user.role !== 'admin' && req.user.companyId !== companyId) {
                throw new AppError(403, 'Unauthorized access to company data');
            }
            
            // Verify the product exists
            const product = await AppDataSource.getRepository(Product).findOne({
                where: { 
                    id: productId,
                    supplier_id: companyId 
                }
            });
            
            if (!product) {
                throw new AppError(404, 'Product not found');
            }
              const priceHistory = new ProductPriceHistory();
            priceHistory.product_id = productId;
            priceHistory.old_price = old_price;
            priceHistory.new_price = new_price;
            priceHistory.changed_by_id = req.user.id;
            priceHistory.reason = reason || 'Manual price history entry';
            priceHistory.metadata = {
                created_via: 'api'
            };
            
            const savedHistory = await AppDataSource.getRepository(ProductPriceHistory).save(priceHistory);
            
            res.status(201).json(savedHistory);
        } catch (error) {
            logger.error('Error creating price history entry:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to create price history entry');
        }
    }
};
