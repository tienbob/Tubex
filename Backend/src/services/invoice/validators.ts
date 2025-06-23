import { ValidationSchema } from '../../middleware/unified-validation';
import Joi from 'joi';
import { InvoiceStatus, PaymentTerm } from '../../database/models/sql/invoice';

export const invoiceValidators: Record<string, ValidationSchema> = {
    createInvoice: {
        body: Joi.object({
            orderId: Joi.string().uuid().optional(),
            items: Joi.array().items(
                Joi.object({
                    productId: Joi.string().uuid().required(),
                    description: Joi.string().optional(),
                    quantity: Joi.number().positive().required(),
                    unitPrice: Joi.number().positive().required(),
                    discount: Joi.number().min(0).optional(),
                    tax: Joi.number().min(0).optional(),
                    notes: Joi.string().optional()
                })
            ).min(1).required(),
            paymentTerm: Joi.string().valid(...Object.values(PaymentTerm)).default(PaymentTerm.DAYS_30),
            issueDate: Joi.date().default(new Date()),
            dueDate: Joi.date().greater(Joi.ref('issueDate')).required(),
            billingAddress: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                province: Joi.string().required(),
                postalCode: Joi.string().required(),
                country: Joi.string().required()
            }).required(),
            notes: Joi.string().optional(),
            metadata: Joi.object().unknown(true).optional()
        })
    },

    updateInvoice: {
        body: Joi.object({
            status: Joi.string().valid(...Object.values(InvoiceStatus)).optional(),
            paidAmount: Joi.number().min(0).optional(),
            paymentTerm: Joi.string().valid(...Object.values(PaymentTerm)).optional(),
            issueDate: Joi.date().optional(),
            dueDate: Joi.date().greater(Joi.ref('issueDate')).optional(),
            billingAddress: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                province: Joi.string().required(),
                postalCode: Joi.string().required(),
                country: Joi.string().required()
            }).optional(),
            notes: Joi.string().optional(),
            items: Joi.array().items(
                Joi.object({
                    id: Joi.string().uuid().optional(),
                    productId: Joi.string().uuid().required(),
                    description: Joi.string().optional(),
                    quantity: Joi.number().positive().required(),
                    unitPrice: Joi.number().positive().required(),
                    discount: Joi.number().min(0).optional(),
                    tax: Joi.number().min(0).optional(),
                    notes: Joi.string().optional()
                })
            ).optional(),
            metadata: Joi.object().unknown(true).optional()
        }).min(1)
    },

    createInvoiceFromOrder: {
        body: Joi.object({
            paymentTerm: Joi.string().valid(...Object.values(PaymentTerm)).default(PaymentTerm.DAYS_30),
            issueDate: Joi.date().default(new Date()),
            dueDate: Joi.date().greater(Joi.ref('issueDate')).optional(),
            billingAddress: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                province: Joi.string().required(),
                postalCode: Joi.string().required(),
                country: Joi.string().required()
            }).optional(),
            notes: Joi.string().optional(),
            metadata: Joi.object().unknown(true).optional()
        })
    },

    recordPayment: {
        body: Joi.object({
            amount: Joi.number().positive().required(),
            paymentMethod: Joi.string().required(),
            paymentDate: Joi.date().default(new Date()),
            notes: Joi.string().optional(),
            metadata: Joi.object().unknown(true).optional()
        })
    }
};
