import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as OrderIcon,
  Category as ProductIcon,
} from '@mui/icons-material';

// Import custom hooks - fixed import statement
import useDashboardData from '../../hooks/useDashboardData';

// Import dashboard components
import StatCard from './components/StatCard';
import RecentOrdersList from './components/RecentOrdersList';
import LowStockItems from './components/LowStockItems';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(user?.userId, user?.companyId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom color="textSecondary">
        Welcome back{user?.companyId ? ', ' + user.companyId : ''}!
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 30%', minWidth: {xs: '100%', sm: '45%', md: '30%'} }}>
          <StatCard 
            title="Products"
            value={data.productCount}
            icon={<ProductIcon />}
            color="primary"
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: {xs: '100%', sm: '45%', md: '30%'} }}>
          <StatCard 
            title="Orders"
            value={data.orderCount}
            icon={<OrderIcon />}
            color="secondary"
          />
        </Box>
        
        <Box sx={{ flex: '1 1 30%', minWidth: {xs: '100%', sm: '45%', md: '30%'} }}>
          <StatCard 
            title="Inventory Items"
            value={data.inventoryCount}
            icon={<InventoryIcon />}
            color="success"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Recent Orders */}
        <Box sx={{ flex: '1 1 45%', minWidth: {xs: '100%', md: '45%'} }}>
          <RecentOrdersList orders={data.recentOrders} />
        </Box>

        {/* Low Stock Items */}
        <Box sx={{ flex: '1 1 45%', minWidth: {xs: '100%', md: '45%'} }}>
          <LowStockItems items={data.lowStockItems} />
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;