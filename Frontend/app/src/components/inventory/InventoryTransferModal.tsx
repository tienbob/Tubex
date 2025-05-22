import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Box,
  Typography,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { inventoryService } from '../../services/api';

interface InventoryTransferModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  companyId: string;
  onTransferComplete?: () => void;
}

const InventoryTransferModal: React.FC<InventoryTransferModalProps> = ({
  open,
  onClose,
  productId,
  productName,
  companyId,
  onTransferComplete
}) => {
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingWarehouses, setFetchingWarehouses] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sourceQuantityAvailable, setSourceQuantityAvailable] = useState<number | null>(null);
  const [isConnectionError, setIsConnectionError] = useState(false);

  useEffect(() => {
    if (open) {
      fetchWarehouses();
    }
  }, [open, companyId]);

  useEffect(() => {
    if (sourceWarehouseId) {
      fetchAvailableQuantity();
    } else {
      setSourceQuantityAvailable(null);
    }
  }, [sourceWarehouseId, productId]);
  const fetchWarehouses = async () => {
    setFetchingWarehouses(true);
    setApiError(null);
    setIsConnectionError(false);
    
    try {
      // Ensure companyId is a string before making the API call
      if (!companyId || typeof companyId !== 'string') {
        throw new Error('Invalid company ID');
      }
      
      const response = await inventoryService.getWarehouses(companyId);
      console.log('Warehouse API response:', response);
      
      // Handle different potential response structures
      let warehousesList: Array<any> = [];
      
      // If response.data is an array
      if (Array.isArray(response.data)) {
        warehousesList = response.data;
      } 
      // If response.data contains a warehouses property that is an array
      else if (response.data && typeof response.data === 'object' && 'warehouses' in response.data && 
              Array.isArray((response.data as any).warehouses)) {
        warehousesList = (response.data as any).warehouses;
      }
      // If response.data.data contains the warehouses array
      else if (response.data && typeof response.data === 'object' && 'data' in response.data && 
              Array.isArray((response.data as any).data)) {
        warehousesList = (response.data as any).data;
      }
      // Default to empty array if no matching structure is found
      else {
        console.error('Unexpected API response format:', response);
        warehousesList = [];
      }
      
      setWarehouses(warehousesList);
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      
      // Check if it's a connection error
      if (error.message?.includes('Connection') || error.response?.status === 500) {
        setIsConnectionError(true);
        setApiError('Database connection error. Please try again later.');
      } else {
        setApiError(`Failed to load warehouses: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setFetchingWarehouses(false);
    }
  };

  const fetchAvailableQuantity = async () => {
    try {
      // This is a simplified approach. In a real implementation, you'd need an endpoint 
      // to get the available quantity for a specific product in a specific warehouse
      const response = await inventoryService.getInventory({
        companyId,
        warehouseId: sourceWarehouseId
      });
      
      const productInventory = response.data.find(item => item.product_id === productId);
      setSourceQuantityAvailable(productInventory ? productInventory.quantity : 0);
    } catch (error) {
      console.error('Error fetching available quantity:', error);
      // We don't set API error here to avoid blocking the modal
    }
  };

  const handleSourceWarehouseChange = (event: SelectChangeEvent) => {
    setSourceWarehouseId(event.target.value);
    if (event.target.value === destinationWarehouseId) {
      setDestinationWarehouseId('');
    }
    setErrors({ ...errors, sourceWarehouse: '' });
  };

  const handleDestinationWarehouseChange = (event: SelectChangeEvent) => {
    setDestinationWarehouseId(event.target.value);
    if (event.target.value === sourceWarehouseId) {
      setErrors({ ...errors, destinationWarehouse: 'Source and destination warehouses cannot be the same' });
    } else {
      setErrors({ ...errors, destinationWarehouse: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!sourceWarehouseId) {
      newErrors.sourceWarehouse = 'Source warehouse is required';
    }
    
    if (!destinationWarehouseId) {
      newErrors.destinationWarehouse = 'Destination warehouse is required';
    }
    
    if (sourceWarehouseId === destinationWarehouseId) {
      newErrors.destinationWarehouse = 'Source and destination warehouses cannot be the same';
    }
    
    if (!quantity) {
      newErrors.quantity = 'Transfer quantity is required';
    } else if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    } else if (sourceQuantityAvailable !== null && Number(quantity) > sourceQuantityAvailable) {
      newErrors.quantity = `Only ${sourceQuantityAvailable} units available for transfer`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTransfer = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      await inventoryService.transferInventory({
        product_id: productId,
        source_warehouse_id: sourceWarehouseId,
        destination_warehouse_id: destinationWarehouseId,
        quantity: Number(quantity),
        notes: notes.trim() || undefined
      });
      
      // Reset form
      setSourceWarehouseId('');
      setDestinationWarehouseId('');
      setQuantity('');
      setNotes('');
      
      if (onTransferComplete) {
        onTransferComplete();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error transferring inventory:', error);
      setApiError(error.message || 'Failed to transfer inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer Inventory: {productName}</DialogTitle>
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          {fetchingWarehouses ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <FormControl fullWidth margin="normal" error={!!errors.sourceWarehouse}>
                <InputLabel id="source-warehouse-label">Source Warehouse</InputLabel>
                <Select
                  labelId="source-warehouse-label"
                  value={sourceWarehouseId}
                  onChange={handleSourceWarehouseChange}
                  label="Source Warehouse"
                  disabled={loading}
                >                  {Array.isArray(warehouses) ? warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  )) : (
                    <MenuItem value="">No warehouses available</MenuItem>
                  )}
                </Select>
                {errors.sourceWarehouse && <FormHelperText>{errors.sourceWarehouse}</FormHelperText>}
              </FormControl>

              {sourceQuantityAvailable !== null && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Available quantity: <strong>{sourceQuantityAvailable}</strong> units
                  </Typography>
                </Box>
              )}

              <FormControl fullWidth margin="normal" error={!!errors.destinationWarehouse}>
                <InputLabel id="destination-warehouse-label">Destination Warehouse</InputLabel>
                <Select
                  labelId="destination-warehouse-label"
                  value={destinationWarehouseId}
                  onChange={handleDestinationWarehouseChange}
                  label="Destination Warehouse"
                  disabled={loading}                >
                  {Array.isArray(warehouses) ? warehouses
                    .filter(w => w.id !== sourceWarehouseId)
                    .map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </MenuItem>
                    )) : (
                      <MenuItem value="">No warehouses available</MenuItem>
                    )
                  }
                </Select>
                {errors.destinationWarehouse && <FormHelperText>{errors.destinationWarehouse}</FormHelperText>}
              </FormControl>

              <TextField
                margin="normal"
                fullWidth
                label="Quantity to Transfer"
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (errors.quantity) {
                    setErrors({ ...errors, quantity: '' });
                  }
                }}
                disabled={loading}
                error={!!errors.quantity}
                helperText={errors.quantity}
                inputProps={{ min: 1 }}
              />

              <TextField
                margin="normal"
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleTransfer} 
          variant="contained" 
          color="primary" 
          disabled={loading || fetchingWarehouses}
        >
          {loading ? <CircularProgress size={24} /> : 'Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryTransferModal;