/**
 * Unified Middleware Index
 * 
 * This file consolidates all middleware exports and provides a clean interface
 * for importing middleware throughout the application.
 * 
 * Usage:
 * import { authenticate, authorize, validate, errorHandler } from '../middleware';
 */

// Authentication & Authorization (Unified)
import {
  authenticate,
  authorize,
  requireCompanyAdmin,
  requireSupplier,
  requireDealer,
  validateCompanyAccess,
  preventSelfModification,
  validateCompanyAccessWithAudit,
  AuthenticatedRequest
} from './unified-auth';

// Validation (Unified)
import {
  validate,
  validationHandler, // Legacy alias
  checkValidationErrors,
  ValidationSchema,
  ExpressValidatorMiddleware,
  ValidationDefinition
} from './unified-validation';

// Error Handling
import {
  AppError,
  errorHandler
} from './errorHandler';

// Utility Middleware
import { asyncHandler } from './asyncHandler';
import { cacheResponse } from './cache';
import { rateLimiter, authLimiter } from './rateLimiter';

// Export all middleware
export {
  // Auth
  authenticate,
  authorize,
  requireCompanyAdmin,
  requireSupplier,
  requireDealer,
  validateCompanyAccess,
  preventSelfModification,
  validateCompanyAccessWithAudit,
  AuthenticatedRequest,
  
  // Validation
  validate,
  validationHandler,
  checkValidationErrors,
  ValidationSchema,
  ExpressValidatorMiddleware,
  ValidationDefinition,
  
  // Error Handling
  AppError,
  errorHandler,
  
  // Utility
  asyncHandler,
  cacheResponse,
  rateLimiter,
  authLimiter
};

/**
 * Common middleware combinations for easy use
 */

// Standard API route protection
export const protectedRoute = [
  authenticate,
  authorize({ roles: ['admin', 'manager', 'staff'] })
];

// Company-specific resource protection
export const companyProtectedRoute = [
  authenticate,
  authorize({ requireCompanyMatch: true })
];

// Admin-only operations within company
export const adminOnlyRoute = [
  authenticate,
  requireCompanyAdmin
];

// Supplier-only operations
export const supplierOnlyRoute = [
  authenticate,
  requireSupplier
];

// Dealer-only operations
export const dealerOnlyRoute = [
  authenticate,
  requireDealer
];

/**
 * Legacy middleware exports for backward compatibility
 * These will be deprecated in future versions
 */

// @deprecated Use 'authenticate' from unified-auth instead
export const auth = authenticate;

// @deprecated Use 'requireCompanyAdmin' from unified-auth instead
export const isCompanyAdmin = requireCompanyAdmin;

// @deprecated Use 'preventSelfModification' from unified-auth instead
export const canManageUser = preventSelfModification;

// @deprecated Use 'validate' from unified-validation instead
export const validation = validate;
