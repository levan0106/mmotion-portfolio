import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useRoles } from '../../hooks/useRoles';
import { usePermissions } from '../../hooks/usePermissions';
import { SettingsApi, SystemSettings } from '../../services/api.settings';
import { ToastService } from '../../services/toast';
import { ResponsiveButton } from '../Common';

interface SettingsProps {
  // Props for settings configuration
}

export const Settings: React.FC<SettingsProps> = () => {
  const { roles, isLoading: isLoadingRoles } = useRoles();
  const { userPermissions, isLoading: isLoadingPermissions } = usePermissions();
  
  // Settings state - initialize with default values to avoid controlled/uncontrolled warnings
  const [roleHierarchyEnabled, setRoleHierarchyEnabled] = useState<boolean>(true);
  const [permissionInheritance, setPermissionInheritance] = useState<boolean>(true);
  const [autoRoleAssignment, setAutoRoleAssignment] = useState<boolean>(true);
  const [defaultRoleForNewUsers, setDefaultRoleForNewUsers] = useState<string>('investor');
  const [sessionTimeout, setSessionTimeout] = useState<number>(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState<number>(5);
  const [passwordExpiry, setPasswordExpiry] = useState<number>(90);
  
  // Loading settings from API
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  
  // Dialog states
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false);
  const [createPermissionDialogOpen, setCreatePermissionDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  
  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newPermissionName, setNewPermissionName] = useState('');
  const [bulkAction, setBulkAction] = useState('');
  
  // Loading and error states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        setSettingsError(null);
        
        const settings = await SettingsApi.getSettings();
        
        if (settings) {
          setRoleHierarchyEnabled(settings.roleHierarchyEnabled ?? true);
          setPermissionInheritance(settings.permissionInheritance ?? true);
          setAutoRoleAssignment(settings.autoRoleAssignment ?? true);
          setDefaultRoleForNewUsers(settings.defaultRoleForNewUsers ?? 'viewer');
          setSessionTimeout(settings.sessionTimeout ?? 30);
          setMaxLoginAttempts(settings.maxLoginAttempts ?? 5);
          setPasswordExpiry(settings.passwordExpiry ?? 90);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettingsError(error instanceof Error ? error.message : 'Failed to load settings');
        ToastService.error('Failed to load settings from server');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const settings: SystemSettings = {
        roleHierarchyEnabled,
        permissionInheritance,
        autoRoleAssignment,
        defaultRoleForNewUsers,
        sessionTimeout,
        maxLoginAttempts,
        passwordExpiry,
      };
      const response = await SettingsApi.updateSettings(settings);
      
      if (response.success) {
        setSaveSuccess(true);
        ToastService.success(`Settings saved successfully! New users will automatically be assigned the "${defaultRoleForNewUsers}" role.`);
        
        // Auto hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(response.message || 'Failed to save settings');
        ToastService.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      setSaveError(errorMessage);
      ToastService.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = () => {
    // TODO: Implement create role API call
    ToastService.success(`Role "${newRoleName}" created successfully!`);
    setCreateRoleDialogOpen(false);
    setNewRoleName('');
  };

  const handleCreatePermission = () => {
    // TODO: Implement create permission API call
    ToastService.success(`Permission "${newPermissionName}" created successfully!`);
    setCreatePermissionDialogOpen(false);
    setNewPermissionName('');
  };

  const handleBulkAction = () => {
    // TODO: Implement bulk action API call
    ToastService.info(`Bulk action "${bulkAction}" executed successfully!`);
    setBulkActionDialogOpen(false);
    setBulkAction('');
  };

  // Show loading state while fetching settings
  if (isLoadingSettings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <CircularProgress size={48} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Settings...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error state if settings failed to load
  if (settingsError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load settings: {settingsError}
        </Alert>
        <ResponsiveButton 
          variant="contained" 
          onClick={() => window.location.reload()}
          icon={<RefreshIcon />}
          mobileText="Retry"
          desktopText="Retry"
        >
          Retry
        </ResponsiveButton>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">
                  System Settings
                </Typography>
              </Box>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={roleHierarchyEnabled}
                      onChange={(e) => setRoleHierarchyEnabled(e.target.checked)}
                    />
                  }
                  label="Enable Role Hierarchy"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={permissionInheritance}
                      onChange={(e) => setPermissionInheritance(e.target.checked)}
                    />
                  }
                  label="Permission Inheritance"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRoleAssignment}
                      onChange={(e) => setAutoRoleAssignment(e.target.checked)}
                    />
                  }
                  label="Auto Role Assignment"
                />
                
                {autoRoleAssignment && (
                  <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                    <InputLabel>Default Role for New Users</InputLabel>
                    <Select
                      value={defaultRoleForNewUsers}
                      onChange={(e) => setDefaultRoleForNewUsers(e.target.value)}
                      label="Default Role for New Users"
                    >
                      {roles?.map((role: any) => (
                        <MenuItem key={role.roleId} value={role.name}>
                          {role.displayName} ({role.name})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SecurityIcon color="primary" />
                <Typography variant="h6">
                  Security Settings
                </Typography>
              </Box>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Session Timeout (minutes)"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  size="small"
                  fullWidth
                />
                
                <TextField
                  label="Max Login Attempts"
                  type="number"
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                  size="small"
                  fullWidth
                />
                
                <TextField
                  label="Password Expiry (days)"
                  type="number"
                  value={passwordExpiry}
                  onChange={(e) => setPasswordExpiry(Number(e.target.value))}
                  size="small"
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Role Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">
                    Role Management
                  </Typography>
                </Box>
                <ResponsiveButton
                  size="small"
                  icon={<AddIcon />}
                  mobileText="Add Role"
                  desktopText="Add Role"
                  onClick={() => setCreateRoleDialogOpen(true)}
                >
                  Add Role
                </ResponsiveButton>
              </Box>
              
              {isLoadingRoles ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  {roles?.slice(0, 5).map((role: any) => (
                    <ListItem key={role.roleId} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={role.displayName}
                        secondary={`${role.permissions?.length || 0} permissions`}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={role.isSystemRole ? 'System' : 'Custom'}
                          color={role.isSystemRole ? 'primary' : 'default'}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {roles && roles.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${roles.length - 5} more roles`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Permission Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6">
                    Permission Management
                  </Typography>
                </Box>
                <ResponsiveButton
                  size="small"
                  icon={<AddIcon />}
                  mobileText="Add Permission"
                  desktopText="Add Permission"
                  onClick={() => setCreatePermissionDialogOpen(true)}
                >
                  Add Permission
                </ResponsiveButton>
              </Box>
              
              {isLoadingPermissions ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <List dense>
                  {userPermissions?.slice(0, 5).map((permission: any) => (
                    <ListItem key={permission.permissionId} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">
                              {permission.displayName || permission.name}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                              ({permission.name})
                            </Typography>
                          </Box>
                        }
                        secondary={permission.description || permission.resource}
                      />
                      {/* <ListItemSecondaryAction>
                        <Box display="flex" gap={1}>
                          <Chip
                            label={permission.resource || 'Uncategorized'}
                            size="small"
                            color="secondary"
                          />
                          {permission.isSystemPermission && (
                            <Chip
                              label="System"
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      </ListItemSecondaryAction> */}
                    </ListItem>
                  ))}
                  {userPermissions && userPermissions.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${userPermissions.length - 5} more permissions`}
                        sx={{ fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Statistics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Statistics
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {roles?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Roles
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {userPermissions?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Permissions
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {roles?.filter((r: any) => r.isSystemRole).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      System Roles
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {roles?.filter((r: any) => !r.isSystemRole).length || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Custom Roles
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    System Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Perform bulk operations and system maintenance
                  </Typography>
                </Box>
                <Box display="flex" gap={2}>
                  <ResponsiveButton
                    variant="outlined"
                    icon={<RefreshIcon />}
                    mobileText="Refresh System"
                    desktopText="Refresh System"
                    onClick={() => window.location.reload()}
                  >
                    Refresh System
                  </ResponsiveButton>
                  <ResponsiveButton
                    variant="outlined"
                    icon={<WarningIcon />}
                    mobileText="Bulk Actions"
                    desktopText="Bulk Actions"
                    onClick={() => setBulkActionDialogOpen(true)}
                  >
                    Bulk Actions
                  </ResponsiveButton>
                  <ResponsiveButton
                    variant="contained"
                    icon={<SaveIcon />}
                    mobileText="Save Settings"
                    desktopText="Save Settings"
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </ResponsiveButton>
                </Box>
              </Box>
              
              {/* Success/Error Messages */}
              {saveSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Settings saved successfully! New users will automatically be assigned the "{defaultRoleForNewUsers}" role.
                </Alert>
              )}
              
              {saveError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {saveError}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Role Dialog */}
      <Dialog open={createRoleDialogOpen} onClose={() => setCreateRoleDialogOpen(false)}>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <ResponsiveButton onClick={() => setCreateRoleDialogOpen(false)}>Cancel</ResponsiveButton>
          <ResponsiveButton onClick={handleCreateRole} variant="contained">Create</ResponsiveButton>
        </DialogActions>
      </Dialog>

      {/* Create Permission Dialog */}
      <Dialog open={createPermissionDialogOpen} onClose={() => setCreatePermissionDialogOpen(false)}>
        <DialogTitle>Create New Permission</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Permission Name"
            fullWidth
            variant="outlined"
            value={newPermissionName}
            onChange={(e) => setNewPermissionName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <ResponsiveButton onClick={() => setCreatePermissionDialogOpen(false)}>Cancel</ResponsiveButton>
          <ResponsiveButton onClick={handleCreatePermission} variant="contained">Create</ResponsiveButton>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Select Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <MenuItem value="export">Export All Data</MenuItem>
              <MenuItem value="backup">Create Backup</MenuItem>
              <MenuItem value="cleanup">Cleanup Expired Roles</MenuItem>
              <MenuItem value="audit">Run Security Audit</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <ResponsiveButton onClick={() => setBulkActionDialogOpen(false)}>Cancel</ResponsiveButton>
          <ResponsiveButton onClick={handleBulkAction} variant="contained">Execute</ResponsiveButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
