import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../../middleware/errorHandler';

const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  companyName: Joi.string().required(),
  role: Joi.string().valid('dealer', 'supplier', 'admin').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const validateRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await registrationSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(new AppError(400, error instanceof Error ? error.message : 'Validation error occurred'));
  }
};

export const validateLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await loginSchema.validateAsync(req.body);
    next();
  } catch (error) {
    next(new AppError(400, error instanceof Error ? error.message : 'Validation error occurred'));
  }
};