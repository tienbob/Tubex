import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material';
import { usePayment } from '../../hooks/usePayment';
import { 
  Payment, 
  ReconciliationStatus,
  ReconcilePaymentRequest
} from '../../services/api/paymentService';

interface ReconcilePaymentModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  onPaymentReconciled: () => void;
}

const ReconcilePaymentModal: React.FC<ReconcilePaymentModalProps> = ({
  open,
  onClose,
  payment,
  onPaymentReconciled
}) => {
  const { reconcilePayment, loading, error } = usePayment();
    const [formData, setFormData] = useState<ReconcilePaymentRequest>({
    reconciliationStatus: ReconciliationStatus.RECONCILED,
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    const result = await reconcilePayment(payment.id, formData);
    
    if (result) {
      onPaymentReconciled();
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reconcile Payment</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Typography variant="body1" gutterBottom>
          Reconcile payment <strong>{payment.transactionId}</strong> for {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(payment.amount)}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Current status: {payment.reconciliationStatus}
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Reconciliation Status</InputLabel>
          <Select
            name="reconciliationStatus"
            value={formData.reconciliationStatus}
            onChange={handleChange as any}
            label="Reconciliation Status"
          >            <MenuItem value={ReconciliationStatus.RECONCILED}>Reconciled</MenuItem>
            <MenuItem value={ReconciliationStatus.PARTIAL}>Unreconciled</MenuItem>
            <MenuItem value={ReconciliationStatus.FAILED}>Disputed</MenuItem>
            <MenuItem value={ReconciliationStatus.PENDING}>Pending Review</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Notes"
          name="notes"
          value={formData.notes || ''}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          placeholder="Add any notes about this reconciliation"
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
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
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReconcilePaymentModal;
