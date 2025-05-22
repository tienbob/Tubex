import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Chip, 
  Button, 
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  getInvoiceById, 
  generateInvoicePdf, 
  sendInvoiceByEmail,
  markInvoiceAsPaid,
  InvoiceStatus, 
  type Invoice
} from '../../../services/api/invoiceService';

interface InvoiceDetailProps {
  invoiceId: string;
  onEdit?: () => void;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoiceId, onEdit }) => {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoiceId]);

  const fetchInvoiceDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInvoiceById(invoiceId);
      setInvoice(response);
      
      // Pre-fill email fields
      if (response) {
        setEmailRecipient(''); // This should ideally be filled with customer email from the backend
        setEmailSubject(`Invoice ${response.invoiceNumber} from Your Company`);
        setEmailMessage(`Dear Customer,\n\nPlease find attached invoice ${response.invoiceNumber} for your recent order.\n\nThank you for your business.\n\nBest regards,\nYour Company`);
        
        // Pre-fill payment amount
        if (response.total) {
          setPaymentAmount(response.total.toString());
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch invoice details');
      console.error('Error fetching invoice details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleEmailDialogOpen = () => {
    setEmailDialogOpen(true);
    handleActionMenuClose();
  };

  const handleEmailDialogClose = () => {
    setEmailDialogOpen(false);
    setEmailError(null);
  };

  const handlePaymentDialogOpen = () => {
    setPaymentDialogOpen(true);
    handleActionMenuClose();
  };

  const handlePaymentDialogClose = () => {
    setPaymentDialogOpen(false);
    setPaymentError(null);
  };

  const handleSendEmail = async () => {
    if (!emailRecipient) {
      setEmailError('Recipient email is required');
      return;
    }

    setSendingEmail(true);
    setEmailError(null);

    try {
      await sendInvoiceByEmail(invoiceId, {
        recipientEmail: emailRecipient,
        subject: emailSubject,
        message: emailMessage,
      });
      handleEmailDialogClose();
      // Show success message or notification
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send email');
      console.error('Error sending invoice email:', err);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      setPaymentError('Amount and payment method are required');
      return;
    }

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      await markInvoiceAsPaid(invoiceId, {
        amount: parseFloat(paymentAmount),
        paymentDate,
        paymentMethod,
        notes: paymentNotes
      });
      handlePaymentDialogClose();
      fetchInvoiceDetails(); // Refresh invoice data
      // Show success message or notification
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
      console.error('Error recording payment:', err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const pdfBlob = await generateInvoicePdf(invoiceId);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice?.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      // Show error message
    }
  };

  const handlePrint = async () => {
    try {
      const pdfBlob = await generateInvoicePdf(invoiceId);
      const url = URL.createObjectURL(pdfBlob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
      };
      
      // Cleanup after print dialog closes (this is approximate)
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 5000);
    } catch (err: any) {
      console.error('Error printing invoice:', err);
      // Show error message
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigate(`/invoices/${invoiceId}/edit`);
    }
    handleActionMenuClose();
  };

  const handleBack = () => {
    navigate('/invoices');
  };

  const getStatusChipColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.OVERDUE:
        return 'error';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'info';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMMM dd, yyyy');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button onClick={fetchInvoiceDetails} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6">
          Invoice not found
        </Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Invoices
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Sticky Header */}
      <Box position="sticky" top={0} zIndex={10} bgcolor="background.paper" boxShadow={1} mb={3} px={2} py={2} borderRadius={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Button variant="outlined" onClick={handleBack} sx={{ mr: 2 }}>
              Back
            </Button>
            <Typography variant="h5" component="span">
              Invoice #{invoice.invoiceNumber}
            </Typography>
            <Chip 
              label={invoice.status ? invoice.status.replace('_', ' ').toUpperCase() : 'DRAFT'} 
              size="small" 
              color={getStatusChipColor(invoice.status as InvoiceStatus)}
              sx={{ ml: 2, verticalAlign: 'middle' }}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPdf}
            >
              Download
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <IconButton onClick={handleActionMenuOpen} sx={{ ml: 1 }}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={actionMenuAnchor}
              open={Boolean(actionMenuAnchor)}
              onClose={handleActionMenuClose}
            >
              <MenuItem onClick={handleEdit}>Edit Invoice</MenuItem>
              <MenuItem onClick={handleEmailDialogOpen}>
                <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                Send by Email
              </MenuItem>
              {invoice.status !== InvoiceStatus.PAID && (
                <MenuItem onClick={handlePaymentDialogOpen}>
                  <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                  Record Payment
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Box>
      </Box>

      <Paper sx={{ p: { xs: 2, md: 4 }, mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Header Info */}
          <Box sx={{ width: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: 1, bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
                Invoice Information
              </Typography>
              <Box>
                <Typography variant="body2">
                  <strong>Invoice Number:</strong> {invoice.invoiceNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Issue Date:</strong> {formatDate(invoice.issueDate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Term:</strong> {invoice.paymentTerm.replace('_', ' ')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
                Customer Information
              </Typography>
              <Box>
                <Typography variant="body2">
                  <strong>Customer ID:</strong> {invoice.customerId}
                </Typography>
                <Typography variant="body2">
                  <strong>Billing Address:</strong>
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {invoice.billingAddress}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Invoice Items */}
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 1 }}>
              Invoice Items
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, boxShadow: 0 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Quantity</strong></TableCell>
                    <TableCell align="right"><strong>Unit Price</strong></TableCell>
                    <TableCell align="right"><strong>Discount</strong></TableCell>
                    <TableCell align="right"><strong>Tax</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.map((item, index) => {
                    const itemTotal = item.quantity * item.unitPrice;
                    const discountAmount = item.discount || 0;
                    const taxAmount = item.tax || 0;
                    const lineTotal = itemTotal - discountAmount + taxAmount;
                    return (
                      <TableRow key={index} hover sx={{ transition: 'background 0.2s', cursor: 'pointer' }}>
                        <TableCell>{item.description || `Product ID: ${item.productId}`}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{item.discount ? formatCurrency(item.discount) : '-'}</TableCell>
                        <TableCell align="right">{item.tax ? formatCurrency(item.tax) : '-'}</TableCell>
                        <TableCell align="right">{formatCurrency(lineTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Totals */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Box sx={{ width: { xs: '100%', sm: '320px' }, bgcolor: 'grey.100', p: 2, borderRadius: 2, boxShadow: 0 }}>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(invoice.subtotal || 0)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2">{formatCurrency(invoice.discountTotal || 0)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Tax:</Typography>
                    <Typography variant="body2">{formatCurrency(invoice.taxTotal || 0)}</Typography>
                  </Box>
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={700}><strong>Total:</strong></Typography>
                    <Typography variant="subtitle1" fontWeight={700}><strong>{formatCurrency(invoice.total || 0)}</strong></Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>

          {/* Notes */}
          {invoice.notes && (
            <Box sx={{ width: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: 'primary.main' }}>
                Notes
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {invoice.notes}
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={handleEmailDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Send Invoice by Email</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Send invoice #{invoice.invoiceNumber} to the customer via email.
            </Typography>
            <TextField
              label="Recipient Email"
              value={emailRecipient}
              onChange={(e) => setEmailRecipient(e.target.value)}
              fullWidth
              required
              error={!emailRecipient && !!emailError}
              helperText={!emailRecipient && emailError ? 'Recipient email is required' : ''}
              sx={{ mb: 1 }}
            />
            <TextField
              label="Email Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
            />
            <TextField
              label="Email Message"
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              multiline
              rows={6}
              fullWidth
              sx={{ mb: 1 }}
            />
            {emailError && (
              <Typography color="error">{emailError}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEmailDialogClose} disabled={sendingEmail}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            variant="contained"
            color="primary"
            disabled={sendingEmail}
            startIcon={sendingEmail ? <CircularProgress size={20} /> : <EmailIcon />}
          >
            {sendingEmail ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handlePaymentDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Record a payment for invoice #{invoice.invoiceNumber}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>
                  }}
                  error={!paymentAmount && !!paymentError}
                  sx={{ mb: 1 }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Payment Date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 1 }}
                />
              </Box>
            </Box>
            <TextField
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              fullWidth
              required
              select
              error={!paymentMethod && !!paymentError}
              sx={{ mb: 1 }}
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="check">Check</MenuItem>
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              label="Notes"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 1 }}
            />
            {paymentError && (
              <Typography color="error">{paymentError}</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePaymentDialogClose} disabled={processingPayment}>
            Cancel
          </Button>
          <Button
            onClick={handleRecordPayment}
            variant="contained"
            color="primary"
            disabled={processingPayment}
            startIcon={processingPayment ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {processingPayment ? 'Processing...' : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvoiceDetail;
