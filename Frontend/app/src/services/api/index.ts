/**
 * API Services module index file
 * Export all API services for easier imports
 */

// Export API client and utilities
export { default as apiClient, get, post, put, patch, del } from './apiClient';

// Export service modules
export { default as productService } from './productService';
export { default as orderService } from './orderService';
export { default as inventoryService } from './inventoryService';
export { default as authService } from './authService';

// Add additional service exports here as needed