import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Role } from '../../services/api.role';
import { AssignUserDialog } from './AssignUserDialog';
import { useRoleUsers } from '../../hooks/useUsers';

interface User {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserRole {
  userRoleId: string;
  userId: string;
  roleId: string;
  roleName?: string;
  roleDisplayName?: string;
  assignedBy?: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  isValid: boolean;
  isExpired: boolean;
  user?: User;
  // Direct user fields from API
  username?: string;
  fullName?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  lastLoginAt?: string;
}

interface UserRoleManagerProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  open,
  onClose,
  role,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole | null>(null);
  const [assignUserDialogOpen, setAssignUserDialogOpen] = useState(false);

  // Use real API hook
  const {
    usersWithRole,
    roleStats,
    isLoading: isLoadingUsers,
    isBulkAssigning,
    removeUserFromRole,
    updateUserRole,
    bulkAssignUsers,
  } = useRoleUsers(role?.roleId);

  // Real data comes from useRoleUsers hook

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userRole: UserRole) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserRole(userRole);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserRole(null);
  };


  const handleRemoveUser = (userRoleId: string) => {
    removeUserFromRole(userRoleId);
    handleMenuClose();
  };

  const handleUpdateUserRole = (userRoleId: string, updates: any) => {
    updateUserRole({ userRoleId, updates });
    handleMenuClose();
  };

  const filteredUsersWithRole = usersWithRole.filter((userRole: any) => {
    const matchesSearch = !searchQuery || 
      userRole.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userRole.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userRole.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userRole.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userRole.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userRole.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && userRole.isActive && !userRole.isExpired) ||
      (filterStatus === 'expired' && userRole.isExpired) ||
      (filterStatus === 'inactive' && !userRole.isActive);

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (userRole: UserRole) => {
    if (userRole.isActive || userRole.isValid) return 'success';
    if (userRole.isExpired) return 'warning';
    return 'error';
  };

  const getStatusLabel = (userRole: UserRole) => {
    if (userRole.isActive || userRole.isValid) return 'Active';
    if (userRole.isExpired) return 'Expired';
    return 'Inactive';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (userRole: any) => {
    // Try to get initials from firstName and lastName
    if (userRole?.firstName && userRole?.lastName && userRole?.firstName.trim() && userRole?.lastName.trim()) {
      return `${userRole?.firstName[0]}${userRole?.lastName[0]}`.toUpperCase();
    }
    
    // Try to get initials from displayName or fullName
    const displayName = userRole?.displayName || userRole?.fullName;
    if (displayName && displayName.trim()) {
      const nameParts = displayName.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return displayName[0].toUpperCase();
    }
    
    // Fallback to username
    if (userRole?.username && userRole?.username.trim()) {
      return userRole.username[0].toUpperCase();
    }
    
    // Fallback to email
    if (userRole?.email && userRole?.email.trim()) {
      return userRole.email[0].toUpperCase();
    }
    
    // Final fallback
    return 'U';
  };

  const activeUsersCount = roleStats?.activeUsers || 0;
  const expiredUsersCount = roleStats?.expiredUsers || 0;
  const inactiveUsersCount = roleStats?.inactiveUsers || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="primary" />
            <Typography variant="h6">
              Manage Users - {role?.displayName}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => setAssignUserDialogOpen(true)}
            >
              Add User
            </Button>
            <IconButton size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckIcon color="success" />
                  <Typography variant="h6">{activeUsersCount}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <CancelIcon color="warning" />
                  <Typography variant="h6">{expiredUsersCount}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Expired Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonRemoveIcon color="error" />
                  <Typography variant="h6">{inactiveUsersCount}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Inactive Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filter */}
        <Box display="flex" gap={2} mb={2}>
          <TextField
            label="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder="Search by name or email..."
          />
          <TextField
            select
            label="Filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Users</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Box>

        {/* Users Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned Date</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoadingUsers ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredUsersWithRole.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsersWithRole.map((userRole: any) => (
                  <TableRow key={userRole.userRoleId}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {getInitials(userRole)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {userRole.displayName || userRole.fullName || userRole.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {userRole.email || userRole.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(userRole)}
                        color={getStatusColor(userRole)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(userRole?.assignedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {userRole.expiresAt ? (
                        <Typography variant="body2">
                          {formatDate(userRole.expiresAt)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Never
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {userRole.lastLoginAt ? (
                        <Typography variant="body2">
                          {formatDate(userRole.lastLoginAt)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Never
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, userRole)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

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
        >
          <MenuItem onClick={() => handleUpdateUserRole(selectedUserRole!.userRoleId, { isActive: !selectedUserRole!.isActive })}>
            <ListItemIcon>
              {selectedUserRole?.isActive ? <PersonRemoveIcon /> : <PersonAddIcon />}
            </ListItemIcon>
            <ListItemText>
              {selectedUserRole?.isActive ? 'Deactivate' : 'Activate'}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleUpdateUserRole(selectedUserRole!.userRoleId, { expiresAt: null })}>
            <ListItemIcon>
              <CalendarIcon />
            </ListItemIcon>
            <ListItemText>Remove Expiration</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => handleRemoveUser(selectedUserRole!.userRoleId)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <PersonRemoveIcon color="error" />
            </ListItemIcon>
            <ListItemText>Remove from Role</ListItemText>
          </MenuItem>
        </Menu>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setAssignUserDialogOpen(true)}
        >
          Add Multiple Users
        </Button>
      </DialogActions>

      {/* Assign User Dialog */}
      <AssignUserDialog
        open={assignUserDialogOpen}
        onClose={() => setAssignUserDialogOpen(false)}
        role={role}
        onAssignUsers={(userIds, expiresAt) => {
          if (role) {
            bulkAssignUsers({ userIds, expiresAt });
            setAssignUserDialogOpen(false);
          }
        }}
        isLoading={isBulkAssigning}
      />
    </Dialog>
  );
};
