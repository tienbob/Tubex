import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme as useMuiTheme
} from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import { companyVerificationService } from '../../../services/api';

interface CompanyVerificationListProps {
  onVerificationComplete?: () => void;
}

const CompanyVerificationList: React.FC<CompanyVerificationListProps> = ({
  onVerificationComplete
}) => {
  const { theme: whitelabelTheme } = useTheme();
  const muiTheme = useMuiTheme();

  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectCompanyId, setRejectCompanyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // For document preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Custom button styles based on the whitelabel theme
  const buttonStyles = {
    approve: {
      backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.success.main,
      color: '#fff',
      borderRadius: whitelabelTheme?.buttonRadius !== undefined ? `${whitelabelTheme.buttonRadius}px` : undefined,
      '&:hover': {
        backgroundColor: whitelabelTheme?.primaryColor ? 
          `${whitelabelTheme.primaryColor}dd` : muiTheme.palette.success.dark,
      },
    },
    reject: {
      backgroundColor: muiTheme.palette.error.main,
      color: '#fff',
      borderRadius: whitelabelTheme?.buttonRadius !== undefined ? `${whitelabelTheme.buttonRadius}px` : undefined,
      '&:hover': {
        backgroundColor: muiTheme.palette.error.dark,
      },
    }
  };

  const fetchPendingVerifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const verifications = await companyVerificationService.getPendingVerifications();
      setPendingVerifications(verifications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending verifications');
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleApprove = async (companyId: string) => {
    try {
      await companyVerificationService.approveCompany(companyId);
      // Remove approved company from the list
      setPendingVerifications(prev => prev.filter(v => v.company_id !== companyId));
      
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (err: any) {
      setError(err.message || `Failed to approve company: ${companyId}`);
      console.error('Error approving company:', err);
    }
  };

  const openRejectDialog = (companyId: string) => {
    setRejectCompanyId(companyId);
    setRejectReason('');
    setRejectionError(null);
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectCompanyId) return;
    
    if (!rejectReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }
    
    try {
      await companyVerificationService.rejectCompany(rejectCompanyId, rejectReason);
      // Remove rejected company from the list
      setPendingVerifications(prev => prev.filter(v => v.company_id !== rejectCompanyId));
      
      if (onVerificationComplete) {
        onVerificationComplete();
      }
      
      setRejectDialogOpen(false);
    } catch (err: any) {
      setRejectionError(err.message || `Failed to reject company: ${rejectCompanyId}`);
      console.error('Error rejecting company:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleDocumentPreview = (url: string) => {
    setPreviewUrl(url);
    setPreviewDialogOpen(true);
  };

  if (loading && pendingVerifications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading pending verifications...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'error.main' }}>
        <Typography>{error}</Typography>
        <Button 
          variant="outlined"
          onClick={fetchPendingVerifications}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (pendingVerifications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6">No pending verifications</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          All company registrations have been processed
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        Pending Company Verifications
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
        {pendingVerifications.map((verification) => (
          <Box
            key={verification.company_id}
            sx={{ flex: '1 1 calc(50% - 16px)', minWidth: '300px', p: 2, border: '1px solid #ddd', borderRadius: 1 }}
          >
            <Typography variant="h6">{verification.company_name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {verification.status}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Company Registration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this company registration.
            This information will be shared with the company.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            error={!!rejectionError}
            helperText={rejectionError}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained">Confirm Rejection</Button>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {previewUrl && (
            previewUrl.toLowerCase().endsWith('.pdf') ? (
              <Box sx={{ height: '70vh' }}>
                <iframe 
                  src={previewUrl} 
                  width="100%" 
                  height="100%" 
                  title="Document Preview"
                />
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src={previewUrl} 
                  alt="Document Preview" 
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              </Box>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button component="a" href={previewUrl || '#'} target="_blank" rel="noopener noreferrer">
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyVerificationList;