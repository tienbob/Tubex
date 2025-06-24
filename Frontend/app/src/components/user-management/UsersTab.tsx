import React from 'react';
import { Box, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, CircularProgress, Chip, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getUserName } from '../../services/api/userManagementService';

const UsersTab: React.FC<{ users: any[], loading: boolean, fetchUsers: () => void, openUserDialog: (user?: any) => void, handleDeleteUser: (userId: string) => void }> = ({ users, loading, fetchUsers, openUserDialog, handleDeleteUser }) => {
  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flex: '1 1 300px' }}>
          <Button variant="contained" onClick={fetchUsers}>Search</Button>
        </Box>
      </Box>
      <Divider />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : users.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {getUserName(user).fullName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.role || 'No Role'} size="small" color={user.role ? "primary" : "default"} />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status === 'active' ? 'Active' : user.status || 'Inactive'} 
                      color={user.status === 'active' ? "success" : "default"} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => openUserDialog(user)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteUser(user.id)} color="error">
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
            No users found.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UsersTab;
