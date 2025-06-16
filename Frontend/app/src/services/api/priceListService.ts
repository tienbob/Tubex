import { get, post, put, del, getFile, uploadFile, getCurrentCompanyId } from './apiClient';
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
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('createPriceList: Making API call', { 
      companyId, 
      priceListData,
      url: `/price-lists`
    });
    
    const response = await post<ApiResponse<PriceList>>(`/price-lists`, {
      ...priceListData,
      companyId // Include companyId in request body
    });
    
    console.log('createPriceList: API call successful', { 
      companyId,
      createdId: response.data?.data?.id,
      response: response.data
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('createPriceList: API call failed', { 
      companyId, 
      priceListData,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      error: axiosError.response?.data || axiosError.message 
    });
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
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('getPriceLists: Making API call', { 
      companyId, 
      filters,
      url: `/price-lists`
    });
    
    const response = await get<ApiResponse<PriceList[]>>(`/price-lists`, { 
      params: { 
        companyId, // Pass companyId as query parameter
        ...filters 
      } 
    });
    
    console.log('getPriceLists: API call successful', { 
      companyId,
      resultCount: response.data?.data?.length || 0,
      response: response.data
    });
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('getPriceLists: API call failed', { 
      companyId, 
      filters,
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      error: axiosError.response?.data || axiosError.message 
    });
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
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('getPriceListById: Making API call', { 
      priceListId, 
      companyId,
      url: `/price-lists/${priceListId}`
    });
    
    const response = await get<ApiResponse<PriceList>>(`/price-lists/${priceListId}`, { 
      params: { companyId } 
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('getPriceListById: API call failed', { 
      priceListId, 
      companyId,
      error: axiosError.response?.data || axiosError.message 
    });
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
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('updatePriceList: Making API call', { 
      priceListId, 
      companyId,
      url: `/price-lists/${priceListId}`
    });
    
    const response = await put<ApiResponse<PriceList>>(`/price-lists/${priceListId}`, {
      ...priceListData,
      companyId // Include companyId in request body
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('updatePriceList: API call failed', { 
      priceListId, 
      companyId,
      error: axiosError.response?.data || axiosError.message 
    });
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
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('deletePriceList: Making API call', { 
      priceListId, 
      companyId,
      url: `/price-lists/${priceListId}`
    });
    
    const response = await del<ApiResponse<void>>(`/price-lists/${priceListId}`, { 
      params: { companyId } 
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('deletePriceList: API call failed', { 
      priceListId, 
      companyId,
      error: axiosError.response?.data || axiosError.message 
    });
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
export const uploadPriceListCsv = async (file: File, name?: string): Promise<ApiResponse<CsvUploadResponse>> => {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('uploadPriceListCsv: Making API call', { 
      fileName: file.name, 
      companyId,
      url: `/price-lists/import/csv`
    });
    
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }
    formData.append('companyId', companyId);
    
    const response = await uploadFile<ApiResponse<CsvUploadResponse>>(
      `/price-lists/import/csv`,
      file,
      { name, companyId }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('uploadPriceListCsv: API call failed', { 
      fileName: file.name, 
      companyId,
      error: axiosError.response?.data || axiosError.message 
    });
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
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('downloadPriceListTemplate: Making API call', { 
      companyId,
      url: `/price-lists/template`
    });
    
    // TODO: Backend doesn't have a template endpoint yet, return placeholder CSV
    console.warn('downloadPriceListTemplate: Template endpoint not implemented in backend, returning placeholder');
    const csvContent = `sku,price,discount
SAMPLE-001,29.99,5
SAMPLE-002,49.99,10
SAMPLE-003,99.99,15`;
    
    return new Blob([csvContent], { type: 'text/csv' });
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('downloadPriceListTemplate: API call failed', { 
      companyId,
      error: axiosError.response?.data || axiosError.message 
    });
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
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company ID not available');
  }
  
  try {
    console.log('exportPriceListToCsv: Making API call', { 
      priceListId, 
      companyId,
      url: `/price-lists/${priceListId}/export`
    });
    
    const response = await getFile(`/price-lists/${priceListId}/export`, { 
      params: { companyId } 
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('exportPriceListToCsv: API call failed', { 
      priceListId, 
      companyId,
      error: axiosError.response?.data || axiosError.message 
    });
    throw new ApiError(
      'Failed to export price list to CSV',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Apply price list to a customer
 * TODO: Backend endpoint not implemented yet
 */
export const applyPriceListToCustomer = async (priceListId: string, customerId: string): Promise<ApiResponse<{ success: boolean }>> => {
  console.warn('applyPriceListToCustomer: Feature not implemented in backend yet');
  throw new ApiError(
    'Apply price list to customer feature is not implemented yet',
    501,
    { feature: 'apply-to-customer', status: 'not-implemented' }
  );
};

/**
 * Apply price list to a customer group
 * TODO: Backend endpoint not implemented yet
 */
export const applyPriceListToCustomerGroup = async (priceListId: string, customerGroupId: string): Promise<ApiResponse<{ success: boolean }>> => {
  console.warn('applyPriceListToCustomerGroup: Feature not implemented in backend yet');
  throw new ApiError(
    'Apply price list to customer group feature is not implemented yet',
    501,
    { feature: 'apply-to-group', status: 'not-implemented' }
  );
};

/**
 * Get product price for a specific customer
 * TODO: Backend endpoint not implemented yet
 */
export const getProductPriceForCustomer = async (productId: string, customerId: string, quantity?: number): Promise<ApiResponse<{ price: number }>> => {
  console.warn('getProductPriceForCustomer: Feature not implemented in backend yet');
  throw new ApiError(
    'Get product price for customer feature is not implemented yet',
    501,
    { feature: 'product-price', status: 'not-implemented' }
  );
};
