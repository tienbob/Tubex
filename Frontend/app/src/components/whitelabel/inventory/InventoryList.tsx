import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import WarningIcon from '@mui/icons-material/Warning';
import DataTable, { Column } from '../DataTable';
import { useTheme } from '../../../contexts/ThemeContext';
import { inventoryService } from '../../../services/api';

interface InventoryListProps {
  companyId?: string;
  warehouseId?: string;
  onAdjustInventory?: (inventoryId: string) => void;
  onTransferInventory?: (inventoryId: string) => void;
  onAddInventory?: () => void;
  hideActions?: boolean;
  maxHeight?: number | string;
  onInventorySelect: (inventoryId: string) => void;
  onTransferClick: (product: { id: string; name: string }) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({
  companyId,
  warehouseId,
  onAdjustInventory,
  onTransferInventory,
  onAddInventory,
  hideActions = false,
  maxHeight,
}) => {
  const { theme: whitelabelTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouseId || '');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const [batchFilter, setBatchFilter] = useState('');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Custom button style based on the whitelabel theme
  const buttonStyle = {
    backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
    color: '#fff',
    borderRadius: whitelabelTheme?.buttonRadius !== undefined ? `${whitelabelTheme.buttonRadius}px` : undefined,
    '&:hover': {
      backgroundColor: whitelabelTheme?.primaryColor ? 
        `${whitelabelTheme.primaryColor}dd` : muiTheme.palette.primary.dark,
    },
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        page: page + 1, // API uses 1-based page indexing
        limit: rowsPerPage,
        search: searchTerm || undefined,
        warehouse_id: selectedWarehouse || undefined,
        company_id: companyId || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection,
      };
      
      if (batchFilter) {
        params.batch_id = batchFilter;
      }
      
      const response = await inventoryService.getInventory(params);
      setInventory(response.data || []);
      setTotalCount(response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchWarehouses = async () => {
    if (warehouseId) return; // Don't fetch warehouses if one is specified
    
    try {
      const params: any = {};
      if (companyId) {
        params.company_id = companyId;
      }
      
      const response = await inventoryService.getWarehouses(params);
      setWarehouses(response.data || []);
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
    }
  };
  
  useEffect(() => {
    fetchWarehouses();
  }, [companyId]);
  
  useEffect(() => {
    fetchInventory();
  }, [page, rowsPerPage, selectedWarehouse, companyId, sortBy, sortDirection]);
  
  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
    fetchInventory();
  };
  
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleWarehouseChange = (event: SelectChangeEvent<string>) => {
    const { value } = event.target;
    setSelectedWarehouse(value);
    setPage(0);
  };
  
  const formatQuantityWithUnit = (quantity: number, unit: string) => {
    return `${quantity.toLocaleString()} ${unit || ''}`;
  };

  const getStockLevelIndicator = (current: number, threshold: number, capacity: number) => {
    let color: 'default' | 'success' | 'warning' | 'error' = 'default';
    let label = 'Normal';
    
    const ratio = current / capacity;
    
    if (current <= threshold) {
      color = 'error';
      label = 'Low';
    } else if (ratio >= 0.9) {
      color = 'warning';
      label = 'High';
    } else if (ratio >= 0.5) {
      color = 'success';
      label = 'Good';
    }
    
    return <Chip size="small" color={color} label={label} />;
  };
  
  // Define columns
  const columns: Column[] = [
    {
      id: 'product_name',
      label: 'Product',
      minWidth: 170,
    },
    {
      id: 'quantity',
      label: 'Quantity',
      minWidth: 120,
      align: 'right',
      format: (value, row) => formatQuantityWithUnit(value, row?.unit)
    },
    {
      id: 'warehouse_name',
      label: 'Warehouse',
      minWidth: 150,
    },
    {
      id: 'batch_number',
      label: 'Batch',
      minWidth: 120,
    },
    {
      id: 'stock_level',
      label: 'Status',
      minWidth: 120,
      format: (_, row) => getStockLevelIndicator(
        row.quantity, 
        row.threshold || 0, 
        row.warehouse_capacity || 1000
      )
    },
    {
      id: 'last_updated',
      label: 'Last Updated',
      minWidth: 150,
      format: (value) => value ? new Date(value).toLocaleString() : 'N/A'
    }
  ];
  
  // Add actions column if required
  if (!hideActions) {
    columns.push({
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      align: 'right',
      format: (_, row) => (
        <Box>
          {onAdjustInventory && (
            <Tooltip title="Adjust Inventory">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustInventory(row.id);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {onTransferInventory && (
            <Tooltip title="Transfer Inventory">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onTransferInventory(row.id);
                }}
              >
                <TransferWithinAStationIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    });
  }
  
  return (
    <Box sx={{ maxHeight }}>
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', md: 'center' } 
      }}>
        <Typography variant="h6" component="h2">
          Inventory
          {inventory.some(item => item.quantity <= (item.threshold || 0)) && (
            <Tooltip title="Some products have low stock">
              <WarningIcon 
                color="warning" 
                fontSize="small" 
                sx={{ ml: 1, verticalAlign: 'middle' }} 
              />
            </Tooltip>
          )}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2 
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search products..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <Button 
                      size="small" 
                      onClick={() => {
                        setSearchTerm('');
                        if (!searchTerm) return;
                        setTimeout(() => handleSearch(), 0);
                      }}
                    >
                      Clear
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
            
            {!warehouseId && warehouses.length > 0 && (
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel id="warehouse-filter-label">Warehouse</InputLabel>
                <Select
                  labelId="warehouse-filter-label"
                  value={selectedWarehouse}
                  onChange={handleWarehouseChange}
                  label="Warehouse"
                >
                  <MenuItem value="">All Warehouses</MenuItem>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Tooltip title="Advanced Filters">
              <IconButton>
                <TuneIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {onAddInventory && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddInventory}
              sx={buttonStyle}
            >
              Add Inventory
            </Button>
          )}
        </Box>
      </Box>
      
      <DataTable
        columns={columns}
        data={inventory}
        loading={loading}
        error={error}
        pagination={{
          page,
          totalCount,
          rowsPerPage,
          onPageChange: (newPage) => setPage(newPage),
          onRowsPerPageChange: (newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setPage(0);
          },
        }}
      />
    </Box>
  );
};

export default InventoryList;