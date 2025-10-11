import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
  Slider,
  Tooltip,
  Grid,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useRoles } from '../../hooks/useRoles';
import { userRolesApi } from '../../services/api.userRoles';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../services/api.role';

interface RoleFormProps {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
  mode: 'create' | 'edit';
}

export const RoleForm: React.FC<RoleFormProps> = ({
  open,
  onClose,
  role,
  mode,
}) => {
  const { createRole, updateRole, isCreating, isUpdating, createError, updateError } = useRoles();
  
  const [permissions, setPermissions] = useState<any[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  
  // Fetch permissions when dialog opens
  useEffect(() => {
    const fetchPermissions = async () => {
      if (open) {
        setIsLoadingPermissions(true);
        try {
          const categories = await userRolesApi.getPermissionsByCategory();
          // Flatten all permissions from categories
          const allPermissions = categories.flatMap(category => 
            category.permissions.map((permission: any) => ({
              ...permission,
              category: category.name
            }))
          );
          setPermissions(allPermissions);
        } catch (error) {
          console.error('Error fetching permissions:', error);
          setPermissions([]);
        } finally {
          setIsLoadingPermissions(false);
        }
      }
    };

    fetchPermissions();
  }, [open]);
  
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    displayName: '',
    description: '',
    isSystemRole: false,
    priority: 0,
    permissionIds: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [permissionSearch, setPermissionSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    settings: true,
    permissions: true,
  });

  useEffect(() => {
    if (mode === 'edit' && role) {
      setFormData({
        name: role.name,
        displayName: role.displayName,
        description: role.description || '',
        isSystemRole: role.isSystemRole,
        priority: role.priority,
        permissionIds: role.permissions?.map(p => p.permissionId) || [],
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        isSystemRole: false,
        priority: 0,
        permissionIds: [],
      });
    }
    setErrors({});
  }, [mode, role, open]);

  const handleInputChange = (field: keyof CreateRoleRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSwitchChange = (field: keyof CreateRoleRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked;
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSliderChange = (field: keyof CreateRoleRequest) => (
    _event: Event,
    newValue: number | number[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: newValue as number }));
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: checked
        ? [...(prev.permissionIds || []), permissionId]
        : (prev.permissionIds || []).filter(id => id !== permissionId)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Role name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    } else if (!/^[a-z_]+$/.test(formData.name)) {
      newErrors.name = 'Role name must contain only lowercase letters and underscores';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Role name must be at least 3 characters long';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Role name must be less than 50 characters';
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 3) {
      newErrors.displayName = 'Display name must be at least 3 characters long';
    } else if (formData.displayName.length > 100) {
      newErrors.displayName = 'Display name must be less than 100 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Priority validation
    if ((formData.priority || 0) < 0 || (formData.priority || 0) > 100) {
      newErrors.priority = 'Priority must be between 0 and 100';
    }

    // Permission validation
    if (!formData.permissionIds || formData.permissionIds.length === 0) {
      newErrors.permissions = 'At least one permission must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (mode === 'create') {
        await createRole(formData);
      } else if (role) {
        const updateData: UpdateRoleRequest = {
          displayName: formData.displayName,
          description: formData.description,
          priority: formData.priority,
        };
        await updateRole({ roleId: role.roleId, roleData: updateData });
      }
      onClose();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const isLoading = isCreating || isUpdating;
  const error = createError || updateError;

  // Filter permissions based on search
  const filteredPermissions = permissions?.filter((permission: any) => {
    if (!permissionSearch) return true;
    const searchLower = permissionSearch.toLowerCase();
    return (
      permission.name.toLowerCase().includes(searchLower) ||
      permission.displayName.toLowerCase().includes(searchLower) ||
      permission.description?.toLowerCase().includes(searchLower) ||
      permission.category.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Group permissions by category
  const permissionsByCategory = filteredPermissions.reduce((acc: any, permission: any) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    // console.log('permission', permission);
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, any>);

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
        {mode === 'create' ? 'Create New Role' : 'Edit Role'}
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {!!error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error occurred
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Basic Info & Settings */}
          <Grid item xs={12} md={5}>
            {/* Basic Information */}
            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">
                  Basic Information
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setExpandedSections(prev => ({ ...prev, basic: !prev.basic }))}
                >
                  {expandedSections.basic ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.basic}>
                <Stack spacing={2}>
                  <TextField
                    label="Role Name"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={!!errors.name}
                    helperText={errors.name || 'Use lowercase letters and underscores only'}
                    disabled={mode === 'edit' || isLoading}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Display Name"
                    value={formData.displayName}
                    onChange={handleInputChange('displayName')}
                    error={!!errors.displayName}
                    helperText={errors.displayName}
                    disabled={isLoading}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Description"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    multiline
                    rows={2}
                    disabled={isLoading}
                    error={!!errors.description}
                    helperText={errors.description || `${(formData.description || '').length}/500 characters`}
                    fullWidth
                    size="small"
                  />
                </Stack>
              </Collapse>
            </Paper>

            {/* Role Settings */}
            <Paper sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">
                  Role Settings
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setExpandedSections(prev => ({ ...prev, settings: !prev.settings }))}
                >
                  {expandedSections.settings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.settings}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isSystemRole}
                        onChange={handleSwitchChange('isSystemRole')}
                        disabled={mode === 'edit' || isLoading}
                        size="small"
                      />
                    }
                    label="System Role"
                  />
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Priority: {formData.priority}
                    </Typography>
                    <Slider
                      value={formData.priority}
                      onChange={handleSliderChange('priority')}
                      min={0}
                      max={100}
                      step={1}
                      marks={[
                        { value: 0, label: 'Low' },
                        { value: 50, label: 'Medium' },
                        { value: 100, label: 'High' },
                      ]}
                      disabled={isLoading}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Collapse>
            </Paper>
          </Grid>

          {/* Right Column - Permissions */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%', minHeight: '60vh' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  Permissions ({formData.permissionIds?.length || 0} selected)
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setExpandedSections(prev => ({ ...prev, permissions: !prev.permissions }))}
                >
                  {expandedSections.permissions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              {errors.permissions && (
                <Typography variant="caption" color="error" display="block" mb={1}>
                  {errors.permissions}
                </Typography>
              )}
              <Collapse in={expandedSections.permissions}>
                <Box display="flex" gap={2} mb={3}>
                  <TextField
                  label="Search permissions"
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  size="small"
                  sx={{ flexGrow: 1 }}
                  placeholder="Search by name, display name, or category..."
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const allPermissionIds = filteredPermissions.map((p: any) => p.permissionId);
                    setFormData(prev => ({ ...prev, permissionIds: allPermissionIds }));
                  }}
                  disabled={isLoading}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setFormData(prev => ({ ...prev, permissionIds: [] }))}
                  disabled={isLoading}
                >
                  Clear All
                </Button>
              </Box>
              {isLoadingPermissions ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                    <Box key={category} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mb: 2 }}>
                        {category.replace(/_/g, ' ').toUpperCase()}                        
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {(categoryPermissions as any[]).map((permission: any, index: number) => (
                          <Tooltip
                            key={permission.permissionId || `${category}-${index}`}
                            title={
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {permission.displayName}
                                </Typography>
                                <Typography variant="body2">
                                  {permission.description || 'No description available'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Priority: {permission.priority}
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="top"
                          >
                            <Chip
                              label={permission.displayName}
                              color={(formData.permissionIds || []).includes(permission.permissionId) ? 'primary' : 'default'}
                              variant={(formData.permissionIds || []).includes(permission.permissionId) ? 'filled' : 'outlined'}
                              onClick={() => handlePermissionChange(
                                permission.permissionId,
                                !(formData.permissionIds || []).includes(permission.permissionId)
                              )}
                              disabled={isLoading}
                              sx={{
                                '&:hover': {
                                  backgroundColor: (formData.permissionIds || []).includes(permission.permissionId) 
                                    ? 'primary.dark' 
                                    : 'action.hover'
                                }
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              </Collapse>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
        >
          {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Role' : 'Update Role')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
