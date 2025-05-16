import { get, post, put, del, getCurrentCompanyId } from './apiClient';
import { AxiosError } from 'axios';
import { ApiError } from './inventoryService';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  company_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryCreateInput {
  name: string;
  description?: string;
  parent_id?: string;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export const productCategoryService = {
  async getCategories(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<ProductCategory[]>> {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      // Updated URL pattern - use product-categories instead of companies/companyId/product-categories
      const response = await get<ApiResponse<ProductCategory[]>>(`/product-categories/company/${companyId}`, {
        params
      });
      
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
  
  async createCategory(data: ProductCategoryCreateInput): Promise<ApiResponse<ProductCategory>> {
    try {
      const companyId = getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      if (!data.name || data.name.trim() === '') {
        throw new Error('Category name is required');
      }
      
      const response = await post<ApiResponse<ProductCategory>>('/product-categories', {
        ...data,
        company_id: companyId
      });
      
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to create product category',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
  
  // Add other methods as needed
};
