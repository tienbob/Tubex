import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import { AppDataSource } from '../database/ormconfig';
import { User } from '../database/models/sql';

interface JwtPayload {
    id: string;
    iat: number;
    exp: number;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'Authorization token required');
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret as jwt.Secret) as JwtPayload;

        const user = await AppDataSource.getRepository(User)
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.company', 'company')
            .where('user.id = :id', { id: decoded.id })
            .getOne();

        if (!user) {
            throw new AppError(401, 'User not found');
        }

        if (user.status !== 'active') {
            throw new AppError(401, 'Account is not active');
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company.id
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError(401, 'Invalid or expired token'));
        } else {
            next(error);
        }
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new AppError(401, 'Authorization required');
        }

        if (!roles.includes(req.user.role)) {
            throw new AppError(403, 'Access forbidden');
        }

        next();
    };
};