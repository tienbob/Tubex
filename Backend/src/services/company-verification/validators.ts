import { ValidationSchema } from '../../middleware/validationHandler';
import Joi from 'joi';

export const companyVerificationValidators: Record<string, ValidationSchema> = {
    verifyCompany: {
        params: Joi.object({
            companyId: Joi.string().uuid().required()
        }),
        body: Joi.object({
            isApproved: Joi.boolean().required(),
            rejectionReason: Joi.string().when('isApproved', {
                is: false,
                then: Joi.string().required(),
                otherwise: Joi.string().optional()
            })
        })
    }
};