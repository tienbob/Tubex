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
import { Warehouse, ApiError } from '../services/api/warehouseService';

const WarehouseManagement: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', address: '', capacity: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const companyId = 'your-company-id'; // Replace with actual company ID from context

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchInventory();
    }
  }, [selectedWarehouse]);
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseService.getWarehouses(companyId);
      setWarehouses(response.data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch warehouses');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getInventory({
        companyId,
        warehouseId: selectedWarehouse
      });
      setInventory(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch inventory');
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
    setNewWarehouse({ name: '', address: '', capacity: '' });
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
      }
      if (!newWarehouse.capacity || isNaN(Number(newWarehouse.capacity)) || Number(newWarehouse.capacity) <= 0) {
        setError('Valid warehouse capacity is required');
        return;
      }

      await warehouseService.createWarehouse(companyId, {
        name: newWarehouse.name.trim(),
        address: newWarehouse.address.trim(),
        capacity: Number(newWarehouse.capacity),
        // Removed 'status' as it is not part of 'WarehouseCreateInput'
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

  const handleDeleteWarehouse = async (warehouseId: string) => {
    try {
      await warehouseService.deleteWarehouse(companyId, warehouseId);
      await fetchWarehouses();
      if (selectedWarehouse === warehouseId) {
        setSelectedWarehouse('');
      }
      setError(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete warehouse');
        console.error(err);
      }
    }
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
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Warehouses</Typography>
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleOpenDialog}
                variant="contained"
                color="primary"
              >
                Add Warehouse
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {warehouses.map((warehouse) => (
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
                    <Typography>{warehouse.name}</Typography>
                    <Box>
                      <IconButton size="small" onClick={(e) => {
                        e.stopPropagation();
                        // Add edit logic
                      }}>
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
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Inventory List */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Inventory
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
                  </TableHead>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name}</TableCell>
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
                    ))}
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
      </Box>

      {/* Add Warehouse Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New Warehouse</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Warehouse Name"
              fullWidth
              value={newWarehouse.name}
              onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={newWarehouse.address}
              onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
            />
            <TextField
              label="Capacity"
              fullWidth
              type="number"
              value={newWarehouse.capacity}
              onChange={(e) => setNewWarehouse({ ...newWarehouse, capacity: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateWarehouse} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WarehouseManagement;