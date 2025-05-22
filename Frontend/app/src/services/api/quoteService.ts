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
 * Helper function to get current company ID
 */
function getCurrentCompanyId(): string | undefined {
  // This function should retrieve the company ID from your app context/state
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.companyId || user.company_id || undefined;
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
    const response = await post<ApiResponse<Quote>>(`/quotes/company/${companyId}`, quoteData);
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
    const response = await get<ApiResponse<Quote[]>>(`/quotes/company/${companyId}`, { 
      params: {
        limit: 10,
        page: 1,
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
    const response = await get<ApiResponse<Quote>>(`/quotes/company/${companyId}/${quoteId}`);
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
    const response = await put<ApiResponse<Quote>>(`/quotes/company/${companyId}/${quoteId}`, quoteData);
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
    await del<ApiResponse<void>>(`/quotes/company/${companyId}/${quoteId}`);
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
    }
    const response = await getFile(`/quotes/company/${companyId}/${quoteId}/pdf`);
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
}): Promise<{ success: boolean; message: string }> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    const response = await post<ApiResponse<{ success: boolean; message: string }>>(
      `/quotes/company/${companyId}/${quoteId}/send`, 
      emailData
    );
    return response.data.data;
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
    const response = await post<ApiResponse<{ invoiceId: string }>>(
      `/quotes/company/${companyId}/${quoteId}/convert-to-invoice`,
      invoiceData || {}
    );
    return response.data.data;
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
}): Promise<Quote> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    const response = await put<ApiResponse<Quote>>(
      `/quotes/company/${companyId}/${quoteId}/accept`,
      acceptData || {}
    );
    return response.data.data;
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
}): Promise<Quote> => {
  try {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      throw new Error('Company ID not available');
    }
    const response = await put<ApiResponse<Quote>>(
      `/quotes/company/${companyId}/${quoteId}/decline`,
      declineData || {}
    );
    return response.data.data;
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
