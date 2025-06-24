import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProductList from '../components/products/ProductList';
import ProductForm from '../components/products/ProductForm';
import { useAuth } from '../components/auth/AuthContext';

const ProductManagement: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const location = useLocation();
  
  // Get company ID from auth context
  const { user } = useAuth();
  const [companyId, setCompanyId] = useState<string>('');
    // Set companyId from auth context when user data is available
  useEffect(() => {
    console.log('ProductManagement - user from auth context:', user);
    if (user && user.companyId) {
      console.log('ProductManagement - setting companyId:', user.companyId);
      setCompanyId(user.companyId);
    } else {
      console.log('ProductManagement - No company ID found in user data');
    }
  }, [user]);
  // Parse query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const action = queryParams.get('action');
    const id = queryParams.get('id');
    
    console.log('=== PRODUCT MANAGEMENT URL PARAMS ===');
    console.log('Current URL:', location.search);
    console.log('Action param:', action);
    console.log('ID param:', id);
    console.log('Current selectedProductId:', selectedProductId);
    console.log('Current showAddForm:', showAddForm);
    
    if (action === 'create') {
      console.log('Setting to create mode');
      setShowAddForm(true);
      setSelectedProductId(null);
    } else if (id) {
      console.log('Setting to edit mode with ID:', id);
      setSelectedProductId(id);
      setShowAddForm(false);
    } else {
      console.log('Setting to list mode');
      // Reset to list view if no params
      setShowAddForm(false);
      setSelectedProductId(null);
    }
  }, [location.search]);

  const handleAddProduct = () => {
    setShowAddForm(true);
    setSelectedProductId(null);
  };

  const handleEditProduct = (productId: string) => {
    setSelectedProductId(productId);
    setShowAddForm(false);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setSelectedProductId(null);
  };

  const handleProductSave = () => {
    // Refresh the product list after saving
    handleCloseForm();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Product List View */}
      {!showAddForm && selectedProductId === null && (
        <ProductList
          companyId={companyId}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
        />
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