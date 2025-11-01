import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Stack,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';

// Import our new components
import GlobalAssetForm from './GlobalAssetForm';
import GlobalAssetList from './GlobalAssetList';
import GlobalAssetTrackingDashboard from './GlobalAssetTrackingDashboard';
import GlobalAssetPriceManagementModal from './GlobalAssetManagement/GlobalAssetPriceManagementModal';
import { ResponsiveButton, ActionButton } from './Common';

// Import hooks
import { useDeleteGlobalAsset } from '../hooks/useGlobalAssets';

// Import utilities
import { formatCurrency, formatDate } from '../utils/format';

// Types
interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  priceMode: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  assetPrice?: {
    currentPrice: number;
    priceType: string;
    priceSource: string;
    lastPriceUpdate: string;
  };
}

interface GlobalAssetManagementProps {
  // Props for asset management
  assets: GlobalAsset[];
  loading?: boolean;
  error?: string;
  onRefresh: () => void;
  onCreateAsset: (data: any) => Promise<void>;
  onUpdateAsset: (id: string, data: any) => Promise<void>;
  
  // Pagination props
  total?: number;
  page?: number;
  totalPages?: number;
  rowsPerPage?: number;
  onChangePage?: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Props for price management
  onPriceUpdate: (assetId: string, price: number, priceType: string, priceSource: string, changeReason?: string) => Promise<void>;
  onPriceHistoryRefresh: (assetId: string) => Promise<void>;
  
  // Props for price updates
  onUpdateAllPrices: () => void;
}

