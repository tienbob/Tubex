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

export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'paypal' | 'stripe' | 'other';
export type PaymentType = 'order_payment' | 'invoice_payment' | 'refund' | 'advance_payment' | 'adjustment';
export type ReconciliationStatus = 'unreconciled' | 'reconciled' | 'disputed' | 'pending_review';

export interface Payment {
  id: string;
  transactionId: string;
  orderId?: string;
  invoiceId?: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentDate: string;
  externalReferenceId?: string;
  notes?: string;
  reconciliationStatus: ReconciliationStatus;
  reconciliationDate?: string;
  reconciledById?: string;
  reconciledBy?: {
    id: string;
    name: string;
  };
  metadata?: {
    [key: string]: any;
  };
  recordedById: string;
  recordedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    totalAmount: number;
    status: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
  };
}

export interface CreatePaymentRequest {
  transactionId: string;
  orderId?: string;
  invoiceId?: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  paymentDate: string;
  externalReferenceId?: string;
  notes?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface UpdatePaymentRequest {
  transactionId?: string;
  orderId?: string | null;
  invoiceId?: string | null;
  amount?: number;
  paymentMethod?: PaymentMethod;
  paymentType?: PaymentType;
  paymentDate?: string;
  externalReferenceId?: string | null;
  notes?: string | null;
  metadata?: {
    [key: string]: any;
  };
}

export interface ReconcilePaymentRequest {
  reconciliationStatus: ReconciliationStatus;
  notes?: string;
}

export interface PaymentFilters {
  orderId?: string;
  invoiceId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  reconciliationStatus?: ReconciliationStatus;
  page?: number;
  limit?: number;
}

export interface PaymentsPaginatedResponse {
  data: Payment[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

interface ApiResponse<T> {
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

const paymentService = {  /**
   * Create a new payment
   * @param paymentData Payment data to create
   * @returns Created payment
   */  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    try {
      const response = await post<{ success: boolean; data: Payment }>('/payments', paymentData);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to create payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to create payment', 500);
    }
  },
  /**
   * Get a list of payments with optional filters
   * @param filters Optional filters for payments
   * @returns Paginated list of payments
   */  async getPayments(filters: PaymentFilters = {}): Promise<PaymentsPaginatedResponse> {
    try {
      const response = await get<ApiResponse<Payment[]>>(
        '/payments',
        { params: filters }
      );
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
      if (error instanceof AxiosError && error.response) {
        throw new ApiError(
          (error.response.data as any)?.message || 'Failed to fetch payments',
          error.response.status,
          error.response.data
        );
      }
      throw new ApiError('Failed to fetch payments', 500);
    }
  },
  /**
   * Get a payment by ID
   * @param paymentId ID of payment to retrieve
   * @returns Payment details
   */  async getPaymentById(paymentId: string): Promise<Payment> {
    try {
      const response = await get<ApiResponse<Payment>>(`/payments/${paymentId}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to fetch payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to fetch payment', 500);
    }
  },
  /**
   * Update an existing payment
   * @param paymentId ID of payment to update
   * @param updateData Payment data to update
   * @returns Updated payment
   */  async updatePayment(paymentId: string, updateData: UpdatePaymentRequest): Promise<Payment> {
    try {
      const response = await put<ApiResponse<Payment>>(`/payments/${paymentId}`, updateData);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to update payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to update payment', 500);
    }
  },
  /**
   * Delete a payment
   * @param paymentId ID of payment to delete
   */  async deletePayment(paymentId: string): Promise<void> {
    try {
      await del<ApiResponse<void>>(`/payments/${paymentId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to delete payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to delete payment', 500);
    }
  },
  /**
   * Reconcile a payment
   * @param paymentId ID of payment to reconcile
   * @param reconcileData Reconciliation data
   * @returns Reconciled payment
   */  async reconcilePayment(paymentId: string, reconcileData: ReconcilePaymentRequest): Promise<Payment> {
    try {
      const response = await post<ApiResponse<Payment>>(
        `/payments/${paymentId}/reconcile`,
        reconcileData
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to reconcile payment',
          axiosError.response.status,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to reconcile payment', 500);
    }
  }
};

export default paymentService;
