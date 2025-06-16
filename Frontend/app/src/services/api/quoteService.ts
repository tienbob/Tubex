import { get, post, put, del, getFile, getCurrentCompanyId } from './apiClient';
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

// API Response interface (updated to match paymentService)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    totalItems: number;
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
  id: string;
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
export const createQuote = async (quoteData: CreateQuoteRequest): Promise<Quote> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    const response = await post<ApiResponse<Quote>>(`/quotes`, quoteData);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to create quote',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to create quote', 500);
  }
};

/**
 * Get all quotes with optional filters
 */
export const getQuotes = async (filters?: QuoteFilters): Promise<{ data: Quote[]; pagination: ApiResponse<Quote[]>['pagination'] }> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
      console.log('getQuotes: Making API call', { 
      companyId, 
      filters,
      url: `/quotes`
    });
    
    const response = await get<ApiResponse<Quote[]>>(`/quotes`, { 
      params: {
        limit: 10,
        page: 1,
        companyId, // Pass companyId as a query parameter instead
        ...filters
      } 
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination || {
        page: 1,
        limit: 10,
        totalItems: response.data.data.length,
        totalPages: 1
      }
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to fetch quotes',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to fetch quotes', 500);
  }
};

/**
 * Get a single quote by ID
 */
export const getQuoteById = async (quoteId: string): Promise<Quote> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    const response = await get<ApiResponse<Quote>>(`/quotes/${quoteId}`);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to fetch quote',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to fetch quote', 500);
  }
};

/**
 * Update an existing quote
 */
export const updateQuote = async (quoteId: string, quoteData: Partial<Quote>): Promise<Quote> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    const response = await put<ApiResponse<Quote>>(`/quotes/${quoteId}`, quoteData);
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to update quote',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to update quote', 500);
  }
};

/**
 * Delete a quote
 */
export const deleteQuote = async (quoteId: string): Promise<void> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    await del<ApiResponse<void>>(`/quotes/${quoteId}`);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to delete quote',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to delete quote', 500);
  }
};

/**
 * Generate PDF for a quote
 */
export const generateQuotePdf = async (quoteId: string): Promise<Blob> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }    // TODO: Backend PDF generation endpoint not implemented
    throw new ApiError('PDF generation not implemented', 501);
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
}): Promise<{ success: boolean; message: string }> => {
  try {
    const companyId = getCurrentCompanyId();    if (!companyId) {
      throw new Error('Company ID not available');
    }
    // TODO: Backend send quote endpoint not implemented
    throw new ApiError('Send quote not implemented', 501);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to send quote by email',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to send quote by email', 500);
  }
};

/**
 * Convert a quote to an invoice
 */
export const convertQuoteToInvoice = async (quoteId: string, invoiceData?: {
  paymentTerm?: string,
  issueDate?: string,
  notes?: string
}): Promise<{ invoiceId: string }> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    // TODO: Backend convert quote endpoint not implemented
    throw new ApiError('Convert quote to invoice not implemented', 501);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to convert quote to invoice',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to convert quote to invoice', 500);
  }
};

/**
 * Mark a quote as accepted
 */
export const acceptQuote = async (quoteId: string, acceptData?: {
  acceptedBy?: string,
  notes?: string
}): Promise<Quote> => {  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    // TODO: Backend accept quote endpoint not implemented
    throw new ApiError('Accept quote not implemented', 501);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to accept quote',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to accept quote', 500);
  }
};

/**
 * Mark a quote as declined
 */
export const declineQuote = async (quoteId: string, declineData?: {
  reason?: string,
  notes?: string
}): Promise<Quote> => {  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    // TODO: Backend decline quote endpoint not implemented
    throw new ApiError('Decline quote not implemented', 501);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new ApiError(
        (axiosError.response.data as any)?.message || 'Failed to decline quote',
        axiosError.response.status,
        axiosError.response.data
      );
    }
    throw new ApiError('Failed to decline quote', 500);
  }
};
