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

// Get all inventory items for a company
inventoryRoutes.get("/company/:companyId", getInventory as RequestHandler);

// Get inventory items for specific warehouse
inventoryRoutes.get("/company/:companyId/warehouse/:warehouseId", getInventory as RequestHandler);

// Get specific inventory item
inventoryRoutes.get("/company/:companyId/item/:id", getInventoryItem as RequestHandler);

// Create new inventory item
inventoryRoutes.post(
    "/company/:companyId",
    validateRequest(inventoryValidators.createInventory),
    createInventoryItem as RequestHandler
);

// Update inventory item
inventoryRoutes.put(
    "/company/:companyId/item/:id",
    validateRequest(inventoryValidators.updateInventory),
    updateInventoryItem as RequestHandler
);

// Adjust inventory quantity
inventoryRoutes.patch(
    "/company/:companyId/item/:id/adjust",
    validateRequest(inventoryValidators.adjustQuantity),
    adjustInventoryQuantity as RequestHandler
);

// Transfer stock between warehouses
inventoryRoutes.post(
    "/company/:companyId/transfer",
    validateRequest(inventoryValidators.transferStock),
    transferStock as RequestHandler
);

// Delete inventory item
inventoryRoutes.delete("/company/:companyId/item/:id", deleteInventoryItem as RequestHandler);

// Check low stock items
inventoryRoutes.get("/company/:companyId/low-stock", checkLowStock as RequestHandler);

// Get expiring batches
inventoryRoutes.get("/company/:companyId/expiring-batches", getExpiringBatches as RequestHandler);

export { inventoryRoutes };