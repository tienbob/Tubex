import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TablePagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { inventoryService, warehouseService } from '../services/api';
import { InventoryItem } from '../services/api/inventoryService';
import { Warehouse, ApiError, WarehouseCreateInput } from '../services/api/warehouseService';
import { useAuth } from '../contexts/AuthContext';
import useApiRequest from '../hooks/useApiRequest';
import useTableData from '../hooks/useTableData';
import useForm from '../hooks/useForm';

// Interface for warehouse dialog form
interface WarehouseFormValues {
  name: string;
  address: string;
  capacity: string;
  type: 'main' | 'secondary' | 'distribution' | 'storage';
  notes: string;
}

// Form validation function for warehouse
const validateWarehouseForm = (values: WarehouseFormValues) => {
  const errors: Partial<Record<keyof WarehouseFormValues, string>> = {};
  
  if (!values.name.trim()) {
    errors.name = 'Warehouse name is required';
  }
  
  if (!values.address.trim()) {
    errors.address = 'Warehouse address is required';
  }
  
  if (!values.capacity || isNaN(Number(values.capacity)) || Number(values.capacity) <= 0) {
    errors.capacity = 'Valid warehouse capacity is required';
  }
  
  return errors;
};

const WarehouseManagementRefactored: React.FC = () => {
  // Get company ID from auth context
  const { user } = useAuth();
  const companyId = user?.companyId || '';
  
  // Selected warehouse state
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Initialize form for warehouse creation/editing
  const warehouseForm = useForm<WarehouseFormValues>({
    initialValues: {
      name: '',
      address: '',
      capacity: '',
      type: 'storage',
      notes: ''
    },
    validate: validateWarehouseForm
  });
  
  // Use our custom hooks for API calls
  const warehousesRequest = useApiRequest<{ data: Warehouse[] }>(
    async () => {
      if (!companyId) {
        return { data: [] };
      }
      return await warehouseService.getWarehouses(companyId);
    },
    [],
    {
      dependencies: [companyId],
      manual: !companyId,
      onError: error => console.error('Error fetching warehouses:', error)
    }
  );
  
  // Function to fetch inventory data with parameters
  const fetchInventoryData = async (params: any) => {
    if (!selectedWarehouse || !companyId) {
      return { data: [], totalCount: 0 };
    }
    
    const apiParams = {
      companyId,
      warehouseId: selectedWarehouse,
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      search: params.search
    };
    
    try {
      const response = await inventoryService.getInventory(apiParams);
      return {
        data: response.data || [],
        totalCount: response.pagination?.total || 0
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  };
  
  // Use table hook for inventory data
  const inventoryTable = useTableData<InventoryItem>({
    defaultSortBy: 'product.name',
    defaultSortDirection: 'asc',
    fetchDataFn: fetchInventoryData
  });
  
  // Fetch inventory data when selected warehouse changes
  useEffect(() => {
    if (selectedWarehouse) {
      inventoryTable.fetchData();
    }
  }, [selectedWarehouse]);
    // Create warehouse API request
  const createWarehouseRequest = useApiRequest<any, [string, WarehouseCreateInput]>(
    async (companyId, data) => {
      return await warehouseService.createWarehouse(companyId, data);
    },
    [companyId, { name: '', address: '', capacity: 0, type: 'storage' }],
    {
      manual: true,
      onSuccess: () => {
        handleCloseDialog();
        warehousesRequest.request();
      }
    }
  );
    // Delete warehouse API request
  const deleteWarehouseRequest = useApiRequest<any, [string, string]>(
    async (companyId, warehouseId) => {
      return await warehouseService.deleteWarehouse(companyId, warehouseId);
    },
    [companyId, ''],
    {
      manual: true,
      onSuccess: () => {
        if (selectedWarehouse === deleteWarehouseRequest.request.arguments?.[1]) {
          setSelectedWarehouse('');
        }
        warehousesRequest.request();
      }
    }
  );
  
  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      // Edit mode
      setIsEditMode(true);
      warehouseForm.setValues({
        name: warehouse.name,
        address: warehouse.address,
        capacity: warehouse.capacity.toString(),
        type: warehouse.type || 'storage',
        notes: warehouse.notes || ''
      });
    } else {
      // Create mode
      setIsEditMode(false);
      warehouseForm.resetForm();
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleCreateOrUpdateWarehouse = async () => {
    if (!warehouseForm.validateForm()) return;
    
    const warehouseData: WarehouseCreateInput = {
      name: warehouseForm.values.name.trim(),
      address: warehouseForm.values.address.trim(),
      capacity: Number(warehouseForm.values.capacity),
      type: warehouseForm.values.type,
      notes: warehouseForm.values.notes.trim() || undefined
    };
    
    if (isEditMode && selectedWarehouse) {
      // Update existing warehouse - not implemented in this example
      // Would require an updateWarehouse API call
      console.log('Update warehouse logic would go here');
    } else {
      // Create new warehouse
      await createWarehouseRequest.request(companyId, warehouseData);
    }
  };
  
  const handleDeleteWarehouse = (warehouseId: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      deleteWarehouseRequest.request(companyId, warehouseId);
    }
  };
  
  const handleWarehouseSelect = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
  };
  
  // Display combined error message from various API requests
  const errorMessage = 
    warehousesRequest.error?.message || 
    inventoryTable.error || 
    createWarehouseRequest.error?.message || 
    deleteWarehouseRequest.error?.message;
  
  // Determine if any API request is loading
  const isLoading = 
    warehousesRequest.isLoading || 
    inventoryTable.loading || 
    createWarehouseRequest.isLoading || 
    deleteWarehouseRequest.isLoading;
  
  // Get warehouses from request data
  const warehouses = warehousesRequest.data?.data || [];
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Warehouse Management
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Warehouses List */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Warehouses</Typography>
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => handleOpenDialog()}
                variant="contained"
                color="primary"
              >
                Add Warehouse
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {warehouses.length > 0 ? (
                warehouses.map((warehouse) => (
                  <Paper
                    key={warehouse.id}
                    elevation={selectedWarehouse === warehouse.id ? 3 : 1}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      backgroundColor: selectedWarehouse === warehouse.id ? 'primary.light' : 'background.paper',
                    }}
                    onClick={() => handleWarehouseSelect(warehouse.id)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">{warehouse.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {warehouse.address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Capacity: {warehouse.capacity} | Type: {warehouse.type}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(warehouse);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWarehouse(warehouse.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))
              ) : !warehousesRequest.isLoading && (
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography color="text.secondary">No warehouses available</Typography>
                </Paper>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Inventory List */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Inventory</Typography>
              
              {/* Search field for inventory */}
              {selectedWarehouse && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    placeholder="Search inventory"
                    size="small"
                    value={inventoryTable.searchQuery}
                    onChange={(e) => inventoryTable.handleSearchQueryChange(e.target.value)}
                    InputProps={{
                      endAdornment: <SearchIcon color="action" />
                    }}
                    sx={{ mr: 2 }}
                  />
                </Box>
              )}
            </Box>
            
            {selectedWarehouse ? (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          onClick={() => {
                            if (inventoryTable.sortBy === 'product.name') {
                              inventoryTable.handleSortDirectionChange();
                            } else {
                              inventoryTable.handleSortByChange('product.name');
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          Product 
                          {inventoryTable.sortBy === 'product.name' && (
                            inventoryTable.sortDirection === 'asc' ? ' ↑' : ' ↓'
                          )}
                        </TableCell>
                        <TableCell 
                          align="right"
                          onClick={() => {
                            if (inventoryTable.sortBy === 'quantity') {
                              inventoryTable.handleSortDirectionChange();
                            } else {
                              inventoryTable.handleSortByChange('quantity');
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          Quantity
                          {inventoryTable.sortBy === 'quantity' && (
                            inventoryTable.sortDirection === 'asc' ? ' ↑' : ' ↓'
                          )}
                        </TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryTable.data.length > 0 ? (
                        inventoryTable.data.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell>{item.location || 'N/A'}</TableCell>
                            <TableCell>
                              {item.quantity <= (item.min_threshold || 0) ? 'Low Stock' : 'In Stock'}
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton size="small">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            {inventoryTable.loading ? (
                              <CircularProgress size={20} sx={{ my: 1 }} />
                            ) : (
                              'No inventory items found'
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={inventoryTable.totalCount}
                  page={inventoryTable.page}
                  onPageChange={(_, page) => inventoryTable.handlePageChange(page)}
                  rowsPerPage={inventoryTable.rowsPerPage}
                  onRowsPerPageChange={(e) => 
                    inventoryTable.handleRowsPerPageChange(parseInt(e.target.value))
                  }
                />
              </>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                Select a warehouse to view its inventory
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Add/Edit Warehouse Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditMode ? 'Edit Warehouse' : 'Add New Warehouse'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Warehouse Name"
              fullWidth
              {...warehouseForm.getFieldProps('name')}
              error={!!warehouseForm.touched.name && !!warehouseForm.errors.name}
              helperText={warehouseForm.touched.name ? warehouseForm.errors.name : ''}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              {...warehouseForm.getFieldProps('address')}
              error={!!warehouseForm.touched.address && !!warehouseForm.errors.address}
              helperText={warehouseForm.touched.address ? warehouseForm.errors.address : ''}
            />
            <TextField
              label="Capacity"
              fullWidth
              type="number"
              {...warehouseForm.getFieldProps('capacity')}
              error={!!warehouseForm.touched.capacity && !!warehouseForm.errors.capacity}
              helperText={warehouseForm.touched.capacity ? warehouseForm.errors.capacity : ''}
            />
            <TextField
              label="Notes (Optional)"
              fullWidth
              multiline
              rows={2}
              {...warehouseForm.getFieldProps('notes')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateOrUpdateWarehouse} 
            variant="contained" 
            color="primary"
            disabled={createWarehouseRequest.isLoading}
          >
            {createWarehouseRequest.isLoading ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              'Update'
            ) : (
              'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarehouseManagementRefactored;
