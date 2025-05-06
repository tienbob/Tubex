import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../../services/api';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// Interface for products from the API
interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  unit: string;
  supplier_id: string;
  status: 'active' | 'inactive';
  supplier?: {
    id: string;
    name: string;
  };
}

const ProductList: React.FC = () => {
  // State for products and pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productService.getProducts({
        page: page + 1, // API pagination starts from 1
        limit: rowsPerPage,
        status: filterStatus || undefined,
        supplier_id: supplierId || undefined
      });
      
      setProducts(response.products);
      setTotalCount(response.pagination.total);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filterStatus, supplierId]);

  // Fetch data when pagination, filters or search change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle page change
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Format price with currency
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Products Catalog
      </Typography>

      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box component="form" onSubmit={handleSearch}>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap">
            <Box sx={{ width: { xs: '100%', sm: '30%', md: '24%' } }}>
              <TextField
                fullWidth
                label="Search Products"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '30%', md: '22%' } }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '30%', md: '22%' } }}>
              <FormControl fullWidth size="small">
                <InputLabel id="supplier-filter-label">Supplier</InputLabel>
                <Select
                  labelId="supplier-filter-label"
                  id="supplier-filter"
                  value={supplierId}
                  label="Supplier"
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <MenuItem value="">All Suppliers</MenuItem>
                  {/* In a real app, you would fetch suppliers from the API */}
                  <MenuItem value="supplier-1">Supplier 1</MenuItem>
                  <MenuItem value="supplier-2">Supplier 2</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: '10%', md: '18%' } }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<SearchIcon />}
                sx={{ height: '100%', minHeight: '40px' }}
              >
                Search
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {product.description.length > 100
                          ? `${product.description.substring(0, 100)}...`
                          : product.description}
                      </TableCell>
                      <TableCell>{formatPrice(product.base_price)}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>{product.supplier?.name || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={product.status}
                          color={product.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default ProductList;