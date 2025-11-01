import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  Collapse,
  Chip,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Info as InfoIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAccount } from '../../contexts/AccountContext';
import { apiService } from '../../services/api';
import { Account } from '../../types';

/**
 * Demo Account Banner Component
 * Displays a prominent banner when user is using demo account
 * Shows warning about read-only mode and provides option to switch to main account
 */
export const DemoAccountBanner: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isDemoAccount, switchAccount } = useAccount();
  const [collapsed, setCollapsed] = useState(true); // Default collapsed
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);

  // Load available accounts to check if main account exists
  useEffect(() => {
    if (isDemoAccount) {
      loadAvailableAccounts();
      
      // Check if banner was previously collapsed (stored in localStorage)
      const collapsedState = localStorage.getItem('demoAccountBannerCollapsed');
      if (collapsedState === 'true') {
        setCollapsed(true);
      } else if (collapsedState === 'false') {
        setCollapsed(false);
      }
    }
  }, [isDemoAccount]);

  const loadAvailableAccounts = async () => {
    try {
      const accounts = await apiService.getAccounts();
      // Filter out demo account and get main account
      const nonDemoAccounts = accounts.filter((acc: Account) => !acc.isDemoAccount);
      setAvailableAccounts(nonDemoAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleToggleCollapse = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    localStorage.setItem('demoAccountBannerCollapsed', newCollapsedState.toString());
  };

  const handleSwitchToMainAccount = async () => {
    // Find main account first, otherwise use first non-demo account
    const mainAccount = availableAccounts.find((acc: Account) => acc.isMainAccount);
    const targetAccount = mainAccount || availableAccounts[0];
    
    if (targetAccount) {
      try {
        await switchAccount(targetAccount.accountId);
        // Redirect to refresh all data
        window.location.href = '/';
      } catch (error) {
        console.error('Failed to switch account:', error);
      }
    }
  };

  // Don't render if not demo account
  if (!isDemoAccount) {
    return null;
  }

  const hasMainAccount = availableAccounts.some((acc: Account) => acc.isMainAccount);
  const hasOtherAccounts = availableAccounts.length > 0;

  return (
    <Alert
      severity="warning"
      icon={!isMobile && !collapsed ? <InfoIcon /> : undefined}
      onClick={collapsed ? handleToggleCollapse : undefined}
      action={
        !collapsed ? (
          !isMobile ? (
            <Box display="flex" alignItems="center" gap={0.5} sx={{ flexShrink: 0 }}>
              <IconButton
                aria-label="collapse"
                color="inherit"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCollapse();
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  },
                }}
              >
                <ExpandLessIcon fontSize="inherit" />
              </IconButton>
              {hasOtherAccounts && (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<SwapIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwitchToMainAccount();
                  }}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    px: 2,
                    py: 0.75,
                    borderRadius: 1,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {hasMainAccount 
                    ? t('accountSwitcher.demoAccountBanner.switchToMainAccount', 'Chuyển sang tài khoản chính')
                    : t('accountSwitcher.demoAccountBanner.switchToAccount', 'Chuyển tài khoản')}
                </Button>
              )}
            </Box>
          ) : (
            <IconButton
              aria-label="collapse"
              color="inherit"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCollapse();
              }}
              sx={{
                padding: 0.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                },
              }}
            >
              <ExpandLessIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          )
        ) : null
      }
      sx={{
        cursor: collapsed ? 'pointer' : 'default',
        borderRadius: 0,
        borderBottom: `2px solid ${theme.palette.warning.main}`,
        backgroundColor: `${theme.palette.warning.light}15`,
        py: { xs: 1, sm: 1.5 },
        px: { xs: 1, sm: 2 },
        position: 'relative',
        '&:hover': collapsed ? {
          backgroundColor: `${theme.palette.warning.light}25`,
        } : {},
        '& .MuiAlert-icon': {
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          display: { xs: 'none', sm: 'flex' },
        },
        '& .MuiAlert-message': {
          flex: 1,
          width: '100%',
          minWidth: 0,
        },
        '& .MuiAlert-action': {
          paddingTop: { xs: 0, sm: 'inherit' },
          alignItems: { xs: 'flex-start', sm: 'center' },
        },
        boxShadow: `0 2px 8px ${theme.palette.warning.main}20`,
      }}
      >
        {/* Mobile collapse button when expanded */}
        {!collapsed && isMobile && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
            <IconButton
              aria-label="collapse"
              color="inherit"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleCollapse();
              }}
              sx={{
                padding: 0.5,
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                },
              }}
            >
              <ExpandLessIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          </Box>
        )}
        
        <Collapse in={!collapsed} timeout="auto">
          <AlertTitle sx={{ 
              fontWeight: 700, 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              mb: { xs: 0.75, sm: 0.5 },
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              pr: { xs: collapsed ? 4 : 10, sm: 0 }, // Adjust padding based on collapsed state
            }}>
            <Chip
              label={t('accountSwitcher.demoAccountBanner.demoMode', 'Chế độ Demo')}
              size="small"
              color="warning"
              sx={{
                height: { xs: 20, sm: 24 },
                fontWeight: 700,
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                flexShrink: 0,
              }}
            />
            <Box component="span" sx={{ 
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.4,
            }}>
              {t('accountSwitcher.demoAccountBanner.title', 'Bạn đang sử dụng tài khoản Demo')}
            </Box>
          </AlertTitle>
          
          <Box sx={{ mt: { xs: 0.75, sm: 1 }, pr: { xs: collapsed ? 3 : 10, sm: 0 } }}>
            <Box component="span" sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
              lineHeight: { xs: 1.5, sm: 1.6 },
              display: 'block',
            }}>
              {t('accountSwitcher.demoAccountBanner.message', 
                'Tài khoản Demo chỉ cho phép xem dữ liệu (read-only). Để có đầy đủ quyền chỉnh sửa và quản lý, vui lòng chuyển sang tài khoản chính của bạn.')}
            </Box>
            
            {!hasOtherAccounts && (
              <Box component="span" sx={{ 
                display: 'block', 
                mt: { xs: 0.75, sm: 1 }, 
                fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                fontStyle: 'italic',
                color: 'text.secondary',
                lineHeight: 1.4,
              }}>
                {t('accountSwitcher.demoAccountBanner.noOtherAccounts', 
                  'Lưu ý: Bạn chưa có tài khoản chính. Vui lòng liên hệ quản trị viên để tạo tài khoản.')}
              </Box>
            )}

            {/* Mobile: Action buttons at bottom */}
            {isMobile && hasOtherAccounts && (
              <Box sx={{ 
                mt: 1.5, 
                display: 'flex', 
                gap: 1,
                flexDirection: 'column',
              }}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={<SwapIcon />}
                  onClick={handleSwitchToMainAccount}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 1,
                    borderRadius: 1,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {hasMainAccount 
                    ? t('accountSwitcher.demoAccountBanner.switchToMainAccount', 'Chuyển sang tài khoản chính')
                    : t('accountSwitcher.demoAccountBanner.switchToAccount', 'Chuyển tài khoản')}
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Collapsed state: Show only title with expand button */}
        {collapsed && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pr: { xs: 4, sm: 0 },
            position: 'relative',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flex: 1 }}>
              {/* <Chip
                label={t('accountSwitcher.demoAccountBanner.demoMode', 'Chế độ Demo')}
                size="small"
                color="warning"
                sx={{
                  height: { xs: 20, sm: 24 },
                  fontWeight: 700,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  flexShrink: 0,
                }}
              /> */}
              <Box component="span" sx={{ 
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: 1.4,
                fontWeight: 600,
              }}>
                {t('accountSwitcher.demoAccountBanner.title', 'Bạn đang sử dụng tài khoản Demo')}
              </Box>
            </Box>
            {isMobile ? (
              <Box sx={{ position: 'absolute', top: -8, right: 0 }}>
                <IconButton
                  aria-label="expand"
                  color="inherit"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleCollapse();
                  }}
                  sx={{
                    padding: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    },
                  }}
                >
                  <ExpandMoreIcon sx={{ fontSize: '1.25rem' }} />
                </IconButton>
              </Box>
            ) : (
              <IconButton
                aria-label="expand"
                color="inherit"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleCollapse();
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  },
                }}
              >
                <ExpandMoreIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        )}
      </Alert>
  );
};

export default DemoAccountBanner;

