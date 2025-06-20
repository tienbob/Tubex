// QuoteManagement.tsx
import React, { useEffect, useState } from 'react';
import { getQuotes, Quote, createQuote, CreateQuoteRequest } from '../services/api/quoteService';
import { DataTable } from '../components/whitelabel';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Box, TextField } from '@mui/material';
import { useAccessControl } from '../hooks/useAccessControl';
import RoleGuard from '../components/common/RoleGuard';

const QuoteManagement: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateQuoteRequest>({ customerId: '', items: [], validUntil: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { canPerform } = useAccessControl();

  useEffect(() => {
    setLoading(true);
    getQuotes()
      .then((res) => setQuotes(res.data))
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
    if (!form.customerId || !form.validUntil) {
      setFormError('Customer ID and Valid Until are required.');
      return;
    }
    try {
      await createQuote({ ...form, items: [] }); // Items can be added in a more advanced form
      setOpen(false);
      setLoading(true);
      getQuotes()
        .then((res) => setQuotes(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } catch (err: any) {
      setFormError(err.message);
    }
  };
  return (
    <div>
      <h1>Quote Management</h1>
      <div style={{ marginBottom: 16 }}>
        <RoleGuard action="quote:create" fallback={null}>
          <Button variant="contained" color="primary" onClick={handleOpen} style={{ marginRight: 8 }}>
            Create Quote
          </Button>
        </RoleGuard>
        <Button variant="outlined" onClick={() => navigate('/invoices')} style={{ marginRight: 8 }}>
          Go to Invoices
        </Button>
        <Button variant="outlined" onClick={() => navigate('/pricelists')}>
          Go to Price Lists
        </Button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <DataTable
        columns={[
          { id: 'quoteNumber', label: 'Quote #' },
          { id: 'customerId', label: 'Customer' },
          { id: 'status', label: 'Status' },
          { id: 'total', label: 'Total' },
          { id: 'validUntil', label: 'Valid Until' },
        ]}
        data={quotes}
      />
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ p: 4, bgcolor: 'background.paper', maxWidth: 400, mx: 'auto', mt: 10, borderRadius: 2 }}>
          <h2>Create Quote</h2>
          <TextField
            label="Customer ID"
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Valid Until"
            name="validUntil"
            type="date"
            value={form.validUntil}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
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

export default QuoteManagement;
