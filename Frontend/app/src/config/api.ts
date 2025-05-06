/**
 * API configuration file
 * Contains all API endpoints and configuration settings
 */

// Base API URL from environment variable or default
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// API endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },
  PRODUCTS: {
    BASE: '/products',
    DETAILS: (id: string) => `/products/${id}`,
  },
  ORDERS: {
    BASE: '/orders',
    DETAILS: (id: string) => `/orders/${id}`,
  },
  INVENTORY: {
    BASE: '/inventory',
    COMPANY: (companyId: string) => `/inventory/company/${companyId}`,
    LOW_STOCK: (companyId: string) => `/inventory/company/${companyId}/low-stock`,
  },
  ADMIN: {
    VERIFY_EMPLOYEE: '/admin/verify-employee',
    USERS: '/admin/users',
  }
};

// API request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

// Number of retries for failed requests
export const MAX_RETRIES = 3;