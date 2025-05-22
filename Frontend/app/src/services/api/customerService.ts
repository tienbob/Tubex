import { get } from './apiClient';
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

export interface Customer {
  id: string;
  name: string;
  type: 'dealer' | 'supplier';
  contactPhone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  status?: string;
  metadata?: Record<string, any>;
}

export interface CustomersResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Service for handling customer-related API calls
 */
const customerService = {
  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid customer ID is required');
      }
      
      const response = await get<{ success: boolean; data: Customer }>(`/companies/${id}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || `Failed to fetch customer: ${id}`,
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError(`Failed to fetch customer: ${id}`, 500);
    }
  },

  /**
   * Get multiple customers by IDs in a single batch request
   */
  async getCustomersByIds(ids: string[]): Promise<Record<string, Customer>> {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return {};
      }
      
      const response = await get<{ success: boolean; data: Customer[] }>('/companies/batch', {
        params: { ids: ids.join(',') }
      });
      
      // Convert array to dictionary with ID as key for easier lookup
      const customersMap: Record<string, Customer> = {};
      response.data.data.forEach(customer => {
        customersMap[customer.id] = customer;
      });
      
      return customersMap;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to fetch customers',
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to fetch customers', 500);
    }
  },

  /**
   * Search customers with optional filters
   */
  async searchCustomers(params?: any): Promise<CustomersResponse> {
    try {
      const response = await get<{ success: boolean; data: Customer[]; pagination: any }>('/companies', {
        params: {
          limit: 10,
          page: 1,
          type: 'dealer', // Only get dealers, as they're considered customers
          ...params
        }
      });
      
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to search customers',
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to search customers', 500);
    }
  }
};

export default customerService;
