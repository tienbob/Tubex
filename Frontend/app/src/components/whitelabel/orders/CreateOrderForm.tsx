import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  CircularProgress,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { orderService, productService, warehouseService } from '../../../services/api';

interface CreateOrderFormProps {
  companyId: string;
  onSave: (orderData: any) => void;
  onCancel: () => void;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  companyId,
  onSave,
  onCancel
}) => {
  // Form data
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    payment_method: 'credit_card',
    payment_status: 'pending',
    warehouse_id: '',
    notes: '',
  });

  // Order items
  const [orderItems, setOrderItems] = useState<Array<{
    product_id: string;
    product_name: string;
    sku: string;
    price: number;
    quantity: number;
  }>>([]);

  // Available products for selection
  const [availableProducts, setAvailableProducts] = useState<Array<any>>([]);
  const [warehouses, setWarehouses] = useState<Array<any>>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch available products and warehouses when component mounts
  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  // Fixing the property name for productService.getProducts
  const fetchProducts = async () => {
    setProductLoading(true);
    try {
      const response = await productService.getProducts({
        status: 'active', // Example filter for active products
        search: '', // Optional search query
      });
      setAvailableProducts(response.products || []); // Adjusted to use 'products'
    } catch (err: any) {
      console.error('Error fetching products:', err);
    } finally {
      setProductLoading(false);
    }
  };
  // Fixing the warehouse data extraction from API response
  const fetchWarehouses = async () => {
    setWarehouseLoading(true);
    try {
      const response = await warehouseService.getWarehouses(companyId); // Pass companyId directly
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
      
      // Set warehouses state with the extracted array
      setWarehouses(warehousesList);

      // Set default warehouse if available
      if (warehousesList.length > 0) {
        setFormData(prev => ({ ...prev, warehouse_id: warehousesList[0].id }));
      }
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      // Always set warehouses to an empty array on error
      setWarehouses([]);
    } finally {
      setWarehouseLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when field is changed
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      shipping_address: { ...prev.shipping_address, [field]: value }
    }));
    // Clear validation error
    if (formErrors[`shipping_address.${field}`]) {
      setFormErrors(prev => ({ ...prev, [`shipping_address.${field}`]: '' }));
    }
  };

  const handleAddProduct = () => {
    setOrderItems(prev => [
      ...prev,
      {
        product_id: '',
        product_name: '',
        sku: '',
        price: 0,
        quantity: 1
      }
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = availableProducts.find(p => p.id === productId);
    
    if (selectedProduct) {
      const updatedItems = [...orderItems];
      updatedItems[index] = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        sku: selectedProduct.sku || '',
        price: selectedProduct.price || 0,
        quantity: 1
      };
      setOrderItems(updatedItems);
    }
  };

  const handleProductQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: quantity
    };
    setOrderItems(updatedItems);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Basic validation
    if (!formData.customer_name.trim()) {
      errors['customer_name'] = 'Customer name is required';
    }
    
    if (!formData.customer_email.trim()) {
      errors['customer_email'] = 'Customer email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
      errors['customer_email'] = 'Invalid email format';
    }
    
    if (!formData.shipping_address.street.trim()) {
      errors['shipping_address.street'] = 'Street address is required';
    }
    
    if (!formData.shipping_address.city.trim()) {
      errors['shipping_address.city'] = 'City is required';
    }
    
    if (!formData.shipping_address.zip.trim()) {
      errors['shipping_address.zip'] = 'ZIP code is required';
    }
    
    if (!formData.warehouse_id) {
      errors['warehouse_id'] = 'Please select a warehouse';
    }
    
    // Order items validation
    if (orderItems.length === 0) {
      errors['orderItems'] = 'Please add at least one product to the order';
    } else {
      orderItems.forEach((item, index) => {
        if (!item.product_id) {
          errors[`orderItems[${index}].product_id`] = 'Please select a product';
        }
        if (item.quantity < 1) {
          errors[`orderItems[${index}].quantity`] = 'Quantity must be at least 1';
        }
      });
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fixing the orderService.createOrder call
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const orderData = {
        ...formData,
        company_id: companyId, // Corrected property name
        deliveryAddress: {
          ...formData.shipping_address,
          zipCode: formData.shipping_address.zip // Renamed 'zip' to 'zipCode'
        },
        paymentMethod: formData.payment_method, // Added missing property
        items: orderItems.map(item => ({
          productId: item.product_id, // Corrected property name
          quantity: item.quantity,
          discount: 0 // Assuming no discount for now
        }))
      };
      
      const response = await orderService.createOrder(orderData);
      onSave(response);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
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
      <Typography variant="h5" gutterBottom>
        Create New Order
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {formErrors['orderItems'] && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formErrors['orderItems']}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Customer Information
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            label="Customer Name"
            value={formData.customer_name}
            onChange={(e) => handleFormChange('customer_name', e.target.value)}
            error={!!formErrors['customer_name']}
            helperText={formErrors['customer_name']}
            fullWidth
            sx={{ flex: '1 1 300px' }}
          />
          
          <TextField
            label="Email"
            type="email"
            value={formData.customer_email}
            onChange={(e) => handleFormChange('customer_email', e.target.value)}
            error={!!formErrors['customer_email']}
            helperText={formErrors['customer_email']}
            fullWidth
            sx={{ flex: '1 1 300px' }}
          />
          
          <TextField
            label="Phone"
            value={formData.customer_phone}
            onChange={(e) => handleFormChange('customer_phone', e.target.value)}
            fullWidth
            sx={{ flex: '1 1 300px' }}
          />
        </Box>
        
        <Typography variant="subtitle1" gutterBottom>
          Shipping Address
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Street Address"
            value={formData.shipping_address.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
            error={!!formErrors['shipping_address.street']}
            helperText={formErrors['shipping_address.street']}
            fullWidth
            sx={{ flex: '1 1 100%' }}
          />
          
          <TextField
            label="City"
            value={formData.shipping_address.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            error={!!formErrors['shipping_address.city']}
            helperText={formErrors['shipping_address.city']}
            sx={{ flex: '1 1 200px' }}
          />
          
          <TextField
            label="State/Province"
            value={formData.shipping_address.state}
            onChange={(e) => handleAddressChange('state', e.target.value)}
            sx={{ flex: '1 1 150px' }}
          />
          
          <TextField
            label="ZIP/Postal Code"
            value={formData.shipping_address.zip}
            onChange={(e) => handleAddressChange('zip', e.target.value)}
            error={!!formErrors['shipping_address.zip']}
            helperText={formErrors['shipping_address.zip']}
            sx={{ flex: '1 1 150px' }}
          />
          
          <TextField
            label="Country"
            value={formData.shipping_address.country}
            onChange={(e) => handleAddressChange('country', e.target.value)}
            sx={{ flex: '1 1 200px' }}
          />
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        
        {orderItems.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Autocomplete
                        options={availableProducts}
                        getOptionLabel={(option) => option.name || ''}
                        loading={productLoading}
                        onChange={(_, value) => handleProductSelect(index, value?.id || '')}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Product"
                            error={!!formErrors[`orderItems[${index}].product_id`]}
                            helperText={formErrors[`orderItems[${index}].product_id`]}
                          />
                        )}
                      />
                      {item.sku && (
                        <Typography variant="caption" color="text.secondary">
                          SKU: {item.sku}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleProductQuantityChange(index, parseInt(e.target.value) || 0)}
                        inputProps={{ min: 1 }}
                        error={!!formErrors[`orderItems[${index}].quantity`]}
                        helperText={formErrors[`orderItems[${index}].quantity`]}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(item.price * item.quantity)}</TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => handleRemoveProduct(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
            No products added to this order yet.
          </Typography>
        )}
        
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddProduct}
          sx={{ mt: 2 }}
        >
          Add Product
        </Button>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Order Details
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <FormControl sx={{ flex: '1 1 200px' }} error={!!formErrors['warehouse_id']}>
            <InputLabel>Warehouse</InputLabel>
            <Select
              value={formData.warehouse_id}
              label="Warehouse"
              onChange={(e) => handleFormChange('warehouse_id', e.target.value)}
              disabled={warehouseLoading}
            >              {Array.isArray(warehouses) ? warehouses.map(warehouse => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              )) : (
                <MenuItem value="">No warehouses available</MenuItem>
              )}
            </Select>
            {formErrors['warehouse_id'] && (
              <FormHelperText>{formErrors['warehouse_id']}</FormHelperText>
            )}
          </FormControl>
          
          <FormControl sx={{ flex: '1 1 200px' }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={formData.payment_method}
              label="Payment Method"
              onChange={(e) => handleFormChange('payment_method', e.target.value)}
            >
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ flex: '1 1 200px' }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={formData.payment_status}
              label="Payment Status"
              onChange={(e) => handleFormChange('payment_status', e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <TextField
          label="Order Notes (Optional)"
          multiline
          rows={3}
          value={formData.notes}
          onChange={(e) => handleFormChange('notes', e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Order'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateOrderForm;