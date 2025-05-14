import React from 'react';
import { useMockableData } from '../../hooks/useMockableData'; 
import { useMockData } from '../../contexts/MockDataContext';
import { CircularProgress, Box, Typography, Card, CardContent, Chip } from '@mui/material';

// Define the type for a product
interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  status: string;
  sku: string;
}

// Example component that uses mock data
const ProductListExample: React.FC = () => {
  const { mockData } = useMockData();
  
  // This function would normally call your actual API
  const fetchProducts = async () => {
    // In a real scenario, this would be an API call to your backend
    const response = await fetch('/api/products');
    const data = await response.json();
    return data;
  };
  
  // This function selects the appropriate mock data
  const selectMockProducts = () => {
    // Return the relevant section of your mock data
    return {
      status: 'success',
      data: {
        products: mockData.products.products.slice(0, 10),
        pagination: {
          total: mockData.products.products.length,
          page: 1,
          limit: 10,
          pages: Math.ceil(mockData.products.products.length / 10)
        }
      }
    };
  };
  
  // Use the mockable data hook
  const { data, loading, error } = useMockableData(
    fetchProducts, 
    selectMockProducts,
    []
  );
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ my: 4, p: 2, bgcolor: '#ffebee', borderRadius: 1 }}>
        <Typography color="error">Error loading products: {error.message}</Typography>
        <Typography variant="caption">Using mock data as fallback</Typography>
      </Box>
    );
  }
  
  // Render the product list with the data (either real or mock)
  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h5" gutterBottom>
        Product List Example (Using {data?.status === 'success' ? 'Mock' : 'Real'} Data)
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {data?.data?.products?.map((product: Product) => (
          <Box key={product.id} sx={{ flex: '1 1 calc(33.333% - 16px)', boxSizing: 'border-box' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom noWrap>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {product.description.substring(0, 100)}...
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ${(product.base_price / 100).toFixed(2)}
                  </Typography>
                  <Chip 
                    label={product.status} 
                    color={
                      product.status === 'active' ? 'success' : 
                      product.status === 'inactive' ? 'default' : 'error'
                    }
                    size="small"
                  />
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  SKU: {product.sku}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">
          Showing {data?.data?.products?.length || 0} of {data?.data?.pagination?.total || 0} products
        </Typography>
        <Typography variant="subtitle2">
          Page {data?.data?.pagination?.page || 1} of {data?.data?.pagination?.pages || 1}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProductListExample;
