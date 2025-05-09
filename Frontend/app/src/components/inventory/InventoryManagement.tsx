import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  TablePagination,
  useTheme as useMuiTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useInventory } from '../../hooks/useInventory';
import InventoryAdjustmentModal from './InventoryAdjustmentModal';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  unit: string;
  batch_id?: string;
  batch_number?: string;
  last_updated: string;
}

const InventoryManagement: React.FC = () => {
  const muiTheme = useMuiTheme();
  const { theme: whitelabelTheme } = useTheme();
  const { getInventoryItems, loading } = useInventory();

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = inventoryItems.filter(item => 
        item.product_name.toLowerCase().includes(lowercasedTerm) ||
        item.warehouse_name.toLowerCase().includes(lowercasedTerm) ||
        (item.batch_number && item.batch_number.toLowerCase().includes(lowercasedTerm))
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(inventoryItems);
    }
    setPage(0);
  }, [searchTerm, inventoryItems]);

  const loadInventory = async () => {
    try {
      const data = await getInventoryItems();
      setInventoryItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustModalOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    setAdjustModalOpen(false);
    loadInventory();
  };

  const getStockLevelChip = (quantity: number) => {
    let color = 'success';
    let label = 'Good Stock';
    
    if (quantity <= 0) {
      color = 'error';
      label = 'Out of Stock';
    } else if (quantity < 10) {
      color = 'warning';
      label = 'Low Stock';
    }
    
    return (
      <Chip 
        label={label} 
        color={color as 'success' | 'error' | 'warning'}
        size="small"
      />
    );
  };

  // Custom styles based on the whitelabel theme
  const headerStyles = {
    backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
    color: '#fff'
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2" fontWeight="bold">
          Inventory Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadInventory}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
              borderRadius: whitelabelTheme?.buttonRadius !== undefined 
                ? `${whitelabelTheme.buttonRadius}px` 
                : undefined,
            }}
          >
            Add Inventory
          </Button>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <TextField
            variant="outlined"
            placeholder="Search inventory..."
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <IconButton sx={{ ml: 1 }}>
            <FilterIcon />
          </IconButton>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={headerStyles}>Product</TableCell>
                <TableCell sx={headerStyles}>Warehouse</TableCell>
                <TableCell sx={headerStyles}>Quantity</TableCell>
                <TableCell sx={headerStyles}>Unit</TableCell>
                <TableCell sx={headerStyles}>Batch</TableCell>
                <TableCell sx={headerStyles}>Status</TableCell>
                <TableCell sx={headerStyles}>Last Updated</TableCell>
                <TableCell sx={headerStyles}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography>Loading inventory data...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography>No inventory items found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.warehouse_name}</TableCell>
                      <TableCell align="right">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.batch_number || 'N/A'}</TableCell>
                      <TableCell>{getStockLevelChip(item.quantity)}</TableCell>
                      <TableCell>{new Date(item.last_updated).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openAdjustModal(item)}
                          sx={{
                            backgroundColor: whitelabelTheme?.secondaryColor || muiTheme.palette.secondary.main,
                            borderRadius: whitelabelTheme?.buttonRadius !== undefined 
                              ? `${whitelabelTheme.buttonRadius}px` 
                              : undefined,
                          }}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredItems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {selectedItem && (
        <InventoryAdjustmentModal
          open={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          item={selectedItem}
          onSuccess={handleAdjustmentSuccess}
        />
      )}
    </Box>
  );
};

export default InventoryManagement;