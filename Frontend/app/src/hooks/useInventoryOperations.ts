import { useState, useCallback } from 'react';
import useTableData from './useTableData';
import useApiRequest from './useApiRequest';
import { inventoryService } from '../services/api';
import { InventoryItem, InventoryCreateInput, ApiResponse } from '../services/api/inventoryService';

interface UseInventoryOperationsProps {
  companyId: string;
  warehouseId?: string;
  onInventoryCreated?: (item: InventoryItem) => void;
  onInventoryUpdated?: (item: InventoryItem) => void;
  onInventoryDeleted?: (itemId: string) => void;
}

/**
 * Custom hook for inventory operations
 */
export function useInventoryOperations({
  companyId,
  warehouseId,
  onInventoryCreated,
  onInventoryUpdated,
  onInventoryDeleted
}: UseInventoryOperationsProps) {
  // Function to fetch inventory data with parameters
  const fetchInventoryData = useCallback(
    async (params: any) => {
      if (!companyId) {
        return { data: [], totalCount: 0 };
      }

      const apiParams = {
        companyId,
        warehouseId,
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
        search: params.search || undefined,
        ...params.filters
      };

      try {
        const response = await inventoryService.getInventory(apiParams);
        return {
          data: response.data || [],
          totalCount: response.pagination?.total || response.data?.length || 0
        };
      } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
      }
    },
    [companyId, warehouseId]
  );

  // Use table hook for inventory data
  const inventoryTable = useTableData<InventoryItem>({
    defaultSortBy: 'product.name',
    defaultSortDirection: 'asc',
    fetchDataFn: fetchInventoryData
  });
  // API request for creating inventory item
  const createInventoryRequest = useApiRequest<{ data: InventoryItem }, [InventoryCreateInput]>(
    async (itemData) => {
      return await inventoryService.createInventoryItem(itemData);
    },
    [{ } as InventoryCreateInput], // Provide default args with correct type
    {
      manual: true,
      onSuccess: (response) => {
        inventoryTable.fetchData();
        if (onInventoryCreated && response.data) {
          onInventoryCreated(response.data);
        }
      }
    }
  );
  // API request for adjusting inventory
  const adjustInventoryRequest = useApiRequest<ApiResponse<void>, [string, number, string]>(
    async (inventoryId, adjustment, reason) => {
      return await inventoryService.adjustInventory(inventoryId, { adjustment, reason });
    },
    ['', 0, ''], // Provide default args with correct types
    {
      manual: true,
      onSuccess: () => {
        inventoryTable.fetchData();
      }
    }
  );
  // API request for transferring inventory
  const transferInventoryRequest = useApiRequest<any, [any]>(
    async (transferData) => {
      return await inventoryService.transferInventory(transferData);
    },
    [{}], // Provide a default empty object argument
    {
      manual: true,
      onSuccess: () => {
        inventoryTable.fetchData();
      }
    }
  );

  // Helper function to create a new inventory item
  const createInventoryItem = useCallback(
    (itemData: InventoryCreateInput) => {
      if (!companyId) {
        return Promise.reject(new Error('Company ID is missing'));
      }
      
      const fullItemData = {
        ...itemData,
        company_id: companyId
      };
      
      return createInventoryRequest.request(fullItemData);
    },
    [companyId, createInventoryRequest]
  );

  // Helper function to adjust inventory
  const adjustInventory = useCallback(
    (inventoryId: string, adjustment: number, reason: string) => {
      return adjustInventoryRequest.request(inventoryId, adjustment, reason);
    },
    [adjustInventoryRequest]
  );

  // Helper function to transfer inventory
  const transferInventory = useCallback(
    (sourceWarehouseId: string, targetWarehouseId: string, productId: string, quantity: number) => {
      if (!companyId) {
        return Promise.reject(new Error('Company ID is missing'));
      }
      
      const transferData = {
        source_warehouse_id: sourceWarehouseId,
        target_warehouse_id: targetWarehouseId,
        product_id: productId,
        quantity: quantity
      };
      
      return transferInventoryRequest.request(transferData);
    },
    [companyId, transferInventoryRequest]
  );

  // Get combined error from any of the API requests
  const error =
    inventoryTable.error ||
    createInventoryRequest.error?.message ||
    adjustInventoryRequest.error?.message ||
    transferInventoryRequest.error?.message;

  // Check if any request is loading
  const isLoading =
    inventoryTable.loading ||
    createInventoryRequest.isLoading ||
    adjustInventoryRequest.isLoading ||
    transferInventoryRequest.isLoading;

  // Function to refetch data when warehouse changes
  const refreshInventory = useCallback(() => {
    inventoryTable.fetchData();
  }, [inventoryTable]);

  return {
    // State
    inventory: inventoryTable.data,
    isLoading,
    error,
    
    // Table state and actions
    page: inventoryTable.page,
    rowsPerPage: inventoryTable.rowsPerPage,
    totalCount: inventoryTable.totalCount,
    sortBy: inventoryTable.sortBy,
    sortDirection: inventoryTable.sortDirection,
    searchQuery: inventoryTable.searchQuery,
    filters: inventoryTable.filters,
    
    // Table handlers
    handlePageChange: inventoryTable.handlePageChange,
    handleRowsPerPageChange: inventoryTable.handleRowsPerPageChange,
    handleSortByChange: inventoryTable.handleSortByChange,
    handleSortDirectionChange: inventoryTable.handleSortDirectionChange,
    handleSearchQueryChange: inventoryTable.handleSearchQueryChange,
    handleFilterChange: inventoryTable.handleFilterChange,
    resetFilters: inventoryTable.resetFilters,
    
    // Inventory operation functions
    refreshInventory,
    createInventoryItem,
    adjustInventory,
    transferInventory,
    
    // API request states
    createInventoryRequest,
    adjustInventoryRequest,
    transferInventoryRequest
  };
}

export default useInventoryOperations;
