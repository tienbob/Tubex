import React, { useReducer, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import WarningIcon from '@mui/icons-material/Warning';
import DataTable, { Column } from '../DataTable';
import { useTheme } from '../../../contexts/ThemeContext';
import { inventoryService } from '../../../services/api';
import { InventoryItem } from '../../../services/api/inventoryService';

interface InventoryListProps {
  companyId: string; // Required parameter
  warehouseId?: string;
  onAdjustInventory?: (inventoryId: string) => void;
  onTransferInventory?: (inventoryId: string) => void;
  onAddInventory?: () => void;
  hideActions?: boolean;
  maxHeight?: number | string;
  onInventorySelect?: (inventoryId: string) => void;
  onTransferClick?: (product: { id: string; name: string }) => void;
};

// Define types for inventory and warehouse
interface Inventory extends InventoryItem {
  product_name?: string;
  unit?: string;
  warehouse_name?: string;
  threshold?: number;
  warehouse_capacity?: number;
  last_updated?: string;
  [key: string]: any; // For additional properties
}

interface Warehouse {
  id: string;
  name: string;
  [key: string]: any; // For additional properties
}

// Define state interface
interface InventoryListState {
  inventory: Inventory[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedWarehouse: string;
  warehouses: Warehouse[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  batchFilter: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

// Define action types
type InventoryListAction =
  | { type: 'SET_INVENTORY'; payload: { data: Inventory[], totalCount: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SELECTED_WAREHOUSE'; payload: string }
  | { type: 'SET_WAREHOUSES'; payload: Warehouse[] }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ROWS_PER_PAGE'; payload: number }
  | { type: 'SET_BATCH_FILTER'; payload: string }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_SORT_DIRECTION'; payload: 'asc' | 'desc' };

// Define initial state
const initialState: InventoryListState = {
  inventory: [],
  loading: false,
  error: null,
  searchTerm: '',
  selectedWarehouse: '',
  warehouses: [],
  page: 0,
  rowsPerPage: 10,
  totalCount: 0,
  batchFilter: '',
  sortBy: 'product_name',
  sortDirection: 'asc'
};

// Define reducer function
const inventoryListReducer = (state: InventoryListState, action: InventoryListAction): InventoryListState => {
  switch (action.type) {
    case 'SET_INVENTORY':
      return {
        ...state,
        inventory: action.payload.data,
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
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload
      };
    case 'SET_SELECTED_WAREHOUSE':
      return {
        ...state,
        selectedWarehouse: action.payload,
        page: 0 // Reset to first page when changing warehouse
      };
    case 'SET_WAREHOUSES':
      return {
        ...state,
        warehouses: action.payload
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
    case 'SET_BATCH_FILTER':
      return {
        ...state,
        batchFilter: action.payload,
        page: 0 // Reset to first page when changing filter
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
    default:
      return state;
  }
};

const InventoryList: React.FC<InventoryListProps> = ({
  companyId,
  warehouseId,
  onAdjustInventory,
  onTransferInventory,
  onAddInventory,
  hideActions = false,
  maxHeight,
  onInventorySelect,
  onTransferClick,
}) => {
  // Theme hooks
  const { theme: whitelabelTheme } = useTheme();
  const muiTheme = useMuiTheme();

  // Use reducer for state management
  const [state, dispatch] = useReducer(inventoryListReducer, {
    ...initialState,
    selectedWarehouse: warehouseId || ''
  });
  
  // Custom button style based on the whitelabel theme
  const buttonStyle = {
    backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
    color: '#fff',
    borderRadius: whitelabelTheme?.buttonRadius !== undefined ? `${whitelabelTheme.buttonRadius}px` : undefined,
    '&:hover': {
      backgroundColor: whitelabelTheme?.primaryColor ? 
        `${whitelabelTheme.primaryColor}dd` : muiTheme.palette.primary.dark,
    },
  };
  const fetchInventory = useCallback(async () => {
    if (!companyId) {
      dispatch({ type: 'SET_ERROR', payload: 'Company ID is required' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const params: any = {
        page: state.page + 1, // API uses 1-based page indexing
        limit: state.rowsPerPage,
        search: state.searchTerm || undefined,
        warehouseId: state.selectedWarehouse || undefined,
        companyId: companyId,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
      };
      
      if (state.batchFilter) {
        params.batchId = state.batchFilter;
      }
      
      const response = await inventoryService.getInventory(params);
      dispatch({ 
        type: 'SET_INVENTORY', 
        payload: {
          data: response.data || [],
          totalCount: response.pagination?.total || 0
        }
      });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load inventory' });
      console.error('Error fetching inventory:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [companyId, state.page, state.rowsPerPage, state.searchTerm, state.selectedWarehouse, 
      state.batchFilter, state.sortBy, state.sortDirection]);
  
  const fetchWarehouses = useCallback(async () => {
    if (warehouseId) return; // Don't fetch warehouses if one is specified
    if (!companyId) {
      console.error('Company ID is required to fetch warehouses');
      return;
    }
    
    try {
      const response = await inventoryService.getWarehouses(companyId);
      
      // Handle different potential response structures
      let warehousesList: Array<any> = [];
      
      // If response.data is an array
      if (Array.isArray(response.data)) {
        warehousesList = response.data;
      } 
      // If response.data contains a warehouses property that is an array
      else if (response.data && typeof response.data === 'object' && 'warehouses' in response.data && 
              Array.isArray((response.data as any).warehouses)) {
        warehousesList = (response.data as any).warehouses;
      }
      // If response.data.data contains the warehouses array
      else if (response.data && typeof response.data === 'object' && 'data' in response.data && 
              Array.isArray((response.data as any).data)) {
        warehousesList = (response.data as any).data;
      }
      // Default to empty array if no matching structure is found
      else {
        console.error('Unexpected API response format:', response);
        warehousesList = [];
      }
      
      dispatch({ type: 'SET_WAREHOUSES', payload: warehousesList });
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      // Always set warehouses to an empty array on error
      dispatch({ type: 'SET_WAREHOUSES', payload: [] });
    }
  }, [companyId, warehouseId]);
    // useEffect hooks
  useEffect(() => {
    if (companyId) {
      fetchWarehouses();
    }
  }, [companyId, warehouseId, fetchWarehouses]);
  
  useEffect(() => {
    if (companyId) {
      fetchInventory();
    }
  }, [fetchInventory]);
  
  const handleSearch = useCallback(() => {
    dispatch({ type: 'SET_PAGE', payload: 0 }); // Reset to first page when searching
    fetchInventory();
  }, [fetchInventory]);
  
  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);
  
  const handleWarehouseChange = useCallback((event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    dispatch({ type: 'SET_SELECTED_WAREHOUSE', payload: value });
    // Page reset is handled in the reducer
  }, []);
  
  const formatQuantityWithUnit = (quantity: number, unit: string) => {
    return `${quantity.toLocaleString()} ${unit || ''}`;
  };

  const getStockLevelIndicator = (current: number, threshold: number, capacity: number) => {
    let color: 'default' | 'success' | 'warning' | 'error' = 'default';
    let label = 'Normal';
    
    const ratio = current / capacity;
    
    if (current <= threshold) {
      color = 'error';
      label = 'Low';
    } else if (ratio >= 0.9) {
      color = 'warning';
      label = 'High';
    } else if (ratio >= 0.5) {
      color = 'success';
      label = 'Good';
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  // Validate the required companyId after all hooks are called
  if (!companyId) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Company ID is required to display inventory
        </Alert>
      </Box>
    );
  }
  
  // Define columns
  const columns: Column[] = [
    {
      id: 'product_name',
      label: 'Product',
      minWidth: 170,
    },
    {
      id: 'quantity',
      label: 'Quantity',
      minWidth: 120,
      align: 'right',
      format: (value, row) => formatQuantityWithUnit(value, row?.unit)
    },
    {
      id: 'warehouse_name',
      label: 'Warehouse',
      minWidth: 150,
    },
    {
      id: 'batch_number',
      label: 'Batch',
      minWidth: 120,
    },
    {
      id: 'stock_level',
      label: 'Status',
      minWidth: 120,
      format: (_, row) => getStockLevelIndicator(
        row.quantity, 
        row.threshold || 0, 
        row.warehouse_capacity || 1000
      )
    },
    {
      id: 'last_updated',
      label: 'Last Updated',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleString() : 'N/A'
    }
  ];
  
  // Add actions column if required
  if (!hideActions) {
    columns.push({
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'right',
      format: (_, row) => (
        <Box>
          {onAdjustInventory && (
            <Tooltip title="Adjust Inventory">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustInventory(row.id);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {onTransferInventory && (
            <Tooltip title="Transfer Inventory">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onTransferInventory(row.id);
                }}
              >
                <TransferWithinAStationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    });
  }
  
  return (
    <Box sx={{ maxHeight }}>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' } 
      }}>
        <Typography variant="h6" component="h2">
          Inventory
          {state.inventory.some(item => item.quantity <= (item.threshold || 0)) && (
            <Tooltip title="Some products have low stock">
              <WarningIcon 
                color="warning" 
                fontSize="small" 
                sx={{ ml: 1, verticalAlign: 'middle' }} 
              />
            </Tooltip>
          )}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search products..."
              size="small"
              value={state.searchTerm}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_TERM', payload: e.target.value })}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: state.searchTerm && (
                  <InputAdornment position="end">
                    <Button 
                      size="small" 
                      onClick={() => {
                        dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
                        if (!state.searchTerm) return;
                        setTimeout(() => handleSearch(), 0);
                      }}
                    >
                      Clear
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            
            {!warehouseId && state.warehouses.length > 0 && (
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel id="warehouse-filter-label">Warehouse</InputLabel>
                <Select
                  labelId="warehouse-filter-label"
                  value={state.selectedWarehouse}
                  onChange={handleWarehouseChange}
                  label="Warehouse"
                >
                  <MenuItem value="">All Warehouses</MenuItem>
                  {Array.isArray(state.warehouses) ? state.warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  )) : null}
                </Select>
              </FormControl>
            )}
            
            <Tooltip title="Advanced Filters">
              <IconButton>
                <TuneIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {onAddInventory && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddInventory}
              sx={buttonStyle}
            >
              Add Inventory
            </Button>
          )}
        </Box>
      </Box>
      
      <DataTable
        columns={columns}
        data={state.inventory}
        loading={state.loading}
        error={state.error}
        pagination={{
          page: state.page,
          totalCount: state.totalCount,
          rowsPerPage: state.rowsPerPage,
          onPageChange: (newPage) => dispatch({ type: 'SET_PAGE', payload: newPage }),
          onRowsPerPageChange: (newRowsPerPage) => {
            dispatch({ type: 'SET_ROWS_PER_PAGE', payload: newRowsPerPage });
            // Page reset is handled in the reducer
          },
        }}
        onRowClick={onInventorySelect ? (row) => onInventorySelect(row.id) : undefined}
      />
    </Box>
  );
};

export default InventoryList;