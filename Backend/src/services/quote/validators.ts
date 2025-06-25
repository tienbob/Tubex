import { ValidationSchema } from '../../middleware';
import Joi from 'joi';
import { QuoteStatus } from '../../database/models/sql/quote';

export const quoteValidators: Record<string, ValidationSchema> = {
    createQuote: {
        body: Joi.object({
            items: Joi.array().items(
                Joi.object({
                    productId: Joi.string().uuid().required(),
                    quantity: Joi.number().positive().required(),
                    unitPrice: Joi.number().positive().required(),
                    discount: Joi.number().min(0).optional(),
                    notes: Joi.string().optional()
                })
            ).min(1).required(),
            validUntil: Joi.date().greater('now').optional(),
            deliveryAddress: Joi.object({
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

    updateQuote: {
        body: Joi.object({
            status: Joi.string().valid(...Object.values(QuoteStatus)),
            validUntil: Joi.date().greater('now'),
            deliveryAddress: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                province: Joi.string().required(),
                postalCode: Joi.string().required(),
                country: Joi.string().required()
            }),
            notes: Joi.string(),
            items: Joi.array().items(
                Joi.object({
                    id: Joi.string().uuid(),
                    productId: Joi.string().uuid().required(),
                    quantity: Joi.number().positive().required(),
                    unitPrice: Joi.number().positive().required(),
                    discount: Joi.number().min(0).optional(),
                    notes: Joi.string().optional()
                })
            ).min(1),
            metadata: Joi.object().unknown(true)
        }).min(1)
    },

    convertToOrder: {
        body: Joi.object({
            paymentMethod: Joi.string().required(),
            deliveryAddress: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                province: Joi.string().required(),
                postalCode: Joi.string().required(),
                country: Joi.string().required()
            }).optional(),
            metadata: Joi.object().unknown(true).optional()
        })
    }
};
