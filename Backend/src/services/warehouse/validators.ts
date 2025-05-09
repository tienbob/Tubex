import * as Joi from 'joi';
import { ValidationSchema } from '../../middleware/validation';

export const warehouseValidators: Record<string, ValidationSchema> = {
    createWarehouse: Joi.object({
        name: Joi.string().required(),
        address: Joi.string().required(),
        capacity: Joi.number().required(),
        contactInfo: Joi.object({
            name: Joi.string().required(),
            phone: Joi.string().required(),
            email: Joi.string().email().required(),
        }).required(),
        type: Joi.string().valid('main', 'secondary', 'distribution', 'storage').default('storage'),
        notes: Joi.string().optional(),
    }) as unknown as ValidationSchema,
    updateWarehouse: Joi.object({
        name: Joi.string().optional(),
        address: Joi.string().optional(),
        capacity: Joi.number().optional(),
        contactInfo: Joi.object({
            name: Joi.string().optional(),
            phone: Joi.string().optional(),
            email: Joi.string().email().optional(),
        }).optional(),
        type: Joi.string().valid('main', 'secondary', 'distribution', 'storage').optional(),
        status: Joi.string().valid('active', 'inactive', 'under_maintenance').optional(),
        notes: Joi.string().optional(),
    }) as unknown as ValidationSchema,
};
