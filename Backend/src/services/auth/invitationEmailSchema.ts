import Joi from 'joi';

export const invitationEmailSchema = Joi.object({
  to: Joi.string().email().required(),
  code: Joi.string().required(),
  role: Joi.string().valid('admin', 'manager', 'staff').required(),
  message: Joi.string().allow('').optional(),
  companyId: Joi.string().required()
});
