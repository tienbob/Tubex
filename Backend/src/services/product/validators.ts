import { ValidationSchema } from '../../middleware/validation';
import Joi from 'joi';

export const productValidators = {
    createProduct: {
        body: Joi.object({
            name: Joi.string().required().min(3).max(255),
            description: Joi.string().allow('').max(1000),
            base_price: Joi.number().required().min(0),
            unit: Joi.string().required(),
            supplier_id: Joi.string().uuid().required(),
            status: Joi.string().valid('active', 'inactive').default('active')
        })
    } as ValidationSchema,

    updateProduct: {
        body: Joi.object({
            name: Joi.string().min(3).max(255),
            description: Joi.string().allow('').max(1000),
            base_price: Joi.number().min(0),
            unit: Joi.string(),
            supplier_id: Joi.string().uuid(),
            status: Joi.string().valid('active', 'inactive')
        }).min(1)
    } as ValidationSchema,

    bulkUpdateStatus: {
        body: Joi.object({
            productIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
            status: Joi.string().valid('active', 'inactive').required()
        })
    } as ValidationSchema
};