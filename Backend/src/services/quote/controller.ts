import { Request, Response } from 'express';
import { AppDataSource } from '../../database';
import { Quote, QuoteItem, QuoteStatus } from '../../database/models/sql/quote';
import { Product } from '../../database/models/sql/product';
import { AppError } from '../../middleware/errorHandler';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '../../database/models/sql/order';
import { In } from 'typeorm';

interface QuoteItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    notes?: string;
}

// Helper function to generate unique quote number
function generateQuoteNumber(): string {
    const prefix = 'QT';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${random}`;
}

export const quoteController = {
    async createQuote(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { items, validUntil, deliveryAddress, notes, metadata } = req.body;
        const customerId = req.user.id;
        const createdById = req.user.id;

        // Check if database connection is initialized
        if (!AppDataSource.isInitialized) {
            throw new AppError(500, 'Database connection is not initialized');
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate products
            const productIds = items.map((item: QuoteItemRequest) => item.productId);
            const products = await queryRunner.manager.find(Product, {
                where: { id: In(productIds) }
            });

            if (products.length !== productIds.length) {
                throw new AppError(400, 'One or more products not found');
            }

            // Create quote and items
            const quote = new Quote();
            quote.customerId = customerId;
            quote.createdById = createdById;
            quote.quoteNumber = generateQuoteNumber();
            quote.status = QuoteStatus.DRAFT;
            quote.totalAmount = 0; // Will calculate below
            
            if (validUntil) {
                quote.validUntil = new Date(validUntil);
            } else {
                // Default to 30 days validity
                const defaultValidUntil = new Date();
                defaultValidUntil.setDate(defaultValidUntil.getDate() + 30);
                quote.validUntil = defaultValidUntil;
            }
            
            if (notes) {
                quote.notes = notes;
            }
            
            if (metadata) {
                quote.metadata = metadata;
            }

            // Save quote first to get ID
            await queryRunner.manager.save(Quote, quote);

            // Create quote items
            const quoteItems: QuoteItem[] = [];
            let totalAmount = 0;            for (const item of items as QuoteItemRequest[]) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    throw new AppError(400, `Product ${item.productId} not found`);
                }

                const quoteItem = new QuoteItem();
                quoteItem.quoteId = quote.id;
                quoteItem.productId = item.productId;
                quoteItem.quantity = item.quantity;
                quoteItem.unitPrice = item.unitPrice;
                quoteItem.discount = item.discount || 0;
                quoteItem.notes = item.notes || ''; // Use empty string instead of null

                // Calculate item total
                const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
                totalAmount += itemTotal;

                quoteItems.push(quoteItem);
            }

            // Update quote total amount
            quote.totalAmount = totalAmount;
            await queryRunner.manager.save(Quote, quote);
            
            // Save all quote items
            await queryRunner.manager.save(QuoteItem, quoteItems);

            await queryRunner.commitTransaction();

            // Return the created quote with items
            const createdQuote = await AppDataSource.getRepository(Quote)
                .createQueryBuilder('quote')
                .leftJoinAndSelect('quote.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('quote.id = :id', { id: quote.id })
                .getOne();

            res.status(201).json({
                success: true,
                data: createdQuote
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async getAllQuotes(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;

        const skip = (page - 1) * limit;

        const queryBuilder = AppDataSource.getRepository(Quote)
            .createQueryBuilder('quote')
            .leftJoinAndSelect('quote.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .orderBy('quote.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        // Apply filters
        if (status) {
            queryBuilder.andWhere('quote.status = :status', { status });
        }

        // If not admin, only show user's own quotes
        if (req.user.role !== 'admin') {
            queryBuilder.andWhere('quote.customerId = :customerId', { customerId: req.user.id });
        }

        const [quotes, total] = await queryBuilder.getManyAndCount();

        res.status(200).json({
            success: true,
            data: quotes,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    },

    async getQuoteById(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;

        const quote = await AppDataSource.getRepository(Quote)
            .createQueryBuilder('quote')
            .leftJoinAndSelect('quote.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .where('quote.id = :id', { id })
            .getOne();

        if (!quote) {
            throw new AppError(404, 'Quote not found');
        }

        // Make sure the user is authorized to view this quote
        if (req.user.role !== 'admin' && quote.customerId !== req.user.id) {
            throw new AppError(403, 'Not authorized to access this quote');
        }

        res.status(200).json({
            success: true,
            data: quote
        });
    },

    async updateQuote(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;
        const { status, validUntil, deliveryAddress, notes, items, metadata } = req.body;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Find the quote
            const quote = await queryRunner.manager.findOne(Quote, {
                where: { id },
                relations: ['items']
            });

            if (!quote) {
                throw new AppError(404, 'Quote not found');
            }

            // Check authorization
            if (req.user.role !== 'admin' && quote.customerId !== req.user.id) {
                throw new AppError(403, 'Not authorized to update this quote');
            }

            // Check if quote can be updated
            if ([QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED, QuoteStatus.CONVERTED].includes(quote.status)) {
                throw new AppError(400, `Quote with status ${quote.status} cannot be updated`);
            }

            // Update fields if provided
            if (status) quote.status = status;
            if (validUntil) quote.validUntil = new Date(validUntil);
            if (notes !== undefined) quote.notes = notes;
            if (metadata) quote.metadata = {...quote.metadata, ...metadata};

            // Update items if provided
            if (items) {
                // Delete existing items
                await queryRunner.manager.delete(QuoteItem, { quoteId: quote.id });
                
                // Validate products
                const productIds = items.map((item: QuoteItemRequest) => item.productId);
                const products = await queryRunner.manager.find(Product, {
                    where: { id: In(productIds) }
                });

                if (products.length !== productIds.length) {
                    throw new AppError(400, 'One or more products not found');
                }

                // Create new items
                const quoteItems: QuoteItem[] = [];
                let totalAmount = 0;

                for (const item of items) {                    const quoteItem = new QuoteItem();
                    quoteItem.quoteId = quote.id;
                    quoteItem.productId = item.productId;
                    quoteItem.quantity = item.quantity;
                    quoteItem.unitPrice = item.unitPrice;
                    quoteItem.discount = item.discount || 0;
                    quoteItem.notes = item.notes || ''; // Use empty string instead of null

                    // Calculate item total
                    const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
                    totalAmount += itemTotal;

                    quoteItems.push(quoteItem);
                }

                // Update quote total amount
                quote.totalAmount = totalAmount;
                
                // Save all quote items
                await queryRunner.manager.save(QuoteItem, quoteItems);
            }

            // Save the updated quote
            await queryRunner.manager.save(Quote, quote);

            await queryRunner.commitTransaction();

            // Fetch updated quote with relations
            const updatedQuote = await AppDataSource.getRepository(Quote)
                .createQueryBuilder('quote')
                .leftJoinAndSelect('quote.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('quote.id = :id', { id })
                .getOne();

            res.status(200).json({
                success: true,
                data: updatedQuote
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async deleteQuote(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;

        const quote = await AppDataSource.getRepository(Quote).findOne({
            where: { id }
        });

        if (!quote) {
            throw new AppError(404, 'Quote not found');
        }

        // Check authorization
        if (req.user.role !== 'admin' && quote.customerId !== req.user.id) {
            throw new AppError(403, 'Not authorized to delete this quote');
        }

        // Check if quote can be deleted
        if ([QuoteStatus.ACCEPTED, QuoteStatus.CONVERTED].includes(quote.status)) {
            throw new AppError(400, `Quote with status ${quote.status} cannot be deleted`);
        }

        await AppDataSource.getRepository(Quote).remove(quote);

        res.status(200).json({
            success: true,
            message: 'Quote deleted successfully'
        });
    },

    async convertToOrder(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { id } = req.params;
        const { paymentMethod, deliveryAddress, metadata } = req.body;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Find the quote with items
            const quote = await queryRunner.manager.findOne(Quote, {
                where: { id },
                relations: ['items', 'items.product']
            });

            if (!quote) {
                throw new AppError(404, 'Quote not found');
            }

            // Check authorization
            if (req.user.role !== 'admin' && quote.customerId !== req.user.id) {
                throw new AppError(403, 'Not authorized to convert this quote');
            }

            // Check if quote can be converted
            if (quote.status !== QuoteStatus.ACCEPTED) {
                throw new AppError(400, 'Only accepted quotes can be converted to orders');
            }

            // Check if quote is still valid
            if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
                throw new AppError(400, 'Quote has expired');
            }

            // Create order
            const order = new Order();
            order.companyId = quote.customerId;
            order.status = OrderStatus.PENDING;
            order.paymentStatus = PaymentStatus.PENDING;
            order.paymentMethod = paymentMethod;
            order.totalAmount = quote.totalAmount
            order.metadata = {
                ...metadata,
                convertedFromQuote: quote.id,
                quoteNumber: quote.quoteNumber
            };

            await queryRunner.manager.save(Order, order);

            // Create order items
            const orderItems: OrderItem[] = [];

            for (const quoteItem of quote.items) {
                const orderItem = new OrderItem();
                orderItem.orderId = order.id;
                orderItem.productId = quoteItem.productId;
                orderItem.quantity = quoteItem.quantity;
                orderItem.unitPrice = quoteItem.unitPrice;
                orderItem.discount = quoteItem.discount;
                orderItem.metadata = { quoteItemId: quoteItem.id };

                orderItems.push(orderItem);
            }

            await queryRunner.manager.save(OrderItem, orderItems);

            // Update quote status
            quote.status = QuoteStatus.CONVERTED;
            quote.metadata = {
                ...quote.metadata,
                convertedToOrder: order.id,
                convertedAt: new Date()
            };

            await queryRunner.manager.save(Quote, quote);

            await queryRunner.commitTransaction();

            // Fetch the created order with relations
            const createdOrder = await AppDataSource.getRepository(Order)
                .createQueryBuilder('order')
                .leftJoinAndSelect('order.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('order.id = :id', { id: order.id })
                .getOne();

            res.status(201).json({
                success: true,
                data: createdOrder,
                message: 'Quote successfully converted to order'
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
};
