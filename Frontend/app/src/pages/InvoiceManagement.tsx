// InvoiceManagement.tsx
import React, { useEffect, useState } from 'react';
import { getInvoices, Invoice, createInvoice, CreateInvoiceRequest, PaymentTerm } from '../services/api/invoiceService';
import { DataTable } from '../components/whitelabel';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Box, TextField, MenuItem } from '@mui/material';

const InvoiceManagement: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateInvoiceRequest>({ customerId: '', items: [], paymentTerm: PaymentTerm.IMMEDIATE, billingAddress: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getInvoices()
      .then((res) => setInvoices(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => { setOpen(false); setFormError(null); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!form.customerId || !form.paymentTerm || !form.billingAddress) {
      setFormError('Customer ID, Payment Term, and Billing Address are required.');
      return;
    }
    try {
      await createInvoice({ ...form, items: [] }); // Items can be added in a more advanced form
      setOpen(false);
      setLoading(true);
      getInvoices()
        .then((res) => setInvoices(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div>
      <h1>Invoice Management</h1>
      <div style={{ marginBottom: 16 }}>
        <Button variant="contained" color="primary" onClick={handleOpen} style={{ marginRight: 8 }}>
          Create Invoice
        </Button>
        <Button variant="outlined" onClick={() => navigate('/quotes')} style={{ marginRight: 8 }}>
          Go to Quotes
        </Button>
        <Button variant="outlined" onClick={() => navigate('/pricelists')}>
          Go to Price Lists
        </Button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <DataTable
        columns={[
          { id: 'invoiceNumber', label: 'Invoice #' },
          { id: 'customerId', label: 'Customer' },
          { id: 'status', label: 'Status' },
          { id: 'total', label: 'Total' },
          { id: 'issueDate', label: 'Issue Date' },
        ]}
        data={invoices}
      />
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ p: 4, bgcolor: 'background.paper', maxWidth: 400, mx: 'auto', mt: 10, borderRadius: 2 }}>
          <h2>Create Invoice</h2>
          <TextField
            label="Customer ID"
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Payment Term"
            name="paymentTerm"
            value={form.paymentTerm}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            {Object.values(PaymentTerm).map((term) => (
              <MenuItem key={term} value={term}>{term}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Billing Address"
            name="billingAddress"
            value={form.billingAddress}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          {/* Items can be added in a more advanced form */}
          {formError && <p style={{ color: 'red' }}>{formError}</p>}
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button onClick={handleClose} style={{ marginRight: 8 }}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleCreate}>Create</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default InvoiceManagement;
