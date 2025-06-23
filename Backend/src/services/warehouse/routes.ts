import { Router, RequestHandler } from 'express';
import { 
  authenticate, 
  authorize, 
  requireSupplier,
  validate
} from '../../middleware';
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
 * tags:
 *   name: Warehouses
 *   description: Warehouse management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Warehouse:
 *       type: object
 *       required:
 *         - name
 *         - address
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         companyId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         type:
 *           type: string
 *           enum: [main, secondary, distribution, storage]
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
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
 *             country:
 *               type: string
 *         capacity:
 *           type: number
 *         currentUsage:
 *           type: number
 *         contactInfo:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /warehouses/company/{companyId}:
 *   get:
 *     summary: List company warehouses
 *     description: Get a list of all warehouses for a specific company
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [main, secondary, distribution, storage]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *     responses:
 *       200:
 *         description: List of warehouses retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Warehouse'
 *   
 *   post:
 *     summary: Create warehouse
 *     description: Create a new warehouse for a company
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
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [main, secondary, distribution, storage]
 *               address:
 *                 type: object
 *                 required:
 *                   - street
 *                   - city
 *                   - province
 *                   - postalCode
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               capacity:
 *                 type: number
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 */

/**
 * @swagger
 * /warehouses/company/{companyId}/{warehouseId}:
 *   get:
 *     summary: Get warehouse details
 *     description: Get detailed information about a specific warehouse
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
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Warehouse details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 *   
 *   put:
 *     summary: Update warehouse
 *     description: Update details of a specific warehouse
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
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [main, secondary, distribution, storage]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   province:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               capacity:
 *                 type: number
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Warehouse'
 *   
 *   delete:
 *     summary: Delete warehouse
 *     description: Delete a specific warehouse (only if empty)
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
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Warehouse deleted successfully
 *       400:
 *         description: Cannot delete warehouse with existing inventory
 */

/**
 * @swagger
 * /warehouses/company/{companyId}/{warehouseId}/capacity:
 *   get:
 *     summary: Get warehouse capacity
 *     description: Get detailed capacity usage information for a warehouse
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
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Warehouse capacity information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCapacity:
 *                   type: number
 *                 currentUsage:
 *                   type: number
 *                 availableCapacity:
 *                   type: number
 *                 utilizationPercentage:
 *                   type: number
 */

warehouseRoutes.get(
    '/company/:companyId',
    getAllWarehouses as RequestHandler
);

warehouseRoutes.get(
    '/company/:companyId/:warehouseId',
    getWarehouseById as RequestHandler
);

warehouseRoutes.post(
    '/company/:companyId',
    authorize({ companyTypes: ['supplier'], requireCompanyMatch: true }),
    validate(warehouseValidators.createWarehouse),
    createWarehouse as RequestHandler
);

warehouseRoutes.put(
    '/company/:companyId/:warehouseId',
    authorize({ companyTypes: ['supplier'], requireCompanyMatch: true }),
    validate(warehouseValidators.updateWarehouse),
    updateWarehouse as RequestHandler
);

warehouseRoutes.delete(
    '/company/:companyId/:warehouseId',
    deleteWarehouse as RequestHandler
);

warehouseRoutes.get(
    '/company/:companyId/:warehouseId/capacity',
    getCapacityUsage as RequestHandler
);

export { warehouseRoutes };
