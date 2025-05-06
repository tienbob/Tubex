import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import authService from '../../services/api/authService';
import { useAuth } from '../../contexts/AuthContext';

// Interface for pending employee data
interface PendingEmployee {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  registrationDate: string;
}

const AdminEmployeeVerification: React.FC = () => {
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openRejectDialog, setOpenRejectDialog] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const { user } = useAuth();
  
  useEffect(() => {
    // Only fetch pending employees if the user is an admin
    if (user?.role === 'admin') {
      fetchPendingEmployees();
    }
  }, [user]);
  
  const fetchPendingEmployees = async () => {
    try {
      setLoading(true);
      const response = await authService.getPendingEmployees();
      setPendingEmployees(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load pending employee registrations');
      console.error('Error fetching pending employees:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyEmployee = async (employeeId: string) => {
    try {
      await authService.verifyEmployee(employeeId);
      // Remove the verified employee from the list
      setPendingEmployees(pendingEmployees.filter(emp => emp.employeeId !== employeeId));
      showSnackbar('Employee verified successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to verify employee', 'error');
      console.error('Error verifying employee:', err);
    }
  };
  
  const openRejectEmployeeDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setOpenRejectDialog(true);
  };
  
  const handleRejectEmployee = async () => {
    if (!selectedEmployeeId) return;
    
    try {
      await authService.rejectEmployee(selectedEmployeeId, rejectionReason);
      // Remove the rejected employee from the list
      setPendingEmployees(pendingEmployees.filter(emp => emp.employeeId !== selectedEmployeeId));
      setOpenRejectDialog(false);
      setRejectionReason('');
      setSelectedEmployeeId(null);
      showSnackbar('Employee registration rejected', 'success');
    } catch (err) {
      showSnackbar('Failed to reject employee registration', 'error');
      console.error('Error rejecting employee:', err);
    }
  };
  
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  if (user?.role !== 'admin') {
    return (
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You do not have permission to access this page.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Employee Verification
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : pendingEmployees.length === 0 ? (
        <Alert severity="info">
          No pending employee registrations to verify
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Registration Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingEmployees.map((employee) => (
                <TableRow key={employee.employeeId}>
                  <TableCell>
                    {employee.firstName} {employee.lastName}
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.jobTitle}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    {new Date(employee.registrationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleVerifyEmployee(employee.employeeId)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => openRejectEmployeeDialog(employee.employeeId)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Rejection Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>Reject Employee Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this employee registration:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button onClick={handleRejectEmployee} color="error">
            Reject Registration
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminEmployeeVerification;