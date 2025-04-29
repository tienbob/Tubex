import { ValidationSchema } from '../../middleware/validation';
import Joi from 'joi';

export const productValidators = {
    createProduct: {
        body: Joi.object({
            name: Joi.string().required(),
            description: Joi.string().allow('', null),
            base_price: Joi.number().precision(2).positive().required(),
            unit: Joi.string().required(),
            supplier_id: Joi.string().uuid().required(),
            status: Joi.string().valid('active', 'inactive').default('active')
        })
    } as ValidationSchema,

    updateProduct: {
        body: Joi.object({
            name: Joi.string(),
            description: Joi.string().allow('', null),
            base_price: Joi.number().precision(2).positive(),
            unit: Joi.string(),
            supplier_id: Joi.string().uuid(),
            status: Joi.string().valid('active', 'inactive')
        })
    } as ValidationSchema
};