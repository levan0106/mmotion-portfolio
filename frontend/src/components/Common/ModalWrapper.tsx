/**
 * Modal Wrapper Component
 * Reusable modal wrapper for consistent layout and styling across the application
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  showCloseButton?: boolean;
  disableCloseOnBackdrop?: boolean;
  disableCloseOnEscape?: boolean;
  titleColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  size?: 'small' | 'medium' | 'large';
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  open,
  onClose,
  title,
  icon,
  children,
  actions,
  loading = false,
  maxWidth = 'md',
  fullWidth = true,
  showCloseButton = true,
  disableCloseOnBackdrop = false,
  disableCloseOnEscape = false,
  titleColor = 'primary',
  size = 'medium',
}) => {
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getTitleColor = () => {
    switch (titleColor) {
      case 'primary':
        return 'primary.main';
      case 'secondary':
        return 'secondary.main';
      case 'error':
        return 'error.main';
      case 'warning':
        return 'warning.main';
      case 'info':
        return 'info.main';
      case 'success':
        return 'success.main';
      default:
        return 'primary.main';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          titlePadding: 2,
          contentPadding: 2,
          actionsPadding: 2,
        };
      case 'medium':
        return {
          titlePadding: 3,
          contentPadding: 3,
          actionsPadding: 3,
        };
      case 'large':
        return {
          titlePadding: 4,
          contentPadding: 4,
          actionsPadding: 4,
        };
      default:
        return {
          titlePadding: 3,
          contentPadding: 3,
          actionsPadding: 3,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Dialog
      open={open}
      onClose={disableCloseOnBackdrop ? undefined : handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableEscapeKeyDown={disableCloseOnEscape}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle
        sx={{
          p: sizeStyles.titlePadding,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {icon && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: getTitleColor(),
                flex: 1,
              }}
            >
              {title}
            </Typography>
          </Box>
          {showCloseButton && (
            <IconButton
              onClick={handleClose}
              disabled={loading}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'text.primary',
                },
                '&:disabled': {
                  color: 'text.disabled',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: sizeStyles.contentPadding,
          pt: 2,
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            p: sizeStyles.actionsPadding,
            pt: 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            gap: 1,
          }}
        >
          {actions}
        </DialogActions>
      )}

      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Dialog>
  );
};

export default ModalWrapper;
