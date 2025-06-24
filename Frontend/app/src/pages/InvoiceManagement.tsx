import React from 'react';
import { Box, Container } from '@mui/material';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { InvoiceList, InvoiceDetail, InvoiceForm } from '../components/invoices';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import { Invoice } from '../services/api/invoiceService';

// Detail View Component
const InvoiceDetailView: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  
  const handleEdit = () => {
    navigate(`/invoices/${invoiceId}/edit`);
  };
  
  return (
    <InvoiceDetail 
      invoiceId={invoiceId!} 
      onEdit={handleEdit} 
    />
  );
};

// Edit View Component
const InvoiceEditView: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  
  const handleSave = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };
  
  const handleCancel = () => {
    navigate(`/invoices/${invoiceId}`);
  };
  
  return (
    <InvoiceForm 
      invoiceId={invoiceId} 
      onSave={handleSave} 
      onCancel={handleCancel} 
    />
  );
};

// Create View Component
const InvoiceCreateView: React.FC = () => {
  const navigate = useNavigate();
  
  const handleSave = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };
  
  const handleCancel = () => {
    navigate('/invoices');
  };
  
  return (
    <InvoiceForm 
      onSave={handleSave} 
      onCancel={handleCancel} 
    />
  );
};

const InvoiceManagement: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs />
      </Box>
      <Routes>
        <Route path="/" element={<InvoiceList />} />
        <Route path="/create" element={<InvoiceCreateView />} />
        <Route path="/:invoiceId" element={<InvoiceDetailView />} />
        <Route path="/:invoiceId/edit" element={<InvoiceEditView />} />
      </Routes>
    </Container>
  );
};

export default InvoiceManagement;
