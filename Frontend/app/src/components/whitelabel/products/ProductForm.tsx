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
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FormContainer from '../FormContainer';
import FormButtons from '../FormButtons';
import ProductPriceHistory from './ProductPriceHistory';
import { productService } from '../../../services/api';

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

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
  cost: string;
  categoryId: string;
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
}

interface ProductFormProps {
  productId?: string;
  companyId: string;
  onSave?: (product: any) => void;
  onCancel?: () => void;
}

interface ProductApiInput {
  name: string;
  sku: string;
  description: string;
  base_price: number;
  supplier_id: string;
  status: 'active' | 'inactive'| 'out_of_stock'; // Updated to allow out_of_stock status
  unit: string; // Made required
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
  company_id: string;
}

function TabPanel({ children, value, index, 'aria-labelledby': ariaLabelledBy, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={ariaLabelledBy}
      {...other}
    >
      {value === index && (
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
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    categoryId: '',
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
  const [fetchLoading, setFetchLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Specification fields
  const [specKeys, setSpecKeys] = useState<string[]>([]);
  
  useEffect(() => {
    fetchCategories();
    
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
  
  // Fixing type mismatches and ensuring compatibility with the updated Product interface
  // Correcting the fetchProductDetails function to align with the updated Product type
  const fetchProductDetails = async () => {
    if (!productId) return;

    setFetchLoading(true);
    setApiError(null);

    try {
      const product = await productService.getProductById(productId);

      // Map API response to form data
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        price: product.base_price?.toString() || '',
        cost: '', // Assuming cost is not part of the Product type
        categoryId: product.supplier_id || '',
        status: product.status || 'active',
        weight: product.dimensions?.length?.toString() || '', // Assuming weight is derived from dimensions
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
    } catch (err: any) {
      setApiError(err.message || 'Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setFetchLoading(false);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
    }
    
    if (formData.cost.trim() && (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0)) {
      newErrors.cost = 'Cost must be a valid positive number';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
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
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
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
    handleChange(e as any);
  };

  const handleStatusChange = (e: SelectChangeEvent<'active' | 'inactive' | 'out_of_stock' | 'discontinued'>) => {
    handleChange(e as any);
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
    setSpecKeys(specKeys.filter((k) => k !== key));
    
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
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Prepare data for API
      const productData: ProductApiInput = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        base_price: parseFloat(formData.price),
        supplier_id: formData.categoryId,
        status: formData.status === 'discontinued' ? 'inactive' : formData.status, // Allow out_of_stock status
        unit: 'piece', // Required field
        dimensions: formData.dimensions.length || formData.dimensions.width || formData.dimensions.height ? {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined,
        } : undefined,
        inventory: formData.inventory.quantity || formData.inventory.lowStockThreshold ? {
          quantity: formData.inventory.quantity ? parseInt(formData.inventory.quantity) : undefined,
          lowStockThreshold: formData.inventory.lowStockThreshold 
            ? parseInt(formData.inventory.lowStockThreshold) 
            : undefined,
        } : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : undefined,
        company_id: companyId,
      };
      
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
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Basic Info Tab Panel Content
  const renderBasicInfoTab = () => (
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
          helperText={errors.name}
          disabled={loading}
        />
        <TextField
          name="sku"
          label="SKU"
          fullWidth
          required
          value={formData.sku}
          onChange={handleChange}
          error={!!errors.sku}
          helperText={errors.sku}
          disabled={loading}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          name="price"
          label="Price"
          fullWidth
          required
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={formData.price}
          onChange={handleChange}
          error={!!errors.price}
          helperText={errors.price}
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
          inputProps={{ min: 0, step: 0.01 }}
          value={formData.cost}
          onChange={handleChange}
          error={!!errors.cost}
          helperText={errors.cost}
          disabled={loading}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>,
          }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl fullWidth required error={!!errors.categoryId}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleSelectChange}
            disabled={loading}
            label="Category"
          >
            <MenuItem value="" disabled>Select a category</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
          {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
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
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="out_of_stock">Out of Stock</MenuItem>
            <MenuItem value="discontinued">Discontinued</MenuItem>
          </Select>
        </FormControl>
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
      />
    </Stack>
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
            
            {specKeys.map((key, index) => (
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