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
  SelectChangeEvent,
  useTheme as useMuiTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DataTable, { Column } from '../DataTable';
import { useTheme } from '../../../contexts/ThemeContext';
import { productService } from '../../../services/api';

interface ProductListProps {
  companyId?: string;
  onAddProduct?: () => void;
  onEditProduct?: (productId: string) => void;
  maxHeight?: number | string;
  hideActions?: boolean;
  categoryFilter?: string;
  statusFilter?: string;
}

const ProductList: React.FC<ProductListProps> = ({
  companyId,
  onAddProduct,
  onEditProduct,
  maxHeight,
  hideActions = false,
  categoryFilter,
  statusFilter,
}) => {
  const { theme: whitelabelTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || '');
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || '');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

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

  // Fetch product categories for filtering
  const fetchCategories = async () => {
    try {
      if (companyId) {
        const response = await productService.getCategories(companyId);
        setCategories(response.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      // Don't set error state here to avoid blocking the main products fetch
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await productService.getProducts({
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        search: searchTerm,
      });

      setProducts(response.products || []); // Updated to use `response.products`
      setTotalCount(response.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [companyId]);

  useEffect(() => {
    fetchProducts();
  }, [page, rowsPerPage, selectedCategory, selectedStatus, companyId]);

  const handleSearch = () => {
    setPage(0); // Reset to first page when searching
    fetchProducts();
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCategoryChange = (e: SelectChangeEvent) => {
    setSelectedCategory(e.target.value as string);
    setPage(0);
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    setSelectedStatus(e.target.value as string);
    setPage(0);
  };

  const getStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    switch (status.toLowerCase()) {
      case 'active':
        color = 'success';
        break;
      case 'inactive':
        color = 'default';
        break;
      case 'out_of_stock':
        color = 'error';
        break;
      case 'discontinued':
        color = 'warning';
        break;
    }
    
    return <Chip 
      label={status.replace('_', ' ')} 
      color={color} 
      size="small" 
      sx={{ textTransform: 'capitalize' }}
    />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Define columns for the products table
  const columns: Column[] = [
    { 
      id: 'name', 
      label: 'Product Name', 
      minWidth: 200
    },
    { 
      id: 'sku', 
      label: 'SKU', 
      minWidth: 120
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 150,
      format: (value) => value?.name || 'N/A'
    },
    {
      id: 'price',
      label: 'Price',
      minWidth: 100,
      align: 'right',
      format: (value) => formatCurrency(value)
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => getStatusChip(value)
    }
  ];

  return (
    <Box sx={{ maxHeight }}>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
        <Typography variant="h6" component="h2">
          Products
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
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
                  <Button size="small" onClick={() => {
                    setSearchTerm('');
                    if (!searchTerm) return;
                    // Only trigger a new search if there was a previous search term
                    setTimeout(() => handleSearch(), 0);
                  }}>
                    Clear
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={selectedCategory}
              onChange={handleCategoryChange}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }} size="small">
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={selectedStatus}
              onChange={handleStatusChange}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
              <MenuItem value="discontinued">Discontinued</MenuItem>
            </Select>
          </FormControl>
          
          {!hideActions && onAddProduct && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddProduct}
              sx={buttonStyle}
            >
              Add Product
            </Button>
          )}
        </Box>
      </Box>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        error={error}
        onRowClick={(row) => onEditProduct && onEditProduct(row.id)}
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

export default ProductList;