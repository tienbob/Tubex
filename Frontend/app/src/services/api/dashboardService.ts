import { get, getCurrentCompanyId } from './apiClient';
import { AxiosError } from 'axios';
import { ApiError } from './authService';

// Types for dashboard overview data
export interface OrderSummary {
  recentOrders: {
    id: string;
    date: string;
    customer: string;
    status: string;
    total: number;
  }[];
  totalOrders: number;
  pendingOrders: number;
}

export interface ProductSummary {
  totalProducts: number;
  featuredProducts: {
    id: string;
    name: string;
    price: number;
    stock: number;
  }[];
  categoryCounts: Record<string, number>;
}

export interface InventorySummary {
  totalItems: number;
  lowStockItems: number;
  warehouseUtilization: number;
  recentMovements: {
    id: string;
    date: string;
    product: string;
    quantity: number;
    type: 'in' | 'out';
  }[];
}

export const dashboardService = {
  /**
   * Get order summary for dashboard
   */  
  getOrderSummary: async (): Promise<OrderSummary> => {
    try {
      // Get company ID
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      // Use consistent URL pattern: /resource/company/{companyId}
      const response = await get<any>(`/orders/company/${companyId}`, { 
        params: { 
          limit: 5,
          page: 1
        } 
      });
      
      // Format the data to match what the dashboard expects
      const orders = response.data.orders || [];
      const summary: OrderSummary = {
        recentOrders: orders.map((order: any) => ({
          id: order.id,
          date: order.createdAt,
          customer: order.customerId,
          status: order.status,
          total: order.totalAmount
        })),
        totalOrders: response.data.pagination?.total || orders.length,
        pendingOrders: orders.filter((order: any) => order.status === 'pending').length
      };
      
      return summary;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch order summary',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get product summary for dashboard
   */  
  getProductSummary: async (): Promise<ProductSummary> => {
    try {
      // Get company ID
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      // Use consistent URL pattern: /resource/company/{companyId}
      const response = await get<any>(`/products/company/${companyId}`, { 
        params: { 
          limit: 5,
          page: 1
        } 
      });
      
      // Format the data to match what the dashboard expects
      const products = response.data.products || [];
      
      const summary: ProductSummary = {
        totalProducts: response.data.pagination?.total || products.length,
        featuredProducts: products.map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.base_price,
          stock: product.inventory_count || 0
        })),
        categoryCounts: {}
      };
      
      // Count products by category (if categories are available)
      products.forEach((product: any) => {
        if (product.category) {
          if (summary.categoryCounts[product.category]) {
            summary.categoryCounts[product.category]++;
          } else {
            summary.categoryCounts[product.category] = 1;
          }
        }
      });
      
      return summary;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch product summary',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Get inventory summary for dashboard
   */  
  getInventorySummary: async (): Promise<InventorySummary> => {
    try {
      // Get company ID
      const companyId = getCurrentCompanyId();
      console.log('Company ID:', companyId);
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      // Keep the working URL pattern: /inventory/company/{companyId}
      const response = await get<any>(`/inventory/company/${companyId}`, { 
        params: { 
          limit: 10,
          page: 1
        } 
      });
        // Format the data to match what the dashboard expects
      // Backend returns direct array in response.data
      const inventoryItems = Array.isArray(response.data) ? response.data : (response.data.items || response.data.data || []);
        // Calculate total inventory quantity
      const totalQuantity = inventoryItems.reduce((sum: number, item: any) => sum + (parseFloat(item.quantity) || 0), 0);
        // Calculate warehouse utilization based on actual warehouse capacity
      const totalWarehouseCapacity = inventoryItems.reduce((sum: number, item: any) => {
        const warehouseCapacity = parseFloat(item.warehouse_capacity) || parseFloat(item.warehouse?.capacity) || 1000;
        return sum + warehouseCapacity;
      }, 0);
      
      const warehouseUtilization = totalWarehouseCapacity > 0 
        ? Math.min(100, Math.round((totalQuantity / totalWarehouseCapacity) * 100))
        : 0;
      
      // Count low stock items
      const lowStockItems = inventoryItems.filter((item: any) => 
        (item.min_threshold && parseFloat(item.quantity) <= parseFloat(item.min_threshold)) || parseFloat(item.quantity) === 0
      );
      
      // Create the summary object
      const summary: InventorySummary = {
        totalItems: inventoryItems.length,
        lowStockItems: lowStockItems.length,
        warehouseUtilization,        recentMovements: inventoryItems.slice(0, 5).map((item: any) => ({
          id: item.id,
          date: item.updated_at || new Date().toISOString(),
          product: item.product?.name || item.product_name || 'Unknown Product',
          quantity: parseFloat(item.quantity) || 0,
          type: (parseFloat(item.quantity) || 0) > 0 ? 'in' : 'out'
        }))
      };
      
      return summary;
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
  }
};
