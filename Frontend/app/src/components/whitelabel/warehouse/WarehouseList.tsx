import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Warehouse as WarehouseIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { warehouseService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  capacity: number;
  type: 'main' | 'secondary' | 'distribution' | 'storage';
  status: 'active' | 'inactive' | 'under_maintenance';
  created_at: string;
}

const WarehouseList: React.FC = () => {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseService.getWarehouses();
      setWarehouses(response.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'under_maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'main': return '🏢';
      case 'secondary': return '🏪';
      case 'distribution': return '🚚';
      case 'storage': return '📦';
      default: return '🏭';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Warehouses</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {/* Navigate to create warehouse */}}
        >
          Add Warehouse
        </Button>
      </Box>      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            md: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)' 
          }, 
          gap: 3 
        }}
      >
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ mr: 1 }}>
                    {getTypeIcon(warehouse.type)} {warehouse.name}
                  </Typography>
                </Box>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {warehouse.address}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Chip 
                  label={warehouse.status.replace('_', ' ')} 
                  color={getStatusColor(warehouse.status) as any}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {warehouse.type} warehouse
                </Typography>
              </Box>

              <Typography variant="body2" sx={{ mt: 1 }}>
                Capacity: {warehouse.capacity ? `${warehouse.capacity.toLocaleString()} units` : 'Not set'}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {warehouses.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <WarehouseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No warehouses found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first warehouse to start managing inventory locations
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Create Warehouse
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default WarehouseList;
