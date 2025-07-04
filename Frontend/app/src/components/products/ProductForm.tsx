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
import FormContainer from '../shared/FormContainer';
import FormButtons from '../shared/FormButtons';
import ProductPriceHistory from './ProductPriceHistory';
import DealerProductForm from './DealerProductForm';
import { productService, companyService, warehouseService, inventoryService } from '../../services/api';
import { useAccessControl } from '../../hooks/useAccessControl';

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
  categoryId: string;
  supplierId: string;
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  inventory: {
    quantity: string;
    lowStockThreshold: string;
    warehouses: Array<{
      id?: string; // <-- allow id for inventory record
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

// Move FormSection and TabPanel above SupplierProductForm so they are defined before use
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
}

const ProductForm: React.FC<ProductFormProps> = ({
  productId,
  companyId,
  onSave,
  onCancel,
}) => {
  const { user, permissions, loading: accessLoading } = useAccessControl();

  // Show loading while checking access control
  if (accessLoading) {
    return <div>Loading...</div>;
  }

  // Render different forms based on user company type
  if (user?.companyType === 'dealer' || user?.role === 'dealer') {
    console.log('Rendering DealerProductForm - companyType:', user?.companyType, 'role:', user?.role);
    return (
      <DealerProductForm
        companyId={companyId}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  
  console.log('Rendering SupplierProductForm - companyType:', user?.companyType, 'role:', user?.role);
  // For supplier users, render the SupplierProductForm
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
  const { permissions, canPerform } = useAccessControl();
  const isEditMode = !!productId;
  const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Debug log to see component state
  console.log('ProductForm render - suppliers state:', suppliers.length, suppliers);  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
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
  // State for inventory summary
  const [inventorySummary, setInventorySummary] = useState<{ totalQuantity: number; globalLowStockThreshold: number | '' }>({ totalQuantity: 0, globalLowStockThreshold: '' });

  // Reset form state when productId changes to prevent stale inventory data
  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoryId: '',
      supplierId: '',
      status: 'active',
      inventory: {
        quantity: '',
        lowStockThreshold: '',
        warehouses: [],
      },
    });
    setErrors({});
    setInventorySummary({ totalQuantity: 0, globalLowStockThreshold: '' });
  }, [productId]);

  // Fetch inventory summary from backend and filter by companyId and productId
  useEffect(() => {
    const fetchInventorySummary = async () => {
      try {
        const response = await inventoryService.getInventory({ companyId, product_id: productId });
        if (response && Array.isArray(response.data)) {
          // Filter by companyId and productId
          const warehouseInventories = response.data.filter((inv: any) =>
            inv.company_id === companyId && inv.product_id === productId
          );
          const totalQuantity = warehouseInventories.reduce((sum: number, w: any) => sum + (parseFloat(w.quantity) || 0), 0);
          const minThresholds = warehouseInventories.map((w: any) => parseFloat(w.min_threshold)).filter((v: number) => !isNaN(v));
          const globalLowStockThreshold = minThresholds.length > 0 ? Math.min(...minThresholds) : '';
          setInventorySummary({ totalQuantity, globalLowStockThreshold });
        } else {
          setInventorySummary({ totalQuantity: 0, globalLowStockThreshold: '' });
        }
      } catch (err) {
        setInventorySummary({ totalQuantity: 0, globalLowStockThreshold: '' });
      }
    };
    if (productId && tabValue === 1) {
      fetchInventorySummary();
    }
  }, [productId, companyId, tabValue]);

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
  };  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getWarehouses();
      console.log('Warehouses API response:', response);
      
      // Handle different possible response structures based on the backend controller
      let warehousesList: Warehouse[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        warehousesList = response;
      } else if (response && response.data && Array.isArray(response.data.warehouses)) {
        // Standard API response: { data: { warehouses: [...], pagination: {...} } }
        warehousesList = response.data.warehouses;
      } else if (response && Array.isArray(response.data)) {
        // Alternative response: { data: [...] }
        warehousesList = response.data;
      } else if (response && response.warehouses && Array.isArray(response.warehouses)) {
        // Direct warehouses property
        warehousesList = response.warehouses;
      } else {
        console.warn('Unexpected warehouses response structure:', response);
        warehousesList = [];
      }
      
      console.log('Warehouses list:', warehousesList);
      console.log('Warehouses list length:', warehousesList.length);
      
      // Filter only active warehouses
      const activeWarehouses = warehousesList.filter((warehouse: Warehouse) => 
        warehouse.status === 'active'
      );
      
      setWarehouses(activeWarehouses);
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      // Set empty array on error to prevent further issues
      setWarehouses([]);
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
      // Fetch inventory per warehouse for this product
      let warehouseInventories: Array<any> = [];
      try {
        const inventoryResponse = await inventoryService.getInventory({ companyId, product_id: productId });
        if (inventoryResponse && Array.isArray(inventoryResponse.data)) {
          // Strictly filter inventory for the current product only
          const filteredInventories = inventoryResponse.data.filter((inv: any) => inv.product_id === productId);
          warehouseInventories = filteredInventories.map((inv: any) => ({
            id: inv.id, // <-- include inventory id
            warehouseId: inv.warehouse_id,
            quantity: inv.quantity?.toString() || '',
            minThreshold: inv.min_threshold?.toString() || '',
            maxThreshold: inv.max_threshold?.toString() || '',
            reorderPoint: inv.reorder_point?.toString() || '',
            reorderQuantity: inv.reorder_quantity?.toString() || '',
          }));
        }
      } catch (err) {
        console.warn('Could not fetch warehouse inventory for product:', err);
      }
      // Calculate total quantity and global low stock threshold from warehouseInventories
      const totalQuantity = warehouseInventories.reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0);
      // For global low stock threshold, use the minimum of all minThresholds, or blank if none
      const minThresholds = warehouseInventories.map(w => parseFloat(w.minThreshold)).filter(v => !isNaN(v));
      const globalLowStockThreshold = minThresholds.length > 0 ? Math.min(...minThresholds) : '';
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.base_price?.toString() || '',
        categoryId: product.category_id || '',
        supplierId: product.supplier_id || '',
        status: product.status || 'active',
        inventory: {
          quantity: totalQuantity.toString(),
          lowStockThreshold: globalLowStockThreshold !== '' ? globalLowStockThreshold.toString() : (product.inventory?.lowStockThreshold?.toString() || ''),
          warehouses: warehouseInventories,
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
    // Removed cost validation
    if (formData.inventory.quantity.trim() && (isNaN(parseInt(formData.inventory.quantity)) || parseInt(formData.inventory.quantity) < 0)) {
      newErrors.quantity = 'Quantity must be a valid non-negative integer';
    }
    if (formData.inventory.lowStockThreshold.trim() && (isNaN(parseInt(formData.inventory.lowStockThreshold)) || parseInt(formData.inventory.lowStockThreshold) < 0)) {
      newErrors.lowStockThreshold = 'Low stock threshold must be a valid non-negative integer';
    }
    // Check Reorder Point >= Min Threshold for each warehouse
    formData.inventory.warehouses.forEach((w, idx) => {
      const min = parseFloat(w.minThreshold);
      const reorder = parseFloat(w.reorderPoint);
      if (!isNaN(min) && !isNaN(reorder) && reorder < min) {
        newErrors[`warehouse_${idx}_reorderPoint`] = 'Reorder Point must be greater than or equal to Min Threshold';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const calculateMargins = (price: string, cost: string) => {
    // Remove margin calculation since cost is removed
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
        // Remove margin recalculation since cost is removed
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
    // Real-time validation
    if (name === 'name' || name === 'categoryId' || name === 'price' || name === 'quantity' || name === 'lowStockThreshold') {
      validateField(name, value as string);
    }
  };
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name = e.target.name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Real-time validation
    if (name === 'categoryId') validateField(name, value as string);
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
    // Real-time validation for warehouse fields
    validateField(`warehouse_${field}`, value, index);
    if (field === 'reorderPoint') {
      // Also validate minThreshold for reorderPoint logic
      const minValue = formData.inventory.warehouses[index].minThreshold;
      validateField('warehouse_minThreshold', minValue, index);
    }
  };const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setApiError(null);
    try {
      // Prepare data for API according to ProductCreateInput or ProductUpdateInput from productService
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
      if (!isEditMode && (formData.inventory.quantity || formData.inventory.lowStockThreshold)) {
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

      // Always use a valid product_id for inventory actions
      const product_id = (savedProduct && savedProduct.id) ? savedProduct.id : productId;

      // Create or update inventory records for each warehouse
      console.log('%c[TUBEX-INVENTORY] WAREHOUSE DATA:', 'color: #fff; background: #1976d2; font-weight: bold; padding:2px 6px; border-radius:3px;', formData.inventory.warehouses);
      if (formData.inventory.warehouses.length > 0) {
        try {
          for (const warehouseInventory of formData.inventory.warehouses) {
            if (!warehouseInventory || typeof warehouseInventory !== 'object') {
              console.log('%c[TUBEX-INVENTORY] SKIP: invalid warehouseInventory', 'color: #fff; background: #1976d2; font-weight: bold; padding:2px 6px; border-radius:3px;', warehouseInventory);
              continue;
            }
            if (warehouseInventory.warehouseId && warehouseInventory.quantity) {
              const inventoryData = {
                product_id: product_id as string,
                warehouse_id: warehouseInventory.warehouseId,
                quantity: parseFloat(warehouseInventory.quantity),
                unit: 'piece',
                min_threshold: warehouseInventory.minThreshold ? parseFloat(warehouseInventory.minThreshold) : undefined,
                max_threshold: warehouseInventory.maxThreshold ? parseFloat(warehouseInventory.maxThreshold) : undefined,
                reorder_point: warehouseInventory.reorderPoint ? parseFloat(warehouseInventory.reorderPoint) : undefined,
                reorder_quantity: warehouseInventory.reorderQuantity ? parseFloat(warehouseInventory.reorderQuantity) : undefined,
              };
              console.log('%c[TUBEX-INVENTORY] INVENTORY SUBMIT:', 'color: #fff; background: #1976d2; font-weight: bold; padding:2px 6px; border-radius:3px;', inventoryData, 'ID:', warehouseInventory.id);
              if (warehouseInventory.id) {
                // Update existing inventory record
                await inventoryService.updateInventoryItem(warehouseInventory.id, inventoryData);
              } else {
                // Create new inventory record
                await inventoryService.createInventoryItem(inventoryData);
              }
            } else {
              console.log('%c[TUBEX-INVENTORY] SKIP: missing warehouseId or quantity', 'color: #fff; background: #1976d2; font-weight: bold; padding:2px 6px; border-radius:3px;', warehouseInventory);
            }
          }
        } catch (inventoryError) {
          console.warn('%c[TUBEX-INVENTORY] Inventory update/create failed:', 'color: #fff; background: #d32f2f; font-weight: bold; padding:2px 6px; border-radius:3px;', inventoryError);
        }
      }
    } catch (err: any) {
      setApiError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, err);
    } finally {
      setLoading(false);
    }
  };
    // Fix: Wrap all TabPanels in a single parent element and move renderBasicInfoTab inside SupplierProductForm
  const renderBasicInfoTab = () => (
    <Box>
      <FormSection title="Basic Information">
        <TextField
          name="name"
          label="Product Name"
          fullWidth
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          name="description"
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description}
        />
        <FormControl fullWidth required error={!!errors.categoryId}>
          <InputLabel>Category</InputLabel>
          <Select
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
        <FormControl fullWidth required error={!!errors.supplierId}>
          <InputLabel>Supplier</InputLabel>
          <Select
            name="supplierId"
            value={formData.supplierId}
            onChange={handleSelectChange}
            disabled={loading}
            label="Supplier"
          >
            <MenuItem value="" disabled>Select a supplier</MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </MenuItem>
            ))}
          </Select>
          {errors.supplierId && <FormHelperText>{errors.supplierId}</FormHelperText>}
        </FormControl>
        <TextField
          name="price"
          label="Price"
          fullWidth
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={formData.price}
          onChange={handleChange}
          error={!!errors.price}
          helperText={errors.price}
        />
        <FormControl fullWidth required error={!!errors.status}>
          <InputLabel>Status</InputLabel>
          <Select
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
          {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
        </FormControl>
      </FormSection>
    </Box>
  );
  // Add missing validateField and handleTabChange inside SupplierProductForm
  const validateField = (name: string, value: string, index?: number) => {
    let error = '';
    if (name === 'name' && !value.trim()) error = 'Product name is required';
    if (name === 'categoryId' && !value.trim()) error = 'Product category is required';
    if (name === 'price') {
      if (!value.trim()) error = 'Price is required';
      else if (isNaN(parseFloat(value)) || parseFloat(value) < 0) error = 'Price must be a valid positive number';
    }
    if (name === 'quantity') {
      if (value.trim() && (isNaN(parseInt(value)) || parseInt(value) < 0)) error = 'Quantity must be a valid non-negative integer';
    }
    if (name === 'lowStockThreshold') {
      if (value.trim() && (isNaN(parseInt(value)) || parseInt(value) < 0)) error = 'Low stock threshold must be a valid non-negative integer';
    }
    // Warehouse fields
    if (name.startsWith('warehouse_') && typeof index === 'number') {
      const [field] = name.split('_').slice(1);
      if (["quantity", "minThreshold", "maxThreshold", "reorderPoint", "reorderQuantity"].includes(field)) {
        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) error = 'Must be a valid non-negative number';
      }
      // Reorder Point >= Min Threshold
      if (field === 'reorderPoint') {
        const min = parseFloat(formData.inventory.warehouses[index].minThreshold);
        const reorder = parseFloat(value);
        if (!isNaN(min) && !isNaN(reorder) && reorder < min) error = 'Reorder Point must be >= Min Threshold';
      }
    }
    if (error) {
      setErrors(prev => ({ ...prev, [name + (typeof index === 'number' ? `_${index}` : '')]: error }));
    } else {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name + (typeof index === 'number' ? `_${index}` : '')];
        return newErrs;
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
        {/* Wrap all TabPanels in a single parent */}
        <React.Fragment>
          <TabPanel 
            value={tabValue} 
            index={0}
            aria-labelledby="product-tab-0"
          >
            {renderBasicInfoTab()}
          </TabPanel>
          {/* Inventory Tab */}
          <TabPanel value={tabValue} index={1} aria-labelledby="product-tab-1">
            {fetchLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <Typography variant="body1" color="text.secondary">Loading inventory...</Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                <FormSection title="General Inventory Settings">
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      name="inventory.quantity"
                      label="Total Stock (All Warehouses)"
                      fullWidth
                      type="number"
                      inputProps={{ min: 0, step: 1, readOnly: true }}
                      value={inventorySummary.totalQuantity}
                      onChange={() => {}}
                      helperText={"This is fetched from the inventory database (sum of all warehouses)"}
                      disabled={true}
                    />
                    <TextField
                      name="inventory.lowStockThreshold"
                      label="Global Low Stock Threshold"
                      fullWidth
                      type="number"
                      inputProps={{ min: 0, step: 1, readOnly: true }}
                      value={inventorySummary.globalLowStockThreshold}
                      onChange={() => {}}
                      helperText={'Send alert when total stock falls below this level (min threshold across all warehouses)'
}
                      disabled={true}
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
                        <FormControl fullWidth required error={!!errors[`warehouse_warehouseId_${index}`]}>
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
                          {errors[`warehouse_warehouseId_${index}`] && <FormHelperText>{errors[`warehouse_warehouseId_${index}`]}</FormHelperText>}
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
                            error={!!errors[`warehouse_quantity_${index}`]}
                            helperText={errors[`warehouse_quantity_${index}`]}
                          />
                          <TextField
                            label="Min Threshold"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.minThreshold}
                            onChange={(e) => updateWarehouseInventory(index, 'minThreshold', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_minThreshold_${index}`]}
                            helperText={errors[`warehouse_minThreshold_${index}`]}
                          />
                          <TextField
                            label="Max Threshold"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.maxThreshold}
                            onChange={(e) => updateWarehouseInventory(index, 'maxThreshold', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_maxThreshold_${index}`]}
                            helperText={errors[`warehouse_maxThreshold_${index}`]}
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
                            error={!!errors[`warehouse_reorderPoint_${index}`]}
                            helperText={errors[`warehouse_reorderPoint_${index}`] || 'Auto-reorder when stock hits this level'}
                          />
                          <TextField
                            label="Reorder Quantity"
                            type="number"
                            inputProps={{ min: 0, step: 1 }}
                            value={warehouseInventory.reorderQuantity}
                            onChange={(e) => updateWarehouseInventory(index, 'reorderQuantity', e.target.value)}
                            disabled={loading}
                            fullWidth
                            error={!!errors[`warehouse_reorderQuantity_${index}`]}
                            helperText={errors[`warehouse_reorderQuantity_${index}`] || 'Quantity to order when reordering'}
                          />
                        </Stack>
                      </Stack>
                    </Box>              
                  ))}
                </FormSection>
              </Stack>
            )}
          </TabPanel>
            {/* Price History Tab - Only shown in edit mode */}
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
        </React.Fragment>
      </Box>
      <Box sx={{ mt: 4 }}>
        <FormButtons
          onCancel={onCancel}
          onSubmit={handleSubmit}
          loading={loading}
          submitText={isEditMode ? 'Update Product' : 'Create Product'}
          canSubmit={isEditMode ? canPerform('product:edit') : canPerform('product:create')}
          submitDisabledReason={
            isEditMode 
              ? !canPerform('product:edit') ? 'You do not have permission to edit products' : undefined
              : !canPerform('product:create') ? 'You do not have permission to create products' : undefined
          }
        />
      </Box>
    </FormContainer>
  );
};

export default ProductForm;

// New component for form section with tooltip support