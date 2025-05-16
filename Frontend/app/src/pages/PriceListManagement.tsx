// PriceListManagement.tsx
import React, { useEffect, useState } from 'react';
import { getPriceLists, PriceList, createPriceList, CreatePriceListRequest, PriceListType } from '../services/api/priceListService';
import { DataTable } from '../components/whitelabel';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Box, TextField, MenuItem } from '@mui/material';

const PriceListManagement: React.FC = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreatePriceListRequest>({ name: '', type: PriceListType.STANDARD, items: [] });
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getPriceLists()
      .then((res) => setPriceLists(res.data))
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
    if (!form.name || !form.type) {
      setFormError('Name and Type are required.');
      return;
    }
    try {
      await createPriceList({ ...form, items: [] }); // Items can be added in a more advanced form
      setOpen(false);
      setLoading(true);
      getPriceLists()
        .then((res) => setPriceLists(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div>
      <h1>Price List Management</h1>
      <div style={{ marginBottom: 16 }}>
        <Button variant="contained" color="primary" onClick={handleOpen} style={{ marginRight: 8 }}>
          Create Price List
        </Button>
        <Button variant="outlined" onClick={() => navigate('/quotes')} style={{ marginRight: 8 }}>
          Go to Quotes
        </Button>
        <Button variant="outlined" onClick={() => navigate('/invoices')}>
          Go to Invoices
        </Button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <DataTable
        columns={[
          { id: 'name', label: 'Name' },
          { id: 'status', label: 'Status' },
          { id: 'type', label: 'Type' },
          { id: 'startDate', label: 'Start Date' },
          { id: 'endDate', label: 'End Date' },
        ]}
        data={priceLists}
      />
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ p: 4, bgcolor: 'background.paper', maxWidth: 400, mx: 'auto', mt: 10, borderRadius: 2 }}>
          <h2>Create Price List</h2>
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            select
            label="Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            fullWidth
            margin="normal"
          >
            {Object.values(PriceListType).map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
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

export default PriceListManagement;
