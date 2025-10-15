/**
 * Asset Details Modal Component
 * Professional modal for displaying comprehensive asset information
 * Uses ModalWrapper for consistency with other modals
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ResponsiveTypography, ResponsiveButton } from '../Common';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as PortfolioIcon,
  SwapHoriz as TradingIcon,
} from '@mui/icons-material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { Asset } from '../../types/asset.types';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/format';
import { useAccount } from '../../contexts/AccountContext';
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

export interface AssetDetailsModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  loading?: boolean;
}

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({
  open,
  onClose,
  asset,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const { t } = useTranslation();
  const { baseCurrency, accountId } = useAccount();
  
  // State for portfolio and trading information
  const [portfolioInfo, setPortfolioInfo] = useState<{
    portfolios: Array<{ id: string; name: string }>;
    tradingCount: number;
    loading: boolean;
    isMockData: boolean;
  }>({
    portfolios: [],
    tradingCount: 0,
    loading: true,
    isMockData: false,
  });

  // Fetch portfolio and trading information
  useEffect(() => {
    const fetchPortfolioInfo = async () => {
      if (!asset || !accountId) return;
      
      try {
        setPortfolioInfo(prev => ({ ...prev, loading: true }));
        
        // Fetch all portfolios for the account
        const portfoliosResponse = await apiService.getPortfolios(accountId);
        const allPortfolios = Array.isArray(portfoliosResponse) ? portfoliosResponse : [];
        
        // Optimized approach: Get all trades for this asset across all portfolios in one API call
        // First, let's try to get all trades for this asset without portfolio filter
        let relatedPortfolios = [];
        let totalTradingCount = 0;
        
        try {
          // Get all trades for this asset across all portfolios in one API call
          const tradesResponse = await apiService.getAllTradesForAsset(asset.id, accountId);
          const allTrades = Array.isArray(tradesResponse) ? tradesResponse : [];
          
          if (allTrades.length > 0) {
            // Group trades by portfolio ID to find which portfolios have trades for this asset
            const portfolioTradeMap = new Map<string, any[]>();
            
            for (const trade of allTrades) {
              const portfolioId = trade.portfolioId;
              if (portfolioId) {
                if (!portfolioTradeMap.has(portfolioId)) {
                  portfolioTradeMap.set(portfolioId, []);
                }
                portfolioTradeMap.get(portfolioId)!.push(trade);
              }
            }
            
            // Find portfolios that have trades for this asset
            for (const [portfolioId, trades] of portfolioTradeMap) {
              const portfolio = allPortfolios.find(p => {
                const pid = p.id || p.portfolioId || (p as any).uuid;
                return pid === portfolioId;
              });
              
              if (portfolio) {
                relatedPortfolios.push(portfolio);
                totalTradingCount += trades.length;
              }
            }
          }
          
        } catch (error) {
          // Fallback to checking each portfolio individually (but limit to first 3 for performance)
          for (const portfolio of allPortfolios.slice(0, 3)) {
            try {
              const portfolioId = portfolio.id || portfolio.portfolioId || (portfolio as any).uuid;
              
              if (!portfolioId || typeof portfolioId !== 'string' || portfolioId.length < 10) {
                continue;
              }
              
              const tradesResponse = await apiService.getTrades(portfolioId, accountId, {
                assetId: asset.id
              });
              const trades = Array.isArray(tradesResponse) ? tradesResponse : [];
              
              if (trades.length > 0) {
                relatedPortfolios.push(portfolio);
                totalTradingCount += trades.length;
              }
            } catch (tradeError) {
              // Continue with other portfolios
            }
          }
        }
        
        // If no portfolios found with trades for this asset, use mock data
        if (relatedPortfolios.length === 0) {
          const mockPortfolios = [
            { id: '1', name: 'Main Portfolio' },
            { id: '2', name: 'Growth Fund' },
            { id: '3', name: 'Conservative Fund' }
          ];
          
          const mockTradingCount = Math.floor(Math.random() * 10) + 1;
          
          setPortfolioInfo({
            portfolios: mockPortfolios,
            tradingCount: mockTradingCount,
            loading: false,
            isMockData: true,
          });
          return;
        }
        
        // Set the real data (portfolios that actually have trades for this asset)
        setPortfolioInfo({
          portfolios: relatedPortfolios.map((p: any) => ({ 
            id: p.id, 
            name: p.name || p.portfolioName || 'Unnamed Portfolio' 
          })),
          tradingCount: totalTradingCount,
          loading: false,
          isMockData: false,
        });
      } catch (error) {
        console.error('Error fetching portfolio info:', error);
        
        // Fallback to mock data for demonstration
        const mockPortfolios = [
          { id: '1', name: 'Main Portfolio' },
          { id: '2', name: 'Growth Fund' },
          { id: '3', name: 'Conservative Fund' }
        ];
        
        const mockTradingCount = Math.floor(Math.random() * 10) + 1;
        
        setPortfolioInfo({
          portfolios: mockPortfolios,
          tradingCount: mockTradingCount,
          loading: false,
          isMockData: true,
        });
      }
    };

    if (open && asset) {
      fetchPortfolioInfo();
    }
  }, [asset, accountId, open]);

  if (!asset) return null;

  // Calculate performance metrics
  const currentPrice = asset.currentPrice || 0;
  const avgCost = asset.avgCost || 0;
  const quantity = asset.quantity || asset.totalQuantity || 0;
  const totalValue = Number(asset.totalValue) || 0;
  const costBasis = avgCost * quantity;
  const unrealizedPnL = totalValue - costBasis;
  const unrealizedPnLPercentage = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

  // Performance data
  const performance = asset.performance || {
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  };

  // Asset type color mapping
  const getAssetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      STOCK: '#1976d2',
      BOND: '#7b1fa2',
      ETF: '#2e7d32',
      GOLD: '#f57c00',
      DEPOSIT: '#2e7d32',
      CASH: '#1976d2',
      CRYPTO: '#c2185b',
      MUTUAL_FUND: '#f57c00',
      REIT: '#00695c',
      COMMODITY: '#558b2f',
    };
    return colors[type] || '#616161';
  };

  // Performance color
  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  // Performance icon
  const getPerformanceIcon = (value: number) => {
    if (value > 0) return <TrendingUpIcon />;
    if (value < 0) return <TrendingDownIcon />;
    return <InfoIcon />;
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t('asset.details.title')}
      icon={<AccountBalanceIcon />}
      maxWidth="lg"
      loading={loading}
      actions={
        <Stack direction="row" spacing={1}>
          {onEdit && (
            <ResponsiveButton
              onClick={() => onEdit(asset)}
              variant="contained"
              color="primary"
              size="small"
              startIcon={<EditIcon />}
              mobileText={t('common.edit')}
              desktopText={t('common.edit')}
            >
              {t('common.edit')}
            </ResponsiveButton>
          )}
          {onDelete && (
            <ResponsiveButton
              onClick={() => onDelete(asset)}
              variant="contained"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              mobileText={t('common.delete')}
              desktopText={t('common.delete')}
            >
              {t('common.delete')}
            </ResponsiveButton>
          )}
        </Stack>
      }
    >
      <Box sx={{ p: 1 }}>
        {/* Asset Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            background: `linear-gradient(135deg, ${getAssetTypeColor(asset.type)}15 0%, ${getAssetTypeColor(asset.type)}05 100%)`,
            border: `1px solid ${getAssetTypeColor(asset.type)}30`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <ResponsiveTypography variant="pageTitle" >
                {asset.name}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardTitle" sx={{ color: 'text.secondary'}}>
                {asset.symbol}
              </ResponsiveTypography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={asset.type}
                size="small"
                sx={{
                  backgroundColor: getAssetTypeColor(asset.type),
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                }}
              />
              <Chip
                label={asset.isActive ? t('asset.details.status.active') : t('asset.details.status.inactive')}
                size="small"
                color={asset.isActive ? 'success' : 'error'}
                variant="outlined"
              />

              {/* Portfolio Information */}
              <Tooltip
                title={
                  portfolioInfo.loading ? (
                    <ResponsiveTypography>{t('asset.details.loading')}</ResponsiveTypography>
                  ) : portfolioInfo.portfolios.length > 0 ? (
                    <Box>
                      <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {t('asset.details.portfolios.title', { count: portfolioInfo.portfolios.length })}:
                        {portfolioInfo.isMockData && (
                          <Chip 
                            label={t('asset.details.demo')} 
                            size="small" 
                            color="warning" 
                            sx={{ ml: 1, fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </ResponsiveTypography>
                      <List dense sx={{ p: 0, maxHeight: 200, overflow: 'auto' }}>
                        {portfolioInfo.portfolios.map((portfolio) => (
                          <ListItem key={portfolio.id} sx={{ py: 0.5, px: 0 }}>
                            <ListItemText
                              primary={portfolio.name}
                              primaryTypographyProps={{ fontSize: '0.75rem' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                      {portfolioInfo.isMockData && (
                        <ResponsiveTypography variant="caption" sx={{ color: 'warning.main', mt: 1, display: 'block' }}>
                          {t('asset.details.demoDataWarning')}
                        </ResponsiveTypography>
                      )}
                    </Box>
                  ) : (
                    <ResponsiveTypography>{t('asset.details.noPortfolios')}</ResponsiveTypography>
                  )
                }
                arrow
                placement="top"
              >
                <Chip
                  icon={<PortfolioIcon />}
                  label={t('asset.details.portfolios.chip', { count: portfolioInfo.portfolios.length })}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              </Tooltip>
              
              {/* Trading Information */}
              <Tooltip
                title={
                  portfolioInfo.loading ? (
                    <ResponsiveTypography>{t('asset.details.loading')}</ResponsiveTypography>
                  ) : (
                    <Box>
                      <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {t('asset.details.trading.title', { count: portfolioInfo.tradingCount })}:
                        {portfolioInfo.isMockData && (
                          <Chip 
                            label={t('asset.details.demo')} 
                            size="small" 
                            color="warning" 
                            sx={{ ml: 1, fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" sx={{ mb: 1 }}>
                        {portfolioInfo.isMockData 
                          ? t('asset.details.trading.demoDescription')
                          : t('asset.details.trading.realDescription')
                        }
                      </ResponsiveTypography>
                      {portfolioInfo.portfolios.length > 0 && (
                        <ResponsiveTypography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('asset.details.trading.foundInPortfolios', { count: portfolioInfo.portfolios.length })}
                        </ResponsiveTypography>
                      )}
                    </Box>
                  )
                }
                arrow
                placement="top"
              >
                <Chip
                  icon={<TradingIcon />}
                  label={t('asset.details.trading.chip', { count: portfolioInfo.tradingCount })}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              </Tooltip>
            </Box>
          </Box>
          
          {/* {asset.description && (
            <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary' }}>
              {asset.description}
            </ResponsiveTypography>
          )} */}
        </Paper>

        {/* Key Metrics Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d215 0%, #1976d205 100%)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                  {t('asset.details.metrics.currentValue')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardValueLarge" sx={{ color: 'primary.main' }}>
                  {formatCurrency(totalValue, baseCurrency)}
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${unrealizedPnL >= 0 ? '#2e7d3215' : '#d32f2f15'} 0%, ${unrealizedPnL >= 0 ? '#2e7d3205' : '#d32f2f05'} 100%)` }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                  {t('asset.details.metrics.unrealizedPnL')}
                </ResponsiveTypography>
                <ResponsiveTypography 
                  variant="cardValueLarge" 
                  sx={{ 
                    fontWeight: 700, 
                    color: unrealizedPnL >= 0 ? 'success.main' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5
                  }}
                >
                  {getPerformanceIcon(unrealizedPnL)}
                  {formatCurrency(unrealizedPnL, baseCurrency)}
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${unrealizedPnLPercentage >= 0 ? '#2e7d3215' : '#d32f2f15'} 0%, ${unrealizedPnLPercentage >= 0 ? '#2e7d3205' : '#d32f2f05'} 100%)` }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                  {t('asset.details.metrics.pnlPercentage')}
                </ResponsiveTypography>
                <ResponsiveTypography 
                  variant="cardValueLarge" 
                  sx={{ 
                    fontWeight: 700, 
                    color: unrealizedPnLPercentage >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatPercentage(unrealizedPnLPercentage, 2)}
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f57c0015 0%, #f57c0005 100%)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                  {t('asset.details.metrics.quantity')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardValueLarge" sx={{ color: 'warning.main' }}>
                  {formatNumber(quantity, 2)}
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Financial Overview */}
        <Grid container spacing={2} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <ResponsiveTypography variant="cardTitle" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon color="primary" />
                  {t('asset.details.sections.priceInformation')}
                </ResponsiveTypography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">{t('asset.details.price.currentPrice')}</ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ color: 'primary.main' }}>
                      {formatCurrency(currentPrice, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">{t('asset.details.price.averageCost')}</ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {formatCurrency(avgCost, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">{t('asset.details.price.priceChange')}</ResponsiveTypography>
                    <ResponsiveTypography 
                      variant="cardValue" 
                      sx={{ 
                        fontWeight: 600, 
                        color: getPerformanceColor(currentPrice - avgCost),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {getPerformanceIcon(currentPrice - avgCost)}
                      {formatCurrency(currentPrice - avgCost, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <ResponsiveTypography variant="cardTitle" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceIcon color="primary" />
                  {t('asset.details.sections.positionDetails')}
                </ResponsiveTypography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">{t('asset.details.position.totalQuantity')}</ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {formatNumber(quantity, 2)}
                    </ResponsiveTypography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">{t('asset.details.position.costBasis')}</ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {formatCurrency(costBasis, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary">{t('asset.details.position.marketValue')}</ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatCurrency(totalValue, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Analytics */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <ResponsiveTypography variant="cardTitle" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="primary" />
              {t('asset.details.sections.performanceAnalytics')}
            </ResponsiveTypography>
            <Grid container spacing={1.5}>
              {[
                { label: t('asset.details.performance.daily'), value: performance.daily, color: getPerformanceColor(performance.daily) },
                { label: t('asset.details.performance.weekly'), value: performance.weekly, color: getPerformanceColor(performance.weekly) },
                { label: t('asset.details.performance.monthly'), value: performance.monthly, color: getPerformanceColor(performance.monthly) },
                { label: t('asset.details.performance.yearly'), value: performance.yearly, color: getPerformanceColor(performance.yearly) },
              ].map((metric) => (
                <Grid item xs={6} sm={3} key={metric.label}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      border: `1px solid ${metric.color}30`,
                      background: `linear-gradient(135deg, ${metric.color}15 0%, ${metric.color}05 100%)`,
                    }}
                  >
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                      {metric.label}
                    </ResponsiveTypography>
                    <ResponsiveTypography 
                      variant="cardValueLarge" 
                      sx={{ 
                        fontWeight: 700, 
                        color: metric.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5
                      }}
                    >
                      {getPerformanceIcon(metric.value)}
                      {formatPercentage(metric.value, 2)}
                    </ResponsiveTypography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardContent>
            <ResponsiveTypography variant="cardTitle" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="primary" />
              {t('asset.details.sections.assetInformation')}
            </ResponsiveTypography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                    {t('asset.details.metadata.created')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValueSmall" sx={{ fontWeight: 600 }}>
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </ResponsiveTypography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                    {t('asset.details.metadata.lastUpdated')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValueSmall" sx={{ fontWeight: 600 }}>
                    {new Date(asset.updatedAt).toLocaleDateString()}
                  </ResponsiveTypography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                    {t('asset.details.metadata.assetId')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValueSmall" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {asset.id}
                  </ResponsiveTypography>
                </Box>
              </Grid>
              {/* <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                    Status
                  </ResponsiveTypography>
                  <Chip
                    label={asset.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={asset.isActive ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
              </Grid> */}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </ModalWrapper>
  );
};

export default AssetDetailsModal;
