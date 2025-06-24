import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
  SelectChangeEvent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import LockResetIcon from '@mui/icons-material/LockReset';
import DataTable, { Column } from '../shared/DataTable';
import { useTheme } from '../../contexts/ThemeContext';
import { userManagementService, User } from '../../services/api';
import { useAccessControl } from '../../hooks/useAccessControl';

interface UserListProps {
  companyId?: string;
  onAddUser?: () => void;
  onEditUser?: (userId: string) => void;
  onInviteUser?: () => void;
  onResetPassword?: (userId: string) => void;
  maxHeight?: number | string;
  hideActions?: boolean;
  roleFilter?: string;
  statusFilter?: string;
  isAdminView?: boolean;
}

const UserList: React.FC<UserListProps> = ({
  companyId,
  onAddUser,
  onEditUser,
  onInviteUser,
  onResetPassword,
  maxHeight,
  hideActions = false,
  roleFilter,
  statusFilter,
  isAdminView = false,
}) => {
  const { theme: whitelabelTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const { canPerform } = useAccessControl();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null);
  const [selectedRole, setSelectedRole] = useState(roleFilter || '');
  const [selectedStatus, setSelectedStatus] = useState(statusFilter || '');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Custom button style based on the whitelabel theme
  const buttonStyle = {
    backgroundColor: whitelabelTheme?.primaryColor || muiTheme.palette.primary.main,
    color: '#fff',
    borderRadius: whitelabelTheme?.buttonRadius !== undefined ? `${whitelabelTheme.buttonRadius}px` : undefined,
    '&:hover': {
      backgroundColor: whitelabelTheme?.primaryColor ? 
        `${whitelabelTheme.primaryColor}dd` : muiTheme.palette.primary.dark,
    },
  };

  const fetchUsers = useCallback(async (isSearchRequest = false) => {
    if (isSearchRequest && isSearching) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        company_id: companyId,
      };

      if (isSearchRequest) {
        setIsSearching(true);
      }      const response = await userManagementService.getUsers(params);
      
      setUsers(response.data?.users || []);
      setTotalCount(response.data?.pagination?.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      console.error('Error fetching users:', err);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      if (isSearchRequest) {
        setIsSearching(false);
      }
    }
  }, [page, rowsPerPage, searchTerm, selectedRole, selectedStatus, companyId, isSearching]);

  useEffect(() => {
    if (!isSearching) {
      fetchUsers();
    }
  }, [fetchUsers]);

  // Debounced search with cleanup
  useEffect(() => {
    if (!searchTerm && page !== 0) {
      setPage(0);
      return;
    }

    if (searchAbortController) {
      searchAbortController.abort();
    }

    const newController = new AbortController();
    setSearchAbortController(newController);

    const timer = setTimeout(() => {
      if (searchTerm) {
        fetchUsers(true);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      newController.abort();
    };
  }, [searchTerm, page, fetchUsers]);

  // Reset pagination when filters change
  useEffect(() => {
    if (page !== 0) {
      setPage(0);
    }
  }, [selectedRole, selectedStatus]);

  const handleSearch = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    if (!newSearchTerm) {
      setUsers([]);
      setTotalCount(0);
      fetchUsers();
    }
  }, [fetchUsers]);

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    const newRole = event.target.value;
    if (newRole === selectedRole) return;
    setSelectedRole(newRole);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    const newStatus = event.target.value;
    if (newStatus === selectedStatus) return;
    setSelectedStatus(newStatus);
  };

  const getRoleChip = (role: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    switch (role.toLowerCase()) {
      case 'admin':
        color = 'error';
        break;
      case 'manager':
        color = 'primary';
        break;
      case 'staff':
        color = 'info';
        break;
      case 'supplier':
        color = 'secondary';
        break;
      case 'dealer':
        color = 'success';
        break;
    }
    
    return <Chip label={role} color={color} size="small" />;
  };

  const getStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    switch (status.toLowerCase()) {
      case 'active':
        color = 'success';
        break;
      case 'inactive':
        color = 'default';
        break;
      case 'pending':
        color = 'warning';
        break;
      case 'suspended':
        color = 'error';
        break;
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus.toLowerCase() === 'suspended' ? 'active' : 'suspended';
      await userManagementService.updateUserStatus(userId, newStatus);
      
      // Update local state optimistically
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus }
            : user
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
      console.error('Error updating user status:', err);
      // Revert on error
      fetchUsers();
    }
  };

  // Define columns for the users table
  const columns: Column[] = [
    { 
      id: 'firstName', 
      label: 'First Name', 
      minWidth: 100
    },
    { 
      id: 'lastName', 
      label: 'Last Name', 
      minWidth: 100
    },
    { 
      id: 'email', 
      label: 'Email', 
      minWidth: 170,
    },
    {
      id: 'role',
      label: 'Role',
      minWidth: 120,
      format: (value) => getRoleChip(value)
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value) => getStatusChip(value)
    }
  ];

  // Add company column only for admin view
  if (isAdminView) {
    columns.splice(3, 0, { 
      id: 'company', 
      label: 'Company', 
      minWidth: 150,
      format: (value) => value?.name || 'N/A'
    });
  }

  // Add actions column if actions are enabled
  if (!hideActions) {
    columns.push({
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'right',      format: (_, row) => (
        <Box>
          {onEditUser && canPerform('user:edit') && (
            <Tooltip title="Edit User">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                onEditUser(row.id);
              }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onResetPassword && canPerform('user:edit') && (
            <Tooltip title="Reset Password">
              <IconButton size="small" onClick={(e) => {
                e.stopPropagation();
                onResetPassword(row.id);
              }}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}          {canPerform('user:edit') && (
            <Tooltip title={row.status === 'suspended' ? 'Activate User' : 'Suspend User'}>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSuspendUser(row.id, row.status);
                }}
                color={row.status === 'suspended' ? 'success' : 'default'}
              >
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    });
  }

  return (
    <Box sx={{ maxHeight }}>
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
        <Typography variant="h6" component="h2">
          Users
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search users..."
              size="small"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => handleSearch('')}>
                      Clear
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={selectedRole}
                onChange={handleRoleChange}
                label="Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="supplier">Supplier</MenuItem>
                <MenuItem value="dealer">Dealer</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={selectedStatus}
                onChange={handleStatusChange}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {!hideActions && (
            <Box sx={{ display: 'flex', gap: 2 }}>              
            {onInviteUser && canPerform('user:create') && (
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={onInviteUser}
                >
                  Invite User
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        error={error}
        onRowClick={(row) => onEditUser && onEditUser(row.id)}
        pagination={{
          page,
          totalCount,
          rowsPerPage,
          onPageChange: (newPage) => setPage(newPage),
          onRowsPerPageChange: (newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage);
            setPage(0);
          },
        }}
      />
    </Box>
  );
};

export default UserList;