import React, { useReducer, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { orderService } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAccessControl } from '../../hooks/useAccessControl';
import RoleGuard from '../auth/RoleGuard';

// Order status colors
const STATUS_COLORS = {
  pending: { color: 'warning', label: 'Pending' },
  processing: { color: 'info', label: 'Processing' },
  shipped: { color: 'primary', label: 'Shipped' },
  delivered: { color: 'success', label: 'Delivered' },
  cancelled: { color: 'error', label: 'Cancelled' },
  refunded: { color: 'default', label: 'Refunded' },
};

// Types
interface OrderResponse {
  items: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface Order {
  id: string;
  order_number: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  status: keyof typeof STATUS_COLORS;
  total: number;
  created_at: string;
  items_count: number;
}

interface OrderListProps {
  companyId: string;
  onViewOrder?: (orderId: string) => void;
  onEditOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

// Define OrderList state type
interface OrderListState {
  orders: Order[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  searchQuery: string;
  statusFilter: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  error: string | null;
  deleteDialogOpen: boolean;
  selectedOrderId: string | null;
  isSearching: boolean;
  searchAbortController: AbortController | null;
}

// Define the initial state
const initialState: OrderListState = {
  orders: [],
  loading: false,
  page: 0,
  rowsPerPage: 10,
  totalCount: 0,
  searchQuery: '',
  statusFilter: 'all',
  sortBy: 'created_at',
  sortDirection: 'desc',
  error: null,
  deleteDialogOpen: false,
  selectedOrderId: null,
  isSearching: false,
  searchAbortController: null
};

// Define action types
type OrderListAction =
  | { type: 'SET_ORDERS'; payload: { orders: Order[]; totalCount: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ROWS_PER_PAGE'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_SORT_DIRECTION'; payload: 'asc' | 'desc' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DELETE_DIALOG_OPEN'; payload: boolean }
  | { type: 'SET_SELECTED_ORDER_ID'; payload: string | null }
  | { type: 'SET_IS_SEARCHING'; payload: boolean }
  | { type: 'SET_SEARCH_ABORT_CONTROLLER'; payload: AbortController | null };

// Define the reducer function
const orderListReducer = (state: OrderListState, action: OrderListAction): OrderListState => {
  switch (action.type) {
    case 'SET_ORDERS':
      return {
        ...state,
        orders: action.payload.orders,
        totalCount: action.payload.totalCount
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
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
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload
      };
    case 'SET_STATUS_FILTER':
      return {
        ...state,
        statusFilter: action.payload
      };
    case 'SET_SORT_BY':
      return {
        ...state,
        sortBy: action.payload
      };
    case 'SET_SORT_DIRECTION':
      return {
        ...state,
        sortDirection: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_DELETE_DIALOG_OPEN':
      return {
        ...state,
        deleteDialogOpen: action.payload
      };
    case 'SET_SELECTED_ORDER_ID':
      return {
        ...state,
        selectedOrderId: action.payload
      };
    case 'SET_IS_SEARCHING':
      return {
        ...state,
        isSearching: action.payload
      };
    case 'SET_SEARCH_ABORT_CONTROLLER':
      return {
        ...state,
        searchAbortController: action.payload
      };
    default:
      return state;
  }
};

const OrderList: React.FC<OrderListProps> = ({
  companyId,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  allowEdit = true,
  allowDelete = true,
}) => {
  const { canPerform } = useAccessControl();
  
  // Use the reducer for state management
  const [state, dispatch] = useReducer(orderListReducer, initialState);
    // Memoize fetchOrders to prevent unnecessary recreations
  const fetchOrders = useCallback(async (isSearchRequest = false) => {
    if (!companyId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const params = {
        page: state.page + 1,
        limit: state.rowsPerPage,
        status: state.statusFilter !== 'all' ? state.statusFilter : undefined,
        paymentStatus: undefined,
        fromDate: undefined,
        toDate: undefined
      };

      if (isSearchRequest && state.isSearching) {
        return;
      }

      if (isSearchRequest) {
        dispatch({ type: 'SET_IS_SEARCHING', payload: true });
      }

      const response = await orderService.getOrders(params);
      
      // Safely handle the response based on the API structure
      const orders = Array.isArray(response) ? response : (response as any).orders || [];
      const totalItems = typeof (response as any).count === 'number' ? (response as any).count : orders.length;
      
      dispatch({ 
        type: 'SET_ORDERS', 
        payload: { 
          orders: orders,
          totalCount: totalItems
        }
      });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to fetch orders' });
      console.error('Error fetching orders:', err);
      dispatch({ 
        type: 'SET_ORDERS', 
        payload: { 
          orders: [],
          totalCount: 0
        }
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      if (isSearchRequest) {
        dispatch({ type: 'SET_IS_SEARCHING', payload: false });
      }
    }
  }, [companyId, state.page, state.rowsPerPage, state.statusFilter, state.isSearching]);
  // Load orders on initial render and when dependencies change
  useEffect(() => {
    if (!state.isSearching) { // Only fetch if not currently searching
      fetchOrders();
    }
  }, [fetchOrders]);

  // Debounce search query with cleanup
  useEffect(() => {
    if (!state.searchQuery && state.page !== 0) {
      dispatch({ type: 'SET_PAGE', payload: 0 });
      return;
    }

    const timer = setTimeout(() => {
      if (state.searchQuery) {
        fetchOrders(true);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [state.searchQuery, state.page, fetchOrders]);
  // Reset pagination when filters change
  useEffect(() => {
    if (state.page !== 0) {
      dispatch({ type: 'SET_PAGE', payload: 0 });
    }
  }, [state.statusFilter, state.sortBy, state.sortDirection]);
  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    dispatch({ type: 'SET_PAGE', payload: newPage });
  };

  // Handle rows per page change with reset
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    dispatch({ type: 'SET_ROWS_PER_PAGE', payload: newRowsPerPage });
    // Page reset is handled in the reducer
  };

  // Handle status filter change with validation
  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value;
    if (newStatus === state.statusFilter) return; // Prevent unnecessary updates
    
    dispatch({ type: 'SET_STATUS_FILTER', payload: newStatus });
    // Page reset is handled by the useEffect
  };

  // Handle sort change with validation
  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const newSortBy = event.target.value;
    if (newSortBy === state.sortBy) return; // Prevent unnecessary updates
    
    dispatch({ type: 'SET_SORT_BY', payload: newSortBy });
    // Page reset is handled by the useEffect
  };

  // Optimized sort direction change
  const handleSortDirectionChange = () => {
    dispatch({ 
      type: 'SET_SORT_DIRECTION', 
      payload: state.sortDirection === 'asc' ? 'desc' : 'asc' 
    });
    // Page reset is handled by the useEffect
  };
  // Enhanced delete handling
  const handleDeleteClick = useCallback((orderId: string) => {
    dispatch({ type: 'SET_SELECTED_ORDER_ID', payload: orderId });
    dispatch({ type: 'SET_DELETE_DIALOG_OPEN', payload: true });
  }, []);

  // Handle confirm delete with proper cleanup
  const handleConfirmDelete = async () => {
    if (!state.selectedOrderId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      await orderService.deleteOrder(state.selectedOrderId);
      
      // Update local state optimistically
      dispatch({ 
        type: 'SET_ORDERS', 
        payload: { 
          orders: state.orders.filter(order => order.id !== state.selectedOrderId),
          totalCount: Math.max(0, state.totalCount - 1)
        }
      });
      
      // Notify parent component
      if (onDeleteOrder && state.selectedOrderId) {
        onDeleteOrder(state.selectedOrderId);
      }

    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to delete order' });
      console.error('Error deleting order:', err);
      
      // Refresh orders to ensure consistent state
      fetchOrders();
    } finally {
      dispatch({ type: 'SET_DELETE_DIALOG_OPEN', payload: false });
      dispatch({ type: 'SET_SELECTED_ORDER_ID', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  // Handle search input changes with cleanup
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Cancel any pending search request
    if (state.searchAbortController) {
      state.searchAbortController.abort();
    }

    // Create new abort controller for this search
    const newController = new AbortController();
    dispatch({ type: 'SET_SEARCH_ABORT_CONTROLLER', payload: newController });
    
    dispatch({ type: 'SET_SEARCH_QUERY', payload: newValue });

    if (!newValue) {
      // Clear search results immediately when search is emptied
      dispatch({ 
        type: 'SET_ORDERS', 
        payload: { 
          orders: [],
          totalCount: 0
        }
      });
      fetchOrders(); // Fetch default orders
    }
  }, [state.searchAbortController, fetchOrders]);
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (state.searchAbortController) {
        state.searchAbortController.abort();
      }
    };
  }, [state.searchAbortController]);
  // Render table skeleton while loading
  const renderSkeleton = () => (
    <TableBody>
      {Array.from(new Array(state.rowsPerPage)).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" /></TableCell>
          <TableCell><Skeleton animation="wave" width={100} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <Box>      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2">
              Orders
            </Typography>
            
            <RoleGuard action="order:create">
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => window.location.href = `/orders/new?company=${companyId}`}
              >
                Create Order
              </Button>
            </RoleGuard>
          </Box>
          <Box sx={{ flex: 2 }}><TextField
              placeholder="Search orders..."
              size="small"
              fullWidth
              value={state.searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>            <Select
              labelId="status-filter-label"
              value={state.statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {Object.entries(STATUS_COLORS).map(([value, { label }]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>            <Select
              labelId="sort-by-label"
              value={state.sortBy}
              onChange={handleSortChange}
              label="Sort By"
            >
              <MenuItem value="created_at">Date</MenuItem>
              <MenuItem value="order_number">Order Number</MenuItem>
              <MenuItem value="customer.name">Customer Name</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="total">Total</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={handleSortDirectionChange}
            sx={{ minWidth: 120 }}
          >
            {state.sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </Box>
      </Paper>
        {state.error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {state.error}
        </Typography>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Items</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          
          {state.loading ? (
            renderSkeleton()
          ) : (
            <TableBody>
              {state.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                state.orders.map((order: Order) => {
                  const statusConfig = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                  
                  return (
                    <TableRow key={order.id} hover>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{order.customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.customer.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={statusConfig.label}
                          color={statusConfig.color as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{order.items_count}</TableCell>
                      <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>                          {onViewOrder && (
                            <IconButton 
                              size="small"
                              onClick={() => onViewOrder(order.id)}
                              color="primary"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {allowEdit && onEditOrder && canPerform('order:edit') && (
                            <IconButton 
                              size="small"
                              onClick={() => onEditOrder(order.id)}
                              color="secondary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {allowDelete && onDeleteOrder && canPerform('order:delete') && (
                            <IconButton 
                              size="small"
                              onClick={() => handleDeleteClick(order.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          )}
        </Table>
      </TableContainer>
        <TablePagination
        component="div"
        count={state.totalCount}
        page={state.page}
        onPageChange={handleChangePage}
        rowsPerPage={state.rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={state.deleteDialogOpen}
        onClose={() => dispatch({ type: 'SET_DELETE_DIALOG_OPEN', payload: false })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => dispatch({ type: 'SET_DELETE_DIALOG_OPEN', payload: false })}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderList;