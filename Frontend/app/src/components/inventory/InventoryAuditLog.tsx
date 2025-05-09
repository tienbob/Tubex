import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { inventoryService } from '../../services/api';
import type { InventoryAuditLog as IAuditLog } from '../../services/api/inventoryService';

interface InventoryAuditLogProps {
  inventoryId: string;
  title?: string;
  maxHeight?: number | string;
}

const InventoryAuditLog: React.FC<InventoryAuditLogProps> = ({
  inventoryId,
  title = 'Inventory Audit Log',
  maxHeight
}) => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    fetchAuditLogs();
  }, [inventoryId, page, rowsPerPage]);

  const fetchAuditLogs = async () => {
    if (!inventoryId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getInventoryAuditLog(inventoryId, {
        page: page + 1, // Convert to 1-based pagination for API
        limit: rowsPerPage,
      });
      
      setLogs(response.data);
      setTotalRows(response.pagination?.total || response.data.length);
    } catch (err: any) {
      console.error('Error fetching inventory audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  const getChangeTypeChip = (changeType: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    let label = changeType;
    
    switch (changeType) {
      case 'addition':
        color = 'success';
        label = 'Addition';
        break;
      case 'reduction':
        color = 'error';
        label = 'Reduction';
        break;
      case 'transfer_in':
        color = 'info';
        label = 'Transfer In';
        break;
      case 'transfer_out':
        color = 'warning';
        label = 'Transfer Out';
        break;
      case 'adjustment':
        color = 'secondary';
        label = 'Adjustment';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  const getQuantityChangeDisplay = (previousQuantity: number, newQuantity: number) => {
    const difference = newQuantity - previousQuantity;
    const color = difference > 0 ? 'success.main' : difference < 0 ? 'error.main' : 'text.secondary';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" component="span">
          {previousQuantity} → {newQuantity}
        </Typography>
        <Typography 
          variant="body2" 
          component="span"
          sx={{ 
            color, 
            ml: 1,
            fontWeight: 'bold'
          }}
        >
          ({difference > 0 ? '+' : ''}{difference})
        </Typography>
      </Box>
    );
  };

  return (
    <Paper 
      sx={{ 
        width: '100%', 
        overflow: 'hidden',
        maxHeight: maxHeight ? maxHeight : 'auto'
      }}
      elevation={1}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>

      {loading && logs.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <TableContainer sx={{ flexGrow: 1, maxHeight: maxHeight ? `calc(${maxHeight}px - 120px)` : undefined }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Change Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>{formatDate(log.created_at)}</TableCell>
                      <TableCell>{getChangeTypeChip(log.change_type)}</TableCell>
                      <TableCell>
                        {getQuantityChangeDisplay(log.previous_quantity, log.new_quantity)}
                      </TableCell>
                      <TableCell>{log.reference_id || '—'}</TableCell>
                      <TableCell>{log.created_by}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No audit logs found for this inventory item
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalRows}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
    </Paper>
  );
};

export default InventoryAuditLog;