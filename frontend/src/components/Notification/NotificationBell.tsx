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
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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

  const toggleExpanded = (notificationId: number) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(notificationId)) {
      newExpanded.delete(notificationId);
    } else {
      newExpanded.add(notificationId);
    }
    setExpandedNotifications(newExpanded);
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ mr: 1 }}
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
                          {expandedNotifications.has(notification.id) ? (
                            <Box>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                  wordBreak: 'break-word',
                                  lineHeight: 1.4,
                                  fontSize: '0.8rem',
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
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(notification.id);
                              }}
                            >
                              {notification.message}
                            </Typography>
                          )}
                          {!expandedNotifications.has(notification.id) && notification.message.length > 80 && (
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(notification.id);
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
                            {/* {!expandedNotifications.has(notification.id) && notification.actionUrl && (
                              <Box sx={{ mt: 0.5 }}>
                                <Link
                                  href={notification.actionUrl}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleNotificationClick(notification);
                                  }}
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    color: 'primary.main',
                                    '&:hover': {
                                      textDecoration: 'underline',
                                      color: 'primary.dark',
                                    },
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.25,
                                  }}
                                >
                                  🔗 View
                                </Link>
                              </Box>
                            )} */}
                          {expandedNotifications.has(notification.id) && (
                            <Box sx={{ display: 'flex', gap: 0.25, mt: 0.5 }}>
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(notification.id);
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
    </>
  );
};
