import React from 'react';
import { Box, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, Chip, IconButton } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const RolesTab: React.FC<{ roles: any[], loading: boolean, openRoleDialog: (role?: any) => void, handleDeleteRole: (roleId: string) => void }> = ({ roles, loading, openRoleDialog, handleDeleteRole }) => {
  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => openRoleDialog()}
        >
          Add Role
        </Button>
      </Box>
      <Divider />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : roles.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Role Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(role.permissions || []).slice(0, 3).map((permission: string) => (
                        <Chip key={permission} label={permission} size="small" variant="outlined" />
                      ))}
                      {(role.permissions || []).length > 3 && (
                        <Chip label={`+${role.permissions.length - 3} more`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{role.userCount || 0}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => openRoleDialog(role)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteRole(role.id)} color="error" disabled={role.userCount > 0}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
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
            No roles found. Add a new role to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => openRoleDialog()}
            sx={{ mt: 2 }}
          >
            Add Role
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RolesTab;
