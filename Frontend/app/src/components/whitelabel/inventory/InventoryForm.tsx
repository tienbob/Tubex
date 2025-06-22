import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { inventoryService } from '../../../services/api/inventoryService';
import { productService } from '../../../services/api/productService';
import { warehouseService } from '../../../services/api/warehouseService';
import { companyService } from '../../../services/api/companyService';
import { useAccessControl } from '../../../hooks/useAccessControl';
import RoleGuard from '../../common/RoleGuard';

interface InventoryFormProps {
  inventoryId?: string;
  companyId: string;
  onSave: () => void;
  onCancel?: () => void;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  supplier?: {
    name: string;
  };
}

interface Warehouse {
  id: string;
  name: string;
}

interface InventoryFormData {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  unit: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  auto_reorder: boolean;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ 
  inventoryId, 
  companyId, 
  onSave, 
  onCancel 
}) => {
  const { user } = useAuth();
  const { canPerform } = useAccessControl();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [formData, setFormData] = useState<InventoryFormData>({
    product_id: '',
    warehouse_id: '',
    quantity: 0,
    unit: '',
    min_threshold: undefined,
    max_threshold: undefined,
    reorder_point: undefined,
    reorder_quantity: undefined,
    auto_reorder: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
    if (inventoryId) {
      fetchInventoryDetails();
    }
  }, [inventoryId, companyId]);

  const fetchData = async () => {
    setFetchingData(true);
    setError(null);
    
    try {      // Fetch products and warehouses in parallel
      const [productsResponse, warehousesResponse] = await Promise.all([
        productService.getProducts({ companyId }),
        warehouseService.getWarehouses({ companyId })
      ]);

      // Handle products response
      console.log('Products response:', productsResponse);
      const productData = productsResponse.data || productsResponse.products || productsResponse || [];
      console.log('Product data:', productData);      const productList = Array.isArray(productData) ? productData : [];
      console.log('Final product list:', productList);
      console.log('Product count:', productList.length);
      setProducts(productList);
      
      // Handle warehouse response - ensure it's an array
      console.log('Warehouse response:', warehousesResponse);
      const warehouseData = warehousesResponse.data || warehousesResponse || [];
      console.log('Warehouse data:', warehouseData);
      const warehouseList = Array.isArray(warehouseData) ? warehouseData : 
                           (warehouseData.warehouses && Array.isArray(warehouseData.warehouses)) ? warehouseData.warehouses : [];
      console.log('Final warehouse list:', warehouseList);
      setWarehouses(warehouseList);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load form data. Please try again.');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchInventoryDetails = async () => {
    try {
      const response = await inventoryService.getInventoryItem(inventoryId!);
      const inventory = response.data;
        setFormData({
        product_id: inventory.product_id,
        warehouse_id: inventory.warehouse_id,
        quantity: inventory.quantity,
        unit: 'pieces', // Default unit, will be editable
        min_threshold: inventory.min_threshold,
        max_threshold: inventory.max_threshold,
        reorder_point: inventory.reorder_point,
        reorder_quantity: inventory.reorder_quantity,
        auto_reorder: inventory.auto_reorder || false,
      });
    } catch (err: any) {
      console.error('Error fetching inventory details:', err);
      setError('Failed to load inventory details.');
    }
  };

  const handleInputChange = (field: keyof InventoryFormData) => 
    (event: React.ChangeEvent<HTMLInputElement | { value: unknown }>) => {
      const value = event.target.value;
      setFormData(prev => ({
        ...prev,
        [field]: field === 'auto_reorder' ? value : 
                 ['quantity', 'min_threshold', 'max_threshold', 'reorder_point', 'reorder_quantity'].includes(field) 
                   ? (value === '' ? undefined : Number(value))
                   : value
      }));
      
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    };
  const handleProductChange = (event: SelectChangeEvent<string>) => {
    const productId = event.target.value as string;
    const selectedProduct = products.find(p => p.id === productId);
    
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      unit: selectedProduct?.unit || prev.unit
    }));
    
    if (errors.product_id) {
      setErrors(prev => ({ ...prev, product_id: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id) {
      newErrors.product_id = 'Product is required';
    }
    
    if (!formData.warehouse_id) {
      newErrors.warehouse_id = 'Warehouse is required';
    }
    
    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    
    if (formData.min_threshold !== undefined && formData.max_threshold !== undefined) {
      if (formData.min_threshold >= formData.max_threshold) {
        newErrors.max_threshold = 'Max threshold must be greater than min threshold';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
      try {
      if (inventoryId) {
        await inventoryService.updateInventoryItem(inventoryId, formData);
      } else {
        await inventoryService.createInventoryItem(formData);
      }
      
      onSave();
    } catch (err: any) {
      console.error('Error saving inventory:', err);
      setError(err.message || 'Failed to save inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading form data...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {inventoryId ? 'Edit Inventory' : 'Add Inventory'}
      </Typography>
        {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!fetchingData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loaded {products.length} products and {warehouses.length} warehouses
        </Alert>
      )}<Box component="form" noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>              <FormControl fullWidth error={!!errors.product_id}>
                <InputLabel>Product</InputLabel>
                <Select
                  value={formData.product_id}
                  onChange={handleProductChange}
                disabled={!!inventoryId} // Can't change product for existing inventory
              >
                {products.length > 0 ? (
                  products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} {product.supplier && `(${product.supplier.name})`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No products available
                  </MenuItem>
                )}
              </Select>
              {errors.product_id && (
                <Typography variant="caption" color="error">                  
                {errors.product_id}
                </Typography>
              )}
            </FormControl>
            </Box>

            <Box sx={{ flex: 1, minWidth: 250 }}>
              <FormControl fullWidth error={!!errors.warehouse_id}>
                <InputLabel>Warehouse</InputLabel>
                <Select
                  value={formData.warehouse_id}
                  onChange={(e: SelectChangeEvent<string>) => {
                    setFormData(prev => ({ ...prev, warehouse_id: e.target.value }));
                    if (errors.warehouse_id) {
                      setErrors(prev => ({ ...prev, warehouse_id: '' }));
                    }
                  }}                  disabled={!!inventoryId} // Can't change warehouse for existing inventory
                >
                  {Array.isArray(warehouses) && warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.warehouse_id && (
                  <Typography variant="caption" color="error">
                    {errors.warehouse_id}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
              label="Quantity"
              type="number"
              value={formData.quantity || ''}              
              onChange={handleInputChange('quantity')}
              error={!!errors.quantity}
              helperText={errors.quantity}
              inputProps={{ min: 0, step: 0.01 }}
            />
            </Box>

            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.unit}
                onChange={handleInputChange('unit')}
                error={!!errors.unit}
                helperText={errors.unit}
                placeholder="e.g., pieces, kg, meters"
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="Min Threshold"
                type="number"                value={formData.min_threshold || ''}
                onChange={handleInputChange('min_threshold')}
              error={!!errors.min_threshold}
              helperText={errors.min_threshold || "Alert when quantity falls below this"}
              inputProps={{ min: 0, step: 0.01 }}
            />
            </Box>

            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="Max Threshold"
                type="number"
                value={formData.max_threshold || ''}
                onChange={handleInputChange('max_threshold')}
                error={!!errors.max_threshold}
                helperText={errors.max_threshold || "Maximum storage capacity"}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="Reorder Point"
                type="number"
                value={formData.reorder_point || ''}
                onChange={handleInputChange('reorder_point')}
                error={!!errors.reorder_point}
                helperText={errors.reorder_point || "Quantity to trigger reorder"}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 250 }}>
              <TextField
                fullWidth
                label="Reorder Quantity"
                type="number"
                value={formData.reorder_quantity || ''}
                onChange={handleInputChange('reorder_quantity')}
                error={!!errors.reorder_quantity}
                helperText={errors.reorder_quantity || "Default quantity to reorder"}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Box>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.auto_reorder}
                  onChange={(e) => handleInputChange('auto_reorder')(e)}
                />
              }
              label="Enable Auto Reorder"
            />
            <Typography variant="caption" color="textSecondary" display="block">
              Automatically create reorder when quantity falls below reorder point
            </Typography>
          </Box>
        </Box>        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <RoleGuard
            action={inventoryId ? 'inventory:edit' : 'inventory:create'}
            fallback={
              <Button
                variant="contained"
                disabled={true}
                title={`You don't have permission to ${inventoryId ? 'edit' : 'create'} inventory items`}
              >
                {inventoryId ? 'Update' : 'Create'}
              </Button>
            }
            showFallback
          >
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : (inventoryId ? 'Update' : 'Create')}
            </Button>
          </RoleGuard>
        </Box>
      </Box>
    </Paper>
  );
};

export default InventoryForm;
