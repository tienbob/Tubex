import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Interface defining the structure of Joi validation schemas
 */
export interface ValidationSchema {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

/**
 * Type for express-validator middleware arrays
 */
export type ExpressValidatorMiddleware = any[]; // Array of express-validator middlewares

/**
 * Union type that can represent both validation approaches
 */
export type ValidationDefinition = ValidationSchema | ExpressValidatorMiddleware;

/**
 * Unified validation middleware that handles both Joi and express-validator validations
 * 
 * @param schema - Can be either a Joi schema object or express-validator middleware array
 * @returns Express middleware
 */
export const validationHandler = (schema: ValidationDefinition): any[] | ((req: Request, res: Response, next: NextFunction) => void) => {
  // If schema is an array, assume it's express-validator middleware
  if (Array.isArray(schema)) {
    return [
      ...schema,
      (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const errorMessages = errors.array().map(err => {
            // Safely handle different error formats from express-validator
            const field = (err as any).param || (err as any).path || 'unknown';
            const message = typeof err === 'object' ? (err as any).msg || String(err) : String(err);
            return `${field}: ${message}`;
          }).join(', ');
          throw new AppError(400, `Validation failed: ${errorMessages}`);
        }
        next();
      }
    ];
  }
  
  // Otherwise, assume it's a Joi validation schema
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: string[] = [];

    // If schema has body validator
    if (schema.body) {
      const validation = schema.body.validate(req.body, { abortEarly: false });
      if (validation.error) {
        validationErrors.push(
          ...validation.error.details.map((detail: any) => detail.message)
        );
      }
    }

    // If schema has query validator
    if (schema.query) {
      const validation = schema.query.validate(req.query, { abortEarly: false });
      if (validation.error) {
        validationErrors.push(
          ...validation.error.details.map((detail: any) => detail.message)
        );
      }
    }

    // If schema has params validator
    if (schema.params) {
      const validation = schema.params.validate(req.params, { abortEarly: false });
      if (validation.error) {
        validationErrors.push(
          ...validation.error.details.map((detail: any) => detail.message)
        );
      }
    }

    if (validationErrors.length > 0) {
      throw new AppError(400, `Validation failed: ${validationErrors.join(', ')}`);
    }

    next();
  };
};
