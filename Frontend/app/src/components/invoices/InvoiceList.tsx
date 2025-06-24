import React, { useReducer, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import DataTable from '../shared/DataTable';
import { getInvoices, InvoiceStatus, PaymentTerm, type Invoice, type InvoiceFilters } from '../../services/api/invoiceService';
import { useAccessControl } from '../../hooks/useAccessControl';
import RoleGuard from '../auth/RoleGuard';

interface InvoiceListProps {
  companyId?: string;
}

// Define state types
interface InvoiceListState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  filters: InvoiceFilters;
  totalInvoices: number;
  searchTerm: string;
  filterMenuAnchor: null | HTMLElement;
  statusFilter: InvoiceStatus | 'all';
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// Define action types
type InvoiceListAction =
  | { type: 'SET_INVOICES'; payload: { invoices: Invoice[]; total: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<InvoiceFilters> }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_FILTER_MENU_ANCHOR'; payload: null | HTMLElement }
  | { type: 'SET_STATUS_FILTER'; payload: InvoiceStatus | 'all' }
  | { type: 'SET_DATE_RANGE'; payload: { field: 'startDate' | 'endDate'; value: string } }
  | { type: 'RESET_FILTERS' };

// Define initial state
const initialState: InvoiceListState = {
  invoices: [],
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  totalInvoices: 0,
  searchTerm: '',
  filterMenuAnchor: null,
  statusFilter: 'all',
  dateRange: {
    startDate: '',
    endDate: ''
  }
};

// Define reducer function
const invoiceListReducer = (state: InvoiceListState, action: InvoiceListAction): InvoiceListState => {
  switch (action.type) {
    case 'SET_INVOICES':
      return {
        ...state,
        invoices: action.payload.invoices,
        totalInvoices: action.payload.total
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload
      };
    case 'SET_FILTER_MENU_ANCHOR':
      return {
        ...state,
        filterMenuAnchor: action.payload
      };
    case 'SET_STATUS_FILTER':
      return {
        ...state,
        statusFilter: action.payload
      };
    case 'SET_DATE_RANGE':
      return {
        ...state,
        dateRange: {
          ...state.dateRange,
          [action.payload.field]: action.payload.value
        }
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        statusFilter: 'all',
        dateRange: { startDate: '', endDate: '' },
        searchTerm: '',
        filters: {
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      };
    default:
      return state;
  }
};

const InvoiceList: React.FC<InvoiceListProps> = ({ companyId }) => {
  const navigate = useNavigate();
  const { canPerform } = useAccessControl();
  const [state, dispatch] = useReducer(invoiceListReducer, initialState);
  const fetchInvoices = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    console.log('InvoiceList: Starting fetch with companyId:', companyId);
    
    try {
      // Apply filters
      const apiFilters: InvoiceFilters = {
        ...state.filters
      };
      
      if (state.statusFilter !== 'all') {
        apiFilters.status = state.statusFilter;
      }
      
      if (state.dateRange.startDate) {
        apiFilters.startDate = state.dateRange.startDate;
      }
      
      if (state.dateRange.endDate) {
        apiFilters.endDate = state.dateRange.endDate;
      }
      
      if (state.searchTerm) {
        // Search by invoice number or customer name - backend should handle this
        // This is a placeholder - actual implementation depends on backend search capability
        apiFilters.sortBy = state.searchTerm;
      }      console.log('Fetching invoices with filters:', apiFilters);

      const response = await getInvoices(apiFilters, companyId);
      dispatch({ 
        type: 'SET_INVOICES', 
        payload: { 
          invoices: response.data, 
          total: response.pagination?.totalPages || 0 
        }      });
    } catch (err: any) {
      let errorMessage = 'Failed to fetch invoices';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.status === 404) {
        errorMessage = 'Invoices endpoint not found. Please check if the backend server is running.';
      } else if (err.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (err.status >= 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and that the backend server is running.';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error fetching invoices:', {
        error: err,
        message: errorMessage,
        companyId: companyId,
        filters: state.filters,
        userInfo: localStorage.getItem('user'),
        userInfoParsed: localStorage.getItem('user_info')
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }  }, [state.filters, state.statusFilter, state.dateRange, state.searchTerm, companyId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCreateInvoice = () => {
    navigate('/invoices/create');
  };

  const handleViewInvoice = (id: string) => {
    navigate(`/invoices/${id}`);
  };
  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    dispatch({ type: 'SET_FILTER_MENU_ANCHOR', payload: event.currentTarget });
  };

  const handleFilterClose = () => {
    dispatch({ type: 'SET_FILTER_MENU_ANCHOR', payload: null });
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: event.target.value as InvoiceStatus | 'all' });
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: { field, value } });
  };

  const handleApplyFilters = () => {
    dispatch({ type: 'UPDATE_FILTERS', payload: { page: 1 } }); // Reset to first page when applying new filters
    handleFilterClose();
    fetchInvoices();
  };

  const handleResetFilters = () => {
    dispatch({ type: 'RESET_FILTERS' });
    handleFilterClose();
  };

  const handlePageChange = (page: number) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: { page } });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: event.target.value });
  };

  const handleSearch = () => {
    // Reset to first page when searching
    dispatch({ type: 'UPDATE_FILTERS', payload: { page: 1 } });
    fetchInvoices();
  };

  const getStatusChipColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.PENDING:
        return 'warning';
      case InvoiceStatus.OVERDUE:
        return 'error';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'info';
      case InvoiceStatus.CANCELLED:
        return 'default';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const columns = [
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
      accessor: 'invoiceNumber',
      cell: (row: Invoice) => (
        <Typography variant="body2" fontWeight="medium">
          {row.invoiceNumber}
        </Typography>
      )
    },
    {
      id: 'customer',
      label: 'Customer',
      accessor: 'customerId',
      cell: (row: Invoice) => (
        <Typography variant="body2">
          {row.customerId.substring(0, 10)}... {/* This should be replaced with actual customer name */}
        </Typography>
      )
    },
    {
      id: 'amount',
      label: 'Amount',
      accessor: 'total',
      cell: (row: Invoice) => (
        <Typography variant="body2">
          {row.total ? formatCurrency(row.total) : '-'}
        </Typography>
      )
    },
    {
      id: 'issueDate',
      label: 'Issue Date',
      accessor: 'issueDate',
      cell: (row: Invoice) => (
        <Typography variant="body2">
          {row.issueDate ? format(new Date(row.issueDate), 'MMM dd, yyyy') : '-'}
        </Typography>
      )
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      accessor: 'dueDate',
      cell: (row: Invoice) => (
        <Typography variant="body2">
          {row.dueDate ? format(new Date(row.dueDate), 'MMM dd, yyyy') : '-'}
        </Typography>
      )
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      cell: (row: Invoice) => (
        <Chip 
          label={row.status ? row.status.replace('_', ' ').toUpperCase() : 'DRAFT'} 
          size="small" 
          color={getStatusChipColor(row.status as InvoiceStatus)}
        />
      )
    },
    {      id: 'actions',
      label: 'Actions',
      accessor: 'id',
      cell: (row: Invoice) => (
        <RoleGuard action="invoice:read" fallback={null}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleViewInvoice(row.id!)}
          >
            View
          </Button>
        </RoleGuard>
      )
    }
  ];  // Filter panel JSX
  const filterPanel = (
    <Box sx={{ p: 2, mb: 3, borderRadius: 1, border: '1px solid #e0e0e0' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          placeholder="Search invoices..."
          value={state.searchTerm}
          onChange={handleSearchChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: '40%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch}>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Box>
          <RoleGuard action="invoice:create" fallback={null}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateInvoice}
              sx={{ mr: 1 }}
            >
              Create Invoice
            </Button>
          </RoleGuard>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchInvoices}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            startIcon={<FilterListIcon />}
            onClick={handleFilterOpen}
            variant="outlined"
          >
            Filters
          </Button>
          <Menu
            anchorEl={state.filterMenuAnchor}
            open={Boolean(state.filterMenuAnchor)}
            onClose={handleFilterClose}
            PaperProps={{
              sx: { width: 300, p: 2 }
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Filter Invoices
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={state.statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value={InvoiceStatus.DRAFT}>Draft</MenuItem>
                <MenuItem value={InvoiceStatus.PENDING}>Pending</MenuItem>
                <MenuItem value={InvoiceStatus.PAID}>Paid</MenuItem>
                <MenuItem value={InvoiceStatus.PARTIALLY_PAID}>Partially Paid</MenuItem>
                <MenuItem value={InvoiceStatus.OVERDUE}>Overdue</MenuItem>
                <MenuItem value={InvoiceStatus.CANCELLED}>Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Date Range
            </Typography>
            
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="From"
                type="date"
                value={state.dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="To"
                type="date"
                value={state.dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleResetFilters}
                fullWidth
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                fullWidth
              >
                Apply
              </Button>
            </Stack>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
  return (
    <Box>
      {/* Filter panel only, no page title/header here */}
      <Box sx={{ mb: 2 }}>
        {filterPanel}
      </Box>
      <DataTable
        columns={columns}
        data={state.invoices}
        loading={state.loading}
        error={state.error}
        pagination={{
          page: state.filters.page || 1,
          rowsPerPage: state.filters.limit || 10,
          totalCount: state.totalInvoices,
          onPageChange: handlePageChange,
          onRowsPerPageChange: (pageSize) => {
            dispatch({ 
              type: 'UPDATE_FILTERS', 
              payload: {
                limit: pageSize,
                page: 1 // Reset to first page when changing page size
              }
            });
          }
        }}
        onRowClick={(row: Invoice) => handleViewInvoice(row.id!)}      />
    </Box>
  );
};

export default InvoiceList;
