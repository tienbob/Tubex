import { Request, Response, NextFunction } from 'express';
import { QueryFailedError } from 'typeorm';
import { logger } from '../app';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;
  
  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    
    // Capture stack trace for better debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // Log all errors
  logger.error(`[ERROR] ${req.method} ${req.path}: ${error.message}`, {
    stack: error.stack,
    body: req.body,
    params: req.params,
    url: req.originalUrl,
    userId: (req as any).user?.id
  });
  
  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = undefined;
  
  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error.name === 'ValidationError' || error.name === 'JsonWebTokenError') {
    // Handle validation errors (Joi/JWT)
    statusCode = 400;
    message = error.message;
  } else if (error instanceof QueryFailedError) {
    // Handle database errors
    message = 'Database operation failed';
    
    // Detect specific database errors
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
      statusCode = 409;
      message = 'A record with this information already exists';
    } else if (errorMessage.includes('foreign key constraint')) {
      statusCode = 400;
      message = 'Referenced resource does not exist or cannot be modified';
    }
  } else if (error.name === 'SyntaxError') {
    statusCode = 400;
    message = 'Invalid request syntax';
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};