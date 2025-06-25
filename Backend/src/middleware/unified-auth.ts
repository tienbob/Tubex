import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import { AppDataSource } from '../database/ormconfig';
import { User, Company } from '../database/models/sql';

// Re-export the AuthenticatedRequest for convenience
export { AuthenticatedRequest } from '../types/express';

// Extend the global Express namespace to match our needs
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      companyId: string;
      companyType?: string;
      status?: string;
    }
    interface Request {
      companyType?: 'dealer' | 'supplier';
      isMultiTenantValidated?: boolean;
    }
  }
}

// JWT payload interface
interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Enhanced authentication middleware with company information
 */
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
    }    // Set user information with complete context using type assertion
    (req as any).user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company?.id || '', // Default to empty string if no company
      companyType: user.company?.type || undefined,
      status: user.status
    };

    // Cache company type for performance
    req.companyType = user.company?.type as 'dealer' | 'supplier' | undefined;

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
 * Unified role-based authorization middleware
 * Supports hierarchical role checking and company type validation
 */
export const authorize = (options: {
  roles?: string[];
  companyTypes?: string[];
  allowSelf?: boolean; // Allow access to own resources
  requireCompanyMatch?: boolean; // Require company ID match
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roles = [], companyTypes = [], allowSelf = false, requireCompanyMatch = false } = options;
      
      const user = (req as any).user;
      
      if (!user) {
        throw new AppError(401, 'Authentication required');
      }

      // Admin bypass for most operations (except company isolation)
      const isAdmin = user.role === 'admin';
      
      // Check role permissions
      if (roles.length > 0 && !isAdmin) {
        if (!roles.includes(user.role)) {
          throw new AppError(403, 'Insufficient role permissions');
        }
      }

      // Check company type permissions
      if (companyTypes.length > 0 && !isAdmin) {
        if (!user.companyType || !companyTypes.includes(user.companyType)) {
          throw new AppError(403, 'Company type not authorized for this operation');
        }
      }

      // Check self-access for user-specific resources
      if (allowSelf && req.params.userId) {
        if (user.id === req.params.userId) {
          return next(); // Allow self-access
        }
      }

      // Critical: Company isolation - NO ADMIN BYPASS for multi-tenant security
      if (requireCompanyMatch && req.params.companyId) {
        if (!user.companyId || user.companyId === '') {
          throw new AppError(403, 'User not associated with any company');
        }
        
        if (user.companyId !== req.params.companyId) {
          throw new AppError(403, 'Access denied: You can only access resources from your own company');
        }
        
        req.isMultiTenantValidated = true;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Specific middleware for company admin operations
 */
export const requireCompanyAdmin = authorize({
  roles: ['admin'],
  requireCompanyMatch: true
});

/**
 * Middleware for supplier-only operations
 */
export const requireSupplier = authorize({
  companyTypes: ['supplier'],
  requireCompanyMatch: true
});

/**
 * Middleware for dealer-only operations  
 */
export const requireDealer = authorize({
  companyTypes: ['dealer'],
  requireCompanyMatch: true
});

/**
 * Middleware for operations that require company access validation
 */
export const validateCompanyAccess = authorize({
  requireCompanyMatch: true
});

/**
 * Middleware to prevent users from modifying their own accounts in admin operations
 */
export const preventSelfModification = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      throw new AppError(401, 'Authentication required');
    }

    if (user.id === req.params.userId) {
      throw new AppError(400, 'You cannot modify your own user account');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Enhanced multi-tenant security with audit logging
 */
export const validateCompanyAccessWithAudit = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;
    const user = (req as any).user;if (!user || !user.companyId || user.companyId === '') {
      throw new AppError(401, 'Authentication required');
    }

    if (!companyId) {
      throw new AppError(400, 'Company ID required in request');
    }

    // CRITICAL SECURITY: Strict company isolation
    if (user.companyId !== companyId) {
      // Log potential security violation
      console.warn(`Security violation attempt: User ${user.id} from company ${user.companyId} attempted to access company ${companyId} resources`, {
        userId: user.id,
        userCompany: user.companyId,
        attemptedCompany: companyId,
        endpoint: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      throw new AppError(403, 'Access denied: You can only access resources from your own company');
    }

    // Validate company exists and is active
    if (!req.companyType) {
      const company = await AppDataSource.getRepository(Company).findOne({
        where: { id: companyId },
        select: ['id', 'type', 'status']
      });

      if (!company) {
        throw new AppError(404, 'Company not found');
      }

      if (company.status !== 'active') {
        throw new AppError(403, 'Company account is not active');
      }

      req.companyType = company.type as 'dealer' | 'supplier';
    }

    req.isMultiTenantValidated = true;
    next();
  } catch (error) {
    next(error);
  }
};
