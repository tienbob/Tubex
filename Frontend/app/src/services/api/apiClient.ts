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

// Generic GET request method
export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config);
};

// Generic POST request method with enhanced error handling
export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  console.log(`Making POST request to: ${url}`, { data });
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
  return apiClient.put<T>(url, data, config);
};

// Generic PATCH request method
export const patch = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.patch<T>(url, data, config);
};

// Generic DELETE request method
export const del = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.delete<T>(url, config);
};

export default apiClient;