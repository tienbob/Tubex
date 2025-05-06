import { Router } from 'express';
import { CompanyVerificationController } from './controller';
import { validateRequest } from '../../middleware/validation';
import { companyVerificationValidators } from './validators';
import { isCompanyAdmin } from '../../middleware/adminAuth';

export const companyVerificationRoutes = Router();
const controller = new CompanyVerificationController();

// Only admin users can access these routes
companyVerificationRoutes.use(isCompanyAdmin);

// Get all companies pending verification
companyVerificationRoutes.get('/pending', controller.getPendingVerifications.bind(controller));

// Verify a company
companyVerificationRoutes.post(
    '/:companyId/verify',
    validateRequest(companyVerificationValidators.verifyCompany),
    controller.verifyCompany.bind(controller)
);