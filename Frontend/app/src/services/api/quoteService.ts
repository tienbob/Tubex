import { get, post, put, del, getFile } from './apiClient';
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

// Quote status enum
export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CONVERTED = 'converted'
}

// Quote item interface
export interface QuoteItem {
  id?: string;
  productId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  notes?: string;
}

// Quote interface
export interface Quote {
  id?: string;
  quoteNumber?: string;
  companyId?: string;
  customerId: string;
  items: QuoteItem[];
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  total?: number;
  issueDate?: string;
  validUntil: string;
  status?: QuoteStatus;
  deliveryAddress?: string;
  notes?: string;
  termsAndConditions?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// Create Quote request
export interface CreateQuoteRequest {
  customerId: string;
  items: QuoteItem[];
  validUntil: string;
  deliveryAddress?: string;
  notes?: string;
  termsAndConditions?: string;
  metadata?: Record<string, any>;
}

// Quote filters
export interface QuoteFilters {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create a new quote
 */
export const createQuote = async (quoteData: CreateQuoteRequest): Promise<ApiResponse<Quote>> => {
  try {
    const response = await post<ApiResponse<Quote>>('/quotes', quoteData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to create quote',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get all quotes with optional filters
 */
export const getQuotes = async (filters?: QuoteFilters): Promise<ApiResponse<Quote[]>> => {
  try {
    const response = await get<ApiResponse<Quote[]>>('/quotes', { params: filters });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to fetch quotes',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get a single quote by ID
 */
export const getQuoteById = async (quoteId: string): Promise<ApiResponse<Quote>> => {
  try {
    const response = await get<ApiResponse<Quote>>(`/quotes/${quoteId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to fetch quote',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Update an existing quote
 */
export const updateQuote = async (quoteId: string, quoteData: Partial<Quote>): Promise<ApiResponse<Quote>> => {
  try {
    const response = await put<ApiResponse<Quote>>(`/quotes/${quoteId}`, quoteData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to update quote',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Delete a quote
 */
export const deleteQuote = async (quoteId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await del<ApiResponse<void>>(`/quotes/${quoteId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to delete quote',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Generate PDF for a quote
 */
export const generateQuotePdf = async (quoteId: string): Promise<Blob> => {
  try {
    const response = await getFile(`/quotes/${quoteId}/pdf`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to generate quote PDF',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Send quote by email
 */
export const sendQuoteByEmail = async (quoteId: string, emailData: {
  recipientEmail: string,
  subject?: string,
  message?: string,
  ccEmails?: string[]
}): Promise<ApiResponse<{ success: boolean, message: string }>> => {
  try {
    const response = await post<ApiResponse<{ success: boolean, message: string }>>(
      `/quotes/${quoteId}/send`, 
      emailData
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to send quote by email',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Convert a quote to an invoice
 */
export const convertQuoteToInvoice = async (quoteId: string, invoiceData?: {
  paymentTerm?: string,
  issueDate?: string,
  notes?: string
}): Promise<ApiResponse<{ invoiceId: string }>> => {
  try {
    const response = await post<ApiResponse<{ invoiceId: string }>>(
      `/quotes/${quoteId}/convert-to-invoice`,
      invoiceData || {}
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to convert quote to invoice',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Mark a quote as accepted
 */
export const acceptQuote = async (quoteId: string, acceptData?: {
  acceptedBy?: string,
  notes?: string
}): Promise<ApiResponse<Quote>> => {
  try {
    const response = await put<ApiResponse<Quote>>(
      `/api/v1/quotes/${quoteId}/accept`,
      acceptData || {}
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to accept quote',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Mark a quote as declined
 */
export const declineQuote = async (quoteId: string, declineData?: {
  reason?: string,
  notes?: string
}): Promise<ApiResponse<Quote>> => {
  try {
    const response = await put<ApiResponse<Quote>>(
      `/api/v1/quotes/${quoteId}/decline`,
      declineData || {}
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to decline quote',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};
