import { Request, Response } from 'express';
import { AppDataSource } from '../../database/ormconfig';
import { ProductCategory } from '../../database/models/sql/product-category';
import { Company } from '../../database/models/sql/company';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../app';

interface AuthRequest extends Request {
    user: Express.User;
}

export const productCategoryController = {
    async listCategories(req: AuthRequest, res: Response) {
        try {
            const { page = 1, limit = 10, search } = req.query;
            
            const queryBuilder = AppDataSource.getRepository(ProductCategory)
                .createQueryBuilder('category')
                .leftJoinAndSelect('category.company', 'company');

            // Get user's company info
            const userCompanyId = req.user.companyId;
            const userRole = req.user.role;
            
            // Extract company ID from params for company-specific endpoint
            const companyIdParam = req.params.companyId || req.query.companyId as string;
            
            // Filter by company based on role
            if (userRole === 'supplier') {
                // Suppliers should only see their own categories
                queryBuilder.andWhere('category.company_id = :userCompanyId', { userCompanyId });
            } else if (userRole === 'dealer') {
                // Dealers should only see categories from active suppliers
                queryBuilder.innerJoin('company', 'comp', 'comp.id = category.company_id')
                    .andWhere('comp.status = :companyStatus', { companyStatus: 'active' });
            } else if (userRole === 'admin') {
                // Admin users should filter by company ID if provided in the request
                if (companyIdParam) {
                    queryBuilder.andWhere('category.company_id = :companyIdParam', { companyIdParam });
                }            } else {
                // All other roles should only see categories related to their company
                queryBuilder.andWhere('category.company_id = :userCompanyId', { userCompanyId });
            }

            // Add search functionality
            if (search) {
                queryBuilder.andWhere(
                    '(category.name ILIKE :search OR category.description ILIKE :search)',
                    { search: `%${search}%` }
                );
            }

            // Add sorting
            queryBuilder.orderBy('category.name', 'ASC');

            const [categories, total] = await queryBuilder
                .skip((+page - 1) * +limit)
                .take(+limit)
                .getManyAndCount();

            res.json({
                data: categories,
                pagination: {
                    total,
                    page: +page,
                    limit: +limit,
                    totalPages: Math.ceil(total / +limit)
                }
            });
        } catch (error) {
            logger.error('Error listing product categories:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to list product categories');
        }
    },

    async getCategory(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            // Get the company ID if it exists in the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            const category = await AppDataSource.getRepository(ProductCategory).findOne({ 
                where: { id },
                relations: ['company']
            });

            if (!category) {
                throw new AppError(404, 'Product category not found');
            }
            
            // Check access permissions based on role and company
            const userRole = req.user.role;
            const userCompanyId = req.user.companyId;
            
            // If accessing via company-specific route, verify the category belongs to that company
            if (companyId && category.company_id !== companyId) {
                throw new AppError(404, 'Product category not found in the specified company');
            }
            
            if (userRole === 'admin') {
                // Admin can access all categories or company-specific categories if companyId is provided
                if (companyId && category.company_id !== companyId) {
                    throw new AppError(404, 'Product category not found in the specified company');
                }
            } else if (userRole === 'supplier') {
                // Suppliers can only view their own categories
                if (category.company_id !== userCompanyId) {
                    throw new AppError(403, 'Access denied: You can only view your own product categories');
                }
            } else if (userRole === 'dealer') {
                // For dealers, verify the supplier is active before allowing access
                const supplierStatus = category.company?.status;
                if (supplierStatus !== 'active') {
                    throw new AppError(403, 'Access denied: Product category company is not active');
                }
            } else {
                // All other users can only view categories from their company
                if (category.company_id !== userCompanyId) {
                    throw new AppError(403, 'Access denied: Product category does not belong to your company');
                }
            }

            res.json({ data: category });
        } catch (error) {
            logger.error('Error fetching product category:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to fetch product category');
        }
    },

    async createCategory(req: AuthRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { name, description, parent_id } = req.body;
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId || req.body.company_id;
            
            // Verify company exists
            const company = await queryRunner.manager.findOne(Company, { 
                where: { id: companyId },
                lock: { mode: "pessimistic_read" }
            });

            if (!company) {
                throw new AppError(404, 'Company not found');
            }

            // Check if user has permission to create categories for this company
            if (req.user.companyId !== companyId && req.user.role !== 'admin') {
                throw new AppError(403, 'Unauthorized to create product categories for this company');
            }

            // If parent_id is provided, verify it exists and belongs to the same company
            if (parent_id) {
                const parentCategory = await queryRunner.manager.findOne(ProductCategory, { 
                    where: { id: parent_id },
                    lock: { mode: "pessimistic_read" }
                });
                
                if (!parentCategory) {
                    throw new AppError(404, 'Parent category not found');
                }
                
                if (parentCategory.company_id !== companyId) {
                    throw new AppError(400, 'Parent category must belong to the same company');
                }
            }

            const category = new ProductCategory();
            category.name = name;            category.description = description;
            category.company_id = companyId;
            category.parent_id = parent_id || null;

            const savedCategory = await queryRunner.manager.save(category);
            await queryRunner.commitTransaction();
            
            res.status(201).json({ data: savedCategory });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error creating product category:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to create product category');
        } finally {
            await queryRunner.release();
        }
    },

    async updateCategory(req: AuthRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { id } = req.params;
            const updates = req.body;
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            // Find category with lock for update
            const category = await queryRunner.manager.findOne(ProductCategory, { 
                where: { id },
                relations: ['company'],
                lock: { mode: "pessimistic_write" }
            });

            if (!category) {
                throw new AppError(404, 'Product category not found');
            }
            
            // If accessing via company-specific route, verify the category belongs to that company
            if (companyId && category.company_id !== companyId) {
                throw new AppError(404, 'Product category not found in the specified company');
            }

            // Check authorization
            if (req.user.companyId !== category.company_id && req.user.role !== 'admin') {
                throw new AppError(403, 'Unauthorized to update this product category');
            }

            // Don't allow changing the company_id
            if (updates.company_id && updates.company_id !== category.company_id) {
                throw new AppError(400, 'Cannot change the company of a product category');
            }

            // If parent_id is being updated, verify new parent exists and belongs to the same company
            if (updates.parent_id && updates.parent_id !== category.parent_id) {
                // Prevent circular references
                if (updates.parent_id === id) {
                    throw new AppError(400, 'A category cannot be its own parent');
                }
                
                const parentCategory = await queryRunner.manager.findOne(ProductCategory, { 
                    where: { id: updates.parent_id }
                });
                
                if (!parentCategory) {
                    throw new AppError(404, 'Parent category not found');
                }
                
                if (parentCategory.company_id !== category.company_id) {
                    throw new AppError(400, 'Parent category must belong to the same company');
                }
            }

            // Update category
            Object.assign(category, updates);
            const updatedCategory = await queryRunner.manager.save(ProductCategory, category);
            
            await queryRunner.commitTransaction();
            res.json({ data: updatedCategory });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error updating product category:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to update product category');
        } finally {
            await queryRunner.release();
        }
    },

    async deleteCategory(req: AuthRequest, res: Response) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { id } = req.params;
            
            // Get the company ID from the path params (for company-specific route)
            const companyId = req.params.companyId;
            
            const category = await queryRunner.manager.findOne(ProductCategory, { 
                where: { id },
                relations: ['company'],
                lock: { mode: "pessimistic_write" }
            });

            if (!category) {
                throw new AppError(404, 'Product category not found');
            }
            
            // If accessing via company-specific route, verify the category belongs to that company
            if (companyId && category.company_id !== companyId) {
                throw new AppError(404, 'Product category not found in the specified company');
            }

            // Check authorization
            if (req.user.companyId !== category.company_id && req.user.role !== 'admin') {
                throw new AppError(403, 'Unauthorized to delete this product category');
            }

            // Check if there are any child categories
            const childCount = await queryRunner.manager.count(ProductCategory, { 
                where: { parent_id: id }
            });
            
            if (childCount > 0) {
                throw new AppError(400, 'Cannot delete category with child categories. Please delete child categories first.');
            }            // Hard delete the category
            await queryRunner.manager.remove(category);
            
            await queryRunner.commitTransaction();
            res.status(200).json({ message: 'Product category deleted successfully' });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error deleting product category:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to delete product category');
        } finally {
            await queryRunner.release();
        }
    }
};
