import { get, post, put, patch, del } from './apiClient';

interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  company_id: string;
  quantity: number;
  minimum_stock: number;
  product?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
    unit: string;
  };
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
  batches?: Batch[];
}

interface Batch {
  id: string;
  inventory_id: string;
  batch_number: string;
  production_date: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
}

interface InventoryResponse {
  status: string;
  data: Inventory;
}

interface InventoryListResponse {
  status: string;
  data: Inventory[];
}

interface InventoryCreateRequest {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  minimum_stock?: number;
}

interface InventoryUpdateRequest {
  warehouse_id?: string;
  quantity?: number;
  minimum_stock?: number;
}

interface InventoryAdjustRequest {
  quantity: number;
  reason: string;
}

interface InventoryTransferRequest {
  from_warehouse_id: string;
  to_warehouse_id: string;
  product_id: string;
  quantity: number;
}

/**
 * Service for handling inventory-related API calls
 */
const inventoryService = {
  /**
   * Get all inventory items for a company
   */
  getInventory: async (companyId: string): Promise<InventoryListResponse> => {
    const response = await get<InventoryListResponse>(`/inventory/company/${companyId}`);
    return response.data;
  },

  /**
   * Get inventory items for a specific warehouse
   */
  getWarehouseInventory: async (companyId: string, warehouseId: string): Promise<InventoryListResponse> => {
    const response = await get<InventoryListResponse>(`/inventory/company/${companyId}/warehouse/${warehouseId}`);
    return response.data;
  },

  /**
   * Get a specific inventory item
   */
  getInventoryItem: async (companyId: string, id: string): Promise<InventoryResponse> => {
    const response = await get<InventoryResponse>(`/inventory/company/${companyId}/item/${id}`);
    return response.data;
  },

  /**
   * Create a new inventory item
   */
  createInventoryItem: async (companyId: string, data: InventoryCreateRequest): Promise<InventoryResponse> => {
    const response = await post<InventoryResponse>(`/inventory/company/${companyId}`, data);
    return response.data;
  },

  /**
   * Update an inventory item
   */
  updateInventoryItem: async (companyId: string, id: string, data: InventoryUpdateRequest): Promise<InventoryResponse> => {
    const response = await put<InventoryResponse>(`/inventory/company/${companyId}/item/${id}`, data);
    return response.data;
  },

  /**
   * Adjust inventory quantity
   */
  adjustInventoryQuantity: async (companyId: string, id: string, data: InventoryAdjustRequest): Promise<InventoryResponse> => {
    const response = await patch<InventoryResponse>(`/inventory/company/${companyId}/item/${id}/adjust`, data);
    return response.data;
  },

  /**
   * Delete inventory item
   */
  deleteInventoryItem: async (companyId: string, id: string): Promise<any> => {
    const response = await del<any>(`/inventory/company/${companyId}/item/${id}`);
    return response.data;
  },

  /**
   * Check low stock items
   */
  checkLowStock: async (companyId: string): Promise<InventoryListResponse> => {
    const response = await get<InventoryListResponse>(`/inventory/company/${companyId}/low-stock`);
    return response.data;
  },

  /**
   * Get expiring batches
   */
  getExpiringBatches: async (companyId: string): Promise<any> => {
    const response = await get<any>(`/inventory/company/${companyId}/expiring-batches`);
    return response.data;
  },

  /**
   * Transfer stock between warehouses
   */
  transferStock: async (companyId: string, data: InventoryTransferRequest): Promise<any> => {
    const response = await post<any>(`/inventory/company/${companyId}/transfer`, data);
    return response.data;
  }
};

export default inventoryService;