import { Router } from 'express';
import { BatchService } from './controller';
import { authenticate } from '../../middleware';
import { asyncHandler } from '../../middleware/asyncHandler';

const batchRoutes = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Batch:
 *       type: object
 *       required:
 *         - batch_number
 *         - product_id
 *         - warehouse_id
 *         - quantity
 *         - unit
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique batch identifier
 *         batch_number:
 *           type: string
 *           description: Unique batch number within company
 *         product_id:
 *           type: string
 *           format: uuid
 *           description: Product identifier
 *         warehouse_id:
 *           type: string
 *           format: uuid
 *           description: Warehouse identifier
 *         company_id:
 *           type: string
 *           format: uuid
 *           description: Company identifier
 *         quantity:
 *           type: number
 *           format: decimal
 *           description: Batch quantity
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         manufacturing_date:
 *           type: string
 *           format: date
 *           description: Manufacturing date
 *         expiry_date:
 *           type: string
 *           format: date
 *           description: Expiry date
 *         status:
 *           type: string
 *           enum: [active, inactive, expired]
 *           description: Batch status
 *         metadata:
 *           type: object
 *           description: Additional batch metadata
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/batch/company/{companyId}:
 *   post:
 *     summary: Create a new batch
 *     tags: [Batch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batch_number
 *               - product_id
 *               - warehouse_id
 *               - quantity
 *               - unit
 *             properties:
 *               batch_number:
 *                 type: string
 *                 description: Unique batch number
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID
 *               warehouse_id:
 *                 type: string
 *                 format: uuid
 *                 description: Warehouse ID
 *               quantity:
 *                 type: number
 *                 format: decimal
 *                 description: Initial quantity
 *               unit:
 *                 type: string
 *                 description: Unit of measurement
 *               manufacturing_date:
 *                 type: string
 *                 format: date
 *                 description: Manufacturing date
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 description: Expiry date
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Batch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Batch'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Unauthorized access
 *       409:
 *         description: Batch number already exists
 */
batchRoutes.post(
    '/company/:companyId',
    authenticate,
    asyncHandler(BatchService.createBatch)
);

/**
 * @swagger
 * /api/batch/company/{companyId}:
 *   get:
 *     summary: Get all batches for a company
 *     tags: [Batch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *       - in: query
 *         name: warehouse_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by warehouse ID
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, expired]
 *           default: active
 *         description: Filter by status
 *       - in: query
 *         name: expiring_days
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter batches expiring within specified days
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
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of batches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Batch'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       403:
 *         description: Unauthorized access
 */
batchRoutes.get(
    '/company/:companyId',
    authenticate,
    asyncHandler(BatchService.getBatches)
);

/**
 * @swagger
 * /api/batch/company/{companyId}/{batchId}:
 *   get:
 *     summary: Get batch by ID
 *     tags: [Batch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Batch details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Batch'
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Batch not found
 */
batchRoutes.get(
    '/company/:companyId/:batchId',
    authenticate,
    asyncHandler(BatchService.getBatchById)
);

/**
 * @swagger
 * /api/batch/company/{companyId}/{batchId}:
 *   put:
 *     summary: Update batch
 *     tags: [Batch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 format: decimal
 *                 description: Updated quantity
 *               manufacturing_date:
 *                 type: string
 *                 format: date
 *                 description: Manufacturing date
 *               expiry_date:
 *                 type: string
 *                 format: date
 *                 description: Expiry date
 *               status:
 *                 type: string
 *                 enum: [active, inactive, expired]
 *                 description: Batch status
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       200:
 *         description: Batch updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Batch'
 *                 message:
 *                   type: string
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Batch not found
 */
batchRoutes.put(
    '/company/:companyId/:batchId',
    authenticate,
    asyncHandler(BatchService.updateBatch)
);

/**
 * @swagger
 * /api/batch/company/{companyId}/{batchId}:
 *   delete:
 *     summary: Deactivate batch
 *     tags: [Batch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Batch deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Batch not found
 */
batchRoutes.delete(
    '/company/:companyId/:batchId',
    authenticate,
    asyncHandler(BatchService.deleteBatch)
);

/**
 * @swagger
 * /api/batch/company/{companyId}/stats:
 *   get:
 *     summary: Get batch statistics for company
 *     tags: [Batch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Batch statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_batches:
 *                       type: integer
 *                       description: Total number of batches
 *                     active_batches:
 *                       type: integer
 *                       description: Number of active batches
 *                     expiring_soon:
 *                       type: integer
 *                       description: Batches expiring within 30 days
 *                     expired_batches:
 *                       type: integer
 *                       description: Number of expired batches
 *                     total_quantity:
 *                       type: number
 *                       format: decimal
 *                       description: Total quantity across all batches
 *       403:
 *         description: Unauthorized access
 */
batchRoutes.get(
    '/company/:companyId/stats',
    authenticate,
    asyncHandler(BatchService.getBatchStats)
);

export { batchRoutes };
