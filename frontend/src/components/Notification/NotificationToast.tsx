import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
  ShowChart as ShowChartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Notification } from '../../contexts/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'trade':
      return <TrendingUpIcon />;
    case 'portfolio':
      return <AccountBalanceIcon />;
    case 'system':
      return <SettingsIcon />;
    case 'market':
      return <ShowChartIcon />;
    default:
      return <SettingsIcon />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'trade':
      return 'success';
    case 'portfolio':
      return 'info';
    case 'system':
      return 'warning';
    case 'market':
      return 'primary';
    default:
      return 'info';
  }
};

const getNotificationSeverity = (type: string) => {
  switch (type) {
    case 'trade':
      return 'success';
    case 'portfolio':
      return 'info';
    case 'system':
      return 'warning';
    case 'market':
      return 'info';
    default:
      return 'info';
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  open,
  onClose,
  onAction,
}) => {
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [showFullMessage, setShowFullMessage] = useState(false);
  
  // Truncate message if too long (more compact)
  const MAX_MESSAGE_LENGTH = 80;
  const isMessageLong = notification.message.length > MAX_MESSAGE_LENGTH;
  const truncatedMessage = isMessageLong 
    ? notification.message.substring(0, MAX_MESSAGE_LENGTH) + '...'
    : notification.message;

  useEffect(() => {
    if (open) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      setAutoHideTimer(timer);
    } else {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
        setAutoHideTimer(null);
      }
    }

    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [open, onClose]);

  const handleClose = () => {
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
    onClose();
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const toggleFullMessage = () => {
    setShowFullMessage(!showFullMessage);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000} // Reduced duration for compact design
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ 
        mt: 6, // Reduced margin
        '& .MuiSnackbar-root': {
          transition: 'all 0.2s ease-in-out',
        }
      }}
      TransitionProps={{
        timeout: 200, // Faster transition
      }}
    >
      <Alert
        severity={getNotificationSeverity(notification.type)}
        sx={{
          minWidth: 300,
          maxWidth: 400,
          '& .MuiAlert-message': {
            width: '100%',
            fontSize: '0.875rem',
          },
          '& .MuiAlertTitle-root': {
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: 0.5,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <AlertTitle sx={{ mb: 0, flex: 1 }}>{notification.title}</AlertTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getNotificationIcon(notification.type)}
              label={notification.type.toUpperCase()}
              size="small"
              color={getNotificationColor(notification.type) as any}
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {/* Message with expand/collapse functionality */}
        <Box sx={{ mt: 0.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.8rem',
              lineHeight: 1.3,
              color: 'text.secondary'
            }}
          >
            {showFullMessage ? notification.message : truncatedMessage}
          </Typography>
          
          {isMessageLong && (
            <Button
              size="small"
              onClick={toggleFullMessage}
              startIcon={showFullMessage ? <ExpandLessIcon sx={{ fontSize: '0.75rem' }} /> : <ExpandMoreIcon sx={{ fontSize: '0.75rem' }} />}
              sx={{ 
                mt: 0.5, 
                p: 0.25, 
                minWidth: 'auto',
                fontSize: '0.75rem!important',
                textTransform: 'none',
                height: '20px'
              }}
            >
              {showFullMessage ? 'Less' : 'More'}
            </Button>
          )}
        </Box>
        
        {notification.actionUrl && (
          <Box sx={{ mt: 0.5 }}>
            <Typography
              variant="caption"
              color="primary"
              sx={{ 
                cursor: 'pointer', 
                textDecoration: 'underline',
                fontSize: '0.7rem!important',
                fontWeight: 500
              }}
              onClick={handleAction}
            >
              🔗 View
            </Typography>
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
};
