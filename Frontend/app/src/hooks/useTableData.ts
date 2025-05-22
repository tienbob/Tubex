import { useReducer, useCallback } from 'react';

// Generic type for table data
export interface TableDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  searchQuery: string;
  filters: Record<string, any>;
}

// Generic action types
export type TableDataAction<T> =
  | { type: 'SET_DATA'; payload: { data: T[]; totalCount: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ROWS_PER_PAGE'; payload: number }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_SORT_DIRECTION'; payload: 'asc' | 'desc' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTER'; payload: { key: string; value: any } }
  | { type: 'RESET_FILTERS' };

// Create a reducer function
export function createTableDataReducer<T>() {
  return (state: TableDataState<T>, action: TableDataAction<T>): TableDataState<T> => {
    switch (action.type) {
      case 'SET_DATA':
        return {
          ...state,
          data: action.payload.data,
          totalCount: action.payload.totalCount
        };
      case 'SET_LOADING':
        return {
          ...state,
          loading: action.payload
        };
      case 'SET_ERROR':
        return {
          ...state,
          error: action.payload
        };
      case 'SET_PAGE':
        return {
          ...state,
          page: action.payload
        };
      case 'SET_ROWS_PER_PAGE':
        return {
          ...state,
          rowsPerPage: action.payload,
          page: 0 // Reset to first page when changing rows per page
        };
      case 'SET_SORT_BY':
        return {
          ...state,
          sortBy: action.payload,
          page: 0 // Reset to first page when changing sort
        };
      case 'SET_SORT_DIRECTION':
        return {
          ...state,
          sortDirection: action.payload,
          page: 0 // Reset to first page when changing sort direction
        };
      case 'SET_SEARCH_QUERY':
        return {
          ...state,
          searchQuery: action.payload,
          page: 0 // Reset to first page when searching
        };
      case 'SET_FILTER':
        return {
          ...state,
          filters: {
            ...state.filters,
            [action.payload.key]: action.payload.value
          },
          page: 0 // Reset to first page when filtering
        };
      case 'RESET_FILTERS':
        return {
          ...state,
          filters: {},
          searchQuery: '',
          page: 0
        };
      default:
        return state;
    }
  };
}

// Hook options interface
interface UseTableDataOptions<T> {
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
  defaultRowsPerPage?: number;
  defaultFilters?: Record<string, any>;
  fetchDataFn?: (params: any) => Promise<{ data: T[]; totalCount: number }>;
}

// Custom hook for table data management
export function useTableData<T>(options: UseTableDataOptions<T> = {}) {
  const {
    defaultSortBy = 'id',
    defaultSortDirection = 'desc',
    defaultRowsPerPage = 10,
    defaultFilters = {}
  } = options;

  // Create initial state
  const initialState: TableDataState<T> = {
    data: [],
    loading: false,
    error: null,
    page: 0,
    rowsPerPage: defaultRowsPerPage,
    totalCount: 0,
    sortBy: defaultSortBy,
    sortDirection: defaultSortDirection,
    searchQuery: '',
    filters: defaultFilters
  };

  // Create and use reducer
  const [state, dispatch] = useReducer(createTableDataReducer<T>(), initialState);

  // Helper function to fetch data
  const fetchData = useCallback(async (customFetchFn?: (params: any) => Promise<{ data: T[]; totalCount: number }>) => {
    const fetchFn = customFetchFn || options.fetchDataFn;
    
    if (!fetchFn) {
      dispatch({ type: 'SET_ERROR', payload: 'No fetch function provided' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const params = {
        page: state.page + 1, // Convert to 1-based for API
        limit: state.rowsPerPage,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        search: state.searchQuery || undefined,
        ...state.filters
      };
      
      const { data, totalCount } = await fetchFn(params);
      dispatch({ type: 'SET_DATA', payload: { data, totalCount } });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to fetch data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.page, state.rowsPerPage, state.sortBy, state.sortDirection, state.searchQuery, state.filters, options.fetchDataFn]);

  // Event handlers
  const handlePageChange = useCallback((newPage: number) => {
    dispatch({ type: 'SET_PAGE', payload: newPage });
  }, []);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    dispatch({ type: 'SET_ROWS_PER_PAGE', payload: newRowsPerPage });
  }, []);

  const handleSortByChange = useCallback((newSortBy: string) => {
    dispatch({ type: 'SET_SORT_BY', payload: newSortBy });
  }, []);

  const handleSortDirectionChange = useCallback(() => {
    dispatch({ 
      type: 'SET_SORT_DIRECTION', 
      payload: state.sortDirection === 'asc' ? 'desc' : 'asc' 
    });
  }, [state.sortDirection]);

  const handleSearchQueryChange = useCallback((newSearchQuery: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: newSearchQuery });
  }, []);

  const handleFilterChange = useCallback((key: string, value: any) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  return {
    // State
    data: state.data,
    loading: state.loading,
    error: state.error,
    page: state.page,
    rowsPerPage: state.rowsPerPage,
    totalCount: state.totalCount,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
    searchQuery: state.searchQuery,
    filters: state.filters,
    
    // Actions
    dispatch,
    
    // Handlers
    handlePageChange,
    handleRowsPerPageChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleSearchQueryChange,
    handleFilterChange,
    resetFilters,
    fetchData
  };
}

export default useTableData;
