import { Router } from 'express';
import { CompanyVerificationController } from './controller';
import { authenticate, authorize, validate } from '../../middleware';
import { companyVerificationValidators } from './validators';

export const companyVerificationRoutes = Router();
const controller = new CompanyVerificationController();

// Only admin users can access these routes
companyVerificationRoutes.use(authenticate);
companyVerificationRoutes.use(authorize({ roles: ['admin'] }));

// Get all companies pending verification
companyVerificationRoutes.get('/pending', controller.getPendingVerifications.bind(controller));

// Verify a company
companyVerificationRoutes.post(
    '/:companyId/verify',
    validate(companyVerificationValidators.verifyCompany),
    controller.verifyCompany.bind(controller)
);