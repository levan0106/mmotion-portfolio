/**
 * Assets page component - Shows assets for the current account
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Refresh,
  Visibility,
  MonetizationOn,
  AccountBalance,
  Add,
  Edit,
  Delete,
  FilterList,
} from '@mui/icons-material';
import { useAssets } from '../hooks/useAssets';
import { useAccount } from '../contexts/AccountContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { AssetDetailsModal } from '../components/Asset/AssetDetailsModal';
import { AssetFormModal } from '../components/Asset/AssetFormModal';
import { AssetDeleteWarningDialog } from '../components/Asset/AssetDeleteWarningDialog';
import { BulkAssetSelector } from '../components/Asset/BulkAssetSelector';
import AssetsFilterPanel from '../components/Assets/AssetsFilterPanel';
import { UserGuide } from '../components/Common/UserGuide';
import { Asset, AssetFilters as AssetFiltersType } from '../types/asset.types';
import { assetService } from '../services/asset.service';
import { getAssetTypeColor } from '../config/chartColors';

// Memoized table row component for better performance
const AssetTableRow = memo(({ 
  asset, 
  baseCurrency, 
  theme, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  isLoadingDeleteInfo 
}: {
  asset: Asset;
  baseCurrency: string;
  theme: any;
  onViewDetail: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  isLoadingDeleteInfo: boolean;
}) => {
  const getAssetTypeChipColor = (type: string) => {
    const color = getAssetTypeColor(type);
    // Map chart colors to Material-UI chip colors
    switch (color) {
      case '#9c27b0': return 'secondary'; // Purple - STOCK
      case '#059669': return 'success';   // Emerald - BOND
      case '#ff9800': return 'warning';   // Orange - GOLD
      case '#dc3532': return 'error';    // Rose - CRYPTO
      case '#1377c7': return 'info';      // Sky - DEPOSITS
      default: return 'default';
    }
  };

  const currentPrice = Number(asset.currentPrice) || 0;
  const avgCost = Number(asset.avgCost) || 0;
  const priceComparison = avgCost > 0 ? currentPrice - avgCost : 0;
  const priceComparisonPercent = avgCost > 0 ? (priceComparison / avgCost) * 100 : 0;

  return (
    <TableRow
      key={asset.id} 
      sx={{ 
        cursor: 'pointer',
        '&:hover': { 
          backgroundColor: alpha(theme.palette.primary.main, 0.02) 
        } 
      }}
      onClick={() => onViewDetail(asset)}
    >
      <TableCell>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {asset.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {asset.description || 'No description'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          label={asset.type}
          color={getAssetTypeChipColor(asset.type) as any}
          size="small"
          sx={{ 
            fontWeight: 500,
            backgroundColor: getAssetTypeColor(asset.type),
            color: 'white',
            '& .MuiChip-label': {
              color: 'white',
              fontWeight: 600
            }
          }}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
          {asset.symbol}
        </Typography>
      </TableCell>
      <TableCell sx={{ textAlign: 'right' }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {Number(asset.totalQuantity) || 0}
        </Typography>
      </TableCell>
      <TableCell sx={{ textAlign: 'right' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 600, 
              color: priceComparison >= 0 ? 'success.main' : 'error.main'
            }}
          >
            Current: {formatCurrency(currentPrice, baseCurrency)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            Avg Cost: {formatCurrency(avgCost, baseCurrency)}
          </Typography>
          {priceComparisonPercent !== 0 && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                color: priceComparison >= 0 ? 'success.main' : 'error.main',
                fontWeight: 500
              }}
            >
              {priceComparison >= 0 ? '+' : ''}{priceComparisonPercent.toFixed(1)}%
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ textAlign: 'right' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
          {formatCurrency(Number(asset.totalValue) || 0, baseCurrency)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 400, color: 'text.secondary' }}>
          {formatDateTime(asset.updatedAt)}
        </Typography>
      </TableCell>
      <TableCell sx={{ textAlign: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(asset);
              }}
              sx={{ 
                color: 'primary.main',
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1) 
                }
              }}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Asset">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(asset);
              }}
              sx={{ 
                color: 'info.main',
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.info.main, 0.1) 
                }
              }}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Asset">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset);
              }}
              disabled={isLoadingDeleteInfo}
              sx={{ 
                color: 'error.main',
                '&:hover': { 
                  backgroundColor: alpha(theme.palette.error.main, 0.1) 
                }
              }}
            >
              {isLoadingDeleteInfo ? <CircularProgress size={16} /> : <Delete />}
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
});

AssetTableRow.displayName = 'AssetTableRow';

// Memoized summary metrics component
const SummaryMetrics = memo(({ 
  assets, 
  baseCurrency, 
  theme 
}: { 
  assets: Asset[]; 
  baseCurrency: string; 
  theme: any; 
}) => {
  const summaryMetrics = useMemo(() => {
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.totalValue) || 0), 0);
    const averageValue = totalAssets > 0 ? totalValue / totalAssets : 0;
    const assetsByType = assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAssets,
      totalValue,
      averageValue,
      assetsByType,
    };
  }, [assets]);

  const summaryMetricsCards = useMemo(() => [
    {
      title: 'Total Assets',
      value: summaryMetrics.totalAssets.toString(),
      subtitle: 'Assets in portfolio',
      icon: <AccountBalanceWallet sx={{ fontSize: 24, color: 'primary.main' }} />,
      color: 'primary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    },
    {
      title: 'Total Value',
      value: formatCurrency(summaryMetrics.totalValue, baseCurrency),
      subtitle: 'Combined asset value',
      icon: <MonetizationOn sx={{ fontSize: 24, color: 'success.main' }} />,
      color: 'success' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
    },
    {
      title: 'Average Value',
      value: formatCurrency(summaryMetrics.averageValue, baseCurrency),
      subtitle: 'Per asset average',
      icon: <AccountBalance sx={{ fontSize: 24, color: 'info.main' }} />,
      color: 'info' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
    },
    {
      title: 'Asset Types',
      value: Object.keys(summaryMetrics.assetsByType).length.toString(),
      subtitle: 'Different categories',
      icon: <TrendingUp sx={{ fontSize: 24, color: 'secondary.main' }} />,
      color: 'secondary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
    },
  ], [summaryMetrics, baseCurrency, theme.palette]);

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {summaryMetricsCards.map((metric, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              background: metric.gradient,
              border: `0.5px solid ${alpha(theme.palette[metric.color].main, 0.15)}`,
              borderRadius: 2,
              boxShadow: 1,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette[metric.color].main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {metric.icon}
                </Box>
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: `${metric.color}.main`,
                  mb: 0.5
                }}
              >
                {metric.value}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.primary',
                  fontWeight: 600,
                  mb: 0.5
                }}
              >
                {metric.title}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  fontWeight: 400
                }}
              >
                {metric.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
});

SummaryMetrics.displayName = 'SummaryMetrics';

// Memoized assets table component
const AssetsTable = memo(({ 
  assets, 
  baseCurrency, 
  theme, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  isLoadingDeleteInfo 
}: { 
  assets: Asset[]; 
  baseCurrency: string; 
  theme: any; 
  onViewDetail: (asset: Asset) => void; 
  onEdit: (asset: Asset) => void; 
  onDelete: (asset: Asset) => void; 
  isLoadingDeleteInfo: boolean; 
}) => {
  const summaryMetrics = useMemo(() => {
    const totalAssets = assets.length;
    return { totalAssets };
  }, [assets]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            Asset Portfolio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {summaryMetrics.totalAssets} assets in your portfolio
          </Typography>
        </Box>
      </Box>

      <Card 
        variant="outlined" 
        sx={{ 
          borderRadius: 2, 
          boxShadow: 1,
          border: `0.5px solid ${alpha(theme.palette.divider, 0.5)}`
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 200 }}>Asset</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 100 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 100 }}>Symbol</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 120, textAlign: 'right' }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 150, textAlign: 'right' }}>Price Comparison</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 120, textAlign: 'right' }}>Total Value</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 140 }}>Last Updated</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary', minWidth: 120, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                        No Assets Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        You don't have any assets in your portfolio yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  assets.map((asset) => (
                    <AssetTableRow
                      key={asset.id}
                      asset={asset}
                      baseCurrency={baseCurrency}
                      theme={theme}
                      onViewDetail={onViewDetail}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isLoadingDeleteInfo={isLoadingDeleteInfo}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

    </Box>
  );
});

AssetsTable.displayName = 'AssetsTable';

const Assets: React.FC = () => {
  const theme = useTheme();
  const { accountId, baseCurrency } = useAccount();
  const { assets, loading, error, refresh, updateAsset, createAsset, deleteAsset, setFilters: setApiFilters } = useAssets({ 
    initialFilters: { 
      createdBy: accountId,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'ASC'
    }, 
    autoFetch: true 
  });

  // Modal state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showBulkSelector, setShowBulkSelector] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete modal data
  const [tradeCount, setTradeCount] = useState(0);
  const [portfolioInfo, setPortfolioInfo] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingDeleteInfo, setIsLoadingDeleteInfo] = useState(false);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  
  

  const handleRefresh = () => {
    refresh();
  };

  const handleViewAssetDetail = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
  }, []);

  const handleEditAsset = useCallback((asset: Asset) => {
    setEditingAsset(asset);
  }, []);

  const handleDeleteAsset = useCallback(async (asset: Asset) => {
    setAssetToDelete(asset);
    setIsLoadingDeleteInfo(true);
    
    try {
      // Get portfolio and trade info using accountId
      const portfolioInfo = await assetService.getAssetPortfolioInfo(asset.id, accountId);
      
      // Set asset and trade count for modal
      setTradeCount(portfolioInfo.tradingCount);
      setPortfolioInfo(portfolioInfo.portfolios);
      setShowDeleteWarning(true);
    } catch (error) {
      console.error('Error getting portfolio info:', error);
      // Still show modal but with default values
      setTradeCount(0);
      setPortfolioInfo([]);
      setShowDeleteWarning(true);
    } finally {
      setIsLoadingDeleteInfo(false);
    }
  }, [accountId]);

  const handleCreateAsset = useCallback(() => {
    setShowCreateForm(true);
  }, []);

  // Filter handlers with debouncing
  const handleFiltersChange = useCallback((newFilters: AssetFiltersType) => {
    setIsFiltering(true);
    setApiFilters({
      ...newFilters,
      createdBy: accountId,
    });
    
    // Reset filtering state after a short delay
    setTimeout(() => setIsFiltering(false), 100);
  }, [setApiFilters, accountId]);

  const handleClearFilters = useCallback(() => {
    setIsFiltering(true);
    const clearedFilters: AssetFiltersType = {
      search: '',
      type: undefined,
      portfolioId: undefined,
      sortBy: 'name',
      sortOrder: 'ASC',
      limit: 100,
      createdBy: accountId,
    };
    setApiFilters(clearedFilters);
    setTimeout(() => setIsFiltering(false), 100);
  }, [setApiFilters, accountId]);

  const handleFiltersToggle = useCallback((show: boolean) => {
    setShowFilters(show);
  }, []);

  const handleCloseModals = useCallback(() => {
    setSelectedAsset(null);
    setEditingAsset(null);
    setShowCreateForm(false);
    setShowDeleteWarning(false);
    setShowBulkSelector(false);
    setAssetToDelete(null);
    setFormError(null);
    setTradeCount(0);
    setPortfolioInfo([]);
    setIsLoadingDeleteInfo(false);
  }, []);

  const handleAssetFormSubmit = useCallback(async (assetData: any) => {
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, assetData);
      } else {
        await createAsset(assetData);
      }
      handleCloseModals();
    } catch (error) {
      console.error('Error saving asset:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingAsset, updateAsset, createAsset, handleCloseModals]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!assetToDelete) return;
    
    try {
      await deleteAsset(assetToDelete.id);
      handleCloseModals();
    } catch (error) {
      console.error('Error deleting asset:', error);
      setFormError(error instanceof Error ? error.message : 'An error occurred');
    }
  }, [assetToDelete, deleteAsset, handleCloseModals]);

  const handleBulkCreate = useCallback(async (globalAssetIds: string[]) => {
    try {
      const response = await assetService.bulkCreateAssets(globalAssetIds, accountId);
      console.log('Bulk create result:', response);
      
      // The BulkAssetSelector will handle showing the result and closing modal
      return response;
    } catch (error) {
      console.error('Error in bulk create:', error);
      throw error;
    }
  }, [accountId]);

  const handleBulkCreateClick = useCallback(() => {
    setShowBulkSelector(true);
  }, []);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading assets: {error}
        </Alert>
        <Button onClick={handleRefresh} variant="contained">
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: 'text.primary',
                  mb: 1
                }}
              >
                Assets
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 400
                }}
              >
                Manage your portfolio assets
              </Typography>
            </Box>
            

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterList />}
                onClick={() => handleFiltersToggle(!showFilters)}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Filters {showFilters && '(Active)'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Refresh
              </Button>
              <Tooltip title="Chọn nhiều assets từ danh sách mẫu - Nhanh và dễ dàng">
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleBulkCreateClick}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Quick Create
                </Button>
              </Tooltip>
              <Tooltip title="Tạo asset mới với thông tin chi tiết">
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleCreateAsset}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500
                  }}
                >
                  Add Asset
                </Button>
              </Tooltip>

              {/* User Guide Component */}
              <UserGuide
                guideKey="assets"
                position="top-right"
                size="large"
              />
            </Box>
          </Box>
        </Box>


        {/* Summary Metrics - Memoized Component */}
        <SummaryMetrics 
          assets={assets} 
          baseCurrency={baseCurrency} 
          theme={theme} 
        />

        {/* Asset Filters */}
        {showFilters && (
          <Box sx={{ mb: 3 }}>
            <AssetsFilterPanel
              filters={{
                search: '',
                type: undefined,
                portfolioId: undefined,
                sortBy: 'name',
                sortOrder: 'ASC',
                limit: 100,
                createdBy: accountId,
              }}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
            />
            {isFiltering && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
          </Box>
        )}

        {/* Assets Table - Memoized Component */}
        <AssetsTable 
          assets={assets}
          baseCurrency={baseCurrency}
          theme={theme}
          onViewDetail={handleViewAssetDetail}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          isLoadingDeleteInfo={isLoadingDeleteInfo}
        />

        {/* Asset Details Modal */}
        <AssetDetailsModal
          open={!!selectedAsset}
          onClose={handleCloseModals}
          asset={selectedAsset}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          loading={false}
        />

        {/* Asset Form Modal */}
        <AssetFormModal
          open={!!(showCreateForm || editingAsset)}
          onClose={handleCloseModals}
          onSubmit={handleAssetFormSubmit}
          onCancel={handleCloseModals}
          loading={isSubmitting}
          error={formError}
          editingAsset={editingAsset}
          accountId={accountId}
        />

        {/* Asset Delete Warning Dialog */}
        <AssetDeleteWarningDialog
          open={showDeleteWarning}
          assetName={assetToDelete?.name || ''}
          tradeCount={tradeCount}
          portfolios={portfolioInfo}
          onConfirm={handleDeleteConfirm}
          onCancel={handleCloseModals}
          isDeleting={isSubmitting}
        />

        {/* Bulk Asset Selector */}
        <BulkAssetSelector
          open={showBulkSelector}
          onClose={handleCloseModals}
          onBulkCreate={handleBulkCreate}
          existingAssets={assets.map(asset => ({
            symbol: asset.symbol,
            name: asset.name
          }))}
          onRefresh={refresh}
        />
      </Box>
  );
};

export default Assets;
