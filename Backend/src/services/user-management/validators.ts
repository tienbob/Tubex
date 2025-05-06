import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';

export const userManagementSchema = Joi.object({
    role: Joi.string()
        .valid('admin', 'manager', 'staff')
        .when('$isDelete', {
            is: true,
            then: Joi.forbidden(),
            otherwise: Joi.required()
        })
        .messages({
            'any.required': 'Role is required',
            'any.only': 'Role must be either admin, manager, or staff',
            'any.unknown': 'Role should not be provided for deletion'
        }),
    status: Joi.string()
        .valid('active', 'inactive')
        .when('$isDelete', {
            is: true,
            then: Joi.forbidden(),
            otherwise: Joi.required()
        })
        .messages({
            'any.required': 'Status is required',
            'any.only': 'Status must be either active or inactive',
            'any.unknown': 'Status should not be provided for deletion'
        }),
    reason: Joi.string()
        .min(3)
        .max(500)
        .required()
        .messages({
            'any.required': 'Reason for change is required',
            'string.min': 'Reason must be at least 3 characters long',
            'string.max': 'Reason must not exceed 500 characters'
        })
});

export const validateUserManagement = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const isDelete = req.method === 'DELETE';
        await userManagementSchema.validateAsync(req.body, {
            context: { isDelete }
        });
        next();
    } catch (error) {
        next(new AppError(400, error instanceof Error ? error.message : 'Validation error occurred'));
    }
};