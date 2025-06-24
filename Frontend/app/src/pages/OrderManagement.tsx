import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { orderService } from '../services/api';
import OrderDetails from '../components/orders/OrderDetails';
import CreateOrderForm from '../components/orders/CreateOrderForm';
import { format } from 'date-fns';
import { useAuth } from '../components/auth/AuthContext';
import { useAccessControl } from '../hooks/useAccessControl';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `order-tab-${index}`,
    'aria-controls': `order-tabpanel-${index}`,
  };
}

const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
  'pending': 'warning',
  'processing': 'info',
  'shipped': 'primary',
  'delivered': 'success',
  'cancelled': 'error',
  'returned': 'secondary',
  'default': 'default'
};

const OrderManagement: React.FC = () => {
  const { canPerform, permissions } = useAccessControl();
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  
  // Get company ID from auth context
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string>('');
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);

  const location = useLocation();
  const params = useParams();

  // Set companyId from auth context when user data is available
  useEffect(() => {
    if (user && user.companyId) {
      setCompanyId(user.companyId);
    }
  }, [user]);

  // Fetch orders when component mounts or filters change
  useEffect(() => {
    if (companyId) {
      fetchOrders();
    }
  }, [filterStatus, dateRange, companyId]);

  // Parse query parameters and set up the correct view
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const action = queryParams.get('action');
    const id = queryParams.get('id');
    
    if (action === 'create') {
      setSelectedOrder(null);
      setShowCreateForm(true);
    } else if (id) {
      // Fetch and show specific order
      const fetchOrderDetails = async () => {
        setLoading(true);
        try {
          const order = await orderService.getOrderById(id);
          setSelectedOrder(order);
          setShowCreateForm(false);
        } catch (err: any) {
          console.error('Error fetching order details:', err);
          setError(err.message || 'Failed to load order details');
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetails();
    } else {
      // Reset to list view
      setSelectedOrder(null);
      setShowCreateForm(false);
    }
  }, [location.search]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { companyId };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      if (dateRange.start) {
        params.startDate = dateRange.start.toISOString();
      }
      if (dateRange.end) {
        params.endDate = dateRange.end.toISOString();
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await orderService.getOrders(params);
      setOrders(response.orders || []); // Adjusted to use 'orders' instead of 'data'
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowCreateForm(false);
  };

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setShowCreateForm(true);
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
    setShowCreateForm(false);
  };

  const handleSearch = () => {
    fetchOrders();
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl(event.currentTarget);
    setActionOrderId(orderId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setActionOrderId(null);
  };

  const handleStatusChange = async (status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    if (!actionOrderId) return;

    setLoading(true);
    setError(null);

    try {
      await orderService.updateOrder(actionOrderId, { status });
      fetchOrders();
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }

    handleActionClose();
  };

  const handleOrderSave = () => {
    fetchOrders();
    handleBackToList();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const renderOrderList = () => (
    <Box>      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Orders
        </Typography>
        {canPerform('orderCreate') && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateOrder}
          >
            Create New Order
          </Button>
        )}
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flex: '1 1 300px', gap: 1 }}>
            <TextField
              placeholder="Search by order ID or customer..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="shipped">Shipped</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="returned">Returned</MenuItem>
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="From"
                value={dateRange.start}
                onChange={(date) => setDateRange({ ...dateRange, start: date })}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="To"
                value={dateRange.end}
                onChange={(date) => setDateRange({ ...dateRange, end: date })}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>

            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={fetchOrders}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Orders Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          {orders.length > 0 ? (
            orders.map((order) => (
              <Paper
                key={order.id}
                sx={{
                  p: 2,
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => handleViewOrder(order)}
              >
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        #{order.order_number}
                      </Typography>
                      <Chip
                        size="small"
                        label={order.status}
                        color={statusColors[order.status] || statusColors.default}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {order.customer_name} • {formatDate(order.created_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: { xs: 1, sm: 0 } }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {formatCurrency(order.total_amount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.items_count} items
                    </Typography>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(e, order.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))
          ) : (            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                {canPerform('orderCreate') ? 
                  "No orders found. Try a different filter or create a new order." :
                  "No orders found. Try a different filter."
                }
              </Typography>
              {canPerform('orderCreate') && (
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={handleCreateOrder}
                >
                  Create New Order
                </Button>
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => handleStatusChange('processing')}>Mark as Processing</MenuItem>
        <MenuItem onClick={() => handleStatusChange('shipped')}>Mark as Shipped</MenuItem>
        <MenuItem onClick={() => handleStatusChange('delivered')}>Mark as Delivered</MenuItem>
        <MenuItem onClick={() => handleStatusChange('cancelled')}>Cancel Order</MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Main Content */}
      {!selectedOrder && !showCreateForm && renderOrderList()}

      {/* Order Details View */}
      {selectedOrder && (
        <Box>
          <Button
            variant="text"
            onClick={handleBackToList}
            sx={{ mb: 2 }}
          >
            ← Back to Orders
          </Button>

          <OrderDetails
            order={selectedOrder}
            onStatusChange={(status) => {
              handleStatusChange(status as 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled');
              handleBackToList(); // Go back to list after status change
            }}
          />
        </Box>
      )}      {/* Create Order Form */}
      {showCreateForm && canPerform('orderCreate') && (
        <Box>
          <Button
            variant="text"
            onClick={handleBackToList}
            sx={{ mb: 2 }}
          >
            ← Back to Orders
          </Button>

          <CreateOrderForm
            companyId={companyId}
            onSave={handleOrderSave}
            onCancel={handleBackToList}
          />
        </Box>
      )}
    </Container>
  );
};

export default OrderManagement;