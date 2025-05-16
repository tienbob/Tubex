import { Router } from 'express';
import { CompanyVerificationController } from './controller';
import { validationHandler } from '../../middleware/validationHandler';
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
    validationHandler(companyVerificationValidators.verifyCompany),
    controller.verifyCompany.bind(controller)
);