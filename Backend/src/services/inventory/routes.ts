import { Router, RequestHandler } from "express";
import { authenticate } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validation";
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

/**
 * @swagger
 * /inventory/company/{companyId}:
 *   get:
 *     summary: Get all inventory items for a company
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, quantity, updatedAt]
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of inventory items
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.get("/company/:companyId", getInventory as RequestHandler);

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
inventoryRoutes.get("/company/:companyId/warehouse/:warehouseId", getInventory as RequestHandler);

/**
 * @swagger
 * /inventory/company/{companyId}/item/{id}:
 *   get:
 *     summary: Get a specific inventory item
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
 *         description: Inventory item details
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
inventoryRoutes.get("/company/:companyId/item/:id", getInventoryItem as RequestHandler);

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
    validateRequest(inventoryValidators.createInventory),
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
    validateRequest(inventoryValidators.updateInventory),
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
    validateRequest(inventoryValidators.adjustQuantity),
    adjustInventoryQuantity as RequestHandler
);

/**
 * @swagger
 * /inventory/company/{companyId}/transfer:
 *   post:
 *     summary: Transfer stock between warehouses
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
 *               - sourceInventoryId
 *               - destinationWarehouseId
 *               - quantity
 *             properties:
 *               sourceInventoryId:
 *                 type: string
 *                 format: uuid
 *                 description: Source inventory item ID
 *               destinationWarehouseId:
 *                 type: string
 *                 format: uuid
 *                 description: Destination warehouse ID
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Quantity to transfer
 *               note:
 *                 type: string
 *                 description: Optional notes about the transfer
 *     responses:
 *       200:
 *         description: Stock transferred successfully
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
 *                     sourceInventory:
 *                       $ref: '#/components/schemas/Inventory'
 *                     destinationInventory:
 *                       $ref: '#/components/schemas/Inventory'
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
    validateRequest(inventoryValidators.transferStock),
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
 *     summary: Get inventory items with stock below minimum levels
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
 *         name: warehouseId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional warehouse filter
 *     responses:
 *       200:
 *         description: List of low stock items
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
 *                     $ref: '#/components/schemas/Inventory'
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