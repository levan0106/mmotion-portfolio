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
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  AccountBalanceWallet as DepositIcon,
  Wallet as HoldingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountSwitcher } from '../Account';
import { useAccount } from '../../contexts/AccountContext';

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
    badge: null
  },
  { 
    text: 'Portfolios', 
    icon: <PortfolioIcon />, 
    path: '/portfolios', 
    description: 'Manage investment portfolios',
    badge: null
  },
  {
    text: 'Holdings',
    icon: <HoldingsIcon />,
    path: '/holdings',
    description: 'Manage holdings',
    badge: 'NEW'
  },
  { 
    text: 'Assets', 
    icon: <AssetIcon />, 
    path: '/assets', 
    description: 'Track individual assets',
    badge: null
  },
  { 
    text: 'Deposits', 
    icon: <DepositIcon />, 
    path: '/deposits', 
    description: 'Manage deposits',
    badge: null
  },
  { 
    text: 'Reports', 
    icon: <ReportsIcon />, 
    path: '/reports', 
    description: 'Generate reports',
    badge: null
  },
  { 
    text: 'Global Assets', 
    icon: <GlobalAssetIcon />, 
    path: '/global-assets', 
    description: 'Global market data',
    badge: 'NEW'
  },
  { 
    text: 'Snapshots', 
    icon: <SnapshotIcon />, 
    path: '/snapshots', 
    description: 'Portfolio snapshots & analysis',
    badge: null
  },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/settings', 
    description: 'System configuration',
    badge: null
  },
];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentAccount, loading: accountLoading } = useAccount();

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
          {menuItems.map((item) => (
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

      {/* Professional Footer */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        background: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: 'blur(10px)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ 
            width: 36, 
            height: 36, 
            mr: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          }}>
            <AccountIcon sx={{ color: 'primary.main' }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 400, color: 'text.primary' }}>
              Financial Administrator
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 300 }}>
              admin@financialsystem.com
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="System Settings">
            <IconButton 
              size="small" 
              sx={{ 
                color: 'primary.main',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sign Out">
            <IconButton 
              size="small" 
              sx={{ 
                color: 'error.main',
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease-in-out',
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
