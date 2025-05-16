import { createCompanyResourceUrl } from '../services/api/apiClient';

/**
 * Tests API endpoint patterns against known working patterns
 */
export const validateEndpointPattern = (endpoint: string): boolean => {
  // Pattern should be: /resourceType/company/{companyId}/...
  const pattern = /^\/[a-zA-Z-]+\/company\/[a-zA-Z0-9-]+/;
  return pattern.test(endpoint);
};

export const testApiEndpoints = () => {
  const testCases = [
    createCompanyResourceUrl('inventory'),
    createCompanyResourceUrl('orders'),
    createCompanyResourceUrl('products'),
    createCompanyResourceUrl('users'),
  ];
  
  console.group('API Endpoint Pattern Tests');
  testCases.forEach(endpoint => {
    const isValid = validateEndpointPattern(endpoint);
    console.log(`${endpoint}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
  });
  console.groupEnd();
};
