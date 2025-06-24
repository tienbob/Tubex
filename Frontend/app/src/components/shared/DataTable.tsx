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
  Typography,
  Alert
} from '@mui/material';
import TableSkeleton from './TableSkeleton';

export interface Column<T = any> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row?: T) => React.ReactNode;
}

interface Pagination {
  page: number;
  totalCount: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  pagination?: Pagination;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  dense?: boolean;
}

const DataTable = React.memo<DataTableProps>(({
  columns,
  data,
  loading = false,
  error = null,
  pagination,
  emptyMessage = 'No data available',
  onRowClick,
  dense = false
}) => {
  // Render skeleton while loading
  if (loading) {
    return <TableSkeleton 
      rowCount={pagination?.rowsPerPage || 5} 
      columnCount={columns.length} 
      dense={dense}
    />;
  }

  // Render error message if there's an error
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  // Render empty state message if there's no data
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', mb: 2 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: pagination ? 0 : 2 }}>
        <Table 
          size={dense ? 'small' : 'medium'} 
          aria-label="data table"
          sx={{ tableLayout: 'fixed' }}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => {
              return (
                <TableRow
                  hover
                  key={row.id || rowIndex}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ 
                    '&:last-child td, &:last-child th': { border: 0 }, 
                    cursor: onRowClick ? 'pointer' : 'default' 
                  }}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick ? `View details for ${row.name || `item ${rowIndex + 1}`}` : undefined}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.totalCount}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={(_, newPage) => pagination.onPageChange(newPage)}
          onRowsPerPageChange={(event) => pagination.onRowsPerPageChange(parseInt(event.target.value, 10))}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
          labelRowsPerPage="Rows per page:"
        />
      )}
    </Box>
  );
});

export default DataTable;