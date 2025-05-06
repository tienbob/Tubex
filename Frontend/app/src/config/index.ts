/**
 * Configuration module index file
 * Export all configuration settings for easier imports
 */

export * from './api';
export * from './theme';

// Application-wide constants
export const APP_NAME = 'Tubex';
export const APP_VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_WHITE_LABELING: true,
};

// Global application settings
export const SETTINGS = {
  DEFAULT_PAGINATION_LIMIT: 10,
  DATE_FORMAT: 'MM/DD/YYYY',
  CURRENCY_FORMAT: 'USD',
};