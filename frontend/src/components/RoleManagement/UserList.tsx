import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
// import { useUsers } from '../../hooks/useUsers'; // Removed - using props instead
import { User } from '../../services/api.user';
import { DeleteUserDialog } from './DeleteUserDialog';
import { ToastService } from '../../services/toast';

interface UserListProps {
  onEditUser?: (user: User) => void;
  onViewUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  onManageRoles?: (user: User) => void;
  page?: number;
  rowsPerPage?: number;
  total?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  users?: User[];
  isLoading?: boolean;
  error?: any;
  refetch?: () => void;
}

export const UserList: React.FC<UserListProps> = ({
  onEditUser,
  onViewUser,
  onDeleteUser,
  onManageRoles,
  page = 0,
  rowsPerPage = 10,
  total = 0,
  onPageChange,
  onRowsPerPageChange,
  users = [],
  isLoading = false,
  error = null,
  refetch = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleMenuCloseWithFocus = () => {
    setAnchorEl(null);
    setSelectedUser(null);
    // Ensure focus is properly managed when menu closes
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }, 100);
  };

  const handleEdit = () => {
    if (selectedUser && onEditUser) {
      onEditUser(selectedUser);
    }
    handleMenuCloseWithFocus();
  };

  const handleView = () => {
    if (selectedUser && onViewUser) {
      onViewUser(selectedUser);
    }
    handleMenuCloseWithFocus();
  };

  const handleDelete = () => {
    if (selectedUser) {
      setDeleteDialogOpen(true);
      // Close menu but keep selectedUser for dialog
      setAnchorEl(null);
    }
  };

  const handleDeleteConfirm = async (user: User) => {
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      if (onDeleteUser) {
        await onDeleteUser(user);
        ToastService.success(`User "${user.displayName || user.email}" deleted successfully`);
        setDeleteDialogOpen(false);
        setSelectedUser(null); // Reset selected user after successful deletion
        refetch(); // Refresh the user list
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      setDeleteError(errorMessage);
      ToastService.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
    // Don't reset selectedUser immediately, let it reset after dialog closes
    setTimeout(() => {
      setSelectedUser(null);
    }, 100);
  };

  const handleManageRoles = () => {
    if (selectedUser && onManageRoles) {
      onManageRoles(selectedUser);
    }
    handleMenuCloseWithFocus();
  };

  const getInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getStatusColor = (user: User) => {
    if (!user.isActive) return 'default';
    if (!user.isEmailVerified) return 'warning';
    return 'success';
  };

  const getStatusLabel = (user: User) => {
    if (!user.isActive) return 'Inactive';
    if (!user.isEmailVerified) return 'Unverified';
    return 'Active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search and Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterListIcon />}
          >
            Filters
          </Button>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow 
                key={user.userId} 
                hover 
                onClick={() => onViewUser?.(user)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {getInitials(user)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.displayName || user.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email
                        }
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(user)}
                    color={getStatusColor(user)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(user.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, user);
                    }}
                    aria-label={`Actions for ${user.displayName || user.email}`}
                    aria-haspopup="menu"
                    aria-expanded={Boolean(anchorEl)}
                    id={`user-actions-${user.userId}`}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total || users?.length || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange || (() => {})}
        onRowsPerPageChange={onRowsPerPageChange || (() => {})}
      />

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" p={4}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No users found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery ? 'Try adjusting your search criteria' : 'No users in the system'}
          </Typography>
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        MenuListProps={{
          'aria-labelledby': selectedUser ? `user-actions-${selectedUser.userId}` : undefined,
          role: 'menu',
        }}
        slotProps={{
          paper: {
            'aria-hidden': false,
          },
        }}
        disableAutoFocusItem
        keepMounted={false}
      >
        <MenuItem onClick={handleView}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleManageRoles}>
          <SecurityIcon sx={{ mr: 1 }} />
          Manage Roles
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Delete User Dialog */}
      <DeleteUserDialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        user={selectedUser}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteLoading}
        error={deleteError}
      />

    </Box>
  );
};