const GlobalAssetManagement: React.FC<GlobalAssetManagementProps> = ({
  assets,
  loading = false,
  error,
  onRefresh,
  onCreateAsset,
  onUpdateAsset,
  total = 0,
  page = 1,
  totalPages = 1,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage,
  onPriceUpdate,
  onPriceHistoryRefresh,
  onUpdateAllPrices,
}) => {
  
  const [tabValue, setTabValue] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<GlobalAsset | null>(null);
  const [priceManagementOpen, setPriceManagementOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<GlobalAsset | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false);

  // Use the delete hook
  const deleteGlobalAssetMutation = useDeleteGlobalAsset();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateAsset = () => {
    setFormMode('create');
    setSelectedAsset(null);
    setFormOpen(true);
  };

  const handleEditAsset = (asset: GlobalAsset) => {
    setFormMode('edit');
    setSelectedAsset(asset);
    setFormOpen(true);
  };

  const handleDeleteAsset = (asset: GlobalAsset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteGlobalAssetMutation.mutateAsync(assetToDelete.id);
      
      // Show success notification
      setSnackbar({
        open: true,
        message: `Asset "${assetToDelete.symbol}" has been deleted successfully`,
        severity: 'success',
      });
      
      // Refresh the data
      onRefresh();
      // Close dialog
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete asset';
      setSnackbar({
        open: true,
        message: `Failed to delete asset: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleViewAsset = (asset: GlobalAsset) => {
    setSelectedAsset(asset);
    setPriceManagementOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    try {
      if (formMode === 'create') {
        await onCreateAsset(data);
      } else if (selectedAsset) {
        await onUpdateAsset(selectedAsset.id, data);
      }
      setFormOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedAsset(null);
  };

  const handlePriceManagementClose = () => {
    setPriceManagementOpen(false);
    setSelectedAsset(null);
  };

  const handleUpdateAllPrices = async () => {
    setIsUpdatingAllPrices(true);
    try {
      await onUpdateAllPrices();
      
      // Show success notification
      setSnackbar({
        open: true,
        message: 'All prices have been updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Update all prices error:', error);
      
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'Failed to update all prices';
      setSnackbar({
        open: true,
        message: `Failed to update all prices: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setIsUpdatingAllPrices(false);
    }
  };

  const getAssetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      STOCK: '#1976d2',
      BOND: '#388e3c',
      CRYPTO: '#f57c00',
      COMMODITY: '#7b1fa2',
      CURRENCY: '#d32f2f',
      ETF: '#0288d1',
      MUTUAL_FUND: '#5d4037',
    };
    return colors[type] || '#666';
  };

  const getNationDisplayName = (code: string) => {
    const names: Record<string, string> = {
      VN: 'Vietnam',
      US: 'United States'
    };
    return names[code] || code;
  };

  if (error) {
    return (
      <Alert severity="error" action={
        <ResponsiveButton color="inherit" size="small" onClick={onRefresh} mobileText="Retry" desktopText="Retry">
          Retry
        </ResponsiveButton>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      p: { xs: 1.5, sm: 2 }
    }}>
      {/* Header Section */}
      <Card sx={{ 
        mb: { xs: 2, sm: 3 },
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" component="h1" sx={{ 
                fontWeight: 700,
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                Global Asset Management
              </Typography>
              <Typography variant="h6" sx={{ 
                opacity: 0.9,
                fontWeight: 400,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Chip 
                  label={`${assets.length} Assets`} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    fontWeight: 600
                  }} 
                />
                <span>•</span>
                <span>Page {page} of {totalPages}</span>
                <span>•</span>
                <span>{total} Total</span>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <ResponsiveButton
                variant="outlined"
                icon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={loading}
                mobileText="Refresh"
                desktopText="Refresh"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderColor: 'rgba(255,255,255,0.5)',
                  }
                }}
              >
                Refresh
              </ResponsiveButton>
              <ActionButton
                variant="outlined"
                icon={isUpdatingAllPrices ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                onClick={handleUpdateAllPrices}
                disabled={isUpdatingAllPrices || loading}
                mobileText={isUpdatingAllPrices ? 'Updating...' : 'Update All'}
                desktopText={isUpdatingAllPrices ? 'Updating...' : 'Update All Prices'}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderColor: 'rgba(255,255,255,0.5)',
                  }
                }}
              >
                {isUpdatingAllPrices ? 'Updating...' : 'Update All Prices'}
              </ActionButton>
              <ActionButton
                variant="contained"
                icon={<AddIcon />}
                onClick={handleCreateAsset}
                disabled={loading}
                mobileText="Add"
                desktopText="Add Asset"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: '#667eea',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  '&:hover': {
                    backgroundColor: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                  }
                }}
              >
                Add Asset
              </ActionButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Main Content Card */}
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Enhanced Tabs */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: 2,
                px: { xs: 2, sm: 4 },
                textTransform: 'none',
                minHeight: 64,
                minWidth: { xs: 'auto', sm: 120 },
                '&.Mui-selected': {
                  color: '#667eea',
                  fontWeight: 700,
                }
              },
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: '2px 2px 0 0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': {
                  opacity: 0.3,
                }
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: tabValue === 0 ? '#667eea' : '#6c757d' 
                  }} />
                  Assets
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: tabValue === 1 ? '#667eea' : '#6c757d' 
                  }} />
                  Auto Sync Tracking
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 4, minHeight: 600 }}>
          {tabValue === 0 && (
            <Box>
              <GlobalAssetList
                assets={assets}
                loading={loading}
                onEdit={handleEditAsset}
                onDelete={handleDeleteAsset}
                onView={handleViewAsset}
                onRefresh={onRefresh}
                error={error}
                total={total}
                page={page}
                rowsPerPage={rowsPerPage}
                onChangePage={onChangePage}
                onChangeRowsPerPage={onChangeRowsPerPage}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <GlobalAssetTrackingDashboard />
            </Box>
          )}
        </Box>
      </Card>

      {/* Asset Form Dialog */}
      <GlobalAssetForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={selectedAsset || undefined}
        mode={formMode}
        loading={formLoading}
      />

      {/* Global Asset Price Management Modal */}
      <GlobalAssetPriceManagementModal
        open={priceManagementOpen}
        onClose={handlePriceManagementClose}
        asset={selectedAsset}
        onPriceUpdate={onPriceUpdate}
        onPriceHistoryRefresh={onPriceHistoryRefresh}
        loading={loading}
        error={error}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
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
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <WarningIcon color="error" sx={{ fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Delete Asset
          </Typography>
          <IconButton
            onClick={handleCancelDelete}
            size="small"
            sx={{ 
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Stack spacing={3}>
            {/* Warning Alert */}
            <Alert 
              severity="warning" 
              sx={{ 
                borderRadius: 1,
                '& .MuiAlert-icon': { fontSize: 20 }
              }}
            >
              <Typography variant="body2" fontWeight="medium">
                This action cannot be undone
              </Typography>
            </Alert>

            {/* Asset Information */}
            {assetToDelete && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  You are about to delete the following asset:
                </Typography>
                
                <Card variant="outlined" sx={{ mt: 1, bgcolor: 'grey.50' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: getAssetTypeColor(assetToDelete.type),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.875rem'
                          }}
                        >
                          {assetToDelete.symbol.charAt(0)}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {assetToDelete.symbol}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {assetToDelete.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={assetToDelete.type}
                          size="small"
                          sx={{ 
                            backgroundColor: getAssetTypeColor(assetToDelete.type), 
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </Box>

                      <Divider />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Nation
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {getNationDisplayName(assetToDelete.nation)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Market Code
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {assetToDelete.marketCode}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Currency
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {assetToDelete.currency}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Status
                          </Typography>
                          <Chip
                            label={assetToDelete.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={assetToDelete.isActive ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Grid>
                      </Grid>

                      {assetToDelete.assetPrice && (
                        <>
                          <Divider />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Current Price
                            </Typography>
                            <Typography variant="h6" color="primary" fontWeight="bold">
                              {formatCurrency(assetToDelete.assetPrice.currentPrice, assetToDelete.currency)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last updated: {formatDate(assetToDelete.assetPrice.lastPriceUpdate, 'full')}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Confirmation Text */}
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Are you sure you want to delete this asset? This will permanently remove all associated data including price history and trading records.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          pt: 2,
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <ResponsiveButton
            onClick={handleCancelDelete}
            variant="outlined"
            disabled={deleteLoading}
            mobileText="Cancel"
            desktopText="Cancel"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </ResponsiveButton>
          <ActionButton
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            icon={deleteLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
            mobileText={deleteLoading ? 'Deleting...' : 'Delete'}
            desktopText={deleteLoading ? 'Deleting...' : 'Delete Asset'}
            sx={{ 
              minWidth: 120,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'error.dark',
              }
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Asset'}
          </ActionButton>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: 3,
            fontWeight: 600,
            '& .MuiAlert-icon': {
              fontSize: 24
            },
            '& .MuiAlert-message': {
              fontSize: '1rem'
            }
          }}
          icon={
            snackbar.severity === 'success' ? <CheckCircleIcon /> :
            snackbar.severity === 'error' ? <ErrorIcon /> :
            snackbar.severity === 'warning' ? <WarningIcon /> : undefined
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GlobalAssetManagement;
