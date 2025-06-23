import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../../middleware/errorHandler';

// Validation schema for user updates
export const userUpdateSchema = Joi.object({
    email: Joi.string().email().optional(),
    role: Joi.string().valid('admin', 'manager', 'staff').optional(),
    status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').optional(),
});

export const validateUserUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { error } = userUpdateSchema.validate(req.body);
    
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return next(new AppError(400, errorMessage));
    }
    
    next();
};