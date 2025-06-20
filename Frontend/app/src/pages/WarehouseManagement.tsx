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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { inventoryService, warehouseService } from '../services/api';
import { InventoryItem } from '../services/api/inventoryService';
import { Warehouse, ContactInfo, ApiError } from '../services/api/warehouseService';
import { useAuth } from '../contexts/AuthContext';
import { useAccessControl } from '../hooks/useAccessControl';


const WarehouseManagement: React.FC = () => {
  const { canPerform } = useAccessControl();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ 
    name: '', 
    address: '', 
    capacity: '',
    contactInfo: {
      name: '',
      phone: '',
      email: ''
    }
  });  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Get company ID from auth context
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string>('');
  
  // Set companyId from auth context when user data is available
  useEffect(() => {
    if (user && user.companyId) {
      setCompanyId(user.companyId);
    }
  }, [user]);

  useEffect(() => {
    fetchWarehouses();
  }, [companyId]); // Re-fetch when companyId changes

  useEffect(() => {
    if (selectedWarehouse) {
      fetchInventory();
    }
  }, [selectedWarehouse]);
  const fetchWarehouses = async () => {
    try {
      if (!companyId) {
        setWarehouses([]);
        return;
      }
      
      setLoading(true);
      const response = await warehouseService.getWarehouses(companyId);
      
      // Debug the response structure
      console.log('Warehouse API response:', response);
      
      // Check the structure of the response and extract the warehouses array
      if (Array.isArray(response.data)) {
        setWarehouses(response.data);
      } 
      // If response.data contains a warehouses property that is an array
      else if (response.data && typeof response.data === 'object' && 'warehouses' in response.data && 
               Array.isArray((response.data as any).warehouses)) {
        setWarehouses((response.data as any).warehouses);
      }
      // If response.data.data contains the warehouses array
      else if (response.data && typeof response.data === 'object' && 'data' in response.data && 
               Array.isArray((response.data as any).data)) {
        setWarehouses((response.data as any).data);
      }
      // Default to empty array if no matching structure is found
      else {
        console.error('Unexpected API response format:', response);
        setWarehouses([]);
      }
      
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch warehouses');
        console.error(err);
      }
      // Always set warehouses to an empty array on error
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory({
        companyId,
        warehouseId: selectedWarehouse
      });
        // SECURITY FIX: Remove client-side filtering as backend now handles all security
      // Backend already applies proper role-based filtering based on company type
      const inventoryData = response?.data || response || [];
      const inventoryList = Array.isArray(inventoryData) ? inventoryData : [];
      
      setInventory(inventoryList);
      setError(null);
    } catch (err) {
      setError('Failed to fetch inventory');
      setInventory([]); // Set empty array on error
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWarehouseSelect = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
    setNewWarehouse({ 
      name: '', 
      address: '', 
      capacity: '',
      contactInfo: {
        name: '',
        phone: '',
        email: ''
      }
    });
  };
  const handleCreateWarehouse = async () => {
    try {
      if (!newWarehouse.name.trim()) {
        setError('Warehouse name is required');
        return;
      }
      if (!newWarehouse.address.trim()) {
        setError('Warehouse address is required');
        return;
      }      if (!newWarehouse.capacity || isNaN(Number(newWarehouse.capacity)) || Number(newWarehouse.capacity) <= 0) {
        setError('Valid warehouse capacity is required');
        return;
      }
      if (!newWarehouse.contactInfo.name.trim()) {
        setError('Contact name is required');
        return;
      }
      if (!newWarehouse.contactInfo.phone.trim()) {
        setError('Contact phone is required');
        return;
      }
      if (!newWarehouse.contactInfo.email.trim()) {
        setError('Contact email is required');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newWarehouse.contactInfo.email)) {
        setError('Valid contact email is required');
        return;
      }      await warehouseService.createWarehouse(companyId, {
        name: newWarehouse.name.trim(),
        address: newWarehouse.address.trim(),
        capacity: Number(newWarehouse.capacity),
        contactInfo: {
          name: newWarehouse.contactInfo.name.trim(),
          phone: newWarehouse.contactInfo.phone.trim(),
          email: newWarehouse.contactInfo.email.trim()
        }
      });
      
      await handleCloseDialog();
      await fetchWarehouses();
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create warehouse');
        console.error(err);
      }
    }
  };
  const handleDeleteWarehouse = (warehouseId: string, warehouseName: string) => {
    setWarehouseToDelete({ id: warehouseId, name: warehouseName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteWarehouse = async () => {
    if (!warehouseToDelete) return;
    
    try {
      await warehouseService.deleteWarehouse(companyId, warehouseToDelete.id);
      await fetchWarehouses();
      if (selectedWarehouse === warehouseToDelete.id) {
        setSelectedWarehouse('');
      }
      setError(null);
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete warehouse');
        console.error(err);
      }
    }
  };

  const cancelDeleteWarehouse = () => {
    setDeleteDialogOpen(false);
    setWarehouseToDelete(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Warehouse Management
      </Typography>

      {error && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'error.light' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Warehouses List */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Warehouses</Typography>
              {canPerform('warehouseCreate') && (
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleOpenDialog}
                  variant="contained"
                  color="primary"
                >
                  Add Warehouse
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>              {Array.isArray(warehouses) ? warehouses.map((warehouse) => (
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
                    <Typography>{warehouse.name}</Typography>                    <Box>
                      {canPerform('warehouseEdit') && (
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          // Add edit logic
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {canPerform('warehouseDelete') && (                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWarehouse(warehouse.id, warehouse.name);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Paper>
              )) : (
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography color="text.secondary">No warehouses available</Typography>
                </Paper>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Inventory List */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 2 }}>            <Typography variant="h6" gutterBottom>
              Inventory
              {user && user.role === 'dealer' && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Showing inventory for products in your catalog
                </Typography>
              )}
              {user && user.role === 'supplier' && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Showing inventory for your products
                </Typography>
              )}
              {user && user.role === 'admin' && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Showing all inventory for your company
                </Typography>
              )}
            </Typography>
            {selectedWarehouse ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>                  <TableBody>
                    {Array.isArray(inventory) && inventory.length > 0 ? (
                      inventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell>{item.location || 'N/A'}</TableCell>
                          <TableCell>
                            {item.quantity <= (item.min_threshold || 0) ? 'Low Stock' : 'In Stock'}
                          </TableCell>                          <TableCell align="right">
                            {canPerform('inventoryEdit') && (
                              <Tooltip title="Edit">
                                <IconButton size="small">
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            {selectedWarehouse ? 'No inventory items found for this warehouse' : 'Select a warehouse to view inventory'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                Select a warehouse to view its inventory
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>      {/* Add Warehouse Dialog */}
      {canPerform('warehouseCreate') && (
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { minHeight: '500px' }
          }}
        >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" component="div">
            Add New Warehouse
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          {error && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Basic Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Warehouse Name"
                  fullWidth
                  variant="outlined"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { height: '56px' } }}
                />
                <TextField
                  label="Address"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={3}
                  value={newWarehouse.address}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                />
                <TextField
                  label="Capacity"
                  fullWidth
                  variant="outlined"
                  type="number"
                  value={newWarehouse.capacity}
                  onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { height: '56px' } }}
                  InputProps={{
                    endAdornment: <Typography variant="body2" color="text.secondary">units</Typography>
                  }}
                />
              </Box>
            </Box>

            {/* Contact Information Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Contact Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Contact Name"
                  fullWidth
                  variant="outlined"
                  value={newWarehouse.contactInfo.name}
                  onChange={(e) => setNewWarehouse({ 
                    ...newWarehouse, 
                    contactInfo: { ...newWarehouse.contactInfo, name: e.target.value }
                  })}
                  sx={{ '& .MuiOutlinedInput-root': { height: '56px' } }}
                />
                <TextField
                  label="Contact Phone"
                  fullWidth
                  variant="outlined"
                  value={newWarehouse.contactInfo.phone}
                  onChange={(e) => setNewWarehouse({ 
                    ...newWarehouse, 
                    contactInfo: { ...newWarehouse.contactInfo, phone: e.target.value }
                  })}
                  sx={{ '& .MuiOutlinedInput-root': { height: '56px' } }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Contact Email"
                  fullWidth
                  variant="outlined"
                  type="email"
                  value={newWarehouse.contactInfo.email}
                  onChange={(e) => setNewWarehouse({ 
                    ...newWarehouse, 
                    contactInfo: { ...newWarehouse.contactInfo, email: e.target.value }
                  })}
                  sx={{ '& .MuiOutlinedInput-root': { height: '56px' } }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button 
            onClick={handleCloseDialog} 
            variant="outlined"
            sx={{ minWidth: '100px', height: '40px' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateWarehouse} 
            variant="contained" 
            color="primary"
            sx={{ minWidth: '100px', height: '40px' }}
          >            Create Warehouse
          </Button>        </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteWarehouse}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete Warehouse
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete the warehouse "{warehouseToDelete?.name}"? 
            This action cannot be undone and will permanently remove all warehouse data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteWarehouse} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteWarehouse} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarehouseManagement;