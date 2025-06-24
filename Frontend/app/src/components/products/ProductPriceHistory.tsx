import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { productService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface ProductPriceHistoryProps {
  productId: string;
  productName?: string;
  currentPrice?: number;
  canUpdate?: boolean;
  onPriceUpdated?: () => void;
}

const ProductPriceHistory: React.FC<ProductPriceHistoryProps> = ({ 
  productId, 
  productName, 
  currentPrice, 
  canUpdate = false,
  onPriceUpdated
}) => {
  const { theme: whitelabelTheme } = useTheme();
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openPriceDialog, setOpenPriceDialog] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(new Date());
  const [priceError, setPriceError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPriceHistory();
  }, [productId, page]);

  const loadPriceHistory = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await productService.getPriceHistory(productId, { page, limit: 10 });
      setPriceHistory(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load price history');
      console.error('Error loading price history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handlePriceDialogOpen = () => {
    setOpenPriceDialog(true);
    setNewPrice(currentPrice ? currentPrice.toString() : '');
    setEffectiveDate(new Date());
    setPriceError('');
  };

  const handlePriceDialogClose = () => {
    setOpenPriceDialog(false);
  };

  const validatePrice = (price: string): boolean => {
    if (!price.trim()) {
      setPriceError('Price is required');
      return false;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setPriceError('Price must be a positive number');
      return false;
    }

    setPriceError('');
    return true;
  };

  const handlePriceUpdate = async () => {
    if (!validatePrice(newPrice)) return;
    
    setSubmitting(true);
    try {
      const price = parseFloat(newPrice);
      const effectiveDateStr = effectiveDate ? effectiveDate.toISOString() : new Date().toISOString();
      
      await productService.updateProductPrice(productId, price, effectiveDateStr);
      
      handlePriceDialogClose();
      loadPriceHistory();
      
      if (onPriceUpdated) {
        onPriceUpdated();
      }
    } catch (err: any) {
      setPriceError(err.message || 'Failed to update price');
      console.error('Error updating price:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Price History</Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Old Price</TableCell>
                  <TableCell>New Price</TableCell>
                  <TableCell>Effective Date</TableCell>
                  <TableCell>Updated By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceHistory.length > 0 ? (
                  priceHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatCurrency(parseFloat(item.old_price))}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(item.new_price))}</TableCell>
                      <TableCell>{formatDate(item.effective_date || item.created_at)}</TableCell>
                      <TableCell>{item.created_by || item.changed_by_id}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No price history available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}

      {/* Price Update Dialog */}
      <Dialog open={openPriceDialog} onClose={handlePriceDialogClose}>
        <DialogTitle>Update Price for {productName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth error={!!priceError} sx={{ mb: 3 }}>
              <TextField
                label="New Price"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={!!priceError}
              />
              {priceError && <FormHelperText>{priceError}</FormHelperText>}
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Effective Date"
                value={effectiveDate}
                onChange={(newDate) => setEffectiveDate(newDate)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal'
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePriceDialogClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handlePriceUpdate} 
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Update Price'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductPriceHistory;