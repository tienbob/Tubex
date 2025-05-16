import { authenticate } from '../../middleware/auth';
import Joi from 'joi';
import { ValidationSchema } from '../../middleware/validationHandler';

export const productValidators: Record<string, ValidationSchema> = {
    createProduct: {
        body: Joi.object({
            name: Joi.string().required().min(3).max(255),
            description: Joi.string().allow('').max(1000),
            base_price: Joi.number().required().min(0),
            unit: Joi.string().required(),
            supplier_id: Joi.string().uuid().required(),
            status: Joi.string().valid('active', 'inactive').default('active')
        })
    },

    updateProduct: {
        body: Joi.object({
            name: Joi.string().min(3).max(255),
            description: Joi.string().allow('').max(1000),
            base_price: Joi.number().min(0),
            unit: Joi.string(),
            supplier_id: Joi.string().uuid(),
            status: Joi.string().valid('active', 'inactive')
        }).min(1)
    },

    bulkUpdateStatus: {
        body: Joi.object({
            productIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
            status: Joi.string().valid('active', 'inactive').required()
        })
    }
};