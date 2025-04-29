import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Product } from '../../database/models/sql/product';
import { Company } from '../../database/models/sql/company';
import { AppError } from '../../middleware/errorHandler';

interface AuthRequest extends Request {
    user: Express.User;
}

export const productController = {
    async createProduct(req: AuthRequest, res: Response) {
        const { name, description, base_price, unit, supplier_id, status } = req.body;
        const productRepo = getRepository(Product);
        const companyRepo = getRepository(Company);

        // Verify supplier exists and is of type 'supplier'
        const supplier = await companyRepo.findOne({ 
            where: { id: supplier_id, type: 'supplier' }
        });

        if (!supplier) {
            throw new AppError(404, 'Supplier not found');
        }

        const product = new Product();
        product.name = name;
        product.description = description;
        product.base_price = base_price;
        product.unit = unit;
        product.supplier_id = supplier_id;
        product.status = status || 'active';

        const savedProduct = await productRepo.save(product);
        res.status(201).json(savedProduct);
    },

    async updateProduct(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const updates = req.body;
        const productRepo = getRepository(Product);

        // Check if product exists
        const product = await productRepo.findOne({ 
            where: { id },
            relations: ['supplier']
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // If supplier_id is being updated, verify new supplier exists
        if (updates.supplier_id && updates.supplier_id !== product.supplier_id) {
            const companyRepo = getRepository(Company);
            const supplier = await companyRepo.findOne({ 
                where: { id: updates.supplier_id, type: 'supplier' }
            });

            if (!supplier) {
                throw new AppError(404, 'New supplier not found');
            }
        }

        // Update product
        Object.assign(product, updates);
        const updatedProduct = await productRepo.save(product);
        res.json(updatedProduct);
    },

    async getProduct(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const productRepo = getRepository(Product);

        const product = await productRepo.findOne({ 
            where: { id },
            relations: ['supplier']
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        res.json(product);
    },

    async listProducts(req: AuthRequest, res: Response) {
        const { supplier_id, status, page = 1, limit = 10 } = req.query;
        const productRepo = getRepository(Product);

        const queryBuilder = productRepo.createQueryBuilder('product')
            .leftJoinAndSelect('product.supplier', 'supplier');

        if (supplier_id) {
            queryBuilder.andWhere('product.supplier_id = :supplier_id', { supplier_id });
        }

        if (status) {
            queryBuilder.andWhere('product.status = :status', { status });
        }

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
    },

    async deleteProduct(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const productRepo = getRepository(Product);

        const product = await productRepo.findOne({ where: { id } });
        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // Soft delete by updating status
        product.status = 'inactive';
        await productRepo.save(product);

        res.status(200).json({ message: 'Product deleted successfully' });
    }
};