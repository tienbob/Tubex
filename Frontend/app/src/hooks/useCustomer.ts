import { useState, useCallback } from 'react';
import customerService, { Customer, CustomersResponse } from '../services/api/customerService';

export const useCustomer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get a single customer by ID
   */
  const getCustomerById = useCallback(async (customerId: string): Promise<Customer | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await customerService.getCustomerById(customerId);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch customer details');
      return null;
    }
  }, []);

  /**
   * Get multiple customers by IDs in a batch
   */
  const getCustomersByIds = useCallback(async (customerIds: string[]): Promise<Record<string, Customer> | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await customerService.getCustomersByIds(customerIds);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to fetch customers');
      return null;
    }
  }, []);

  /**
   * Search customers with optional filters
   */
  const searchCustomers = useCallback(async (params?: any): Promise<CustomersResponse | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await customerService.searchCustomers(params);
      setLoading(false);
      return result;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Failed to search customers');
      return null;
    }
  }, []);

  return {
    loading,
    error,
    getCustomerById,
    getCustomersByIds,
    searchCustomers
  };
};

export default useCustomer;
