import { get, post, put, del, getFile, uploadFile } from './apiClient';
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

// API Response interface
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

// Price List status enum
export enum PriceListStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  DRAFT = 'draft'
}

// Price List Type enum
export enum PriceListType {
  STANDARD = 'standard',
  CUSTOM = 'custom',
  PROMOTIONAL = 'promotional',
  SEASONAL = 'seasonal',
  VOLUME = 'volume'
}

// Price List Item interface
export interface PriceListItem {
  id?: string;
  productId: string;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

// Price List interface
export interface PriceList {
  id?: string;
  name: string;
  description?: string;
  type: PriceListType;
  status: PriceListStatus;
  customerId?: string;
  customerGroupId?: string;
  items: PriceListItem[];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// Create Price List request
export interface CreatePriceListRequest {
  name: string;
  description?: string;
  type: PriceListType;
  status?: PriceListStatus;
  customerId?: string;
  customerGroupId?: string;
  items: PriceListItem[];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

// Price List filters
export interface PriceListFilters {
  page?: number;
  limit?: number;
  status?: PriceListStatus;
  type?: PriceListType;
  customerId?: string;
  customerGroupId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// CSV Upload Response
export interface CsvUploadResponse {
  importedCount: number;
  updatedCount: number;
  failedCount: number;
  errors?: Array<{
    row: number;
    message: string;
  }>;
}

/**
 * Create a new price list
 */
export const createPriceList = async (priceListData: CreatePriceListRequest): Promise<ApiResponse<PriceList>> => {
  try {
    const response = await post<ApiResponse<PriceList>>('/api/v1/price-list', priceListData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to create price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get all price lists with optional filters
 */
export const getPriceLists = async (filters?: PriceListFilters): Promise<ApiResponse<PriceList[]>> => {
  try {
    const response = await get<ApiResponse<PriceList[]>>('/api/v1/price-list', { params: filters });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to fetch price lists',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get a single price list by ID
 */
export const getPriceListById = async (priceListId: string): Promise<ApiResponse<PriceList>> => {
  try {
    const response = await get<ApiResponse<PriceList>>(`/api/v1/price-list/${priceListId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to fetch price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Update an existing price list
 */
export const updatePriceList = async (priceListId: string, priceListData: Partial<PriceList>): Promise<ApiResponse<PriceList>> => {
  try {
    const response = await put<ApiResponse<PriceList>>(`/api/v1/price-list/${priceListId}`, priceListData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to update price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Delete a price list
 */
export const deletePriceList = async (priceListId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await del<ApiResponse<void>>(`/api/v1/price-list/${priceListId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to delete price list',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Upload price list items from CSV file
 */
export const uploadPriceListCsv = async (priceListId: string, file: File): Promise<ApiResponse<CsvUploadResponse>> => {
  try {
    const response = await uploadFile<ApiResponse<CsvUploadResponse>>(
      `/api/v1/price-list/${priceListId}/import-csv`,
      file
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to upload price list CSV',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Download a price list template CSV
 */
export const downloadPriceListTemplate = async (): Promise<Blob> => {
  try {
    const response = await getFile('/api/v1/price-list/template-csv');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to download price list template',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Export a price list to CSV
 */
export const exportPriceListToCsv = async (priceListId: string): Promise<Blob> => {
  try {
    const response = await getFile(`/api/v1/price-list/${priceListId}/export-csv`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to export price list to CSV',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Apply price list to a customer
 */
export const applyPriceListToCustomer = async (priceListId: string, customerId: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await post<ApiResponse<{ success: boolean }>>(
      `/api/v1/price-list/${priceListId}/apply-to-customer`,
      { customerId }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to apply price list to customer',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Apply price list to a customer group
 */
export const applyPriceListToCustomerGroup = async (priceListId: string, customerGroupId: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await post<ApiResponse<{ success: boolean }>>(
      `/api/v1/price-list/${priceListId}/apply-to-group`,
      { customerGroupId }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to apply price list to customer group',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get product price for a specific customer
 */
export const getProductPriceForCustomer = async (productId: string, customerId: string, quantity?: number): Promise<ApiResponse<{ price: number }>> => {
  try {
    const response = await get<ApiResponse<{ price: number }>>(
      `/api/v1/price-list/product/${productId}/price`,
      { params: { customerId, quantity } }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to get product price for customer',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};
