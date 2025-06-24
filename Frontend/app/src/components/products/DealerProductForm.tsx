import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WhiteLabelButton from '../whitelabel/WhiteLabelButton';
import { productService, companyService, inventoryService } from '../../services/api';
import { Company } from '../../services/api/companyService';

interface SupplierProduct {
  id: string;
  name: string;
  description: string;
  base_price: number;
  unit: string;
  status: string;
  supplier: {
    id: string;
    name: string;
  };
}

interface Warehouse {
  id: string;
  name: string;
}

interface ProductInventory {
  productId: string;
  warehouseId: string;
  quantity: number;
}

interface DealerProductFormProps {
  companyId: string;
  onSave?: (products: any[]) => void;
  onCancel?: () => void;
}

const DealerProductForm: React.FC<DealerProductFormProps> = ({
  companyId,
  onSave,
  onCancel,
}) => {
  const [suppliers, setSuppliers] = useState<Company[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productInventories, setProductInventories] = useState<Map<string, ProductInventory[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch suppliers and warehouses on component mount
  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
  }, []);

  // Fetch supplier products when supplier is selected
  useEffect(() => {
    if (selectedSupplierId) {
      fetchSupplierProducts();
    } else {
      setSupplierProducts([]);
    }
  }, [selectedSupplierId]);
  const fetchSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      console.log('DealerProductForm - Fetching suppliers...');
      const response = await companyService.getSuppliers();
      console.log('DealerProductForm - Suppliers response:', response);
      setSuppliers(response.data || []);
    } catch (err: any) {
      console.error('DealerProductForm - Error fetching suppliers:', err);
      console.error('DealerProductForm - Error response:', err.response);
      if (err.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to fetch suppliers');
      }
    } finally {
      setSuppliersLoading(false);
    }
  };  const fetchSupplierProducts = async () => {
    if (!selectedSupplierId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch products from the selected supplier using their company ID
      const response = await productService.getProductsBySupplier(selectedSupplierId, {
        status: 'active',
        limit: 100, // Get more products for selection
      });
      
      console.log('Supplier products response:', response);
      setSupplierProducts(response.products || []);
    } catch (err: any) {
      console.error('Error fetching supplier products:', err);
      setError('Failed to fetch supplier products');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      console.log('DealerProductForm - Fetching warehouses for company:', companyId);
      const response = await inventoryService.getWarehouses(companyId);
      console.log('DealerProductForm - Warehouses response:', response);
      setWarehouses(response.data || []);
    } catch (err: any) {
      console.error('DealerProductForm - Error fetching warehouses:', err);
      // Don't set error for warehouses, just log it
      setWarehouses([]);
    }
  };

  const handleSupplierChange = (event: any) => {
    setSelectedSupplierId(event.target.value);
    setSelectedProducts(new Set()); // Clear selected products when supplier changes
  };

  const handleProductSelect = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      // Remove inventory entries for this product
      const newInventories = new Map(productInventories);
      newInventories.delete(productId);
      setProductInventories(newInventories);
    } else {
      newSelected.add(productId);
      // Initialize inventory entry for this product
      const newInventories = new Map(productInventories);
      if (warehouses.length > 0) {
        newInventories.set(productId, [{ productId, warehouseId: warehouses[0].id, quantity: 0 }]);
      }
      setProductInventories(newInventories);
    }
    setSelectedProducts(newSelected);
  };

  const addWarehouseInventory = (productId: string) => {
    const newInventories = new Map(productInventories);
    const current = newInventories.get(productId) || [];
    const availableWarehouses = warehouses.filter(w => 
      !current.some(inv => inv.warehouseId === w.id)
    );
    
    if (availableWarehouses.length > 0) {
      current.push({
        productId,
        warehouseId: availableWarehouses[0].id,
        quantity: 0
      });
      newInventories.set(productId, current);
      setProductInventories(newInventories);
    }
  };

  const removeWarehouseInventory = (productId: string, index: number) => {
    const newInventories = new Map(productInventories);
    const current = newInventories.get(productId) || [];
    current.splice(index, 1);
    newInventories.set(productId, current);
    setProductInventories(newInventories);
  };

  const updateInventoryQuantity = (productId: string, index: number, quantity: number) => {
    const newInventories = new Map(productInventories);
    const current = newInventories.get(productId) || [];
    if (current[index]) {
      current[index].quantity = quantity;
      newInventories.set(productId, current);
      setProductInventories(newInventories);
    }
  };

  const updateInventoryWarehouse = (productId: string, index: number, warehouseId: string) => {
    const newInventories = new Map(productInventories);
    const current = newInventories.get(productId) || [];
    if (current[index]) {
      current[index].warehouseId = warehouseId;
      newInventories.set(productId, current);
      setProductInventories(newInventories);
    }
  };
  const handleAddSelectedProducts = async () => {
    if (selectedProducts.size === 0) {
      setError('Please select at least one product');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productsToAdd = supplierProducts.filter(product => 
        selectedProducts.has(product.id)
      );

      console.log('DealerProductForm - Adding products to dealer catalog:', productsToAdd);
      console.log('DealerProductForm - Selected supplier ID:', selectedSupplierId);

      // Create products first
      const currentTime = Date.now();
      const productPromises = productsToAdd.map((product, index) => 
        productService.createProduct({
          name: `${product.name} (Dealer Copy ${currentTime}-${index})`,
          description: product.description,
          base_price: product.base_price,
          unit: product.unit,
          supplier_id: selectedSupplierId, // Original supplier
          status: 'active',
          // Note: dealer_id will be automatically set by the backend based on authenticated user
        })
      );

      const createdProducts = await Promise.all(productPromises);
      console.log('DealerProductForm - Successfully added products to dealer catalog');

      // Create inventory entries for products with inventory data
      const inventoryPromises: Promise<any>[] = [];
      
      createdProducts.forEach((createdProduct, index) => {
        const originalProduct = productsToAdd[index];
        const inventoryEntries = productInventories.get(originalProduct.id) || [];
        
        inventoryEntries.forEach(inventory => {
          if (inventory.quantity > 0) {
            inventoryPromises.push(
              inventoryService.createInventoryItem({
                product_id: createdProduct.id,
                warehouse_id: inventory.warehouseId,
                quantity: inventory.quantity,
                unit: originalProduct.unit,
                min_threshold: 0,
                max_threshold: 0,
                reorder_point: 0,
                reorder_quantity: 0,
                auto_reorder: false,
              })
            );
          }
        });
      });

      if (inventoryPromises.length > 0) {
        await Promise.all(inventoryPromises);
        console.log('DealerProductForm - Successfully created inventory entries');
      }
      
      // Clear selection after successful add
      setSelectedProducts(new Set());
      setProductInventories(new Map());

      if (onSave) {
        onSave(productsToAdd);
      }
    } catch (err: any) {
      console.error('Error adding products:', err);
      setError(err.message || 'Failed to add products to catalog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Add Products to Your Catalog
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a supplier and choose products to add to your catalog.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Supplier Selection */}
          <Box>
            <FormControl fullWidth>
              <InputLabel>Select Supplier</InputLabel>
              <Select
                value={selectedSupplierId}
                onChange={handleSupplierChange}
                label="Select Supplier"
                disabled={suppliersLoading}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>          </Box>

          {/* Products Table */}
          {selectedSupplierId && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Available Products
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedProducts.size > 0 && selectedProducts.size < supplierProducts.length}
                            checked={supplierProducts.length > 0 && selectedProducts.size === supplierProducts.length}
                            onChange={() => {
                              if (selectedProducts.size === supplierProducts.length) {
                                setSelectedProducts(new Set());
                              } else {
                                setSelectedProducts(new Set(supplierProducts.map(p => p.id)));
                              }
                            }}
                          />
                        </TableCell>                        <TableCell>Product Name</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Inventory Setup</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>                      {supplierProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onChange={() => handleProductSelect(product.id)}
                            />
                          </TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.description}</TableCell>
                          <TableCell>${product.base_price}</TableCell>
                          <TableCell>{product.unit}</TableCell>
                          <TableCell>
                            <Chip 
                              label={product.status} 
                              color={product.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {selectedProducts.has(product.id) ? (
                              <Box sx={{ minWidth: 200 }}>
                                {(productInventories.get(product.id) || []).map((inventory, index) => (
                                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                      <Select
                                        value={inventory.warehouseId}
                                        onChange={(e) => updateInventoryWarehouse(product.id, index, e.target.value)}
                                      >
                                        {warehouses.map((warehouse) => (
                                          <MenuItem key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={inventory.quantity}
                                      onChange={(e) => updateInventoryQuantity(product.id, index, parseInt(e.target.value) || 0)}
                                      sx={{ width: 80 }}
                                      inputProps={{ min: 0 }}
                                    />
                                    <WhiteLabelButton
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      onClick={() => removeWarehouseInventory(product.id, index)}
                                      disabled={(productInventories.get(product.id) || []).length <= 1}
                                    >
                                      ×
                                    </WhiteLabelButton>
                                  </Box>
                                ))}
                                <WhiteLabelButton
                                  size="small"
                                  variant="outlined"
                                  onClick={() => addWarehouseInventory(product.id)}
                                  disabled={warehouses.length === (productInventories.get(product.id) || []).length}
                                >
                                  + Add Warehouse
                                </WhiteLabelButton>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Select product to configure inventory
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {supplierProducts.length === 0 && !loading && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No products available from this supplier.
                </Alert>
              )}            </Box>
          )}          {/* Selected Products Summary */}
          {selectedProducts.size > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Selected Products & Inventory Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from(selectedProducts).map(productId => {
                  const product = supplierProducts.find(p => p.id === productId);
                  const inventories = productInventories.get(productId) || [];
                  const totalQuantity = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
                  
                  return (
                    <Card key={productId} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {product?.name}
                          </Typography>
                          <Chip 
                            label={`Total: ${totalQuantity} ${product?.unit || 'units'}`}
                            color={totalQuantity > 0 ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                        {inventories.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Warehouse Distribution:
                            </Typography>
                            {inventories.map((inventory, index) => {
                              const warehouse = warehouses.find(w => w.id === inventory.warehouseId);
                              return (
                                <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                                  • {warehouse?.name}: {inventory.quantity} {product?.unit || 'units'}
                                </Typography>
                              );
                            })}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <WhiteLabelButton
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </WhiteLabelButton>
              <WhiteLabelButton
                variant="contained"
                onClick={handleAddSelectedProducts}
                disabled={loading || selectedProducts.size === 0}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Adding Products...
                  </>
                ) : (
                  `Add ${selectedProducts.size} Product(s)`
                )}
              </WhiteLabelButton>
            </Box>          
            </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DealerProductForm;
