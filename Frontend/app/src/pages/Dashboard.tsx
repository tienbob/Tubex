import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography,
  Tabs,
  Tab
} from '@mui/material';
import PendingEmployeesList from '../components/whitelabel/users/PendingEmployeesList';
import EmployeeInvitationGenerator from '../components/whitelabel/users/EmployeeInvitationGenerator';

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
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

const Dashboard: React.FC = () => {
  const [value, setValue] = useState(0);
  const [companyId, setCompanyId] = useState('current-company-id'); // Replace with actual company ID from context/state

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
            <TabPanel value={value} index={0}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography variant="h6" gutterBottom>
                      Recent Orders
                    </Typography>
                    {/* Add OrderSummary component here */}
                  </Paper>
                </Box>
                <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
                    <Typography variant="h6" gutterBottom>
                      Inventory Status
                    </Typography>
                    {/* Add InventorySummary component here */}
                  </Paper>
                </Box>
              </Box>
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
              {/* Product management content */}
              <Typography variant="h6">Product Management</Typography>
              {/* Add ProductList component here */}
            </TabPanel>
            
            {/* Orders Tab */}
            <TabPanel value={value} index={3}>
              {/* Orders management content */}
              <Typography variant="h6">Order Management</Typography>
              {/* Add OrderList component here */}
            </TabPanel>
            
            {/* Inventory Tab */}
            <TabPanel value={value} index={4}>
              {/* Inventory management content */}
              <Typography variant="h6">Inventory Management</Typography>
              {/* Add InventoryList component here */}
            </TabPanel>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;