import { ValidationSchema } from '../../middleware/validation';
import Joi from 'joi';

export const companyVerificationValidators = {
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
    } as ValidationSchema
};