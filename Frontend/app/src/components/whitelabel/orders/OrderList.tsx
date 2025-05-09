import React, { useState, useEffect, useCallback } from 'react';
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
import { orderService } from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';

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

const OrderList: React.FC<OrderListProps> = ({
  companyId,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  allowEdit = true,
  allowDelete = true,
}) => {
  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null);
  
  // Memoize fetchOrders to prevent unnecessary recreations
  const fetchOrders = useCallback(async (isSearchRequest = false) => {
    if (!companyId) return;
    
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentStatus: undefined,
        fromDate: undefined,
        toDate: undefined
      };

      if (isSearchRequest && isSearching) {
        return;
      }

      if (isSearchRequest) {
        setIsSearching(true);
      }

      const response = await orderService.getOrders(params);
      
      // Safely handle the response based on the API structure
      const orders = Array.isArray(response) ? response : (response as any).orders || [];
      const totalItems = typeof (response as any).count === 'number' ? (response as any).count : orders.length;
      
      setOrders(orders);
      setTotalCount(totalItems);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Error fetching orders:', err);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      if (isSearchRequest) {
        setIsSearching(false);
      }
    }
  }, [companyId, page, rowsPerPage, statusFilter, isSearching]);

  // Load orders on initial render and when dependencies change
  useEffect(() => {
    if (!isSearching) { // Only fetch if not currently searching
      fetchOrders();
    }
  }, [fetchOrders]);

  // Debounce search query with cleanup
  useEffect(() => {
    if (!searchQuery && page !== 0) {
      setPage(0);
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchOrders(true);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, page, fetchOrders]);

  // Reset pagination when filters change
  useEffect(() => {
    if (page !== 0) {
      setPage(0);
    }
  }, [statusFilter, sortBy, sortDirection]);

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change with reset
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to first page
  };

  // Handle status filter change with validation
  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value;
    if (newStatus === statusFilter) return; // Prevent unnecessary updates
    
    setStatusFilter(newStatus);
    // Page reset is handled by the useEffect
  };

  // Handle sort change with validation
  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const newSortBy = event.target.value;
    if (newSortBy === sortBy) return; // Prevent unnecessary updates
    
    setSortBy(newSortBy);
    // Page reset is handled by the useEffect
  };

  // Optimized sort direction change
  const handleSortDirectionChange = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    // Page reset is handled by the useEffect
  };

  // Enhanced delete handling
  const handleDeleteClick = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setDeleteDialogOpen(true);
  }, []);

  // Handle confirm delete with proper cleanup
  const handleConfirmDelete = async () => {
    if (!selectedOrderId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await orderService.deleteOrder(selectedOrderId);
      
      // Update local state optimistically
      setOrders(prevOrders => prevOrders.filter(order => order.id !== selectedOrderId));
      setTotalCount(prev => Math.max(0, prev - 1));
      
      // Notify parent component
      if (onDeleteOrder) {
        onDeleteOrder(selectedOrderId);
      }

      // Clear error if successful
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete order');
      console.error('Error deleting order:', err);
      
      // Refresh orders to ensure consistent state
      fetchOrders();
    } finally {
      setDeleteDialogOpen(false);
      setSelectedOrderId(null);
      setLoading(false);
    }
  };

  // Handle search input changes with cleanup
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // Cancel any pending search request
    if (searchAbortController) {
      searchAbortController.abort();
    }

    // Create new abort controller for this search
    const newController = new AbortController();
    setSearchAbortController(newController);
    
    setSearchQuery(newValue);

    if (!newValue) {
      // Clear search results immediately when search is emptied
      setOrders([]);
      setTotalCount(0);
      fetchOrders(); // Fetch default orders
    }
  }, [searchAbortController, fetchOrders]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (searchAbortController) {
        searchAbortController.abort();
      }
    };
  }, [searchAbortController]);

  // Render table skeleton while loading
  const renderSkeleton = () => (
    <TableBody>
      {Array.from(new Array(rowsPerPage)).map((_, index) => (
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
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">
              Orders
            </Typography>
          </Box>
          <Box sx={{ flex: 2 }}>
            <TextField
              placeholder="Search orders..."
              size="small"
              fullWidth
              value={searchQuery}
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
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
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
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
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
            {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </Box>
      </Paper>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
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
          
          {loading ? (
            renderSkeleton()
          ) : (
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
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
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {onViewOrder && (
                            <IconButton 
                              size="small"
                              onClick={() => onViewOrder(order.id)}
                              color="primary"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {allowEdit && onEditOrder && (
                            <IconButton 
                              size="small"
                              onClick={() => onEditOrder(order.id)}
                              color="secondary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          
                          {allowDelete && onDeleteOrder && (
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
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderList;