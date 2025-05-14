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
import PendingEmployeesList from '../components/whitelabel/users/PendingEmployeesList';
import EmployeeInvitationGenerator from '../components/whitelabel/users/EmployeeInvitationGenerator';
import { dashboardService } from '../services/api/dashboardService';
import { productService, orderService, inventoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

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
    }

    // Auth process is complete
    if (user?.companyId) {
      setCompanyId(user.companyId);
      console.log('Dashboard: CompanyId set from AuthContext:', user.companyId);
    } else {
      setCompanyId(''); // Clear local companyId if not available from context
      console.log('Dashboard: CompanyId cleared (user or user.companyId missing after auth). User:', user);
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

    // Auth is loaded. Proceed with fetching.
    // Clear previous errors for the current scope (overview or active tab)
    if (value === 0) setError(null); else setActiveTabError(null);

    console.log(`Dashboard: Fetching data for tab ${value}, companyId: "${companyId}"`);

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
        break;
      case 4: // Inventory Tab
        if (companyId) {
          fetchInventory(); // This function explicitly uses companyId
        } else {
          // companyId is not available, and auth is complete.
          console.log('Dashboard: Company ID not available for Inventory tab (Tab 4).');
          setInventory([]); // Clear data
          setActiveTabError('Company ID is not available. Cannot load inventory.');
          setActiveTabLoading(false); // Ensure loading is false
        }
        break;
      default:
        // For any other tabs, ensure loading states are reset.
        if (value !==0) setActiveTabLoading(false); else setLoading(false);
        break;
    }
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
        dashboardService.getInventorySummary()
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
  };const fetchProducts = async () => {
    setActiveTabLoading(true);
    setActiveTabError(null);
    
    try {
      const response = await productService.getProducts({ limit: 5 });
      // Using PaginationResponse format
      setProducts(response.products || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setActiveTabError(err.message || 'Failed to load products');
    } finally {
      setActiveTabLoading(false);
    }
  };  const fetchOrders = async () => {
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
  };
    const fetchInventory = async () => {
    setActiveTabLoading(true);
    setActiveTabError(null);
    
    if (!companyId) {
      console.error('fetchInventory: Company ID is required to fetch inventory');
      setActiveTabError('Company ID is required to fetch inventory');
      setActiveTabLoading(false);
      return;
    }

    try {
      // Use getInventory instead of getInventoryItems which doesn't exist
      const response = await inventoryService.getInventory({ companyId, limit: 5 });
      setInventory(response.data || []);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setActiveTabError(err.message || 'Failed to load inventory');
    } finally {
      setActiveTabLoading(false);
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
    // Extract the base path and action
    const [basePath, action] = path.split('/').filter(Boolean);
    
    if (action === 'create' || action === 'transfer' || action === 'adjust') {
      // Instead of navigating to a new route, add query param to existing route
      navigate(`/${basePath}?action=${action}`);
    } else if (path.includes('/')) {
      // For item details, extract the ID and use query param
      const segments = path.split('/');
      const id = segments[segments.length - 1];
      if (segments.length > 2 && segments[2] === 'adjust') {
        navigate(`/${basePath}?id=${id}&action=adjust`);
      } else {
        navigate(`/${basePath}?id=${id}`);
      }
    } else {
      // Regular navigation for main sections
      navigate(path);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Welcome Header */}
        <Box>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h1" variant="h4" color="primary" gutterBottom>
              Welcome to Tubex Dashboard
            </Typography>
            <Typography variant="body1">
              Manage your inventory, products, orders, and employees from this central dashboard.
            </Typography>
          </Paper>
        </Box>

        {/* Dashboard Tabs */}
        <Box>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={value} 
                onChange={handleChange} 
                aria-label="dashboard tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Overview" {...a11yProps(0)} />
                <Tab label="User Management" {...a11yProps(1)} />
                <Tab label="Products" {...a11yProps(2)} />
                <Tab label="Orders" {...a11yProps(3)} />
                <Tab label="Inventory" {...a11yProps(4)} />
              </Tabs>
            </Box>
              {/* Overview Tab */}
            <TabPanel value={value} index={0}>              {error && (
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
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {/* Orders Summary */}
                  <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                      <Typography variant="h6" gutterBottom>
                        Recent Orders
                      </Typography>
                      {orderSummary ? (
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            Total Orders: {orderSummary.totalOrders || 0}
                          </Typography>
                          <Typography variant="body2">
                            Pending Orders: {orderSummary.pendingOrders || 0}
                          </Typography>
                          {orderSummary.recentOrders?.length > 0 ? (
                            <Typography variant="body2" sx={{ mt: 2 }}>
                              Latest: {orderSummary.recentOrders[0]?.customer || 'N/A'} - ${orderSummary.recentOrders[0]?.total || 0}
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
                  <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                      <Typography variant="h6" gutterBottom>
                        Products
                      </Typography>
                      {productSummary ? (
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            Total Products: {productSummary.totalProducts || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 2 }}>
                            Featured Products:
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
                  <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                      <Typography variant="h6" gutterBottom>
                        Inventory Status
                      </Typography>
                      {inventorySummary ? (
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            Total Items: {inventorySummary.totalItems || 0}
                          </Typography>
                          <Typography variant="body2">
                            Low Stock Items: {inventorySummary.lowStockItems || 0}
                          </Typography>
                          <Typography variant="body2">
                            Warehouse Utilization: {inventorySummary.warehouseUtilization || 0}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No inventory data available</Typography>
                      )}
                    </Paper>
                  </Box>
                </Box>
              )}
            </TabPanel>
            
            {/* User Management Tab */}
            <TabPanel value={value} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <EmployeeInvitationGenerator companyId={companyId} />
                </Box>
                <Box>
                  <PendingEmployeesList onEmployeeStatusChange={() => console.log('Employee status changed')} />
                </Box>
              </Box>
            </TabPanel>
              {/* Products Tab */}
            <TabPanel value={value} index={2}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Product Management</Typography>
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
                      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Recent Products
                          </Typography>
                          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="thead">
                              <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Name</Box>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Price</Box>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Status</Box>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Actions</Box>
                              </Box>
                            </Box>
                            <Box component="tbody">
                              {products.map((product) => (
                                <Box component="tr" key={product.id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
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
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
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
                  </>
                )}
              </Box>
            </TabPanel>
              {/* Orders Tab */}
            <TabPanel value={value} index={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Order Management</Typography>
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
                      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Recent Orders
                          </Typography>
                          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="thead">
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
                                <Box component="tr" key={order.id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
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
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
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
                  </>
                )}
              </Box>
            </TabPanel>
              {/* Inventory Tab */}
            <TabPanel value={value} index={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Inventory Management</Typography>
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
                  </Box>
                ) : (
                  <>
                    {inventory.length > 0 ? (
                      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Current Inventory
                          </Typography>
                          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="thead">
                              <Box component="tr" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Product</Box>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Warehouse</Box>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Quantity</Box>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Status</Box>
                                <Box component="th" sx={{ p: 1, textAlign: 'left' }}>Actions</Box>
                              </Box>
                            </Box>
                            <Box component="tbody">
                              {inventory.map((item) => (
                                <Box component="tr" key={item.id} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                  <Box component="td" sx={{ p: 1 }}>{item.product?.name || 'Unknown Product'}</Box>
                                  <Box component="td" sx={{ p: 1 }}>{item.warehouse?.name || 'Unknown Warehouse'}</Box>
                                  <Box component="td" sx={{ p: 1 }}>{item.quantity} {item.unit}</Box>
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
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography>No inventory items found</Typography>
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          sx={{ mt: 2 }}
                          onClick={() => handleNavigation('/inventory/create')}
                        >
                          Add Your First Inventory Item
                        </Button>
                      </Paper>
                    )}
                  </>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;