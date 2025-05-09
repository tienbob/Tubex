import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

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
    
    // Log detailed 401 error information
    if (error.response?.status === 401) {
      console.log('Authentication error details:', {
        originalUrl: originalRequest.url,
        method: originalRequest.method,
        hasAuthHeader: !!originalRequest.headers?.Authorization,
        responseMessage: error.response?.data?.message || 'No message'
      });
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error('No refresh token available for token refresh');
          throw new Error('No refresh token available');
        }
        
        console.log('Attempting token refresh...');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });
        
        if (response.data?.data?.accessToken) {
          console.log('Token refresh successful');
          localStorage.setItem('access_token', response.data.data.accessToken);
          
          // If refreshToken was also returned, update it
          if (response.data.data.refreshToken) {
            localStorage.setItem('refresh_token', response.data.data.refreshToken);
          }
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return axios(originalRequest);
        } else {
          console.error('Token refresh response did not contain a new access token', response.data);
          throw new Error('Invalid token refresh response');
        }
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError) && refreshError.response) {
          console.error('Token refresh failed:', refreshError, {
            status: refreshError.response.status,
            data: refreshError.response.data
          });
        } else {
          console.error('Token refresh failed:', refreshError, 'No response');
        }
          
        // If refresh token is invalid, clear local storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        
        // Redirect to login page or dispatch a logout action if using Redux
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Generic GET request method
export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.get<T>(url, config);
};

// Generic POST request method
export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return apiClient.post<T>(url, data, config);
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