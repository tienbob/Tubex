import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { userManagementService, UserListParams, UserListResponse, UserUpdateRequest, UserCreateRequest, Role, getUserName } from '../services/api';
import { useAuth } from '../components/auth/AuthContext';
import UsersTab from '../components/user-management/UsersTab';
import InvitationsTab from '../components/user-management/InvitationsTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

const UserManagement: React.FC = () => {
  const { user } = useAuth(); // Retrieve user object from AuthContext
  const companyId = user?.companyId; // Extract companyId dynamically
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  
  // Invitation dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: '',
    message: ''
  });
  const [inviteFormErrors, setInviteFormErrors] = useState<Record<string, string>>({});
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Available roles based on current user's hierarchy
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  // Fetch all data when component mounts
  useEffect(() => {
    fetchUsers();
    fetchInvitations();
    fetchAvailableRoles();
  }, []);

  // Fetch users based on search query
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: UserListParams = {
        company_id: companyId,
        search: searchQuery || undefined, // Ensure compatibility with `UserListParams`
      };      const response: UserListResponse = await userManagementService.getUsers(params);
      console.log('Users API response:', response); // Debug log
      setUsers(response.data?.users || []); // Fixed: access users from data.users
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  const fetchInvitations = async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await userManagementService.getInvitations(companyId);
      setInvitations(response.data?.invitations || []);
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      setError(err.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available roles based on current user's hierarchy
  const fetchAvailableRoles = async () => {
    try {
      const response = await userManagementService.getAvailableRoles();
      setAvailableRoles(response.data);
    } catch (err: any) {
      console.error('Error fetching available roles:', err);
      // Fallback to default roles if API fails
      setAvailableRoles([
        { id: 'admin', name: 'Admin' },
        { id: 'manager', name: 'Manager' },
        { id: 'staff', name: 'Staff' }
      ]);
    }
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };  // User form handlers
  const openUserDialog = (user: any = null) => {
    if (user) {
      setSelectedUser(user);
      const { firstName, lastName } = getUserName(user);
      setUserFormData({
        name: `${firstName} ${lastName}`.trim() || '',
        email: user.email || '',
        role: user.role || '',
        isActive: user.status === 'active'
      });
    } else {
      setSelectedUser(null);
      setUserFormData({
        name: '',
        email: '',
        role: '',
        isActive: true
      });
    }
    setUserFormErrors({});
    setUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    setUserDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserFormChange = (field: string, value: any) => {
    if (field === 'role' && !availableRoles.some(role => role.id === value)) {
      setUserFormErrors((prev) => ({ ...prev, role: 'Invalid role selected' }));
      return;
    }

    setUserFormData((prev) => ({ ...prev, [field]: value }));
    if (userFormErrors[field]) {
      setUserFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateUserForm = () => {
    const errors: Record<string, string> = {};
    
    if (!userFormData.name.trim()) {
      errors['name'] = 'Name is required';
    }
    
    if (!userFormData.email.trim()) {
      errors['email'] = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      errors['email'] = 'Invalid email format';
    }
    
    if (!userFormData.role) {
      errors['role'] = 'Role is required';
    }
    
    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserSave = async () => {
    if (!validateUserForm()) return;
    
    setLoading(true);
    try {
      if (selectedUser) {
        // Only send allowed fields for update
        const updateData: UserUpdateRequest = {
          email: userFormData.email,
          role: userFormData.role as UserUpdateRequest['role'],
          status: userFormData.isActive ? 'active' : 'inactive',
        };
        await userManagementService.updateUser(selectedUser.id, updateData);
      } else {
        const createData: UserCreateRequest = {
          firstName: userFormData.name.split(' ')[0],
          lastName: userFormData.name.split(' ').slice(1).join(' ') || '',
          email: userFormData.email,
          password: 'defaultPassword123', // Placeholder password
          role: userFormData.role as UserCreateRequest['role'],
          status: userFormData.isActive ? 'active' : 'inactive',
          companyId: companyId ?? '',
        };
        await userManagementService.createUser(createData);
      }
      
      fetchUsers();
      closeUserDialog();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };  const handleDeleteUser = (userId: string) => {
    setConfirmTitle('Delete User');
    setConfirmMessage('Are you sure you want to delete this user? This action cannot be undone.');
    setConfirmAction(async () => {
      try {
        await userManagementService.deleteUser(userId);
        fetchUsers();
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setError(err.message || 'Failed to delete user');
      }
    });
    setConfirmDialogOpen(true);
  };
  // Invitation form handlers
  const openInviteDialog = () => {
    setInviteFormData({
      email: '',
      role: '',
      message: 'I would like to invite you to join our team on Tubex.'
    });
    setInviteFormErrors({});
    setInviteDialogOpen(true);
  };

  const closeInviteDialog = () => {
    setInviteDialogOpen(false);
  };

  const handleInviteFormChange = (field: string, value: any) => {
    setInviteFormData(prev => ({ ...prev, [field]: value }));
    if (inviteFormErrors[field]) {
      setInviteFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateInviteForm = () => {
    const errors: Record<string, string> = {};
    
    if (!inviteFormData.email.trim()) {
      errors['email'] = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(inviteFormData.email)) {
      errors['email'] = 'Invalid email format';
    }
    
    if (!inviteFormData.role) {
      errors['role'] = 'Role is required';
    }
    
    setInviteFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendInvite = async () => {
    if (!validateInviteForm()) return;
    setLoading(true);
    try {
      // 1. Generate invitation code
      const codeResponse = await userManagementService.sendInvitation({
        ...inviteFormData,
        companyId
      });
      // The code is inside codeResponse.data.code
      const invitationCode = codeResponse?.code || codeResponse?.invitationCode || codeResponse?.data?.code;
      if (!invitationCode) {
        console.error('Invitation code missing in response:', codeResponse);
        setError('Failed to generate invitation code. Please try again.');
        setLoading(false);
        return;
      }
      // 2. Send email to invitee with code and role
      await userManagementService.sendInvitationEmail({
        to: inviteFormData.email,
        code: invitationCode,
        role: inviteFormData.role,
        message: inviteFormData.message,
        companyId: companyId ?? '' // Ensure string type
      });
      fetchInvitations();
      closeInviteDialog();
      setError(null);
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = (invitationId: string) => {
    setLoading(true);
    setError(null);
    
    (async () => {
      try {
        await userManagementService.resendInvitation(invitationId);
        fetchInvitations();
      } catch (err: any) {
        console.error('Error resending invitation:', err);
        setError(err.message || 'Failed to resend invitation');
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleCancelInvite = (invitationId: string) => {
    setConfirmTitle('Cancel Invitation');
    setConfirmMessage('Are you sure you want to cancel this invitation?');
    setConfirmAction(async () => {
      try {
        await userManagementService.cancelInvitation(invitationId);
        fetchInvitations();
      } catch (err: any) {
        console.error('Error cancelling invitation:', err);
        setError(err.message || 'Failed to cancel invitation');
      }    });
    setConfirmDialogOpen(true);
  };

  if (!companyId) {
    return <Typography variant="h6">Company ID is not available. Please log in again.</Typography>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
            <Tab label="Users" {...a11yProps(0)} />
            <Tab label="Invitations" {...a11yProps(1)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UsersTab
            users={users}
            loading={loading}
            fetchUsers={fetchUsers}
            openUserDialog={openUserDialog}
            handleDeleteUser={handleDeleteUser}
          />        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <InvitationsTab
            invitations={invitations}
            loading={loading}
            openInviteDialog={openInviteDialog}
            handleResendInvite={handleResendInvite}
            handleCancelInvite={handleCancelInvite}
          />
        </TabPanel>
      </Paper>

      {/* User Dialog */}
      <Dialog 
        open={userDialogOpen} 
        onClose={closeUserDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={userFormData.name}
              onChange={(e) => handleUserFormChange('name', e.target.value)}
              error={!!userFormErrors.name}
              helperText={userFormErrors.name}
            />
            
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={userFormData.email}
              onChange={(e) => handleUserFormChange('email', e.target.value)}
              error={!!userFormErrors.email}
              helperText={userFormErrors.email}
              disabled={!!selectedUser} // Email can't be changed for existing users
            />
              <FormControl fullWidth error={!!userFormErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                value={userFormData.role}
                label="Role"
                onChange={(e) => handleUserFormChange('role', e.target.value)}
              >
                {availableRoles.map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
              {userFormErrors.role && (
                <FormHelperText>{userFormErrors.role}</FormHelperText>
              )}
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={userFormData.isActive}
                  onChange={(e) => handleUserFormChange('isActive', e.target.checked)}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUserDialog}>Cancel</Button>
          <Button 
            onClick={handleUserSave} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>      
        </Dialog>

      {/* Invite Dialog */}
      <Dialog 
        open={inviteDialogOpen} 
        onClose={closeInviteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={inviteFormData.email}
              onChange={(e) => handleInviteFormChange('email', e.target.value)}
              error={!!inviteFormErrors.email}
              helperText={inviteFormErrors.email}
            />
              <FormControl fullWidth error={!!inviteFormErrors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteFormData.role}
                label="Role"
                onChange={(e) => handleInviteFormChange('role', e.target.value)}
              >
                {availableRoles.map(role => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
              {inviteFormErrors.role && (
                <FormHelperText>{inviteFormErrors.role}</FormHelperText>
              )}
            </FormControl>
            
            <TextField
              label="Invitation Message"
              multiline
              rows={3}
              fullWidth
              value={inviteFormData.message}
              onChange={(e) => handleInviteFormChange('message', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeInviteDialog}>Cancel</Button>
          <Button 
            onClick={handleSendInvite} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <Typography>{confirmMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (confirmAction) {
                setLoading(true);
                await confirmAction();
                setLoading(false);
              }
              setConfirmDialogOpen(false);
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;