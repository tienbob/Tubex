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
import  InventoryList  from '../components/whitelabel/inventory/InventoryList';
import  InventoryTransferModal  from '../components/inventory/InventoryTransferModal';
import  InventoryAuditLog  from '../components/inventory/InventoryAuditLog';
import { inventoryService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
    setAlertsError(null);

    try {
      // Fetch low stock alerts
      const lowStockResponse = await inventoryService.getLowStockItems(companyId);
      setLowStockItems(lowStockResponse.data || []);

      // Fetch expiring batches (30 days threshold)
      const expiringResponse = await inventoryService.getExpiringBatches(companyId, 30);
      setExpiringItems(expiringResponse.data || []);
    } catch (err: any) {
      console.error('Error fetching inventory alerts:', err);
      setAlertsError(err.message || 'Failed to fetch inventory alerts');
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
    // If you have a refresh function in your InventoryList component, call it here
    fetchAlerts(); // Refresh alerts as well
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
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Inventory Alerts
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
                ) : companyId ? (
                  <InventoryList 
                    companyId={companyId}
                    onTransferClick={handleOpenTransferModal}
                    onInventorySelect={handleInventorySelect}
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
          <Typography variant="h6">Create Inventory Item</Typography>
          {/* Render create form */}
          {/* ...existing code... */}
        </Box>
      )}
      
      {viewMode === 'view' && selectedItem && (
        <Box>
          <Typography variant="h6">Inventory Item Details</Typography>
          {/* Render inventory item details */}
          {/* ...existing code... */}
        </Box>
      )}
      
      {viewMode === 'adjust' && selectedItem && (
        <Box>
          <Typography variant="h6">Adjust Inventory</Typography>
          {/* Render adjustment form */}
          {/* ...existing code... */}
        </Box>
      )}
      
      {viewMode === 'transfer' && (
        <Box>
          <Typography variant="h6">Transfer Inventory</Typography>
          {/* Render transfer form */}
          {/* ...existing code... */}
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