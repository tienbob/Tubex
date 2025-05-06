import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../../middleware/errorHandler';

const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  province: Joi.string().required(),
  postalCode: Joi.string().required()
});

const companySchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('dealer', 'supplier').required(),
  taxId: Joi.string().pattern(/^\d{10}$/).required()
    .messages({
      'string.pattern.base': 'Tax ID must be exactly 10 digits'
    }),
  businessLicense: Joi.string().required(),
  address: addressSchema.required(),
  businessCategory: Joi.string().required(),
  employeeCount: Joi.number().integer().min(1),
  yearEstablished: Joi.number().integer().min(1900).max(new Date().getFullYear()),
  contactPhone: Joi.string().pattern(/^\d{10,11}$/).required()
    .messages({
      'string.pattern.base': 'Contact phone must be 10-11 digits'
    })
});

const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }),
  company: companySchema.required(),
  userRole: Joi.string().valid('admin', 'manager', 'staff').default('admin')
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