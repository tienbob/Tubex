import React, { useState, useEffect } from 'react';
import { 
  Box, 
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
import { useTheme } from '../../../contexts/ThemeContext';
import { productService } from '../../../services/api';
import WhiteLabelButton from '../WhiteLabelButton';
import DataTable from '../DataTable';
import { useAccessControl } from '../../../hooks/useAccessControl';

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
  const { canPerform } = useAccessControl();

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

  // Define the columns for the data table
  const tableColumns = [
    {
      id: 'name',
      label: 'Product Name',
      type: 'text' as const,
      sortable: true,
      filterable: true,
    },
    {
      id: 'sku',
      label: 'SKU',
      type: 'text' as const,
      sortable: true,
    },
    {
      id: 'category',
      label: 'Category',
      type: 'text' as const,
      sortable: true,
      filterable: true,
      render: (value: any, row: any) => row.category?.name || 'Uncategorized',
    },
    {
      id: 'base_price',
      label: 'Price',
      type: 'currency' as const,
      sortable: true,
      align: 'right' as const,
    },
    {
      id: 'inventory',
      label: 'Stock',
      type: 'number' as const,
      sortable: true,
      align: 'right' as const,
      render: (value: any, row: any) => row.inventory?.quantity || 0,
    },
    {
      id: 'status',
      label: 'Status',
      type: 'status' as const,
      sortable: true,
      filterable: true,
      render: (value: string) =>  getStatusChip(value),
    },
  ];
  // Row actions similar to Odoo's action menu
  const rowActions = [
    {
      id: 'edit',
      label: 'Edit',
      onClick: (row: any) => onEditProduct && onEditProduct(row.id),
      disabled: !canPerform('product:edit'),
    },
    {
      id: 'view',
      label: 'View Details',
      onClick: (row: any) => onEditProduct && onEditProduct(row.id),
      disabled: !canPerform('product:view'),
    },
    {
      id: 'divider1',
      label: '',
      onClick: () => {},
      divider: true,
    },
    {
      id: 'deactivate',
      label: 'Change Status',
      onClick: (row: any) => {
        // Handle status change
        const newStatus = row.status === 'active' ? 'inactive' : 'active';
        productService.updateProduct(row.id, { status: newStatus })
          .then(() => {
            fetchProducts();
          })
          .catch(err => {
            console.error('Failed to update product status', err);
            setError('Failed to update product status');
          });
      },
      disabled: !canPerform('product:edit'),
    },
  ].filter(action => !action.disabled || action.divider); // Filter out disabled actions except dividers
  // Bulk actions like in Odoo
  const bulkActions = [
    {
      id: 'activate',
      label: 'Activate',
      onClick: (selectedRows: any[]) => {
        // Handle bulk activate
        console.log('Bulk activate', selectedRows);
      },
      disabled: !canPerform('product:edit'),
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      onClick: (selectedRows: any[]) => {
        // Handle bulk deactivate
        console.log('Bulk deactivate', selectedRows);
      },
      disabled: !canPerform('product:edit'),
    },
  ].filter(action => !action.disabled); // Filter out disabled actions

  // Filter panel in Odoo style
  const filterPanel = (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleSearchKeyPress}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ flexGrow: 1, minWidth: '200px' }}
      />
      
      <FormControl sx={{ minWidth: 150 }} size="small">
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
    </Box>
  );

  return (
    <Box>
      {/* Page header with title and actions */}      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Products</Typography>
        {!hideActions && onAddProduct && canPerform('product:create') && (
          <WhiteLabelButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddProduct}
          >
            Add Product
          </WhiteLabelButton>
        )}
      </Box>

      {/* Filter panel */}
      <Box sx={{ mb: 2 }}>
        {filterPanel}
      </Box>

      <DataTable
        columns={tableColumns.map(col => ({
          id: col.id,
          label: col.label,
          align: col.align,
          minWidth: col.id === 'name' ? 200 : undefined,
          format: col.render || undefined
        }))}
        data={products}
        loading={loading}
        error={error}
        emptyMessage="No products found"
        onRowClick={(row) => onEditProduct && onEditProduct(row.id)}
        pagination={totalCount > 0 ? {
          page,
          totalCount,
          rowsPerPage,
          onPageChange: (newPage) => setPage(newPage),
          onRowsPerPageChange: (newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setPage(0);
          }
        } : undefined}
      />
    </Box>
  );
};

export default ProductList;