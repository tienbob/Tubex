import { Request, Response } from 'express';
import { Payment, PaymentReconciliationStatus } from '../../database/models/sql/payment';
import { Invoice, InvoiceStatus } from '../../database/models/sql/invoice';
import { Order, PaymentStatus as OrderPaymentStatus } from '../../database/models/sql/order';
import { AppError } from '../../middleware/errorHandler';
import { AppDataSource } from '../../database';
import { Between, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { logger } from '../../app';

export const paymentController = {
    async createPayment(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only users with company access can create payments
        
        const { 
            transactionId,
            orderId,
            invoiceId,
            customerId,
            amount,
            paymentMethod,
            paymentType,
            paymentDate,
            externalReferenceId,
            notes,
            metadata
        } = req.body;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
          try {
            // CRITICAL FIX: Determine company context for multi-tenant security
            let companyId: string;
            
            // Get company context from order or invoice
            if (orderId) {
                const order = await queryRunner.manager.findOne(Order, { where: { id: orderId } });
                if (!order) {
                    throw new AppError(404, 'Order not found');
                }
                // SECURITY: Verify user has access to this order's company
                if (req.user.companyId !== order.companyId) {
                    throw new AppError(403, 'Unauthorized access to order');
                }
                companyId = order.companyId;
            } else if (invoiceId) {
                const invoice = await queryRunner.manager.findOne(Invoice, { 
                    where: { id: invoiceId },
                    relations: ['createdBy']
                });
                if (!invoice) {
                    throw new AppError(404, 'Invoice not found');
                }
                // SECURITY: Verify user has access to this invoice's company
                if (req.user.companyId !== invoice.createdBy.company_id) {
                    throw new AppError(403, 'Unauthorized access to invoice');
                }
                companyId = invoice.createdBy.company_id;
            } else {
                // If no order or invoice, use user's company
                companyId = req.user.companyId;
            }

            // Create payment record
            const payment = new Payment();
            payment.transactionId = transactionId;
            payment.orderId = orderId;
            payment.invoiceId = invoiceId;
            payment.customerId = customerId;
            payment.companyId = companyId; // CRITICAL FIX: Add company context
            payment.amount = amount;
            payment.paymentMethod = paymentMethod;
            payment.paymentType = paymentType;
            payment.paymentDate = new Date(paymentDate);
            payment.externalReferenceId = externalReferenceId;
            payment.notes = notes;
            payment.metadata = metadata;
            payment.recordedById = req.user.id;
            
            // Save payment
            const savedPayment = await queryRunner.manager.save(Payment, payment);
            
            // If payment is for an order, update order payment status
            if (orderId) {
                const order = await queryRunner.manager.findOne(Order, { where: { id: orderId } });
                if (!order) {
                    throw new AppError(404, 'Order not found');
                }
                
                // Get total payments for this order
                const totalPayments = await queryRunner.manager
                    .createQueryBuilder(Payment, 'payment')
                    .where('payment.orderId = :orderId', { orderId })
                    .select('SUM(payment.amount)', 'total')
                    .getRawOne();
                    
                const totalPaid = parseFloat(totalPayments?.total || '0') + amount;
                
                // Update order payment status
                if (totalPaid >= order.totalAmount) {
                    order.paymentStatus = OrderPaymentStatus.PAID;
                } else if (totalPaid > 0) {
                    order.paymentStatus = OrderPaymentStatus.PENDING; // Partially paid
                    // You might want to add a PARTIALLY_PAID status in the Order model
                }
                
                await queryRunner.manager.save(Order, order);
            }
            
            // If payment is for an invoice, update invoice status
            if (invoiceId) {
                const invoice = await queryRunner.manager.findOne(Invoice, { where: { id: invoiceId } });
                if (!invoice) {
                    throw new AppError(404, 'Invoice not found');
                }
                
                // Update paid amount
                invoice.paidAmount = (invoice.paidAmount || 0) + amount;
                
                // Update invoice status
                if (invoice.paidAmount >= invoice.totalAmount) {
                    invoice.status = InvoiceStatus.PAID;
                } else if (invoice.paidAmount > 0) {
                    invoice.status = InvoiceStatus.PARTIALLY_PAID;
                }
                
                await queryRunner.manager.save(Invoice, invoice);
            }
            
            await queryRunner.commitTransaction();
            
            res.status(201).json({
                success: true,
                data: savedPayment
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Failed to create payment', { error });
            throw error;
        } finally {
            await queryRunner.release();
        }
    },
      async getPayments(req: Request, res: Response) {
        const { 
            orderId, 
            invoiceId, 
            customerId, 
            startDate, 
            endDate, 
            paymentMethod,
            reconciliationStatus
        } = req.query;
        
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
          try {
            // SECURITY: Ensure user is authenticated
            if (!req.user) {
                throw new AppError(401, 'Authentication required');
            }
            
            const whereClause: FindOptionsWhere<Payment> = {};
            
            // CRITICAL FIX: Always filter by company for multi-tenant security
            whereClause.companyId = req.user.companyId;
            
            if (orderId) whereClause.orderId = orderId as string;
            if (invoiceId) whereClause.invoiceId = invoiceId as string;
            if (customerId) whereClause.customerId = customerId as string;
            if (paymentMethod) whereClause.paymentMethod = paymentMethod as any;
            if (reconciliationStatus) whereClause.reconciliationStatus = reconciliationStatus as any;
            
            // Handle date range filtering
            if (startDate && endDate) {
                whereClause.paymentDate = Between(
                    new Date(startDate as string),
                    new Date(endDate as string)
                );
            } else if (startDate) {
                whereClause.paymentDate = MoreThanOrEqual(new Date(startDate as string));
            } else if (endDate) {
                whereClause.paymentDate = LessThanOrEqual(new Date(endDate as string));
            }
            
            // Query with pagination
            const [payments, totalCount] = await AppDataSource.getRepository(Payment).findAndCount({
                where: whereClause,
                relations: ['order', 'invoice', 'recordedBy', 'reconciledBy'],
                skip,
                take: limit,
                order: {
                    paymentDate: 'DESC',
                    createdAt: 'DESC'
                }
            });
            
            res.status(200).json({
                success: true,
                data: payments,
                pagination: {
                    page,
                    limit,
                    totalItems: totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            });
        } catch (error) {
            logger.error('Failed to fetch payments', { error });
            throw error;
        }
    },
      async getPaymentById(req: Request, res: Response) {
        const { id } = req.params;
        
        try {
            // SECURITY: Ensure user is authenticated
            if (!req.user) {
                throw new AppError(401, 'Authentication required');
            }
            
            const payment = await AppDataSource.getRepository(Payment).findOne({
                where: { 
                    id,
                    companyId: req.user.companyId // CRITICAL FIX: Filter by company for security
                },
                relations: ['order', 'invoice', 'recordedBy', 'reconciledBy']
            });
            
            if (!payment) {
                throw new AppError(404, 'Payment not found or access denied');
            }
            
            res.status(200).json({
                success: true,
                data: payment
            });
        } catch (error) {
            logger.error('Failed to fetch payment', { error, id: req.params.id });
            throw error;
        }
    },
    
    async updatePayment(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only company admin or payment creator can update
        
        const { id } = req.params;
        const updateData = req.body;
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            const payment = await queryRunner.manager.findOne(Payment, { 
                where: { id },
                relations: ['order', 'invoice']
            });
            
            if (!payment) {
                throw new AppError(404, 'Payment not found');
            }
            
            // Check if user is admin of the company or the creator of the payment
            if (!(req.user.role === 'admin' && req.user.companyId === payment.companyId) && req.user.id !== payment.recordedById) {
                throw new AppError(403, 'Only company admin or payment creator can update payment');
            }
            
            // Handle order payment status updates if amount or orderId changes
            if ((updateData.amount && updateData.amount !== payment.amount) || 
                (updateData.orderId && updateData.orderId !== payment.orderId)) {
                
                // Handle old order updates if there was one
                if (payment.orderId) {
                    const oldOrder = await queryRunner.manager.findOne(Order, { where: { id: payment.orderId } });
                    if (oldOrder) {
                        const oldOrderPayments = await queryRunner.manager
                            .createQueryBuilder(Payment, 'payment')
                            .where('payment.orderId = :orderId AND payment.id != :paymentId', { 
                                orderId: payment.orderId,
                                paymentId: payment.id
                            })
                            .select('SUM(payment.amount)', 'total')
                            .getRawOne();
                        
                        const oldOrderTotalPaid = parseFloat(oldOrderPayments?.total || '0');
                        
                        if (oldOrderTotalPaid >= oldOrder.totalAmount) {
                            oldOrder.paymentStatus = OrderPaymentStatus.PAID;
                        } else if (oldOrderTotalPaid > 0) {
                            oldOrder.paymentStatus = OrderPaymentStatus.PENDING;
                        } else {
                            oldOrder.paymentStatus = OrderPaymentStatus.PENDING;
                        }
                        
                        await queryRunner.manager.save(Order, oldOrder);
                    }
                }
                
                // Handle new order updates
                if (updateData.orderId) {
                    const newOrder = await queryRunner.manager.findOne(Order, { where: { id: updateData.orderId } });
                    if (!newOrder) {
                        throw new AppError(404, 'New order not found');
                    }
                    
                    const newOrderPayments = await queryRunner.manager
                        .createQueryBuilder(Payment, 'payment')
                        .where('payment.orderId = :orderId AND payment.id != :paymentId', { 
                            orderId: updateData.orderId,
                            paymentId: payment.id
                        })
                        .select('SUM(payment.amount)', 'total')
                        .getRawOne();
                    
                    const newAmount = updateData.amount || payment.amount;
                    const newOrderTotalPaid = parseFloat(newOrderPayments?.total || '0') + newAmount;
                    
                    if (newOrderTotalPaid >= newOrder.totalAmount) {
                        newOrder.paymentStatus = OrderPaymentStatus.PAID;
                    } else if (newOrderTotalPaid > 0) {
                        newOrder.paymentStatus = OrderPaymentStatus.PENDING;
                    }
                    
                    await queryRunner.manager.save(Order, newOrder);
                }
            }
            
            // Handle invoice status updates if amount or invoiceId changes
            if ((updateData.amount && updateData.amount !== payment.amount) || 
                (updateData.invoiceId && updateData.invoiceId !== payment.invoiceId)) {
                
                // Handle old invoice updates if there was one
                if (payment.invoiceId) {
                    const oldInvoice = await queryRunner.manager.findOne(Invoice, { where: { id: payment.invoiceId } });
                    if (oldInvoice) {
                        const oldInvoicePayments = await queryRunner.manager
                            .createQueryBuilder(Payment, 'payment')
                            .where('payment.invoiceId = :invoiceId AND payment.id != :paymentId', { 
                                invoiceId: payment.invoiceId,
                                paymentId: payment.id
                            })
                            .select('SUM(payment.amount)', 'total')
                            .getRawOne();
                        
                        const oldInvoiceTotalPaid = parseFloat(oldInvoicePayments?.total || '0');
                        oldInvoice.paidAmount = oldInvoiceTotalPaid;
                        
                        if (oldInvoiceTotalPaid >= oldInvoice.totalAmount) {
                            oldInvoice.status = InvoiceStatus.PAID;
                        } else if (oldInvoiceTotalPaid > 0) {
                            oldInvoice.status = InvoiceStatus.PARTIALLY_PAID;
                        } else if (new Date() > oldInvoice.dueDate) {
                            oldInvoice.status = InvoiceStatus.OVERDUE;
                        } else {
                            oldInvoice.status = InvoiceStatus.SENT;
                        }
                        
                        await queryRunner.manager.save(Invoice, oldInvoice);
                    }
                }
                
                // Handle new invoice updates
                if (updateData.invoiceId) {
                    const newInvoice = await queryRunner.manager.findOne(Invoice, { where: { id: updateData.invoiceId } });
                    if (!newInvoice) {
                        throw new AppError(404, 'New invoice not found');
                    }
                    
                    const newInvoicePayments = await queryRunner.manager
                        .createQueryBuilder(Payment, 'payment')
                        .where('payment.invoiceId = :invoiceId AND payment.id != :paymentId', { 
                            invoiceId: updateData.invoiceId,
                            paymentId: payment.id
                        })
                        .select('SUM(payment.amount)', 'total')
                        .getRawOne();
                    
                    const newAmount = updateData.amount || payment.amount;
                    const newInvoiceTotalPaid = parseFloat(newInvoicePayments?.total || '0') + newAmount;
                    
                    newInvoice.paidAmount = newInvoiceTotalPaid;
                    
                    if (newInvoiceTotalPaid >= newInvoice.totalAmount) {
                        newInvoice.status = InvoiceStatus.PAID;
                    } else if (newInvoiceTotalPaid > 0) {
                        newInvoice.status = InvoiceStatus.PARTIALLY_PAID;
                    }
                    
                    await queryRunner.manager.save(Invoice, newInvoice);
                }
            }
            
            // Update payment record
            Object.assign(payment, updateData);
            
            // Save updated payment
            const updatedPayment = await queryRunner.manager.save(Payment, payment);
            await queryRunner.commitTransaction();
            
            res.status(200).json({
                success: true,
                data: updatedPayment
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Failed to update payment', { error, id: req.params.id });
            throw error;
        } finally {
            await queryRunner.release();
        }
    },
    
    async deletePayment(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only company admin or payment creator can delete
        
        const { id } = req.params;
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        
        try {
            const payment = await queryRunner.manager.findOne(Payment, { 
                where: { id },
                relations: ['order', 'invoice']
            });
            
            if (!payment) {
                throw new AppError(404, 'Payment not found');
            }
            
            // Check if user is admin of the company or the creator of the payment
            if (!(req.user.role === 'admin' && req.user.companyId === payment.companyId) && req.user.id !== payment.recordedById) {
                throw new AppError(403, 'Only company admin or payment creator can delete payment');
            }
            
            // Handle order payment status updates
            if (payment.orderId) {
                const order = await queryRunner.manager.findOne(Order, { where: { id: payment.orderId } });
                if (order) {
                    // Get total payments for this order
                    const totalPayments = await queryRunner.manager
                        .createQueryBuilder(Payment, 'payment')
                        .where('payment.orderId = :orderId', { orderId: payment.orderId })
                        .select('SUM(payment.amount)', 'total')
                        .getRawOne();
                        
                    const totalPaid = parseFloat(totalPayments?.total || '0');
                    
                    // Update order payment status
                    if (totalPaid >= order.totalAmount) {
                        order.paymentStatus = OrderPaymentStatus.PAID;
                    } else if (totalPaid > 0) {
                        order.paymentStatus = OrderPaymentStatus.PENDING; // Partially paid
                    } else {
                        order.paymentStatus = OrderPaymentStatus.PENDING;
                    }
                    
                    await queryRunner.manager.save(Order, order);
                }
            }
            
            // Handle invoice status updates
            if (payment.invoiceId) {
                const invoice = await queryRunner.manager.findOne(Invoice, { where: { id: payment.invoiceId } });
                if (invoice) {
                    // Get total payments for this invoice
                    const totalPayments = await queryRunner.manager
                        .createQueryBuilder(Payment, 'payment')
                        .where('payment.invoiceId = :invoiceId', { invoiceId: payment.invoiceId })
                        .select('SUM(payment.amount)', 'total')
                        .getRawOne();
                        
                    const totalPaid = parseFloat(totalPayments?.total || '0');
                    invoice.paidAmount = totalPaid;
                    
                    // Update invoice status
                    if (totalPaid >= invoice.totalAmount) {
                        invoice.status = InvoiceStatus.PAID;
                    } else if (totalPaid > 0) {
                        invoice.status = InvoiceStatus.PARTIALLY_PAID;
                    } else {
                        invoice.status = InvoiceStatus.SENT; // Or set to OVERDUE based on your logic
                    }
                    
                    await queryRunner.manager.save(Invoice, invoice);
                }
            }
            
            // Delete payment record
            await queryRunner.manager.delete(Payment, { id });
            
            await queryRunner.commitTransaction();
            
            res.status(204).send();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Failed to delete payment', { error, id: req.params.id });
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async reconcilePayment(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        // Only company admin or manager can reconcile payments
        if (!["admin", "manager"].includes(req.user.role)) {
            throw new AppError(403, 'Only company admin or manager can reconcile payments');
        }
        const { id } = req.params;
        const { reconciliationStatus, notes } = req.body;
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const payment = await queryRunner.manager.findOne(Payment, {
                where: { id, companyId: req.user.companyId },
                relations: ['order', 'invoice', 'recordedBy', 'reconciledBy']
            });
            if (!payment) {
                throw new AppError(404, 'Payment not found or access denied');
            }
            payment.reconciliationStatus = reconciliationStatus;
            payment.reconciledById = req.user.id;
            payment.notes = notes;
            payment.reconciliationDate = new Date();
            const updatedPayment = await queryRunner.manager.save(Payment, payment);
            await queryRunner.commitTransaction();
            res.status(200).json({ success: true, data: updatedPayment });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('Failed to reconcile payment', { error, id });
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

};
