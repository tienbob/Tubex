import { ValidationSchema } from '../../middleware/validation';
import Joi from 'joi';

export const orderValidators = {
    createOrder: {
        body: Joi.object({
            items: Joi.array().items(
                Joi.object({
                    productId: Joi.string().uuid().required(),
                    quantity: Joi.number().min(0.01).required(),
                    discount: Joi.number().min(0).default(0)
                })
            ).required(),
            deliveryAddress: Joi.object({
                street: Joi.string(),
                city: Joi.string(),
                province: Joi.string(),
                postalCode: Joi.string()
            }),
            paymentMethod: Joi.string()
        })
    } as ValidationSchema,

    updateOrder: {
        body: Joi.object({
            status: Joi.string().valid('confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
            paymentStatus: Joi.string().valid('paid', 'failed', 'refunded'),
            paymentMethod: Joi.string(),
            deliveryAddress: Joi.object({
                street: Joi.string(),
                city: Joi.string(),
                province: Joi.string(),
                postalCode: Joi.string()
            })
        })
    } as ValidationSchema
};