import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
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
} from '@mui/icons-material';

// Import our new components
import GlobalAssetForm from './GlobalAssetForm';
import GlobalAssetList from './GlobalAssetList';
import AssetPriceManagement from './AssetPriceManagement';
import MarketDataDashboard from './MarketDataDashboard';

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
  
  // Props for price management
  onPriceUpdate: (assetId: string, price: number, priceType: string, priceSource: string, changeReason?: string) => Promise<void>;
  onPriceHistoryRefresh: (assetId: string) => Promise<void>;
  
  // Props for market data
  marketDataStats: any;
  marketDataProviders: any[];
  recentUpdates: any[];
  onMarketDataRefresh: () => void;
  onUpdateAllPrices: () => void;
  onUpdateByNation: (nation: string) => void;
  onUpdateByMarket: (marketCode: string) => void;
  onTestProvider: (providerName: string) => void;
  onUpdateConfig: (config: any) => void;
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
  onPriceUpdate,
  onPriceHistoryRefresh,
  marketDataStats,
  marketDataProviders,
  recentUpdates,
  onMarketDataRefresh,
  onUpdateAllPrices,
  onUpdateByNation,
  onUpdateByMarket,
  onTestProvider,
  onUpdateConfig,
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
      US: 'United States',
      UK: 'United Kingdom',
      JP: 'Japan',
      SG: 'Singapore',
      AU: 'Australia',
      CA: 'Canada',
      DE: 'Germany',
      FR: 'France',
      CN: 'China',
    };
    return names[code] || code;
  };


  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={onRefresh}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Global Asset Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Showing {assets.length} of {total} assets (Page {page} of {totalPages})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAsset}
            disabled={loading}
          >
            Add Asset
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Assets" />
            <Tab label="Market Data" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
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
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <MarketDataDashboard
                stats={marketDataStats}
                providers={marketDataProviders}
                recentUpdates={recentUpdates}
                onRefresh={onMarketDataRefresh}
                onUpdateAll={onUpdateAllPrices}
                onUpdateByNation={onUpdateByNation}
                onUpdateByMarket={onUpdateByMarket}
                onTestProvider={onTestProvider}
                onUpdateConfig={onUpdateConfig}
                loading={loading}
                error={error}
              />
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Asset Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Assets
                      </Typography>
                      <Typography variant="h4">
                        {assets.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Assets
                      </Typography>
                      <Typography variant="h4">
                        {assets.filter(asset => asset.isActive).length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Nations
                      </Typography>
                      <Typography variant="h4">
                        {new Set(assets.map(asset => asset.nation)).size}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Asset Distribution by Type
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(
                    assets.reduce((acc, asset) => {
                      acc[asset.type] = (acc[asset.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <Grid item xs={12} sm={6} md={3} key={type}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={type}
                              size="small"
                              sx={{ backgroundColor: getAssetTypeColor(type), color: 'white' }}
                            />
                            <Typography variant="h6">
                              {count}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Asset Distribution by Nation
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(
                    assets.reduce((acc, asset) => {
                      acc[asset.nation] = (acc[asset.nation] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([nation, count]) => (
                    <Grid item xs={12} sm={6} md={3} key={nation}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {getNationDisplayName(nation)}
                            </Typography>
                            <Typography variant="h6">
                              {count}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
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

      {/* Price Management Dialog */}
      {selectedAsset && (
        <Dialog
          open={priceManagementOpen}
          onClose={handlePriceManagementClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Price Management - {selectedAsset.symbol}
          </DialogTitle>
          <DialogContent>
            <AssetPriceManagement
              asset={{
                id: selectedAsset.id,
                symbol: selectedAsset.symbol,
                name: selectedAsset.name,
                currency: selectedAsset.currency,
                assetPrice: selectedAsset.assetPrice ? {
                  id: '',
                  assetId: selectedAsset.id,
                  currentPrice: selectedAsset.assetPrice.currentPrice,
                  priceType: selectedAsset.assetPrice.priceType,
                  priceSource: selectedAsset.assetPrice.priceSource,
                  lastPriceUpdate: selectedAsset.assetPrice.lastPriceUpdate,
                } : undefined
              }}
              onPriceUpdate={onPriceUpdate}
              onPriceHistoryRefresh={onPriceHistoryRefresh}
              loading={loading}
              error={error}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePriceManagementClose}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

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
                              Last updated: {formatDate(assetToDelete.assetPrice.lastPriceUpdate)}
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
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            disabled={deleteLoading}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{ 
              minWidth: 120,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'error.dark',
              }
            }}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
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
