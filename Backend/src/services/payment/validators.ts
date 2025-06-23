// filepath: d:\All python project\Tubex\Backend\src\services\payment\validators.ts
import Joi from 'joi';
import { PaymentMethod, PaymentType, PaymentReconciliationStatus } from '../../database/models/sql/payment';
import { ValidationSchema } from '../../middleware/unified-validation';

export const paymentValidators: Record<string, ValidationSchema> = {
    createPayment: {
        body: Joi.object({
            transactionId: Joi.string().required().messages({
                'any.required': 'Transaction ID is required',
                'string.empty': 'Transaction ID cannot be empty'
            }),
            orderId: Joi.string().uuid().optional().messages({
                'string.guid': 'Valid order ID is required if provided'
            }),
            invoiceId: Joi.string().uuid().optional().messages({
                'string.guid': 'Valid invoice ID is required if provided'
            }),
            customerId: Joi.string().required().messages({
                'any.required': 'Customer ID is required',
                'string.empty': 'Customer ID cannot be empty'
            }),
            amount: Joi.number().positive().required().messages({
                'number.positive': 'Amount must be a positive number'
            }),
            paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).required().messages({
                'any.only': `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`
            }),
            paymentType: Joi.string().valid(...Object.values(PaymentType)).required().messages({
                'any.only': `Payment type must be one of: ${Object.values(PaymentType).join(', ')}`
            }),
            paymentDate: Joi.date().iso().required().messages({
                'date.format': 'Payment date must be a valid date'
            }),
            externalReferenceId: Joi.string().optional().messages({
                'string.base': 'External reference ID must be a string'
            }),
            notes: Joi.string().optional().messages({
                'string.base': 'Notes must be a string'
            }),
            metadata: Joi.object().optional().messages({
                'object.base': 'Metadata must be an object'
            })
        })
    },
    
    updatePayment: {
        params: Joi.object({
            id: Joi.string().uuid().required().messages({
                'any.required': 'Valid payment ID is required',
                'string.guid': 'Valid payment ID is required'
            })
        }),
        body: Joi.object({
            transactionId: Joi.string().optional().messages({
                'string.empty': 'Transaction ID cannot be empty'
            }),
            orderId: Joi.string().uuid().optional().allow(null).messages({
                'string.guid': 'Valid order ID is required if provided'
            }),
            invoiceId: Joi.string().uuid().optional().allow(null).messages({
                'string.guid': 'Valid invoice ID is required if provided'
            }),
            amount: Joi.number().positive().optional().messages({
                'number.positive': 'Amount must be a positive number'
            }),
            paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).optional().messages({
                'any.only': `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`
            }),
            paymentType: Joi.string().valid(...Object.values(PaymentType)).optional().messages({
                'any.only': `Payment type must be one of: ${Object.values(PaymentType).join(', ')}`
            }),
            paymentDate: Joi.date().iso().optional().messages({
                'date.format': 'Payment date must be a valid date'
            }),
            externalReferenceId: Joi.string().optional().allow(null).messages({
                'string.base': 'External reference ID must be a string'
            }),
            notes: Joi.string().optional().allow(null).messages({
                'string.base': 'Notes must be a string'
            }),
            metadata: Joi.object().optional().messages({
                'object.base': 'Metadata must be an object'
            })
        })
    },
    
    getPaymentById: {
        params: Joi.object({
            id: Joi.string().uuid().required().messages({
                'any.required': 'Valid payment ID is required',
                'string.guid': 'Valid payment ID is required'
            })
        })
    },
    
    deletePayment: {
        params: Joi.object({
            id: Joi.string().uuid().required().messages({
                'any.required': 'Valid payment ID is required',
                'string.guid': 'Valid payment ID is required'
            })
        })
    },
    
    getPayments: {
        query: Joi.object({
            orderId: Joi.string().uuid().optional().messages({
                'string.guid': 'Valid order ID is required if provided'
            }),
            invoiceId: Joi.string().uuid().optional().messages({
                'string.guid': 'Valid invoice ID is required if provided'
            }),
            customerId: Joi.string().optional().messages({
                'string.base': 'Customer ID must be a string'
            }),
            startDate: Joi.date().iso().optional().messages({
                'date.format': 'Start date must be a valid date'
            }),
            endDate: Joi.date().iso().optional().messages({
                'date.format': 'End date must be a valid date'
            }),
            paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).optional().messages({
                'any.only': `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`
            }),
            reconciliationStatus: Joi.string().valid(...Object.values(PaymentReconciliationStatus)).optional().messages({
                'any.only': `Reconciliation status must be one of: ${Object.values(PaymentReconciliationStatus).join(', ')}`
            }),
            page: Joi.number().integer().min(1).optional().messages({
                'number.min': 'Page must be a positive integer'
            }),
            limit: Joi.number().integer().min(1).max(100).optional().messages({
                'number.min': 'Limit must be between 1 and 100',
                'number.max': 'Limit must be between 1 and 100'
            })
        })
    },
    
    reconcilePayment: {
        params: Joi.object({
            id: Joi.string().uuid().required().messages({
                'any.required': 'Valid payment ID is required',
                'string.guid': 'Valid payment ID is required'
            })
        }),
        body: Joi.object({
            reconciliationStatus: Joi.string().valid(...Object.values(PaymentReconciliationStatus)).required().messages({
                'any.only': `Reconciliation status must be one of: ${Object.values(PaymentReconciliationStatus).join(', ')}`
            }),
            notes: Joi.string().optional().messages({
                'string.base': 'Notes must be a string'
            })
        })
    }
};