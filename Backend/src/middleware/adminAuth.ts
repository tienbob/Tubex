import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { AuthenticatedRequest } from '../types/express';

export const isCompanyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new AppError(401, 'Authentication required');
        }

        if (req.user.role !== 'admin') {
            throw new AppError(403, 'Only company administrators can perform this action');
        }

        next();
    } catch (error) {
        next(error);
    }
};

export const canManageUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new AppError(401, 'Authentication required');
        }

        if (req.user.id === req.params.userId) {
            throw new AppError(400, 'You cannot modify your own user account');
        }

        next();
    } catch (error) {
        next(error);
    }
};