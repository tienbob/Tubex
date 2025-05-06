import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  TextField, 
  Button,
  Paper,
  Divider
} from '@mui/material';
import TenantConfigPanel from './TenantConfigPanel';
import WhiteLabelLayout from './WhiteLabelLayout';
import { detectTenant } from './WhiteLabelUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tenant-tabpanel-${index}`}
      aria-labelledby={`tenant-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tenants, setTenants] = useState(['tubex-default', 'tenant-a', 'tenant-b']);
  const [newTenantId, setNewTenantId] = useState('');
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleAddTenant = () => {
    if (newTenantId && !tenants.includes(newTenantId)) {
      setTenants([...tenants, newTenantId]);
      setNewTenantId('');
      // Automatically switch to the new tenant tab
      setActiveTab(tenants.length);
    }
  };
  
  return (
    <WhiteLabelLayout>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          White Label Administration
        </Typography>
        
        <Paper elevation={1} sx={{ mt: 4, p: 2 }}>
          <Typography variant="body1" gutterBottom>
            Current detected tenant: <strong>{detectTenant()}</strong>
          </Typography>
        </Paper>
        
        <Box sx={{ mt: 4 }}>
          <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add New Tenant
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Tenant ID"
                value={newTenantId}
                onChange={(e) => setNewTenantId(e.target.value)}
                placeholder="e.g., tenant-c"
                fullWidth
              />
              <Button 
                variant="contained" 
                onClick={handleAddTenant}
                disabled={!newTenantId || tenants.includes(newTenantId)}
              >
                Add Tenant
              </Button>
            </Box>
          </Paper>
          
          <Divider sx={{ mb: 3 }} />
          
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="tenant configuration tabs"
          >
            {tenants.map((tenantId, index) => (
              <Tab 
                key={tenantId} 
                label={tenantId} 
                id={`tenant-tab-${index}`}
                aria-controls={`tenant-tabpanel-${index}`} 
              />
            ))}
          </Tabs>
          
          {tenants.map((tenantId, index) => (
            <TabPanel key={tenantId} value={activeTab} index={index}>
              <TenantConfigPanel tenantId={tenantId} />
            </TabPanel>
          ))}
        </Box>
      </Container>
    </WhiteLabelLayout>
  );
};

export default AdminPage;