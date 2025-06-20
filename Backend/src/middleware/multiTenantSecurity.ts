import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { AppDataSource } from '../database';
import { Company } from '../database/models/sql';

/**
 * Enhanced Multi-Tenant Security Middleware for B2B SaaS
 * Addresses OWASP A01 Broken Access Control vulnerabilities
 */

export interface SecureRequest extends Request {
    user: {
        id: string;
        companyId: string;
        role: string;
        email: string;
    };
    companyType?: 'dealer' | 'supplier';
    isMultiTenantValidated?: boolean;
}

/**
 * Validates that user can only access resources belonging to their company
 * Prevents horizontal privilege escalation
 */
export const validateCompanyAccess = async (
    req: SecureRequest, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const { companyId } = req.params;
        const user = req.user;

        if (!user || !user.companyId) {
            throw new AppError(401, 'Authentication required');
        }

        if (!companyId) {
            throw new AppError(400, 'Company ID required in request');
        }

        // CRITICAL SECURITY: Strict company isolation
        // No exceptions for any role - prevents horizontal privilege escalation
        if (user.companyId !== companyId) {
            throw new AppError(403, 'Access denied: You can only access resources from your own company');
        }

        // Cache company type for performance and consistency
        if (!req.companyType) {
            const company = await AppDataSource.getRepository(Company).findOne({
                where: { id: user.companyId },
                select: ['type', 'status']
            });

            if (!company) {
                throw new AppError(403, 'Invalid company association');
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

/**
 * Validates resource ownership within the company context
 * Prevents users from accessing resources they don't own
 */
export const validateResourceOwnership = (resourceType: 'product' | 'inventory' | 'warehouse' | 'order') => {
    return async (req: SecureRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.isMultiTenantValidated) {
                throw new AppError(500, 'Multi-tenant validation required before resource ownership check');
            }

            const { id } = req.params;
            const user = req.user;
            const companyType = req.companyType;

            if (!id) {
                return next(); // Skip if no specific resource ID
            }

            // Resource-specific ownership validation
            switch (resourceType) {
                case 'product':
                    await validateProductOwnership(id, user.companyId, companyType!);
                    break;
                case 'inventory':
                    await validateInventoryOwnership(id, user.companyId, companyType!);
                    break;
                case 'warehouse':
                    await validateWarehouseOwnership(id, user.companyId);
                    break;
                case 'order':
                    await validateOrderOwnership(id, user.companyId, companyType!);
                    break;
                default:
                    throw new AppError(500, `Unknown resource type: ${resourceType}`);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate product ownership based on company type
 */
async function validateProductOwnership(productId: string, companyId: string, companyType: 'dealer' | 'supplier') {
    const { Product } = await import('../database/models/sql');
    const productRepo = AppDataSource.getRepository(Product);

    const product = await productRepo.findOne({
        where: { id: productId },
        select: ['id', 'supplier_id', 'dealer_id']
    });

    if (!product) {
        throw new AppError(404, 'Product not found');
    }

    if (companyType === 'supplier' && product.supplier_id !== companyId) {
        throw new AppError(403, 'Access denied: You can only access your own products');
    }

    if (companyType === 'dealer' && product.dealer_id !== companyId) {
        throw new AppError(403, 'Access denied: You can only access products in your catalog');
    }
}

/**
 * Validate inventory ownership
 */
async function validateInventoryOwnership(inventoryId: string, companyId: string, companyType: 'dealer' | 'supplier') {
    const { Inventory } = await import('../database/models/sql');
    const inventoryRepo = AppDataSource.getRepository(Inventory);

    const inventory = await inventoryRepo
        .createQueryBuilder('inventory')
        .leftJoinAndSelect('inventory.product', 'product')
        .where('inventory.id = :inventoryId', { inventoryId })
        .andWhere('inventory.company_id = :companyId', { companyId })
        .getOne();

    if (!inventory) {
        throw new AppError(404, 'Inventory item not found');
    }

    // Additional validation based on company type
    if (companyType === 'supplier' && inventory.product?.supplier_id !== companyId) {
        throw new AppError(403, 'Access denied: You can only access inventory for your own products');
    }

    if (companyType === 'dealer' && inventory.product?.dealer_id !== companyId) {
        throw new AppError(403, 'Access denied: You can only access inventory for products in your catalog');
    }
}

/**
 * Validate warehouse ownership
 */
async function validateWarehouseOwnership(warehouseId: string, companyId: string) {
    const { Warehouse } = await import('../database/models/sql');
    const warehouseRepo = AppDataSource.getRepository(Warehouse);

    const warehouse = await warehouseRepo.findOne({
        where: { id: warehouseId, company_id: companyId },
        select: ['id']
    });

    if (!warehouse) {
        throw new AppError(403, 'Access denied: Warehouse does not belong to your company');
    }
}

/**
 * Validate order ownership
 */
async function validateOrderOwnership(orderId: string, companyId: string, companyType: 'dealer' | 'supplier') {
    const { Order } = await import('../database/models/sql');
    const orderRepo = AppDataSource.getRepository(Order);

    const order = await orderRepo.findOne({
        where: { id: orderId },
        select: ['id', 'customerId', 'companyId']
    });

    if (!order) {
        throw new AppError(404, 'Order not found');
    }

    // For now, check if the order belongs to the user's company
    // This can be enhanced based on the actual order relationships
    if (order.companyId !== companyId) {
        throw new AppError(403, 'Access denied: You can only access orders from your company');
    }
}

/**
 * Rate limiting per company to prevent abuse
 */
export const companyRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    return (req: SecureRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user?.companyId) {
            return next(new AppError(401, 'Authentication required'));
        }

        const now = Date.now();
        const companyKey = user.companyId;
        const existing = requestCounts.get(companyKey);

        if (!existing || now > existing.resetTime) {
            requestCounts.set(companyKey, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (existing.count >= maxRequests) {
            return next(new AppError(429, 'Too many requests from your company. Please try again later.'));
        }

        existing.count++;
        next();
    };
};

/**
 * Audit logging for security events
 */
export const auditSecurityEvent = (event: string, details?: any) => {
    return (req: SecureRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        const logData = {
            event,
            userId: user?.id,
            companyId: user?.companyId,
            userRole: user?.role,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
            details
        };

        // In production, send to proper logging service
        console.log('SECURITY_AUDIT:', JSON.stringify(logData));
        next();
    };
};
