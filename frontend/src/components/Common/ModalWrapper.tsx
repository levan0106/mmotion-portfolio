/**
 * Modal Wrapper Component
 * Reusable modal wrapper for consistent layout and styling across the application
 * 
 * Features:
 * - Automatic mobile detection with autoMobileDetection prop (default: true)
 * - Responsive layout that automatically switches to fullScreen on mobile
 * - Customizable mobile breakpoint with mobileBreakpoint prop (default: 'sm')
 * - Manual override available by setting autoMobileDetection={false}
 * 
 * Usage:
 * - Default behavior: <ModalWrapper> - automatically detects mobile and adjusts layout
 * - Manual control: <ModalWrapper autoMobileDetection={false} fullScreen={true}>
 * - Custom breakpoint: <ModalWrapper mobileBreakpoint="md">
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | false;
  fullWidth?: boolean;
  fullScreen?: boolean;
  showCloseButton?: boolean;
  disableCloseOnBackdrop?: boolean;
  disableCloseOnEscape?: boolean;
  titleColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  size?: 'small' | 'medium' | 'large';
  hideHeader?: boolean; // Hide the entire header section
  // Auto mobile detection options
  autoMobileDetection?: boolean; // Enable automatic mobile detection
  mobileBreakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Breakpoint for mobile detection
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
  fullScreen = false,
  showCloseButton = true,
  disableCloseOnBackdrop = false,
  disableCloseOnEscape = false,
  titleColor = 'primary',
  size = 'medium',
  hideHeader = false,
  autoMobileDetection = true,
  mobileBreakpoint = 'sm',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));
  
  // Auto-detect mobile behavior if enabled
  const effectiveFullScreen = autoMobileDetection ? isMobile : fullScreen;
  const effectiveFullWidth = autoMobileDetection ? true : fullWidth;
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
      maxWidth={maxWidth === 'xxl' ? 'xl' : maxWidth}
      fullWidth={effectiveFullWidth}
      fullScreen={effectiveFullScreen}
      disableEscapeKeyDown={disableCloseOnEscape}
      PaperProps={{
        sx: {
          borderRadius: effectiveFullScreen ? 0 : 2,
          boxShadow: effectiveFullScreen ? 'none' : '0 8px 32px rgba(0,0,0,0.12)',
          // Force consistent width across different content
          width: effectiveFullScreen ? '100%' : 
                 maxWidth === 'xs' ? '400px' : 
                 maxWidth === 'sm' ? '500px' : 
                 maxWidth === 'md' ? '700px!important' : 
                 maxWidth === 'lg' ? '900px' : 
                 maxWidth === 'xl' ? '100%' : 
                 maxWidth === 'xxl' ? '100%' : '700px!important',
          minWidth: effectiveFullScreen ? 'auto' : 
                   maxWidth === 'xs' ? '400px' : 
                   maxWidth === 'sm' ? '500px' : 
                   maxWidth === 'md' ? '700px!important' : 
                   maxWidth === 'lg' ? '900px' : 
                   maxWidth === 'xl' ? 'auto' : 
                   maxWidth === 'xxl' ? 'auto' : '700px!important',
          maxWidth: effectiveFullScreen ? '100%' : 
                   maxWidth === 'xs' ? '400px' : 
                   maxWidth === 'sm' ? '500px' : 
                   maxWidth === 'md' ? '700px!important' : 
                   maxWidth === 'lg' ? '900px' : 
                   maxWidth === 'xl' ? '1200px' : 
                   maxWidth === 'xxl' ? '1400px' : '700px!important',
        }
      }}
    >
      {!hideHeader && (
        <DialogTitle
          sx={{
            p: sizeStyles.titlePadding,
            py: 1,
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
              <Box
                sx={{
                  fontWeight: 500,
                  color: getTitleColor(),
                  flex: 1,
                  fontSize: '1.25rem',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Box>
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
      )}

      <DialogContent
        sx={{
          p: sizeStyles.contentPadding,
          py: 2,
          mt: 2,
          backgroundColor: 'background.paper',
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            p: sizeStyles.actionsPadding,
            py: 1,
            mt: 1,
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
