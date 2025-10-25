import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Typography,
  Box,
  List,
  ListItem,
  IconButton as ListIconButton,
  Divider,
  Button,
  Chip,
  Paper,
  Link,
  Dialog,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Settings as SettingsIcon,
  ShowChart as ShowChartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification } from '../../contexts/NotificationContext';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'trade':
      return <TrendingUpIcon fontSize="small" />;
    case 'portfolio':
      return <AccountBalanceIcon fontSize="small" />;
    case 'system':
      return <SettingsIcon fontSize="small" />;
    case 'market':
      return <ShowChartIcon fontSize="small" />;
    default:
      return <SettingsIcon fontSize="small" />;
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
      return 'default';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
};

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isFullscreenOpen,
    setFullscreenOpen,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setExpandedNotification(null);
  };

  const handleFullscreenOpen = () => {
    setFullscreenOpen(true);
    setAnchorEl(null); // Close the popover when opening fullscreen
  };

  const handleFullscreenClose = () => {
    setFullscreenOpen(false);
    setExpandedNotification(null);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (notification: Notification) => {
    await deleteNotification(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.actionUrl) {
      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  };

  const toggleExpanded = async (notificationId: number) => {
    if (expandedNotification === notificationId) {
      // If clicking on the same notification, collapse it
      setExpandedNotification(null);
    } else {
      // Expand this notification and collapse others
      setExpandedNotification(notificationId);
      // Mark as read when expanding
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        await markAsRead(notificationId);
      }
    }
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ 
          mr: { xs: 0, sm: 1 },
          ml: { xs: 0.5, sm: 0 }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
            maxWidth: '90vw',
          },
        }}
      >
        <Paper sx={{ p: 1.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>Notifications</Typography>
            <Box>
              <IconButton
                size="small"
                onClick={handleFullscreenOpen}
                title="View all notifications"
                sx={{ mr: 1 }}
              >
                <FullscreenIcon />
              </IconButton>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkEmailReadIcon />}
                  onClick={handleMarkAllAsRead}
                  sx={{ mr: 1 }}
                >
                  Mark all read
                </Button>
              )}
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          {recentNotifications.length === 0 ? (
            <Box textAlign="center" py={3}>
              <NotificationsIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 350, overflow: 'auto', py: 0 }}>
              {recentNotifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 0.5,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      py: 0.75,
                      px: 1,
                      cursor: 'default',
                      '&:hover': {
                        bgcolor: 'action.selected',
                        transform: 'translateY(-1px)',
                        boxShadow: 1,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <Box display="flex" alignItems="flex-start" gap={0.75} mb={0.75}>
                      <Box
                        sx={{
                          color: `${getNotificationColor(notification.type)}.main`,
                          mt: 0.25,
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={0.75} mb={0.25}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: notification.isRead ? 'normal' : 'bold',
                              flex: 1,
                              minWidth: 0,
                              fontSize: '0.875rem',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type.toUpperCase()}
                            size="small"
                            color={getNotificationColor(notification.type) as any}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                        <Box>
                          {expandedNotification === notification.id ? (
                            <Box>
                              <Typography 
                                variant="body2" 
                                color="text.primary"
                                sx={{
                                  wordBreak: 'break-word',
                                  lineHeight: 1.4,
                                  fontSize: '0.75rem',
                                  mb: 1,
                                }}
                              >
                                {notification.message}
                              </Typography>
                              {notification.actionUrl && (
                                <Box sx={{ 
                                  p: 1, 
                                  bgcolor: 'action.hover', 
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Quick Action:
                                  </Typography>
                                  <Link
                                    href={notification.actionUrl}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleNotificationClick(notification);
                                    }}
                                    sx={{
                                      fontSize: '0.8rem',
                                      fontWeight: 500,
                                      textDecoration: 'none',
                                      color: 'primary.main',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                        color: 'primary.dark',
                                      },
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                    }}
                                  >
                                    🔗 {notification.actionUrl}
                                  </Link>
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                lineHeight: 1.3,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                '&:hover': {
                                  color: 'text.primary',
                                },
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await toggleExpanded(notification.id);
                              }}
                            >
                              {notification.message}
                            </Typography>
                          )}
                          {expandedNotification !== notification.id && notification.message.length > 80 && (
                            <Button
                              size="small"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await toggleExpanded(notification.id);
                              }}
                              startIcon={<ExpandMoreIcon sx={{ fontSize: '0.75rem' }} />}
                              sx={{
                                p: 0.25,
                                minWidth: 'auto',
                                fontSize: '0.75rem!important',
                                textTransform: 'none',
                                mt: 0.25,
                                minHeight: 'auto',
                                height: '20px',
                              }}
                            >
                              More
                            </Button>
                          )}
                          {expandedNotification === notification.id && (
                            <Box sx={{ display: 'flex', gap: 0.25, mt: 0.5 }}>
                              <Button
                                size="small"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await toggleExpanded(notification.id);
                                }}
                                startIcon={<ExpandLessIcon sx={{ fontSize: '0.75rem' }} />}
                                sx={{
                                  p: 0.25,
                                  minWidth: 'auto',
                                  fontSize: '0.75rem!important',
                                  textTransform: 'none',
                                  minHeight: 'auto',
                                  height: '20px',
                                }}
                              >
                                Less
                              </Button>
                              {notification.actionUrl && (
                                <Button
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  sx={{
                                    p: 0.25,
                                    minWidth: 'auto',
                                    fontSize: '0.75rem!important',
                                    textTransform: 'none',
                                    minHeight: 'auto',
                                    height: '20px',
                                    color: 'primary.main',
                                    '&:hover': {
                                      color: 'primary.dark',
                                      bgcolor: 'primary.light',
                                    },
                                  }}
                                >
                                  🔗 Go
                                </Button>
                              )}
                            </Box>
                          )}
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {formatDate(notification.createdAt)}
                          </Typography>
                          <Box display="flex" gap={0.25}>
                            {!notification.isRead && (
                              <ListIconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification);
                                }}
                                title="Mark as read"
                                sx={{ p: 0.5, minWidth: 'auto' }}
                              >
                                <MarkEmailReadIcon sx={{ fontSize: '0.875rem' }} />
                              </ListIconButton>
                            )}
                            <ListIconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification);
                              }}
                              title="Delete"
                              color="error"
                              sx={{ p: 0.5, minWidth: 'auto' }}
                            >
                              <DeleteIcon sx={{ fontSize: '0.875rem' }} />
                            </ListIconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider sx={{ my: 0.25 }} />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Popover>

      {/* Fullscreen Modal */}
      <Dialog
        open={isFullscreenOpen}
        onClose={handleFullscreenClose}
        maxWidth="lg"
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
          },
        }}
      >
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              All Notifications ({notifications.length})
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleFullscreenClose}
              title="Close fullscreen"
            >
              <FullscreenExitIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <DialogContent sx={{ p: 0, bgcolor: 'background.default' }}>
          {notifications.length === 0 ? (
            <Box 
              textAlign="center" 
              py={8}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2
              }}
            >
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You'll see notifications here when they arrive
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 0.5,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      py: 1.5,
                      px: 2,
                      cursor: 'default',
                      '&:hover': {
                        bgcolor: 'action.selected',
                        transform: 'translateY(-1px)',
                        boxShadow: 2,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                      <Box
                        sx={{
                          color: `${getNotificationColor(notification.type)}.main`,
                          mt: 0.25,
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: notification.isRead ? 'normal' : 'bold',
                              flex: 1,
                              minWidth: 0,
                              fontSize: '1rem',
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type.toUpperCase()}
                            size="small"
                            color={getNotificationColor(notification.type) as any}
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 24 }}
                          />
                        </Box>
                        <Box>
                          {expandedNotification === notification.id ? (
                            <Box>
                              <Typography 
                                variant="body1" 
                                color="text.primary"
                                sx={{
                                  wordBreak: 'break-word',
                                  lineHeight: 1.5,
                                  fontSize: '0.9rem',
                                  mb: 1.5,
                                }}
                              >
                                {notification.message}
                              </Typography>
                              {notification.actionUrl && (
                                <Box sx={{ 
                                  p: 1.5, 
                                  bgcolor: 'action.hover', 
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Quick Action:
                                  </Typography>
                                  <Link
                                    href={notification.actionUrl}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleNotificationClick(notification);
                                    }}
                                    sx={{
                                      fontSize: '0.9rem',
                                      fontWeight: 500,
                                      textDecoration: 'none',
                                      color: 'primary.main',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                        color: 'primary.dark',
                                      },
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                    }}
                                  >
                                    🔗 {notification.actionUrl}
                                  </Link>
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <Typography 
                              variant="body1" 
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                wordBreak: 'break-word',
                                lineHeight: 1.4,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                '&:hover': {
                                  color: 'text.primary',
                                },
                              }}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await toggleExpanded(notification.id);
                              }}
                            >
                              {notification.message}
                            </Typography>
                          )}
                          {expandedNotification !== notification.id && notification.message.length > 100 && (
                            <Button
                              size="small"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await toggleExpanded(notification.id);
                              }}
                              startIcon={<ExpandMoreIcon />}
                              sx={{
                                p: 0.5,
                                minWidth: 'auto',
                                fontSize: '0.8rem!important',
                                textTransform: 'none',
                                mt: 0.5,
                                minHeight: 'auto',
                                height: '24px',
                              }}
                            >
                              More
                            </Button>
                          )}
                          {expandedNotification === notification.id && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                              <Button
                                size="small"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await toggleExpanded(notification.id);
                                }}
                                startIcon={<ExpandLessIcon />}
                                sx={{
                                  p: 0.5,
                                  minWidth: 'auto',
                                  fontSize: '0.8rem!important',
                                  textTransform: 'none',
                                  minHeight: 'auto',
                                  height: '24px',
                                }}
                              >
                                Less
                              </Button>
                              {notification.actionUrl && (
                                <Button
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notification);
                                  }}
                                  sx={{
                                    p: 0.5,
                                    minWidth: 'auto',
                                    fontSize: '0.8rem!important',
                                    textTransform: 'none',
                                    minHeight: 'auto',
                                    height: '24px',
                                    color: 'primary.main',
                                    '&:hover': {
                                      color: 'primary.dark',
                                      bgcolor: 'primary.light',
                                    },
                                  }}
                                >
                                  🔗 Go
                                </Button>
                              )}
                            </Box>
                          )}
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            {formatDate(notification.createdAt)}
                          </Typography>
                          <Box display="flex" gap={0.5}>
                            {!notification.isRead && (
                              <ListIconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification);
                                }}
                                title="Mark as read"
                                sx={{ p: 0.5, minWidth: 'auto' }}
                              >
                                <MarkEmailReadIcon sx={{ fontSize: '1rem' }} />
                              </ListIconButton>
                            )}
                            <ListIconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification);
                              }}
                              title="Delete"
                              color="error"
                              sx={{ p: 0.5, minWidth: 'auto' }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </ListIconButton>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider sx={{ my: 0.5 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
          <Button
            onClick={handleMarkAllAsRead}
            startIcon={<MarkEmailReadIcon />}
            disabled={unreadCount === 0}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Mark all as read
          </Button>
          <Button
            onClick={handleFullscreenClose}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
