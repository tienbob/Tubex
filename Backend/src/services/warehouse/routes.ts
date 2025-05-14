import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import {
    getAllWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getCapacityUsage
} from './controller';
import { warehouseValidators } from './validators';

const warehouseRoutes = Router();

// Apply JWT authentication to all warehouse routes
warehouseRoutes.use(authenticate);

/**
 * @swagger
 * /warehouses/company/{companyId}:
 *   get:
 *     summary: Get all warehouses for a company
 *     tags: [Warehouses]
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of warehouses per page
 *     responses:
 *       200:
 *         description: List of warehouses
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
 *                     warehouses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Warehouse'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
warehouseRoutes.get(
    '/company/:companyId',
    getAllWarehouses as RequestHandler
);

/**
 * @swagger
 * /warehouses/company/{companyId}/{warehouseId}:
 *   get:
 *     summary: Get a specific warehouse by ID
 *     tags: [Warehouses]
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
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Warehouse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
warehouseRoutes.get(
    '/company/:companyId/:warehouseId',
    getWarehouseById as RequestHandler
);

/**
 * @swagger
 * /warehouses/company/{companyId}:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
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
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 description: Warehouse name
 *               address:
 *                 type: string
 *                 description: Warehouse address
 *               capacity:
 *                 type: number
 *                 description: Warehouse storage capacity
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *               type:
 *                 type: string
 *                 enum: [main, secondary, distribution, storage]
 *                 default: storage
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Warehouse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
warehouseRoutes.post(
    '/company/:companyId',
    validateRequest(warehouseValidators.createWarehouse),
    createWarehouse as RequestHandler
);

/**
 * @swagger
 * /warehouses/company/{companyId}/{warehouseId}:
 *   put:
 *     summary: Update a warehouse
 *     tags: [Warehouses]
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
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Warehouse name
 *               address:
 *                 type: string
 *                 description: Warehouse address
 *               capacity:
 *                 type: number
 *                 description: Warehouse storage capacity
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *               type:
 *                 type: string
 *                 enum: [main, secondary, distribution, storage]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, under_maintenance]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Warehouse'
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
warehouseRoutes.put(
    '/company/:companyId/:warehouseId',
    validateRequest(warehouseValidators.updateWarehouse),
    updateWarehouse as RequestHandler
);

/**
 * @swagger
 * /warehouses/company/{companyId}/{warehouseId}:
 *   delete:
 *     summary: Delete a warehouse
 *     tags: [Warehouses]
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
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
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
 *                   example: Warehouse deleted successfully
 *       400:
 *         description: Cannot delete warehouse with existing inventory
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
warehouseRoutes.delete(
    '/company/:companyId/:warehouseId',
    deleteWarehouse as RequestHandler
);

/**
 * @swagger
 * /warehouses/company/{companyId}/{warehouseId}/capacity:
 *   get:
 *     summary: Get warehouse capacity usage information
 *     tags: [Warehouses]
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
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Warehouse ID
 *     responses:
 *       200:
 *         description: Warehouse capacity usage details
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
 *                     warehouse:
 *                       $ref: '#/components/schemas/Warehouse'
 *                     capacityUsage:
 *                       type: object
 *                       properties:
 *                         totalCapacity:
 *                           type: number
 *                         currentUsage:
 *                           type: number
 *                         availableCapacity:
 *                           type: number
 *                         utilizationPercentage:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
warehouseRoutes.get(
    '/company/:companyId/:warehouseId/capacity',
    getCapacityUsage as RequestHandler
);

export { warehouseRoutes };
