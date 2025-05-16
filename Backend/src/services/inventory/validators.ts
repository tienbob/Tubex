import Joi from "joi";
import { ValidationSchema } from '../../middleware/validationHandler';

export const inventoryValidators: Record<string, ValidationSchema> = {
    createInventory: {
        body: Joi.object({
            product_id: Joi.string().uuid().required(),
            warehouse_id: Joi.string().uuid().required(),
            quantity: Joi.number().min(0).required(),
            unit: Joi.string().required(),
            min_threshold: Joi.number().min(0).optional(),
            max_threshold: Joi.number().min(0).optional()
                .when('min_threshold', {
                    is: Joi.exist(),
                    then: Joi.number().greater(Joi.ref('min_threshold'))
                }),
            reorder_point: Joi.number().min(0).optional()
                .when('min_threshold', {
                    is: Joi.exist(),
                    then: Joi.number().less(Joi.ref('max_threshold'))
                }),
            reorder_quantity: Joi.number().min(0).optional(),
            auto_reorder: Joi.boolean().optional(),
        }),
    },

    updateInventory: {
        body: Joi.object({
            quantity: Joi.number().min(0).optional(),
            min_threshold: Joi.number().min(0).optional(),
            max_threshold: Joi.number().min(0).optional()
                .when('min_threshold', {
                    is: Joi.exist(),
                    then: Joi.number().greater(Joi.ref('min_threshold'))
                }),
            reorder_point: Joi.number().min(0).optional()
                .when('min_threshold', {
                    is: Joi.exist(),
                    then: Joi.number().less(Joi.ref('max_threshold'))
                }),
            reorder_quantity: Joi.number().min(0).optional(),
            auto_reorder: Joi.boolean().optional(),
            status: Joi.string().valid('active', 'inactive').optional(),
        }),
    },

    adjustQuantity: {
        body: Joi.object({
            adjustment: Joi.number().required(),
            reason: Joi.string().required(),
            batch_number: Joi.string().optional(),
            manufacturing_date: Joi.date().iso().optional(),
            expiry_date: Joi.date().iso().min(Joi.ref('manufacturing_date')).optional(),
        }),
    },

    transferStock: {
        body: Joi.object({
            source_warehouse_id: Joi.string().uuid().required(),
            target_warehouse_id: Joi.string().uuid().required()
                .disallow(Joi.ref('source_warehouse_id')).messages({
                    'any.invalid': 'Source and target warehouses must be different'
                }),
            product_id: Joi.string().uuid().required(),
            quantity: Joi.number().greater(0).required(),
            batch_numbers: Joi.array().items(Joi.string()).optional(),
        }),
    },
};