import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Divider
} from '@mui/material';

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  status: 'active' | 'inactive' | 'out_of_stock';
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
}

/**
 * Product card component for displaying product information
 * Used in product listings and grid views
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  const { id, name, description, basePrice, unit, status } = product;

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'out_of_stock':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="div" noWrap>
            {name}
          </Typography>
          <Chip
            label={status.replace('_', ' ')}
            color={getStatusColor()}
            size="small"
          />
        </Box>
        
        <Typography color="text.secondary" variant="body2" sx={{ 
          mb: 2, 
          height: '40px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {description}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            {new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND'
            }).format(basePrice)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            per {unit}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          onClick={() => onEdit && onEdit(product)}
        >
          Edit
        </Button>
        <Button 
          size="small" 
          color="error" 
          onClick={() => onDelete && onDelete(id)}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;