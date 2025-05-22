import { AxiosError } from 'axios';
import { get } from './apiClient';
import { ApiError } from './productService';
import { getCurrentCompanyId } from './apiClient';

// Company interfaces
export interface Company {
  id: string;
  name: string;
  type: 'dealer' | 'supplier';
  tax_id: string;
  business_license: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  business_category?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyListParams {
  page?: number;
  limit?: number;
  type?: 'dealer' | 'supplier';
  search?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: number;
}

// Company service
export const companyService = {
  async getCompanies(params: CompanyListParams = {}): Promise<ApiResponse<Company[]>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.type) queryParams.append('type', params.type);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await get<ApiResponse<Company[]>>(`/companies?${queryParams.toString()}`);
      return response.data;    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch companies',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },  async getSuppliers(params: { search?: string, page?: number, limit?: number } = {}): Promise<ApiResponse<Company[]>> {
    try {
      // Add the supplier type filter and ensure only supplier type is returned
      const response = await this.getCompanies({
        ...params,
        type: 'supplier' as const
      });
      return {
        ...response,
        data: response.data.filter((company): company is Company & { type: 'supplier' } => company.type === 'supplier')
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch suppliers',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  async getCompanyById(id: string): Promise<Company> {
    try {
      const response = await get<{ data: Company }>(`/companies/${id}`);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch company details',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};
