/**
 * Assets page component - Shows assets for the current account
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountBalanceWallet,
  TrendingUp,
  Refresh,
  MonetizationOn,
  AccountBalance,
  Add,
  Edit,
  Delete,
  FilterList,
} from '@mui/icons-material';
import { useAssets } from '../hooks/useAssets';
import { useAccount } from '../contexts/AccountContext';
import { formatCurrency, formatDateTime, formatNumber } from '../utils/format';
import { AssetDetailsModal } from '../components/Asset/AssetDetailsModal';
import { AssetFormModal } from '../components/Asset/AssetFormModal';
import { AssetDeleteWarningDialog } from '../components/Asset/AssetDeleteWarningDialog';
import { BulkAssetSelector } from '../components/Asset/BulkAssetSelector';
import AssetsFilterPanel from '../components/Assets/AssetsFilterPanel';
import { UserGuide } from '../components/Common/UserGuide';
import { Asset, AssetFilters as AssetFiltersType } from '../types/asset.types';
import { assetService } from '../services/asset.service';
import { getAssetTypeColor } from '../config/chartColors';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { ResponsiveButton } from '../components/Common';

// Memoized table row component for better performance
const AssetTableRow = memo(({ 
  asset, 
  baseCurrency, 
  theme, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  isLoadingDeleteInfo,
  t
}: {
  asset: Asset;
  baseCurrency: string;
  theme: any;
  onViewDetail: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  isLoadingDeleteInfo: boolean;
  t: (key: string) => string;
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
      <TableCell sx={{ maxWidth: { xs: '200px', sm: '250px', md: '300px' }, minWidth: 'auto' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            {asset.symbol && (
              <ResponsiveTypography variant="formHelper" sx={{ 
                fontFamily: 'monospace',
                backgroundColor: 'grey.100',
                px: 1,
                py: 0.25,
                borderRadius: 0.5,
                fontSize: '0.7rem',
                flexShrink: 0
              }}>
                {asset.symbol}
              </ResponsiveTypography>
            )}
            <ResponsiveTypography 
              variant="tableCellSmall" 
              sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                flex: 1,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {asset.name}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={asset.type}
              color={getAssetTypeChipColor(asset.type) as any}
              size="small"
              sx={{ 
                fontWeight: 500,
                backgroundColor: getAssetTypeColor(asset.type),
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
                flexShrink: 0,
                '& .MuiChip-label': {
                  color: 'white',
                  fontWeight: 600
                }
              }}
            />
          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ textAlign: 'right', maxWidth: { xs: '120px', sm: '150px' }, minWidth: '100px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <ResponsiveTypography 
            variant="tableCellSmall" 
            sx={{ 
              fontWeight: 600, 
              color: priceComparison >= 0 ? 'success.main' : 'error.main',
              fontSize: { xs: '0.7rem', sm: '0.9rem' }
            }}
          >
            {formatCurrency(currentPrice, baseCurrency)}
          </ResponsiveTypography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <ResponsiveTypography variant="formHelper" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
              {formatCurrency(avgCost, baseCurrency)}
            </ResponsiveTypography>
            {priceComparisonPercent !== 0 && (
              <ResponsiveTypography 
                variant="formHelper" 
                sx={{ 
                  color: priceComparison >= 0 ? 'success.main' : 'error.main',
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  fontWeight: 600
                }}
              >
                {priceComparison >= 0 ? '+' : ''}{priceComparisonPercent.toFixed(1)}%
              </ResponsiveTypography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ textAlign: 'right', 
        maxWidth: { xs: '80px', sm: '100px' }, 
        minWidth: '60px',
        display: { xs: 'none', sm: 'table-cell' }
        }}>
        <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 500 }}>
          {formatNumber(asset.totalQuantity, asset.type === 'CRYPTO' ? 5 : 1) || 0}
        </ResponsiveTypography>
      </TableCell>
      <TableCell sx={{ textAlign: 'right', maxWidth: { xs: '100px', sm: '120px' }, minWidth: '80px' }}>
        <ResponsiveTypography variant="tableCell" sx={{ color: 'success.main' }}>
          {formatCurrency(Number(asset.totalValue) || 0, baseCurrency)}
        </ResponsiveTypography>
        <ResponsiveTypography variant="formHelper" sx={{ 
          color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.7rem' },
          marginTop: 0.5, display: { xs: 'block', sm: 'none' }
          }}>
          {formatNumber(asset.totalQuantity, asset.type === 'CRYPTO' ? 5 : 1) || 0}
        </ResponsiveTypography>
      </TableCell>
      <TableCell sx={{ maxWidth: { xs: '100px', sm: '120px' }, minWidth: '80px' }}>
        <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 400, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
          {formatDateTime(asset.priceUpdatedAt || new Date(), 'HH:mm:ss dd/MM/yyyy')}
        </ResponsiveTypography>
      </TableCell>
      <TableCell sx={{ textAlign: 'center', maxWidth: { xs: '120px', sm: '140px' }, minWidth: '100px' }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Tooltip title={t('assets.actions.editAsset')}>
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
          <Tooltip title={t('assets.actions.deleteAsset')}>
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
  theme,
  t
}: { 
  assets: Asset[]; 
  baseCurrency: string; 
  theme: any;
  t: (key: string) => string;
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
      title: t('assets.metrics.totalAssets'),
      value: summaryMetrics.totalAssets.toString(),
      subtitle: t('assets.metrics.assetsInPortfolio'),
      icon: <AccountBalanceWallet sx={{ fontSize: 24, color: 'primary.main' }} />,
      color: 'primary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
      mobileHidden: true,
    },
    {
      title: t('assets.metrics.totalValue'),
      value: formatCurrency(summaryMetrics.totalValue, baseCurrency),
      subtitle: t('assets.metrics.combinedAssetValue'),
      icon: <MonetizationOn sx={{ fontSize: 24, color: 'success.main' }} />,
      color: 'success' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
    },
    {
      title: t('assets.metrics.averageValue'),
      value: formatCurrency(summaryMetrics.averageValue, baseCurrency),
      subtitle: t('assets.metrics.perAssetAverage'),
      icon: <AccountBalance sx={{ fontSize: 24, color: 'info.main' }} />,
      color: 'info' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
      mobileHidden: true,
    },
    {
      title: t('assets.metrics.assetTypes'),
      value: Object.keys(summaryMetrics.assetsByType).length.toString(),
      subtitle: t('assets.metrics.differentCategories'),
      icon: <TrendingUp sx={{ fontSize: 24, color: 'secondary.main' }} />,
      color: 'secondary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
      mobileHidden: true,
    },
  ], [summaryMetrics, baseCurrency, theme.palette, t]);

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {summaryMetricsCards.map((metric, index) => (
        <Grid item xs={12} sm={6} lg={3} key={index} sx={{ display: metric.mobileHidden ? { xs: 'none', sm: 'block' } : 'block' }}>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette[metric.color].main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {metric.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <ResponsiveTypography 
                    variant="cardValue" 
                    sx={{ 
                      color: `${metric.color}.main`,
                      mb: 0.5
                    }}
                  >
                    {metric.value}
                  </ResponsiveTypography>
                  <ResponsiveTypography 
                    variant="cardSubtitle" 
                    sx={{ 
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    {metric.title}
                  </ResponsiveTypography>
                  {/* <ResponsiveTypography 
                    variant="formHelper"
                  >
                    {metric.subtitle}
                  </ResponsiveTypography> */}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
});

