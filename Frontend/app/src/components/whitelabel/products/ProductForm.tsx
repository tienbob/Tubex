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
import { useAccessControl } from '../../../hooks/useAccessControl';
import SmartCategoryInput from '../../common/SmartCategoryInput';

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
  const { user, permissions, loading: accessLoading } = useAccessControl();

  // Show loading while checking access control
  if (accessLoading) {
    return <div>Loading...</div>;
  }
  // Render different forms based on user company type
  if (user?.companyType === 'dealer' || user?.role === 'dealer') {
    return (
      <DealerProductForm
        companyId={companyId}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  
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
  onSave,  onCancel,
}) => {
  const { user, permissions, canPerform } = useAccessControl();
  const isEditMode = !!productId;
  
  const [tabValue, setTabValue] = useState(0);const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
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
  
  // Track new category name if user creates one
  const [newCategoryName, setNewCategoryName] = useState<string>('');
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
  };  const fetchSuppliers = async () => {
    try {
      const response = await companyService.getSuppliers();
      
      const suppliersList = response.data || [];
      
      const filteredSuppliers = suppliersList
        .filter(supplier => supplier.type === 'supplier')
        .map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          type: supplier.type as 'supplier'
        }));
      
      setSuppliers(filteredSuppliers);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err);
    }
  };const fetchWarehouses = async () => {
    try {
      if (!companyId) {
        console.error('No companyId available for fetching warehouses');
        setWarehouses([]);
        return;
      }
      
      // Call with parameters to ensure we get warehouses for the right company
      const response = await warehouseService.getWarehouses({ companyId });
      
      // Extract warehouses from the correct nested structure
      const warehousesList = response.data?.warehouses || response.data || [];
      
      // Filter only active warehouses
      const activeWarehouses = warehousesList.filter((warehouse: Warehouse) => 
        warehouse.status === 'active'
      );
      
      setWarehouses(activeWarehouses);
      
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      setWarehouses([]); // Ensure warehouses is set to empty array on error
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
      console.log('=== FETCHING PRODUCT DETAILS ===');
      console.log('Product data:', product);
      console.log('Product inventory:', product.inventory);
        // Fetch existing inventory records for this product
      let existingWarehouseInventory: any[] = [];
      try {
        console.log('Fetching inventory for product ID:', productId);
        
        // Try to get inventory summary first, then detailed inventory
        try {
          const inventorySummary = await inventoryService.getProductInventorySummary(productId);
          console.log('Inventory summary:', inventorySummary);
          
          if (inventorySummary?.data?.locations) {
            existingWarehouseInventory = inventorySummary.data.locations.map((location: any) => ({
              warehouseId: location.warehouse_id,
              quantity: location.quantity.toString(),
              minThreshold: '',
              maxThreshold: '',
              reorderPoint: '',
              reorderQuantity: '',
            }));
          }
        } catch (summaryError) {
          console.warn('Failed to fetch inventory summary, trying general inventory:', summaryError);
          
          // Fallback: get general inventory and filter by product
          const inventoryResponse = await inventoryService.getInventory({ 
            companyId: companyId,
            search: product.name // Search by product name as a fallback
          });
          console.log('General inventory response:', inventoryResponse);
          
          const inventoryData = inventoryResponse.data || [];
          const productInventory = inventoryData.filter((inv: any) => inv.product_id === productId);
          
          existingWarehouseInventory = productInventory.map((inv: any) => ({
            warehouseId: inv.warehouse_id || '',
            quantity: inv.quantity?.toString() || '',
            minThreshold: inv.min_threshold?.toString() || '',
            maxThreshold: inv.max_threshold?.toString() || '',
            reorderPoint: inv.reorder_point?.toString() || '',
            reorderQuantity: inv.reorder_quantity?.toString() || '',
          }));
        }
        
        console.log('Existing warehouse inventory:', existingWarehouseInventory);
      } catch (inventoryError) {
        console.warn('Failed to fetch existing inventory:', inventoryError);
        // Continue without existing inventory data
      }

      // Map API response to form data
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
          warehouses: existingWarehouseInventory.map((inv: any) => ({
            warehouseId: inv.warehouseId || '',
            quantity: inv.quantity?.toString() || '',
            minThreshold: inv.minThreshold?.toString() || '',
            maxThreshold: inv.maxThreshold?.toString() || '',
            reorderPoint: inv.reorderPoint?.toString() || '',
            reorderQuantity: inv.reorderQuantity?.toString() || '',
          })),
        },
      });
      
      console.log('Form data set with warehouse inventory:', existingWarehouseInventory.length, 'items');
    } catch (err: any) {
      setApiError(err.message || 'Failed to load product details');
      console.error('Error fetching product:', err);
    } finally {
      setFetchLoading(false);
    }
  };const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields according to ProductCreateInput in productService
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    // Check if either category is selected OR new category name is provided
    // Also check if there's an existing category or new one being created
    const hasCategory = formData.categoryId.trim() || newCategoryName.trim();
    console.log('Validation check - categoryId:', formData.categoryId, 'newCategoryName:', newCategoryName, 'hasCategory:', hasCategory);
    
    if (!hasCategory) {
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
    console.log('=== ADD WAREHOUSE INVENTORY ===');
    console.log('Current warehouse count:', formData.inventory.warehouses.length);
    console.log('Available warehouses:', warehouses.length);
    
    setFormData((prev) => {
      const newFormData = {
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
      };
      
      console.log('New warehouse count after add:', newFormData.inventory.warehouses.length);
      console.log('New warehouse entries:', newFormData.inventory.warehouses);
      
      return newFormData;
    });
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
    console.log(`=== UPDATE WAREHOUSE INVENTORY [${index}] ===`);
    console.log('Field:', field, 'Value:', value);
    console.log('Current warehouse data before update:', formData.inventory.warehouses[index]);
    
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        inventory: {
          ...prev.inventory,
          warehouses: prev.inventory.warehouses.map((warehouse, i) => 
            i === index ? { ...warehouse, [field]: value } : warehouse
          )
        }
      };
      
      console.log('Updated warehouse data:', newFormData.inventory.warehouses[index]);
      console.log('All warehouse data after update:', newFormData.inventory.warehouses);
      
      return newFormData;
    });
  };// Handle category changes (existing or new)
  const handleCategoryChange = (categoryId: string, categoryName?: string) => {
    console.log('handleCategoryChange called:', { categoryId, categoryName });
    console.log('Current errors:', errors);
    console.log('Current formData.categoryId:', formData.categoryId);
    console.log('Current newCategoryName:', newCategoryName);
    
    if (categoryId) {
      // Existing category selected
      setFormData(prev => ({ ...prev, categoryId }));
      setNewCategoryName('');
      // Clear category error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.categoryId;
        console.log('Clearing error, new errors:', newErrors);
        return newErrors;
      });
      console.log('Set existing category ID:', categoryId);
    } else if (categoryName) {
      // New category name entered
      setFormData(prev => ({ ...prev, categoryId: '' }));
      setNewCategoryName(categoryName);
      // Clear category error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.categoryId;
        console.log('Clearing error for new category, new errors:', newErrors);
        return newErrors;
      });
      console.log('Set new category name:', categoryName);
    } else {
      // Cleared
      setFormData(prev => ({ ...prev, categoryId: '' }));
      setNewCategoryName('');
      console.log('Cleared category');
      // Don't clear error here - user needs to select/enter a category
    }
  };  const handleSubmit = async () => {
    console.log('=== FORM SUBMIT START ===');
    console.log('Current formData:', formData);
    console.log('formData.inventory:', formData.inventory);
    console.log('formData.inventory.warehouses:', formData.inventory.warehouses);
    console.log('formData.inventory.warehouses.length:', formData.inventory.warehouses.length);
    console.log('Warehouse details:', formData.inventory.warehouses.map((w, i) => ({ 
      index: i, 
      warehouseId: w.warehouseId, 
      quantity: w.quantity 
    })));
    console.log('ProductForm handleSubmit debug:', {
      companyId,
      user,
      formData,
      newCategoryName,
      isEditMode,
      productId
    });
    
    if (!companyId) {
      console.error('No companyId available for product creation');
      setApiError('Company ID not available');
      return;
    }
    
    console.log('Form validation - before check:', { 
      categoryId: formData.categoryId, 
      newCategoryName: newCategoryName,
      hasCategory: formData.categoryId.trim() || newCategoryName.trim()
    });
    
    if (!validateForm()) {
      console.log('Form validation failed, errors:', errors);
      return;
    }
    
    setLoading(true);
    setApiError(null);
    
    try {
      let finalCategoryId = formData.categoryId;
      
      // Create new category if user entered a new one
      if (!finalCategoryId && newCategoryName.trim()) {
        try {
          const categoryResponse = await productService.createCategory(companyId, {
            name: newCategoryName.trim(),
            description: `Auto-created category for product: ${formData.name}`
          });
          finalCategoryId = categoryResponse.data.id;
          
          // Refresh categories list to include the new one
          await fetchCategories();
        } catch (categoryError: any) {
          console.error('Error creating category:', categoryError);
          setApiError(`Failed to create category: ${categoryError.message}`);
          return;
        }
      }      // Prepare data for API according to ProductCreateInput or ProductUpdateInput from productService
      const productData: ProductApiInput = {
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.price),
        category_id: finalCategoryId,
        supplier_id: companyId, // Use the current company as the supplier since this is a supplier adding their own product
        status: formData.status === 'discontinued' ? 'inactive' : formData.status,
        unit: 'piece', // Default unit value
      };
      
      // Only include inventory for creation, not updates (inventory is handled separately for existing products)
      if (!isEditMode && (formData.inventory.quantity || formData.inventory.lowStockThreshold)) {
        productData.inventory = {};
        if (formData.inventory.quantity) {
          productData.inventory.quantity = parseInt(formData.inventory.quantity);
        }
        if (formData.inventory.lowStockThreshold) {
          productData.inventory.lowStockThreshold = parseInt(formData.inventory.lowStockThreshold);
        }
      }
        let savedProduct;      if (isEditMode && productId) {
        savedProduct = await productService.updateProduct(productId, productData);
      } else {
        const productResponse = await productService.createProduct(productData);
        // Handle different response structures - could be direct Product or wrapped in data
        savedProduct = (productResponse as any).data || productResponse;
      }
        console.log('Raw product response:', savedProduct);
      console.log('Saved product:', savedProduct);
      console.log('Product ID from response:', savedProduct?.id);
      console.log('Is edit mode check:', isEditMode);
      console.log('Original productId prop:', productId);
      
      if (onSave) {
        onSave(savedProduct);
      }      // Create inventory records for each warehouse
      // This can happen during both product creation AND when editing a product to add warehouse inventory
      const hasWarehouseInventory = formData.inventory.warehouses.length > 0;
      const productIdToUse = savedProduct?.id || productId;
      
      console.log('=== INVENTORY CREATION LOGIC CHECK ===');
      console.log('isEditMode:', isEditMode);
      console.log('original productId:', productId);
      console.log('savedProduct exists:', !!savedProduct);
      console.log('savedProduct.id:', savedProduct?.id);
      console.log('productIdToUse:', productIdToUse);
      console.log('hasWarehouseInventory:', hasWarehouseInventory);
      console.log('warehouse count:', formData.inventory.warehouses.length);
      
      // Create inventory if we have warehouse data and a valid product ID
      if (hasWarehouseInventory && productIdToUse) {        console.log('=== INVENTORY CREATION DEBUG ===');
        console.log('Creating warehouse inventory for product:', productIdToUse);
        console.log('Number of warehouse entries:', formData.inventory.warehouses.length);
        console.log('Warehouse inventory entries:', formData.inventory.warehouses);
        console.log('Current user context:', user);
        console.log('Is edit mode:', isEditMode);
          try {
          for (let index = 0; index < formData.inventory.warehouses.length; index++) {
            const warehouseInventory = formData.inventory.warehouses[index];
            console.log(`\n--- Processing warehouse ${index + 1} ---`);
            console.log('Warehouse inventory data:', warehouseInventory);
            console.log('Has warehouseId:', !!warehouseInventory.warehouseId);
            console.log('Has quantity:', !!warehouseInventory.quantity);
            
            if (warehouseInventory.warehouseId && warehouseInventory.quantity) {
              console.log('✓ Valid warehouse entry, creating inventory...');
                const inventoryData = {
                product_id: productIdToUse,
                warehouse_id: warehouseInventory.warehouseId,
                quantity: parseFloat(warehouseInventory.quantity),
                unit: 'piece', // Default unit
                min_threshold: warehouseInventory.minThreshold ? parseFloat(warehouseInventory.minThreshold) : undefined,
                max_threshold: warehouseInventory.maxThreshold ? parseFloat(warehouseInventory.maxThreshold) : undefined,
                reorder_point: warehouseInventory.reorderPoint ? parseFloat(warehouseInventory.reorderPoint) : undefined,
                reorder_quantity: warehouseInventory.reorderQuantity ? parseFloat(warehouseInventory.reorderQuantity) : undefined,
              };
              
              console.log('Inventory data to create:', inventoryData);
              console.log('About to call inventoryService.createInventoryItem...');
              
              const inventoryResult = await inventoryService.createInventoryItem(inventoryData);
              console.log('✓ Inventory created successfully:', inventoryResult);
            } else {
              console.log('✗ Skipping warehouse entry - missing warehouseId or quantity');
              console.log('  warehouseId:', warehouseInventory.warehouseId);
              console.log('  quantity:', warehouseInventory.quantity);
            }
          }
          console.log('=== INVENTORY CREATION COMPLETE ===');        } catch (inventoryError: any) {
          console.error('=== INVENTORY CREATION ERROR ===');
          console.error('Error type:', inventoryError?.constructor?.name);
          console.error('Error message:', inventoryError?.message);
          console.error('Error details:', inventoryError);
          console.error('Error stack:', inventoryError?.stack);
          console.warn('Product created but inventory setup failed:', inventoryError);
          // Don't throw error since product was created successfully
        }      } else {
        console.log('=== INVENTORY CREATION SKIPPED ===');
        console.log('Reason - hasWarehouseInventory:', hasWarehouseInventory);
        console.log('Reason - productIdToUse:', productIdToUse);
        console.log('Reason - warehouse count:', formData.inventory.warehouses.length);
        console.log('Warehouse entries:', formData.inventory.warehouses);
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
              }}            />
            <SmartCategoryInput
              companyId={companyId}
              value={formData.categoryId}
              onChange={handleCategoryChange}
              error={errors.categoryId}
              disabled={loading}
              required
              label="Product Category"
              helperText="Choose or create a category that best describes your product"
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

