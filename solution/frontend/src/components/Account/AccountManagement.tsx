import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
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
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton, ActionButton } from '../Common';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Star as StarIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Account } from '../../types';
import { apiService } from '../../services/api';
import CreateAccountModal from './CreateAccountModal';
import EditAccountModal from './EditAccountModal';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/services/api.userRoles';

export const AccountManagement: React.FC = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAccountForMenu, setSelectedAccountForMenu] = useState<Account | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const { userRoles, isLoading: isLoadingRoles } = usePermissions();

  useEffect(() => {
    // Wait for userRoles to be loaded before loading accounts
    if (!isLoadingRoles && userRoles !== null && userRoles !== undefined) {
      setTimeout(() => {
        loadAccounts();
      }, 100);
    }
  }, [isLoadingRoles, userRoles]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.api.get('/api/v1/accounts');

      // remove demo account in main account list
      let filteredAccounts: Account[] = [];
      // Check if userRoles exists and is an array before using it
      if (!userRoles || !Array.isArray(userRoles) || !userRoles.some((role: UserRole) => role.roleName.toLowerCase() === 'super_admin')) {
        filteredAccounts = response.data.filter((account: Account) => !account.isDemoAccount);
      } else {
        filteredAccounts = response.data;
      }

      // Sort accounts: main account first, then by creation date
      const sortedAccounts = sortAccounts(filteredAccounts);
      setAccounts(sortedAccounts);
    } catch (err: any) {
      console.error('Error loading accounts:', err);
      setError(t('accountManagement.error.loadFailed'));
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
    const account = accounts.find(acc => acc.accountId === accountId);
    if (account) {
      setAccountToDelete(account);
      setDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    try {
      setDeleting(true);
      await apiService.api.delete(`/api/v1/accounts/${accountToDelete.accountId}`);
      setAccounts(prev => prev.filter(acc => acc.accountId !== accountToDelete.accountId));
      setDeleteConfirmOpen(false);
      setAccountToDelete(null);
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(t('accountManagement.error.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setAccountToDelete(null);
  };

  const handleCopyId = async (accountId: string) => {
    try {
      await navigator.clipboard.writeText(accountId);
      setCopiedId(accountId);
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = accountId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(accountId);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }
  };

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>, account: Account) => {
    setMoreMenuAnchor(event.currentTarget);
    setSelectedAccountForMenu(account);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
    setSelectedAccountForMenu(null);
  };

  const handleEditFromMenu = () => {
    if (selectedAccountForMenu) {
      handleEditAccount(selectedAccountForMenu);
    }
    handleMoreMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedAccountForMenu) {
      handleDeleteAccount(selectedAccountForMenu.accountId);
    }
    handleMoreMenuClose();
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
    <Box sx={{ p: { xs: 0, sm: 2 } }}>
      <Card>
        <CardContent sx={{ p: { xs: 0, sm: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
            <ActionButton
              variant="contained"
              icon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
              mobileText={t('accountManagement.create')}
              desktopText={t('accountManagement.createAccount')}
            >
              {t('accountManagement.createAccount')}
            </ActionButton>
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
                      py: 0.5,
                      px: 1,
                      pr: 6, // Add right padding to prevent text from overlapping with More Actions button
                      ...(account.isMainAccount && {
                        backgroundColor: 'primary.50',
                        mb: 0.25,
                      })
                    }}
                  >
                    <Box sx={{ position: 'relative', mr: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 36,
                          height: 36,
                          fontSize: '0.875rem',
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
                      sx={{ 
                        pr: 2, // Add right padding to ListItemText
                        maxWidth: 'calc(100% - 60px)', // Ensure text doesn't overlap with More Actions button
                      }}
                      primary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.25 }}>
                          <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {account.name}
                          </ResponsiveTypography>
                          <ResponsiveTypography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                            {account.email}
                          </ResponsiveTypography>
                          {account.isMainAccount && (
                            <Chip
                              label={t('accountManagement.main')}
                              size="small"
                              color="primary"
                              variant="filled"
                              sx={{
                                height: 18,
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                color: 'white',
                                '& .MuiChip-label': {
                                  px: 0.75,
                                }
                              }}
                            />
                          )}
                          {account.isInvestor && (
                            <Chip
                              label={t('accountManagement.investor')}
                              size="small"
                              color="secondary"
                              sx={{ height: 18, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box component="span" sx={{ mt: 0.25 }}>
                          <Box component="span" sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            flexWrap: 'wrap',
                            fontSize: '0.7rem'
                          }}>
                            <Box component="span" sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: 'text.primary', 
                              fontFamily: 'monospace', 
                              fontWeight: 500,
                              backgroundColor: copiedId === account.accountId ? 'success.50' : 'grey.100',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 0.5,
                              border: '1px solid',
                              borderColor: copiedId === account.accountId ? 'success.300' : 'grey.300',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: copiedId === account.accountId ? 'success.100' : 'grey.200',
                                borderColor: copiedId === account.accountId ? 'success.400' : 'grey.400',
                              }
                            }}
                            onClick={() => handleCopyId(account.accountId)}
                            title={t('accountManagement.copyIdTooltip')}
                            >
                              <Box component="span">
                                ID: {account.accountId}
                              </Box>
                              {copiedId === account.accountId ? (
                                <CheckIcon sx={{ fontSize: '0.75rem', color: 'success.main' }} />
                              ) : (
                                <CopyIcon sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                              )}
                            </Box>
                            {/* <Box component="span" sx={{ color: 'text.secondary' }}>
                              {account.baseCurrency} {getCurrencySymbol(account.baseCurrency)}
                            </Box> */}
                          </Box>
                          {account.isMainAccount && (
                            <Box component="span" sx={{ 
                              fontSize: '0.7rem', 
                              color: 'primary.main', 
                              fontWeight: 'bold', 
                              display: 'block', 
                              mt: 0.25,
                              backgroundColor: 'primary.50',
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.5,
                              border: '1px solid',
                              borderColor: 'primary.200',
                              width: '100%',
                              maxWidth: '160px',
                            }}>
                              🛡️ {t('accountManagement.protectedAccount')}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction sx={{ right: 8 }}>
                      <Tooltip title={t('accountManagement.moreActions')}>
                        <IconButton
                          edge="end"
                          onClick={(event) => handleMoreMenuOpen(event, account)}
                          sx={{ 
                            zIndex: 1, // Ensure button is above other content
                            backgroundColor: 'background.paper',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            }
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < accounts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {accounts.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ResponsiveTypography variant="body1" color="text.secondary">
                {t('accountManagement.noAccounts')}
              </ResponsiveTypography>
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

      {/* More Actions Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditFromMenu}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ResponsiveTypography variant="body2">
            {t('common.edit')}
          </ResponsiveTypography>
        </MenuItem>
        {selectedAccountForMenu && !selectedAccountForMenu.isMainAccount && (
          <MenuItem onClick={handleDeleteFromMenu} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ResponsiveTypography variant="body2">
              {t('common.delete')}
            </ResponsiveTypography>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '50%',
                backgroundColor: 'error.50',
                color: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WarningIcon sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                {t('accountManagement.deleteConfirm.title')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="body2" color="text.secondary">
                {t('accountManagement.deleteConfirm.subtitle')}
              </ResponsiveTypography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {accountToDelete && (
            <Box>
              <DialogContentText sx={{ mb: 3, color: 'text.primary' }}>
                {t('accountManagement.deleteConfirm.message', { 
                  accountName: accountToDelete.name,
                  accountEmail: accountToDelete.email 
                })}
              </DialogContentText>
              
              {/* Account Info Card */}
              <Card variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getInitials(accountToDelete.name)}
                  </Avatar>
                  <Box flex={1}>
                    <ResponsiveTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {accountToDelete.name}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {accountToDelete.email}
                    </ResponsiveTypography>
                    <Box display="flex" gap={1} mt={1}>
                      {accountToDelete.isMainAccount && (
                        <Chip
                          label={t('accountManagement.main')}
                          size="small"
                          color="primary"
                          variant="filled"
                        />
                      )}
                      {accountToDelete.isInvestor && (
                        <Chip
                          label={t('accountManagement.investor')}
                          size="small"
                          color="secondary"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Card>

              {/* Warning Alert */}
              <Alert severity="warning" sx={{ mt: 2 }}>
                <ResponsiveTypography variant="body2" ellipsis={false}>
                  {t('accountManagement.deleteConfirm.warning')}
                </ResponsiveTypography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <ResponsiveButton
            onClick={handleCancelDelete}
            disabled={deleting}
          >
            {t('common.cancel')}
          </ResponsiveButton>
          <ActionButton
            onClick={handleConfirmDelete}
            disabled={deleting}
            variant="contained"
            color="error"
            icon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            forceTextOnly={true}
            mobileText={deleting ? t('accountManagement.deleteConfirm.deleting') : t('common.delete')}
            desktopText={deleting ? t('accountManagement.deleteConfirm.deleting') : t('common.delete')}
          >
            {deleting ? t('accountManagement.deleteConfirm.deleting') : t('common.delete')}
          </ActionButton>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AccountManagement;
