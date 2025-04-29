import { Request, Response } from 'express';
import { getRepository, getConnection } from 'typeorm';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '../../database/models/sql/order';
import { Product } from '../../database/models/sql/product';
import { Inventory } from '../../database/models/sql/inventory';
import { AppError } from '../../middleware/errorHandler';

// Extend Express Request type to include authenticated user
interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        companyId: string;
    };
}

interface OrderItemRequest {
    productId: string;
    quantity: number;
    discount?: number;
}

export const orderController = {
    async createOrder(req: AuthRequest, res: Response) {
        const { items, deliveryAddress, paymentMethod } = req.body;
        const customerId = req.user.id;

        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate products and calculate total
            const productIds = items.map((item: OrderItemRequest) => item.productId);
            const products = await getRepository(Product)
                .createQueryBuilder('product')
                .whereInIds(productIds)
                .getMany();

            if (products.length !== productIds.length) {
                throw new AppError(400, 'One or more products not found');
            }

            // Check inventory and create order items
            const orderItems: OrderItem[] = [];
            let totalAmount = 0;

            for (const item of items as OrderItemRequest[]) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    throw new AppError(400, `Product ${item.productId} not found`);
                }
                
                // Check inventory
                const inventory = await getRepository(Inventory)
                    .createQueryBuilder('inventory')
                    .where('productId = :productId', { productId: item.productId })
                    .getOne();

                if (!inventory || inventory.quantity < item.quantity) {
                    throw new AppError(400, `Insufficient stock for product ${product.name}`);
                }

                // Create order item
                const orderItem = new OrderItem();
                orderItem.productId = item.productId;
                orderItem.quantity = item.quantity;
                orderItem.unitPrice = product.base_price;
                orderItem.discount = item.discount || 0;
                
                orderItems.push(orderItem);
                totalAmount += (orderItem.unitPrice - orderItem.discount) * orderItem.quantity;

                // Update inventory
                await queryRunner.manager.update(Inventory, 
                    { productId: item.productId },
                    { quantity: () => `quantity - ${item.quantity}` }
                );
            }

            // Create order
            const order = new Order();
            order.customerId = customerId;
            order.status = OrderStatus.PENDING;
            order.paymentStatus = PaymentStatus.PENDING;
            order.paymentMethod = paymentMethod;
            order.totalAmount = totalAmount;
            order.deliveryAddress = deliveryAddress;
            order.items = orderItems;

            const savedOrder = await queryRunner.manager.save(Order, order);
            await queryRunner.commitTransaction();

            res.status(201).json(savedOrder);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async updateOrder(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const updates = req.body;
        const customerId = req.user.id;

        const order = await getRepository(Order).findOne({
            where: { id, customerId },
            relations: ['items']
        });

        if (!order) {
            throw new AppError(404, 'Order not found');
        }

        // Update order status
        if (updates.status) {
            order.status = updates.status;
        }

        if (updates.paymentStatus) {
            order.paymentStatus = updates.paymentStatus;
        }

        if (updates.paymentMethod) {
            order.paymentMethod = updates.paymentMethod;
        }

        if (updates.deliveryAddress) {
            order.deliveryAddress = updates.deliveryAddress;
        }

        const updatedOrder = await getRepository(Order).save(order);
        res.json(updatedOrder);
    },

    async getOrder(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const customerId = req.user.id;

        const order = await getRepository(Order).findOne({
            where: { id, customerId },
            relations: ['items', 'items.product']
        });

        if (!order) {
            throw new AppError(404, 'Order not found');
        }

        res.json(order);
    },

    async listOrders(req: AuthRequest, res: Response) {
        const customerId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        const queryBuilder = getRepository(Order)
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .where('order.customerId = :customerId', { customerId });

        if (status) {
            queryBuilder.andWhere('order.status = :status', { status });
        }

        const [orders, total] = await queryBuilder
            .skip((+page - 1) * +limit)
            .take(+limit)
            .getManyAndCount();

        res.json({
            orders,
            pagination: {
                total,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(total / +limit)
            }
        });
    },

    async cancelOrder(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const customerId = req.user.id;

        const queryRunner = getConnection().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const order = await queryRunner.manager.findOne(Order, {
                where: { id, customerId },
                relations: ['items']
            });

            if (!order) {
                throw new AppError(404, 'Order not found');
            }

            if (order.status !== OrderStatus.PENDING) {
                throw new AppError(400, 'Only pending orders can be cancelled');
            }

            // Restore inventory
            for (const item of order.items) {
                await queryRunner.manager.update(Inventory,
                    { productId: item.productId },
                    { quantity: () => `quantity + ${item.quantity}` }
                );
            }

            order.status = OrderStatus.CANCELLED;
            const updatedOrder = await queryRunner.manager.save(Order, order);
            
            await queryRunner.commitTransaction();
            res.json(updatedOrder);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
};