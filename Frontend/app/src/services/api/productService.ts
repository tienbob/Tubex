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

// Add the ApiResponse interface definition
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

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  created_at: string;
  updated_at: string;
  sku?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  inventory?: {
    quantity: number;
    lowStockThreshold: number;
  };
  images?: string[];
  specifications?: Record<string, string>;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  status?: 'active' | 'inactive' | 'out_of_stock';
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {}

export interface ProductListParams {
  page?: number;
  limit?: number;
  supplier_id?: string;
  status?: string;
  search?: string;
}

export interface PaginationResponse<T> {
  products: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductPriceHistory {
  id: string;
  product_id: string;
  price: number;
  effective_date: string;
  created_by: string;
}

export interface PriceHistoryResponse {
  status: string;
  data: ProductPriceHistory[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const productService = {
  async getProducts(params: ProductListParams = {}): Promise<PaginationResponse<Product>> {
    try {
      // Input validation
      if (params.page && params.page < 1) {
        throw new Error('Page number must be greater than 0');
      }
      
      if (params.limit && (params.limit < 1 || params.limit > 100)) {
        throw new Error('Limit must be between 1 and 100');
      }
      
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        supplier_id: params.supplier_id,
        status: params.status,
        search: params.search
      };
      
      const response = await get<PaginationResponse<Product>>('/products', { params: queryParams });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch products',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getProduct(id: string): Promise<Product> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid product ID is required');
      }
      
      const response = await get<{data: Product}>(`/products/${id}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch product: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async createProduct(data: ProductCreateInput): Promise<Product> {
    try {
      // Input validation
      if (!data.name || data.name.trim() === '') {
        throw new Error('Product name is required');
      }
      
      if (data.base_price < 0) {
        throw new Error('Product price cannot be negative');
      }
      
      if (!data.supplier_id) {
        throw new Error('Supplier ID is required');
      }
      
      const response = await post<{data: Product}>('/products', data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create product',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async updateProduct(id: string, data: ProductUpdateInput): Promise<Product> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid product ID is required');
      }
      
      // Input validation for price if provided
      if (data.base_price !== undefined && data.base_price < 0) {
        throw new Error('Product price cannot be negative');
      }
      
      const response = await put<{data: Product}>(`/products/${id}`, data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update product: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid product ID is required');
      }
      
      await del<{success: boolean}>(`/products/${id}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to delete product: ${id}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  async bulkUpdateStatus(productIds: string[], status: 'active' | 'inactive' | 'out_of_stock'): Promise<void> {
    try {
      if (!productIds || !productIds.length) {
        throw new Error('At least one product ID is required');
      }
      
      if (!status || !['active', 'inactive', 'out_of_stock'].includes(status)) {
        throw new Error('Valid status is required (active, inactive, or out_of_stock)');
      }
      
      await post<{success: boolean}>('/products/bulk-status', {
        productIds,
        status
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to update product status in bulk',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getCategories(companyId: string): Promise<{data: ProductCategory[]}> {
    try {
      if (!companyId || typeof companyId !== 'string') {
        throw new Error('Valid company ID is required');
      }
      
      const response = await get<{data: ProductCategory[]}>(`/companies/${companyId}/product-categories`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch product categories',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getPriceHistory(productId: string, params: {page?: number; limit?: number} = {}): Promise<PriceHistoryResponse> {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error('Valid product ID is required');
      }
      
      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10
      };
      
      const response = await get<PriceHistoryResponse>(`/products/${productId}/price-history`, { params: queryParams });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to fetch price history for product: ${productId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  
  async updateProductPrice(productId: string, price: number, effectiveDate?: string): Promise<Product> {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error('Valid product ID is required');
      }
      
      if (price < 0) {
        throw new Error('Price cannot be negative');
      }
      
      const data = {
        price,
        effective_date: effectiveDate || new Date().toISOString()
      };
      
      const response = await post<{data: Product}>(`/products/${productId}/price`, data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || `Failed to update price for product: ${productId}`,
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getProductCategories(companyId: string): Promise<ApiResponse<ProductCategory[]>> {
    try {
      if (!companyId || typeof companyId !== 'string') {
        throw new Error('Invalid company ID');
      }
      
      // Use the get function from apiClient
      const response = await get<ApiResponse<ProductCategory[]>>(`/companies/${companyId}/product-categories`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch product categories',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};