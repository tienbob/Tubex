import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Typography,
  Alert,
} from '@mui/material';
import FormContainer from '../FormContainer';
import FormButtons from '../FormButtons';
import { inventoryService } from '../../../services/api';

interface InventoryAdjustmentProps {
  inventoryId: string;
  onCancel?: () => void;
  onComplete?: (success: boolean) => void;
}

const InventoryAdjustment: React.FC<InventoryAdjustmentProps> = ({
  inventoryId,
  onCancel,
  onComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [inventoryDetails, setInventoryDetails] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [formData, setFormData] = useState({ adjustment: '', reason: '' });
  const [errors, setErrors] = useState({ adjustment: '', reason: '' });

  useEffect(() => {
    fetchInventoryDetails();
  }, [inventoryId]);

  const fetchInventoryDetails = async () => {
    if (!inventoryId) return;
    
    setFetchLoading(true);
    setError(null);
    
    try {
      const response = await inventoryService.getInventory({ companyId: inventoryId });
      setInventoryDetails(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory details');
      console.error('Error fetching inventory details:', err);
    } finally {
      setFetchLoading(false);
    }
  };
  
  const validateForm = () => {
    if (!quantity || Number.isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return false;
    }
    
    if (!reason) {
      setError('Please provide a reason for this adjustment');
      return false;
    }
    
    return true;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!validateForm() || !inventoryDetails) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const numericQuantity = parseFloat(quantity);
      
      // Build adjustment parameters based on adjustment type
      let adjustment: number;
      switch (adjustmentType) {
        case 'add':
          adjustment = numericQuantity;
          break;
        case 'subtract':
          adjustment = -numericQuantity;
          break;
        case 'set':
          adjustment = numericQuantity - inventoryDetails.quantity;
          break;
        default:
          adjustment = numericQuantity;
      }
      
      await inventoryService.adjustInventory(inventoryId, {
        adjustment,
        reason,
        reference: reference || undefined,
      });
      
      if (onComplete) {
        onComplete(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to adjust inventory');
      console.error('Error adjusting inventory:', err);
      if (onComplete) {
        onComplete(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading || !inventoryDetails) {
    return (
      <FormContainer 
        title="Inventory Adjustment" 
        loading={fetchLoading}
        error={error}
      >
        <Box sx={{ py: 4 }}>
          <Typography align="center">Loading inventory details...</Typography>
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer 
      title="Inventory Adjustment" 
      subtitle={`Adjust inventory for ${inventoryDetails.product_name}`}
      error={error}
      loading={loading}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Current Information</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Product"
                value={inventoryDetails.product_name || ''}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Current Quantity"
                value={`${inventoryDetails.quantity} ${inventoryDetails.unit || ''}`}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Warehouse"
                value={inventoryDetails.warehouse_name || ''}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Last Updated"
                value={inventoryDetails.last_updated ? 
                  new Date(inventoryDetails.last_updated).toLocaleString() : 'N/A'}
                InputProps={{ readOnly: true }}
              />
            </Box>
          </Box>
        </Box>
        
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Adjustment Details</Typography>
          </Box>
          
          <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
            <FormLabel component="legend">Adjustment Type</FormLabel>
            <RadioGroup
              row
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract' | 'set')}
            >
              <FormControlLabel value="add" control={<Radio />} label="Add" />
              <FormControlLabel value="subtract" control={<Radio />} label="Subtract" />
              <FormControlLabel value="set" control={<Radio />} label="Set to value" />
            </RadioGroup>
          </FormControl>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="adjustment"
              label="Adjustment"
              fullWidth
              required
              value={formData.adjustment}
              onChange={handleChange}
              error={!!errors.adjustment}
              helperText={errors.adjustment}
            />
            <TextField
              name="reason"
              label="Reason"
              fullWidth
              required
              value={formData.reason}
              onChange={handleChange}
              error={!!errors.reason}
              helperText={errors.reason}
            />
          </Box>
          
          {adjustmentType === 'set' && parseFloat(quantity || '0') !== inventoryDetails.quantity && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info">
                This will {parseFloat(quantity || '0') > inventoryDetails.quantity ? 'add' : 'remove'} {
                  Math.abs(parseFloat(quantity || '0') - inventoryDetails.quantity)
                } {inventoryDetails.unit || ''} to the current inventory.
              </Alert>
            </Box>
          )}
        </Box>
      </Box>
      
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

export default InventoryAdjustment;