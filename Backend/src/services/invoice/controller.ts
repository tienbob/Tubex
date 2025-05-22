import { Request, Response } from 'express';
import { AppDataSource } from '../../database';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentTerm } from '../../database/models/sql/invoice';
import { Product } from '../../database/models/sql/product';
import { Order, OrderStatus } from '../../database/models/sql/order';
import { Company } from '../../database/models/sql/company';
import { User } from '../../database/models/sql/user';
import { AppError } from '../../middleware/errorHandler';
import { In } from 'typeorm';
import { logger } from '../../app';
import { PdfGenerationService } from './pdf-generation.service';
import fs from 'fs';

interface InvoiceItemRequest {
    productId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
    notes?: string;
}

// Helper function to generate unique invoice number
function generateInvoiceNumber(): string {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${random}`;
}

// Helper to calculate invoice due date based on payment term
function calculateDueDate(issueDate: Date, paymentTerm: PaymentTerm): Date {
    const dueDate = new Date(issueDate);
    
    switch (paymentTerm) {
        case PaymentTerm.IMMEDIATE:
            return dueDate;
        case PaymentTerm.DAYS_7:
            dueDate.setDate(dueDate.getDate() + 7);
            return dueDate;
        case PaymentTerm.DAYS_15:
            dueDate.setDate(dueDate.getDate() + 15);
            return dueDate;
        case PaymentTerm.DAYS_30:
            dueDate.setDate(dueDate.getDate() + 30);
            return dueDate;
        case PaymentTerm.DAYS_45:
            dueDate.setDate(dueDate.getDate() + 45);
            return dueDate;
        case PaymentTerm.DAYS_60:
            dueDate.setDate(dueDate.getDate() + 60);
            return dueDate;
        case PaymentTerm.DAYS_90:
            dueDate.setDate(dueDate.getDate() + 90);
            return dueDate;
        default:
            dueDate.setDate(dueDate.getDate() + 30);
            return dueDate;
    }
}

export const invoiceController = {
    async createInvoice(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { orderId, items, paymentTerm, issueDate, dueDate, billingAddress, notes, metadata } = req.body;
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
            // If orderId is provided, verify it exists and belongs to user
            let order;
            if (orderId) {
                order = await queryRunner.manager.findOne(Order, { 
                    where: { 
                        id: orderId,
                        companyId: customerId
                    }
                });

                if (!order) {
                    throw new AppError(404, 'Order not found or does not belong to the current user');
                }

                // Check if order is valid for invoice creation
                if (order.status === OrderStatus.CANCELLED) {
                    throw new AppError(400, 'Cannot create invoice for cancelled order');
                }
            }

            // Validate products
            const productIds = items.map((item: InvoiceItemRequest) => item.productId);
            const products = await queryRunner.manager.find(Product, {
                where: { id: In(productIds) }
            });

            if (products.length !== productIds.length) {
                throw new AppError(400, 'One or more products not found');
            }

            // Create invoice
            const invoice = new Invoice();
            invoice.invoiceNumber = generateInvoiceNumber();
            invoice.customerId = customerId;
            invoice.createdById = createdById;
            invoice.status = InvoiceStatus.DRAFT;
            invoice.totalAmount = 0; // Will calculate below
            invoice.paidAmount = 0;
            invoice.orderId = orderId || null;
            invoice.paymentTerm = paymentTerm || PaymentTerm.DAYS_30;
            
            // Set dates
            const issueDateObj = issueDate ? new Date(issueDate) : new Date();
            invoice.issueDate = issueDateObj;
            
            if (dueDate) {
                invoice.dueDate = new Date(dueDate);
            } else {
                invoice.dueDate = calculateDueDate(issueDateObj, invoice.paymentTerm);
            }
            
            invoice.billingAddress = billingAddress;
            
            if (notes) {
                invoice.notes = notes;
            }
            
            if (metadata) {
                invoice.metadata = metadata;
            }

            // Save invoice first to get ID
            await queryRunner.manager.save(Invoice, invoice);

            // Create invoice items
            const invoiceItems: InvoiceItem[] = [];
            let totalAmount = 0;

            for (const item of items as InvoiceItemRequest[]) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    throw new AppError(400, `Product ${item.productId} not found`);
                }

                const invoiceItem = new InvoiceItem();
                invoiceItem.invoiceId = invoice.id;
                invoiceItem.productId = item.productId;
                invoiceItem.description = item.description || product.name;
                invoiceItem.quantity = item.quantity;
                invoiceItem.unitPrice = item.unitPrice;
                invoiceItem.discount = item.discount || 0;
                invoiceItem.tax = item.tax || 0;
                invoiceItem.notes = item.notes || '';

                // Calculate item total including tax
                const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0);
                totalAmount += itemTotal;

                invoiceItems.push(invoiceItem);
            }

            // Update invoice total amount
            invoice.totalAmount = totalAmount;
            await queryRunner.manager.save(Invoice, invoice);
            
            // Save all invoice items
            await queryRunner.manager.save(InvoiceItem, invoiceItems);

            await queryRunner.commitTransaction();

            // Return the created invoice with items
            const createdInvoice = await AppDataSource.getRepository(Invoice)
                .createQueryBuilder('invoice')
                .leftJoinAndSelect('invoice.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('invoice.id = :id', { id: invoice.id })
                .getOne();

            res.status(201).json({
                success: true,
                data: createdInvoice
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async getAllInvoices(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;
        const sortBy = req.query.sortBy as string || 'createdAt';
        const sortOrder = (req.query.sortOrder as string || 'desc').toUpperCase() as 'ASC' | 'DESC';
        
        // Get companyId from route params or user
        const targetCompanyId = req.params.companyId || req.user.id;
        const skip = (page - 1) * limit;

        const queryBuilder = AppDataSource.getRepository(Invoice)
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.items', 'items')
            .leftJoinAndSelect('items.product', 'product');
        
        // If companyId is provided, filter by it
        if (targetCompanyId) {
            queryBuilder.andWhere('invoice.customerId = :customerId', { customerId: targetCompanyId });
        } else if (req.user.role !== 'admin') {
            // If not admin and no company specified, show only user's invoices
            queryBuilder.andWhere('invoice.customerId = :customerId', { customerId: req.user.id });
        }

        // Apply sorting with validation
        const validSortFields = ['createdAt', 'updatedAt', 'issueDate', 'dueDate', 'totalAmount', 'invoiceNumber'];
        if (validSortFields.includes(sortBy)) {
            queryBuilder.orderBy(`invoice.${sortBy}`, sortOrder === 'ASC' ? 'ASC' : 'DESC');
        } else {
            queryBuilder.orderBy('invoice.createdAt', 'DESC'); // Default sorting
        }
        
        // Apply filters
        if (status) {
            queryBuilder.andWhere('invoice.status = :status', { status });
        }
        
        queryBuilder.skip(skip).take(limit);
        const [invoices, total] = await queryBuilder.getManyAndCount();

        res.status(200).json({
            success: true,
            data: invoices,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    },

    async getInvoiceById(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;

        const invoice = await AppDataSource.getRepository(Invoice)
            .createQueryBuilder('invoice')
            .leftJoinAndSelect('invoice.items', 'items')
            .leftJoinAndSelect('items.product', 'product')
            .where('invoice.id = :id', { id })
            .getOne();

        if (!invoice) {
            throw new AppError(404, 'Invoice not found');
        }

        // Make sure the user is authorized to view this invoice
        if (req.user.role !== 'admin' && invoice.customerId !== req.user.id) {
            throw new AppError(403, 'Not authorized to access this invoice');
        }

        // If invoice status is SENT and user is viewing it, update to VIEWED
        if (invoice.status === InvoiceStatus.SENT && invoice.customerId === req.user.id) {
            invoice.status = InvoiceStatus.VIEWED;
            await AppDataSource.getRepository(Invoice).save(invoice);
        }

        res.status(200).json({
            success: true,
            data: invoice
        });
    },

    async updateInvoice(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;
        const { status, paidAmount, paymentTerm, issueDate, dueDate, billingAddress, notes, items, metadata } = req.body;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Find the invoice
            const invoice = await queryRunner.manager.findOne(Invoice, {
                where: { id },
                relations: ['items']
            });

            if (!invoice) {
                throw new AppError(404, 'Invoice not found');
            }

            // Check authorization
            const isAdmin = req.user.role === 'admin';
            const isInvoiceOwner = invoice.customerId === req.user.id;
            const isInvoiceCreator = invoice.createdById === req.user.id;

            if (!isAdmin && !isInvoiceOwner && !isInvoiceCreator) {
                throw new AppError(403, 'Not authorized to update this invoice');
            }

            // Check if invoice can be updated
            if (invoice.status === InvoiceStatus.VOID && !isAdmin) {
                throw new AppError(400, 'Voided invoice cannot be updated');
            }

            // Update fields if provided
            if (status) {
                // Only admin or creator can change status (except for payment status updates)
                if (status !== InvoiceStatus.PAID && status !== InvoiceStatus.PARTIALLY_PAID && !isAdmin && !isInvoiceCreator) {
                    throw new AppError(403, 'Not authorized to change invoice status');
                }
                invoice.status = status;
            }
            
            // Handle payment amount updates
            if (paidAmount !== undefined) {
                // Anyone can update paid amount (e.g., customer making payment)
                invoice.paidAmount = paidAmount;
                
                // Update status based on payment
                if (paidAmount >= invoice.totalAmount) {
                    invoice.status = InvoiceStatus.PAID;
                } else if (paidAmount > 0) {
                    invoice.status = InvoiceStatus.PARTIALLY_PAID;
                }
            }
            
            // Only admin or creator can update these fields
            if (isAdmin || isInvoiceCreator) {
                if (paymentTerm) invoice.paymentTerm = paymentTerm;
                
                if (issueDate) {
                    invoice.issueDate = new Date(issueDate);
                    
                    // Recalculate due date if not explicitly provided
                    if (!dueDate) {
                        invoice.dueDate = calculateDueDate(invoice.issueDate, invoice.paymentTerm);
                    }
                }
                
                if (dueDate) invoice.dueDate = new Date(dueDate);
                if (billingAddress) invoice.billingAddress = billingAddress;
                
                // Update items if provided (only if invoice is still DRAFT)
                if (items && invoice.status === InvoiceStatus.DRAFT) {
                    // Delete existing items
                    await queryRunner.manager.delete(InvoiceItem, { invoiceId: invoice.id });
                    
                    // Validate products
                    const productIds = items.map((item: InvoiceItemRequest) => item.productId);
                    const products = await queryRunner.manager.find(Product, {
                        where: { id: In(productIds) }
                    });

                    if (products.length !== productIds.length) {
                        throw new AppError(400, 'One or more products not found');
                    }

                    // Create new items
                    const invoiceItems: InvoiceItem[] = [];
                    let totalAmount = 0;

                    for (const item of items) {
                        const product = products.find(p => p.id === item.productId);
                        if (!product) continue;
                        
                        const invoiceItem = new InvoiceItem();
                        invoiceItem.invoiceId = invoice.id;
                        invoiceItem.productId = item.productId;
                        invoiceItem.description = item.description || product.name;
                        invoiceItem.quantity = item.quantity;
                        invoiceItem.unitPrice = item.unitPrice;
                        invoiceItem.discount = item.discount || 0;
                        invoiceItem.tax = item.tax || 0;
                        invoiceItem.notes = item.notes || '';

                        // Calculate item total
                        const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0) + (item.tax || 0);
                        totalAmount += itemTotal;

                        invoiceItems.push(invoiceItem);
                    }

                    // Update invoice total amount
                    invoice.totalAmount = totalAmount;
                    
                    // Save all invoice items
                    await queryRunner.manager.save(InvoiceItem, invoiceItems);
                }
            }

            // Common fields anyone can update
            if (notes !== undefined) invoice.notes = notes;
            if (metadata) invoice.metadata = { ...invoice.metadata, ...metadata };

            // Save the updated invoice
            await queryRunner.manager.save(Invoice, invoice);

            await queryRunner.commitTransaction();

            // Fetch updated invoice with relations
            const updatedInvoice = await AppDataSource.getRepository(Invoice)
                .createQueryBuilder('invoice')
                .leftJoinAndSelect('invoice.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('invoice.id = :id', { id })
                .getOne();

            res.status(200).json({
                success: true,
                data: updatedInvoice
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async deleteInvoice(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        if (req.user.role !== 'admin') {
            throw new AppError(403, 'Only administrators can delete invoices');
        }

        const { id } = req.params;

        const invoice = await AppDataSource.getRepository(Invoice).findOne({
            where: { id }
        });

        if (!invoice) {
            throw new AppError(404, 'Invoice not found');
        }

        // Instead of deleting, void the invoice
        invoice.status = InvoiceStatus.VOID;
        invoice.metadata = {
            ...invoice.metadata,
            voidedBy: req.user.id,
            voidedAt: new Date(),
            voidReason: req.body.reason || 'Administrative action'
        };

        await AppDataSource.getRepository(Invoice).save(invoice);

        res.status(200).json({
            success: true,
            message: 'Invoice voided successfully'
        });
    },

    async createInvoiceFromOrder(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { id: orderId } = req.params;
        const { paymentTerm, issueDate, dueDate, billingAddress, notes, metadata } = req.body;
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if the order exists and get order details
            const order = await queryRunner.manager.findOne(Order, { 
                where: { id: orderId },
                relations: ['items', 'items.product']
            });

            if (!order) {
                throw new AppError(404, 'Order not found');
            }

            // Check authorization
            const isAdmin = req.user.role === 'admin';
            const isOrderOwner = order.companyId === req.user.id;
            
            if (!isAdmin && !isOrderOwner) {
                throw new AppError(403, 'Not authorized to create invoice for this order');
            }

            // Check if order is valid for invoice creation
            if (order.status === OrderStatus.CANCELLED) {
                throw new AppError(400, 'Cannot create invoice for cancelled order');
            }

            // Check if an invoice already exists for this order
            const existingInvoice = await queryRunner.manager.findOne(Invoice, { 
                where: { orderId }
            });

            if (existingInvoice) {
                throw new AppError(400, `Invoice #${existingInvoice.invoiceNumber} already exists for this order`);
            }

            // Create invoice
            const invoice = new Invoice();
            invoice.invoiceNumber = generateInvoiceNumber();
            invoice.customerId = order.companyId;
            invoice.createdById = req.user.id;
            invoice.status = InvoiceStatus.DRAFT;
            invoice.totalAmount = order.totalAmount;
            invoice.paidAmount = 0;
            invoice.orderId = orderId;
            invoice.paymentTerm = paymentTerm || PaymentTerm.DAYS_30;
            
            // Set dates
            const issueDateObj = issueDate ? new Date(issueDate) : new Date();
            invoice.issueDate = issueDateObj;
            
            if (dueDate) {
                invoice.dueDate = new Date(dueDate);
            } else {
                invoice.dueDate = calculateDueDate(issueDateObj, invoice.paymentTerm);
            }
            
            // Use billing address from request or fallback to order delivery address
            invoice.billingAddress = billingAddress || order.deliveryAddress;
            
            if (notes) {
                invoice.notes = notes;
            }
            
            if (metadata) {
                invoice.metadata = {
                    ...metadata,
                    createdFromOrder: orderId
                };
            } else {
                invoice.metadata = { createdFromOrder: orderId };
            }

            // Save invoice first to get ID
            await queryRunner.manager.save(Invoice, invoice);

            // Create invoice items from order items
            const invoiceItems: InvoiceItem[] = [];
            let totalAmount = 0;

            for (const orderItem of order.items) {
                const invoiceItem = new InvoiceItem();
                invoiceItem.invoiceId = invoice.id;
                invoiceItem.productId = orderItem.productId;
                invoiceItem.description = orderItem.product ? orderItem.product.name : `Product #${orderItem.productId.substring(0, 8)}`;
                invoiceItem.quantity = orderItem.quantity;
                invoiceItem.unitPrice = orderItem.unitPrice;
                invoiceItem.discount = orderItem.discount || 0;
                invoiceItem.tax = 0; // Default tax
                
                // Calculate item total
                const itemTotal = (orderItem.quantity * orderItem.unitPrice) - (orderItem.discount || 0);
                totalAmount += itemTotal;

                invoiceItems.push(invoiceItem);
            }

            // Update invoice total amount (in case it differs from order total)
            invoice.totalAmount = totalAmount;
            await queryRunner.manager.save(Invoice, invoice);
            
            // Save all invoice items
            await queryRunner.manager.save(InvoiceItem, invoiceItems);

            await queryRunner.commitTransaction();

            // Return the created invoice with items
            const createdInvoice = await AppDataSource.getRepository(Invoice)
                .createQueryBuilder('invoice')
                .leftJoinAndSelect('invoice.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('invoice.id = :id', { id: invoice.id })
                .getOne();

            res.status(201).json({
                success: true,
                data: createdInvoice
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async recordPayment(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;
        const { amount, paymentMethod, paymentDate, notes, metadata } = req.body;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Find the invoice
            const invoice = await queryRunner.manager.findOne(Invoice, {
                where: { id }
            });

            if (!invoice) {
                throw new AppError(404, 'Invoice not found');
            }

            // Check authorization
            const isAdmin = req.user.role === 'admin';
            const isInvoiceOwner = invoice.customerId === req.user.id;
            const isInvoiceCreator = invoice.createdById === req.user.id;

            if (!isAdmin && !isInvoiceOwner && !isInvoiceCreator) {
                throw new AppError(403, 'Not authorized to record payment for this invoice');
            }

            // Check if invoice can be paid
            if (invoice.status === InvoiceStatus.VOID) {
                throw new AppError(400, 'Cannot record payment for voided invoice');
            }

            if (invoice.status === InvoiceStatus.PAID) {
                throw new AppError(400, 'Invoice is already paid in full');
            }

            // Record payment
            const previousPaidAmount = invoice.paidAmount;
            invoice.paidAmount += amount;

            // Payment history in metadata
            if (!invoice.metadata) invoice.metadata = {};
            if (!invoice.metadata.payments) invoice.metadata.payments = [];
            
            invoice.metadata.payments.push({
                id: `payment_${Date.now()}`,
                amount,
                method: paymentMethod,
                date: paymentDate || new Date(),
                notes,
                recordedBy: req.user.id,
                recordedAt: new Date(),
                metadata
            });

            // Update status based on payment
            if (invoice.paidAmount >= invoice.totalAmount) {
                invoice.status = InvoiceStatus.PAID;
            } else {
                invoice.status = InvoiceStatus.PARTIALLY_PAID;
            }

            await queryRunner.manager.save(Invoice, invoice);
            await queryRunner.commitTransaction();

            res.status(200).json({
                success: true,
                data: {
                    invoice,
                    payment: {
                        amount,
                        previousPaidAmount,
                        newPaidAmount: invoice.paidAmount,
                        remaining: Math.max(0, invoice.totalAmount - invoice.paidAmount)
                    }
                },
                message: 'Payment recorded successfully'
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async generatePdf(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;

        try {
            // Find the invoice with items
            const invoice = await AppDataSource.getRepository(Invoice)
                .createQueryBuilder('invoice')
                .leftJoinAndSelect('invoice.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('invoice.id = :id', { id })
                .getOne();

            if (!invoice) {
                throw new AppError(404, 'Invoice not found');
            }

            // Check authorization
            const isAdmin = req.user.role === 'admin';
            const isInvoiceOwner = invoice.customerId === req.user.id;
            const isInvoiceCreator = invoice.createdById === req.user.id;

            if (!isAdmin && !isInvoiceOwner && !isInvoiceCreator) {
                throw new AppError(403, 'Not authorized to access this invoice');
            }            // Get company details from database
            const userRepository = AppDataSource.getRepository(User);
            const companyRepository = AppDataSource.getRepository(Company);
            
            // First try to get company ID from the invoice creator
            const creator = await userRepository.findOne({ 
                where: { id: invoice.createdById },
                relations: ['company']
            });
            
            if (!creator || !creator.company_id) {
                throw new AppError(404, 'Company information not found');
            }
            
            const company = await companyRepository.findOne({ where: { id: creator.company_id } });
            
            if (!company) {
                throw new AppError(404, 'Company information not found');
            }

            const companyDetails = {
                name: company.name,
                address: company.address,
                phone: company.contact_phone,
                email: company.metadata?.email || ''
            };

            // Generate PDF
            const pdfPath = await PdfGenerationService.generateInvoicePdf(invoice, invoice.items, companyDetails);

            // Set headers and send file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="invoice_${invoice.invoiceNumber}.pdf"`);
            
            // Stream the file
            const fileStream = fs.createReadStream(pdfPath);
            fileStream.pipe(res);
            
            // Clean up the file after sending
            fileStream.on('end', () => {
                fs.unlink(pdfPath, (err) => {
                    if (err) logger.error(`Failed to delete temporary PDF: ${err.message}`);
                });
            });

            // If invoice status is SENT and user is viewing it, update to VIEWED
            if (invoice.status === InvoiceStatus.SENT && invoice.customerId === req.user.id) {
                invoice.status = InvoiceStatus.VIEWED;
                await AppDataSource.getRepository(Invoice).save(invoice);
            }        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Failed to generate invoice PDF: ${errorMessage}`);
            throw new AppError(500, 'Failed to generate invoice PDF');
        }
    },

    async sendInvoice(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        
        const { id } = req.params;
        const { email, message } = req.body;

        try {
            // Find the invoice
            const invoice = await AppDataSource.getRepository(Invoice)
                .createQueryBuilder('invoice')
                .leftJoinAndSelect('invoice.items', 'items')
                .leftJoinAndSelect('items.product', 'product')
                .where('invoice.id = :id', { id })
                .getOne();

            if (!invoice) {
                throw new AppError(404, 'Invoice not found');
            }

            // Check authorization
            const isAdmin = req.user.role === 'admin';
            const isInvoiceCreator = invoice.createdById === req.user.id;

            if (!isAdmin && !isInvoiceCreator) {
                throw new AppError(403, 'Not authorized to send this invoice');
            }

            // Check if invoice is in a sendable state
            if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.SENT) {
                throw new AppError(400, `Invoice with status ${invoice.status} cannot be sent`);
            }

            // In a real implementation, we would generate the PDF and send it via email.
            // For now, just update the status and metadata
            
            invoice.status = InvoiceStatus.SENT;
            if (!invoice.metadata) invoice.metadata = {};
            
            if (!invoice.metadata.emailHistory) invoice.metadata.emailHistory = [];
            invoice.metadata.emailHistory.push({
                sentTo: email,
                sentBy: req.user.id,
                sentAt: new Date(),
                message
            });

            await AppDataSource.getRepository(Invoice).save(invoice);

            res.status(200).json({
                success: true,
                message: `Invoice ${invoice.invoiceNumber} has been marked as sent`
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`Failed to send invoice: ${errorMessage}`);
            throw error;
        }
    }
};
