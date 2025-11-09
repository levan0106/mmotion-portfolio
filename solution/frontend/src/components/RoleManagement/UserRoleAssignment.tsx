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
  Alert,
  Card,
  CardContent,
  Grid,
  Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { Role } from '../../services/api.role';
import { User } from '../../services/api.user';
import { useRoles } from '../../hooks/useRoles';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface UserRoleAssignmentProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  open,
  onClose,
  user,
}) => {
  const { roles = [], isLoading: isLoadingRoles } = useRoles();
  const { userRoles = [], isLoading: isLoadingUserRoles, assignRole, removeRole, isAssigning, isRemoving } = useUserPermissions(user?.userId);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleAssignRole = async (role: Role) => {
    if (!user) return;
    
    try {
      await assignRole({ userId: user.userId, roleId: role.roleId });
      setSnackbarMessage(`Role "${role.displayName}" assigned successfully`);
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error assigning role:', error);
      setSnackbarMessage('Failed to assign role');
      setSnackbarOpen(true);
    }
  };

  const handleRemoveRole = async (userRoleId: string) => {
    try {
      await removeRole(userRoleId);
      setSnackbarMessage('Role removed successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error removing role:', error);
      setSnackbarMessage('Failed to remove role');
      setSnackbarOpen(true);
    }
  };

  const getInitials = (role: Role) => {
    return role.displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (userRole: any) => {
    if (!userRole.isActive) return 'default';
    if (userRole.isExpired) return 'error';
    if (userRole.isValid) return 'success';
    return 'warning';
  };

  const getStatusLabel = (userRole: any) => {
    if (!userRole.isActive) return 'Inactive';
    if (userRole.isExpired) return 'Expired';
    if (userRole.isValid) return 'Active';
    return 'Pending';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredRoles = roles.filter(role => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(query) ||
      role.displayName.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query)
    );
  });

  const availableRoles = filteredRoles.filter(role => 
    !userRoles.some(userRole => userRole.roleId === role.roleId)
  );

  const assignedRoles = userRoles.map(userRole => {
    const role = roles.find(r => r.roleId === userRole.roleId);
    return { ...userRole, role };
  }).filter(item => item.role);

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ width: 40, height: 40 }}>
            {user.displayName?.charAt(0) || user.email.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">
              Manage Roles - {user.displayName || user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Assigned Roles */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Assigned Roles ({assignedRoles.length})
                  </Typography>
                </Box>
                
                {isLoadingUserRoles ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : assignedRoles.length === 0 ? (
                  <Alert severity="info">
                    No roles assigned to this user
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Role</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Assigned</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignedRoles.map((userRole) => (
                          <TableRow key={userRole.userRoleId}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  {getInitials(userRole.role!)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {userRole.role!.displayName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {userRole.role!.name}
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
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(userRole.assignedAt)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveRole(userRole.userRoleId)}
                                disabled={isRemoving}
                                color="error"
                              >
                                <RemoveIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Available Roles */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Available Roles ({availableRoles.length})
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  placeholder="Search roles..."
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
                  sx={{ mb: 2 }}
                />

                {isLoadingRoles ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : availableRoles.length === 0 ? (
                  <Alert severity="info">
                    {searchQuery ? 'No roles found matching your search' : 'All roles are already assigned'}
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Role</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {availableRoles.map((role) => (
                          <TableRow key={role.roleId}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  {getInitials(role)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {role.displayName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {role.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={role.isSystemRole ? 'System' : 'Custom'}
                                color={role.isSystemRole ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleAssignRole(role)}
                                disabled={isAssigning}
                                color="primary"
                              >
                                <AddIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};