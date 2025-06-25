import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { dashboardService } from '../services/api/dashboardService';
import { productService, orderService, inventoryService } from '../services/api';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other }
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { permissions, canPerform } = useAccessControl();
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);
  const [companyId, setCompanyId] = useState<string>('');
  
  // State for dashboard overview data
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [productSummary, setProductSummary] = useState<any>(null);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  
  // State for tab-specific data
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTabLoading, setActiveTabLoading] = useState<boolean>(false);
  const [activeTabError, setActiveTabError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      console.log('Dashboard: Auth is loading, companyId not yet set from context.');
      // Optionally, you could clear companyId here if strict reset is needed during auth loading
      // setCompanyId(''); 
      return;
    }    // Auth process is complete
    if (user?.companyId) {
      setCompanyId(user.companyId);
    } else {
      setCompanyId(''); // Clear local companyId if not available from context
      if (user && !user.companyId) {
        console.warn('Dashboard: User object from AuthContext is present but companyId is missing.');
      }
    }
  }, [user, authLoading]);
  // Main data fetching logic based on active tab and companyId availability
  useEffect(() => {
    if (authLoading) {
      console.log('Dashboard: Auth is loading, deferring data fetch for tab', value);
      if (value === 0) setLoading(true); else setActiveTabLoading(true); // Show loading indicators
      return;
    }

    // Add a small delay to prevent rapid-fire requests during development
    const timeoutId = setTimeout(() => {
      // Auth is loaded. Proceed with fetching.      // Clear previous errors for the current scope (overview or active tab)
      if (value === 0) setError(null); else setActiveTabError(null);

      console.log(`Dashboard: Fetching data for tab ${value}, companyId: "${companyId}", auth loading: ${authLoading}`);

      switch (value) {
        case 0: // Overview
          fetchDashboardData();
          break;
        case 1: // User Management
          // Components handle their own data.
          // EmployeeInvitationGenerator is passed companyId and should react to its changes.
          // Ensure loading states are reset if they were set by other tabs.
          setActiveTabLoading(false);
          break;
        case 2: // Products
          fetchProducts();
          break;
        case 3: // Orders
          fetchOrders();
          break;        case 4: // Inventory Tab
          if (companyId && companyId.trim() !== '') {
            console.log('Dashboard: Starting inventory fetch for companyId:', companyId);
            fetchInventory(); // This function explicitly uses companyId
          } else {
            // companyId is not available, and auth is complete.
            console.log('Dashboard: Company ID not available for Inventory tab (Tab 4). CompanyId:', companyId, 'Auth loading:', authLoading);
            setInventory([]); // Clear data
            setActiveTabError('Company ID is not available. Cannot load inventory.');
            setActiveTabLoading(false); // Ensure loading is false
          }
          break;
        default:
          // For any other tabs, ensure loading states are reset.
          if (value !== 0) setActiveTabLoading(false); else setLoading(false);
          break;
      }
    }, 100); // 100ms delay to debounce rapid changes

    return () => clearTimeout(timeoutId);
  }, [value, companyId, authLoading]); // Key dependencies: tab, companyId, and auth status

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all summary data in parallel
      // Add individual error handlers for each request to handle gracefully
      const [orders, products, inventory] = await Promise.all([
        dashboardService.getOrderSummary()
          .catch(err => {
            console.error('Failed to load order summary:', err);
            return null;
          }),
        dashboardService.getProductSummary()
          .catch(err => {
            console.error('Failed to load product summary:', err);
            return null;
          }),
        dashboardService.getInventorySummary()  // Pass the companyId from component state
          .catch(err => {
            console.error('Failed to load inventory summary:', err);
            return null;
          })
      ]);
      
      // Set data for each summary individually
      setOrderSummary(orders);
      setProductSummary(products);
      setInventorySummary(inventory);

      // Show error if all requests failed
      if (!orders && !products && !inventory) {
        setError('Unable to load dashboard data. Please try refreshing the page or contact support if the issue persists.');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };  const fetchProducts = async () => {
    setActiveTabLoading(true);
    setActiveTabError(null);
    
    try {
      const response = await productService.getProducts({ limit: 5 });
      
      // Handle the response format from productService
      const productsData = response.data || response.products || [];
      
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setActiveTabError(err.message || 'Failed to load products');
    } finally {
      setActiveTabLoading(false);
    }
  };

  const fetchOrders = async () => {
    setActiveTabLoading(true);
    setActiveTabError(null);
    
    try {
      const response = await orderService.getOrders({ limit: 5 });
      
      // We know the response is OrdersListResponse with orders array
      if (response && response.orders) {
        setOrders(response.orders);
      } else if (Array.isArray(response)) {
        // Fallback in case of direct array response
        setOrders(response);
      } else {
        console.warn('Unexpected order response format:', response);
        setOrders([]);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setActiveTabError(err.message || 'Failed to load orders');
    } finally {
      setActiveTabLoading(false);
    }
  };  const fetchInventory = async (retryCount = 0) => {
    const maxRetries = 2;
    setActiveTabLoading(true);
    setActiveTabError(null);
    
    if (!companyId) {
      console.error('fetchInventory: Company ID is required to fetch inventory');
      setActiveTabError('Company ID is required to fetch inventory');
      setActiveTabLoading(false);
      return;
    }

    try {
      console.log(`Dashboard - fetchInventory: Starting fetch (attempt ${retryCount + 1}/${maxRetries + 1}) with companyId:`, companyId);
      
      // Always pass companyId explicitly to avoid getCurrentCompanyId() issues
      const response = await inventoryService.getInventory({ 
        companyId: companyId, // Explicitly pass the companyId we have from AuthContext
        limit: 5 
      });
      
      console.log('Dashboard - fetchInventory: Raw response:', response);
      console.log('Dashboard - fetchInventory: Response type:', typeof response);
      console.log('Dashboard - fetchInventory: Response keys:', Object.keys(response || {}));
      
      const inventoryData = response.data || response || [];
      console.log('Dashboard - fetchInventory: Extracted inventory data:', inventoryData);
      console.log('Dashboard - fetchInventory: Inventory data type:', typeof inventoryData);
      console.log('Dashboard - fetchInventory: Is array?', Array.isArray(inventoryData));
      console.log('Dashboard - fetchInventory: Array length:', inventoryData?.length);
      console.log('Dashboard - inventory sample item:', inventoryData[0]); // Debug first item structure
      
      if (!Array.isArray(inventoryData)) {
        console.warn('Dashboard - fetchInventory: Expected array but got:', typeof inventoryData, inventoryData);
        
        if (retryCount < maxRetries) {
          console.log(`Dashboard - fetchInventory: Retrying in 1 second (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(() => fetchInventory(retryCount + 1), 1000);
          return;
        }
        
        setActiveTabError('Invalid inventory data format received');
        return;
      }
      
      console.log('Dashboard - fetchInventory: About to set inventory state with:', inventoryData);
      setInventory(inventoryData);
      console.log('Dashboard - fetchInventory: Successfully set inventory data, count:', inventoryData.length);
      
      // Additional verification - check state after setting
      setTimeout(() => {
        console.log('Dashboard - fetchInventory: State verification - current inventory state length:', inventory.length);
      }, 100);
      
    } catch (err: any) {
      console.error('Dashboard - fetchInventory: Error occurred:', err);
      console.error('Dashboard - fetchInventory: Error details:', {
        message: err.message,
        status: err.status,
        data: err.data,
        stack: err.stack
      });
      
      // Retry logic for network or temporary errors
      if (retryCount < maxRetries && (
        err.message?.includes('network') || 
        err.message?.includes('timeout') || 
        err.status >= 500 ||
        err.status === 429 // Rate limit
      )) {
        console.log(`Dashboard - fetchInventory: Retrying due to ${err.message} (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchInventory(retryCount + 1), 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setActiveTabError(err.message || 'Failed to load inventory');
    } finally {
      setActiveTabLoading(false);
      console.log('Dashboard - fetchInventory: Finished, loading set to false');
    }
  };

  useEffect(() => {
    console.log('Dashboard: Current local companyId state updated:', companyId);
  }, [companyId]); // Debug log for local companyId state changes

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  // Handle navigation with query params instead of routes
  const handleNavigation = (path: string) => {
    console.log('Dashboard handleNavigation called with path:', path);
    
    // Extract the base path and segments
    const segments = path.split('/').filter(Boolean);
    const basePath = segments[0]; // e.g., 'inventory', 'products', 'orders'
    
    console.log('Parsed segments:', segments);
    console.log('Base path:', basePath);
    
    if (segments.length === 1) {
      // Just the base path, navigate to main section
      navigate(`/${basePath}`);
    } else if (segments.length === 2) {
      const secondSegment = segments[1];
      
      if (secondSegment === 'create' || secondSegment === 'transfer') {
        // Action without ID: /inventory/create or /inventory/transfer
        navigate(`/${basePath}?action=${secondSegment}`);
      } else {
        // Likely an ID: /inventory/item-id
        navigate(`/${basePath}?id=${secondSegment}`);
      }
    } else if (segments.length === 3) {
      // Three segments: /inventory/item-id/adjust
      const itemId = segments[1];
      const action = segments[2];
      navigate(`/${basePath}?id=${itemId}&action=${action}`);
    } else {
      // Fallback: navigate to the exact path
      navigate(path);
    }
  };

  const getAvailableTabs = () => {
    const allTabs = [
      { id: 0, label: 'Overview', permission: 'dashboard' },
      { id: 2, label: 'Products', permission: 'productView' },
      { id: 3, label: 'Orders', permission: 'orderView' },
      { id: 4, label: 'Inventory', permission: 'inventoryView' }
    ];

    return allTabs.filter(tab => {
      if (tab.permission === 'dashboard') return permissions.dashboard;
      if (tab.permission === 'productView') return permissions.productView;
      if (tab.permission === 'orderView') return permissions.orderView;
      if (tab.permission === 'inventoryView') return permissions.inventoryView;
      return false;
    });
  };

  const availableTabs = getAvailableTabs();

  // Helper function to get the display index for a tab based on available tabs
  const getTabDisplayIndex = (tabId: number) => {
    return availableTabs.findIndex(tab => tab.id === tabId);
  };

  // Helper function to check if a tab is available
  const isTabAvailable = (tabId: number) => {
    return availableTabs.some(tab => tab.id === tabId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Sticky Dashboard Header */}
      <Box position="sticky" top={0} zIndex={10} bgcolor="background.paper" boxShadow={1} borderRadius={2} px={{ xs: 2, md: 4 }} py={2} mb={3}>
        <Typography component="h1" variant="h4" color="primary.main" fontWeight={700}>
          Tubex Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your inventory, products, orders, and employees from this central dashboard.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Dashboard Tabs */}
        <Paper sx={{ width: '100%', borderRadius: 3, boxShadow: 2, p: { xs: 1, md: 2 } }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50', borderRadius: 2 }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              aria-label="dashboard tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              {availableTabs.map((tab) => (
                <Tab key={tab.id} label={tab.label} {...a11yProps(tab.id)} />
              ))}
            </Tabs>
          </Box>          {/* Overview Tab */}
          {isTabAvailable(0) && (
            <TabPanel value={value} index={getTabDisplayIndex(0)}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                  <Button 
                    size="small" 
                    sx={{ ml: 2 }} 
                    onClick={() => fetchDashboardData()}
                  >
                    Retry
                  </Button>
                </Alert>
              )}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {/* Orders Summary */}
                <Box sx={{ flex: '1 1 320px', minWidth: 260 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.100', height: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                      Recent Orders
                    </Typography>
                    {orderSummary ? (
                      <Box>
                        <Typography variant="body2">
                          <strong>Total Orders:</strong> {orderSummary.totalOrders || 0}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Pending Orders:</strong> {orderSummary.pendingOrders || 0}
                        </Typography>
                        {orderSummary.recentOrders?.length > 0 ? (
                          <Typography variant="body2" sx={{ mt: 2 }}>
                            <strong>Latest:</strong> {orderSummary.recentOrders[0]?.customer || 'N/A'} - ${orderSummary.recentOrders[0]?.total || 0}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ mt: 2 }}>No recent orders</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No order data available</Typography>
                    )}
                  </Paper>
                </Box>
                {/* Products Summary */}
                <Box sx={{ flex: '1 1 320px', minWidth: 260 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.100', height: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                      Products
                    </Typography>
                    {productSummary ? (
                      <Box>
                        <Typography variant="body2">
                          <strong>Total Products:</strong> {productSummary.totalProducts || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          <strong>Featured Products:</strong>
                        </Typography>
                        {productSummary.featuredProducts?.length > 0 ? (
                          <Box>
                            {productSummary.featuredProducts.slice(0, 2).map((product: any) => (
                              <Typography key={product.id} variant="body2">
                                {product.name} - ${product.price}
                              </Typography>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">No featured products</Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No product data available</Typography>
                    )}
                  </Paper>
                </Box>
                {/* Inventory Summary */}
                <Box sx={{ flex: '1 1 320px', minWidth: 260 }}>
                  <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'grey.100', height: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                      Inventory Status
                    </Typography>
                    {inventorySummary ? (
                      <Box>
                        <Typography variant="body2">
                          <strong>Total Items:</strong> {inventorySummary.totalItems || 0}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Low Stock Items:</strong> {inventorySummary.lowStockItems || 0}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Warehouse Utilization:</strong> {inventorySummary.warehouseUtilization || 0}%
                        </Typography>
                      </Box>
                    ) : (<Typography variant="body2" color="text.secondary">No inventory data available</Typography>
                    )}
                  </Paper>
                </Box>
              </Box>
            )}
            </TabPanel>
          )}
          {/* Products Tab */}
          {isTabAvailable(2) && (
            <TabPanel value={value} index={getTabDisplayIndex(2)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={700} color="primary.main">Product Management</Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleNavigation('/products/create')}
                >
                  Add New Product
                </Button>
              </Box>
              {activeTabError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {activeTabError}
                  <Button 
                    size="small" 
                    sx={{ ml: 2 }} 
                    onClick={() => fetchProducts()}
                  >
                    Retry
                  </Button>
                </Alert>
              )}
              {activeTabLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {products.length > 0 ? (
                    <Paper sx={{ width: '100%', overflow: 'auto', borderRadius: 2, boxShadow: 0 }}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                          Recent Products
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                          <Box component="thead" sx={{ bgcolor: 'grey.50' }}>
                            <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Name</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Price</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Status</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Actions</Box>
                            </Box>
                          </Box>
                          <Box component="tbody">
                            {products.map((product) => (
                              <Box component="tr" key={product.id} sx={{ borderBottom: '1px solid #e0e0e0', transition: 'background 0.2s', '&:hover': { bgcolor: 'grey.100' } }}>
                                <Box component="td" sx={{ p: 1 }}>{product.name}</Box>
                                <Box component="td" sx={{ p: 1 }}>${product.base_price}</Box>
                                <Box component="td" sx={{ p: 1 }}>{product.status}</Box>
                                <Box component="td" sx={{ p: 1 }}>
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => handleNavigation(`/products/${product.id}`)}
                                  >
                                    View
                                  </Button>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => handleNavigation('/products')}
                          color="primary"
                        >
                          View All Products
                        </Button>
                      </Box>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 0 }}>
                      <Typography>No products found</Typography>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={() => handleNavigation('/products/create')}
                      >
                        Add Your First Product
                      </Button>
                    </Paper>
                  )}
                </>              )}
            </Box>
            </TabPanel>
          )}

          {/* Orders Tab */}
          {isTabAvailable(3) && (
            <TabPanel value={value} index={getTabDisplayIndex(3)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={700} color="primary.main">Order Management</Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleNavigation('/orders/create')}
                >
                  Create New Order
                </Button>
              </Box>
              {activeTabError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {activeTabError}
                  <Button 
                    size="small" 
                    sx={{ ml: 2 }} 
                    onClick={() => fetchOrders()}
                  >
                    Retry
                  </Button>
                </Alert>
              )}
              {activeTabLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {orders.length > 0 ? (
                    <Paper sx={{ width: '100%', overflow: 'auto', borderRadius: 2, boxShadow: 0 }}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                          Recent Orders
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                          <Box component="thead" sx={{ bgcolor: 'grey.50' }}>
                            <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Order ID</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Date</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Amount</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Status</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Actions</Box>
                            </Box>
                          </Box>
                          <Box component="tbody">
                            {orders.map((order) => (
                              <Box component="tr" key={order.id} sx={{ borderBottom: '1px solid #e0e0e0', transition: 'background 0.2s', '&:hover': { bgcolor: 'grey.100' } }}>
                                <Box component="td" sx={{ p: 1 }}>#{order.id.slice(-6)}</Box>
                                <Box component="td" sx={{ p: 1 }}>{new Date(order.createdAt).toLocaleDateString()}</Box>
                                <Box component="td" sx={{ p: 1 }}>${order.totalAmount}</Box>
                                <Box component="td" sx={{ p: 1 }}>
                                  <Box sx={{
                                    display: 'inline-block',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    bgcolor: 
                                      order.status === 'delivered' ? 'success.light' : 
                                      order.status === 'cancelled' ? 'error.light' :
                                      order.status === 'processing' ? 'info.light' : 'warning.light'
                                  }}>
                                    {order.status}
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ p: 1 }}>
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => handleNavigation(`/orders/${order.id}`)}
                                  >
                                    View
                                  </Button>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => handleNavigation('/orders')}
                          color="primary"
                        >
                          View All Orders
                        </Button>
                      </Box>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 0 }}>
                      <Typography>No orders found</Typography>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={() => handleNavigation('/orders/create')}
                      >
                        Create Your First Order
                      </Button>
                    </Paper>
                  )}
                </>              )}
            </Box>
            </TabPanel>
          )}

          {/* Inventory Tab */}
          {isTabAvailable(4) && (
            <TabPanel value={value} index={getTabDisplayIndex(4)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={700} color="primary.main">Inventory Management</Typography>
                <Box>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => handleNavigation('/inventory/create')}
                    sx={{ mr: 1 }}
                  >
                    Add Inventory Item
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleNavigation('/inventory/transfer')}
                  >
                    Transfer Stock
                  </Button>
                </Box>
              </Box>
              {activeTabError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {activeTabError}
                  <Button 
                    size="small" 
                    sx={{ ml: 2 }} 
                    onClick={() => fetchInventory()}
                  >
                    Retry
                  </Button>
                </Alert>
              )}
              {activeTabLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>              ) : (
                <>
                  {console.log('Dashboard - Render: Inventory state for rendering:', inventory)}
                  {console.log('Dashboard - Render: Inventory length:', inventory.length)}
                  {console.log('Dashboard - Render: Inventory type:', typeof inventory)}
                  {console.log('Dashboard - Render: Is array?', Array.isArray(inventory))}
                  {inventory.length > 0 ? (
                    <Paper sx={{ width: '100%', overflow: 'auto', borderRadius: 2, boxShadow: 0 }}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main" gutterBottom>
                          Current Inventory
                        </Typography>
                        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                          <Box component="thead" sx={{ bgcolor: 'grey.50' }}>
                            <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Product</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Warehouse</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Quantity</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Status</Box>
                              <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Actions</Box>
                            </Box>
                          </Box>
                          <Box component="tbody">
                            {inventory.map((item) => (                              <Box component="tr" key={item.id} sx={{ borderBottom: '1px solid #e0e0e0', transition: 'background 0.2s', '&:hover': { bgcolor: 'grey.100' } }}>
                                <Box component="td" sx={{ p: 1 }}>{item.product?.name || item.product_name || 'Unknown Product'}</Box>
                                <Box component="td" sx={{ p: 1 }}>{item.warehouse?.name || item.warehouse_name || 'Unknown Warehouse'}</Box>
                                <Box component="td" sx={{ p: 1 }}>{item.quantity} {item.unit || ''}</Box>
                                <Box component="td" sx={{ p: 1 }}>
                                  <Box sx={{
                                    display: 'inline-block',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    bgcolor: 
                                      (item.stockStatus?.isLow) ? 'error.light' : 
                                      (item.quantity === 0) ? 'warning.light' : 'success.light'
                                  }}>
                                    {item.stockStatus?.isLow ? 'Low Stock' : 
                                     item.quantity === 0 ? 'Out of Stock' : 'In Stock'}
                                  </Box>
                                </Box>
                                <Box component="td" sx={{ p: 1 }}>
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    onClick={() => handleNavigation(`/inventory/${item.id}`)}
                                    sx={{ mr: 1 }}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    size="small" 
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => handleNavigation(`/inventory/${item.id}/adjust`)}
                                  >
                                    Adjust
                                  </Button>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => handleNavigation('/inventory')}
                          color="primary"
                        >
                          View All Inventory
                        </Button>
                      </Box>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, boxShadow: 0 }}>
                      <Typography>No inventory items found</Typography>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={() => handleNavigation('/inventory/create')}
                      >
                        Add Your First Inventory Item
                      </Button>                    </Paper>
                  )}
                </>
              )}
            </Box>
            </TabPanel>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;