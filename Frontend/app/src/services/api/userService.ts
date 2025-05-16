import { get, post, patch, del, getWithCompany, getCurrentCompanyId } from './apiClient';
import { AxiosError } from 'axios';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  data: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  status: string;
  data: User;
}

export interface UsersListResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UserCreateRequest {
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
}

/**
 * Service for handling user-related API calls
 */
export const userService = {
  /**
   * Get all users with pagination and filtering
   */
  getUsers: async (params?: any): Promise<any> => {
    try {
      const companyId = getCurrentCompanyId(true); // Will throw if company ID is not available
      
      // Use consistent URL pattern: /users/company/{companyId}
      const response = await get<any>(`/users/company/${companyId}`, {
        params: {
          limit: 10,
          page: 1,
          ...params
        }
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch users',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get a single user by ID
   */
  getUserById: async (id: string): Promise<UserResponse> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      if (!id || typeof id !== 'string') {
        throw new Error('Valid user ID is required');
      }
      
      const response = await get<UserResponse>(`/users/company/${companyId}/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch user: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (userData: UserCreateRequest): Promise<UserResponse> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      // Basic validation
      if (!userData.name || !userData.email || !userData.role || !userData.password) {
        throw new Error('All fields are required');
      }
      
      const response = await post<UserResponse>(`/users/company/${companyId}`, userData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create user',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update a user's details
   */
  updateUser: async (id: string, userData: UserUpdateRequest): Promise<UserResponse> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      if (!id || typeof id !== 'string') {
        throw new Error('Valid user ID is required');
      }
      
      const response = await patch<UserResponse>(`/users/company/${companyId}/${id}`, userData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update user: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string): Promise<{success: boolean, message: string}> => {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      if (!id || typeof id !== 'string') {
        throw new Error('Valid user ID is required');
      }
      
      const response = await del<{success: boolean, message: string}>(`/users/company/${companyId}/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete user: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};