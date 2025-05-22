import { get, post, put, patch, del, getWithCompany, getCurrentCompanyId } from './apiClient';
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

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface InventoryItem {
  id: string;
  product_id: string;
  quantity: number;
  batch_number?: string;
  location?: string;
  company_id: string;
  warehouse_id: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder?: boolean;
  product?: {
    name: string;
    sku: string;
  };
  warehouse?: {
    name: string;
  };
}

export interface InventoryCreateInput {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder?: boolean;
}

export interface StockAdjustment {
  adjustment: number;
  reason: string;
  batch_number?: string;
  manufacturing_date?: string;
  expiry_date?: string;
}

export interface StockTransfer {
  source_warehouse_id: string;
  target_warehouse_id: string;
  product_id: string;
  quantity: number;
  batch_numbers?: string[];
}

export interface GetInventoryParams {
  companyId: string;
  page?: number;
  limit?: number;
  warehouseId?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  searchTerm?: string;
  status?: string;
  [key: string]: any;  // Allow additional properties
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface LowStockItem {
  product_id: string;
  product_name: string;
  current_quantity: number;
  threshold: number;
  warehouse_id: string;
  warehouse_name: string;
}

export interface ExpiringBatchItem {
  batch_id: string;
  batch_number: string;
  product_id: string;
  product_name: string;
  expiry_date: string;
  remaining_days: number;
  quantity: number;
  warehouse_id: string;
  warehouse_name: string;
}

export interface InventoryTransferRequest {
  product_id: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  batch_id?: string;
  quantity: number;
  notes?: string;
}

export interface InventoryAuditLog {
  id: string;
  inventory_id: string;
  product_id: string;
  warehouse_id: string;
  previous_quantity: number;
  new_quantity: number;
  change_type: 'addition' | 'reduction' | 'transfer_in' | 'transfer_out' | 'adjustment';
  reference_id?: string;
  created_by: string;
  created_at: string;
}

export const inventoryService = {
  async getInventory(params: GetInventoryParams): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const companyId = params?.companyId || getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      // Remove companyId from params if it was included there
      const { companyId: _, ...restParams } = params || {};
      
      const endpoint = `/inventory/company/${companyId}${params.warehouseId ? `/warehouse/${params.warehouseId}` : ''}`;
      
      const response = await get<ApiResponse<InventoryItem[]>>(endpoint, {
        params: restParams
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch inventory data',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getInventoryItem(id: string): Promise<ApiResponse<InventoryItem>> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid inventory item ID is required');
      }
      
      const companyId = getCurrentCompanyId();
      console.log('Company ID:', companyId);
      // Ensure companyId is available
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      // Updated URL pattern to include company context
      const response = await get<ApiResponse<InventoryItem>>(`/inventory/company/${companyId}/item/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch inventory item: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async createInventoryItem(data: InventoryCreateInput): Promise<ApiResponse<InventoryItem>> {
    try {
      // Input validation
      if (!data.product_id) {
        throw new Error('Product ID is required');
      }
      
      if (!data.warehouse_id) {
        throw new Error('Warehouse ID is required');
      }
      
      if (data.quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }
      
      const response = await post<ApiResponse<InventoryItem>>('/inventory', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create inventory item',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async updateInventoryItem(id: string, data: Partial<InventoryCreateInput>): Promise<ApiResponse<InventoryItem>> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid inventory item ID is required');
      }
      
      // Input validation for quantity if provided
      if (data.quantity !== undefined && data.quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }
      
      const response = await put<ApiResponse<InventoryItem>>(`/inventory/${id}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update inventory item: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async adjustInventoryQuantity(companyId: string, id: string, data: StockAdjustment): Promise<ApiResponse<InventoryItem>> {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      if (!id || typeof id !== 'string') {
        throw new Error('Valid inventory item ID is required');
      }
      
      if (!data.reason || data.reason.trim() === '') {
        throw new Error('Adjustment reason is required');
      }
      
      const response = await patch<ApiResponse<InventoryItem>>(
        `/inventory/company/${companyId}/item/${id}/adjust`,
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to adjust inventory quantity for item: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getWarehouses(companyId: string): Promise<ApiResponse<{ id: string; name: string }[]>> {
    try {
      if (!companyId || typeof companyId !== 'string') {
        throw new Error('Invalid company ID');      }
      
      // Use the get function from apiClient instead of axios
      const response = await get<ApiResponse<{ id: string; name: string }[]>>(`/warehouses/company/${companyId}`);
      return response.data;
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

  async transferStock(data: StockTransfer): Promise<ApiResponse<InventoryItem>> {
    try {
      // Input validation
      if (!data.source_warehouse_id) {
        throw new Error('Source warehouse ID is required');
      }
      
      if (!data.target_warehouse_id) {
        throw new Error('Target warehouse ID is required');
      }
      
      if (!data.product_id) {
        throw new Error('Product ID is required');
      }
      
      if (data.quantity <= 0) {
        throw new Error('Transfer quantity must be greater than 0');
      }
      
      if (data.source_warehouse_id === data.target_warehouse_id) {
        throw new Error('Source and target warehouses cannot be the same');
      }
      
      const response = await post<ApiResponse<InventoryItem>>('/inventory/transfer', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to transfer stock',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getInventorySummary(companyId: string): Promise<ApiResponse<any>> {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await get<ApiResponse<any>>(`/inventory/company/${companyId}/summary`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch inventory summary',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getLowStockAlerts(companyId: string): Promise<ApiResponse<InventoryItem[]>> {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await get<ApiResponse<InventoryItem[]>>(`/inventory/company/${companyId}/low-stock`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch low stock alerts',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  adjustInventory(inventoryId: string, adjustmentData: { adjustment: number; reason: string; reference?: string }): Promise<ApiResponse<void>> {
    return post(`/inventory/${inventoryId}/adjust`, adjustmentData);
  },

  async getLowStockItems(companyId: string): Promise<ApiResponse<LowStockItem[]>> {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await get<ApiResponse<LowStockItem[]>>(`/inventory/company/${companyId}/low-stock`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch low stock items',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  async getExpiringBatches(companyId: string, daysThreshold: number = 30): Promise<ApiResponse<ExpiringBatchItem[]>> {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const response = await get<ApiResponse<ExpiringBatchItem[]>>(
        `/inventory/company/${companyId}/expiring-batches`, 
        { params: { days: daysThreshold } }
      );
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
  
  async transferInventory(data: InventoryTransferRequest): Promise<ApiResponse<InventoryItem>> {
    try {
      if (!data.product_id) {
        throw new Error('Product ID is required');
      }
      
      if (!data.source_warehouse_id) {
        throw new Error('Source warehouse ID is required');
      }
      
      if (!data.destination_warehouse_id) {
        throw new Error('Destination warehouse ID is required');
      }
      
      if (data.quantity <= 0) {
        throw new Error('Transfer quantity must be greater than 0');
      }
      
      if (data.source_warehouse_id === data.destination_warehouse_id) {
        throw new Error('Source and destination warehouses cannot be the same');
      }
      
      const response = await post<ApiResponse<InventoryItem>>('/inventory/transfer', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to transfer inventory',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  async getInventoryAuditLog(inventoryId: string, params: PaginationParams = {}): Promise<ApiResponse<InventoryAuditLog[]>> {
    try {
      if (!inventoryId) {
        throw new Error('Inventory ID is required');
      }
      
      const response = await get<ApiResponse<InventoryAuditLog[]>>(
        `/inventory/${inventoryId}/audit-log`,
        { params }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch inventory audit log',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  async getProductInventorySummary(productId: string): Promise<ApiResponse<{
    product_id: string;
    product_name: string;
    total_quantity: number;
    locations: {
      warehouse_id: string;
      warehouse_name: string;
      quantity: number;
    }[];
  }>> {
    try {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      
      const response = await get<ApiResponse<{
        product_id: string;
        product_name: string;
        total_quantity: number;
        locations: {
          warehouse_id: string;
          warehouse_name: string;
          quantity: number;
        }[];
      }>>(`/inventory/product/${productId}/summary`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch product inventory summary',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
}
