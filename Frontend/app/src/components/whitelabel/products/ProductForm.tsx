import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Box, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  Button,
  Typography,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Stack,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FormContainer from '../FormContainer';
import FormButtons from '../FormButtons';
import ProductPriceHistory from './ProductPriceHistory';
import { productService, companyService } from '../../../services/api';

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  'aria-labelledby': string;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  type: 'supplier';
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  cost: string;
  supplierId: string;
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  inventory: {
    quantity: string;
    lowStockThreshold: string;
  };
  images: string[];
  specifications: Record<string, string>;
  computedFields?: {
    margin: number;
    marginPercentage: number;
  };
}

interface ProductFormProps {
  productId?: string;
  companyId: string;
  onSave?: (product: any) => void;
  onCancel?: () => void;
}

interface ProductApiInput {
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  status?: 'active' | 'inactive' | 'out_of_stock';
  sku?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  inventory?: {
    quantity?: number;
    lowStockThreshold?: number;
  };
  images?: string[];
  specifications?: Record<string, string>;
}

function TabPanel({ children, value, index, 'aria-labelledby': ariaLabelledBy, ...other }: TabPanelProps) {
  const isActive = value === index;
  
  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`product-tabpanel-${index}`}
      aria-labelledby={ariaLabelledBy}
      {...other}
    >
      {isActive && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProductForm: React.FC<ProductFormProps> = ({
  productId,
  companyId,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!productId;
    const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    cost: '',
    supplierId: '',
    status: 'active',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
    },
    inventory: {
      quantity: '',
      lowStockThreshold: '',
    },
    images: [],
    specifications: {},
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);  const [apiError, setApiError] = useState<string | null>(null);
  const [specKeys, setSpecKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, companyId]);
    const fetchCategories = async () => {
    try {
      const response = await productService.getCategories(companyId);
      setCategories(response.data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };
  
  const fetchSuppliers = async () => {
    try {
      const response = await companyService.getSuppliers();
      const suppliersList = response.data || [];
      setSuppliers(suppliersList
        .filter(supplier => supplier.type === 'supplier')
        .map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          type: supplier.type as 'supplier' // Type assertion to ensure it's treated as 'supplier'
        }))
      );
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
    }
  };
    // Updated the fetchProductDetails function to align with the Product type from productService
  const fetchProductDetails = async () => {
    if (!productId) return;

    setFetchLoading(true);
    setApiError(null);

    try {
      const productResponse = await productService.getProductById(productId);
      const product = productResponse.data || productResponse; // Handle different response structures

      // Map API response to form data
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.base_price?.toString() || '',
        cost: '', // Cost is not part of the Product interface
        supplierId: product.supplier_id || '',
        status: product.status || 'active',
        weight: '', // Weight is not directly in Product interface
        dimensions: {
          length: product.dimensions?.length?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          height: product.dimensions?.height?.toString() || '',
        },
        inventory: {
          quantity: product.inventory?.quantity?.toString() || '',
          lowStockThreshold: product.inventory?.lowStockThreshold?.toString() || '',
        },
        images: product.images || [],
        specifications: product.specifications || {},
      });

      // Set specification keys
      setSpecKeys(Object.keys(product.specifications || {}));
    } catch (err: any) {      setApiError(err.message || 'Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setFetchLoading(false);
    }
  };  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields according to ProductCreateInput in productService
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
    }    if (!formData.supplierId || !suppliers.some(s => s.id === formData.supplierId)) {
      newErrors.supplierId = 'Please select a valid supplier';
    }
    
    // Optional fields validation
    if (formData.cost.trim() && (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0)) {
      newErrors.cost = 'Cost must be a valid positive number';
    }
    
    if (formData.inventory.quantity.trim() && (isNaN(parseInt(formData.inventory.quantity)) || parseInt(formData.inventory.quantity) < 0)) {
      newErrors.quantity = 'Quantity must be a valid non-negative integer';
    }
    
    if (formData.inventory.lowStockThreshold.trim() && (isNaN(parseInt(formData.inventory.lowStockThreshold)) || parseInt(formData.inventory.lowStockThreshold) < 0)) {
      newErrors.lowStockThreshold = 'Low stock threshold must be a valid non-negative integer';
    }
    
    if (formData.weight.trim() && (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) < 0)) {
      newErrors.weight = 'Weight must be a valid positive number';
    }
    
    // Validate dimensions
    if (formData.dimensions.length.trim() && (isNaN(parseFloat(formData.dimensions.length)) || parseFloat(formData.dimensions.length) < 0)) {
      newErrors.length = 'Length must be a valid positive number';
    }
    
    if (formData.dimensions.width.trim() && (isNaN(parseFloat(formData.dimensions.width)) || parseFloat(formData.dimensions.width) < 0)) {
      newErrors.width = 'Width must be a valid positive number';
    }
    
    if (formData.dimensions.height.trim() && (isNaN(parseFloat(formData.dimensions.height)) || parseFloat(formData.dimensions.height) < 0)) {
      newErrors.height = 'Height must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const calculateMargins = (price: string, cost: string) => {
    const priceNum = parseFloat(price);
    const costNum = parseFloat(cost);
    
    if (!isNaN(priceNum) && !isNaN(costNum) && costNum > 0) {
      const margin = priceNum - costNum;
      const marginPercentage = (margin / costNum) * 100;
      return {
        margin: Number(margin.toFixed(2)),
        marginPercentage: Number(marginPercentage.toFixed(2))
      };
    }
    return {
      margin: 0,
      marginPercentage: 0
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(typeof prev[parent as keyof typeof prev] === 'object' && prev[parent as keyof typeof prev] !== null
            ? (prev[parent as keyof typeof prev] as Record<string, unknown>)
            : {}),
          [child]: value
        }
      }));
    } else {      setFormData((prev) => {
        const newData = {
          ...prev,
          [name]: value
        };
        
        // Recalculate margins when price or cost changes
        if (name === 'price' || name === 'cost') {
          const newPrice = name === 'price' ? String(value) : newData.price;
          const newCost = name === 'cost' ? String(value) : newData.cost;
          const margins = calculateMargins(newPrice, newCost);
          return {
            ...newData,
            computedFields: margins
          };
        }
        
        return newData;
      });
    }
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name = e.target.name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error if it exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      status: e.target.value as 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
    }));
    // Clear error if it exists
    if (errors.status) {
      setErrors(prev => ({ ...prev, status: '' }));
    }
  };
  
  const handleSpecificationChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
  };
  
  const addSpecification = () => {
    const newKey = `spec_${specKeys.length + 1}`;
    setSpecKeys([...specKeys, newKey]);
    
    setFormData((prev) => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [newKey]: ''
      }
    }));
  };
  
  const updateSpecKey = (oldKey: string, newKey: string) => {
    if (newKey.trim() === '') return;
    
    // Update the key in specKeys array
    const updatedSpecKeys = [...specKeys];
    const index = updatedSpecKeys.indexOf(oldKey);
    if (index !== -1) {
      updatedSpecKeys[index] = newKey;
      setSpecKeys(updatedSpecKeys);
    }
    
    // Update the key in specifications object
    setFormData((prev) => {
      const { [oldKey]: value, ...rest } = prev.specifications;
      return {
        ...prev,
        specifications: {
          ...rest,
          [newKey]: value
        }
      };
    });
  };
  
  const removeSpecification = (key: string) => {
    setSpecKeys(specKeys.filter((k: string) => k !== key));
    
    setFormData((prev) => {
      const { [key]: _, ...restSpecs } = prev.specifications;
      return {
        ...prev,
        specifications: restSpecs
      };
    });
  };
  
  const handleAddImage = (url: string) => {
    if (url.trim() === '') return;
    
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url]
    }));
  };
  
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {      // Prepare data for API according to ProductCreateInput or ProductUpdateInput from productService
      const productData: ProductApiInput = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.price),
        supplier_id: formData.supplierId,
        status: formData.status === 'discontinued' ? 'inactive' : formData.status,
        unit: 'piece', // Default unit value
      };
      
      // Add optional fields only if they have values
      
      if (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height) {
        productData.dimensions = {};
        if (formData.dimensions.length) {
          productData.dimensions.length = parseFloat(formData.dimensions.length);
        }
        if (formData.dimensions.width) {
          productData.dimensions.width = parseFloat(formData.dimensions.width);
        }
        if (formData.dimensions.height) {
          productData.dimensions.height = parseFloat(formData.dimensions.height);
        }
      }
      
      if (formData.inventory.quantity || formData.inventory.lowStockThreshold) {
        productData.inventory = {};
        if (formData.inventory.quantity) {
          productData.inventory.quantity = parseInt(formData.inventory.quantity);
        }
        if (formData.inventory.lowStockThreshold) {
          productData.inventory.lowStockThreshold = parseInt(formData.inventory.lowStockThreshold);
        }
      }
      
      if (formData.images.length > 0) {
        productData.images = formData.images;
      }
      
      if (Object.keys(formData.specifications).length > 0) {
        productData.specifications = formData.specifications;
      }
      
      let savedProduct;
      
      if (isEditMode && productId) {
        savedProduct = await productService.updateProduct(productId, productData);
      } else {
        savedProduct = await productService.createProduct(productData);
      }
      
      if (onSave) {
        onSave(savedProduct);
      }
    } catch (err: any) {
      setApiError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, err);
    } finally {
      setLoading(false);
    }
  };
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Validate the current tab before moving to another
    if (tabValue === 0) {
      validateBasicInfo(formData, setErrors);
    }
    
    setTabValue(newValue);
  };

  // Basic Info Tab Panel Content
  const renderBasicInfoTab = () => (
    <Box>
      <FormSection 
        title="Basic Information" 
        tooltip="Enter the fundamental details about your product"
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              name="name"
              label="Product Name"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name || "Enter a descriptive name for your product"}
              disabled={loading}
              inputProps={{
                'aria-describedby': 'product-name-helper-text'
              }}
            />
          </Stack>

          <TextField
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            helperText="Provide a detailed description of the product's features and benefits"
            inputProps={{
              'aria-describedby': 'product-description-helper-text'
            }}
          />
        </Stack>
      </FormSection>
      
      <FormSection 
        title="Pricing" 
        tooltip="Set product pricing and view profit margins"
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              name="price"
              label="Selling Price"
              fullWidth
              required
              type="number"
              inputProps={{ min: 0, step: 0.01, 'aria-describedby': 'price-helper-text' }}
              value={formData.price}
              onChange={handleChange}
              error={!!errors.price}
              helperText={errors.price || "The price customers will pay for this product"}
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              name="cost"
              label="Cost"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: 0.01, 'aria-describedby': 'cost-helper-text' }}
              value={formData.cost}
              onChange={handleChange}
              error={!!errors.cost}
              helperText={errors.cost || "Your cost to acquire or produce this product"}
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Stack>

          {formData.computedFields && (formData.price || formData.cost) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Profit Margin"
                fullWidth
                value={`$${formData.computedFields.margin.toFixed(2)}`}
                InputProps={{
                  readOnly: true,
                }}
                disabled
                helperText="The dollar amount of profit per unit"
              />
              <TextField
                label="Margin Percentage"
                fullWidth
                value={`${formData.computedFields.marginPercentage.toFixed(2)}%`}
                InputProps={{
                  readOnly: true,
                }}
                disabled
                helperText="Percentage of profit relative to cost"
              />
            </Stack>
          )}
        </Stack>
      </FormSection>
      
      <FormSection title="Product Classification">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth required error={!!errors.supplierId}>
            <InputLabel id="supplierId-label">Supplier</InputLabel>
            <Select
              labelId="supplierId-label"
              name="supplierId"
              value={formData.supplierId}
              onChange={handleSelectChange}
              disabled={loading}
              label="Supplier"
              inputProps={{
                'aria-describedby': 'supplier-helper-text'
              }}
            >
              <MenuItem value="" disabled>Select a supplier</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText id="supplier-helper-text">
              {errors.supplierId || "Select the supplier you purchase this product from"}
            </FormHelperText>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              name="status"
              value={formData.status}
              onChange={handleStatusChange}
              disabled={loading}
              label="Status"
              inputProps={{
                'aria-describedby': 'status-helper-text'
              }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              <MenuItem value="discontinued">Discontinued</MenuItem>
            </Select>
            <FormHelperText id="status-helper-text">
              Determines if the product is available for purchase
            </FormHelperText>
          </FormControl>
        </Stack>
      </FormSection>
    </Box>
  );

  return (
    <FormContainer 
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      loading={fetchLoading}
      error={apiError}
      maxWidth="900px"
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="product form tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Basic Info" 
              id="product-tab-0" 
              aria-controls="product-tabpanel-0"
            />
            <Tab 
              label="Inventory" 
              id="product-tab-1" 
              aria-controls="product-tabpanel-1"
            />
            <Tab 
              label="Details" 
              id="product-tab-2" 
              aria-controls="product-tabpanel-2"
            />
            <Tab 
              label="Images" 
              id="product-tab-3" 
              aria-controls="product-tabpanel-3"
            />
            {isEditMode && (
              <Tab 
                label="Price History" 
                id="product-tab-4" 
                aria-controls="product-tabpanel-4"
              />
            )}
          </Tabs>
        </Box>

        <TabPanel 
          value={tabValue} 
          index={0}
          aria-labelledby="product-tab-0"
        >
          {renderBasicInfoTab()}
        </TabPanel>

        {/* Inventory Tab */}
        <TabPanel value={tabValue} index={1} aria-labelledby="product-tab-1">
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                name="inventory.quantity"
                label="Current Stock"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={formData.inventory.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={errors.quantity}
                disabled={loading}
              />
              <TextField
                name="inventory.lowStockThreshold"
                label="Low Stock Threshold"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 1 }}
                value={formData.inventory.lowStockThreshold}
                onChange={handleChange}
                error={!!errors.lowStockThreshold}
                helperText={errors.lowStockThreshold || 'Send alert when stock falls below this level'}
                disabled={loading}
              />
            </Stack>

            <Typography variant="subtitle1" gutterBottom>
              Shipping Information
            </Typography>

            <TextField
              name="weight"
              label="Weight (kg)"
              fullWidth
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              value={formData.weight}
              onChange={handleChange}
              error={!!errors.weight}
              helperText={errors.weight}
              disabled={loading}
            />

            <Typography variant="subtitle2" gutterBottom>
              Dimensions
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                name="dimensions.length"
                label="Length (cm)"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={formData.dimensions.length}
                onChange={handleChange}
                error={!!errors.length}
                helperText={errors.length}
                disabled={loading}
              />
              <TextField
                name="dimensions.width"
                label="Width (cm)"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={formData.dimensions.width}
                onChange={handleChange}
                error={!!errors.width}
                helperText={errors.width}
                disabled={loading}
              />
              <TextField
                name="dimensions.height"
                label="Height (cm)"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={formData.dimensions.height}
                onChange={handleChange}
                error={!!errors.height}
                helperText={errors.height}
                disabled={loading}
              />
            </Stack>
          </Stack>
        </TabPanel>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={2} aria-labelledby="product-tab-2">
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Specifications</Typography>
              <Button 
                variant="outlined" 
                onClick={addSpecification}
                disabled={loading}
              >
                Add Specification
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {specKeys.length === 0 && (
              <Typography color="text.secondary" sx={{ my: 4, textAlign: 'center' }}>
                No specifications added yet. Click "Add Specification" to add product details.
              </Typography>
            )}
            
            {specKeys.map((key: string, index: number) => (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} key={key} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Specification Name"
                  value={key.startsWith('spec_') ? '' : key}
                  onChange={(e) => updateSpecKey(key, e.target.value)}
                  placeholder="e.g., Material, Color"
                  disabled={loading}
                />
                <TextField
                  fullWidth
                  label="Value"
                  value={formData.specifications[key] || ''}
                  onChange={(e) => handleSpecificationChange(key, e.target.value)}
                  disabled={loading}
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton 
                    onClick={() => removeSpecification(key)}
                    color="error"
                    disabled={loading}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Box>
              </Stack>
            ))}
          </Box>
        </TabPanel>

        {/* Images Tab */}
        <TabPanel value={tabValue} index={3} aria-labelledby="product-tab-3">
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Product Images</Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddPhotoAlternateIcon />}
                disabled={loading}
                onClick={() => {
                  const url = prompt('Enter image URL:');
                  if (url) handleAddImage(url);
                }}
              >
                Add Image URL
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            {formData.images.length === 0 && (
              <Typography color="text.secondary" sx={{ my: 4, textAlign: 'center' }}>
                No images added yet. Click "Add Image URL" to add product images.
              </Typography>
            )}
            
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                flexWrap: 'wrap',
                gap: 2,
                '& > *': {
                  flex: '1 1 calc(33.333% - 16px)',
                  minWidth: '250px',
                }
              }}
            >
              {formData.images.map((image, index) => (
                <Box
                  key={index}
                  sx={{ 
                    position: 'relative',
                    height: 0, 
                    paddingTop: '100%', 
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    component="img"
                    src={image}
                    alt={`Product image ${index + 1}`}
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400?text=Image+Error';
                    }}
                  />
                  <IconButton 
                    sx={{ 
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.9)',
                      }
                    }}
                    size="small"
                    onClick={() => handleRemoveImage(index)}
                    disabled={loading}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Box>
        </TabPanel>

        {/* Price History Tab - Only shown in edit mode */}
        {isEditMode && (
          <TabPanel value={tabValue} index={4} aria-labelledby="product-tab-4">
            <ProductPriceHistory 
              productId={productId!}
              productName={formData.name}
              currentPrice={parseFloat(formData.price)}
              canUpdate={true}
              onPriceUpdated={() => {
                fetchProductDetails(); // Refresh product details after price update
              }}
            />
          </TabPanel>
        )}
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <FormButtons
          onCancel={onCancel}
          onSubmit={handleSubmit}
          loading={loading}
          submitText={isEditMode ? 'Update Product' : 'Create Product'}
        />
      </Box>
    </FormContainer>
  );
};

export default ProductForm;

// New component for form section with tooltip support
interface FormSectionProps {
  title: string;
  tooltip?: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, tooltip, children }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3">{title}</Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Box>
  );
};

// Add this function to validate only the basic info tab
const validateBasicInfo = (formData: any, setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>, showErrors = true) => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.name.trim()) {
    newErrors.name = 'Product name is required';
  }
  
  if (!formData.price.trim()) {
    newErrors.price = 'Price is required';
  } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
    newErrors.price = 'Price must be a valid positive number';
  }
  
  if (!formData.supplierId) {
    newErrors.supplierId = 'Please select a valid supplier';
  }
  
  if (showErrors) {
    setErrors(prev => ({ ...prev, ...newErrors }));
  }
  
  return Object.keys(newErrors).length === 0;
};

