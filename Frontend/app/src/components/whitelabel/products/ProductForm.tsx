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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FormContainer from '../FormContainer';
import FormButtons from '../FormButtons';
import ProductPriceHistory from './ProductPriceHistory';
import DealerProductForm from './DealerProductForm';
import { productService, companyService, warehouseService, inventoryService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

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

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  type: 'main' | 'secondary' | 'distribution' | 'storage';
  status: 'active' | 'inactive' | 'under_maintenance';
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  cost: string;
  categoryId: string;
  supplierId: string;
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  inventory: {
    quantity: string;
    lowStockThreshold: string;
    warehouses: Array<{
      warehouseId: string;
      quantity: string;
      minThreshold: string;
      maxThreshold: string;
      reorderPoint: string;
      reorderQuantity: string;
    }>;
  };
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
  category_id: string;
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
  const { user } = useAuth();
  const [userCompanyType, setUserCompanyType] = useState<string | null>(null);
  const [isLoadingCompanyType, setIsLoadingCompanyType] = useState(true);

  // Fetch user's company type
  useEffect(() => {
    const fetchUserCompanyType = async () => {
      if (user?.companyId) {
        try {
          const company = await companyService.getCompanyById(user.companyId);
          setUserCompanyType(company.type);
          console.log('User company type:', company.type);
        } catch (error) {
          console.error('Error fetching company type:', error);
          setUserCompanyType(null);
        }
      }
      setIsLoadingCompanyType(false);
    };

    fetchUserCompanyType();
  }, [user?.companyId]);

  // Debug logging
  console.log('=== PRODUCTFORM DEBUG ===');
  console.log('ProductForm - User object:', user);
  console.log('ProductForm - User role:', user?.role);
  console.log('ProductForm - User role type:', typeof user?.role);  console.log('ProductForm - User companyId:', user?.companyId);
  console.log('ProductForm - User company type:', userCompanyType);
  console.log('ProductForm - Is loading company type:', isLoadingCompanyType);
  console.log('ProductForm - Is dealer?', user?.role === 'dealer');
  console.log('ProductForm - Is dealer company?', userCompanyType === 'dealer');
  console.log('ProductForm - Comparison result:', user?.role, '===', 'dealer', user?.role === 'dealer');
  console.log('=== END PRODUCTFORM DEBUG ===');

  // Show loading while fetching company type
  if (isLoadingCompanyType) {
    return <div>Loading...</div>;
  }

  // Render different forms based on user role OR company type
  if (user?.role === 'dealer' || userCompanyType === 'dealer') {
    console.log('Rendering DealerProductForm - role:', user?.role, 'companyType:', userCompanyType);    return (
      <DealerProductForm
        companyId={companyId}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  
  console.log('Rendering SupplierProductForm - role:', user?.role, 'companyType:', userCompanyType);
  // For non-dealer users, render the SupplierProductForm
  return (
    <SupplierProductForm
      productId={productId}
      companyId={companyId}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
};

// Original supplier form logic as a separate component
const SupplierProductForm: React.FC<ProductFormProps> = ({
  productId,
  companyId,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!productId;
  const [tabValue, setTabValue] = useState(0);  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Debug log to see component state
  console.log('ProductForm render - suppliers state:', suppliers.length, suppliers);  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    cost: '',
    categoryId: '',
    supplierId: '',
    status: 'active',
    inventory: {
      quantity: '',
      lowStockThreshold: '',
      warehouses: [],
    },
  });
    const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    fetchWarehouses();
    
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
      console.log('Fetching suppliers...');
      const response = await companyService.getSuppliers();
      console.log('Suppliers API response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data is array:', Array.isArray(response.data));
      
      const suppliersList = response.data || [];
      console.log('Suppliers list before filtering:', suppliersList);
      console.log('Suppliers list length:', suppliersList.length);
      
      const filteredSuppliers = suppliersList
        .filter(supplier => {
          console.log('Checking supplier:', supplier);
          console.log('Supplier type:', supplier.type);
          return supplier.type === 'supplier';
        })
        .map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          type: supplier.type as 'supplier' // Type assertion to ensure it's treated as 'supplier'
        }));
      
      console.log('Filtered suppliers:', filteredSuppliers);
      console.log('Filtered suppliers length:', filteredSuppliers.length);
      setSuppliers(filteredSuppliers);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);      console.error('Error details:', err.response?.data);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getWarehouses();
      const warehousesList = response.data || [];
      
      // Filter only active warehouses
      const activeWarehouses = warehousesList.filter((warehouse: Warehouse) => 
        warehouse.status === 'active'
      );
      
      setWarehouses(activeWarehouses);
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
    }
  };
    // Updated the fetchProductDetails function to align with the Product type from productService
  const fetchProductDetails = async () => {
    if (!productId) return;

    setFetchLoading(true);
    setApiError(null);

    try {
      const productResponse = await productService.getProductById(productId);
      const product = productResponse.data || productResponse; // Handle different response structures      // Map API response to form data
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.base_price?.toString() || '',
        cost: '', // Cost is not part of the Product interface
        categoryId: product.category_id || '',
        supplierId: product.supplier_id || '',
        status: product.status || 'active',
        inventory: {
          quantity: product.inventory?.quantity?.toString() || '',
          lowStockThreshold: product.inventory?.lowStockThreshold?.toString() || '',
          warehouses: [], // Will be populated from inventory API if needed
        },
      });
    } catch (err: any) {
      setApiError(err.message || 'Failed to load product details');
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
    
    if (!formData.categoryId.trim()) {
      newErrors.categoryId = 'Product category is required';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
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

  const addWarehouseInventory = () => {
    setFormData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        warehouses: [
          ...prev.inventory.warehouses,
          {
            warehouseId: '',
            quantity: '',
            minThreshold: '',
            maxThreshold: '',
            reorderPoint: '',
            reorderQuantity: '',
          }
        ]
      }
    }));
  };

  const removeWarehouseInventory = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        warehouses: prev.inventory.warehouses.filter((_, i) => i !== index)
      }
    }));
  };

  const updateWarehouseInventory = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        warehouses: prev.inventory.warehouses.map((warehouse, i) => 
          i === index ? { ...warehouse, [field]: value } : warehouse
        )
      }
    }));
  };const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {      // Prepare data for API according to ProductCreateInput or ProductUpdateInput from productService
      const productData: ProductApiInput = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.price),
        category_id: formData.categoryId,
        supplier_id: companyId, // Use the current company as the supplier since this is a supplier adding their own product
        status: formData.status === 'discontinued' ? 'inactive' : formData.status,
        unit: 'piece', // Default unit value
      };
      
      // Add optional fields only if they have values
      
      if (formData.inventory.quantity || formData.inventory.lowStockThreshold) {
        productData.inventory = {};
        if (formData.inventory.quantity) {
          productData.inventory.quantity = parseInt(formData.inventory.quantity);
        }
        if (formData.inventory.lowStockThreshold) {
          productData.inventory.lowStockThreshold = parseInt(formData.inventory.lowStockThreshold);
        }
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

      // Create inventory records for each warehouse if this is a new product
      if (!isEditMode && formData.inventory.warehouses.length > 0) {
        try {          for (const warehouseInventory of formData.inventory.warehouses) {
            if (warehouseInventory.warehouseId && warehouseInventory.quantity) {              await inventoryService.createInventoryItem({
                product_id: savedProduct.id,
                warehouse_id: warehouseInventory.warehouseId,
                quantity: parseFloat(warehouseInventory.quantity),
                unit: 'piece', // Default unit
                min_threshold: warehouseInventory.minThreshold ? parseFloat(warehouseInventory.minThreshold) : undefined,
                max_threshold: warehouseInventory.maxThreshold ? parseFloat(warehouseInventory.maxThreshold) : undefined,
                reorder_point: warehouseInventory.reorderPoint ? parseFloat(warehouseInventory.reorderPoint) : undefined,
                reorder_quantity: warehouseInventory.reorderQuantity ? parseFloat(warehouseInventory.reorderQuantity) : undefined,
              });
            }
          }
        } catch (inventoryError) {
          console.warn('Product created but inventory setup failed:', inventoryError);
          // Don't throw error since product was created successfully
        }
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
      >        <Stack spacing={3}>
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
            <FormControl 
              fullWidth 
              required 
              error={!!errors.categoryId}
              disabled={loading}
            >
              <InputLabel id="category-label">Product Category</InputLabel>              <Select
                labelId="category-label"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleSelectChange}
                label="Product Category"
                inputProps={{
                  'aria-describedby': 'category-helper-text'
                }}
              >
                <MenuItem value="" disabled>
                  {categories.length === 0 ? 'No categories available' : 'Select a category'}
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText id="category-helper-text">
                {errors.categoryId || "Choose the category that best describes your product"}
              </FormHelperText>
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
            </Stack>          )}
        </Stack>
      </FormSection>
      
      <FormSection title="Product Status">
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
            />            <Tab 
              label="Inventory" 
              id="product-tab-1" 
              aria-controls="product-tabpanel-1"
            />
            {isEditMode && (
              <Tab 
                label="Price History" 
                id="product-tab-2" 
                aria-controls="product-tabpanel-2"
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
        </TabPanel>        {/* Inventory Tab */}
        <TabPanel value={tabValue} index={1} aria-labelledby="product-tab-1">
          <Stack spacing={3}>
            <FormSection title="General Inventory Settings">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  name="inventory.quantity"
                  label="Total Stock (All Warehouses)"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={formData.inventory.quantity}
                  onChange={handleChange}
                  error={!!errors.quantity}
                  helperText={errors.quantity || "This will be distributed across warehouses"}
                  disabled={loading}
                />
                <TextField
                  name="inventory.lowStockThreshold"
                  label="Global Low Stock Threshold"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={formData.inventory.lowStockThreshold}
                  onChange={handleChange}
                  error={!!errors.lowStockThreshold}
                  helperText={errors.lowStockThreshold || 'Send alert when total stock falls below this level'}
                  disabled={loading}
                />
              </Stack>
            </FormSection>

            <FormSection title="Warehouse Distribution">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Stock Distribution by Warehouse</Typography>
                <Button 
                  variant="outlined" 
                  onClick={addWarehouseInventory}
                  disabled={loading || warehouses.length === 0}
                >
                  Add Warehouse Stock
                </Button>
              </Box>
              
              {warehouses.length === 0 && (
                <Typography color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
                  No warehouses available. Create a warehouse first to manage inventory distribution.
                </Typography>
              )}
              
              {formData.inventory.warehouses.length === 0 && warehouses.length > 0 && (
                <Typography color="text.secondary" sx={{ my: 2, textAlign: 'center' }}>
                  No warehouse stock entries yet. Click "Add Warehouse Stock" to distribute inventory across warehouses.
                </Typography>
              )}
              
              {formData.inventory.warehouses.map((warehouseInventory, index) => (
                <Box key={index} sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2">Warehouse {index + 1}</Typography>
                    <IconButton 
                      onClick={() => removeWarehouseInventory(index)}
                      color="error"
                      disabled={loading}
                      size="small"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                  
                  <Stack spacing={2}>
                    <FormControl fullWidth required>
                      <InputLabel>Warehouse</InputLabel>
                      <Select
                        value={warehouseInventory.warehouseId}
                        onChange={(e) => updateWarehouseInventory(index, 'warehouseId', e.target.value)}
                        disabled={loading}
                        label="Warehouse"
                      >
                        <MenuItem value="" disabled>Select a warehouse</MenuItem>
                        {warehouses.map((warehouse) => (
                          <MenuItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name} ({warehouse.type})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Quantity in Warehouse"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={warehouseInventory.quantity}
                        onChange={(e) => updateWarehouseInventory(index, 'quantity', e.target.value)}
                        disabled={loading}
                        fullWidth
                      />
                      <TextField
                        label="Min Threshold"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={warehouseInventory.minThreshold}
                        onChange={(e) => updateWarehouseInventory(index, 'minThreshold', e.target.value)}
                        disabled={loading}
                        fullWidth
                      />
                      <TextField
                        label="Max Threshold"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={warehouseInventory.maxThreshold}
                        onChange={(e) => updateWarehouseInventory(index, 'maxThreshold', e.target.value)}
                        disabled={loading}
                        fullWidth
                      />
                    </Stack>
                    
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Reorder Point"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={warehouseInventory.reorderPoint}
                        onChange={(e) => updateWarehouseInventory(index, 'reorderPoint', e.target.value)}
                        disabled={loading}
                        fullWidth
                        helperText="Auto-reorder when stock hits this level"
                      />
                      <TextField
                        label="Reorder Quantity"
                        type="number"
                        inputProps={{ min: 0, step: 1 }}
                        value={warehouseInventory.reorderQuantity}
                        onChange={(e) => updateWarehouseInventory(index, 'reorderQuantity', e.target.value)}
                        disabled={loading}
                        fullWidth
                        helperText="Quantity to order when reordering"
                      />
                    </Stack>
                  </Stack>
                </Box>              ))}
            </FormSection>
          </Stack>
        </TabPanel>        {/* Price History Tab - Only shown in edit mode */}
        {isEditMode && (
          <TabPanel value={tabValue} index={2} aria-labelledby="product-tab-2">
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
  
  if (showErrors) {
    setErrors(prev => ({ ...prev, ...newErrors }));
  }
  
  return Object.keys(newErrors).length === 0;
};

