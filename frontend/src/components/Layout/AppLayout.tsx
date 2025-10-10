/**
 * Main application layout component
 */

import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  Chip,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as PortfolioIcon,
  Inventory as AssetIcon,
  Public as GlobalAssetIcon,
  CameraAlt as SnapshotIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  AccountBalanceWallet as DepositIcon,
  Wallet as HoldingsIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountSwitcher } from '../Account';
import { useAccount } from '../../contexts/AccountContext';
import { usePermissions } from '../../hooks/usePermissions';

const drawerWidth = 240;

interface AppLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { 
    text: 'Dashboard', 
    icon: <DashboardIcon />, 
    path: '/', 
    description: 'Overview and key metrics',
    badge: null,
    permission: null, // No permission required for dashboard
    role: null,
    roles: null
  },
  { 
    text: 'Portfolios', 
    icon: <PortfolioIcon />, 
    path: '/portfolios', 
    description: 'Manage investment portfolios',
    badge: null,
    permission: null, // No permission required for portfolios
    role: null,
    roles: null
  },
  {
    text: 'Holdings',
    icon: <HoldingsIcon />,
    path: '/holdings',
    description: 'Manage holdings',
    badge: 'NEW',
    permission: null, // No permission required for holdings
    role: null,
    roles: null
  },
  { 
    text: 'Assets', 
    icon: <AssetIcon />, 
    path: '/assets', 
    description: 'Track individual assets',
    badge: null,
    permission: null, // No permission required for assets
    role: null,
    roles: null
  },
  { 
    text: 'Deposits', 
    icon: <DepositIcon />, 
    path: '/deposits', 
    description: 'Manage deposits',
    badge: null,
    permission: null, // No permission required for deposits
    role: null,
    roles: null
  },
  { 
    text: 'Reports', 
    icon: <ReportsIcon />, 
    path: '/reports', 
    description: 'Generate reports',
    badge: null,
    permission: null, // No permission required for reports
    role: null,
    roles: null
  },
  { 
    text: 'Snapshots', 
    icon: <SnapshotIcon />, 
    path: '/snapshots', 
    description: 'Portfolio snapshots & analysis',
    badge: 'Manager',
    permission: 'financial.snapshots.manage',
    role: null,
    roles: null
  },
  { 
    text: 'Global Assets', 
    icon: <GlobalAssetIcon />, 
    path: '/global-assets', 
    description: 'Global market data',
    badge: 'Admin',
    permission: null,
    role: null,
    roles: ['admin', 'super_admin']
  },
  {
    text: 'Role Management',
    icon: <SecurityIcon />,
    path: '/role-management',
    description: 'Manage roles and permissions',
    badge: 'Admin',
    permission: null,
    role: 'super_admin',
    roles: null
  },
  {
    text: 'Transactions',
    icon: <AssessmentIcon />,
    path: '/transactions',
    description: 'View transaction history',
    badge: 'under review',
    permission: null, // No permission required for transactions
    role: null,
    roles: null
  },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/settings', 
    description: 'System configuration',
    badge: null,
    permission: null, // No permission required for settings
    role: null,
    roles: null
  }
];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentAccount, currentUser, logout, loading: accountLoading } = useAccount();
  const { hasPermission, hasRole, hasAnyRole } = usePermissions();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Professional Header */}
      <Box
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              mr: 2,
              width: 48,
              height: 48,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <PortfolioIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            justifyContent: 'center'
          }}>
            <Typography 
              variant="h5" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600, 
                mb: 0.25,
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px'
              }}
            >
              MMO
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.25,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 1,
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.9, 
                  fontWeight: 500,
                  fontSize: '0.7rem',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase'
                }}
              >
                v1.0.0-beta
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* System Status Indicator */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          position: 'relative', 
          zIndex: 1,
          mt: 2
        }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: 'rgba(34, 197, 94, 0.8)',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)'
          }} />
          <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 300 }}>
            System Online • Real-time Data
          </Typography>
        </Box>
      </Box>

      {/* Professional Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 0.25 }}>
        <List sx={{ px: 0.25 }}>
          {menuItems
            .filter((item) => {
              // Show item if no access control required
              if (!item.permission && !item.role && !item.roles) {
                return true;
              }
              
              let hasPermissionAccess = true;
              let hasRoleAccess = true;
              
              // Check permission-based access
              if (item.permission) {
                hasPermissionAccess = hasPermission(item.permission);
              }
              // Check role-based access
              if (item.role) {
                hasRoleAccess = hasRole(item.role);
              }
              
              if (item.roles) {
                hasRoleAccess = hasAnyRole(item.roles);
              }
              
              // If both permission and role are specified, user needs both
              if (item.permission && (item.role || item.roles)) {
                return hasPermissionAccess && hasRoleAccess;
              }
              
              // If only permission is specified, check permission
              if (item.permission && !item.role && !item.roles) {
                return hasPermissionAccess;
              }
              
              // If only role is specified, check role
              if (!item.permission && (item.role || item.roles)) {
                return hasRoleAccess;
              }
              
              return false;
            })
            .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.125 }}>
              <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 1.5,
                    mx: 0.25,
                    py: 0.75,
                    px: 1,
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.18),
                      },
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                        transform: 'scale(1.1)',
                      },
                      '& .MuiListItemText-primary': {
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: 24,
                        bgcolor: theme.palette.primary.main,
                        borderRadius: '0 2px 2px 0',
                      }
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateX(4px)',
                      '& .MuiListItemIcon-root': {
                        transform: 'scale(1.05)',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 44,
                    transition: 'all 0.2s ease-in-out',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: location.pathname === item.path ? 500 : 300,
                      fontSize: '0.875rem',
                    }}
                  />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color="primary"
                      sx={{ 
                        height: 22, 
                        fontSize: '0.7rem',
                        fontWeight: 400,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: 'white',
                        '& .MuiChip-label': {
                          px: 1,
                        }
                      }}
                    />
                  )}
                  </ListItemButton>
              </ListItem>
          ))}
        </List>
      </Box>

      {/* User Info - Bottom Left */}
      <Box sx={{ 
        mt: 'auto', // Push to bottom
        p: 2.5, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
        backdropFilter: 'blur(12px)',
        borderRadius: '12px 0 0 0',
      }}>
        {/* User Profile Section */}
        <Box 
          onClick={() => {
            if (currentUser) {
              navigate('/profile');
            }
          }}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2.5,
            p: 1.5,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.3),
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            cursor: currentUser ? 'pointer' : 'default',
            '&:hover': {
              background: alpha(theme.palette.background.paper, 0.5),
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
            }
          }}
        >
          {/* Profile Completion Indicator */}
          {currentUser && !currentUser.isProfileComplete && !currentUser.isPasswordSet && (
            <Box sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              zIndex: 1,
            }}>
              <Tooltip title="Profile incomplete - Click to update" placement="top">
                <Chip
                  icon={<WarningIcon sx={{ fontSize: 14 }} />}
                  label="!"
                  size="small"
                  color="warning"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                      '100%': { transform: 'scale(1)', opacity: 1 },
                    },
                    '&:hover': {
                      animation: 'none',
                      transform: 'scale(1.1)',
                    }
                  }}
                />
              </Tooltip>
            </Box>
          )}

          <Avatar sx={{ 
            width: 40, 
            height: 40, 
            mr: 2,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
          }}>
            {currentUser?.avatarText ? (
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {currentUser.avatarText}
              </Typography>
            ) : (
              <AccountIcon sx={{ color: 'primary.main' }} />
            )}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500, 
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentUser?.fullName || currentUser?.username || 'User'}
              </Typography>
              {currentUser?.isProfileComplete ? (
                <Tooltip title="Profile complete" placement="top">
                  <CheckCircleIcon 
                    sx={{ 
                      fontSize: 16, 
                      color: 'success.main',
                      opacity: 0.8,
                    }} 
                  />
                </Tooltip>
              ) : currentUser?.isPasswordSet ? (
                <Tooltip title="Password set, profile optional" placement="top">
                  <CheckCircleIcon 
                    sx={{ 
                      fontSize: 16, 
                      color: 'info.main',
                      opacity: 0.8,
                    }} 
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Profile needs completion" placement="top">
                  <EditIcon 
                    sx={{ 
                      fontSize: 16, 
                      color: 'warning.main',
                      opacity: 0.8,
                    }} 
                  />
                </Tooltip>
              )}
            </Box>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {currentUser?.email || currentUser?.username || 'No email'}
            </Typography>
            {currentUser && !currentUser.isProfileComplete && (
              <Typography 
                variant="caption" 
                color="warning.main" 
                sx={{ 
                  fontWeight: 500,
                  display: 'block',
                  mt: 0.5,
                  fontSize: '0.7rem',
                }}
              >
                Complete your profile
              </Typography>
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Tooltip title="Settings" placement="top">
            <IconButton 
              size="small" 
              sx={{ 
                color: 'text.secondary',
                background: alpha(theme.palette.background.paper, 0.3),
                '&:hover': {
                  color: 'primary.main',
                  background: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
                borderRadius: 2,
                width: 36,
                height: 36,
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Sign Out" placement="top">
            <IconButton 
              size="small" 
              onClick={logout}
              sx={{ 
                color: 'error.main',
                background: alpha(theme.palette.error.main, 0.1),
                '&:hover': {
                  background: alpha(theme.palette.error.main, 0.15),
                  transform: 'scale(1.05)',
                  boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.2)}`,
                },
                transition: 'all 0.2s ease-in-out',
                borderRadius: 2,
                width: 36,
                height: 36,
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: theme.zIndex.appBar,
          backdropFilter: 'blur(10px)',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
                Portfolio Management System
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Current Account Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  fontSize: '0.875rem',
                  ...(currentAccount?.isMainAccount && {
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    border: '2px solid',
                    borderColor: 'primary.main',
                  })
                }}>
                  {accountLoading ? '...' : (currentAccount?.name || 'User').split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                </Avatar>
                {currentAccount?.isMainAccount && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.6rem', color: 'white', fontWeight: 'bold' }}>
                      ★
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {accountLoading ? 'Loading...' : (currentAccount?.name || 'User')}
                  </Typography>
                  {currentAccount?.isMainAccount && (
                    <Box
                      sx={{
                        px: 0.5,
                        py: 0.25,
                        backgroundColor: 'primary.main',
                        borderRadius: 0.5,
                        fontSize: '0.6rem',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      MAIN
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {accountLoading ? '...' : `${currentAccount?.baseCurrency || 'VND'} Account`}
                </Typography>
              </Box>
            </Box>

            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <AccountSwitcher />
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          minHeight: '100vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(30, 58, 138, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(5, 150, 105, 0.03) 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Toolbar />
        <Box sx={{ 
          p: 4,
          position: 'relative',
          zIndex: 1,
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
