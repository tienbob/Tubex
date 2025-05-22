import React from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { InventoryItem } from '../../services/api/inventoryService';

interface InventoryItemRowProps {
  item: InventoryItem;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (itemId: string) => void;
}

const InventoryItemRow: React.FC<InventoryItemRowProps> = ({
  item,
  onEdit,
  onDelete
}) => {
  const isLowStock = item.quantity <= (item.min_threshold || 0);
  const isOverStock = item.max_threshold && item.quantity >= item.max_threshold;
  
  // Determine inventory status
  const getStockStatus = () => {
    if (isLowStock) {
      return {
        label: 'Low Stock',
        color: 'error' as const,
        icon: <WarningIcon fontSize="small" />
      };
    } else if (isOverStock) {
      return {
        label: 'Over Stock',
        color: 'warning' as const,
        icon: <WarningIcon fontSize="small" />
      };
    } else {
      return {
        label: 'In Stock',
        color: 'success' as const,
        icon: <CheckCircleIcon fontSize="small" />
      };
    }
  };
  
  const status = getStockStatus();
  
  return (
    <TableRow>
      <TableCell>{item.product?.name || 'Unknown Product'}</TableCell>
      <TableCell align="right">{item.quantity}</TableCell>
      <TableCell>{item.location || 'N/A'}</TableCell>
      <TableCell>
        <Chip
          size="small"
          label={status.label}
          color={status.color}
          icon={status.icon}
        />
      </TableCell>
      <TableCell align="right">
        {onEdit && (
          <Tooltip title="Edit inventory">
            <IconButton 
              size="small" 
              onClick={() => onEdit(item)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {onDelete && (
          <Tooltip title="Delete inventory">
            <IconButton 
              size="small" 
              onClick={() => onDelete(item.id)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
};

export default InventoryItemRow;
