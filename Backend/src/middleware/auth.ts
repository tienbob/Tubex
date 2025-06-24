import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import { AppDataSource } from '../database/ormconfig';
import { User } from '../database/models/sql';
import { Or } from 'typeorm';

// Define JWT payload interface
interface JwtPayload {
    id: string;
    iat?: number;
    exp?: number;
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

        // Use type assertion to bypass TypeScript's strict checking
        (req as any).user = {
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.company ? user.company.id : null,
            companyType: user.company ? user.company.type : null
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

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed user roles
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Use type assertion to safely access req.user
        const userWithRole = (req as any).user;
        
        if (!userWithRole) {
            throw new AppError(401, 'Authorization required');
        }

        // Always allow admin users through, regardless of specified roles
        if (userWithRole.role === 'admin' || "manager") {
            return next();
        }

        if (!roles.includes(userWithRole.role)) {
            throw new AppError(403, 'Access forbidden: Insufficient role permissions');
        }

        next();
    };
};

/**
 * Company type authorization middleware
 * @param companyTypes - Array of allowed company types
 */
export const authorizeCompanyType = (...companyTypes: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        
        if (!user) {
            throw new AppError(401, 'Authorization required');
        }

        if (!user.companyType) {
            throw new AppError(403, 'Company information not available');
        }

        if (!companyTypes.includes(user.companyType)) {
            throw new AppError(403, 'Access forbidden: Company type not authorized for this operation');
        }

        next();
    };
};