import { get, post, put, del } from './apiClient';
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

/**
 * Warehouse Management Service - Handles operations related to warehouses
 */
export const warehouseService = {
  /**
   * Get all warehouses for a company with optional filtering
   */
  getWarehouses: async (companyId: string, params: WarehouseListParams = {}): Promise<PaginationResponse<Warehouse>> => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await get<{data: {warehouses: Warehouse[], pagination: any}}>(`/warehouse/company/${companyId}`, { params });
      return {
        data: response.data.data.warehouses,
        pagination: response.data.data.pagination
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch warehouses',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get a specific warehouse by ID
   */
  getWarehouse: async (companyId: string, warehouseId: string): Promise<Warehouse> => {
    try {
      if (!companyId || !warehouseId) {
        throw new Error('Company ID and Warehouse ID are required');
      }
      
      const response = await get<{status: string, data: Warehouse}>(`/warehouse/company/${companyId}/${warehouseId}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch warehouse: ${warehouseId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Create a new warehouse for a company
   */
  createWarehouse: async (companyId: string, data: WarehouseCreateInput): Promise<Warehouse> => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      // Input validation
      if (!data.name || data.name.trim() === '') {
        throw new Error('Warehouse name is required');
      }
      
      if (!data.address || data.address.trim() === '') {
        throw new Error('Warehouse address is required');
      }
      
      const response = await post<{status: string, data: Warehouse}>(`/warehouse/company/${companyId}`, {
        name: data.name,
        address: data.address,
        capacity: data.capacity,
        contactInfo: data.contactInfo,
        type: data.type,
        notes: data.notes
      });
      
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create warehouse',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Update an existing warehouse
   */
  updateWarehouse: async (companyId: string, warehouseId: string, data: WarehouseUpdateInput): Promise<Warehouse> => {
    try {
      if (!companyId || !warehouseId) {
        throw new Error('Company ID and Warehouse ID are required');
      }
      
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }
      
      // Input validation for capacity if provided
      if (data.capacity !== undefined && (typeof data.capacity !== 'number' || data.capacity <= 0)) {
        throw new Error('Warehouse capacity must be a positive number');
      }
      
      const response = await put<{status: string, data: Warehouse}>(
        `/warehouse/company/${companyId}/${warehouseId}`, 
        {
          name: data.name,
          address: data.address,
          capacity: data.capacity,
          contactInfo: data.contactInfo,
          type: data.type,
          status: data.status,
          notes: data.notes
        }
      );
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update warehouse: ${warehouseId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Delete a warehouse
   */
  deleteWarehouse: async (companyId: string, warehouseId: string): Promise<void> => {
    try {
      if (!companyId || !warehouseId) {
        throw new Error('Company ID and Warehouse ID are required');
      }
      
      await del(`/warehouse/company/${companyId}/${warehouseId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete warehouse: ${warehouseId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Change warehouse status (active, inactive, under_maintenance)
   */
  updateWarehouseStatus: async (
    companyId: string,
    warehouseId: string, 
    status: 'active' | 'inactive' | 'under_maintenance'
  ): Promise<Warehouse> => {
    try {
      if (!companyId || !warehouseId) {
        throw new Error('Company ID and Warehouse ID are required');
      }
      
      const validStatuses = ['active', 'inactive', 'under_maintenance'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be one of: active, inactive, under_maintenance');
      }
      
      // Using the general update endpoint with only status field
      const response = await put<{status: string, data: Warehouse}>(
        `/warehouse/company/${companyId}/${warehouseId}`, 
        { status }
      );
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update warehouse status: ${warehouseId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Get inventory inside a specific warehouse
   */
  getWarehouseInventory: async (companyId: string, warehouseId: string, params: { page?: number; limit?: number; } = {}): Promise<any> => {
    try {
      if (!companyId || !warehouseId) {
        throw new Error('Company ID and Warehouse ID are required');
      }
      
      // Note: This endpoint might need to be updated if inventory service has changed
      // Currently assuming we still use the inventory service endpoint
      const response = await get(`/inventory/warehouse/${warehouseId}`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch inventory for warehouse: ${warehouseId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Get warehouse capacity usage information
   */
  getCapacityUsage: async (companyId: string, warehouseId: string): Promise<{warehouse: Warehouse, capacityUsage: CapacityUsage}> => {
    try {
      if (!companyId || !warehouseId) {
        throw new Error('Company ID and Warehouse ID are required');
      }
      
      const response = await get<{status: string, data: {warehouse: Warehouse, capacityUsage: CapacityUsage}}>(
        `/warehouse/company/${companyId}/${warehouseId}/capacity`
      );
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch capacity usage for warehouse: ${warehouseId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};