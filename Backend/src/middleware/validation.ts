import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError } from 'joi';
import { AppError } from './errorHandler';

export interface ValidationSchema {
    body?: Schema;
    query?: Schema;
    params?: Schema;
}

type RequestKey = 'body' | 'query' | 'params';

export const validateRequest = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const validationErrors: string[] = [];

        (['params', 'query', 'body'] as RequestKey[]).forEach((key) => {
            if (schema[key]) {
                const validation = schema[key]!.validate(req[key as keyof Request], { abortEarly: false });
                if (validation.error) {
                    validationErrors.push(...validation.error.details.map((detail: ValidationError['details'][0]) => detail.message));
                }
            }
        });

        if (validationErrors.length > 0) {
            throw new AppError(400, `Validation failed: ${validationErrors.join(', ')}`);
        }

        next();
    };
};