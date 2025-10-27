/**
 * Asset Details Modal Component
 * Professional modal for displaying comprehensive asset information
 * Uses ModalWrapper for consistency with other modals
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  Grid,
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

  // Helper component to render all items in a single grid with borders
  const GridListItems: React.FC<{ items: Array<{ label: string; value: React.ReactNode }> }> = ({ items }) => (
    <Grid container spacing={0}>
      {items.map((item, index) => (
        <Grid 
          item 
          xs={6} 
          md={3} 
          key={index}
          sx={{
            borderRight: { xs: index % 2 === 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.08)', md: index % 4 === 3 ? 'none' : '1px solid rgba(0, 0, 0, 0.08)' },
            borderBottom: { xs: index >= items.length - 2 ? 'none' : '1px solid rgba(0, 0, 0, 0.08)', md: index >= items.length - 4 ? 'none' : '1px solid rgba(0, 0, 0, 0.08)' },
            p: 1.5,
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ListItemText
            primary={item.label}
            secondary={item.value}
            primaryTypographyProps={{ 
              variant: 'subtitle2', 
              color: 'text.secondary',
              sx: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}
            secondaryTypographyProps={{ variant: 'subtitle1', fontWeight: 500 }}
            sx={{ width: '100%' }}
          />
        </Grid>
      ))}
    </Grid>
  );
  const currentPrice = asset?.currentPrice || 0;
  const avgCost = asset?.avgCost || 0;
  const quantity = asset?.quantity || asset?.totalQuantity || 0;
  const totalValue = Number(asset?.totalValue) || 0;
  const costBasis = avgCost * quantity;
  const unrealizedPnL = totalValue - costBasis;
  const unrealizedPnLPercentage = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;

  // Performance data
  const performance = asset?.performance || {
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
      maxWidth="md"
      loading={loading}
      // Auto mobile detection is enabled by default
      actions={
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Stack direction="row" spacing={1}>
            {onEdit && asset && (
              <ResponsiveButton
                onClick={() => onEdit(asset)}
                variant="contained"
                color="primary"
                size="small"
                icon={<EditIcon />}
                mobileText=""
                desktopText={t('common.edit')}
              >
                {t('common.edit')}
              </ResponsiveButton>
            )}
            {onDelete && asset && (
              <ResponsiveButton
                onClick={() => onDelete(asset)}
                variant="contained"
                color="error"
                size="small"
                icon={<DeleteIcon />}
                mobileText=""
                desktopText={t('common.delete')}
              >
                {t('common.delete')}
              </ResponsiveButton>
            )}
          </Stack>
          <ResponsiveButton
            onClick={onClose}
            variant="outlined"
            color="secondary"
            size="small"
            mobileText={t('common.close')}
            desktopText={t('common.close')}
          >
            {t('common.close')}
          </ResponsiveButton>
        </Box>
      }
    >
      <Box sx={{ p: 1 }}>
        {/* Asset Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            background: `linear-gradient(135deg, ${getAssetTypeColor(asset?.type || '')}15 0%, ${getAssetTypeColor(asset?.type || '')}05 100%)`,
            border: `1px solid ${getAssetTypeColor(asset?.type || '')}30`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            justifyContent: { xs: 'flex-start', sm: 'space-between' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', flexWrap: 'wrap' }}>
              <ResponsiveTypography variant="pageTitle">
                {asset?.name}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardTitle" sx={{ color: 'text.secondary' }}>
                {asset?.symbol}
              </ResponsiveTypography>
            </Box>
            {/* Asset Type and Status */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              flexWrap: 'wrap',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'flex-start', sm: 'flex-end' }
            }}>
              <Chip
                label={asset?.type}
                size="small"
                sx={{
                  backgroundColor: getAssetTypeColor(asset?.type || ''),
                  color: 'white',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                }}
              />
              <Chip
                label={asset?.isActive ? t('asset.details.status.active') : t('asset.details.status.inactive')}
                size="small"
                color={asset?.isActive ? 'success' : 'error'}
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
                            key="demo-chip-portfolios"
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
                            key="demo-chip-trading"
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

        {/* Combined Grid - All Asset Information */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <ResponsiveTypography variant="cardTitle" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" />
              {t('asset.details.sections.assetInformation')}
            </ResponsiveTypography>
            <GridListItems 
              items={[
                // Key Metrics
                {
                  label: t('asset.details.metrics.currentValue'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {formatCurrency(totalValue, baseCurrency)}
                    </ResponsiveTypography>
                  )
                },
                {
                  label: t('asset.details.metrics.unrealizedPnL'),
                  value: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getPerformanceIcon(unrealizedPnL)}
                      <ResponsiveTypography 
                        variant="cardValue" 
                        sx={{ 
                          fontWeight: 600, 
                          color: unrealizedPnL >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {formatCurrency(unrealizedPnL, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                  )
                },
                {
                  label: t('asset.details.metrics.pnlPercentage'),
                  value: (
                    <ResponsiveTypography 
                      variant="cardValue" 
                      sx={{ 
                        fontWeight: 600, 
                        color: unrealizedPnLPercentage >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatPercentage(unrealizedPnLPercentage, 2)}
                    </ResponsiveTypography>
                  )
                },
                {
                  label: t('asset.details.metrics.quantity'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ color: 'warning.main', fontWeight: 600 }}>
                      {formatNumber(quantity, 2)}
                    </ResponsiveTypography>
                  )
                },
                // Financial Overview
                {
                  label: t('asset.details.price.currentPrice'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {formatCurrency(currentPrice, baseCurrency)}
                    </ResponsiveTypography>
                  )
                },
                {
                  label: t('asset.details.price.averageCost'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {formatCurrency(avgCost, baseCurrency)}
                    </ResponsiveTypography>
                  )
                },
                {
                  label: t('asset.details.price.priceChange'),
                  value: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getPerformanceIcon(currentPrice - avgCost)}
                      <ResponsiveTypography 
                        variant="cardValue" 
                        sx={{ 
                          fontWeight: 600, 
                          color: getPerformanceColor(currentPrice - avgCost)
                        }}
                      >
                        {formatCurrency(currentPrice - avgCost, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                  )
                },
                {
                  label: t('asset.details.position.totalQuantity'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {formatNumber(quantity, 2)}
                    </ResponsiveTypography>
                  )
                },
                {
                  label: t('asset.details.position.costBasis'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {formatCurrency(costBasis, baseCurrency)}
                    </ResponsiveTypography>
                  )
                },
                {
                  label: t('asset.details.position.marketValue'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatCurrency(totalValue, baseCurrency)}
                    </ResponsiveTypography>
                  )
                },
                // Performance Analytics
                { 
                  label: t('asset.details.performance.daily'), 
                  value: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getPerformanceIcon(performance.daily)}
                      <ResponsiveTypography 
                        variant="cardValue" 
                        sx={{ 
                          fontWeight: 600, 
                          color: getPerformanceColor(performance.daily)
                        }}
                      >
                        {formatPercentage(performance.daily, 2)}
                      </ResponsiveTypography>
                    </Box>
                  )
                },
                { 
                  label: t('asset.details.performance.weekly'), 
                  value: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getPerformanceIcon(performance.weekly)}
                      <ResponsiveTypography 
                        variant="cardValue" 
                        sx={{ 
                          fontWeight: 600, 
                          color: getPerformanceColor(performance.weekly)
                        }}
                      >
                        {formatPercentage(performance.weekly, 2)}
                      </ResponsiveTypography>
                    </Box>
                  )
                },
                { 
                  label: t('asset.details.performance.monthly'), 
                  value: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getPerformanceIcon(performance.monthly)}
                      <ResponsiveTypography 
                        variant="cardValue" 
                        sx={{ 
                          fontWeight: 600, 
                          color: getPerformanceColor(performance.monthly)
                        }}
                      >
                        {formatPercentage(performance.monthly, 2)}
                      </ResponsiveTypography>
                    </Box>
                  )
                },
                { 
                  label: t('asset.details.performance.yearly'), 
                  value: (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getPerformanceIcon(performance.yearly)}
                      <ResponsiveTypography 
                        variant="cardValue" 
                        sx={{ 
                          fontWeight: 600, 
                          color: getPerformanceColor(performance.yearly)
                        }}
                      >
                        {formatPercentage(performance.yearly, 2)}
                      </ResponsiveTypography>
                    </Box>
                  )
                },
                // Metadata
                {
                  label: t('asset.details.metadata.created'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {asset ? new Date(asset.createdAt).toLocaleDateString() : ''}
                    </ResponsiveTypography>
                  )
                },
                {
                  label: t('asset.details.metadata.lastUpdated'),
                  value: (
                    <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                      {asset ? new Date(asset.updatedAt).toLocaleDateString() : ''}
                    </ResponsiveTypography>
                  )
                }
              ]}
            />
          </CardContent>
        </Card>
      </Box>
    </ModalWrapper>
  );
};

export default AssetDetailsModal;
