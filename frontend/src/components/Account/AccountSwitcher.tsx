import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
} from '@mui/material';
import { ResponsiveButton } from '../Common';
import CurrencyToggle from '../Common/CurrencyToggle';
import {
  AccountBalance as AccountIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Account } from '../../types';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';

export const AccountSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentAccount, switchAccount } = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await apiService.getAccounts();
      
      // Sort accounts: demo account first, then main account, then by creation date
      const sortedAccounts = accountsData.sort((a: Account, b: Account) => {
        // Demo account first
        if (a.isDemoAccount && !b.isDemoAccount) return -1;
        if (!a.isDemoAccount && b.isDemoAccount) return 1;
        // Main account second
        if (a.isMainAccount && !b.isMainAccount) return -1;
        if (!a.isMainAccount && b.isMainAccount) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAccounts(sortedAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAccountSelect = async (accountId: string) => {
    // Don't switch if it's the same account
    if (accountId === currentAccount?.accountId) {
      handleClose();
      return;
    }

    // Show loading state
    setLoading(true);
    
    try {
      // Switch account with real data
      await switchAccount(accountId);
      handleClose();
      
      // Redirect to homepage to refresh all data with new account context
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to switch account:', error);
      setLoading(false);
    }
  };

  const handleManageAccounts = () => {
    navigate('/settings?tab=accountManagement');
    handleClose();
  };

  const handleRefresh = async () => {
    await loadAccounts();
  };

  // const getCurrencySymbol = (currency: string) => {
  //   const symbols: Record<string, string> = {
  //     'VND': '₫',
  //     'USD': '$'
  //   };
  //   return symbols[currency] || currency;
  // };

  const getAccountInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={loading ? t('accountSwitcher.switching') : (currentAccount?.name || t('accountSwitcher.switchAccount'))}>
          <span>
            <ResponsiveButton
              onClick={handleClick}
              variant="outlined"
              icon={<AccountIcon />}
              mobileText=""
              desktopText=""
              disabled={loading}
              forceIconOnly={true}
              responsiveSizing={false}
              sx={{
                height: 35,
                maxWidth: 35,
                minWidth: 35,
                justifyContent: 'center',
                textTransform: 'none',
                borderRadius: 1.5,
                px: 0.5,
                py: 0.5,
                mr: { xs: 0, sm: 0.5 },
                ml: { xs: 0.5, sm: 0 }
              }}
            >
              {loading ? t('accountSwitcher.switching') : ''}
            </ResponsiveButton>
          </span>
        </Tooltip>

      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('accountSwitcher.selectAccount')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Currency Format Toggle */}
            <CurrencyToggle 
              onToggle={(showFull: boolean) => {
                // Force re-render of currency displays
                window.dispatchEvent(new CustomEvent('currency-format-changed', { 
                  detail: { showFull } 
                }));
              }}
              size="small"
              color="default"
            />
            {/* Refresh Accounts */}
            <Tooltip title={t('accountSwitcher.refreshAccounts')}>
              <IconButton
                size="small"
                onClick={handleRefresh}
                disabled={loading}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'primary.50',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.6,
                  }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* Manage Accounts */}
            <Tooltip title={t('accountSwitcher.manageAccounts')}>
              <IconButton
                size="small"
                onClick={handleManageAccounts}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'primary.50',
                  }
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('accountSwitcher.loadingAccounts')}
            </Typography>
          </Box>
        ) : accounts.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('accountSwitcher.noAccounts')}
            </Typography>
          </Box>
        ) : (
          accounts.filter(account => account).map((account) => (
            <MenuItem
              key={account.accountId}
              onClick={() => handleAccountSelect(account.accountId)}
              selected={account.accountId === currentAccount?.accountId}
              disabled={loading}
              sx={{
                py: 1.5,
                px: 2,
                // Special styling for main account
                ...(account.isMainAccount && {
                  backgroundColor: 'primary.50',
                  '&:hover': {
                    backgroundColor: 'primary.100',
                  },
                }),
                // Special styling for demo account
                ...(account.isDemoAccount && {
                  backgroundColor: 'success.50',
                  '&:hover': {
                    backgroundColor: 'success.100',
                  },
                }),
                '&.Mui-selected': {
                  backgroundColor: account.isDemoAccount 
                    ? 'success.200' 
                    : account.isMainAccount 
                      ? 'primary.200' 
                      : 'primary.light',
                  '&:hover': {
                    backgroundColor: account.isDemoAccount 
                      ? 'success.200' 
                      : account.isMainAccount 
                        ? 'primary.200' 
                        : 'primary.light',
                  },
                },
                '&.Mui-disabled': {
                  opacity: 0.6,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    fontSize: '0.875rem',
                    ...(account.isDemoAccount && {
                      background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                      border: '2px solid',
                      borderColor: 'success.main',
                    }),
                    ...(account.isMainAccount && !account.isDemoAccount && {
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      border: '2px solid',
                      borderColor: 'primary.main',
                    })
                  }}>
                    {getAccountInitials(account.name)}
                  </Avatar>
                  {(account.isMainAccount || account.isDemoAccount) && (
                    <StarIcon 
                      sx={{ 
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        fontSize: '0.75rem',
                        color: account.isDemoAccount ? 'success.main' : 'primary.main',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        p: 0.25,
                      }} 
                    />
                  )}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" noWrap>
                      {account.name}
                    </Typography>
                    {account.isDemoAccount && (
                      <Chip
                        label={t('accountSwitcher.demoAccount')}
                        size="small"
                        color="success"
                        variant="filled"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                          color: 'white',
                          '& .MuiChip-label': {
                            px: 1,
                          }
                        }}
                      />
                    )}
                    {account.isMainAccount && !account.isDemoAccount && (
                      <Chip
                        label={t('accountSwitcher.mainAccount')}
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{ 
                          height: 20, 
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          color: 'white',
                          '& .MuiChip-label': {
                            px: 1,
                          }
                        }}
                      />
                    )}
                    {account.isInvestor && (
                      <Chip
                        label={t('accountSwitcher.investor')}
                        size="small"
                        color="secondary"
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {account.email}
                    </Box>
                    {/* <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      •
                    </Box>
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {account.baseCurrency} {getCurrencySymbol(account.baseCurrency)}
                    </Box> */}
                  </Box>
                }
              />
            </MenuItem>
          ))
        )}

        <Divider />
        <MenuItem
          onClick={handleManageAccounts}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Avatar sx={{ width: 32, height: 32, backgroundColor: 'secondary.light' }}>
              <SettingsIcon sx={{ fontSize: '1rem' }} />
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={t('accountSwitcher.manageAccounts')}
            secondary={t('accountSwitcher.manageAccountsDescription')}
          />
        </MenuItem>
      </Menu>

    </>
  );
};

export default AccountSwitcher;

