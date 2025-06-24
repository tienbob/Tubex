import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Button,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import  InventoryList  from '../components/inventory/InventoryList';
import  InventoryTransferModal  from '../components/inventory/InventoryTransferModal';
import  InventoryAuditLog  from '../components/inventory/InventoryAuditLog';
import  InventoryForm  from '../components/inventory/forms/InventoryForm';
import  InventoryAdjustForm  from '../components/inventory/forms/InventoryAdjustForm';
import { inventoryService } from '../services/api';
import { useAuth } from '../components/auth/AuthContext';

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
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
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
    id: `inventory-tab-${index}`,
    'aria-controls': `inventory-tabpanel-${index}`,
  };
}

const InventoryManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view' | 'adjust' | 'transfer'>('list');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const location = useLocation();
  // Get company ID from auth context
  const { user, loading: authLoading } = useAuth();
  const [companyId, setCompanyId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Set companyId from auth context when user data is available
  useEffect(() => {
    if (user && user.companyId) {
      console.log('Setting company ID:', user.companyId);
      setCompanyId(user.companyId);
      setIsInitialized(true);
    } else if (!authLoading) {
      console.error('User or companyId not available');
      setIsInitialized(true);
    }
  }, [user, authLoading]);
  useEffect(() => {
    if (companyId && isInitialized) {
      fetchAlerts();
    }
  }, [companyId, isInitialized]);
  const fetchAlerts = async () => {
    if (!companyId) {
      console.error('Cannot fetch alerts: Company ID is not available');
      setAlertsError('Company ID is required to fetch inventory alerts');
      return;
    }

    setAlertsLoading(true);
    setAlertsError(null);    try {
      // Fetch low stock alerts
      const lowStockResponse = await inventoryService.getLowStockItems(companyId);
      let lowStockData = lowStockResponse.data || [];

      // Fetch expiring batches (30 days threshold)
      const expiringResponse = await inventoryService.getExpiringBatches(companyId, 30);
      let expiringData = expiringResponse.data || [];
      
      // Apply role-based filtering for alerts
      if (user && user.role === 'dealer') {
        // For dealers: show alerts for products they have added to their catalog
        lowStockData = lowStockData.filter((item: any) => 
          item.product?.dealer_id === companyId || item.product?.dealer_id === user.companyId
        );
        expiringData = expiringData.filter((item: any) => 
          item.product?.dealer_id === companyId || item.product?.dealer_id === user.companyId
        );
      } else if (user && user.role === 'supplier') {
        // For suppliers: show alerts for their own products
        lowStockData = lowStockData.filter((item: any) => 
          item.product?.supplier_id === companyId || item.product?.supplier_id === user.companyId
        );
        expiringData = expiringData.filter((item: any) => 
          item.product?.supplier_id === companyId || item.product?.supplier_id === user.companyId
        );
      } else if (user && user.role === 'admin') {
        // For admins: they can see all alerts within their company
        // No additional filtering needed as backend handles this
      }
      
      setLowStockItems(lowStockData);
      setExpiringItems(expiringData);
    } catch (err: any) {
      console.error('Error fetching inventory alerts:', err);
      setAlertsError(err.message || 'Failed to fetch inventory alerts');
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);  };

  const handleAdjustInventory = (inventoryId: string) => {
    // Navigate to adjust inventory view
    setSelectedInventoryItem(inventoryId);
    setViewMode('adjust');
    // Optionally, fetch the inventory item data
    fetchInventoryItem(inventoryId);
  };

  const handleTransferInventory = (inventoryId: string) => {
    // Navigate to transfer inventory view
    setSelectedInventoryItem(inventoryId);
    setViewMode('transfer');
    // Optionally, fetch the inventory item data
    fetchInventoryItem(inventoryId);
  };

  const handleAddInventory = () => {
    // Navigate to create inventory view
    setViewMode('create');
    setSelectedItem(null);
  };

  const handleOpenTransferModal = (product: { id: string; name: string }) => {
    setSelectedProduct(product);
    setTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setTransferModalOpen(false);
    setSelectedProduct(null);
  };

  const handleInventorySelect = (inventoryId: string) => {
    setSelectedInventoryItem(inventoryId);
    setTabValue(3); // Switch to Audit Log tab
  };
  const handleTransferComplete = () => {
    // Refresh inventory list after a transfer
    fetchAlerts(); // Refresh alerts as well
    setTransferModalOpen(false);
    setSelectedProduct(null);
    // If we're in transfer view mode, go back to list
    if (viewMode === 'transfer') {
      setViewMode('list');
    }
  };

  // Parse query parameters and set up the correct view
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const action = queryParams.get('action');
    const id = queryParams.get('id');
    
    if (action === 'create') {
      setViewMode('create');
      setSelectedItem(null);
    } else if (action === 'transfer') {
      setViewMode('transfer');
      setSelectedItem(null);
    } else if (action === 'adjust' && id) {
      setViewMode('adjust');
      fetchInventoryItem(id);
    } else if (id) {
      setViewMode('view');
      fetchInventoryItem(id);
    } else {
      // Reset to list view
      setViewMode('list');
      setSelectedItem(null);
    }
  }, [location.search]);

  const fetchInventoryItem = async (id: string) => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const item = await inventoryService.getInventoryItem(id);
      setSelectedItem(item);
    } catch (err: any) {
      console.error('Error fetching inventory item:', err);
      setError(err.message || 'Failed to load inventory item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {viewMode === 'list' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Page Header */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h1" variant="h4">
                Inventory Management
              </Typography>
            </Box>
          </Box>

          {/* Alerts Section */}
          <Box>
            <Paper sx={{ p: 2 }}>              <Typography variant="h6" gutterBottom>
                Inventory Alerts
                {user && user.role === 'dealer' && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Showing alerts for products in your catalog
                  </Typography>
                )}
                {user && user.role === 'supplier' && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Showing alerts for your products
                  </Typography>
                )}
                {user && user.role === 'admin' && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    Showing all alerts for your company
                  </Typography>
                )}
              </Typography>

              {alertsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {alertsError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'warning.light', 
                      color: 'warning.contrastText',
                      height: '100%'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Low Stock Items: {lowStockItems.length}
                    </Typography>
                    <Typography variant="body2">
                      {lowStockItems.length > 0 
                        ? 'Some items are running low on stock. Check inventory levels and consider restocking.' 
                        : 'All items have sufficient stock levels.'}
                    </Typography>
                  </Paper>
                </Box>
                <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      bgcolor: 'error.light', 
                      color: 'error.contrastText',
                      height: '100%'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Expiring Batches: {expiringItems.length}
                    </Typography>
                    <Typography variant="body2">
                      {expiringItems.length > 0 
                        ? 'Some batches are expiring within 30 days. Review and take action.' 
                        : 'No batches expiring within the next 30 days.'}
                    </Typography>
                  </Paper>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  onClick={fetchAlerts} 
                  variant="outlined" 
                  size="small"
                  disabled={alertsLoading}
                >
                  Refresh Alerts
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Main Content Tabs */}
          <Box>
            <Paper sx={{ width: '100%' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="inventory management tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="Inventory List" {...a11yProps(0)} />
                  <Tab label="Low Stock" {...a11yProps(1)} />
                  <Tab label="Expiring Items" {...a11yProps(2)} />
                  {selectedInventoryItem && <Tab label="Audit Log" {...a11yProps(3)} />}
                </Tabs>
              </Box>            {/* Inventory List Tab */}
              <TabPanel value={tabValue} index={0}>
                {!isInitialized ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <Typography>Loading...</Typography>
                  </Box>
                ) : companyId ? (                  <InventoryList 
                    companyId={companyId}
                    onTransferClick={handleOpenTransferModal}
                    onInventorySelect={handleInventorySelect}
                    onAdjustInventory={handleAdjustInventory}
                    onTransferInventory={handleTransferInventory}
                    onAddInventory={handleAddInventory}
                  />
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Company ID not available. Please ensure you're logged in with a valid company account.
                  </Alert>
                )}
              </TabPanel>

              {/* Low Stock Tab */}
              <TabPanel value={tabValue} index={1}>
                {/* Add a dedicated LowStockItems component if needed */}
                <Typography variant="h6">Low Stock Items</Typography>
                {/* Display low stock items */}
              </TabPanel>

              {/* Expiring Items Tab */}
              <TabPanel value={tabValue} index={2}>
                {/* Add a dedicated ExpiringItems component if needed */}
                <Typography variant="h6">Expiring Batches</Typography>
                {/* Display expiring items */}
              </TabPanel>

              {/* Audit Log Tab - Conditionally rendered */}
              {selectedInventoryItem && (
                <TabPanel value={tabValue} index={3}>
                  <InventoryAuditLog 
                    inventoryId={selectedInventoryItem}
                    title="Inventory Transaction History"
                  />
                </TabPanel>
              )}
            </Paper>
          </Box>
        </Box>
      )}
        {viewMode === 'create' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Add New Inventory Item</Typography>
            <Button 
              variant="outlined" 
              onClick={() => setViewMode('list')}
            >
              Back to List
            </Button>
          </Box>          <Paper sx={{ p: 3 }}>
            <InventoryForm 
              companyId={companyId}
              onSave={() => {
                setViewMode('list');
                fetchAlerts(); // Refresh alerts after adding inventory
              }}
              onCancel={() => setViewMode('list')}
            />
          </Paper>
        </Box>
      )}
        {viewMode === 'view' && selectedItem && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Inventory Item Details</Typography>
            <Button 
              variant="outlined" 
              onClick={() => setViewMode('list')}
            >
              Back to List
            </Button>
          </Box>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>Product Information</Typography>
                <Typography><strong>Name:</strong> {selectedItem.product?.name || 'N/A'}</Typography>
                <Typography><strong>Quantity:</strong> {selectedItem.quantity} {selectedItem.unit}</Typography>
                <Typography><strong>Warehouse:</strong> {selectedItem.warehouse?.name || 'N/A'}</Typography>
                <Typography><strong>Status:</strong> {selectedItem.status}</Typography>
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>Thresholds</Typography>
                <Typography><strong>Min Threshold:</strong> {selectedItem.min_threshold || 'Not set'}</Typography>
                <Typography><strong>Max Threshold:</strong> {selectedItem.max_threshold || 'Not set'}</Typography>
                <Typography><strong>Reorder Point:</strong> {selectedItem.reorder_point || 'Not set'}</Typography>
                <Typography><strong>Last Updated:</strong> {selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleString() : 'N/A'}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
        {viewMode === 'adjust' && selectedItem && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Adjust Inventory</Typography>
            <Button 
              variant="outlined" 
              onClick={() => setViewMode('list')}
            >
              Back to List
            </Button>
          </Box>
          <Paper sx={{ p: 3 }}>
            <InventoryAdjustForm 
              inventoryId={selectedInventoryItem || ''}
              companyId={companyId}
              onSave={() => {
                setViewMode('list');
                fetchAlerts(); // Refresh alerts after adjustment
              }}
              onCancel={() => setViewMode('list')}
            />
          </Paper>
        </Box>
      )}
        {viewMode === 'transfer' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Transfer Inventory</Typography>
            <Button 
              variant="outlined" 
              onClick={() => setViewMode('list')}
            >
              Back to List
            </Button>
          </Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select an inventory item from the list to transfer
            </Typography>
            <InventoryList 
              companyId={companyId}
              onTransferClick={handleOpenTransferModal}
              hideActions={false}
              maxHeight="400px"
            />
          </Paper>
        </Box>
      )}

      {/* Inventory Transfer Modal */}
      {selectedProduct && (
        <InventoryTransferModal
          open={transferModalOpen}
          onClose={handleCloseTransferModal}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          companyId={companyId}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </Container>
  );
};

export default InventoryManagement;