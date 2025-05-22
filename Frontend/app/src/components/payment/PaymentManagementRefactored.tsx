import React, { useEffect, useCallback } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  TablePagination,
  useTheme as useMuiTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { usePayment } from '../../hooks/usePayment';
import { useCustomer } from '../../hooks/useCustomer';
import { Payment, PaymentMethod, PaymentType, ReconciliationStatus } from '../../services/api/paymentService';
import { Customer } from '../../services/api/customerService';
import CreatePaymentModal from './CreatePaymentModal';
import UpdatePaymentModal from './UpdatePaymentModal';
import ReconcilePaymentModal from './ReconcilePaymentModal';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import useTableData from '../../hooks/useTableData';

const PaymentManagement: React.FC = () => {
  const { theme: whitelabelTheme } = useTheme();
  const { 
    loading: apiLoading, 
    error: apiError, 
    getPayments, 
    deletePayment 
  } = usePayment();
  const {
    getCustomersByIds,
    searchCustomers
  } = useCustomer();
  const { enqueueSnackbar } = useSnackbar();

  // Use our custom hook for table data management
  const {
    data: payments,
    loading,
    error,
    page,
    rowsPerPage,
    totalCount,
    sortBy,
    sortDirection,
    searchQuery,
    filters,
    handlePageChange,
    handleRowsPerPageChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleSearchQueryChange,
    handleFilterChange,
    resetFilters,
    fetchData,
    dispatch
  } = useTableData<Payment>({
    defaultSortBy: 'created_at',
    defaultSortDirection: 'desc',
    defaultRowsPerPage: 10,
    defaultFilters: {}
  });

  // Additional state for UI components
  const [customerMap, setCustomerMap] = React.useState<Record<string, Customer>>({});
  const [customerOptions, setCustomerOptions] = React.useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = React.useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  // Define the fetch function to pass to useTableData
  const fetchPayments = useCallback(async (params: any) => {
    try {
      // Convert params for the API
      const apiParams = {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy,
        sortDirection: params.sortDirection,
        search: params.search,
        startDate: params.startDate ? format(new Date(params.startDate), 'yyyy-MM-dd') : undefined,
        endDate: params.endDate ? format(new Date(params.endDate), 'yyyy-MM-dd') : undefined,
        paymentMethod: params.paymentMethod,
        status: params.status,
        customerId: params.customerId,
        orderId: params.orderId,
        invoiceId: params.invoiceId
      };

      const response = await getPayments(apiParams);
      if (!response) {
        return { data: [], totalCount: 0 };
      }
      
      const paymentsList = Array.isArray(response.data) ? response.data : [];
      const totalItems = response.pagination?.totalItems || paymentsList.length;

      // Get all unique customer IDs
      const customerIds = Array.from(new Set(
        paymentsList
          .filter(payment => payment.customerId)
          .map(payment => payment.customerId)
      )) as string[];

      // Fetch customer details if needed
      if (customerIds.length > 0) {
        try {
          const customersResponse = await getCustomersByIds(customerIds);
          if (customersResponse && Array.isArray(customersResponse.data)) {
            const newCustomerMap = customersResponse.data.reduce((acc, customer) => {
              acc[customer.id] = customer;
              return acc;
            }, {} as Record<string, Customer>);
            
            setCustomerMap(prevMap => ({ ...prevMap, ...newCustomerMap }));
          }
        } catch (error) {
          console.error('Failed to fetch customer details:', error);
        }
      }

      return {
        data: paymentsList,
        totalCount: totalItems
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }, [getPayments, getCustomersByIds]);

  // Initialize the data
  useEffect(() => {
    fetchData(fetchPayments);
    
    // Initialize customer filter options
    searchCustomers({ limit: 10 }).then(result => {
      if (result && result.data.length > 0) {
        setCustomerOptions(result.data);
        const initialCustomers = result.data.reduce((acc, customer) => {
          acc[customer.id] = customer;
          return acc;
        }, {} as Record<string, Customer>);
        setCustomerMap(prevMap => ({ ...prevMap, ...initialCustomers }));
      }
    }).catch(error => console.error('Failed to load initial customers', error));
  }, [fetchData, searchCustomers]);

  // Customer search handler
  const handleCustomerSearch = useCallback(async (searchValue: string) => {
    if (!searchValue) {
      setCustomerOptions([]);
      return;
    }

    try {
      const result = await searchCustomers({ search: searchValue, limit: 10 });
      if (result && result.data) {
        setCustomerOptions(result.data);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  }, [searchCustomers]);

  // Filter handlers
  const handleDateChange = useCallback((key: string, value: Date | null) => {
    handleFilterChange(key, value);
  }, [handleFilterChange]);

  const handlePaymentMethodChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    handleFilterChange('paymentMethod', event.target.value as string);
  }, [handleFilterChange]);

  const handleStatusChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    handleFilterChange('status', event.target.value as string);
  }, [handleFilterChange]);

  const handleCustomerChange = useCallback((event: React.ChangeEvent<{ value: unknown }>) => {
    const customerId = event.target.value as string;
    handleFilterChange('customerId', customerId);
    setCustomerSearchTerm('');
  }, [handleFilterChange]);

  // Action handlers
  const handleCreatePayment = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleUpdatePayment = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setIsUpdateModalOpen(true);
  }, []);

  const handleReconcilePayment = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setIsReconcileModalOpen(true);
  }, []);

  const handleDeletePaymentClick = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeletePayment = useCallback(async () => {
    if (!selectedPayment) return;
    
    try {
      await deletePayment(selectedPayment.id);
      
      enqueueSnackbar('Payment deleted successfully', { variant: 'success' });
      
      // Refresh the data
      fetchData(fetchPayments);
    } catch (error) {
      console.error('Error deleting payment:', error);
      enqueueSnackbar('Failed to delete payment', { variant: 'error' });
    } finally {
      setIsDeleteConfirmOpen(false);
      setSelectedPayment(null);
    }
  }, [selectedPayment, deletePayment, enqueueSnackbar, fetchData, fetchPayments]);
  // Render payment method chip
  const renderPaymentMethodChip = (method: PaymentMethod) => {
    const methodConfigs: Record<string, { label: string, color: string }> = {
      [PaymentMethod.CREDIT_CARD]: { label: 'Credit Card', color: 'primary' },
      [PaymentMethod.BANK_TRANSFER]: { label: 'Bank Transfer', color: 'secondary' },
      [PaymentMethod.CASH]: { label: 'Cash', color: 'default' },
      [PaymentMethod.CHECK]: { label: 'Check', color: 'default' },
      [PaymentMethod.PAYPAL]: { label: 'PayPal', color: 'info' },
      [PaymentMethod.OTHER]: { label: 'Other', color: 'default' },
    };
    
    const methodConfig = methodConfigs[method] || { label: method, color: 'default' };

    return (
      <Chip 
        label={methodConfig.label} 
        color={methodConfig.color as any}
        size="small"
      />
    );
  };
  // Render payment status chip
  const renderStatusChip = (status: ReconciliationStatus) => {
    const statusConfigs: Record<string, { label: string, color: string }> = {
      [ReconciliationStatus.PENDING]: { label: 'Pending', color: 'warning' },
      [ReconciliationStatus.RECONCILED]: { label: 'Reconciled', color: 'success' },
      [ReconciliationStatus.FAILED]: { label: 'Failed', color: 'error' },
      [ReconciliationStatus.PARTIAL]: { label: 'Partial', color: 'info' },
    };
    
    const statusConfig = statusConfigs[status] || { label: status, color: 'default' };

    return (
      <Chip 
        label={statusConfig.label} 
        color={statusConfig.color as any}
        size="small"
      />
    );
  };

  // Get customer name from the map
  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'N/A';
    return customerMap[customerId]?.name || 'Unknown Customer';
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Payments</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => fetchData(fetchPayments)}
            size="small"
          >
            Refresh
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreatePayment}
          >
            New Payment
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {/* Search field */}
          <TextField
            placeholder="Search payments..."
            size="small"
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 220 }}
          />
          
          {/* Date range filters */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              value={filters.startDate || null}
              onChange={(date) => handleDateChange('startDate', date)}
              slotProps={{ textField: { size: 'small' } }}
              format="MM/dd/yyyy"
            />
            
            <DatePicker
              label="To Date"
              value={filters.endDate || null}
              onChange={(date) => handleDateChange('endDate', date)}
              slotProps={{ textField: { size: 'small' } }}
              format="MM/dd/yyyy"
            />
          </LocalizationProvider>
            {/* Payment method filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="payment-method-filter-label">Payment Method</InputLabel>
            <Select
              labelId="payment-method-filter-label"
              value={filters.paymentMethod || ''}
              onChange={handlePaymentMethodChange as any}
              label="Payment Method"
            >
              <MenuItem value="">All Methods</MenuItem>
              {Object.values(PaymentMethod).filter(v => typeof v === 'string').map((method) => (
                <MenuItem key={method as string} value={method as string}>
                  {(method as string).replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={filters.status || ''}
              onChange={handleStatusChange as any}
              label="Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.values(ReconciliationStatus).filter(v => typeof v === 'string').map((status) => (
                <MenuItem key={status as string} value={status as string}>
                  {(status as string).replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Customer filter */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="customer-filter-label">Customer</InputLabel>
            <Select
              labelId="customer-filter-label"
              value={filters.customerId || ''}
              onChange={handleCustomerChange as any}
              label="Customer"
            >
              <MenuItem value="">All Customers</MenuItem>
              {customerOptions.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Reset filters button */}
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon />}
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        </Box>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ))
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No payments found</TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} hover>                  <TableCell>{payment.referenceNumber || payment.id.substring(0, 8)}</TableCell>
                  <TableCell>{getCustomerName(payment.customerId)}</TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{renderPaymentMethodChip(payment.paymentMethod)}</TableCell>
                  <TableCell>{renderStatusChip(payment.reconciliationStatus)}</TableCell>
                  <TableCell>
                    {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {payment.reconciliationStatus !== ReconciliationStatus.RECONCILED && (
                        <Tooltip title="Reconcile Payment">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleReconcilePayment(payment)}
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="Edit Payment">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleUpdatePayment(payment)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete Payment">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeletePaymentClick(payment)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => handlePageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => handleRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
      
      {/* Create Payment Modal */}
      <CreatePaymentModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPaymentCreated={() => {
          setIsCreateModalOpen(false);
          fetchData(fetchPayments);
        }}
      />
      
      {/* Update Payment Modal */}
      {selectedPayment && (
        <UpdatePaymentModal
          open={isUpdateModalOpen}
          payment={selectedPayment}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedPayment(null);
          }}
          onPaymentUpdated={() => {
            setIsUpdateModalOpen(false);
            setSelectedPayment(null);
            fetchData(fetchPayments);
          }}
        />
      )}
      
      {/* Reconcile Payment Modal */}
      {selectedPayment && (
        <ReconcilePaymentModal
          open={isReconcileModalOpen}
          payment={selectedPayment}
          onClose={() => {
            setIsReconcileModalOpen(false);
            setSelectedPayment(null);
          }}
          onPaymentReconciled={() => {
            setIsReconcileModalOpen(false);
            setSelectedPayment(null);
            fetchData(fetchPayments);
          }}
        />
      )}
      
      {/* Delete Payment Confirmation Dialog */}
      {/* This would be implemented with MUI Dialog component */}
    </Box>
  );
};

export default PaymentManagement;
