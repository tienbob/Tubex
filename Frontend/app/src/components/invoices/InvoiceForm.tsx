import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Autocomplete,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import FormContainer from '../shared/FormContainer';
import FormButtons from '../shared/FormButtons';
import {
  createInvoice,
  updateInvoice,
  getInvoiceById,
  PaymentTerm,
  InvoiceStatus,
  type Invoice,
  type InvoiceItem,
  type CreateInvoiceRequest
} from '../../services/api/invoiceService';
import { productService } from '../../services/api';
import { useAccessControl } from '../../hooks/useAccessControl';
import RoleGuard from '../auth/RoleGuard';

interface InvoiceFormProps {
  invoiceId?: string;
  onSave?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  billingAddress?: string;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  description?: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoiceId,
  onSave,
  onCancel,
}) => {
  const isEditMode = !!invoiceId;
  const { canPerform } = useAccessControl();

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    items: [],
    paymentTerm: PaymentTerm.DAYS_30,
    billingAddress: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch invoice details if in edit mode
  useEffect(() => {
    if (isEditMode && invoiceId) {
      fetchInvoiceDetails(invoiceId);
    }
  }, [invoiceId, isEditMode]);

  // Calculate totals whenever items change
  useEffect(() => {
    calculateTotals();
  }, [invoice.items]);

  const fetchData = async () => {
    setFetchLoading(true);
    try {
      // Fetch customers
      // This is a placeholder - replace with actual API call
      // const customersResponse = await customerService.getCustomers();
      // setCustomers(customersResponse.data);
      
      // Mock customers for now
      setCustomers([
        { id: 'cust1', name: 'Acme Corp', email: 'billing@acmecorp.com', billingAddress: '123 Main St\nNew York, NY 10001\nUSA' },
        { id: 'cust2', name: 'Globex Industries', email: 'accounts@globex.com', billingAddress: '456 Business Ave\nChicago, IL 60601\nUSA' },
        { id: 'cust3', name: 'Umbrella Corporation', email: 'finance@umbrella.com', billingAddress: '789 Corporate Blvd\nLos Angeles, CA 90001\nUSA' },
      ]);

      // Fetch products
      const productsResponse = await productService.getProducts();
      const productOptions = productsResponse.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.base_price || 0,
        description: product.description || '',
      }));
      setProducts(productOptions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchInvoiceDetails = async (id: string) => {
    setFetchLoading(true);
    try {
      const response = await getInvoiceById(id);
      setInvoice(response);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!invoice.items || invoice.items.length === 0) {
      setInvoice(prev => ({
        ...prev,
        subtotal: 0,
        discountTotal: 0,
        taxTotal: 0,
        total: 0,
      }));
      return;
    }

    setIsCalculating(true);
    
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    invoice.items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      
      if (item.discount) {
        discountTotal += item.discount;
      }
      
      if (item.tax) {
        taxTotal += item.tax;
      }
    });

    const total = subtotal - discountTotal + taxTotal;

    setInvoice(prev => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountTotal: parseFloat(discountTotal.toFixed(2)),
      taxTotal: parseFloat(taxTotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    }));

    setIsCalculating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;

    setInvoice(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for the field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setIsDirty(true);
  };

  const handleSelectChange = (name: string, value: unknown) => {
    setInvoice(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for the field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setIsDirty(true);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    if (customer) {
      setInvoice(prev => ({
        ...prev,
        customerId: customer.id,
        billingAddress: customer.billingAddress || ''
      }));

      // Clear errors
      if (errors.customerId || errors.billingAddress) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.customerId;
          delete newErrors.billingAddress;
          return newErrors;
        });
      }
    } else {
      setInvoice(prev => ({
        ...prev,
        customerId: '',
        billingAddress: ''
      }));
    }

    setIsDirty(true);
  };

  const handleAddItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          productId: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
        }
      ]
    }));

    setIsDirty(true);
  };

  const handleRemoveItem = (index: number) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index) || []
    }));

    setIsDirty(true);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => {
      const updatedItems = [...(prev.items || [])];
      if (updatedItems[index]) {
        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value
        };
      }
      return {
        ...prev,
        items: updatedItems
      };
    });

    // Clear item error
    const errorKey = `items[${index}].${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    setIsDirty(true);
  };

  const handleProductSelect = (index: number, product: ProductOption | null) => {
    if (product) {
      setInvoice(prev => {
        const updatedItems = [...(prev.items || [])];
        if (updatedItems[index]) {
          updatedItems[index] = {
            ...updatedItems[index],
            productId: product.id,
            description: product.description || product.name,
            unitPrice: product.price
          };
        }
        return {
          ...prev,
          items: updatedItems
        };
      });
    }

    setIsDirty(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!invoice.customerId) {
      newErrors.customerId = 'Customer is required';
    }

    if (!invoice.billingAddress || invoice.billingAddress.trim() === '') {
      newErrors.billingAddress = 'Billing address is required';
    }

    if (!invoice.paymentTerm) {
      newErrors.paymentTerm = 'Payment term is required';
    }

    // Validate items
    if (!invoice.items || invoice.items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      invoice.items.forEach((item, index) => {
        if (!item.productId) {
          newErrors[`items[${index}].productId`] = 'Product is required';
        }
        if (item.quantity <= 0) {
          newErrors[`items[${index}].quantity`] = 'Quantity must be greater than 0';
        }
        if (item.unitPrice < 0) {
          newErrors[`items[${index}].unitPrice`] = 'Unit price cannot be negative';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let savedInvoice;
      
      if (isEditMode && invoiceId) {
        // Update existing invoice
        const updateData: Partial<Invoice> = {
          customerId: invoice.customerId!,
          items: invoice.items!,
          paymentTerm: invoice.paymentTerm!,
          billingAddress: invoice.billingAddress!,
          notes: invoice.notes,
          issueDate: invoice.issueDate,
        };
        
        const response = await updateInvoice(invoiceId, updateData);
        savedInvoice = response;
      } else {
        // Create new invoice
        const newInvoice: CreateInvoiceRequest = {
          customerId: invoice.customerId!,
          items: invoice.items!,
          paymentTerm: invoice.paymentTerm!,
          billingAddress: invoice.billingAddress!,
          notes: invoice.notes,
          issueDate: invoice.issueDate,
        };
        
        const response = await createInvoice(newInvoice);
        savedInvoice = response;
      }

      if (onSave) {
        onSave(savedInvoice);
      }
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving invoice:', error);
      // Handle error, show notification, etc.
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Find current customer
  const currentCustomer = customers.find(c => c.id === invoice.customerId);

  if (fetchLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <FormContainer title={isEditMode ? 'Edit Invoice' : 'Create Invoice'} maxWidth="md">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Customer Information and Invoice Details Row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Customer Selection */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Customer Information
              </Typography>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name}
                value={currentCustomer || null}
                onChange={(_, newValue) => handleCustomerSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    required
                    error={!!errors.customerId}
                    helperText={errors.customerId}
                  />
                )}
                fullWidth
              />
            </Box>

            {/* Invoice Details */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Invoice Details
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Issue Date"
                    name="issueDate"
                    type="date"
                    value={invoice.issueDate || format(new Date(), 'yyyy-MM-dd')}
                    onChange={handleChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FormControl fullWidth required error={!!errors.paymentTerm}>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      name="paymentTerm"
                      value={invoice.paymentTerm || PaymentTerm.DAYS_30}
                      onChange={(e) => handleSelectChange('paymentTerm', e.target.value)}
                      label="Payment Terms"
                    >
                      <MenuItem value={PaymentTerm.IMMEDIATE}>Immediate</MenuItem>
                      <MenuItem value={PaymentTerm.DAYS_7}>Net 7 Days</MenuItem>
                      <MenuItem value={PaymentTerm.DAYS_15}>Net 15 Days</MenuItem>
                      <MenuItem value={PaymentTerm.DAYS_30}>Net 30 Days</MenuItem>
                      <MenuItem value={PaymentTerm.DAYS_45}>Net 45 Days</MenuItem>
                      <MenuItem value={PaymentTerm.DAYS_60}>Net 60 Days</MenuItem>
                      <MenuItem value={PaymentTerm.DAYS_90}>Net 90 Days</MenuItem>
                    </Select>
                    {errors.paymentTerm && <FormHelperText>{errors.paymentTerm}</FormHelperText>}
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Billing Address */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Billing Address
            </Typography>
            <TextField
              name="billingAddress"
              label="Billing Address"
              value={invoice.billingAddress || ''}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              required
              error={!!errors.billingAddress}
              helperText={errors.billingAddress}
            />
          </Box>

          {/* Invoice Items */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>              <Typography variant="subtitle1">
                Invoice Items
              </Typography>
              <RoleGuard 
                action={isEditMode ? 'invoice:edit' : 'invoice:create'}
                fallback={
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    disabled={true}
                    title={isEditMode 
                      ? "You don't have permission to edit invoices"
                      : "You don't have permission to create invoices"
                    }
                  >
                    Add Item
                  </Button>
                }
                showFallback
              >
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                >
                  Add Item
                </Button>
              </RoleGuard>
            </Box>

            {errors.items && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {errors.items}
              </Typography>
            )}

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="35%">Product</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right" width="10%">Quantity</TableCell>
                    <TableCell align="right" width="15%">Unit Price</TableCell>
                    <TableCell align="right" width="15%">Amount</TableCell>
                    <TableCell align="center" width="5%">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(invoice.items || []).map((item, index) => {
                    const lineTotal = item.quantity * item.unitPrice;
                    const hasProductError = !!errors[`items[${index}].productId`];
                    const hasQuantityError = !!errors[`items[${index}].quantity`];
                    const hasPriceError = !!errors[`items[${index}].unitPrice`];
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Autocomplete
                            options={products}
                            getOptionLabel={(option) => option.name}
                            value={products.find(p => p.id === item.productId) || null}
                            onChange={(_, newValue) => handleProductSelect(index, newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Product"
                                variant="outlined"
                                size="small"
                                required
                                error={hasProductError}
                                helperText={hasProductError ? errors[`items[${index}].productId`] : ''}
                              />
                            )}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            variant="outlined"
                            size="small"
                            inputProps={{ min: 1, style: { textAlign: 'right' } }}
                            error={hasQuantityError}
                            helperText={hasQuantityError ? errors[`items[${index}].quantity`] : ''}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            variant="outlined"
                            size="small"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              inputProps: { min: 0, step: 0.01, style: { textAlign: 'right' } }
                            }}
                            error={hasPriceError}
                            helperText={hasPriceError ? errors[`items[${index}].unitPrice`] : ''}
                          />
                        </TableCell>                        <TableCell align="right">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                        <TableCell align="center">
                          <RoleGuard action={isEditMode ? 'invoice:edit' : 'invoice:create'}>
                            <IconButton color="error" onClick={() => handleRemoveItem(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </RoleGuard>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {(!invoice.items || invoice.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          No items added yet. Click "Add Item" to add products to the invoice.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Totals */}
          <Box>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Box width="300px">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">
                      {isCalculating ? '...' : formatCurrency(invoice.subtotal || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2">
                      {isCalculating ? '...' : formatCurrency(invoice.discountTotal || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Tax:</Typography>
                    <Typography variant="body2">
                      {isCalculating ? '...' : formatCurrency(invoice.taxTotal || 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ width: '100%' }}>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1"><strong>Total:</strong></Typography>
                    <Typography variant="subtitle1">
                      <strong>{isCalculating ? '...' : formatCurrency(invoice.total || 0)}</strong>
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Notes */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Notes
            </Typography>
            <TextField
              name="notes"
              value={invoice.notes || ''}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
              placeholder="Add any notes or payment instructions here"
            />
          </Box>
        </Box>      </Paper>      <FormButtons
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        loading={loading}
        submitText={isEditMode ? 'Update Invoice' : 'Create Invoice'}
        canSubmit={isEditMode ? canPerform('invoice:edit') : canPerform('invoice:create')}
        submitDisabledReason={
          isEditMode 
            ? !canPerform('invoice:edit') ? 'You do not have permission to edit invoices' : undefined
            : !canPerform('invoice:create') ? 'You do not have permission to create invoices' : undefined
        }
      />

      <Dialog open={showConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Discard Changes?</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Are you sure you want to discard them?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirmCancel} color="error">
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>
    </FormContainer>
  );
};

export default InvoiceForm;
