import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import FormContainer from '../../shared/FormContainer';
import FormButtons from '../../shared/FormButtons';
import { inventoryService } from '../../../services/api';

interface InventoryAdjustFormProps {
  companyId: string;
  inventoryId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const InventoryAdjustForm: React.FC<InventoryAdjustFormProps> = ({
  companyId,
  inventoryId,
  onSave,
  onCancel,
}) => {
  const [inventoryItem, setInventoryItem] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState('add'); // add, subtract, set
  const [formData, setFormData] = useState({
    adjustment: '',
    reason: '',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchInventoryDetails();
  }, [inventoryId]);
  
  const fetchInventoryDetails = async () => {
    setFetchLoading(true);
    setApiError(null);
    
    try {
      const item = await inventoryService.getInventoryItem(inventoryId);
      setInventoryItem(item.data);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load inventory details');
      console.error('Error fetching inventory:', err);
    } finally {
      setFetchLoading(false);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.adjustment.trim()) {
      newErrors.adjustment = 'Quantity adjustment is required';
    } else {
      const value = parseFloat(formData.adjustment);
      if (isNaN(value)) {
        newErrors.adjustment = 'Must be a valid number';
      } else if (value <= 0 && adjustmentType !== 'subtract') {
        newErrors.adjustment = 'Quantity must be positive';
      } else if (adjustmentType === 'subtract' && value > inventoryItem?.quantity) {
        newErrors.adjustment = 'Cannot subtract more than available quantity';
      }
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for adjustment is required';
    }
    
    if (formData.manufacturing_date && formData.expiry_date) {
      const mfgDate = new Date(formData.manufacturing_date);
      const expDate = new Date(formData.expiry_date);
      
      if (expDate <= mfgDate) {
        newErrors.expiry_date = 'Expiry date must be after manufacturing date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleAdjustmentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdjustmentType(e.target.value);
  };
  
  const calculateFinalQuantity = () => {
    if (!inventoryItem || !formData.adjustment) return inventoryItem?.quantity || 0;
    
    const adjustmentValue = parseFloat(formData.adjustment);
    if (isNaN(adjustmentValue)) return inventoryItem?.quantity || 0;
    
    switch (adjustmentType) {
      case 'add':
        return inventoryItem.quantity + adjustmentValue;
      case 'subtract':
        return inventoryItem.quantity - adjustmentValue;
      case 'set':
        return adjustmentValue;
      default:
        return inventoryItem.quantity;
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Convert adjustment type and value to the expected API format
      let adjustment = parseFloat(formData.adjustment);
      if (adjustmentType === 'subtract') {
        adjustment = -adjustment; // Negative for subtraction
      } else if (adjustmentType === 'set') {
        // Calculate the difference between current and new quantity
        adjustment = parseFloat(formData.adjustment) - inventoryItem.quantity;
      }
      
      const adjustmentData: {
        adjustment: number;
        reason: string;
        batch_number?: string;
        manufacturing_date?: string; // Added this property
        expiry_date?: string; // Added this property
      } = {
        adjustment,
        reason: formData.reason,
        batch_number: formData.batch_number || undefined,
        manufacturing_date: formData.manufacturing_date, // Fixed type error
        expiry_date: formData.expiry_date, // Fixed type error
      };
      
      if (formData.manufacturing_date && formData.expiry_date) {
        adjustmentData['manufacturing_date'] = formData.manufacturing_date;
        adjustmentData['expiry_date'] = formData.expiry_date;
      }
      
      await inventoryService.adjustInventoryQuantity(companyId, inventoryId, adjustmentData);
      
      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to adjust inventory');
      console.error('Error adjusting inventory:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const productName = inventoryItem?.product?.name || 'Product';
  const currentQuantity = inventoryItem?.quantity || 0;
  const unit = inventoryItem?.unit || '';
  
  return (
    <FormContainer 
      title="Adjust Inventory"
      subtitle={productName}
      loading={fetchLoading}
      error={apiError}
      maxWidth="700px"
    >
      {inventoryItem && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Quantity: <strong>{currentQuantity} {unit}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warehouse: {inventoryItem.warehouse?.name || 'N/A'}
              </Typography>
              {inventoryItem.batch_number && (
                <Typography variant="body2" color="text.secondary">
                  Batch: {inventoryItem.batch_number}
                </Typography>
              )}
            </Box>
          
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" gutterBottom>
                Adjustment Type
              </Typography>
              <RadioGroup
                row
                name="adjustmentType"
                value={adjustmentType}
                onChange={handleAdjustmentTypeChange}
              >
                <FormControlLabel value="add" control={<Radio />} label="Add" />
                <FormControlLabel value="subtract" control={<Radio />} label="Subtract" />
                <FormControlLabel value="set" control={<Radio />} label="Set exact quantity" />
              </RadioGroup>
            </Paper>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                name="adjustment"
                label={`${adjustmentType === 'set' ? 'Quantity' : 'Adjustment'} (${unit})`}
                fullWidth
                required
                value={formData.adjustment}
                onChange={handleChange}
                error={!!errors.adjustment}
                helperText={errors.adjustment}
                disabled={loading}
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <TextField
                name="reason"
                label="Reason for Adjustment"
                fullWidth
                multiline
                rows={2}
                required
                placeholder="Explain why this adjustment is being made"
                value={formData.reason}
                onChange={handleChange}
                error={!!errors.reason}
                helperText={errors.reason}
                disabled={loading}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper 
              sx={{ 
                p: 2,
                flex: '1 1 50%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="h6">
                Final: {calculateFinalQuantity()} {unit}
              </Typography>
            </Paper>
          </Box>
          
          <Box>
            <Alert severity="info">
              <AlertTitle>Batch Information</AlertTitle>
              If you're adding new stock with a different batch number or expiration date, 
              please provide the details below.
            </Alert>
          </Box>
          
          {adjustmentType === 'add' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <TextField
                  name="batch_number"
                  label="Batch Number (optional)"
                  fullWidth
                  value={formData.batch_number}
                  onChange={handleChange}
                  disabled={loading || adjustmentType !== 'add'}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                  <TextField
                    name="manufacturing_date"
                    label="Manufacturing Date (optional)"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formData.manufacturing_date}
                    onChange={handleChange}
                    disabled={loading || adjustmentType !== 'add'}
                  />
                </Box>
                
                <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '200px' }}>
                  <TextField
                    name="expiry_date"
                    label="Expiry Date (optional)"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formData.expiry_date}
                    onChange={handleChange}
                    disabled={loading || adjustmentType !== 'add'}
                    error={!!errors.expiry_date}
                    helperText={errors.expiry_date}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      )}
      
      <Box sx={{ mt: 4 }}>
        <FormButtons
          onCancel={onCancel}
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Save Adjustment"
        />
      </Box>
    </FormContainer>
  );
};

export default InventoryAdjustForm;