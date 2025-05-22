import React, { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import { Warehouse } from '../../services/api/warehouseService';
import { useApiRequest } from '../../hooks/useApiRequest';
import { warehouseService } from '../../services/api';

interface WarehouseSelectorProps {
  companyId: string;
  selectedWarehouse: string;
  onWarehouseSelect: (warehouseId: string) => void;
  label?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  required?: boolean;
}

const WarehouseSelector: React.FC<WarehouseSelectorProps> = ({
  companyId,
  selectedWarehouse,
  onWarehouseSelect,
  label = 'Warehouse',
  fullWidth = true,
  size = 'medium',
  required = false
}) => {
  // Use our custom hook for API calls
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
      manual: !companyId
    }
  );

  // Fetch warehouses when companyId changes
  useEffect(() => {
    if (companyId) {
      warehousesRequest.request();
    }
  }, [companyId]);

  // Handle select change
  const handleChange = (event: SelectChangeEvent<string>) => {
    onWarehouseSelect(event.target.value);
  };

  // Get warehouses from request data
  const warehouses = warehousesRequest.data?.data || [];

  if (warehousesRequest.error) {
    return <Alert severity="error">Failed to load warehouses</Alert>;
  }

  return (
    <FormControl fullWidth={fullWidth} size={size} required={required}>
      <InputLabel id="warehouse-select-label">{label}</InputLabel>
      <Select
        labelId="warehouse-select-label"
        value={selectedWarehouse}
        label={label}
        onChange={handleChange}
        displayEmpty={!required}
        disabled={warehousesRequest.isLoading}
      >
        {!required && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        
        {warehousesRequest.isLoading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Loading warehouses...</Typography>
            </Box>
          </MenuItem>
        ) : (
          warehouses.map((warehouse) => (
            <MenuItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </MenuItem>
          ))
        )}
        
        {!warehousesRequest.isLoading && warehouses.length === 0 && (
          <MenuItem disabled>
            <Typography>No warehouses available</Typography>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default WarehouseSelector;
