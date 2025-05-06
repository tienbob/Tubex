import React from 'react';
import {
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper
} from '@mui/material';

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  [key: string]: any;
}

interface RecentOrdersListProps {
  orders: Order[];
}

/**
 * Component to display recent orders on the dashboard
 */
const RecentOrdersList: React.FC<RecentOrdersListProps> = ({ orders }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Recent Orders
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      {orders.length > 0 ? (
        <List>
          {orders.map((order) => (
            <ListItem key={order.id} divider>
              <ListItemText
                primary={`Order #${order.id.substring(0, 8)}`}
                secondary={`Total: $${order.totalAmount.toFixed(2)}`}
              />
              <Chip
                label={order.status}
                color={
                  order.status === 'delivered'
                    ? 'success'
                    : order.status === 'cancelled'
                    ? 'error'
                    : 'primary'
                }
                size="small"
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
          No recent orders found.
        </Typography>
      )}
    </Paper>
  );
};

export default RecentOrdersList;