import { body, query, param } from 'express-validator';

export const companyValidators = {
    // Validation for query parameters in getAllCompanies
    getAllCompanies: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('search')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Search query must not exceed 255 characters'),
        query('type')
            .optional()
            .isIn(['dealer', 'supplier'])
            .withMessage('Type must be either dealer or supplier'),
        query('status')
            .optional()
            .isIn(['active', 'inactive', 'pending_verification', 'suspended', 'rejected'])
            .withMessage('Status must be a valid company status')
    ],

    // Validation for single company ID parameter
    getCompanyById: [
        param('id')
            .isUUID()
            .withMessage('Company ID must be a valid UUID')
    ],

    // Validation for batch company IDs
    getCompaniesByIds: [
        query('ids')
            .isString()
            .notEmpty()
            .withMessage('Company IDs are required')
            .custom((value: string) => {
                const ids = value.split(',').map(id => id.trim()).filter(id => id);
                if (ids.length === 0) {
                    throw new Error('At least one valid company ID is required');
                }
                if (ids.length > 50) {
                    throw new Error('Cannot request more than 50 companies at once');
                }
                // Validate each ID is a UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                for (const id of ids) {
                    if (!uuidRegex.test(id)) {
                        throw new Error(`Invalid UUID format: ${id}`);
                    }
                }
                return true;
            })
    ],

    // Validation for suppliers endpoint
    getSuppliers: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('search')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Search query must not exceed 255 characters'),
        query('status')
            .optional()
            .isIn(['active', 'inactive', 'pending_verification', 'suspended', 'rejected'])
            .withMessage('Status must be a valid company status')
    ],

    // Validation for dealers endpoint
    getDealers: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('search')
            .optional()
            .isLength({ max: 255 })
            .withMessage('Search query must not exceed 255 characters'),
        query('status')
            .optional()
            .isIn(['active', 'inactive', 'pending_verification', 'suspended', 'rejected'])
            .withMessage('Status must be a valid company status')
    ]
};
