/**
 * Main application layout component
 */

import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Button,
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
  Chip,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as PortfolioIcon,
  Public as GlobalAssetIcon,
  CameraAlt as SnapshotIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Wallet as HoldingsIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Help as HelpIcon,
  Flag as GoalsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AccountSwitcher } from '../Account';
import { useAccount } from '../../contexts/AccountContext';
import { usePermissions } from '../../hooks/usePermissions';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { NotificationBell, NotificationManager } from '../Notification';
import { LanguageSwitcher } from '../LanguageSwitcher';
import DataDisplayToggle from '../Common/DataDisplayToggle';

// Responsive drawer widths based on screen size
const getDrawerWidth = (_theme: any, isCollapsed: boolean) => {
  if (isCollapsed) {
    return {
      xs: 56,   // Mobile collapsed
      sm: 60,   // Tablet collapsed  
      md: 64,   // Desktop collapsed
      lg: 64,   // Large desktop collapsed
      xl: 64,   // Extra large collapsed
    };
  }
  
  return {
    xs: 200,   // Mobile expanded
    sm: 220,   // Tablet expanded
    md: 200,   // Desktop expanded
    lg: 220,   // Large desktop expanded
    xl: 240,   // Extra large expanded
  };
};

interface AppLayoutProps {
  children: React.ReactNode;
}


