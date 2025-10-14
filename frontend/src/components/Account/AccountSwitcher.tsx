import React, { useState, useEffect } from 'react';
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
import {
  AccountBalance as AccountIcon,
  Star as StarIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { Account } from '../../types';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import EditAccountModal from './EditAccountModal';

export const AccountSwitcher: React.FC = () => {
  const { currentAccount, switchAccount } = useAccount();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await apiService.getAccounts();
      
      // Sort accounts: main account first, then by creation date
      const sortedAccounts = accountsData.sort((a: Account, b: Account) => {
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

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setEditModalOpen(true);
    handleClose();
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    setAccounts(prev => {
      const updatedAccounts = prev.map(acc => 
        acc.accountId === updatedAccount.accountId ? updatedAccount : acc
      );
      // Re-sort to ensure main account stays on top
      return updatedAccounts.sort((a: Account, b: Account) => {
        if (a.isMainAccount && !b.isMainAccount) return -1;
        if (!a.isMainAccount && b.isMainAccount) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
    
    // If the updated account is the current account, update the current account
    if (currentAccount?.accountId === updatedAccount.accountId) {
      switchAccount(updatedAccount.accountId);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'VND': '₫',
      'USD': '$'
    };
    return symbols[currency] || currency;
  };

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
        <Tooltip title={loading ? 'Switching...' : (currentAccount?.name || 'Switch Account')}>
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
              {loading ? 'Switching...' : ''}
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
            Select Account
          </Typography>
          <Tooltip title="Edit Current Account">
            <IconButton
              size="small"
              onClick={() => {
                if (currentAccount) {
                  handleEditAccount(currentAccount);
                }
              }}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'primary.50',
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />

        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading accounts...
            </Typography>
          </Box>
        ) : accounts.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No accounts available
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
                '&.Mui-selected': {
                  backgroundColor: account.isMainAccount ? 'primary.200' : 'primary.light',
                  '&:hover': {
                    backgroundColor: account.isMainAccount ? 'primary.200' : 'primary.light',
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
                    ...(account.isMainAccount && {
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      border: '2px solid',
                      borderColor: 'primary.main',
                    })
                  }}>
                    {getAccountInitials(account.name)}
                  </Avatar>
                  {account.isMainAccount && (
                    <StarIcon 
                      sx={{ 
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        fontSize: '0.75rem',
                        color: 'primary.main',
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
                    {account.isMainAccount && (
                      <Chip
                        label="Main Account"
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
                        label="Investor"
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
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      •
                    </Box>
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {account.baseCurrency} {getCurrencySymbol(account.baseCurrency)}
                    </Box>
                    {account.isMainAccount && (
                      <>
                        <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          •
                        </Box>
                        <Box component="span" sx={{ fontSize: '0.75rem', color: 'primary.main', fontWeight: 'bold' }}>
                          Protected Account
                        </Box>
                      </>
                    )}
                  </Box>
                }
              />
            </MenuItem>
          ))
        )}

        <Divider />
        <MenuItem
          onClick={() => {
            if (currentAccount) {
              handleEditAccount(currentAccount);
            }
          }}
          sx={{ py: 1.5, px: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <Avatar sx={{ width: 32, height: 32, backgroundColor: 'secondary.light' }}>
              <EditIcon sx={{ fontSize: '1rem' }} />
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary="Edit Current Account"
            secondary="Update account information"
          />
        </MenuItem>
      </Menu>

      <EditAccountModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        onAccountUpdated={handleAccountUpdated}
      />
    </>
  );
};

export default AccountSwitcher;

