import { ValidationSchema } from '../../middleware/validation';
import Joi from 'joi';
import { OrderStatus, PaymentStatus } from '../../database/models/sql/order';

export const orderValidators = {
    createOrder: {
        body: Joi.object({
            items: Joi.array().items(
                Joi.object({
                    productId: Joi.string().uuid().required(),
                    quantity: Joi.number().integer().min(1).required(),
                    discount: Joi.number().min(0).optional()
                })
            ).min(1).required(),
            deliveryAddress: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                state: Joi.string().required(),
                zipCode: Joi.string().required(),
                country: Joi.string().required()
            }).required(),
            paymentMethod: Joi.string().required(),
            metadata: Joi.object({
                notes: Joi.string(),
                purchaseOrderNumber: Joi.string()
            }).optional()
        })
    } as ValidationSchema,

    updateOrder: {
        body: Joi.object({
            status: Joi.string().valid(...Object.values(OrderStatus)),
            paymentStatus: Joi.string().valid(...Object.values(PaymentStatus)),
            paymentMethod: Joi.string(),
            deliveryAddress: Joi.object({
                street: Joi.string().required(),
                city: Joi.string().required(),
                state: Joi.string().required(),
                zipCode: Joi.string().required(),
                country: Joi.string().required()
            }),
            metadata: Joi.object().unknown(true)
        }).min(1)
    } as ValidationSchema,

    bulkProcessOrders: {
        body: Joi.object({
            orderIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
            status: Joi.string().valid(...Object.values(OrderStatus)).required()
        })
    } as ValidationSchema
};