const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(isTablet);
  const { currentAccount, currentUser, logout, loading: accountLoading } = useAccount();
  const { hasAnyPermission, hasAnyRole } = usePermissions();

  // Create menu items with i18n - filter based on account type
  const isInvestorAccount = currentAccount?.isInvestor === true;
  
  const menuItems = [
    { 
      text: t('navigation.dashboard'), 
      icon: <DashboardIcon />, 
      path: '/', 
      description: t('navigation.dashboard'),
      badge: null
    },
    // Nhà đầu tư - Always show
    {
      text: t('navigation.investor.title'),
      icon: <ReportsIcon />,
      path: null, // Parent menu
      description: t('navigation.investor.title'),
      badge: null,
      children: [
        {
          text: t('navigation.investor.reports'),
          icon: <ReportsIcon />,
          path: '/investor',
          description: t('navigation.investor.reports'),
          badge: null
        },
        {
          text: t('navigation.investor.holdings'),
          icon: <HoldingsIcon />,
          path: '/holdings',
          description: t('navigation.investor.holdings'),
          badge: null
        },
        {
          text: t('navigation.investor.goals'),
          icon: <GoalsIcon />,
          path: '/goals',
          description: t('navigation.investor.goals'),
          badge: null
        }
      ]
    },
    // Quản lý quỹ - Only show for non-investor accounts
    ...(isInvestorAccount ? [] : [{
      text: t('navigation.fundManagement.title'),
      icon: <PortfolioIcon />,
      path: null, // Parent menu
      description: t('navigation.fundManagement.title'),
      badge: null,
      children: [
        {
          text: t('navigation.fundManagement.portfolios'),
          icon: <PortfolioIcon />,
          path: '/portfolios',
          description: t('navigation.fundManagement.portfolios'),
          badge: null
        },
        {
          text: t('navigation.fundManagement.reports'),
          icon: <ReportsIcon />,
          path: '/reports',
          description: t('navigation.fundManagement.reports'),
          badge: null
        }
      ]
    }]),
    // Settings - Always show
    { 
      text: t('navigation.settings'), 
      icon: <SettingsIcon />, 
      path: '/settings', 
      description: t('navigation.settings'),
      badge: null
    },
    // System Explanation - Always show
    { 
      text: t('navigation.systemExplanation'), 
      icon: <HelpIcon />, 
      path: '/system-guide', 
      description: t('navigation.systemExplanation'),
      badge: null
    },
    // Admin menus - Only show for non-investor accounts
    ...(isInvestorAccount ? [] : [
      
      { 
        text: t('navigation.dataManagement'), 
        icon: <SnapshotIcon />, 
        path: '/snapshots', 
        description: t('navigation.dataManagement'),
        badge: null,
        permissions: ['financial.snapshots.manage']
      },{ 
        text: t('navigation.priceManagement'), 
        icon: <GlobalAssetIcon />, 
        path: '/global-assets', 
        description: t('navigation.priceManagement'),
        badge: null,
        roles: ['admin', 'super_admin']
      },
      {
        text: t('navigation.systemAdmin'),
        icon: <SecurityIcon />,
        path: '/admin-management',
        description: t('navigation.systemAdmin'),
        badge: null,
        roles: ['super_admin']
      }
    ])
  ];

  // Auto-collapse on smaller screens
  React.useEffect(() => {
    if (isMobile) {
      setDrawerCollapsed(false); // Always expanded on mobile
      setMobileOpen(false); // Close mobile drawer when screen becomes mobile
    } else if (isTablet) {
      setDrawerCollapsed(false); // Not used on tablet
      setMobileOpen(false); // Close mobile drawer when screen becomes tablet
    } else {
      // On desktop, allow user to control collapse state
      // Don't force collapse on desktop
    }
  }, [isMobile, isTablet]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    // Don't allow collapse toggle on mobile - always keep expanded
    // Allow toggle on tablet and desktop
    if (!isMobile) {
      setDrawerCollapsed(!drawerCollapsed);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile || isTablet) {
      setMobileOpen(false);
    }
  };

  // Force expanded state on mobile, allow toggle on tablet and desktop
  const isDrawerCollapsed = isMobile ? false : drawerCollapsed;

  const drawer = (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      overflowX: 'hidden',
      maxWidth: '100%'
    }}>
      {/* Professional Header */}
      <Box
        sx={{
          p: isDrawerCollapsed ? 1.5 : 3,
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: isDrawerCollapsed ? 1 : 2, position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              mr: isDrawerCollapsed ? 0 : 2,
              width: isDrawerCollapsed ? 32 : 48,
              height: isDrawerCollapsed ? 32 : 48,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <PortfolioIcon sx={{ fontSize: isDrawerCollapsed ? 20 : 28 }} />
          </Avatar>
          {!isDrawerCollapsed && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}>
              <ResponsiveTypography 
                variant="cardTitle" 
                noWrap 
                component="div" 
                sx={{ 
                  mb: 0.25,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px'
                }}
              >
                MMO
              </ResponsiveTypography>
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
                <ResponsiveTypography 
                  variant="formHelper"
                  sx={{ 
                    color: 'white',
                    opacity: 0.9, 
                    fontWeight: 500,
                    fontSize: {
                      xs: '0.4rem',    
                      sm: '0.4rem',    
                      md: '0.45rem',   
                      lg: '0.55rem',    
                      xl: '0.65rem',
                    },
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase'
                  }}
                >
                  v1.0.0-beta
                </ResponsiveTypography>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* System Status Indicator */}
        {!isDrawerCollapsed && (
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
            <ResponsiveTypography variant="formHelper" sx={{ opacity: 0.9, fontWeight: 300,
              fontSize: {
                xs: '0.4rem',    
                sm: '0.45rem',    
                md: '0.55rem',   
                lg: '0.65rem',    
                xl: '0.75rem',
              },
             }}>
              System Online • Real-time Data
            </ResponsiveTypography>
          </Box>
        )}
      </Box>

      {/* Professional Navigation */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        overflowX: 'hidden',
        py: 0.25, 
        minHeight: 0,
        maxWidth: '100%'
      }}>
        <List sx={{ 
          px: 0.25,
          overflow: 'hidden',
          maxWidth: '100%',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.divider,
            borderRadius: '3px',
            '&:hover': {
              background: theme.palette.text.secondary,
            },
          },
        }}>
          {menuItems
            .filter((item) => {
              // Show item if no access control required
              if (!item.permissions && !item.roles) {
                return true;
              }
              
              let hasPermissionAccess = false;
              let hasRoleAccess = false;
              
              // Check permission-based access
              if (item.permissions) {
                hasPermissionAccess = hasAnyPermission(item.permissions);
              }

              if (item.roles) {
                hasRoleAccess = hasAnyRole(item.roles);
              }
              
              return hasPermissionAccess || hasRoleAccess;
            })
            .map((item) => {
              // Khi collapsed: hiển thị flat tất cả items (bao gồm children)
              if (isDrawerCollapsed) {
                const allItems = [];
                
                // Thêm parent item nếu có
                if (item.path) {
                  allItems.push(item);
                }
                
                // Thêm tất cả children items
                if (item.children) {
                  allItems.push(...item.children);
                }
                
                return allItems.map((menuItem) => (
                  <ListItem key={menuItem.text} disablePadding sx={{ mb: 0.125 }}>
                    <Tooltip 
                      title={menuItem.text} 
                      placement="right"
                      arrow
                    >
                      <ListItemButton
                        selected={location.pathname === menuItem.path}
                        onClick={() => handleNavigation(menuItem.path)}
                        sx={{
                          borderRadius: 1.5,
                          mx: 0.25,
                          py: 0.75,
                          px: 0.5,
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          justifyContent: 'center',
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.18),
                            },
                            '& .MuiListItemIcon-root': {
                              color: theme.palette.primary.main,
                              transform: 'scale(1.1)',
                            },
                          },
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'scale(1.05)',
                            '& .MuiListItemIcon-root': {
                              transform: 'scale(1.05)',
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: 32,
                          transition: 'all 0.2s ease-in-out',
                        }}>
                          {menuItem.icon}
                        </ListItemIcon>
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                ));
              }
              
              // Khi expanded: hiển thị parent/child structure
              if (item.children) {
                return (
                  <Box key={item.text}>
                    <ListItem disablePadding sx={{ mb: 0.125 }}>
                      <Tooltip 
                        title={item.text} 
                        placement="right"
                        arrow
                      >
                        <ListItemButton
                          className="parent-menu"
                          sx={{
                            borderRadius: 1.5,
                            mx: 0.25,
                            py: 0.75,
                            px: 1,
                            transition: 'all 0.2s ease-in-out',
                            position: 'relative',
                            justifyContent: 'flex-start',
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
                              fontWeight: 500,
                              fontSize: '0.875rem',
                              color: theme.palette.primary.main,
                            }}
                          />
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                    {/* Render children */}
                    {item.children.map((child) => (
                      <ListItem key={child.text} disablePadding sx={{ mb: 0.125, ml: 2 }}>
                        <Tooltip 
                          title={child.text} 
                          placement="right"
                          arrow
                        >
                          <ListItemButton
                            selected={location.pathname === child.path}
                            onClick={() => handleNavigation(child.path)}
                            sx={{
                              borderRadius: 1.5,
                              mx: 0.25,
                              py: 0.75,
                              px: 1,
                              transition: 'all 0.2s ease-in-out',
                              position: 'relative',
                              justifyContent: 'flex-start',
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
                              {child.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={child.text}
                              primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: location.pathname === child.path ? 500 : 300,
                                fontSize: '0.875rem',
                              }}
                            />
                            {child.badge && (
                              <Chip
                                label={child.badge}
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
                        </Tooltip>
                      </ListItem>
                    ))}
                  </Box>
                );
              }
              
              // Render regular menu item
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.125 }}>
                  <Tooltip 
                    title={isDrawerCollapsed ? item.text : ''} 
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                        selected={location.pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          borderRadius: 1.5,
                          mx: 0.25,
                          py: 0.75,
                          px: isDrawerCollapsed ? 0.5 : 1,
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
                          // Regular menu items giữ nguyên cursor pointer mặc định
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
                            transform: isDrawerCollapsed ? 'scale(1.05)' : 'translateX(4px)',
                            '& .MuiListItemIcon-root': {
                              transform: 'scale(1.05)',
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          minWidth: isDrawerCollapsed ? 32 : 44,
                          transition: 'all 0.2s ease-in-out',
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        {!isDrawerCollapsed && (
                          <>
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
                          </>
                        )}
                        </ListItemButton>
                  </Tooltip>
                  </ListItem>
              );
            })}
        </List>
      </Box>

      {/* Collapse Toggle Button - Only show on desktop */}
      {!isMobile && !isTablet && (
        <Box sx={{ 
          p: 1, 
          display: 'flex', 
          justifyContent: 'center',
          borderTop: 1,
          borderColor: 'divider',
          background: alpha(theme.palette.background.paper, 0.5),
        }}>
          <Tooltip title={isDrawerCollapsed ? 'Expand menu' : 'Collapse menu'} placement="right">
            <IconButton
              onClick={handleDrawerCollapse}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isDrawerCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* User Info - Bottom Left */}
      <Box sx={{ 
        mt: 'auto', // Push to bottom
        p: 0.5, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
        backdropFilter: 'blur(12px)',
        borderRadius: '12px 0 0 0',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* User Profile Section */}
        <Tooltip 
          title={isDrawerCollapsed ? (currentUser?.fullName || currentUser?.username || 'User') : ''} 
          placement="right"
          arrow
        >
          <Box 
            onClick={() => {
              if (currentUser) {
                navigate('/profile');
              }
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 0.5,
              p: isDrawerCollapsed ? 0.5 : 1,
              borderRadius: 2,
              background: alpha(theme.palette.background.paper, 0.3),
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              cursor: currentUser ? 'pointer' : 'default',
              justifyContent: isDrawerCollapsed ? 'center' : 'flex-start',
              '&:hover': {
                background: alpha(theme.palette.background.paper, 0.5),
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
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
            width: isDrawerCollapsed ? 32 : 40, 
            height: isDrawerCollapsed ? 32 : 40, 
            mr: isDrawerCollapsed ? 0 : 2,
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
          {!isDrawerCollapsed && (
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
          )}
        </Box>
        </Tooltip>

        {/* Action Buttons */}
        {!isDrawerCollapsed && (
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
            
            <Tooltip title={t('navigation.logout')} placement="top">
              <Button 
                size="small" 
                onClick={logout}
                startIcon={<LogoutIcon fontSize="small" />}
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
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem!important',
                  fontWeight: 500,
                  textTransform: 'none',
                }}
              >
                {t('navigation.logout')}
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { 
            xs: '100%',
            sm: '100%', // Tablet uses temporary drawer, so full width
            md: `calc(100% - ${isDrawerCollapsed ? getDrawerWidth(theme, true).md : getDrawerWidth(theme, false).md}px)`,
            lg: `calc(100% - ${isDrawerCollapsed ? getDrawerWidth(theme, true).lg : getDrawerWidth(theme, false).lg}px)`,
            xl: `calc(100% - ${isDrawerCollapsed ? getDrawerWidth(theme, true).xl : getDrawerWidth(theme, false).xl}px)`,
          },
          ml: { 
            xs: 0,
            sm: 0, // Tablet uses temporary drawer, so no margin
            md: `${isDrawerCollapsed ? getDrawerWidth(theme, true).md : getDrawerWidth(theme, false).md}px`,
            lg: `${isDrawerCollapsed ? getDrawerWidth(theme, true).lg : getDrawerWidth(theme, false).lg}px`,
            xl: `${isDrawerCollapsed ? getDrawerWidth(theme, true).xl : getDrawerWidth(theme, false).xl}px`,
          },
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          zIndex: theme.zIndex.appBar,
          backdropFilter: 'blur(10px)',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          transition: 'all 0.3s ease-in-out',
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
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
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
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flexWrap: 'nowrap'
          }}>
            {/* Current Account Info */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center', 
              gap: { xs: 0.5, sm: 1 }, 
              mr: { xs: 1, sm: 2 }
            }}>
              <Box sx={{ position: 'relative' }}>
                <Tooltip title="Click to go to Home" placement="bottom" arrow>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 2,
                      },
                      ...(currentAccount?.isMainAccount && {
                        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                        border: '2px solid',
                        borderColor: 'primary.main',
                      })
                    }}
                    onClick={() => navigate('/')}
                  >
                    {accountLoading ? '...' : (currentAccount?.name || t('common.user')).split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                  </Avatar>
                </Tooltip>
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
              <Box sx={{ 
                display: { xs: 'flex', sm: 'flex' }, // Hide text info on mobile, show only on desktop
                flexDirection: 'column', 
                alignItems: 'flex-start' 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    {accountLoading ? t('common.loading') : (currentAccount?.name || t('common.user'))}
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
                  {accountLoading ? '...' : `${t('common.account')}`}
                </Typography>
              </Box>
            </Box>

            <NotificationBell />

            <DataDisplayToggle size="small" />

            <LanguageSwitcher variant="select" size="small" showLabel={false} />

            <AccountSwitcher />
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { 
            xs: 0,
            sm: 0, // Tablet uses temporary drawer, so no width
            md: isDrawerCollapsed ? getDrawerWidth(theme, true).md : getDrawerWidth(theme, false).md,
            lg: isDrawerCollapsed ? getDrawerWidth(theme, true).lg : getDrawerWidth(theme, false).lg,
            xl: isDrawerCollapsed ? getDrawerWidth(theme, true).xl : getDrawerWidth(theme, false).xl,
          }, 
          flexShrink: { sm: 0 } 
        }}
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
             '& .MuiDrawer-paper': { 
               boxSizing: 'border-box', 
               width: getDrawerWidth(theme, false).xs, // Always expanded on mobile
               overflow: 'hidden',
               overflowX: 'hidden',
               maxWidth: '100%'
             },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: {
                sm: isDrawerCollapsed ? getDrawerWidth(theme, true).sm : getDrawerWidth(theme, false).sm,
                md: isDrawerCollapsed ? getDrawerWidth(theme, true).md : getDrawerWidth(theme, false).md,
                lg: isDrawerCollapsed ? getDrawerWidth(theme, true).lg : getDrawerWidth(theme, false).lg,
                xl: isDrawerCollapsed ? getDrawerWidth(theme, true).xl : getDrawerWidth(theme, false).xl,
              },
              transition: 'width 0.3s ease-in-out',
              overflow: 'hidden',
              overflowX: 'hidden',
              maxWidth: '100%'
            },
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
          width: { 
            xs: '100%',
            sm: '100%', // Tablet uses temporary drawer, so full width
            md: `calc(100% - ${isDrawerCollapsed ? getDrawerWidth(theme, true).md : getDrawerWidth(theme, false).md}px)`,
            lg: `calc(100% - ${isDrawerCollapsed ? getDrawerWidth(theme, true).lg : getDrawerWidth(theme, false).lg}px)`,
            xl: `calc(100% - ${isDrawerCollapsed ? getDrawerWidth(theme, true).xl : getDrawerWidth(theme, false).xl}px)`,
          },
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          minHeight: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
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
          p: { xs: 1, sm: 2, md: 2.5 },
          position: 'relative',
          zIndex: 1,
          height: 'calc(100vh - 64px)',
          overflow: 'auto',
        }}>
          {children}
          {currentUser && <NotificationManager userId={currentUser.userId} />}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
