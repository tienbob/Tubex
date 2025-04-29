import { Router } from "express";
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
inventoryRoutes.get("/company/:companyId", getInventory);

// Get inventory items for specific warehouse
inventoryRoutes.get("/company/:companyId/warehouse/:warehouseId", getInventory);

// Get specific inventory item
inventoryRoutes.get("/company/:companyId/item/:id", getInventoryItem);

// Create new inventory item
inventoryRoutes.post(
    "/company/:companyId",
    validateRequest(inventoryValidators.createInventory),
    createInventoryItem
);

// Update inventory item
inventoryRoutes.put(
    "/company/:companyId/item/:id",
    validateRequest(inventoryValidators.updateInventory),
    updateInventoryItem
);

// Adjust inventory quantity
inventoryRoutes.patch(
    "/company/:companyId/item/:id/adjust",
    validateRequest(inventoryValidators.adjustQuantity),
    adjustInventoryQuantity
);

// Transfer stock between warehouses
inventoryRoutes.post(
    "/company/:companyId/transfer",
    validateRequest(inventoryValidators.transferStock),
    transferStock
);

// Delete inventory item
inventoryRoutes.delete("/company/:companyId/item/:id", deleteInventoryItem);

// Check low stock items
inventoryRoutes.get("/company/:companyId/low-stock", checkLowStock);

// Get expiring batches
inventoryRoutes.get("/company/:companyId/expiring-batches", getExpiringBatches);

export { inventoryRoutes };