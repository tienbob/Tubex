import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { authenticate } from '../../middleware/auth';
import { priceListController } from './controller';
import { priceListValidators } from './validators';
import { validationHandler } from '../../middleware/validationHandler';
import multer from 'multer';
import { parse } from 'csv-parse/sync';

// Configure multer for CSV uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// Apply authentication to all price list routes
router.use(authenticate);

/**
 * @swagger
 * /price-list:
 *   get:
 *     summary: List all price lists
 *     description: Retrieve a list of price lists with optional filtering and pagination
 *     tags: [Price Lists]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, archived, draft]
 *         description: Filter by price list status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by price list name
 *     responses:
 *       200:
 *         description: A paginated list of price lists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PriceList'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', priceListController.getAllPriceLists as RequestHandler);

/**
 * @swagger
 * /price-list/{id}:
 *   get:
 *     summary: Get price list by ID
 *     description: Retrieve detailed information about a specific price list
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *     responses:
 *       200:
 *         description: Price list details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PriceList'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', priceListController.getPriceListById as RequestHandler);

/**
 * @swagger
 * /price-list:
 *   post:
 *     summary: Create a new price list
 *     description: Create a new price list with optional items
 *     tags: [Price Lists]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the price list
 *               description:
 *                 type: string
 *                 description: Description of the price list
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived, draft]
 *                 default: draft
 *                 description: Status of the price list
 *               effective_from:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price list becomes effective
 *               effective_to:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price list expires
 *               is_default:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the default price list
 *               global_discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *                 description: Global discount to apply to all items
 *               metadata:
 *                 type: object
 *                 description: Additional metadata as key-value pairs
 *     responses:
 *       201:
 *         description: Price list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PriceList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
    '/', 
    validationHandler(priceListValidators.createPriceList), 
    priceListController.createPriceList as RequestHandler
);
/**
 * @swagger
 * /price-list/{id}:
 *   put:
 *     summary: Update a price list
 *     description: Update an existing price list
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the price list
 *               description:
 *                 type: string
 *                 description: Description of the price list
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived, draft]
 *                 description: Status of the price list
 *               effective_from:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price list becomes effective
 *               effective_to:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price list expires
 *               is_default:
 *                 type: boolean
 *                 description: Whether this is the default price list
 *               global_discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Global discount to apply to all items
 *               metadata:
 *                 type: object
 *                 description: Additional metadata as key-value pairs
 *     responses:
 *       200:
 *         description: Price list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PriceList'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
    '/:id', 
    validationHandler(priceListValidators.updatePriceList), 
    priceListController.updatePriceList as RequestHandler
);

/**
 * @swagger
 * /price-list/{id}:
 *   delete:
 *     summary: Delete a price list
 *     description: Delete an existing price list
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *     responses:
 *       200:
 *         description: Price list deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Price list deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', priceListController.deletePriceList as RequestHandler);

// Price List Items Routes

/**
 * @swagger
 * /price-list/{id}/items:
 *   get:
 *     summary: Get price list items
 *     description: Retrieve all items in a specific price list
 *     tags: [Price List Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
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
 *     responses:
 *       200:
 *         description: A list of price list items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PriceListItem'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/items', priceListController.getPriceListItems as RequestHandler);

/**
 * @swagger
 * /price-list/{id}/items:
 *   post:
 *     summary: Add item to price list
 *     description: Add a new product item to an existing price list
 *     tags: [Price List Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - price
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the product
 *               product_sku:
 *                 type: string
 *                 description: SKU of the product
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Price of the product
 *               discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *                 description: Discount percentage for this item
 *               effective_from:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price becomes effective
 *               effective_to:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price expires
 *               metadata:
 *                 type: object
 *                 description: Additional metadata as key-value pairs
 *     responses:
 *       201:
 *         description: Item added to price list successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PriceListItem'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
    '/:id/items', 
    validationHandler(priceListValidators.addPriceListItem), 
    priceListController.addPriceListItem as RequestHandler
);
/**
 * @swagger
 * /price-list/{id}/items/{itemId}:
 *   put:
 *     summary: Update price list item
 *     description: Update an existing item in a price list
 *     tags: [Price List Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Price of the product
 *               discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage for this item
 *               effective_from:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price becomes effective
 *               effective_to:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price expires
 *               metadata:
 *                 type: object
 *                 description: Additional metadata as key-value pairs
 *     responses:
 *       200:
 *         description: Price list item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PriceListItem'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
    '/:id/items/:itemId', 
    validationHandler(priceListValidators.updatePriceListItem), 
    priceListController.updatePriceListItem as RequestHandler
);

/**
 * @swagger
 * /price-list/{id}/items/{itemId}:
 *   delete:
 *     summary: Delete price list item
 *     description: Remove an item from a price list
 *     tags: [Price List Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List Item ID
 *     responses:
 *       200:
 *         description: Price list item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Price list item deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id/items/:itemId', priceListController.deletePriceListItem as RequestHandler);

// Bulk Operations

/**
 * @swagger
 * /price-list/{id}/bulk-add:
 *   post:
 *     summary: Bulk add items to price list
 *     description: Add multiple product items to a price list at once
 *     tags: [Price List Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - price
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the product
 *                     product_sku:
 *                       type: string
 *                       description: SKU of the product (alternative to product_id)
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       description: Price of the product
 *                     discount_percentage:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       default: 0
 *                       description: Discount percentage for this item
 *                     effective_from:
 *                       type: string
 *                       format: date-time
 *                       description: Date when price becomes effective
 *                     effective_to:
 *                       type: string
 *                       format: date-time
 *                       description: Date when price expires
 *     responses:
 *       200:
 *         description: Items added to price list successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     added:
 *                       type: integer
 *                       description: Number of items added
 *                     skipped:
 *                       type: integer
 *                       description: Number of items skipped
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PriceListItem'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
    '/:id/bulk-add', 
    validationHandler(priceListValidators.bulkAddItems), 
    priceListController.bulkAddItems as RequestHandler
);

/**
 * @swagger
 * /price-list/{id}/bulk-update:
 *   put:
 *     summary: Bulk update items in price list
 *     description: Update multiple product items in a price list at once
 *     tags: [Price List Bulk Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: ID of the price list item
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       description: Updated price of the product
 *                     discount_percentage:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       description: Updated discount percentage
 *                     effective_from:
 *                       type: string
 *                       format: date-time
 *                       description: Updated date when price becomes effective
 *                     effective_to:
 *                       type: string
 *                       format: date-time
 *                       description: Updated date when price expires
 *     responses:
 *       200:
 *         description: Items in price list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: integer
 *                       description: Number of items updated
 *                     skipped:
 *                       type: integer
 *                       description: Number of items skipped
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
    '/:id/bulk-update', 
    validationHandler(priceListValidators.bulkUpdateItems), 
    priceListController.bulkUpdateItems as RequestHandler
);

// Import/Export

/**
 * @swagger
 * /price-list/{id}/export:
 *   get:
 *     summary: Export price list
 *     description: Export a price list to CSV format
 *     tags: [Price List Import/Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price List ID
 *     responses:
 *       200:
 *         description: Price list exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/export', priceListController.exportPriceList as RequestHandler);

/**
 * @swagger
 * /price-list/import:
 *   post:
 *     summary: Import price list
 *     description: Import a price list from JSON data
 *     tags: [Price List Import/Export]
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
 *               - items
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the price list
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived, draft]
 *                 default: draft
 *                 description: Status of the price list
 *               effective_from:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price list becomes effective
 *               effective_to:
 *                 type: string
 *                 format: date-time
 *                 description: Date when price list expires
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_sku
 *                     - price
 *                   properties:
 *                     product_sku:
 *                       type: string
 *                       description: SKU of the product
 *                     price:
 *                       type: number
 *                       minimum: 0
 *                       description: Price of the product
 *                     discount_percentage:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       default: 0
 *                       description: Discount percentage for this item
 *     responses:
 *       201:
 *         description: Price list imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     priceList:
 *                       $ref: '#/components/schemas/PriceList'
 *                     itemsAdded:
 *                       type: integer
 *                       description: Number of items successfully added
 *                     itemsSkipped:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: SKUs that were skipped
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
    '/import', 
    validationHandler(priceListValidators.importPriceList), 
    priceListController.importPriceList as RequestHandler
);

// Middleware for CSV parsing and preparation
const parseCsvMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const multerReq = req as unknown as { file?: Express.Multer.File; body: any };
    
    if (!multerReq.file) {
        return res.status(400).json({
            success: false,
            message: 'No CSV file uploaded'
        });
    }
    
    try {
        const fileContent = multerReq.file.buffer.toString('utf8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        if (!records || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'CSV file is empty or invalid'
            });
        }

        // Transform CSV records into expected format
        const items = records.map((record: any) => ({
            product_sku: record.sku || record.SKU || record.product_sku || record['Product SKU'],
            price: parseFloat(record.price || record.Price || record.amount || record.Amount || 0),
            discount_percentage: parseFloat(record.discount || record.Discount || record.discount_percentage || 0)
        }));

        // Override the request body with parsed CSV data
        multerReq.body = {
            name: multerReq.body?.name || `Imported Price List ${new Date().toISOString().split('T')[0]}`,
            status: multerReq.body?.status || 'draft',
            items
        };

        next();
    } catch (error: any) {
        console.error(`CSV import error: ${error.message}`);
        return res.status(400).json({
            success: false,
            message: `Error parsing CSV: ${error.message}`
        });
    }
};

/**
 * @swagger
 * /price-list/import/csv:
 *   post:
 *     summary: Import price list from CSV
 *     description: Import a price list from a CSV file upload
 *     tags: [Price List Import/Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to upload (columns should include sku/SKU, price/Price, discount/Discount)
 *               name:
 *                 type: string
 *                 description: Optional name for the price list (default will be "Imported Price List YYYY-MM-DD")
 *               status:
 *                 type: string
 *                 enum: [active, inactive, archived, draft]
 *                 default: draft
 *                 description: Optional status for the price list
 *     responses:
 *       201:
 *         description: Price list imported from CSV successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     priceList:
 *                       $ref: '#/components/schemas/PriceList'
 *                     itemsAdded:
 *                       type: integer
 *                       description: Number of items successfully added
 *                     itemsSkipped:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: SKUs that were skipped
 *       400:
 *         description: Bad request, invalid CSV format or missing file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: CSV file is empty or invalid
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
    '/import/csv', 
    upload.single('file'), 
    parseCsvMiddleware, 
    priceListController.importPriceList as RequestHandler
);

/**
 * @swagger
 * /price-list/history/{productId}:
 *   get:
 *     summary: Get product price history
 *     description: Retrieve the price history for a specific product across all price lists
 *     tags: [Price Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for history (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for history (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 50
 *         description: Maximum number of history records to return
 *     responses:
 *       200:
 *         description: Product price history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductPriceHistory'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/history/:productId', priceListController.getProductPriceHistory as RequestHandler);

export const priceListRoutes = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     PriceList:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the price list
 *         name:
 *           type: string
 *           description: The name of the price list
 *         description:
 *           type: string
 *           description: Description of the price list
 *         status:
 *           type: string
 *           enum: [active, inactive, archived, draft]
 *           description: Status of the price list
 *         company_id:
 *           type: string
 *           format: uuid
 *           description: ID of the company that owns this price list
 *         is_default:
 *           type: boolean
 *           description: Whether this is the default price list
 *         global_discount_percentage:
 *           type: number
 *           description: Global discount percentage applied to all items
 *         effective_from:
 *           type: string
 *           format: date-time
 *           description: Date when price list becomes effective
 *         effective_to:
 *           type: string
 *           format: date-time
 *           description: Date when price list expires
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date when price list was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date when price list was last updated
 *         metadata:
 *           type: object
 *           description: Additional metadata as key-value pairs
 *     
 *     PriceListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the price list item
 *         price_list_id:
 *           type: string
 *           format: uuid
 *           description: ID of the parent price list
 *         product_id:
 *           type: string
 *           format: uuid
 *           description: ID of the product
 *         price:
 *           type: number
 *           description: Price of the product in this price list
 *         discount_percentage:
 *           type: number
 *           description: Discount percentage for this item
 *         effective_from:
 *           type: string
 *           format: date-time
 *           description: Date when price becomes effective
 *         effective_to:
 *           type: string
 *           format: date-time
 *           description: Date when price expires
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date when item was added to price list
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date when item was last updated
 *         metadata:
 *           type: object
 *           description: Additional metadata as key-value pairs
 *     
 *     ProductPriceHistory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the price history record
 *         product_id:
 *           type: string
 *           format: uuid
 *           description: ID of the product
 *         price_list_id:
 *           type: string
 *           format: uuid
 *           description: ID of the price list
 *         old_price:
 *           type: number
 *           description: Previous price of the product
 *         new_price:
 *           type: number
 *           description: New price of the product
 *         created_by:
 *           type: string
 *           format: uuid
 *           description: ID of the user who made the change
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date when the price change occurred
 *         metadata:
 *           type: object
 *           description: Additional metadata about the change
 *     
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of items
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         pages:
 *           type: integer
 *           description: Total number of pages
 */
