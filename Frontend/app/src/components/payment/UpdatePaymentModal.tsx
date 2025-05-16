import React, { useState, useEffect } from 'react';
import {  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { usePayment } from '../../hooks/usePayment';
import { 
  Payment, 
  PaymentMethod, 
  PaymentType, 
  UpdatePaymentRequest 
} from '../../services/api/paymentService';
import { format } from 'date-fns';

interface UpdatePaymentModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  onPaymentUpdated: () => void;
}

const UpdatePaymentModal: React.FC<UpdatePaymentModalProps> = ({ 
  open, 
  onClose, 
  payment, 
  onPaymentUpdated 
}) => {
  const { updatePayment, loading, error } = usePayment();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState<Partial<UpdatePaymentRequest>>({
    transactionId: payment.transactionId,
    orderId: payment.orderId,
    invoiceId: payment.invoiceId,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentType: payment.paymentType,
    paymentDate: format(new Date(payment.paymentDate), 'yyyy-MM-dd'),
    externalReferenceId: payment.externalReferenceId,
    notes: payment.notes
  });

  // Update form data when payment changes
  useEffect(() => {
    if (payment && open) {
      setFormData({
        transactionId: payment.transactionId,
        orderId: payment.orderId,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentType: payment.paymentType,
        paymentDate: format(new Date(payment.paymentDate), 'yyyy-MM-dd'),
        externalReferenceId: payment.externalReferenceId,
        notes: payment.notes
      });
      setFormErrors({});
    }
  }, [payment, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error for this field when changed
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, paymentDate: format(date, 'yyyy-MM-dd') }));
      
      // Clear date error if exists
      if (formErrors.paymentDate) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.paymentDate;
          return newErrors;
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.transactionId) {
      errors.transactionId = 'Transaction ID is required';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than zero';
    }
    
    if (!formData.paymentDate) {
      errors.paymentDate = 'Payment date is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const updateData = formData as UpdatePaymentRequest;
    const result = await updatePayment(payment.id, updateData);
    
    if (result) {
      onPaymentUpdated();
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Update Payment</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Transaction ID"
              name="transactionId"
              value={formData.transactionId || ''}
              onChange={handleChange}
              fullWidth
              required
              error={!!formErrors.transactionId}
              helperText={formErrors.transactionId}
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount || ''}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={formData.paymentDate ? new Date(formData.paymentDate) : null}
                onChange={handleDateChange}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    required: true,
                    error: !!formErrors.paymentDate,
                    helperText: formErrors.paymentDate
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <FormControl fullWidth required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod || ''}
                onChange={handleChange as any}
                label="Payment Method"
              >
                <MenuItem value="credit_card">Credit Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="check">Check</MenuItem>
                <MenuItem value="paypal">PayPal</MenuItem>
                <MenuItem value="stripe">Stripe</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <FormControl fullWidth required>
              <InputLabel>Payment Type</InputLabel>
              <Select
                name="paymentType"
                value={formData.paymentType || ''}
                onChange={handleChange as any}
                label="Payment Type"
              >
                <MenuItem value="order_payment">Order Payment</MenuItem>
                <MenuItem value="invoice_payment">Invoice Payment</MenuItem>
                <MenuItem value="refund">Refund</MenuItem>
                <MenuItem value="advance_payment">Advance Payment</MenuItem>
                <MenuItem value="adjustment">Adjustment</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Order ID (Optional)"
              name="orderId"
              value={formData.orderId || ''}
              onChange={handleChange}
              fullWidth
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Invoice ID (Optional)"
              name="invoiceId"
              value={formData.invoiceId || ''}
              onChange={handleChange}
              fullWidth
            />
          </Box>
          
          <Box sx={{ width: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="External Reference ID (Optional)"
              name="externalReferenceId"
              value={formData.externalReferenceId || ''}
              onChange={handleChange}
              fullWidth
            />
          </Box>
          
          <Box sx={{ width: '100%' }}>
            <TextField
              label="Notes (Optional)"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ mr: 'auto', color: 'text.secondary' }}>
          Payment ID: {payment.id}
        </Typography>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Updating...' : 'Update Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdatePaymentModal;
