import React from 'react';
import {
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Box
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface StockItem {
  id: string;
  product_id: string;
  product?: {
    name?: string;
    unit?: string;
  };
  quantity: number;
  minimum_stock: number;
  [key: string]: any;
}

interface LowStockItemsProps {
  items: StockItem[];
}

/**
 * Component to display low stock items on the dashboard
 */
const LowStockItems: React.FC<LowStockItemsProps> = ({ items }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <WarningIcon sx={{ color: 'warning.main', mr: 1 }} />
        <Typography variant="h6" component="h2">
          Low Stock Items
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      {items.length > 0 ? (
        <List>
          {items.map((item) => (
            <ListItem key={item.id} divider>
              <ListItemText
                primary={item.product?.name || `Product #${item.product_id}`}
                secondary={`Current: ${item.quantity} ${item.product?.unit || 'units'} (Min: ${item.minimum_stock})`}
              />
              <Chip
                label={item.quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                color={item.quantity <= 0 ? 'error' : 'warning'}
                size="small"
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
          No low stock items.
        </Typography>
      )}
    </Paper>
  );
};

export default LowStockItems;