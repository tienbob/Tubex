import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { orderService } from '../../services/api';

interface OrderDetailsProps {
  order: any;
  onStatusChange?: (status: string) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onStatusChange }) => {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [statusNote, setStatusNote] = useState('');
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'returned', label: 'Returned' }
  ];

  const statusColors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
    'pending': 'warning',
    'processing': 'info',
    'shipped': 'primary',
    'delivered': 'success',
    'cancelled': 'error',
    'returned': 'secondary',
    'default': 'default'
  };

  const handleStatusChange = async () => {
    setLoading(true);

    try {
      await orderService.updateOrder(order.id, {
        status: selectedStatus,
        metadata: { notes: statusNote },
      });
      if (onStatusChange) {
        onStatusChange(selectedStatus);
      }
      setStatusDialogOpen(false);
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
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

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5">
                Order #{order.order_number}
              </Typography>
              <Chip
                label={order.status}
                color={statusColors[order.status] || statusColors.default}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Created on {formatDate(order.created_at)}
            </Typography>
          </Box>
          <Button 
            variant="outlined"
            onClick={() => setStatusDialogOpen(true)}
          >
            Update Status
          </Button>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ minWidth: '200px', flex: '1 1 30%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Customer Information
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {order.customer_name}
            </Typography>
            <Typography variant="body2">
              {order.customer_email}
            </Typography>
            <Typography variant="body2">
              {order.customer_phone || 'No phone provided'}
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: '200px', flex: '1 1 30%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Shipping Address
            </Typography>
            <Typography variant="body2">
              {order.shipping_address?.street}
            </Typography>
            <Typography variant="body2">
              {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
            </Typography>
            <Typography variant="body2">
              {order.shipping_address?.country}
            </Typography>
          </Box>
          
          <Box sx={{ minWidth: '200px', flex: '1 1 30%' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Payment Information
            </Typography>
            <Typography variant="body2">
              Method: {order.payment_method || 'Not specified'}
            </Typography>
            <Typography variant="body2">
              Status: {order.payment_status || 'Not specified'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {order.tracking_number && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShippingIcon color="action" />
              <Typography variant="body2">
                Tracking: <strong>{order.tracking_number}</strong>
              </Typography>
            </Box>
          )}
          
          {order.warehouse && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon color="action" />
              <Typography variant="body2">
                Warehouse: <strong>{order.warehouse}</strong>
              </Typography>
            </Box>
          )}
          
          {order.invoice_number && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="action" />
              <Typography variant="body2">
                Invoice: <strong>{order.invoice_number}</strong>
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(order.items || []).map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="body1">
                      {item.product_name}
                    </Typography>
                    {item.variant && (
                      <Typography variant="body2" color="text.secondary">
                        {item.variant}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 3, ml: 'auto', width: '300px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Subtotal:</Typography>
            <Typography variant="body1">{formatCurrency(order.subtotal_amount || 0)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Tax:</Typography>
            <Typography variant="body1">{formatCurrency(order.tax_amount || 0)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1">Shipping:</Typography>
            <Typography variant="body1">{formatCurrency(order.shipping_amount || 0)}</Typography>
          </Box>
          {order.discount_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">Discount:</Typography>
              <Typography variant="body1" color="error.main">
                -{formatCurrency(order.discount_amount || 0)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Total:</Typography>
            <Typography variant="h6">{formatCurrency(order.total_amount || 0)}</Typography>
          </Box>
        </Box>
      </Paper>

      {order.notes && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notes
          </Typography>
          <Typography variant="body1">
            {order.notes}
          </Typography>
        </Paper>
      )}
      
      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              select
              label="Status"
              fullWidth
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ mb: 2 }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Note (Optional)"
              fullWidth
              multiline
              rows={3}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Add a note about this status change..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChange} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetails;