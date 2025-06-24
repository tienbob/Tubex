import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { authService } from '../../services/api';

interface PendingEmployeesListProps {
  onEmployeeStatusChange?: () => void;
}

const PendingEmployeesList: React.FC<PendingEmployeesListProps> = ({
  onEmployeeStatusChange
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingEmployees();
  }, []);

  const fetchPendingEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.getPendingEmployees();
      setEmployees(response.employees || []);
    } catch (err: any) {
      console.error('Error fetching pending employees:', err);
      setError(err.message || 'Failed to fetch pending employees');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (employeeId: string) => {
    setActionLoading(true);
    setError(null);

    try {
      await authService.verifyEmployee(employeeId);
      
      // Update the local list
      setEmployees(prevEmployees => 
        prevEmployees.filter(emp => emp.id !== employeeId)
      );
      
      if (onEmployeeStatusChange) {
        onEmployeeStatusChange();
      }
    } catch (err: any) {
      console.error('Error approving employee:', err);
      setError(err.message || 'Failed to approve employee');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const closeRejectDialog = () => {
    setRejectDialogOpen(false);
    setSelectedEmployeeId(null);
  };

  const handleReject = async () => {
    if (!selectedEmployeeId) return;

    setActionLoading(true);
    setError(null);

    try {
      await authService.rejectEmployee(
        selectedEmployeeId,
        rejectionReason.trim() || undefined
      );
      
      // Update the local list
      setEmployees(prevEmployees => 
        prevEmployees.filter(emp => emp.id !== selectedEmployeeId)
      );
      
      if (onEmployeeStatusChange) {
        onEmployeeStatusChange();
      }
      
      closeRejectDialog();
    } catch (err: any) {
      console.error('Error rejecting employee:', err);
      setError(err.message || 'Failed to reject employee');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Pending Employee Registrations</Typography>
        <Button 
          size="small" 
          onClick={fetchPendingEmployees}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Registration Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.jobTitle || '—'}</TableCell>
                    <TableCell>{employee.department || '—'}</TableCell>
                    <TableCell>
                      {employee.registrationDate ? formatDate(employee.registrationDate) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Approve">
                        <IconButton 
                          color="success"
                          onClick={() => handleApprove(employee.id)}
                          disabled={actionLoading}
                        >
                          <CheckIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton 
                          color="error"
                          onClick={() => openRejectDialog(employee.id)}
                          disabled={actionLoading}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" color="textSecondary">
                      No pending employee registrations found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={closeRejectDialog}>
        <DialogTitle>Reject Employee Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this employee registration. 
            This will be included in the notification email sent to the applicant.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PendingEmployeesList;