/**
 * Portfolio Permission Management Modal
 * Allows managing permissions for portfolio access
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
  Edit as UpdateIcon,
  AdminPanelSettings as OwnerIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { PortfolioPermissionType } from '../../types';
import { portfolioPermissionApi, PortfolioPermission, CreatePortfolioPermissionDto } from '../../services/api.portfolio-permission';
import { useAccount } from '../../contexts/AccountContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import ModalWrapper from '../Common/ModalWrapper';
import { ResponsiveButton } from '../Common';
import { ToastService } from '../../services/toast';


// PortfolioPermission interface is now imported from API service

interface PortfolioPermissionModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
  onPermissionUpdated?: () => void;
  creatorAccountId: string;
}

const PortfolioPermissionModal: React.FC<PortfolioPermissionModalProps> = ({
  open,
  onClose,
  portfolioId,
  portfolioName,
  onPermissionUpdated,
  creatorAccountId,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<PortfolioPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedPermissionType, setSelectedPermissionType] = useState<PortfolioPermissionType>(PortfolioPermissionType.VIEW);
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(null);

  // Load permissions when modal opens
  useEffect(() => {
    if (open && portfolioId) {
      loadPermissions();
    }
  }, [open, portfolioId]);

  const loadPermissions = async () => {
    if (!accountId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const permissions = await portfolioPermissionApi.getPortfolioPermissions(portfolioId, accountId);
      setPermissions(permissions);
    } catch (err) {
      setError(t('permissions.errors.loadFailed'));
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddPermission = async () => {
    if (!selectedAccountId || !selectedPermissionType || !accountId) return;

    try {
      setIsAddingPermission(true);
            
      const createDto: CreatePortfolioPermissionDto = {
        portfolioId,
        accountId: selectedAccountId,
        permissionType: selectedPermissionType,
      };
      
      const newPermission = await portfolioPermissionApi.createPermission(createDto, accountId);
      
      // Nếu là CREATOR, đóng modal, hiển thị toast và navigate về /portfolios
      if (selectedPermissionType === PortfolioPermissionType.CREATOR) {
        setSelectedAccountId('');
        setSelectedPermissionType(PortfolioPermissionType.VIEW);
        
        // Hiển thị toast success message
        ToastService.success(t('permissions.transferCreatorSuccess'));
        
        // Đóng modal
        onClose();
        
        // Navigate về /portfolios
        navigate('/portfolios');
        
        // Hiển thị toast message
        if (onPermissionUpdated) {
          onPermissionUpdated();
        }
      } else {
        setPermissions(prev => [...prev, newPermission]);
        setSelectedAccountId('');
        setSelectedPermissionType(PortfolioPermissionType.VIEW);
        
        if (onPermissionUpdated) {
          onPermissionUpdated();
        }
      }
    } catch (err) {
      if (selectedPermissionType === PortfolioPermissionType.CREATOR) {
        setError(t('permissions.errors.transferCreatorFailed'));
      } else {
        setError(t('permissions.errors.addFailed'));
      }
      console.error('Error adding permission:', err);
    } finally {
      setIsAddingPermission(false);
    }
  };


  const handleDeletePermission = (permissionId: string) => {
    setPermissionToDelete(permissionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeletePermission = async () => {
    if (!permissionToDelete || !accountId) return;

    try {
      await portfolioPermissionApi.deletePermission(permissionToDelete, portfolioId, accountId);
      setPermissions(prev => prev.filter(perm => perm.permissionId !== permissionToDelete));
      
      // Hiển thị toast success message
      ToastService.success(t('permissions.deleteSuccess'));
      
      if (onPermissionUpdated) {
        onPermissionUpdated();
      }
    } catch (err) {
      // Hiển thị toast error message
      ToastService.error(t('permissions.errors.deleteFailed'));
      setError('Failed to delete permission');
      console.error('Error deleting permission:', err);
    } finally {
      setDeleteConfirmOpen(false);
      setPermissionToDelete(null);
    }
  };

  const cancelDeletePermission = () => {
    setDeleteConfirmOpen(false);
    setPermissionToDelete(null);
  };

  const getPermissionIcon = (permissionType: PortfolioPermissionType) => {
    switch (permissionType) {
      case PortfolioPermissionType.OWNER:
        return <OwnerIcon />;
      case PortfolioPermissionType.UPDATE:
        return <UpdateIcon />;
      case PortfolioPermissionType.VIEW:
        return <ViewIcon />;
      case PortfolioPermissionType.CREATOR:
        return <PersonAddIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  const getPermissionColor = (permissionType: PortfolioPermissionType) => {
    switch (permissionType) {
      case PortfolioPermissionType.OWNER:
        return 'error';
      case PortfolioPermissionType.UPDATE:
        return 'warning';
      case PortfolioPermissionType.VIEW:
        return 'info';
      case PortfolioPermissionType.CREATOR:
        return 'success';
      default:
        return 'default';
    }
  };

  const getPermissionLabel = (permissionType: PortfolioPermissionType) => {
    switch (permissionType) {
      case PortfolioPermissionType.OWNER:
        return t('permissions.permissionTypes.owner');
      case PortfolioPermissionType.UPDATE:
        return t('permissions.permissionTypes.update');
      case PortfolioPermissionType.VIEW:
        return t('permissions.permissionTypes.view');
      case PortfolioPermissionType.CREATOR:
        return t('permissions.permissionTypes.creator');
      default:
        return 'Unknown';
    }
  };


  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t('permissions.title')}
      icon={<SecurityIcon color="primary" />}
      maxWidth="md"
      fullWidth
      size="large"
      actions={
        <ResponsiveButton
          onClick={onClose}
          variant="outlined"
          mobileText={t('common.close')}
          desktopText={t('common.close')}
        >
          {t('common.close')}
        </ResponsiveButton>
      }
    >
        <ResponsiveTypography variant="cardTitle" sx={{ mb: 2 }}>
          {portfolioName}
        </ResponsiveTypography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Add Permission Section */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
          <ResponsiveTypography variant="cardLabel" gutterBottom>
            <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('permissions.addNewPermission')}
          </ResponsiveTypography>
          
          {/* Warning for CREATOR permission */}
          {selectedPermissionType === PortfolioPermissionType.CREATOR && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>{t('permissions.transferCreatorWarning')}</AlertTitle>
              {t('permissions.transferCreatorWarningMessage')}
            </Alert>
          )}
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label={t('permissions.accountId')}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              size="medium"
              placeholder={t('permissions.accountIdPlaceholder')}
              sx={{ width: '100%' }}
              // helperText="Enter the account ID to grant permission to"
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('permissions.permission')}</InputLabel>
              <Select
                value={selectedPermissionType}
                onChange={(e) => setSelectedPermissionType(e.target.value as PortfolioPermissionType)}
                label={t('permissions.permission')}
              >
                <MenuItem value={PortfolioPermissionType.VIEW}>{t('permissions.permissionTypes.view')}</MenuItem>
                <MenuItem value={PortfolioPermissionType.UPDATE}>{t('permissions.permissionTypes.update')}</MenuItem>
                <MenuItem value={PortfolioPermissionType.OWNER}>{t('permissions.permissionTypes.owner')}</MenuItem>
                {/* Only show creator permission if the current account is the owner */}
                {creatorAccountId && accountId === creatorAccountId && (
                  <MenuItem value={PortfolioPermissionType.CREATOR}>{t('permissions.permissionTypes.creator')}</MenuItem>
                )}
              </Select>
            </FormControl>
            
            <ResponsiveButton
              variant="contained"
              onClick={handleAddPermission}
              disabled={!selectedAccountId || isAddingPermission}
              startIcon={isAddingPermission ? <CircularProgress size={16} /> : <AddIcon />}
              mobileText={selectedPermissionType === PortfolioPermissionType.CREATOR ? t('permissions.transferCreator') : t('permissions.addPermission')}
              desktopText={selectedPermissionType === PortfolioPermissionType.CREATOR ? t('permissions.transferCreator') : t('permissions.addPermission')}
            >
              {selectedPermissionType === PortfolioPermissionType.CREATOR ? t('permissions.transferCreator') : t('permissions.addPermission')}
            </ResponsiveButton>
          </Box>
        </Paper>

        {/* Permissions List */}
        <ResponsiveTypography variant="cardTitle" gutterBottom>
          {t('permissions.currentPermissions')} ({permissions.length})
        </ResponsiveTypography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('permissions.account')}</TableCell>
                  <TableCell>{t('permissions.permission')}</TableCell>
                  <TableCell>{t('permissions.granted')}</TableCell>
                  <TableCell align="center">{t('permissions.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.permissionId}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <ResponsiveTypography variant="tableCell" fontWeight="medium">
                            {permission.accountName || permission.accountId}
                          </ResponsiveTypography>
                          <ResponsiveTypography variant="formHelper" color="text.secondary">
                            {permission.accountEmail || `ID: ${permission.accountId.substring(0, 8)}...`}
                          </ResponsiveTypography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getPermissionIcon(permission.permissionType)}
                        label={getPermissionLabel(permission.permissionType)}
                        color={getPermissionColor(permission.permissionType) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <ResponsiveTypography variant="formHelper">
                        {new Date(permission.grantedAt).toLocaleDateString()}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        {/* Can not delete by itself and not granted by the current account */}
                        {accountId !== permission.accountId && (
                          <Tooltip title={t('permissions.removePermission')}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeletePermission(permission.permissionId)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {permissions.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <ResponsiveTypography variant="cardLabel" color="text.primary">
              {t('permissions.noPermissions')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="cardLabel" color="text.secondary">
              {t('permissions.noPermissionsDescription')}
            </ResponsiveTypography>
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={cancelDeletePermission}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            <ResponsiveTypography variant="cardTitle">
            {t('permissions.confirmRemove')}
            </ResponsiveTypography>
          </DialogTitle>
          <DialogContent>
            <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
              {t('permissions.confirmRemoveDescription')}
            </ResponsiveTypography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDeletePermission} color="primary">
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmDeletePermission} color="error" variant="contained">
              {t('permissions.removePermission')}
            </Button>
          </DialogActions>
        </Dialog>
    </ModalWrapper>
  );
};

export default PortfolioPermissionModal;
