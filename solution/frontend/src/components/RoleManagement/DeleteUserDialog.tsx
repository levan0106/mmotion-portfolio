import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
} from '@mui/icons-material';
import { User } from '../../services/api.user';
import { ResponsiveButton, ActionButton } from '../Common';

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (user: User) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  onClose,
  user,
  onConfirm,
  isLoading = false,
  error,
}) => {
  if (!user) return null;

  const handleConfirm = () => {
    onConfirm(user);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="error" />
          <Typography variant="h6">
            Delete User
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!!error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete this user? This action cannot be undone.
        </Typography>

        <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            User Information:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Name:</strong> {user.displayName || user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Email:</strong> {user.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Deleting this user will:
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Remove all role assignments</li>
            <li>Delete user data permanently</li>
            <li>Cannot be undone</li>
          </ul>
        </Alert>
      </DialogContent>

      <DialogActions>
        <ResponsiveButton 
          onClick={onClose} 
          disabled={isLoading}
          variant="outlined"
          forceTextOnly={true}
          mobileText="Cancel"
          desktopText="Cancel"
        >
          Cancel
        </ResponsiveButton>
        <ActionButton
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={isLoading}
          icon={isLoading ? <CircularProgress size={16} /> : undefined}
          forceTextOnly={true}
          mobileText={isLoading ? 'Deleting...' : 'Delete'}
          desktopText={isLoading ? 'Deleting...' : 'Delete User'}
        >
          {isLoading ? 'Deleting...' : 'Delete User'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
};
