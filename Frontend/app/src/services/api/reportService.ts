import { get } from './apiClient';
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

export interface HealthCheckResponse {
  status: string;
  environment: string;
  timestamp: string;
}

export interface SalesReportParams {
  startDate: string;
  endDate: string;
  companyId?: string;
  groupBy?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  productId?: string;
  customerId?: string;
}

export interface InventoryReportParams {
  companyId?: string;
  warehouseId?: string;
  lowStockOnly?: boolean;
  includeExpiring?: boolean;
  expiringWithinDays?: number;
}

/**
 * Helper function to get current company ID
 */
function getCurrentCompanyId(): string | undefined {
  // This function should retrieve the company ID from your app context/state
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.companyId || user.company_id || undefined;
}

/**
 * Report Service - Handles operations related to reports and system health
 */
export const reportService = {
  /**
   * Get API health status
   */
  healthCheck: async (): Promise<HealthCheckResponse> => {
    try {
      const response = await get<HealthCheckResponse>('/health');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Health check failed',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Get sales report data
   */
  getSalesReport: async (params: SalesReportParams): Promise<any> => {
    try {
      // Input validation
      if (!params.startDate || !params.endDate) {
        throw new Error('Start date and end date are required');
      }
      
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (endDate < startDate) {
        throw new Error('End date must be after start date');
      }
      
      const companyId = params.companyId || getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      const { companyId: _, ...otherParams } = params; // Remove companyId from params
      
      const response = await get<any>(`/reports/company/${companyId}/sales`, { params: otherParams });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch sales report',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Get inventory report data
   */
  getInventoryReport: async (params: InventoryReportParams = {}): Promise<any> => {
    try {
      const companyId = params.companyId || getCurrentCompanyId();
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      const { companyId: _, ...otherParams } = params; // Remove companyId from params
      
      const response = await get<any>(`/reports/company/${companyId}/inventory`, { params: otherParams });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch inventory report',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Get low stock products report
   */
  getLowStockReport: async (companyId?: string, threshold?: number): Promise<any> => {
    try {
      const params: Record<string, any> = {};
      
      if (!companyId) {
        companyId = getCurrentCompanyId();
      }
      
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      if (threshold !== undefined) {
        if (threshold < 0) {
          throw new Error('Threshold cannot be negative');
        }
        params.threshold = threshold;
      }
      
      const response = await get<any>(`/reports/company/${companyId}/low-stock`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch low stock report',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },
  /**
   * Get expiring products report
   */
  getExpiringItemsReport: async (daysThreshold: number = 30, companyId?: string): Promise<any> => {
    try {
      if (daysThreshold < 0) {
        throw new Error('Days threshold cannot be negative');
      }
      
      if (!companyId) {
        companyId = getCurrentCompanyId();
      }
      
      if (!companyId) {
        throw new Error('Company ID not available');
      }
      
      const params: Record<string, any> = {
        daysThreshold
      };
      
      const response = await get<any>(`/reports/company/${companyId}/expiring-items`, { params });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch expiring items report',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};