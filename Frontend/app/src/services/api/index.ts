/**
 * API Services module index file
 * Export all API services for easier imports
 */

// Export API client and utilities
export { default as apiClient, get, post, put, patch, del } from './apiClient';

// Export service modules
export { productService } from './productService';
export { orderService } from './orderService';
export { inventoryService } from './inventoryService';
export { authService } from './authService';
export { companyVerificationService } from './companyVerificationService';
export * from './userManagementService';
export { default as userManagementService } from './userManagementService';
export { warehouseService } from './warehouseService';
export { batchService } from './batchService';
export { reportService } from './reportService';
export { dashboardService } from './dashboardService';

// Add additional service exports here as needed
export { companyService } from './companyService';
