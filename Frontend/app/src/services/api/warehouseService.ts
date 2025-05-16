import axios, { AxiosError } from 'axios';
import { get, post, put, del, getCurrentCompanyId } from './apiClient';

export interface ApiResponse<T> {
  data: T;
  status?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  capacity: number;
  company_id: string;
  contact_info?: ContactInfo;
  type: 'main' | 'secondary' | 'distribution' | 'storage';
  status: 'active' | 'inactive' | 'under_maintenance';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CapacityUsage {
  totalCapacity: number;
  currentUsage: number;
  availableCapacity: number;
  utilizationPercentage: number;
}

export interface WarehouseCreateInput {
  name: string;
  address: string;
  capacity?: number;
  contactInfo?: ContactInfo;
  type?: 'main' | 'secondary' | 'distribution' | 'storage';
  notes?: string;
}

export interface WarehouseUpdateInput {
  name?: string;
  address?: string;
  capacity?: number;
  contactInfo?: ContactInfo;
  type?: 'main' | 'secondary' | 'distribution' | 'storage';
  status?: 'active' | 'inactive' | 'under_maintenance';
  notes?: string;
}

export interface WarehouseListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  company_id?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const warehouseService = {  getWarehouses: async (params?: any): Promise<any> => {
    try {
      const companyId = getCurrentCompanyId(true);
      
      // Use consistent URL pattern with correct API path
      const response = await get<any>(`/warehouses/company/${companyId}`, {
        params: {
          limit: 10,
          page: 1,
          ...params
        }
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.response?.data?.message || 'Failed to fetch warehouses');
      }
      throw error;
    }
  },    getWarehouse: async (companyId: string, warehouseId: string): Promise<ApiResponse<Warehouse>> => {
    if (!warehouseId || typeof warehouseId !== 'string') {
      return Promise.reject(new ApiError('Valid warehouse ID is required'));
    }
    
    // Use get from apiClient instead of direct axios call
    try {
      const response = await get<ApiResponse<Warehouse>>(`/warehouses/company/${companyId}/${warehouseId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.response?.data?.message || `Failed to fetch warehouse: ${warehouseId}`);
      }
      throw error;
    }
  },  createWarehouse: async (companyId: string, data: WarehouseCreateInput): Promise<ApiResponse<Warehouse>> => {
    if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
      return Promise.reject(new ApiError('Valid company ID is required'));
    }
    
    // Use post from apiClient instead of direct axios call
    try {
      const response = await post<ApiResponse<Warehouse>>(`/warehouses/company/${companyId}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.response?.data?.message || 'Failed to create warehouse');
      }
      throw error;
    }
  },

  updateWarehouse: async (companyId: string, warehouseId: string, data: WarehouseUpdateInput): Promise<ApiResponse<Warehouse>> => {
    if (!warehouseId || typeof warehouseId !== 'string') {
      return Promise.reject(new ApiError('Valid warehouse ID is required'));
    }
    
    // Use put from apiClient instead of direct axios call
    try {
      const response = await put<ApiResponse<Warehouse>>(`/warehouses/${warehouseId}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.response?.data?.message || `Failed to update warehouse: ${warehouseId}`);
      }
      throw error;
    }
  },

  deleteWarehouse: async (companyId: string, warehouseId: string): Promise<ApiResponse<void>> => {
    if (!warehouseId || typeof warehouseId !== 'string') {
      return Promise.reject(new ApiError('Valid warehouse ID is required'));
    }
    
    // Use del from apiClient instead of direct axios call
    try {
      const response = await del<ApiResponse<void>>(`/warehouses/${warehouseId}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(error.response?.data?.message || `Failed to delete warehouse: ${warehouseId}`);
      }
      throw error;
    }
  }
};