SummaryMetrics.displayName = 'SummaryMetrics';

// Memoized assets with trades list component
const AssetsWithTradesList = memo(({ 
  assets, 
  baseCurrency, 
  theme, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  isLoadingDeleteInfo,
  t
}: { 
  assets: Asset[]; 
  baseCurrency: string; 
  theme: any; 
  onViewDetail: (asset: Asset) => void; 
  onEdit: (asset: Asset) => void; 
  onDelete: (asset: Asset) => void; 
  isLoadingDeleteInfo: boolean;
  t: (key: string) => string;
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <TrendingUp sx={{ color: 'success.main', fontSize: 28 }} />
        <Box>
          <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
            {t('assets.withTrades.title')} ({assets.length})
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('assets.withTrades.subtitle')}
          </ResponsiveTypography>
        </Box>
      </Box>
      
      {assets.length === 0 ? (
        <Card sx={{ 
          p: 4, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
          borderRadius: 2
        }}>
          <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <ResponsiveTypography variant="h6" sx={{ mb: 1, color: 'success.main' }}>
            {t('assets.withTrades.noAssets.title')}
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('assets.withTrades.noAssets.description')}
          </ResponsiveTypography>
        </Card>
      ) : (
        <Card sx={{ 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
          backdropFilter: 'blur(10px)'
        }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
                    <TableCell>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('assets.table.asset')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right'}}>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                        {t('assets.table.priceComparison')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', display: { xs: 'none', sm: 'table-cell' } }}>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                        {t('assets.table.quantity')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right'}}>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                        {t('assets.table.totalValue')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                        {t('assets.table.lastUpdated')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>{t('common.actions')}</ResponsiveTypography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((asset) => (
                    <AssetTableRow
                      key={asset.id}
                      asset={asset}
                      baseCurrency={baseCurrency}
                      theme={theme}
                      onViewDetail={onViewDetail}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isLoadingDeleteInfo={isLoadingDeleteInfo}
                      t={t}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
});

// Memoized assets without trades list component
const AssetsWithoutTradesList = memo(({ 
  assets, 
  baseCurrency, 
  theme, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  isLoadingDeleteInfo,
  t
}: { 
  assets: Asset[]; 
  baseCurrency: string; 
  theme: any; 
  onViewDetail: (asset: Asset) => void; 
  onEdit: (asset: Asset) => void; 
  onDelete: (asset: Asset) => void; 
  isLoadingDeleteInfo: boolean;
  t: (key: string) => string;
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <AccountBalanceWallet sx={{ color: 'warning.main', fontSize: 28 }} />
        <Box>
          <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
            {t('assets.withoutTrades.title')} ({assets.length})
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('assets.withoutTrades.subtitle')}
          </ResponsiveTypography>
        </Box>
      </Box>
      
      {assets.length === 0 ? (
        <Card sx={{ 
          p: 4, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
          borderRadius: 2
        }}>
          <AccountBalanceWallet sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <ResponsiveTypography variant="h6" sx={{ mb: 1, color: 'warning.main' }}>
            {t('assets.withoutTrades.noAssets.title')}
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('assets.withoutTrades.noAssets.description')}
          </ResponsiveTypography>
        </Card>
      ) : (
        <Card sx={{ 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
          border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
          backdropFilter: 'blur(10px)'
        }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.warning.main, 0.05) }}>
                    <TableCell>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                        {t('assets.table.asset')}
                        </ResponsiveTypography>
                      </TableCell>
                    <TableCell sx={{ textAlign: 'right'}}>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>{t('assets.table.priceComparison')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right', display: { xs: 'none', sm: 'table-cell' } }}>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>{t('assets.table.quantity')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>{t('assets.table.totalValue')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell>
                      <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>{t('assets.table.lastUpdated')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}><ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>{t('common.actions')}</ResponsiveTypography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assets.map((asset) => (
                    <AssetTableRow
                      key={asset.id}
                      asset={asset}
                      baseCurrency={baseCurrency}
                      theme={theme}
                      onViewDetail={onViewDetail}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isLoadingDeleteInfo={isLoadingDeleteInfo}
                      t={t}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
});

AssetsWithTradesList.displayName = 'AssetsWithTradesList';
AssetsWithoutTradesList.displayName = 'AssetsWithoutTradesList';

const Assets: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accountId, baseCurrency } = useAccount();
  const { assets, loading, error, filters, refresh, updateAsset, createAsset, deleteAsset, setFilters: setApiFilters } = useAssets({ 
    initialFilters: { 
      createdBy: accountId,
      limit: 50,
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
    setSelectedAsset(null); // Close details modal first
    setEditingAsset(asset);
  }, []);

  const handleDeleteAsset = useCallback(async (asset: Asset) => {
    setSelectedAsset(null); // Close details modal first
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
    setTimeout(() => setIsFiltering(false), 200);
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
    setTimeout(() => setIsFiltering(false), 200);
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
        // Refresh data to get updated prices from global assets
        // setTimeout(() => {
        //   refresh();
        // }, 1000);
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
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('assets.errors.loadingError')}: {error}
        </Alert>
        <ResponsiveButton 
          onClick={handleRefresh} 
          variant="contained"
          icon={<Refresh />}
          mobileText={t('common.retry')}
          desktopText={t('common.retry')}
        >
          {t('common.retry')}
        </ResponsiveButton>
      </Box>
    );
  }

  return (
    <Box>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <ResponsiveTypography 
                variant="pageHeader" 
                sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                {t('assets.pageTitle')}
              </ResponsiveTypography>
              <ResponsiveTypography 
                variant="pageSubtitle"
              >
                {t('assets.pageSubtitle')}
              </ResponsiveTypography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Tooltip title={t('assets.actions.quickCreateTooltip')}>
                <span>
                  <ResponsiveButton
                    variant="outlined"
                    icon={<Add />}
                    onClick={handleBulkCreateClick}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500
                    }}
                  >
                    {t('assets.actions.quickCreate')}
                  </ResponsiveButton>
                </span>
              </Tooltip>
              <Tooltip title={t('assets.actions.addAssetTooltip')}>
                <span>
                  <ResponsiveButton
                    variant="contained"
                    icon={<Add />}
                    onClick={handleCreateAsset}
                    mobileText={t('assets.actions.add')}
                    desktopText={t('assets.actions.addAsset')}
                  >
                    {t('assets.actions.addAsset')}
                  </ResponsiveButton>
                </span>
              </Tooltip>

            </Box>
          </Box>
        </Box>

        {/* Summary Metrics - Memoized Component */}
        <SummaryMetrics 
          assets={assets} 
          baseCurrency={baseCurrency} 
          theme={theme}
          t={t}
        />

        {/* Filter Controls */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* User Guide Component - Left Side */}
          <UserGuide
            guideKey="assets"
            position="top-left"
            size="large"
          />
          
          {/* Control Buttons - Right Side */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ResponsiveButton
              variant="outlined"
              icon={<Refresh />}
              onClick={handleRefresh}
              mobileText={t('common.refresh')}
              desktopText={t('assets.actions.refreshData')}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {t('assets.actions.refreshData')}
            </ResponsiveButton>
            <ResponsiveButton
              variant={showFilters ? "contained" : "outlined"}
              icon={<FilterList />}
              onClick={() => handleFiltersToggle(!showFilters)}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {t('assets.filters.title')} {showFilters && `(${t('assets.filters.active')})`}
            </ResponsiveButton>
          </Box>
        </Box>

        {/* Asset Filters */}
        {showFilters && (
          <Box sx={{ mb: 3 }}>
            <AssetsFilterPanel
              filters={filters}
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

        {/* Assets Lists - Separated by trades status */}
        {(() => {
          // Separate assets by trades status
          const assetsWithTrades = assets.filter(asset => asset.hasTrades);
          const assetsWithoutTrades = assets.filter(asset => !asset.hasTrades);
          
          return (
            <Box>
              {/* Assets with trades */}
              <AssetsWithTradesList 
                assets={assetsWithTrades}
                baseCurrency={baseCurrency}
                theme={theme}
                onViewDetail={handleViewAssetDetail}
                onEdit={handleEditAsset}
                onDelete={handleDeleteAsset}
                isLoadingDeleteInfo={isLoadingDeleteInfo}
                t={t}
              />
              
              {/* Assets without trades */}
              <AssetsWithoutTradesList 
                assets={assetsWithoutTrades}
                baseCurrency={baseCurrency}
                theme={theme}
                onViewDetail={handleViewAssetDetail}
                onEdit={handleEditAsset}
                onDelete={handleDeleteAsset}
                isLoadingDeleteInfo={isLoadingDeleteInfo}
                t={t}
              />
            </Box>
          );
        })()}

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
