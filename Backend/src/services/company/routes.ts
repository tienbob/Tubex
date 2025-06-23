import { Router, RequestHandler } from 'express';
import { companyController } from './controller';
import { companyValidators } from './validators';
import { authenticate, validate } from '../../middleware';
import { asyncHandler } from '../../middleware/asyncHandler';
import { cacheResponse } from '../../middleware/cache';

const router = Router();

// Apply authentication to all company routes
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management and search endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [dealer, supplier]
 *         tax_id:
 *           type: string
 *         business_license:
 *           type: string
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             province:
 *               type: string
 *             postalCode:
 *               type: string
 *         business_category:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         contact_phone:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, inactive, pending_verification]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/companies:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve a list of companies with optional filtering and pagination
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or email
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [dealer, supplier]
 *         description: Filter by company type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending_verification]
 *           default: active
 *         description: Filter by company status
 *     responses:
 *       200:
 *         description: A paginated list of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', 
    validate(companyValidators.getAllCompanies),
    asyncHandler(companyController.getAllCompanies.bind(companyController)) as RequestHandler
);

/**
 * @swagger
 * /api/v1/companies/batch:
 *   get:
 *     summary: Get multiple companies by IDs
 *     description: Retrieve multiple companies in a single request using comma-separated IDs
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of company IDs
 *         example: "uuid1,uuid2,uuid3"
 *     responses:
 *       200:
 *         description: Map of company IDs to company objects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/Company'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/batch', 
    validate(companyValidators.getCompaniesByIds),
    asyncHandler(companyController.getCompaniesByIds.bind(companyController)) as RequestHandler
);

/**
 * @swagger
 * /api/v1/companies/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     description: Retrieve a list of supplier companies with optional filtering and pagination
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending_verification]
 *           default: active
 *         description: Filter by company status
 *     responses:
 *       200:
 *         description: A paginated list of supplier companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/suppliers', 
    validate(companyValidators.getSuppliers),
    asyncHandler(companyController.getSuppliers.bind(companyController)) as RequestHandler
);

/**
 * @swagger
 * /api/v1/companies/dealers:
 *   get:
 *     summary: Get all dealers
 *     description: Retrieve a list of dealer companies with optional filtering and pagination
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by company name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending_verification]
 *           default: active
 *         description: Filter by company status
 *     responses:
 *       200:
 *         description: A paginated list of dealer companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/dealers', 
    validate(companyValidators.getDealers),
    asyncHandler(companyController.getDealers.bind(companyController)) as RequestHandler
);

/**
 * @swagger
 * /api/v1/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Retrieve detailed information about a specific company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', 
    validate(companyValidators.getCompanyById),
    cacheResponse(300), // Cache for 5 minutes (company data changes less frequently)
    asyncHandler(companyController.getCompanyById.bind(companyController)) as RequestHandler
);

export const companyRoutes = router;
