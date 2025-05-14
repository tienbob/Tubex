/**
 * Type definitions for mock service
 */

// Extend window interface to include mockDatabase property
declare global {
  interface Window {
    mockDatabase: {
      users: any[],
      companies: any[]
    };
  }
}

export {};
