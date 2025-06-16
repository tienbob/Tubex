import { get } from './apiClient';
import { AxiosError } from 'axios';

// TODO: Backend Implementation Needed
// The following endpoints need to be implemented in the backend:
// - GET /api/v1/companies - Search customers/companies (PARTIALLY IMPLEMENTED in searchCustomers)
// - GET /api/v1/companies/:id - Get single customer/company
// - GET /api/v1/companies/batch?ids=id1,id2,id3 - Get multiple customers/companies
//
// The searchCustomers method now attempts to call the /companies endpoint and provides
// sample data as fallback when the endpoint is not available (404 error).

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

export interface Customer {
  id: string;
  name: string;
  type: 'dealer' | 'supplier';
  contactPhone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  status?: string;
  metadata?: Record<string, any>;
}

export interface CustomersResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

/**
 * Service for handling customer-related API calls
 */
const customerService = {  /**
   * Get a single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer> {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid customer ID is required');
      }
      
      // TODO: Replace with actual customer endpoint when available
      console.warn(`getCustomerById: Customer endpoint not implemented yet. Returning placeholder data for ID: ${id}`);
      
      // Return placeholder customer data
      return {
        id,
        name: `Customer ${id.substring(0, 8)}`,
        type: 'dealer',
        email: `customer-${id.substring(0, 8)}@example.com`,
        contactPhone: 'N/A',
        address: {
          street: 'N/A',
          city: 'N/A',
          province: 'N/A',
          postalCode: 'N/A'
        },
        status: 'active'
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || `Failed to fetch customer: ${id}`,
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError(`Failed to fetch customer: ${id}`, 500);
    }
  },

  /**
   * Get multiple customers by IDs in a single batch request
   */  async getCustomersByIds(ids: string[]): Promise<Record<string, Customer>> {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return {};
      }
      
      // TODO: Replace with actual batch endpoint when available
      // For now, return placeholder customer data as the batch endpoint doesn't exist
      console.warn('getCustomersByIds: Batch customer endpoint not implemented yet. Returning placeholder customer data.');
        // Temporary fallback - return placeholder customer data
      const customersMap: Record<string, Customer> = {};
      ids.forEach(id => {
        customersMap[id] = {
          id,
          name: `Customer ${id.substring(0, 8)}`,
          type: 'dealer', // Default type
          email: `customer-${id.substring(0, 8)}@example.com`,
          contactPhone: 'N/A',
          address: {
            street: 'N/A',
            city: 'N/A',
            province: 'N/A',
            postalCode: 'N/A'
          },
          status: 'active'
        };
      });
      
      return customersMap;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to fetch customers',
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to fetch customers', 500);
    }
  },  /**
   * Search customers with optional filters
   */
  async searchCustomers(params?: {
    search?: string;
    type?: 'dealer' | 'supplier';
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<CustomersResponse> {
    try {
      // Build query parameters for the companies endpoint
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      
      // Try to call the companies endpoint
      const response = await get<{
        data: Array<{
          id: string;
          name: string;
          type: 'dealer' | 'supplier';
          tax_id?: string;
          business_license?: string;
          address?: {
            street: string;
            city: string;
            province: string;
            postalCode: string;
          };
          business_category?: string;
          created_at: string;
          updated_at: string;
          contact_phone?: string;
          email?: string;
          status?: string;
        }>;
        pagination?: {
          page: number;
          limit: number;
          totalItems: number;
          totalPages: number;
        };
      }>(`/companies?${queryParams.toString()}`);
      
      // Transform company data to customer format
      const customers: Customer[] = response.data.data.map(company => ({
        id: company.id,
        name: company.name,
        type: company.type,
        contactPhone: company.contact_phone || 'N/A',
        email: company.email || `info@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
        address: company.address || {
          street: 'N/A',
          city: 'N/A',
          province: 'N/A',
          postalCode: 'N/A'
        },
        status: company.status || 'active',
        metadata: {
          taxId: company.tax_id,
          businessLicense: company.business_license,
          businessCategory: company.business_category,
          createdAt: company.created_at,
          updatedAt: company.updated_at
        }
      }));
      
      return {
        data: customers,
        pagination: response.data.pagination || {
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalItems: customers.length,
          totalPages: Math.ceil(customers.length / (params?.limit || 10))
        }
      };
      
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // If the endpoint doesn't exist (404), provide helpful fallback
      if (axiosError.response?.status === 404) {
        console.warn('searchCustomers: Companies endpoint not found. Backend may need to implement /api/v1/companies endpoint.');
          // Return sample data to help with development
        const sampleCustomers: Customer[] = [
          {
            id: 'sample-1',
            name: 'ABC Trading Company',
            type: 'dealer' as const,
            contactPhone: '+84-123-456-789',
            email: 'contact@abctrading.com',
            address: {
              street: '123 Business Street',
              city: 'Ho Chi Minh City',
              province: 'Ho Chi Minh',
              postalCode: '700000'
            },
            status: 'active',
            metadata: {
              note: 'Sample data - backend endpoint needed'
            }
          },
          {
            id: 'sample-2',
            name: 'XYZ Supply Co.',
            type: 'supplier' as const,
            contactPhone: '+84-987-654-321',
            email: 'info@xyzsupply.com',
            address: {
              street: '456 Industrial Ave',
              city: 'Hanoi',
              province: 'Ha Noi',
              postalCode: '100000'
            },
            status: 'active',
            metadata: {
              note: 'Sample data - backend endpoint needed'
            }
          }
        ].filter(customer => {
          // Apply basic filtering on sample data
          if (params?.type && customer.type !== params.type) return false;
          if (params?.search) {
            const searchLower = params.search.toLowerCase();
            return customer.name.toLowerCase().includes(searchLower) ||
                   customer.email.toLowerCase().includes(searchLower);
          }
          return true;
        });
        
        return {
          data: sampleCustomers,
          pagination: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            totalItems: sampleCustomers.length,
            totalPages: Math.ceil(sampleCustomers.length / (params?.limit || 10))
          }
        };
      }
      
      // Handle other errors
      if (axiosError.response) {
        throw new ApiError(
          (axiosError.response.data as any)?.message || 'Failed to search customers',
          axiosError.response.status || 500,
          axiosError.response.data
        );
      }
      throw new ApiError('Failed to search customers', 500);
    }
  }
};

export default customerService;
