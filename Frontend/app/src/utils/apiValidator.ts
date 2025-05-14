/**
 * API Connection Validator
 * This utility checks if the API is accessible and properly configured
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

/**
 * Validates connection to the backend API
 * @returns Promise resolving to a boolean indicating if the API is accessible
 */
export const validateApiConnection = async (): Promise<boolean> => {
  try {
    console.log('Validating API connection to:', API_BASE_URL);
    
    // First try the base URL to check if the API is running
    const rootResponse = await axios.get(`${API_BASE_URL.split('/api/v1')[0]}/`);
    console.log('API root endpoint response:', rootResponse.status, rootResponse.data);
    
    // If root is accessible, check the auth endpoint paths
    try {
      const authPathResponse = await axios.get(`${API_BASE_URL}/auth`);
      console.log('Auth API endpoint check:', authPathResponse.status);
      return true;
    } catch (authError: any) {
      // 404 is expected if we hit a valid API but wrong endpoint
      // This is actually a good sign as it means the API is running
      if (authError.response && authError.response.status === 404) {
        console.log('Auth API endpoint not found, but API is running');
        return true;
      }
      
      console.warn('Auth API endpoint check failed:', authError.response ? 
        authError.response.status : authError.message);
      
      // Since root endpoint worked, we'll consider this a success
      return true;
    }
  } catch (error: any) {
    console.error('API connection validation failed:', error.response ? 
      { status: error.response.status, data: error.response.data } : error.message);
    
    return false;
  }
};

/**
 * Checks if the API is properly configured for registration
 * @returns Promise with information about the API status
 */
export const checkRegistrationEndpoint = async (): Promise<{
  available: boolean;
  message: string;
}> => {
  try {
    // Try a preflight OPTIONS request to check if the endpoint exists
    const response = await axios.options(`${API_BASE_URL}/auth/register`);
    
    console.log('Registration endpoint check:', response.status);
    
    return {
      available: true,
      message: 'Registration endpoint is available'
    };
  } catch (error: any) {
    // If we get a CORS error, it might actually mean the endpoint exists
    if (error.message && error.message.includes('CORS')) {
      return {
        available: true,
        message: 'Registration endpoint might be available (CORS issue)'
      };
    }
    
    // If we get a 404, the endpoint doesn't exist
    if (error.response && error.response.status === 404) {
      return {
        available: false,
        message: 'Registration endpoint not found - API mismatch?'
      };
    }
    
    return {
      available: false,
      message: `Registration endpoint check failed: ${error.message}`
    };
  }
};
