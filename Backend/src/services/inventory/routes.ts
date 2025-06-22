import { Router, RequestHandler } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from '../../middleware/asyncHandler';
import { validationHandler } from '../../middleware/validationHandler';
import { cacheResponse } from '../../middleware/cache';
import { 
    validateCompanyAccess, 
    validateResourceOwnership, 
    companyRateLimit,
    auditSecurityEvent 
} from '../../middleware/multiTenantSecurity';
import {
    getInventory,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    adjustInventoryQuantity,
    deleteInventoryItem,
    checkLowStock,
    getExpiringBatches,
    transferStock,
} from "./controller";
import { inventoryValidators } from "./validators";

const inventoryRoutes = Router();

// Apply JWT authentication to all inventory routes
inventoryRoutes.use(authenticate);

// Apply company-level rate limiting to prevent abuse
inventoryRoutes.use(companyRateLimit(500, 60000) as RequestHandler); // 500 requests per minute per company

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory tracking and management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Inventory:
 *       type: object
 *       required:
 *         - productId
 *         - warehouseId
 *         - quantity
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         productId:
 *           type: string
 *           format: uuid
 *         warehouseId:
 *           type: string
 *           format: uuid
 *         quantity:
 *           type: number
 *           minimum: 0
 *         minQuantity:
 *           type: number
 *         maxQuantity:
 *           type: number
 *         location:
 *           type: string
 *         batchNumber:
 *           type: string
 *         expiryDate:
 *           type: string
 *           format: date
 *         notes:
 *           type: string
 *         lastStockCheck:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [active, inactive, pending]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /inventory/company/{companyId}:
 *   get:
 *     summary: List company inventory
 *     description: Get a paginated list of inventory items for a company
 *     tags: [Inventory]
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *     responses:
 *       200:
 *         description: List of inventory items retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Inventory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.get("/company/:companyId", 
    validateCompanyAccess as RequestHandler,
    auditSecurityEvent('inventory_list_access') as RequestHandler,
    // REMOVED: cacheResponse(60) - inventory data changes frequently and shouldn't be cached
    getInventory as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}/warehouse/{warehouseId}:
 *   get:
 *     summary: Get inventory items for a specific warehouse
 *     tags: [Inventory]
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
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of inventory items in the specified warehouse
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Inventory'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.get("/company/:companyId/warehouse/:warehouseId", 
    validateCompanyAccess as RequestHandler,
    validateResourceOwnership('warehouse') as RequestHandler,
    auditSecurityEvent('inventory_warehouse_access') as RequestHandler,
    getInventory as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}/item/{id}:
 *   get:
 *     summary: Get inventory item
 *     description: Get detailed information about a specific inventory item
 *     tags: [Inventory]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inventory item details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *
 *   patch:
 *     summary: Update inventory item
 *     description: Update details of a specific inventory item
 *     tags: [Inventory]
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
 *         name: id
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
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *               minQuantity:
 *                 type: number
 *               maxQuantity:
 *                 type: number
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending]
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.get("/company/:companyId/item/:id", 
    validateCompanyAccess as RequestHandler,
    validateResourceOwnership('inventory') as RequestHandler,
    auditSecurityEvent('inventory_item_access') as RequestHandler,
    getInventoryItem as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}:
 *   post:
 *     summary: Create a new inventory item
 *     tags: [Inventory]
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
 *               - productId
 *               - warehouseId
 *               - quantity
 *               - unitPrice
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *                 description: Warehouse ID
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *                 description: Initial quantity
 *               unitPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Unit price of the item
 *               minimumStockLevel:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum stock level for notifications
 *               reorderPoint:
 *                 type: number
 *                 minimum: 0
 *                 description: Point at which reordering is recommended
 *               batchNumber:
 *                 type: string
 *                 description: Optional batch number for tracking
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiry date for the inventory item
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.post(
    "/company/:companyId",
    validationHandler(inventoryValidators.createInventory),
    createInventoryItem as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}/item/{id}:
 *   put:
 *     summary: Update an inventory item
 *     tags: [Inventory]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Unit price of the item
 *               minimumStockLevel:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum stock level for notifications
 *               reorderPoint:
 *                 type: number
 *                 minimum: 0
 *                 description: Point at which reordering is recommended
 *               warehouseId:
 *                 type: string
 *                 format: uuid
 *                 description: Warehouse ID if moving to a different warehouse
 *               batchNumber:
 *                 type: string
 *                 description: Batch number for tracking
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expiry date for the inventory item
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
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
inventoryRoutes.put(
    "/company/:companyId/item/:id",
    validationHandler(inventoryValidators.updateInventory),
    updateInventoryItem as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}/item/{id}/adjust:
 *   patch:
 *     summary: Adjust the quantity of an inventory item
 *     tags: [Inventory]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustmentType
 *               - quantity
 *             properties:
 *               adjustmentType:
 *                 type: string
 *                 enum: [add, subtract]
 *                 description: Type of adjustment (add or subtract)
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *                 description: Quantity to add or subtract
 *               reason:
 *                 type: string
 *                 description: Reason for the adjustment
 *               note:
 *                 type: string
 *                 description: Additional notes about the adjustment
 *     responses:
 *       200:
 *         description: Inventory quantity adjusted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Invalid request or insufficient quantity for subtraction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.patch(
    "/company/:companyId/item/:id/adjust",
    validationHandler(inventoryValidators.adjustQuantity),
    adjustInventoryQuantity as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}/transfer:
 *   post:
 *     summary: Transfer inventory
 *     description: Transfer inventory items between warehouses
 *     tags: [Inventory]
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
 *               - sourceWarehouseId
 *               - destinationWarehouseId
 *               - items
 *             properties:
 *               sourceWarehouseId:
 *                 type: string
 *                 format: uuid
 *               destinationWarehouseId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sourceInventory:
 *                   $ref: '#/components/schemas/Inventory'
 *                 destinationInventory:
 *                   $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Invalid request or insufficient quantity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.post(
    "/company/:companyId/transfer",
    validationHandler(inventoryValidators.transferStock),
    transferStock as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}/item/{id}:
 *   delete:
 *     summary: Delete an inventory item
 *     tags: [Inventory]
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
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
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
 *                   example: Inventory item deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.delete("/company/:companyId/item/:id", deleteInventoryItem as RequestHandler);

/**
 * @swagger
 * /inventory/company/{companyId}/low-stock:
 *   get:
 *     summary: Get low stock items
 *     description: Get a list of items with quantity below minimum threshold
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of low stock items retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inventory'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.get("/company/:companyId/low-stock", checkLowStock as RequestHandler);

/**
 * @swagger
 * /inventory/company/{companyId}/expiring-batches:
 *   get:
 *     summary: Get inventory items with expiring batches
 *     tags: [Inventory]
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
 *         name: daysThreshold
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to consider for expiration threshold
 *       - in: query
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional warehouse filter
 *     responses:
 *       200:
 *         description: List of inventory items with expiring batches
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
 *                     type: object
 *                     properties:
 *                       inventory:
 *                         $ref: '#/components/schemas/Inventory'
 *                       daysToExpiry:
 *                         type: integer
 *                         description: Number of days until expiry
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.get("/company/:companyId/expiring-batches", getExpiringBatches as RequestHandler);

export { inventoryRoutes };