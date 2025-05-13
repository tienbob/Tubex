import React, { useState } from 'react';
import {
  Box,
  Container,
  Button,
  Typography,
  Dialog,
  DialogContent,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProductList  from '../components/whitelabel/products/ProductList';
import ProductForm from '../components/whitelabel/products/ProductForm';

const ProductManagement: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState('current-company-id'); // Replace with actual company ID from your auth context

  const handleAddProduct = () => {
    setShowAddForm(true);
    setSelectedProductId(null);
  };

  const handleEditProduct = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setSelectedProductId(null);
  };

  const handleProductSave = () => {
    // Refresh the product list after saving
    handleCloseForm();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Main content */}
      {!showAddForm && selectedProductId === null && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Products
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddProduct}
            >
              Add New Product
            </Button>
          </Box>

          <ProductList
            companyId={companyId}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
          />
        </Box>
      )}

      {/* Add/Edit Product Form */}
      {(showAddForm || selectedProductId !== null) && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseForm}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">
              {selectedProductId ? 'Edit Product' : 'Add New Product'}
            </Typography>
          </Box>

          <ProductForm
            productId={selectedProductId || undefined}
            companyId={companyId}
            onSave={handleProductSave}
            onCancel={handleCloseForm}
          />
        </Box>
      )}
    </Container>
  );
};

export default ProductManagement;