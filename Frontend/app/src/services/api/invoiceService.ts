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

// Invoice status enum
export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partially_paid'
}

// Payment term enum
export enum PaymentTerm {
  IMMEDIATE = 'immediate',
  DAYS_7 = 'net_7',
  DAYS_15 = 'net_15',
  DAYS_30 = 'net_30',
  DAYS_45 = 'net_45',
  DAYS_60 = 'net_60',
  DAYS_90 = 'net_90',
  CUSTOM = 'custom'
}

// Invoice item interface
export interface InvoiceItem {
  id?: string;
  productId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  notes?: string;
}

// Invoice interface
export interface Invoice {
  id?: string;
  invoiceNumber?: string;
  companyId?: string;
  customerId: string;
  orderId?: string;
  items: InvoiceItem[];
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  total?: number;
  issueDate?: string;
  dueDate?: string;
  status?: InvoiceStatus;
  paymentTerm: PaymentTerm;
  billingAddress: string;
  shippingAddress?: string;
  notes?: string;
  termsAndConditions?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// Create Invoice request
export interface CreateInvoiceRequest {
  orderId?: string;
  customerId: string;
  items: InvoiceItem[];
  issueDate?: string;
  paymentTerm: PaymentTerm;
  billingAddress: string;
  shippingAddress?: string;
  notes?: string;
  termsAndConditions?: string;
  metadata?: Record<string, any>;
}

// Invoice filters
export interface InvoiceFilters {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  customerId?: string;
  orderId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create a new invoice
 */
export const createInvoice = async (invoiceData: CreateInvoiceRequest): Promise<ApiResponse<Invoice>> => {  try {
    const response = await post<ApiResponse<Invoice>>('/invoices', invoiceData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to create invoice',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get all invoices with optional filters
 */
export const getInvoices = async (filters?: InvoiceFilters): Promise<ApiResponse<Invoice[]>> => {
  try {
    const response = await get<ApiResponse<Invoice[]>>('/invoices', { params: filters });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to fetch invoices',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Get a single invoice by ID
 */
export const getInvoiceById = async (invoiceId: string): Promise<ApiResponse<Invoice>> => {
  try {
    const response = await get<ApiResponse<Invoice>>(`/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to fetch invoice',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Update an existing invoice
 */
export const updateInvoice = async (invoiceId: string, invoiceData: Partial<Invoice>): Promise<ApiResponse<Invoice>> => {
  try {
    const response = await put<ApiResponse<Invoice>>(`/invoices/${invoiceId}`, invoiceData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to update invoice',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Delete an invoice
 */
export const deleteInvoice = async (invoiceId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await del<ApiResponse<void>>(`/invoices/${invoiceId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to delete invoice',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Generate PDF for an invoice
 */
export const generateInvoicePdf = async (invoiceId: string): Promise<Blob> => {
  try {
    const response = await getFile(`/invoices/${invoiceId}/pdf`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to generate invoice PDF',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Mark an invoice as paid
 */
export const markInvoiceAsPaid = async (invoiceId: string, paymentData: { 
  amount: number, 
  paymentDate: string, 
  paymentMethod: string,
  transactionId?: string,
  notes?: string
}): Promise<ApiResponse<Invoice>> => {
  try {
    const response = await put<ApiResponse<Invoice>>(`/invoices/${invoiceId}/pay`, paymentData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to mark invoice as paid',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};

/**
 * Send invoice by email
 */
export const sendInvoiceByEmail = async (invoiceId: string, emailData: {
  recipientEmail: string,
  subject?: string,
  message?: string,
  ccEmails?: string[]
}): Promise<ApiResponse<{ success: boolean, message: string }>> => {
  try {
    const response = await post<ApiResponse<{ success: boolean, message: string }>>(
      `/invoices/${invoiceId}/send`, 
      emailData
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new ApiError(
      'Failed to send invoice by email',
      axiosError.response?.status || 500,
      axiosError.response?.data
    );
  }
};
