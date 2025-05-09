import { Router } from 'express';
import { productController } from './controller';
import { productValidators } from './validators';
import { validateRequest } from '../../middleware/validation';
import { authenticate, authorize } from '../../middleware/auth';
import { RequestHandler } from 'express';

const router = Router();

// Apply authentication to all product routes
router.use(authenticate);

/**
 * @swagger
 * /product:
 *   get:
 *     summary: List all products
 *     description: Retrieve a list of products with optional filtering and pagination
 *     tags: [Products]
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
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: supplier
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by supplier ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by product status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A paginated list of products
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
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', productController.listProducts as RequestHandler);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve detailed information about a specific product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', productController.getProduct as RequestHandler);

// Protected routes - only suppliers can create/update/delete products
/**
 * @swagger
 * /product:
 *   post:
 *     summary: Create a new product
 *     description: Create a new product (supplier role required)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - basePrice
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               basePrice:
 *                 type: number
 *                 description: Base price of the product
 *               category:
 *                 type: string
 *                 description: Product category
 *               manufacturer:
 *                 type: string
 *                 description: Product manufacturer
 *               sku:
 *                 type: string
 *                 description: Stock keeping unit
 *               weight:
 *                 type: number
 *                 description: Weight in kg
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: number
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *                 description: Product dimensions in cm
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: Product status
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of image URLs
 *               specifications:
 *                 type: object
 *                 description: Additional specifications as key-value pairs
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
    '/',
    authorize('supplier'),
    validateRequest(productValidators.createProduct),
    productController.createProduct as RequestHandler
);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product (supplier role required)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               basePrice:
 *                 type: number
 *                 description: Base price of the product
 *               category:
 *                 type: string
 *                 description: Product category
 *               manufacturer:
 *                 type: string
 *                 description: Product manufacturer
 *               sku:
 *                 type: string
 *                 description: Stock keeping unit
 *               weight:
 *                 type: number
 *                 description: Weight in kg
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   length:
 *                     type: number
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *                 description: Product dimensions in cm
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Product status
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: Array of image URLs
 *               specifications:
 *                 type: object
 *                 description: Additional specifications as key-value pairs
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
    '/:id',
    authorize('supplier'),
    validateRequest(productValidators.updateProduct),
    productController.updateProduct as RequestHandler
);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete an existing product (supplier role required)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Product deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
    '/:id',
    authorize('supplier'),
    productController.deleteProduct as RequestHandler
);

/**
 * @swagger
 * /product/bulk-status:
 *   post:
 *     summary: Bulk update product status
 *     description: Update status for multiple products at once (supplier role required)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *               - status
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of product IDs to update
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: New status to set for all selected products
 *     responses:
 *       200:
 *         description: Products updated successfully
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
 *                   properties:
 *                     count:
 *                       type: integer
 *                       description: Number of products updated
 *                     productIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                       description: IDs of updated products
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
    '/bulk-status',
    authorize('supplier'),
    validateRequest(productValidators.bulkUpdateStatus),
    productController.bulkUpdateStatus as RequestHandler
);

export const productRoutes = router;