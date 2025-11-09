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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Role } from '../../services/api.role';

interface RoleDetailsProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  onEdit?: (role: Role) => void;
  onManagePermissions?: (role: Role) => void;
  onManageUsers?: (role: Role) => void;
}

export const RoleDetails: React.FC<RoleDetailsProps> = ({
  open,
  onClose,
  role,
  onEdit,
  onManagePermissions,
  onManageUsers,
}) => {
  if (!role) return null;

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'error';
    if (priority >= 70) return 'warning';
    if (priority >= 50) return 'info';
    return 'default';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 90) return 'Critical';
    if (priority >= 70) return 'High';
    if (priority >= 50) return 'Medium';
    return 'Low';
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

  const getPermissionCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'user_management': '#e3f2fd',
      'portfolio_management': '#f3e5f5',
      'trading_operations': '#e8f5e8',
      'asset_management': '#fff3e0',
      'financial_data': '#fce4ec',
      'system_administration': '#f1f8e9',
    };
    return colors[category] || '#f5f5f5';
  };

  const getCategoryDisplayName = (category: string) => {
    const names: Record<string, string> = {
      'user_management': 'User Management',
      'portfolio_management': 'Portfolio Management',
      'trading_operations': 'Trading Operations',
      'asset_management': 'Asset Management',
      'financial_data': 'Financial Data',
      'system_administration': 'System Administration',
    };
    return names[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Group permissions by category
  const permissionsByCategory = role.permissions?.reduce((acc: any, permission: any) => {
    const category = permission.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {}) || {};

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
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">
              {role.displayName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          {/* Basic Information & Metadata - Compact Layout */}
          <Grid item xs={12}>
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Grid container spacing={2}>
                  {/* Basic Information - Left Column */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Basic Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Role Name
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {role.name}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Description
                        </Typography>
                        <Typography variant="body2">
                          {role.description || 'No description provided'}
                        </Typography>
                      </Box>

                      <Box display="flex" gap={1} alignItems="center">
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Priority
                          </Typography>
                          <Chip
                            label={`${getPriorityLabel(role.priority)} (${role.priority})`}
                            color={getPriorityColor(role.priority)}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Type
                          </Typography>
                          <Chip
                            label={role.isSystemRole ? 'System Role' : 'Custom Role'}
                            color={role.isSystemRole ? 'primary' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Metadata - Right Column */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Metadata
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Created At
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(role.createdAt)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Last Updated
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(role.updatedAt)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Total Permissions
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {role.permissions?.length || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Permissions */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Permissions ({role.permissions?.length || 0})
                  </Typography>
                  {onManagePermissions && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SecurityIcon />}
                      onClick={() => onManagePermissions(role)}
                    >
                      Manage Permissions
                    </Button>
                  )}
                </Box>

                {Object.keys(permissionsByCategory).length > 0 ? (
                  <Box>
                    {Object.entries(permissionsByCategory).map(([category, permissions]: [string, any]) => (
                      <Box key={category} mb={2}>
                        <Box
                          sx={{
                            backgroundColor: getPermissionCategoryColor(category),
                            padding: 1,
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="medium">
                            {getCategoryDisplayName(category)} ({permissions.length})
                          </Typography>
                        </Box>
                        <List dense sx={{ py: 0 }}>
                          {permissions.map((permission: any) => (
                            <ListItem key={permission.permissionId} sx={{ py: 0.25, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <SecurityIcon fontSize="small" color="action" />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" fontWeight="medium">
                                    {permission.displayName}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {permission.description || permission.name}
                                  </Typography>
                                }
                              />
                              <Chip
                                label={permission.priority}
                                size="small"
                                variant="outlined"
                                color={permission.priority >= 90 ? 'error' : permission.priority >= 70 ? 'warning' : 'default'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No permissions assigned to this role.
                  </Typography>
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
        {onManageUsers && (
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => onManageUsers(role)}
          >
            Manage Users
          </Button>
        )}
        {onEdit && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => onEdit(role)}
          >
            Edit Role
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
