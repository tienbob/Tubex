import React, { useState, useCallback, useRef } from 'react';
import useApiRequest from './useApiRequest';
import { warehouseService } from '../services/api';
import { Warehouse, WarehouseCreateInput, WarehouseUpdateInput } from '../services/api/warehouseService';

interface UseWarehouseOperationsProps {
  companyId: string;
  onWarehouseCreated?: (warehouse: Warehouse) => void;
  onWarehouseUpdated?: (warehouse: Warehouse) => void;
  onWarehouseDeleted?: (warehouseId: string) => void;
}

/**
 * Custom hook for warehouse CRUD operations
 */
export function useWarehouseOperations({
  companyId,
  onWarehouseCreated,
  onWarehouseUpdated,
  onWarehouseDeleted
}: UseWarehouseOperationsProps) {  // Track the currently selected warehouse
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  
  // Reference to store the current warehouse ID for delete operation
  const deleteWarehouseIdRef = useRef<string>('');

  // API request for fetching warehouses
  const warehousesRequest = useApiRequest<{ data: Warehouse[] }>(
    async () => {
      if (!companyId) {
        return { data: [] };
      }
      return await warehouseService.getWarehouses(companyId);
    },
    [],
    {
      dependencies: [companyId],
      manual: !companyId
    }
  );
  // API request for fetching a single warehouse by ID
  const singleWarehouseRequest = useApiRequest<{ data: Warehouse }, [string, string]>(
    async (companyId, warehouseId) => {
      return await warehouseService.getWarehouse(companyId, warehouseId);
    },
    ['', ''], // Default empty string arguments
    { manual: true }
  );
  // API request for creating a warehouse
  const createWarehouseRequest = useApiRequest<{ data: Warehouse }, [string, WarehouseCreateInput]>(
    async (companyId, warehouseData) => {
      return await warehouseService.createWarehouse(companyId, warehouseData);
    },
    ['', {} as WarehouseCreateInput], // Default arguments
    {
      manual: true,
      onSuccess: (response) => {
        warehousesRequest.request();
        if (onWarehouseCreated && response.data) {
          onWarehouseCreated(response.data);
        }
      }
    }
  );
  // API request for updating a warehouse
  const updateWarehouseRequest = useApiRequest<{ data: Warehouse }, [string, string, WarehouseUpdateInput]>(
    async (companyId, warehouseId, warehouseData) => {
      return await warehouseService.updateWarehouse(companyId, warehouseId, warehouseData);
    },
    ['', '', {} as WarehouseUpdateInput], // Default arguments
    {
      manual: true,
      onSuccess: (response) => {
        warehousesRequest.request();
        if (onWarehouseUpdated && response.data) {
          onWarehouseUpdated(response.data);
        }
      }
    }
  );
  // API request for deleting a warehouse
  const deleteWarehouseRequest = useApiRequest<any, [string, string]>(
    async (companyId, warehouseId) => {
      return await warehouseService.deleteWarehouse(companyId, warehouseId);
    },
    ['', ''], // Default arguments
    {      manual: true,
      onSuccess: (response) => {
        // Store warehouseId locally from the request context
        const storedWarehouseId = deleteWarehouseIdRef.current;
        
        warehousesRequest.request();
        if (onWarehouseDeleted && storedWarehouseId) {
          onWarehouseDeleted(storedWarehouseId);
        }
        
        // If the deleted warehouse was selected, reset selection
        if (selectedWarehouse === storedWarehouseId) {
          setSelectedWarehouse('');
        }
      }
    }
  );

  // Helper function to fetch all warehouses
  const fetchWarehouses = useCallback(() => {
    if (companyId) {
      warehousesRequest.request();
    }
  }, [companyId, warehousesRequest]);

  // Helper function to fetch a specific warehouse
  const fetchWarehouse = useCallback(
    (warehouseId: string) => {
      if (companyId && warehouseId) {
        return singleWarehouseRequest.request(companyId, warehouseId);
      }
      return Promise.reject(new Error('Company ID or Warehouse ID is missing'));
    },
    [companyId, singleWarehouseRequest]
  );

  // Helper function to create a new warehouse
  const createWarehouse = useCallback(
    (warehouseData: WarehouseCreateInput) => {
      if (companyId) {
        return createWarehouseRequest.request(companyId, warehouseData);
      }
      return Promise.reject(new Error('Company ID is missing'));
    },
    [companyId, createWarehouseRequest]
  );

  // Helper function to update a warehouse
  const updateWarehouse = useCallback(
    (warehouseId: string, warehouseData: WarehouseUpdateInput) => {
      if (companyId && warehouseId) {
        return updateWarehouseRequest.request(companyId, warehouseId, warehouseData);
      }
      return Promise.reject(new Error('Company ID or Warehouse ID is missing'));
    },
    [companyId, updateWarehouseRequest]
  );
  // Helper function to delete a warehouse
  const deleteWarehouse = useCallback(
    (warehouseId: string) => {
      if (companyId && warehouseId) {
        // Store the warehouseId in the ref to access it in onSuccess callback
        deleteWarehouseIdRef.current = warehouseId;
        return deleteWarehouseRequest.request(companyId, warehouseId);
      }
      return Promise.reject(new Error('Company ID or Warehouse ID is missing'));
    },
    [companyId, deleteWarehouseRequest]
  );

  // Get combined error from any of the API requests
  const error =
    warehousesRequest.error ||
    singleWarehouseRequest.error ||
    createWarehouseRequest.error ||
    updateWarehouseRequest.error ||
    deleteWarehouseRequest.error;

  // Check if any request is loading
  const isLoading =
    warehousesRequest.isLoading ||
    singleWarehouseRequest.isLoading ||
    createWarehouseRequest.isLoading ||
    updateWarehouseRequest.isLoading ||
    deleteWarehouseRequest.isLoading;

  // Get warehouses from the request data
  const warehouses = warehousesRequest.data?.data || [];

  return {
    // State
    selectedWarehouse,
    setSelectedWarehouse,
    warehouses,
    error,
    isLoading,
    
    // API request states
    warehousesRequest,
    singleWarehouseRequest,
    createWarehouseRequest,
    updateWarehouseRequest,
    deleteWarehouseRequest,
    
    // Helper methods
    fetchWarehouses,
    fetchWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
  };
}

export default useWarehouseOperations;
