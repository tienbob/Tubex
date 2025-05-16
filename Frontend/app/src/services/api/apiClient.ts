import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { enableMockApi, isMockApiEnabled, toggleMockApi } from '../mock/mockService';
import { API_BASE_URL, USE_MOCK_API } from '../../config/api.config';

// Initialize mock API based on configuration
if (USE_MOCK_API) {
  toggleMockApi(true);
} else {
  toggleMockApi(false);
}

// Debug the API URL
console.log("API Base URL:", API_BASE_URL);

// Debug the API URL
console.log("API Base URL:", API_BASE_URL);

// Create an Axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Set up mock API - this will intercept API calls if enabled
// Comment this line to disable mock API and allow real API calls
// enableMockApi(apiClient);

// Export the toggle function to allow enabling/disabling mock API
export { toggleMockApi, isMockApiEnabled };

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, { 
      headers: config.headers,
      params: config.params,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response [${response.status}]:`, response.data);
    return response;
  },
  async (error) => {
    console.error('API Response Error:', error.response || error.message);
    const originalRequest = error.config;
    
    // Skip token refresh for auth endpoints to avoid infinite loops
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/register')) {
      
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        console.log('Token refresh attempt with originalRequest:', {
          url: originalRequest.url,
          method: originalRequest.method
        });
        
        // Use a fresh axios instance for token refresh to avoid interceptors
        const response = await axios({
          method: 'post',
          url: `${API_BASE_URL}/auth/refresh-token`,
          data: { refreshToken },
          headers: { 'Content-Type': 'application/json' }
        });
        
        const newToken = response.data?.data?.accessToken || 
                         response.data?.accessToken;
                        
        if (newToken) {
          console.log('Token refresh successful, got new token');
          localStorage.setItem('access_token', newToken);
          
          // If refreshToken was also returned, update it
          if (response.data?.data?.refreshToken || response.data?.refreshToken) {
            const newRefreshToken = response.data?.data?.refreshToken || response.data?.refreshToken;
            localStorage.setItem('refresh_token', newRefreshToken);
          }
          
          // Update axios instance auth header
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Update original request auth header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the original request with the new token
          return apiClient(originalRequest);
        } else {
          console.error('Token refresh response did not contain a new access token', response.data);
          throw new Error('Invalid token refresh response');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
          
        // If refresh token is invalid, clear auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        
        // Signal auth required
        window.dispatchEvent(new CustomEvent('auth:required', { 
          detail: { reason: 'token_refresh_failed' } 
        }));
        
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Gets the current company ID from various possible sources
 * @param {boolean} throwOnMissing - Whether to throw an error if company ID is not found
 * @returns {string} The company ID or an empty string
 */
export const getCurrentCompanyId = (throwOnMissing = false): string => {
  try {
    // Try to get from user_info first (this is where authService actually stores the data)
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (userInfo && userInfo.companyId) {
      return userInfo.companyId;
    }
    
    // Try regular user object next
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.companyId) {
      return user.companyId;
    }
    
    // Try alternate localStorage keys that might contain the company ID
    const authData = JSON.parse(localStorage.getItem('auth') || '{}');
    if (authData && authData.user && authData.user.companyId) {
      return authData.user.companyId;
    }
    
    // Try session storage as a fallback
    const sessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (sessionUser && sessionUser.companyId) {
      return sessionUser.companyId;
    }
    
    console.warn('No company ID found in user data');
    
    if (throwOnMissing) {
      throw new Error('Company ID not available');
    }
    
    return '';
  } catch (error) {
    console.error('Error retrieving company ID:', error);
    if (throwOnMissing) {
      throw new Error('Company ID not available');
    }
    return '';
  }
};

/**
 * Creates a company-specific URL with consistent pattern
 * @param resourceType The API resource type (products, orders, etc.)
 * @param resourceId Optional specific resource ID
 * @param action Optional action to perform on the resource
 * @returns Formatted URL string
 */
export const createCompanyResourceUrl = (
  resourceType: string, 
  resourceId?: string,
  action?: string
): string => {
  const companyId = getCurrentCompanyId(true);
  
  let url = `/${resourceType}/company/${companyId}`;
  if (resourceId) {
    url += `/${resourceId}`;
  }
  if (action) {
    url += `/${action}`;
  }
  
  return url;
};

// Example usage:
// createCompanyResourceUrl('products') => '/products/company/companyId'
// createCompanyResourceUrl('orders', '123') => '/orders/company/companyId/123'
// createCompanyResourceUrl('inventory', '456', 'adjust') => '/inventory/company/companyId/456/adjust'

// Enhance get function to automatically include companyId for company-specific endpoints
export const getWithCompany = async <T>(url: string, options?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available for this request');
  }
  
  // Modify URL to include companyId if it's not already a company-specific endpoint
  const companyUrl = url.includes('/company/') ? url : `/company/${companyId}${url}`;
  
  return get<T>(companyUrl, options);
};

// Add request logging
const logRequest = (method: string, url: string, config?: AxiosRequestConfig) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`API ${method.toUpperCase()} Request:`, url, config);
  }
};

// Generic GET request method
export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  logRequest('GET', url, config);
  return apiClient.get<T>(url, config);
};

// Generic POST request method with enhanced error handling
export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  logRequest('POST', url, config);
  return apiClient.post<T>(url, data, config)
    .then(response => {
      console.log(`POST ${url} success:`, response.data);
      return response;
    })
    .catch(error => {
      console.error(`POST ${url} failed:`, error.response ? {
        status: error.response.status,
        data: error.response.data
      } : error.message);
      throw error;
    });
};

// Generic PUT request method
export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  logRequest('PUT', url, config);
  return apiClient.put<T>(url, data, config);
};

// Generic PATCH request method
export const patch = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  logRequest('PATCH', url, config);
  return apiClient.patch<T>(url, data, config);
};

// Generic DELETE request method
export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  logRequest('DELETE', url, config);
  return apiClient.delete<T>(url, config);
};

// File download method for handling binary responses
export const getFile = (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> => {
  logRequest('GET (File)', url, config);
  return apiClient.get(url, {
    ...config,
    responseType: 'blob',
  });
};

// File upload method for handling form data and files
export const uploadFile = <T>(url: string, file: File, additionalData?: object, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add any additional data to the form
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
  }

  logRequest('POST (File Upload)', url, { ...config, data: { filename: file.name, size: file.size, type: file.type } });
  
  return apiClient.post<T>(url, formData, {
    ...config,
    headers: {
      ...(config?.headers || {}),
      'Content-Type': 'multipart/form-data',
    }
  });
};

export default apiClient;