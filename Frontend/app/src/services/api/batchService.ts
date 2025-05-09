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

export interface Batch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  supplier_id: string;
  status: string; // Added the missing 'status' property
}

export interface BatchCreateInput {
  product_id: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  supplier_id: string;
}

export interface BatchUpdateInput {
  batch_number?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  quantity?: number;
}

export interface BatchListParams {
  page?: number;
  limit?: number;
  product_id?: string;
  supplier_id?: string;
  expiry_before?: string;
  expiry_after?: string;
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

export interface ExpiringBatchesResponse {
  status: string;
  data: Array<{
    batch_id: string;
    batch_number: string;
    product_id: string;
    product_name: string;
    expiry_date: string;
    remaining_days: number;
    quantity: number;
    warehouse_id: string;
    warehouse_name: string;
  }>;
}

/**
 * Batch Management Service - Handles operations related to product batches
 */
export const batchService = {
  /**
   * Get all batches with optional filtering
   */
  getBatches: async (params: BatchListParams = {}): Promise<PaginationResponse<Batch>> => {
    try {
      const response = await get<PaginationResponse<Batch>>('/batches', { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch batches',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get a specific batch by ID
   */
  getBatch: async (batchId: string): Promise<Batch> => {
    try {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      
      const response = await get<{data: Batch}>(`/batches/${batchId}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch batch: ${batchId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create a new batch
   */
  createBatch: async (data: BatchCreateInput): Promise<Batch> => {
    try {
      // Input validation
      if (!data.product_id) {
        throw new Error('Product ID is required');
      }
      
      if (!data.batch_number || data.batch_number.trim() === '') {
        throw new Error('Batch number is required');
      }
      
      if (!data.supplier_id) {
        throw new Error('Supplier ID is required');
      }
      
      if (typeof data.quantity !== 'number' || data.quantity <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      
      // Validate dates
      if (!data.manufacturing_date) {
        throw new Error('Manufacturing date is required');
      }
      
      if (!data.expiry_date) {
        throw new Error('Expiry date is required');
      }
      
      const manufacturingDate = new Date(data.manufacturing_date);
      const expiryDate = new Date(data.expiry_date);
      
      if (isNaN(manufacturingDate.getTime())) {
        throw new Error('Invalid manufacturing date format');
      }
      
      if (isNaN(expiryDate.getTime())) {
        throw new Error('Invalid expiry date format');
      }
      
      if (expiryDate <= manufacturingDate) {
        throw new Error('Expiry date must be after manufacturing date');
      }
      
      const response = await post<{data: Batch}>('/batches', data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create batch',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update an existing batch
   */
  updateBatch: async (batchId: string, data: BatchUpdateInput): Promise<Batch> => {
    try {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      
      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }
      
      // Input validation for quantity if provided
      if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity <= 0)) {
        throw new Error('Quantity must be a positive number');
      }
      
      // Validate dates if provided
      if (data.manufacturing_date && isNaN(new Date(data.manufacturing_date).getTime())) {
        throw new Error('Invalid manufacturing date format');
      }
      
      if (data.expiry_date && isNaN(new Date(data.expiry_date).getTime())) {
        throw new Error('Invalid expiry date format');
      }
      
      // If both dates are provided, validate expiry is after manufacturing
      if (data.manufacturing_date && data.expiry_date) {
        const manufacturingDate = new Date(data.manufacturing_date);
        const expiryDate = new Date(data.expiry_date);
        
        if (expiryDate <= manufacturingDate) {
          throw new Error('Expiry date must be after manufacturing date');
        }
      }
      
      const response = await put<{data: Batch}>(`/batches/${batchId}`, data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update batch: ${batchId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Delete a batch
   */
  deleteBatch: async (batchId: string): Promise<void> => {
    try {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      
      await del(`/batches/${batchId}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete batch: ${batchId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get batches that are about to expire
   */
  getExpiringBatches: async (daysThreshold: number = 30): Promise<ExpiringBatchesResponse> => {
    try {
      if (typeof daysThreshold !== 'number' || daysThreshold <= 0) {
        throw new Error('Days threshold must be a positive number');
      }
      
      const response = await get<ExpiringBatchesResponse>('/batches/expiring', { 
        params: { daysThreshold } 
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch expiring batches',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get batches for a specific product
   */
  getProductBatches: async (productId: string): Promise<PaginationResponse<Batch>> => {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      const response = await get<PaginationResponse<Batch>>(`/products/${productId}/batches`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch batches for product: ${productId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};