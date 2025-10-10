import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { PermissionGate, RoleGate } from '../Common/PermissionGate';
import { useUserPermissions } from '../../hooks/useUserPermissions';

/**
 * Example component demonstrating permission-based UI rendering
 */
export const PermissionExample: React.FC = () => {
  const { userPermissions, userRoles, hasPermission, hasRole } = useUserPermissions();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Permission & Role Examples
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This component demonstrates how to use permission gates and role gates
        to conditionally render UI elements based on user permissions and roles.
      </Typography>

      <Stack spacing={3}>
        {/* User Info */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current User Permissions & Roles
            </Typography>
            {userRoles && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Roles ({userRoles.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {userRoles.map((userRole: any) => (
                    <Chip
                      key={userRole.userRoleId}
                      label={userRole.roleDisplayName}
                      color={userRole.isValid ? 'primary' : 'default'}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
            {userPermissions && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Permissions ({userPermissions.permissions.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {userPermissions.permissions.slice(0, 10).map((permission: any) => (
                    <Chip
                      key={permission}
                      label={permission}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                  {userPermissions.permissions.length > 10 && (
                    <Chip
                      label={`+${userPermissions.permissions.length - 10} more`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Permission-based Actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Permission-based Actions
            </Typography>
            <Stack spacing={2}>
              {/* Portfolio Management */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Portfolio Management
                </Typography>
                <Stack direction="row" spacing={1}>
                  <PermissionGate permission="portfolios.read">
                    <Button variant="outlined" size="small" startIcon={<PersonIcon />}>
                      View Portfolios
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate permission="portfolios.create">
                    <Button variant="contained" size="small" startIcon={<AddIcon />}>
                      Create Portfolio
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate permission="portfolios.update">
                    <Button variant="outlined" size="small" startIcon={<EditIcon />}>
                      Edit Portfolio
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate permission="portfolios.delete">
                    <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />}>
                      Delete Portfolio
                    </Button>
                  </PermissionGate>
                </Stack>
              </Box>

              <Divider />

              {/* Trading Operations */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Trading Operations
                </Typography>
                <Stack direction="row" spacing={1}>
                  <PermissionGate permission="trades.create">
                    <Button variant="contained" size="small">
                      Execute Trade
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate permission="trades.read">
                    <Button variant="outlined" size="small">
                      View Trades
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate permission="trades.approve">
                    <Button variant="outlined" color="warning" size="small">
                      Approve Trade
                    </Button>
                  </PermissionGate>
                </Stack>
              </Box>

              <Divider />

              {/* System Administration */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  System Administration
                </Typography>
                <Stack direction="row" spacing={1}>
                  <PermissionGate permission="users.create">
                    <Button variant="contained" size="small" startIcon={<PersonIcon />}>
                      Create User
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate permission="system.settings">
                    <Button variant="outlined" size="small" startIcon={<SettingsIcon />}>
                      System Settings
                    </Button>
                  </PermissionGate>
                  
                  <PermissionGate permission="system.logs">
                    <Button variant="outlined" size="small" startIcon={<SecurityIcon />}>
                      View Logs
                    </Button>
                  </PermissionGate>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Role-based Access */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Role-based Access
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Admin Functions
                </Typography>
                <Stack direction="row" spacing={1}>
                  <RoleGate role="admin">
                    <Button variant="contained" color="primary">
                      Admin Panel
                    </Button>
                  </RoleGate>
                  
                  <RoleGate role="super_admin">
                    <Button variant="contained" color="error">
                      Super Admin
                    </Button>
                  </RoleGate>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Analyst Functions
                </Typography>
                <Stack direction="row" spacing={1}>
                  <RoleGate role="analyst">
                    <Button variant="outlined" color="info">
                      Generate Reports
                    </Button>
                  </RoleGate>
                  
                  <RoleGate role="analyst">
                    <Button variant="outlined" color="info">
                      Data Analysis
                    </Button>
                  </RoleGate>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Investor Functions
                </Typography>
                <Stack direction="row" spacing={1}>
                  <RoleGate role="investor">
                    <Button variant="contained" color="success">
                      Manage Portfolio
                    </Button>
                  </RoleGate>
                  
                  <RoleGate role="investor">
                    <Button variant="outlined" color="success">
                      Execute Trades
                    </Button>
                  </RoleGate>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Multiple Permission Requirements */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Multiple Permission Requirements
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Require ALL permissions (AND logic)
                </Typography>
                <PermissionGate 
                  permissions={['portfolios.read', 'financial.read']}
                  requireAll={true}
                >
                  <Button variant="contained" color="secondary">
                    Advanced Portfolio Analysis
                  </Button>
                </PermissionGate>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Require ANY permission (OR logic)
                </Typography>
                <PermissionGate 
                  permissions={['trades.create', 'trades.approve']}
                  requireAll={false}
                >
                  <Button variant="outlined" color="warning">
                    Trading Operations
                  </Button>
                </PermissionGate>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Fallback Content */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Fallback Content
            </Typography>
            <Stack spacing={2}>
              <PermissionGate 
                permission="system.settings"
                fallback={
                  <Alert severity="warning">
                    You don't have permission to access system settings
                  </Alert>
                }
              >
                <Button variant="contained" color="primary">
                  Access System Settings
                </Button>
              </PermissionGate>

              <PermissionGate 
                permission="users.delete"
                fallback={
                  <Alert severity="info">
                    User deletion requires admin privileges
                  </Alert>
                }
              >
                <Button variant="contained" color="error">
                  Delete User
                </Button>
              </PermissionGate>
            </Stack>
          </CardContent>
        </Card>

        {/* Direct Permission Checks */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Direct Permission Checks
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                Can create portfolios: {hasPermission('portfolios.create') ? '✅ Yes' : '❌ No'}
              </Typography>
              <Typography variant="body2">
                Can delete users: {hasPermission('users.delete') ? '✅ Yes' : '❌ No'}
              </Typography>
              <Typography variant="body2">
                Can access system settings: {hasPermission('system.settings') ? '✅ Yes' : '❌ No'}
              </Typography>
              <Typography variant="body2">
                Has admin role: {hasRole('admin') ? '✅ Yes' : '❌ No'}
              </Typography>
              <Typography variant="body2">
                Has investor role: {hasRole('investor') ? '✅ Yes' : '❌ No'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
