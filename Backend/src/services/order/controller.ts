import { Request, Response } from 'express';
import { OrderItem, OrderStatus, PaymentStatus } from '../../database/models/sql/order';
import { Product } from '../../database/models/sql/product';
import { Inventory } from '../../database/models/sql/inventory';
import { OrderHistory } from '../../database/models/sql/orderHistory';
import { AppError } from '../../middleware/errorHandler';
import { AppDataSource } from '../../database';
import { Order } from '../../database/models/sql/order';
import { In } from 'typeorm';
import { logger } from '../../app';

interface OrderItemRequest {
    productId: string;
    quantity: number;
    discount?: number;
}

interface OrderProcessError extends Error {
    message: string;
}

async function createOrderHistoryEntry(
    order: Order,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
    userId: string,
    notes?: string,
    metadata?: Record<string, any>,
    queryRunner = AppDataSource.createQueryRunner()
) {
    const historyEntry = new OrderHistory();
    historyEntry.order_id = order.id;
    historyEntry.user_id = userId;
    historyEntry.previous_status = previousStatus;
    historyEntry.new_status = newStatus;
    historyEntry.notes = notes || '';
    historyEntry.metadata = metadata || {};
    
    await queryRunner.manager.save(OrderHistory, historyEntry);
}

export const orderController = {
    async createOrder(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only company admin or manager can create orders
        if (!["admin", "manager"].includes(req.user.role)) {
            throw new AppError(403, 'Only company admin or manager can create orders');
        }
        const { items, deliveryAddress, paymentMethod } = req.body;
        const companyId = req.user.companyId;

        // Check if database connection is initialized
        if (!AppDataSource.isInitialized) {
            throw new AppError(500, 'Database connection is not initialized');
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();        try {
            // Validate products and calculate total
            const productIds = items.map((item: OrderItemRequest) => item.productId);
            
            // Build product query with dealer context
            const productQueryBuilder = AppDataSource.getRepository(Product)
                .createQueryBuilder('product')
                .whereInIds(productIds);
            
            // For dealers, only allow products they have in their catalog
            if (req.user.role === 'dealer') {
                productQueryBuilder.andWhere('product.dealer_id = :dealerId', { dealerId: companyId });
            } else if (req.user.role === 'supplier') {
                productQueryBuilder.andWhere('product.supplier_id = :supplierId', { supplierId: companyId });
            } else if (["admin", "manager"].includes(req.user.role)) {
                // Company admin/manager can only create orders for their own company
                productQueryBuilder.andWhere('(product.company_id = :companyId)', { companyId });
            } else {
                throw new AppError(403, 'Access denied: Invalid role for creating orders');
            }
            // Admin can access all products, no additional filter needed
            
            const products = await productQueryBuilder.getMany();

            if (products.length !== productIds.length) {
                throw new AppError(400, 'One or more products not found or not accessible');
            }

            // Check inventory and create order items
            const orderItems: OrderItem[] = [];
            let totalAmount = 0;

            // Fetch all inventory records for these products at once
            const inventoryRecords = await AppDataSource.getRepository(Inventory)
                .createQueryBuilder('inventory')
                .where('inventory.productId IN (:...productIds)', { productIds })
                .getMany();

            const inventoryMap = inventoryRecords.reduce((map, inv) => {
                map[inv.product_id] = inv;
                return map;
            }, {} as Record<string, Inventory>);

            for (const item of items as OrderItemRequest[]) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    throw new AppError(400, `Product ${item.productId} not found`);
                }
                
                // Check inventory
                const inventory = inventoryMap[item.productId];
                
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
            }            // Create order
            const order = new Order();
            order.customerId = companyId; // Use customerId for backward compatibility
            order.companyId = companyId; // Also set companyId for the new schema
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

    async updateOrder(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only company admin or manager can update orders
        if (!["admin", "manager"].includes(req.user.role)) {
            throw new AppError(403, 'Only company admin or manager can update orders');
        }
        
        const { id } = req.params;
        const updates = req.body;
        const companyId = req.user.companyId;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();        try {
            // Try to find by either companyId or customerId for backward compatibility
            const order = await queryRunner.manager.findOne(Order, {
                where: [
                    { id, companyId }, // Try with companyId
                    { id, customerId: companyId } // Try with customerId
                ],
                relations: ['items'],
                lock: { mode: "pessimistic_write" }
            });

            if (!order) {
                throw new AppError(404, 'Order not found');
            }

            const previousStatus = order.status;

            // Validate status transition
            if (updates.status && !isValidStatusTransition(order.status, updates.status)) {
                throw new AppError(400, `Invalid status transition from ${order.status} to ${updates.status}`);
            }

            // If changing to processing, verify stock availability again
            if (updates.status === OrderStatus.PROCESSING) {
                for (const item of order.items) {
                    const inventory = await queryRunner.manager.findOne(Inventory, {
                        where: { product_id: item.productId }
                    });
                    
                    if (!inventory || inventory.quantity < item.quantity) {
                        throw new AppError(400, `Insufficient stock for product in order item ${item.id}`);
                    }
                }
            }

            // If cancelling, restore inventory
            if (updates.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
                for (const item of order.items) {
                    await queryRunner.manager.update(Inventory,
                        { productId: item.productId },
                        { quantity: () => `quantity + ${item.quantity}` }
                    );
                }
            }

            // Update order fields
            if (updates.status) order.status = updates.status;
            if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus;
            if (updates.paymentMethod) order.paymentMethod = updates.paymentMethod;
            if (updates.deliveryAddress) order.deliveryAddress = updates.deliveryAddress;

            // Add metadata for tracking changes
            if (!order.metadata) order.metadata = {};
            order.metadata.lastUpdated = new Date();
            order.metadata.updatedBy = req.user.id;

            const updatedOrder = await queryRunner.manager.save(Order, order);

            // Create history entry if status changed
            if (updates.status && previousStatus !== updates.status) {
                await createOrderHistoryEntry(
                    order,
                    previousStatus,
                    updates.status,
                    req.user.id,
                    updates.notes,
                    {
                        updatedVia: 'manual',
                        paymentStatus: updates.paymentStatus,
                        updatedAt: new Date()
                    },
                    queryRunner
                );
            }

            await queryRunner.commitTransaction();
            res.json(updatedOrder);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to update order');
        } finally {
            await queryRunner.release();
        }
    },    async getOrder(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { id } = req.params;
        const userRole = req.user.role;
        const userCompanyId = req.user.companyId;
        
        // Support both routes: the general route and the company-specific route
        // For company-specific route, get companyId from params
        const targetCompanyId = req.params.companyId || null;

        // First, get the order without filters to check permissions
        const order = await AppDataSource.getRepository(Order).findOne({
            where: { id },
            relations: ['items', 'items.product']
        });

        if (!order) {
            throw new AppError(404, 'Order not found');
        }

        // Check access permissions based on role
        if (userRole === 'dealer' && order.companyId !== userCompanyId) {
            // Dealers can only view their own orders
            throw new AppError(403, 'Access denied: You can only view your company\'s orders');
        } else if (userRole === 'supplier') {
            // Suppliers can only view orders that contain their products
            const hasSupplierProducts = order.items.some(item => 
                item.product && item.product.supplier_id === userCompanyId
            );
            
            if (!hasSupplierProducts) {
                throw new AppError(403, 'Access denied: This order does not contain your products');
            }
        } else if (["admin", "manager", "staff"].includes(userRole)) {
            if (order.companyId !== userCompanyId) {
                throw new AppError(403, 'Access denied: You can only view your company\'s orders');
            }
        } else {
            throw new AppError(403, 'Access denied: Invalid role');
        }

        res.json(order);
    },    async listOrders(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const userRole = req.user.role;
        const userCompanyId = req.user.companyId;
        const { status, page = 1, limit = 10 } = req.query;
        
        // Support both routes: the general route and the company-specific route
        // For company-specific route, get companyId from params
        const targetCompanyId = req.params.companyId || userCompanyId;

        const queryBuilder = AppDataSource.getRepository(Order)
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('items.product', 'product');        // Apply appropriate filter based on user role and route
        if (userRole === 'dealer') {
            // Dealers should see only their own orders
            if (targetCompanyId !== userCompanyId) {
                throw new AppError(403, 'Access denied: You can only view your company\'s orders');
            }
            // Use explicit UUID cast for Postgres
            queryBuilder.where('(order.customerId = CAST(:companyId AS uuid) OR order.companyId = CAST(:companyId AS uuid))', { companyId: targetCompanyId });
        } else if (userRole === 'supplier') {
            queryBuilder.innerJoin(
                'product',
                'p',
                'p.id = items.productId AND p.supplier_id = :supplierId',
                { supplierId: userCompanyId }
            );
            if (req.params.companyId) {
                queryBuilder.andWhere('(order.customerId = CAST(:targetCompanyId AS uuid) OR order.companyId = CAST(:targetCompanyId AS uuid))', { targetCompanyId });
            }
        } else if (["admin", "manager", "staff"].includes(userRole)) {
            if (targetCompanyId !== userCompanyId) {
                throw new AppError(403, 'Access denied: You can only view your company\'s orders');
            }
            queryBuilder.where('(order.customerId = CAST(:companyId AS uuid) OR order.companyId = CAST(:companyId AS uuid))', { companyId: targetCompanyId });
        } else {
            throw new AppError(403, 'Access denied: Invalid role');
        }

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

    async cancelOrder(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only company admin or manager can cancel orders
        if (!["admin", "manager"].includes(req.user.role)) {
            throw new AppError(403, 'Only company admin or manager can cancel orders');
        }
        
        const { id } = req.params;
        const companyId = req.user.companyId;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();        try {
            // Try to find by either companyId or customerId for backward compatibility
            const order = await queryRunner.manager.findOne(Order, {
                where: [
                    { id, companyId }, // Try with companyId
                    { id, customerId: companyId } // Try with customerId
                ],
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
    },

    async bulkProcessOrders(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only company admin or manager can bulk process orders
        if (!["admin", "manager"].includes(req.user.role)) {
            throw new AppError(403, 'Only company admin or manager can bulk process orders');
        }
        
        const { orderIds, status, notes } = req.body;
        const companyId = req.user.companyId;
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();        try {
            // Find orders matching any of the IDs and either the companyId or customerId
            const orders = await queryRunner.manager.createQueryBuilder(Order, 'order')
                .leftJoinAndSelect('order.items', 'items')
                .where('order.id IN (:...orderIds)', { orderIds })
                .andWhere('(order.companyId = :companyId OR order.customerId = :companyId)', { companyId })
                .setLock('pessimistic_write')
                .getMany();

            if (orders.length !== orderIds.length) {
                throw new AppError(404, 'One or more orders not found');
            }

            const processedOrders: string[] = [];
            const failedOrders: Array<{ id: string; reason: string }> = [];

            // Process all orders
            for (const order of orders) {
                try {
                    if (!isValidStatusTransition(order.status, status)) {
                        throw new Error(`Invalid status transition from ${order.status} to ${status}`);
                    }

                    const previousStatus = order.status;

                    // Handle inventory updates
                    if (status === OrderStatus.PROCESSING) {
                        for (const item of order.items) {
                            const inventory = await queryRunner.manager.findOne(Inventory, {
                                where: { product_id: item.productId }
                            });
                            
                            if (!inventory || inventory.quantity < item.quantity) {
                                throw new Error(`Insufficient stock for product in order ${order.id}`);
                            }

                            await queryRunner.manager.update(Inventory,
                                { product_id: item.productId },
                                { quantity: () => `quantity - ${item.quantity}` }
                            );
                        }
                    } else if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
                        for (const item of order.items) {
                            await queryRunner.manager.update(Inventory,
                                { product_id: item.productId },
                                { quantity: () => `quantity + ${item.quantity}` }
                            );
                        }
                    }

                    // Update order
                    order.status = status;
                    if (!order.metadata) order.metadata = {};
                    order.metadata.lastUpdated = new Date();
                    order.metadata.updatedBy = req.user.id;
                    order.metadata.bulkProcessed = true;
                    await queryRunner.manager.save(order);

                    // Create history entry
                    await createOrderHistoryEntry(
                        order,
                        previousStatus,
                        status,
                        req.user.id,
                        notes,
                        {
                            updatedVia: 'bulk',
                            bulkProcessId: new Date().getTime(),
                            updatedAt: new Date()
                        },
                        queryRunner
                    );

                    processedOrders.push(order.id);
                } catch (error) {
                    const orderError = error as OrderProcessError;
                    failedOrders.push({
                        id: order.id,
                        reason: orderError.message || 'Unknown error occurred'
                    });
                }
            }

            if (processedOrders.length === 0) {
                // Modified to use the correct AppError constructor signature
                const errorMessage = 'No orders could be processed: ' + 
                    failedOrders.map(f => `Order ${f.id}: ${f.reason}`).join('; ');
                throw new AppError(400, errorMessage);
            }

            await queryRunner.commitTransaction();
            res.json({
                message: `Successfully processed ${processedOrders.length} orders`,
                processedOrders,
                failedOrders: failedOrders.length > 0 ? failedOrders : undefined
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Error processing orders:', error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'Failed to process orders');
        } finally {
            await queryRunner.release();
        }
    },

    async getOrderHistory(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { id } = req.params;
        const companyId = req.user.companyId;        // Verify order ownership - check both companyId and customerId for backward compatibility
        const order = await AppDataSource.getRepository(Order).findOne({
            where: [
                { id, companyId },
                { id, customerId: companyId }
            ]
        });

        if (!order) {
            throw new AppError(404, 'Order not found');
        }

        // Get order history
        const history = await AppDataSource.getRepository(OrderHistory).find({
            where: { order_id: id },
            relations: ['user'],
            order: { created_at: 'DESC' }
        });

        // Format response
        const formattedHistory = history.map(entry => ({
            id: entry.id,
            timestamp: entry.created_at,
            previousStatus: entry.previous_status,
            newStatus: entry.new_status,
            notes: entry.notes,
            user: {
                id: entry.user.id,
                email: entry.user.email
            },
            metadata: entry.metadata
        }));

        res.json({
            orderId: id,
            history: formattedHistory
        });
    }
};

// Helper function to validate order status transitions
function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
}