/**
 * Portfolio Permission Management Modal
 * Allows managing permissions for portfolio access
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
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
} from '@mui/material';
import {
  Close as CloseIcon,
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


// PortfolioPermission interface is now imported from API service

interface PortfolioPermissionModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
  onPermissionUpdated?: () => void;
}

const PortfolioPermissionModal: React.FC<PortfolioPermissionModalProps> = ({
  open,
  onClose,
  portfolioId,
  portfolioName,
  onPermissionUpdated,
}) => {
  const { accountId } = useAccount();
  const [permissions, setPermissions] = useState<PortfolioPermission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedPermissionType, setSelectedPermissionType] = useState<PortfolioPermissionType>(PortfolioPermissionType.VIEW);
  const [isAddingPermission, setIsAddingPermission] = useState(false);

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
      setError('Failed to load permissions');
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
      setPermissions(prev => [...prev, newPermission]);
      setSelectedAccountId('');
      setSelectedPermissionType(PortfolioPermissionType.VIEW);
      
      if (onPermissionUpdated) {
        onPermissionUpdated();
      }
    } catch (err) {
      setError('Failed to add permission');
      console.error('Error adding permission:', err);
    } finally {
      setIsAddingPermission(false);
    }
  };


  const handleDeletePermission = async (permissionId: string) => {
    if (!window.confirm('Are you sure you want to remove this permission?') || !accountId) return;

    try {
      await portfolioPermissionApi.deletePermission(permissionId, portfolioId, accountId);
      setPermissions(prev => prev.filter(perm => perm.permissionId !== permissionId));
      
      if (onPermissionUpdated) {
        onPermissionUpdated();
      }
    } catch (err) {
      setError('Failed to delete permission');
      console.error('Error deleting permission:', err);
    }
  };

  const getPermissionIcon = (permissionType: PortfolioPermissionType) => {
    switch (permissionType) {
      case PortfolioPermissionType.OWNER:
        return <OwnerIcon />;
      case PortfolioPermissionType.UPDATE:
        return <UpdateIcon />;
      case PortfolioPermissionType.VIEW:
        return <ViewIcon />;
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
      default:
        return 'default';
    }
  };

  const getPermissionLabel = (permissionType: PortfolioPermissionType) => {
    switch (permissionType) {
      case PortfolioPermissionType.OWNER:
        return 'Owner';
      case PortfolioPermissionType.UPDATE:
        return 'Update';
      case PortfolioPermissionType.VIEW:
        return 'View';
      default:
        return 'Unknown';
    }
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">
              Manage Portfolio Permissions
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {portfolioName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Add Permission Section */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle1" gutterBottom>
            <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Add New Permission
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Account ID"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              size="small"
              placeholder="Enter account ID (UUID format)"
              sx={{ minWidth: 400 }}
              // helperText="Enter the account ID to grant permission to"
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Permission</InputLabel>
              <Select
                value={selectedPermissionType}
                onChange={(e) => setSelectedPermissionType(e.target.value as PortfolioPermissionType)}
                label="Permission"
              >
                <MenuItem value={PortfolioPermissionType.VIEW}>View</MenuItem>
                <MenuItem value={PortfolioPermissionType.UPDATE}>Update</MenuItem>
                <MenuItem value={PortfolioPermissionType.OWNER}>Owner</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              onClick={handleAddPermission}
              disabled={!selectedAccountId || isAddingPermission}
              startIcon={isAddingPermission ? <CircularProgress size={16} /> : <AddIcon />}
            >
              Add Permission
            </Button>
          </Box>
        </Paper>

        {/* Permissions List */}
        <Typography variant="subtitle1" gutterBottom>
          Current Permissions ({permissions.length})
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell>Permission</TableCell>
                  <TableCell>Granted</TableCell>
                  <TableCell>Actions</TableCell>
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
                          <Typography variant="body2" fontWeight="medium">
                            {permission.accountName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission.accountEmail}
                          </Typography>
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
                      <Typography variant="caption">
                        {new Date(permission.grantedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1}>
                        {/* <Tooltip title="Update Permission">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const newType = permission.permissionType === PortfolioPermissionType.VIEW 
                                ? PortfolioPermissionType.UPDATE 
                                : PortfolioPermissionType.VIEW;
                              handleUpdatePermission(permission.permissionId, newType);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip> */}
                        {permission.permissionType !== PortfolioPermissionType.OWNER && (
                          <Tooltip title="Remove Permission">
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
            <Typography variant="body1" color="text.secondary">
              No permissions set for this portfolio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add accounts to share access to this portfolio
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortfolioPermissionModal;
