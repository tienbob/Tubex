import { get, post, patch, del } from './apiClient';

interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface Order {
  id: string;
  customerId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
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
}

interface OrderResponse {
  status: string;
  data: Order;
}

interface OrdersListResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface OrderCreateRequest {
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
}

interface OrderUpdateRequest {
  status?: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

/**
 * Service for handling order-related API calls
 */
const orderService = {
  /**
   * Get all orders with pagination and filtering
   */
  getOrders: async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      paymentStatus?: string;
      fromDate?: string;
      toDate?: string;
    } = {}
  ): Promise<OrdersListResponse> => {
    const response = await get<OrdersListResponse>('/orders', { params });
    return response.data;
  },

  /**
   * Get a single order by ID
   */
  getOrderById: async (id: string): Promise<OrderResponse> => {
    const response = await get<OrderResponse>(`/orders/${id}`);
    return response.data;
  },

  /**
   * Create a new order
   */
  createOrder: async (orderData: OrderCreateRequest): Promise<OrderResponse> => {
    const response = await post<OrderResponse>('/orders', orderData);
    return response.data;
  },

  /**
   * Update an order
   */
  updateOrder: async (id: string, orderData: OrderUpdateRequest): Promise<OrderResponse> => {
    const response = await patch<OrderResponse>(`/orders/${id}`, orderData);
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (id: string): Promise<OrderResponse> => {
    const response = await post<OrderResponse>(`/orders/${id}/cancel`);
    return response.data;
  }
};

export default orderService;