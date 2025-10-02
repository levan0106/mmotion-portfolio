import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { Account } from '../../types';
import { apiService } from '../../services/api';
import CreateAccountModal from './CreateAccountModal';
import EditAccountModal from './EditAccountModal';

export const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.api.get('/api/v1/accounts');
      // Sort accounts: main account first, then by creation date
      const sortedAccounts = sortAccounts(response.data);
      setAccounts(sortedAccounts);
    } catch (err: any) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = (newAccount: Account) => {
    setAccounts(prev => {
      const updatedAccounts = [newAccount, ...prev];
      // Re-sort to ensure main account stays on top
      return sortAccounts(updatedAccounts);
    });
    setCreateModalOpen(false);
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setEditModalOpen(true);
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    setAccounts(prev => {
      const updatedAccounts = prev.map(acc => 
        acc.accountId === updatedAccount.accountId ? updatedAccount : acc
      );
      // Re-sort to ensure main account stays on top
      return sortAccounts(updatedAccounts);
    });
    setEditModalOpen(false);
    setSelectedAccount(null);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      await apiService.api.delete(`/api/v1/accounts/${accountId}`);
      setAccounts(prev => prev.filter(acc => acc.accountId !== accountId));
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'VND': '₫',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
    };
    return symbols[currency] || currency;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sortAccounts = (accounts: Account[]) => {
    return accounts.sort((a: Account, b: Account) => {
      if (a.isMainAccount && !b.isMainAccount) return -1;
      if (!a.isMainAccount && b.isMainAccount) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="h1">
              Account Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Account
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {accounts.map((account, index) => (
                <React.Fragment key={account.accountId}>
                  <ListItem 
                    sx={{ 
                      py: 1,
                      ...(account.isMainAccount && {
                        backgroundColor: 'primary.50',
                        mb: 0.5,
                      })
                    }}
                  >
                    <Box sx={{ position: 'relative', mr: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: account.isMainAccount 
                            ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                            : 'primary.main',
                        }}
                      >
                        {getInitials(account.name)}
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
                    <ListItemText
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="h6">
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
                        <Box component="span">
                          <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary', display: 'block' }}>
                            {account.email}
                          </Box>
                          <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', display: 'block' }}>
                            Base Currency: {account.baseCurrency} {getCurrencySymbol(account.baseCurrency)}
                          </Box>
                          {account.isMainAccount && (
                            <Box component="span" sx={{ fontSize: '0.75rem', color: 'primary.main', fontWeight: 'bold', display: 'block', mt: 0.5 }}>
                              🛡️ Protected Account - Cannot be deleted
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditAccount(account)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      {!account.isMainAccount && (
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteAccount(account.accountId)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < accounts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {accounts.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No accounts found. Create your first account to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <CreateAccountModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onAccountCreated={handleCreateAccount}
      />

      <EditAccountModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        onAccountUpdated={handleAccountUpdated}
      />
    </Box>
  );
};

export default AccountManagement;
