import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Close as CloseIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { User } from '../../services/api.user';
import { useUserPermissions } from '../../hooks/useUserPermissions';

interface UserDetailsProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: (user: User) => void;
  onManageRoles?: (user: User) => void;
}

export const UserDetails: React.FC<UserDetailsProps> = ({
  open,
  onClose,
  user,
  onEdit,
  onManageRoles,
}) => {
  const { userRoles = [], isLoading: isLoadingRoles } = useUserPermissions(user?.userId);

  if (!user) return null;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleStatusColor = (userRole: any) => {
    if (!userRole.isActive) return 'default';
    if (userRole.isExpired) return 'error';
    if (userRole.isValid) return 'success';
    return 'warning';
  };

  const getRoleStatusLabel = (userRole: any) => {
    if (!userRole.isActive) return 'Inactive';
    if (userRole.isExpired) return 'Expired';
    if (userRole.isValid) return 'Active';
    return 'Pending';
  };

  const getRoleStatusIcon = (userRole: any) => {
    if (!userRole.isActive) return <CancelIcon />;
    if (userRole.isExpired) return <ScheduleIcon />;
    if (userRole.isValid) return <CheckIcon />;
    return <ScheduleIcon />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 40, height: 40 }}>
              {getInitials(user)}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {user.displayName || user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Basic Information & Account Info Combined */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {/* Basic Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Basic Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Display Name
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user.displayName || 'Not set'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body2">
                          {user.email}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body2">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || user.lastName || 'Not set'
                          }
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          <Chip
                            label={getStatusLabel(user)}
                            color={getStatusColor(user)}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Account Information */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Account Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Email Verified
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          <Chip
                            label={user.isEmailVerified ? 'Verified' : 'Unverified'}
                            color={user.isEmailVerified ? 'success' : 'warning'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Account Status
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Created At
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(user.updatedAt)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Last Login
                        </Typography>
                        <Typography variant="body2">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Roles */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1">
                    Assigned Roles ({userRoles.length})
                  </Typography>
                  {onManageRoles && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SecurityIcon />}
                      onClick={() => onManageRoles(user)}
                    >
                      Manage Roles
                    </Button>
                  )}
                </Box>
                
                {isLoadingRoles ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : userRoles.length === 0 ? (
                  <Alert severity="info" sx={{ py: 1 }}>
                    No roles assigned to this user
                  </Alert>
                ) : (
                  <List dense>
                    {userRoles.map((userRole: any) => (
                      <ListItem key={userRole.userRoleId} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getRoleStatusIcon(userRole)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight="medium">
                                {userRole.roleName || userRole.roleDisplayName}
                              </Typography>
                              <Chip
                                label={getRoleStatusLabel(userRole)}
                                color={getRoleStatusColor(userRole)}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Assigned: {formatDate(userRole.assignedAt)}
                              </Typography>
                              {userRole.expiresAt && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Expires: {formatDate(userRole.expiresAt)}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
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
        {onEdit && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => onEdit(user)}
          >
            Edit User
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
