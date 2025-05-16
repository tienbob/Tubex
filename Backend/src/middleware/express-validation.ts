import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Express-validator middleware for validating requests
 */
export const validation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      // Safely handle different error formats from express-validator
      const field = (err as any).param || 'field';
      const message = (err as any).msg || String(err);
      return `${field}: ${message}`;
    }).join(', ');
    throw new AppError(400, `Validation failed: ${errorMessages}`);
  }
  next();
};
