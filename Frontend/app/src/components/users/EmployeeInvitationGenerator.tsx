import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format, addDays, isAfter } from 'date-fns';
import { authService } from '../../services/api';

interface EmployeeInvitationGeneratorProps {
  companyId: string;
  onInvitationGenerated?: (code: string) => void;
}

const EmployeeInvitationGenerator: React.FC<EmployeeInvitationGeneratorProps> = ({ 
  companyId,
  onInvitationGenerated 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationCode, setInvitationCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [companyName, setCompanyName] = useState<string | null>(null);

  const generateInvitation = async () => {
    if (!companyId) {
      setError('Company ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {      
      const response = await authService.generateInvitationCode({ companyId });
      setInvitationCode(response.data.code);
      setExpiresAt(response.data.expiresIn);
      
      if (onInvitationGenerated) {
        onInvitationGenerated(response.data.code);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate invitation code');
      console.error('Error generating invitation code:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (invitationCode) {
      navigator.clipboard.writeText(invitationCode)
        .then(() => {
          setSnackbarMessage('Invitation code copied to clipboard');
          setSnackbarOpen(true);
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
          setSnackbarMessage('Failed to copy code');
          setSnackbarOpen(true);
        });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  const formatExpiryDate = (dateString: string) => {
    try {
      // If the string is in the format "X days", just return it as is
      if (dateString.includes('days')) {
        return dateString;
      }
      
      // Otherwise try to parse it as a date
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };
  const isExpired = (dateString: string | null) => {
    if (!dateString) return false;
    
    try {
      // If the string is in the format "X days", it's not expired
      if (dateString.includes('days')) {
        return false;
      }
      
      // Otherwise try to parse it as a date
      const date = new Date(dateString);
      return isAfter(new Date(), date);
    } catch (e) {
      return false;
    }
  };

  const getInvitationUrl = () => {
    if (!invitationCode) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/join?code=${invitationCode}`;
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>      
    <Typography variant="h6" gutterBottom>
        Employee Invitation
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Generate an invitation code to allow new employees to register to your company. 
        Share the invitation code or URL with employees. The invitation code is valid for 48 hours.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {invitationCode ? (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Invitation Code"
            value={invitationCode}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title="Copy code">
                  <IconButton edge="end" onClick={copyToClipboard}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Invitation URL"
            value={getInvitationUrl()}
            fullWidth
            InputProps={{
              readOnly: true,
              endAdornment: (
                <Tooltip title="Copy URL">
                  <IconButton 
                    edge="end" 
                    onClick={() => {
                      navigator.clipboard.writeText(getInvitationUrl());
                      setSnackbarMessage('Invitation URL copied to clipboard');
                      setSnackbarOpen(true);
                    }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              ),
            }}
            sx={{ mb: 2 }}
          />          {expiresAt && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              {expiresAt.includes('days') 
                ? `This code will expire in ${formatExpiryDate(expiresAt)}`
                : isExpired(expiresAt) 
                  ? `This code has expired on ${formatExpiryDate(expiresAt)}`
                  : `This code will expire on ${formatExpiryDate(expiresAt)}`}
            </Typography>
          )}
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>How to use:</strong> Provide this invitation URL to your employee. When they visit the link, they'll be able to create their account with your company.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={generateInvitation}
              disabled={loading}
              variant="outlined"
            >
              {loading ? <CircularProgress size={24} /> : 'Generate New Code'}
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={generateInvitation}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Invitation Code'}
          </Button>
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default EmployeeInvitationGenerator;