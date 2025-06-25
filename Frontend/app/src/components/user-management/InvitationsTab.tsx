import React from 'react';
import { Box, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, Chip, IconButton, Tooltip } from '@mui/material';
import { Add as AddIcon, Mail as MailIcon, Delete as DeleteIcon } from '@mui/icons-material';

const InvitationsTab: React.FC<{ invitations: any[], loading: boolean, openInviteDialog: () => void, handleResendInvite: (invitationId: string) => void, handleCancelInvite: (invitationId: string) => void }> = ({ invitations, loading, openInviteDialog, handleResendInvite, handleCancelInvite }) => {
  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openInviteDialog}
        >
          Invite User
        </Button>
      </Box>
      <Divider />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : invitations.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sent Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <Chip label={invitation.role || 'No Role'} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip label={invitation.status} color={invitation.status === 'pending' ? 'warning' : invitation.status === 'accepted' ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{invitation.created_at ? new Date(invitation.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {invitation.status === 'pending' && (
                        <>
                          <Tooltip title="Resend invitation">
                            <IconButton size="small" onClick={() => handleResendInvite(invitation.id)} color="primary">
                              <MailIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel invitation">
                            <IconButton size="small" onClick={() => handleCancelInvite(invitation.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No invitations found. Invite a new user to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openInviteDialog}
            sx={{ mt: 2 }}
          >
            Invite User
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default InvitationsTab;
