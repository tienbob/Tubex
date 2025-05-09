import { get, post, patch, del } from './apiClient';
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

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  product?: {
    id: string;
    name: string;
    description: string;
    base_price: number;
  };
}

export interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  metadata?: {
    lastUpdated?: string;
    updatedBy?: string;
    previousStatus?: string;
    notes?: string;
  };
}

export interface OrderResponse {
  status: string;
  data: Order;
}

export interface OrdersListResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderCreateRequest {
  items: {
    productId: string;
    quantity: number;
    discount?: number;
  }[];
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  metadata?: {
    notes?: string;
    purchaseOrderNumber?: string;
  };
}

export interface OrderUpdateRequest {
  status?: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  metadata?: Record<string, any>;
}

export interface BulkProcessOrdersRequest {
  orderIds: string[];
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface BulkProcessOrdersResponse {
  message: string;
  processedOrders: string[];
}

export interface OrderHistoryItem {
  timestamp: string;
  status: Order['status'];
  paymentStatus: Order['paymentStatus'];
  updatedBy: string;
  notes?: string;
}

export interface OrderHistoryResponse {
  orderId: string;
  history: OrderHistoryItem[];
}

/**
 * Service for handling order-related API calls
 */
export const orderService = {
  /**
   * Get all orders with pagination and filtering
   */
  getOrders: async (
    params: {
      page?: number;
      limit?: number;
      status?: Order['status'] | string;
      paymentStatus?: Order['paymentStatus'] | string;
      fromDate?: string;
      toDate?: string;
    } = {}
  ): Promise<OrdersListResponse> => {
    try {
      // Input validation
      if (params.page && params.page < 1) {
        throw new Error('Page number must be greater than 0');
      }
      
      if (params.limit && (params.limit < 1 || params.limit > 100)) {
        throw new Error('Limit must be between 1 and 100');
      }
      
      const response = await get<OrdersListResponse>('/orders', { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch orders',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get a single order by ID
   */
  getOrderById: async (id: string): Promise<OrderResponse> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid order ID is required');
      }
      
      const response = await get<OrderResponse>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch order: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Create a new order
   */
  createOrder: async (orderData: OrderCreateRequest): Promise<OrderResponse> => {
    try {
      // Basic validation
      if (!orderData.items || !orderData.items.length) {
        throw new Error('Order must contain at least one item');
      }
      
      if (!orderData.deliveryAddress) {
        throw new Error('Delivery address is required');
      }
      
      const response = await post<OrderResponse>('/orders', orderData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create order',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Update an order's status or details
   */
  updateOrder: async (id: string, orderData: OrderUpdateRequest): Promise<OrderResponse> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid order ID is required');
      }
      
      const response = await patch<OrderResponse>(`/orders/${id}`, orderData);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update order: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (id: string, reason?: string): Promise<OrderResponse> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid order ID is required');
      }
      
      const response = await post<OrderResponse>(`/orders/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to cancel order: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get order history with status changes
   */
  getOrderHistory: async (id: string): Promise<OrderHistoryResponse> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid order ID is required');
      }
      
      const response = await get<OrderHistoryResponse>(`/orders/${id}/history`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch order history: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Process multiple orders in bulk
   */
  bulkProcessOrders: async (data: BulkProcessOrdersRequest): Promise<BulkProcessOrdersResponse> => {
    try {
      if (!data.orderIds || !data.orderIds.length) {
        throw new Error('At least one order ID is required');
      }
      
      if (!data.status) {
        throw new Error('Status is required for bulk processing');
      }
      
      const response = await post<BulkProcessOrdersResponse>('/orders/bulk-process', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to process orders in bulk',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  /**
   * Delete an order (for admin purposes only)
   */
  deleteOrder: async (id: string): Promise<{success: boolean, message: string}> => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid order ID is required');
      }
      
      const response = await del<{success: boolean, message: string}>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete order: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
}