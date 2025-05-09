import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  CircularProgress,
  Typography,
  useTheme as useMuiTheme
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

// Define the column interface
export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => React.ReactNode;
}

// Define pagination interface
export interface PaginationProps {
  page: number;
  totalCount: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (pageSize: number) => void;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: any) => void;
  pagination?: PaginationProps;
  emptyMessage?: string;
  stickyHeader?: boolean;
  maxHeight?: string | number;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  error = null,
  onRowClick,
  pagination,
  emptyMessage = 'No data available',
  stickyHeader = true,
  maxHeight = 600,
}) => {
  const muiTheme = useMuiTheme();
  const { theme: whitelabelTheme } = useTheme();

  const handleRowClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  // Show loading state
  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress 
          size={40} 
          sx={{ 
            color: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main
          }} 
        />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  // Show empty state
  if (!loading && data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Typography>{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: maxHeight }}>
        <Table stickyHeader={stickyHeader} aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth, 
                    backgroundColor: whitelabelTheme?.backgroundColor || muiTheme.palette.background.paper,
                    color: whitelabelTheme?.textColor || muiTheme.palette.text.primary,
                    fontWeight: 'bold'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              return (
                <TableRow
                  hover
                  tabIndex={-1}
                  key={row.id || index}
                  onClick={() => handleRowClick(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default', 
                    '&:hover': {
                      backgroundColor: onRowClick ? 
                        `${whitelabelTheme?.primaryColor || muiTheme.palette.primary.main}10` : 
                        undefined
                    }
                  }}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={pagination.totalCount}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={(_, newPage) => pagination.onPageChange(newPage)}
          onRowsPerPageChange={(e) => 
            pagination.onRowsPerPageChange(parseInt(e.target.value, 10))
          }
        />
      )}
    </Paper>
  );
};

export default DataTable;