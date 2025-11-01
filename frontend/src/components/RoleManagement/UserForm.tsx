import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  FormControlLabel,
  Switch,
  Paper,
} from '@mui/material';
import { User } from '../../services/api.user';
import { ResponsiveButton, ActionButton } from '../Common';
//import { AutoRoleAssignmentService } from '../../services/autoRoleAssignment';
//import { ToastService } from '../../services/toast';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  mode: 'create' | 'edit';
  onSubmit: (userData: Partial<User>) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const UserForm: React.FC<UserFormProps> = ({
  open,
  onClose,
  user,
  mode,
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    displayName: '',
    isActive: true,
    isEmailVerified: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || '',
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        displayName: '',
        isActive: true,
        isEmailVerified: false,
      });
    }
  }, [user, mode, open]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSwitchChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: event.target.checked }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.firstName && formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (formData.lastName && formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (formData.displayName && formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const userData = {
      email: formData.email.trim(),
      firstName: formData.firstName.trim() || undefined,
      lastName: formData.lastName.trim() || undefined,
      displayName: formData.displayName.trim() || undefined,
      isActive: formData.isActive,
      isEmailVerified: formData.isEmailVerified,
    };

    // Check auto role assignment for new users
    // if (mode === 'create') {
    //   const mockUser: User = {
    //     userId: 'temp',
    //     email: userData.email,
    //     firstName: userData.firstName,
    //     lastName: userData.lastName,
    //     displayName: userData.displayName,
    //     isActive: userData.isActive,
    //     isEmailVerified: userData.isEmailVerified,
    //     createdAt: new Date().toISOString(),
    //     updatedAt: new Date().toISOString(),
    //     department: undefined,
    //     position: undefined,
    //   };

    //   const roleAssignment = AutoRoleAssignmentService.determineRoleForUser(mockUser);
    //   if (roleAssignment.success) {
    //     ToastService.info(`User will be automatically assigned the "${roleAssignment.assignedRole}" role`);
    //   }
    // }

    onSubmit(userData);
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        displayName: '',
        isActive: true,
        isEmailVerified: false,
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        {mode === 'create' ? 'Create New User' : 'Edit User'}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!!error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={isLoading}
                  fullWidth
                  required
                />
                
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  disabled={isLoading}
                  fullWidth
                />
                
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  disabled={isLoading}
                  fullWidth
                />
                
                <TextField
                  label="Display Name"
                  value={formData.displayName}
                  onChange={handleInputChange('displayName')}
                  error={!!errors.displayName}
                  helperText={errors.displayName}
                  disabled={isLoading}
                  fullWidth
                />
              </Box>
            </Paper>
          </Grid>

          {/* Account Settings */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Account Settings
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleSwitchChange('isActive')}
                      disabled={isLoading}
                    />
                  }
                  label="Active Account"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isEmailVerified}
                      onChange={handleSwitchChange('isEmailVerified')}
                      disabled={isLoading}
                    />
                  }
                  label="Email Verified"
                />
              </Box>
            </Paper>
          </Grid>

          {/* Auto Role Assignment Info - Only for create mode */}
          {mode === 'create' && (
            <Grid item xs={12}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: 'primary.50', 
                border: '1px solid',
                borderColor: 'primary.200',
                borderRadius: 2
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.800' }}>
                  Auto Role Assignment
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                  This user will automatically be assigned the "Investor" role based on the current system configuration.
                </Typography>
                <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                  You can change the assigned role after creating the user.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <ResponsiveButton 
          onClick={handleClose} 
          disabled={isLoading}
          variant="outlined"
          forceTextOnly={true}
          mobileText="Cancel"
          desktopText="Cancel"
        >
          Cancel
        </ResponsiveButton>
        <ActionButton
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          icon={isLoading ? <CircularProgress size={16} /> : undefined}
          forceTextOnly={true}
          mobileText={isLoading 
            ? (mode === 'create' ? 'Creating...' : 'Updating...') 
            : (mode === 'create' ? 'Create User' : 'Update User')
          }
          desktopText={isLoading 
            ? (mode === 'create' ? 'Creating...' : 'Updating...') 
            : (mode === 'create' ? 'Create User' : 'Update User')
          }
        >
          {isLoading 
            ? (mode === 'create' ? 'Creating...' : 'Updating...') 
            : (mode === 'create' ? 'Create User' : 'Update User')
          }
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
};
