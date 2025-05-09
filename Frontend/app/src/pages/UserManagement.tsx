import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Chip,
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
import { userManagementService, UserListParams, UserListResponse, UserUpdateRequest, UserCreateRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import UsersTab from '../components/whitelabel/user-management/UsersTab';
import RolesTab from '../components/whitelabel/user-management/RolesTab';
import InvitationsTab from '../components/whitelabel/user-management/InvitationsTab';

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
  const [roles, setRoles] = useState<any[]>([]);
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
  
  // Role dialog state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [roleFormErrors, setRoleFormErrors] = useState<Record<string, string>>({});
  
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

  // Available permissions
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([
    'users:read', 'users:write', 'users:delete',
    'inventory:read', 'inventory:write', 'inventory:delete',
    'products:read', 'products:write', 'products:delete',
    'orders:read', 'orders:write', 'orders:delete',
    'reports:read'
  ]);

  // Fetch all data when component mounts
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchInvitations();
  }, []);

  // Fetch users based on search query
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: UserListParams = {
        company_id: companyId,
        search: searchQuery || undefined, // Ensure compatibility with `UserListParams`
      };

      const response: UserListResponse = await userManagementService.getUsers(params);
      setUsers(response.data || []); // Adjusted to use `data` instead of `users`
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    console.warn('`getRoles` method is not implemented in `userManagementService`.');
  };

  const fetchInvitations = async () => {
    console.warn('`getInvitations` method is not implemented in `userManagementService`.');
  };

  // Tab change handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // User form handlers
  const openUserDialog = (user: any = null) => {
    if (user) {
      setSelectedUser(user);
      setUserFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role?.id || '',
        isActive: user.isActive !== false
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
    if (field === 'role' && !['admin', 'manager', 'staff', 'supplier', 'dealer'].includes(value)) {
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
        const updateData: UserUpdateRequest = {
          firstName: userFormData.name.split(' ')[0],
          lastName: userFormData.name.split(' ').slice(1).join(' ') || '',
          email: userFormData.email,
          role: userFormData.role as UserUpdateRequest['role'],
          status: userFormData.isActive ? 'active' : 'inactive',
          companyId: companyId ?? '',
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
  };

  const handleDeleteUser = (userId: string) => {
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

  // Role form handlers
  const openRoleDialog = (role: any = null) => {
    if (role) {
      setSelectedRole(role);
      setRoleFormData({
        name: role.name || '',
        description: role.description || '',
        permissions: role.permissions || []
      });
    } else {
      setSelectedRole(null);
      setRoleFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setRoleFormErrors({});
    setRoleDialogOpen(true);
  };

  const closeRoleDialog = () => {
    setRoleDialogOpen(false);
    setSelectedRole(null);
  };

  const handleRoleFormChange = (field: string, value: any) => {
    setRoleFormData(prev => ({ ...prev, [field]: value }));
    if (roleFormErrors[field]) {
      setRoleFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setRoleFormData(prev => {
      const isSelected = prev.permissions.includes(permission);
      const updatedPermissions = isSelected
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
        
      return { ...prev, permissions: updatedPermissions };
    });
  };

  const validateRoleForm = () => {
    const errors: Record<string, string> = {};
    
    if (!roleFormData.name.trim()) {
      errors['name'] = 'Role name is required';
    }
    
    if (roleFormData.permissions.length === 0) {
      errors['permissions'] = 'At least one permission must be selected';
    }
    
    setRoleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRoleSave = async () => {
    if (!validateRoleForm()) return;
    
    setLoading(true);
    try {
      if (selectedRole) {
        await userManagementService.updateRole(selectedRole.id, {
          ...roleFormData,
          companyId
        });
      } else {
        await userManagementService.createRole({
          ...roleFormData,
          companyId
        });
      }
      
      fetchRoles();
      closeRoleDialog();
    } catch (err: any) {
      console.error('Error saving role:', err);
      setError(err.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = (roleId: string) => {
    setConfirmTitle('Delete Role');
    setConfirmMessage('Are you sure you want to delete this role? Users with this role will need to be reassigned.');
    setConfirmAction(async () => {
      try {
        await userManagementService.deleteRole(roleId);
        fetchRoles();
      } catch (err: any) {
        console.error('Error deleting role:', err);
        setError(err.message || 'Failed to delete role');
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
      await userManagementService.sendInvitation({
        ...inviteFormData,
        companyId
      });
      
      fetchInvitations();
      closeInviteDialog();
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
      }
    });
    setConfirmDialogOpen(true);
  };

  // Permission group rendering
  const renderPermissionGroup = (group: string) => {
    const groupPermissions = availablePermissions.filter(p => p.startsWith(`${group}:`));
    
    return (
      <Paper key={group} sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {group.charAt(0).toUpperCase() + group.slice(1)}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {groupPermissions.map(permission => {
            const action = permission.split(':')[1];
            const isSelected = roleFormData.permissions.includes(permission);
            
            return (
              <Chip
                key={permission}
                label={action}
                color={isSelected ? 'primary' : 'default'}
                onClick={() => handlePermissionToggle(permission)}
                sx={{ textTransform: 'capitalize' }}
              />
            );
          })}
        </Box>
      </Paper>
    );
  };

  // Get unique permission groups
  const permissionGroups = Array.from(new Set(availablePermissions.map((p) => p.split(':')[0])));

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

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
            <Tab label="Users" {...a11yProps(0)} />
            <Tab label="Roles" {...a11yProps(1)} />
            <Tab label="Invitations" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UsersTab
            users={users}
            loading={loading}
            fetchUsers={fetchUsers}
            openUserDialog={openUserDialog}
            handleDeleteUser={handleDeleteUser}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <RolesTab
            roles={roles}
            loading={loading}
            openRoleDialog={openRoleDialog}
            handleDeleteRole={handleDeleteRole}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
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
                {roles.map(role => (
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

      {/* Role Dialog */}
      <Dialog 
        open={roleDialogOpen} 
        onClose={closeRoleDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedRole ? 'Edit Role' : 'Add New Role'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Role Name"
              fullWidth
              value={roleFormData.name}
              onChange={(e) => handleRoleFormChange('name', e.target.value)}
              error={!!roleFormErrors.name}
              helperText={roleFormErrors.name}
            />
            
            <TextField
              label="Description"
              fullWidth
              value={roleFormData.description}
              onChange={(e) => handleRoleFormChange('description', e.target.value)}
            />
            
            <Typography variant="subtitle1" gutterBottom>
              Permissions
            </Typography>
            
            {roleFormErrors.permissions && (
              <FormHelperText error>{roleFormErrors.permissions}</FormHelperText>
            )}
            
            {permissionGroups.map(group => renderPermissionGroup(group))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDialog}>Cancel</Button>
          <Button 
            onClick={handleRoleSave} 
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
                {roles.map(role => (
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