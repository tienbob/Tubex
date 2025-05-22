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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { WarehouseCreateInput } from '../services/api/warehouseService';
import { useAuth } from '../contexts/AuthContext';
import useForm from '../hooks/useForm';
import InventoryItemRow from '../components/inventory/InventoryItemRow';
import useWarehouseOperations from '../hooks/useWarehouseOperations';
import useInventoryOperations from '../hooks/useInventoryOperations';

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

const WarehouseManagementOptimized: React.FC = () => {
  // Get company ID from auth context
  const { user } = useAuth();
  const companyId = user?.companyId || '';
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Initialize warehouse operations hook
  const {
    selectedWarehouse,
    setSelectedWarehouse,
    warehouses,
    error: warehouseError,
    isLoading: warehouseLoading,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
  } = useWarehouseOperations({
    companyId,
    onWarehouseDeleted: (warehouseId) => {
      if (selectedWarehouse === warehouseId) {
        setSelectedWarehouse('');
      }
    }
  });
  
  // Initialize inventory operations hook
  const {
    inventory,
    isLoading: inventoryLoading,
    error: inventoryError,
    page,
    rowsPerPage,
    totalCount,
    sortBy,
    sortDirection,
    searchQuery,
    handlePageChange,
    handleRowsPerPageChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleSearchQueryChange,
    refreshInventory
  } = useInventoryOperations({
    companyId,
    warehouseId: selectedWarehouse
  });
  
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
  
  // Fetch warehouses when companyId changes
  useEffect(() => {
    if (companyId) {
      fetchWarehouses();
    }
  }, [companyId, fetchWarehouses]);
  
  // Fetch inventory when selectedWarehouse changes
  useEffect(() => {
    if (selectedWarehouse) {
      refreshInventory();
    }
  }, [selectedWarehouse, refreshInventory]);
  
  // Handle opening dialog for creating/editing a warehouse
  const handleOpenDialog = (warehouseId?: string) => {
    if (warehouseId) {
      // Edit mode - find the warehouse and set form values
      const warehouseToEdit = warehouses.find(w => w.id === warehouseId);
      if (warehouseToEdit) {
        setIsEditMode(true);
        warehouseForm.setValues({
          name: warehouseToEdit.name,
          address: warehouseToEdit.address,
          capacity: warehouseToEdit.capacity.toString(),
          type: warehouseToEdit.type || 'storage',
          notes: warehouseToEdit.notes || ''
        });
      }
    } else {
      // Create mode
      setIsEditMode(false);
      warehouseForm.resetForm();
    }
    setOpenDialog(true);
  };
  
  // Handle closing the dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle creating or updating a warehouse
  const handleCreateOrUpdateWarehouse = async () => {
    if (!warehouseForm.validateForm()) return;
    
    const warehouseData: WarehouseCreateInput = {
      name: warehouseForm.values.name.trim(),
      address: warehouseForm.values.address.trim(),
      capacity: Number(warehouseForm.values.capacity),
      type: warehouseForm.values.type,
      notes: warehouseForm.values.notes.trim() || undefined
    };
    
    try {
      if (isEditMode && selectedWarehouse) {
        await updateWarehouse(selectedWarehouse, warehouseData);
      } else {
        await createWarehouse(warehouseData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving warehouse:', error);
    }
  };
  
  // Handle deleting a warehouse
  const handleDeleteWarehouse = (warehouseId: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      deleteWarehouse(warehouseId);
    }
  };
  
  // Handle selecting a warehouse
  const handleWarehouseSelect = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
  };
  
  // Display combined error message from various operations
  const errorMessage = warehouseError?.message || inventoryError;
  
  // Determine if any operation is loading
  const isLoading = warehouseLoading || inventoryLoading;
  
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

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Warehouses List */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Warehouses</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchWarehouses}
                  disabled={warehouseLoading}
                >
                  Refresh
                </Button>
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={() => handleOpenDialog()}
                  variant="contained"
                  color="primary"
                  disabled={warehouseLoading}
                >
                  Add Warehouse
                </Button>
              </Box>
            </Box>
            
            {warehouseLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
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
                        '&:hover': {
                          backgroundColor: selectedWarehouse === warehouse.id 
                            ? 'primary.light' 
                            : 'action.hover'
                        }
                      }}
                      onClick={() => handleWarehouseSelect(warehouse.id)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="subtitle1">{warehouse.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {warehouse.address}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              Capacity: {warehouse.capacity}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Type: {warehouse.type}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Status: {warehouse.status}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(warehouse.id);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWarehouse(warehouse.id);
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))
                ) : (
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography color="text.secondary">No warehouses available</Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Paper>
        </Box>

        {/* Inventory List */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Inventory</Typography>
              
              {/* Search field for inventory */}
              {selectedWarehouse && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="Search inventory"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => handleSearchQueryChange(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={refreshInventory}
                    disabled={inventoryLoading}
                  >
                    Refresh
                  </Button>
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
                            if (sortBy === 'product.name') {
                              handleSortDirectionChange();
                            } else {
                              handleSortByChange('product.name');
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          Product 
                          {sortBy === 'product.name' && (
                            sortDirection === 'asc' ? ' ↑' : ' ↓'
                          )}
                        </TableCell>
                        <TableCell 
                          align="right"
                          onClick={() => {
                            if (sortBy === 'quantity') {
                              handleSortDirectionChange();
                            } else {
                              handleSortByChange('quantity');
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          Quantity
                          {sortBy === 'quantity' && (
                            sortDirection === 'asc' ? ' ↑' : ' ↓'
                          )}
                        </TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryLoading && inventory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <CircularProgress size={24} sx={{ my: 3 }} />
                          </TableCell>
                        </TableRow>
                      ) : inventory.length > 0 ? (
                        inventory.map((item) => (
                          <InventoryItemRow 
                            key={item.id}
                            item={item}
                            onEdit={(item) => console.log('Edit item:', item)}
                            onDelete={(itemId) => console.log('Delete item:', itemId)}
                          />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography sx={{ py: 2 }}>No inventory items found</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={(_, page) => handlePageChange(page)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => 
                    handleRowsPerPageChange(parseInt(e.target.value))
                  }
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              </>
            ) : (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Select a warehouse to view its inventory
                </Typography>
              </Box>
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
            disabled={warehouseLoading}
          >
            {warehouseLoading ? (
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

export default WarehouseManagementOptimized;
