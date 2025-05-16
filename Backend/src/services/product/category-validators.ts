import { check } from 'express-validator';

export const productCategoryValidators = {
    createCategory: [
        check('name')
            .not().isEmpty()
            .withMessage('Name is required')
            .isLength({ max: 100 })
            .withMessage('Name must be less than 100 characters long'),
        
        check('description')
            .optional()
            .isString()
            .withMessage('Description must be a string'),
        
        check('company_id')
            .optional()
            .isUUID()
            .withMessage('Company ID must be a valid UUID'),
        
        check('parent_id')
            .optional()
            .isUUID()
            .withMessage('Parent category ID must be a valid UUID')
    ],
    
    updateCategory: [
        check('name')
            .optional()
            .isLength({ max: 100 })
            .withMessage('Name must be less than 100 characters long'),
        
        check('description')
            .optional()
            .isString()
            .withMessage('Description must be a string'),
        
        check('parent_id')
            .optional()
            .isUUID()
            .withMessage('Parent category ID must be a valid UUID')
    ]
};
