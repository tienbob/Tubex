import { ValidationSchema } from '../../middleware/unified-validation';
import Joi from 'joi';

export const priceListValidators: Record<string, ValidationSchema> = {
    createPriceList: {
        body: Joi.object({
            name: Joi.string().required().max(100),
            description: Joi.string().optional().allow('', null),
            status: Joi.string().valid('active', 'inactive', 'archived', 'draft').default('draft'),
            effective_from: Joi.date().iso().optional().allow(null),
            effective_to: Joi.date().iso().greater(Joi.ref('effective_from')).optional().allow(null),
            is_default: Joi.boolean().default(false),
            global_discount_percentage: Joi.number().min(0).max(100).default(0),
            metadata: Joi.object().optional()
        })
    },

    updatePriceList: {
        body: Joi.object({
            name: Joi.string().max(100).optional(),
            description: Joi.string().optional().allow('', null),
            status: Joi.string().valid('active', 'inactive', 'archived', 'draft').optional(),
            effective_from: Joi.date().iso().optional().allow(null),
            effective_to: Joi.date().iso().greater(Joi.ref('effective_from')).optional().allow(null),
            is_default: Joi.boolean().optional(),
            global_discount_percentage: Joi.number().min(0).max(100).optional(),
            metadata: Joi.object().optional()
        })
    },

    addPriceListItem: {
        body: Joi.object({
            product_id: Joi.string().uuid().required(),
            price: Joi.number().required().min(0),
            discount_percentage: Joi.number().min(0).max(100).default(0),
            effective_from: Joi.date().iso().optional().allow(null),
            effective_to: Joi.date().iso().greater(Joi.ref('effective_from')).optional().allow(null),
            metadata: Joi.object().optional()
        })
    },

    updatePriceListItem: {
        body: Joi.object({
            price: Joi.number().min(0).optional(),
            discount_percentage: Joi.number().min(0).max(100).optional(),
            effective_from: Joi.date().iso().optional().allow(null),
            effective_to: Joi.date().iso().greater(Joi.ref('effective_from')).optional().allow(null),
            metadata: Joi.object().optional()
        })
    },

    bulkAddItems: {
        body: Joi.object({
            items: Joi.array().items(
                Joi.object({
                    product_id: Joi.string().uuid().required(),
                    price: Joi.number().required().min(0),
                    discount_percentage: Joi.number().min(0).max(100).default(0),
                    effective_from: Joi.date().iso().optional().allow(null),
                    effective_to: Joi.date().iso().optional().allow(null),
                    metadata: Joi.object().optional()
                })
            ).min(1).required()
        })
    },

    bulkUpdateItems: {
        body: Joi.object({
            items: Joi.array().items(
                Joi.object({
                    id: Joi.string().uuid().required(),
                    price: Joi.number().min(0).optional(),
                    discount_percentage: Joi.number().min(0).max(100).optional(),
                    effective_from: Joi.date().iso().optional().allow(null),
                    effective_to: Joi.date().iso().optional().allow(null),
                    metadata: Joi.object().optional()
                })
            ).min(1).required()
        })
    },

    importPriceList: {
        body: Joi.object({
            name: Joi.string().required().max(100),
            status: Joi.string().valid('active', 'inactive', 'archived', 'draft').default('draft'),
            effective_from: Joi.date().iso().optional().allow(null),
            effective_to: Joi.date().iso().optional().allow(null),
            items: Joi.array().items(
                Joi.object({
                    product_sku: Joi.string().required(),
                    price: Joi.number().required().min(0),
                    discount_percentage: Joi.number().min(0).max(100).default(0)
                })
            ).min(1).required()
        })
    }
};
