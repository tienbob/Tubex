import { get, post } from './apiClient';
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

export interface CompanyVerificationRequest {
  companyId: string;
  status: 'active' | 'rejected';
  reason?: string;
}

export interface PendingVerification {
  company_id: string;
  company_name: string;
  company_type: 'supplier' | 'dealer';
  submitted_at: string;
  documents: {
    business_license?: string;
    tax_id?: string;
    additional_docs?: string[];
  };
}

export interface PendingVerificationResponse {
  status: string;
  data: PendingVerification[];
}

/**
 * Company Verification Service - Handles approving or rejecting company registrations
 */
export const companyVerificationService = {
  /**
   * Get all pending verification requests
   */
  getPendingVerifications: async (): Promise<PendingVerification[]> => {
    try {
      const response = await get<PendingVerificationResponse>('/company-verification/pending');
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to fetch pending verifications',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Approve a company verification
   */
  approveCompany: async (companyId: string): Promise<{success: boolean; message: string}> => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      const data: CompanyVerificationRequest = {
        companyId,
        status: 'active'
      };
      
      const response = await post<{success: boolean; message: string}>('/company-verification/verify', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to approve company',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  },

  /**
   * Reject a company verification
   */
  rejectCompany: async (companyId: string, reason: string): Promise<{success: boolean; message: string}> => {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }
      
      if (!reason || reason.trim() === '') {
        throw new Error('Rejection reason is required');
      }
      
      const data: CompanyVerificationRequest = {
        companyId,
        status: 'rejected',
        reason
      };
      
      const response = await post<{success: boolean; message: string}>('/company-verification/verify', data);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new ApiError(
          error.response?.data?.message || 'Failed to reject company',
          error.response?.status || 500,
          error.response?.data
        );
      }
      throw error;
    }
  }
};