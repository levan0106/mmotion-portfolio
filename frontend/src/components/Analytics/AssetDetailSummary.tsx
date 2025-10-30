/**
 * Asset Detail Summary component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Grid, Card, CardContent, Chip, useMediaQuery, useTheme } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { getPnLColor, getPnLLightColor } from '../../config/chartColors';
import TradeHistoryModal from '../Trading/TradeHistoryModal';

interface AssetDetail {
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  percentage: number;
  unrealizedPl: number;
  unrealizedPlPercentage: number;
  assetId?: string; // provided by API now
}

interface AssetDetailSummaryProps {
  data: AssetDetail[];
  baseCurrency: string;
  title?: string;
  compact?: boolean;
  accountId: string;
  portfolioId: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98',
];

const AssetDetailSummary: React.FC<AssetDetailSummaryProps> = ({
  data,
  baseCurrency,
  title = 'Asset Detail Summary',
  compact = false,
  accountId,
  portfolioId,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tradeModalOpen, setTradeModalOpen] = React.useState(false);
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);
  const handleOpenTrades = (symbol: string, assetId: string | undefined | null) => {
    if (!assetId) return; // require assetId to ensure accuracy
    setSelectedSymbol(symbol);
    setSelectedAssetId(assetId);
    setTradeModalOpen(true);
  };
  const handleCloseTrades = () => setTradeModalOpen(false);
  // Add null checks
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: compact ? 1 : 3, textAlign: 'center' }}>
        <ResponsiveTypography variant={compact ? "tableCell" : "cardTitle"} color="text.secondary">
          {t('portfolio.noAllocationData')}
        </ResponsiveTypography>
      </Box>
    );
  }

  // Transform data for the chart
  const chartData = data.map((asset, index) => ({
    assetId: asset.assetId,
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.assetType,
    quantity: asset.quantity,
    currentPrice: asset.currentPrice,
    totalValue: asset.totalValue,
    percentage: asset.percentage,
    unrealizedPl: asset.unrealizedPl,
    unrealizedPlPercentage: asset.unrealizedPlPercentage,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          p: 2,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: 200,
          maxWidth: 300
        }}>
          <ResponsiveTypography variant="cardTitle" sx={{ mb: 1, color: '#1a1a1a' }}>
            {data.symbol} - {data.name}
          </ResponsiveTypography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <ResponsiveTypography variant="tableCell" color="text.secondary">
              {t('portfolio.allocation')}:
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
              {formatPercentage(data.percentage || 0)}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <ResponsiveTypography variant="tableCell" color="text.secondary">
              {t('portfolio.value')}:
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
              {formatCurrency(data.totalValue, baseCurrency)}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <ResponsiveTypography variant="tableCell" color="text.secondary">
              {t('portfolio.quantity')}:
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
              {data.quantity?.toLocaleString() || '0'}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <ResponsiveTypography variant="tableCell" color="text.secondary">
              {t('assets.currentPrice')}:
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
              {formatCurrency(data.currentPrice, baseCurrency)}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1,
            backgroundColor: (data.unrealizedPl || 0) >= 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            borderRadius: 1,
            border: `1px solid ${(data.unrealizedPl || 0) >= 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`
          }}>
            <ResponsiveTypography variant="tableCell" color="text.secondary">
              {t('portfolio.unrealizedPL')}:
            </ResponsiveTypography>
            <Box sx={{ textAlign: 'right' }}>
              <ResponsiveTypography 
                variant="tableCell" 
                sx={{ 
                  fontWeight: 600,
                  color: (data.unrealizedPl || 0) >= 0 ? '#4caf50' : '#f44336'
                }}
              >
                {formatCurrency(data.unrealizedPl || 0, baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography 
                variant="labelSmall" 
                sx={{ 
                  color: (data.unrealizedPl || 0) >= 0 ? '#4caf50' : '#f44336'
                }}
              >
                {formatPercentage(data.unrealizedPlPercentage || 0)}
              </ResponsiveTypography>
            </Box>
          </Box>
        </Box>
      );
    }
    return null;
  };

  // Calculate dynamic height based on data length
  const getChartHeight = () => {
    const baseHeight = 50;
    const itemHeight = compact ? 20 : 30; // Height per item
    const minHeight = compact ? 100 : 150;
    const maxHeight = compact ? 400 : 600;
    
    const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, baseHeight + (chartData.length * itemHeight)));
    return calculatedHeight;
  };

  // Mobile Chart Component (Vertical)
  const MobileAllocationChart = () => (
    <Box sx={{ height: {xs: getChartHeight(), sm: compact ? 200 : 300} }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number"
            tickFormatter={(value) => formatPercentage(value)}
            tick={{ fontSize: compact ? 10 : 12 }}
          />
          <YAxis
            type="category"
            dataKey="symbol" 
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 60 : 80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );

  // Desktop Chart Component (Horizontal)
  const DesktopAllocationChart = () => (
    <Box sx={{ height: {xs: getChartHeight(), sm: compact ? 200 : 300} }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="symbol" 
            tick={{ fontSize: compact ? 10 : 12 }}
            angle={-70}
            textAnchor="end"
            height={compact ? 60 : 80}
          />
          <YAxis
            tickFormatter={(value) => formatPercentage(value)}
            tick={{ fontSize: compact ? 10 : 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );

  // Mobile P&L Chart Component (Vertical)
  const MobilePnLChart = () => (
    <Box sx={{ height: {xs: getChartHeight(), sm: compact ? 200 : 300} }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number"
            tickFormatter={(value) => formatCurrency(value, baseCurrency)}
            tick={{ fontSize: compact ? 10 : 12 }}
          />
          <YAxis
            type="category"
            dataKey="symbol" 
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 60 : 80}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <Box sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: 200,
                    maxWidth: 300
                  }}>
                    <ResponsiveTypography variant="cardTitle" sx={{ mb: 1, color: '#1a1a1a' }}>
                      {data.symbol} - {data.name}
                    </ResponsiveTypography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.currentValue')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                        {formatCurrency(data.totalValue, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.quantity')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                        {data.quantity?.toLocaleString() || '0'}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.marketPrice')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                        {formatCurrency(data.currentPrice, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 1,
                      backgroundColor: getPnLLightColor(data.unrealizedPl),
                      borderRadius: 1,
                      border: `1px solid ${getPnLColor(data.unrealizedPl)}40`
                    }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.unrealizedPL')}:
                      </ResponsiveTypography>
                      <Box sx={{ textAlign: 'right' }}>
                        <ResponsiveTypography 
                          variant="tableCell" 
                          sx={{ 
                            fontWeight: 600,
                            color: getPnLColor(data.unrealizedPl)
                          }}
                        >
                          {formatCurrency(data.unrealizedPl, baseCurrency)}
                        </ResponsiveTypography>
                        <ResponsiveTypography 
                          variant="labelSmall" 
                          sx={{ 
                            color: getPnLColor(data.unrealizedPl)
                          }}
                        >
                          {formatPercentage(data.unrealizedPlPercentage)}
                        </ResponsiveTypography>
                      </Box>
                    </Box>
                  </Box>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="unrealizedPl" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getPnLColor(entry.unrealizedPl)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );

  // Desktop P&L Chart Component (Horizontal)
  const DesktopPnLChart = () => (
    <Box sx={{ height: {xs: getChartHeight(), sm: compact ? 200 : 300} }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="symbol" 
            tick={{ fontSize: compact ? 10 : 12 }}
            angle={-70}
            textAnchor="end"
            height={compact ? 60 : 80}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, baseCurrency)}
            tick={{ fontSize: compact ? 10 : 12 }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <Box sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    minWidth: 200,
                    maxWidth: 300
                  }}>
                    <ResponsiveTypography variant="cardTitle" sx={{ mb: 1, color: '#1a1a1a' }}>
                      {data.symbol} - {data.name}
                    </ResponsiveTypography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.currentValue')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                        {formatCurrency(data.totalValue, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.quantity')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                        {data.quantity?.toLocaleString() || '0'}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.marketPrice')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                        {formatCurrency(data.currentPrice, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 1,
                      backgroundColor: getPnLLightColor(data.unrealizedPl),
                      borderRadius: 1,
                      border: `1px solid ${getPnLColor(data.unrealizedPl)}40`
                    }}>
                      <ResponsiveTypography variant="tableCell" color="text.secondary">
                        {t('portfolio.unrealizedPL')}:
                      </ResponsiveTypography>
                      <Box sx={{ textAlign: 'right' }}>
                        <ResponsiveTypography 
                          variant="tableCell" 
                          sx={{ 
                            fontWeight: 600,
                            color: getPnLColor(data.unrealizedPl)
                          }}
                        >
                          {formatCurrency(data.unrealizedPl, baseCurrency)}
                        </ResponsiveTypography>
                        <ResponsiveTypography 
                          variant="labelSmall" 
                          sx={{ 
                            color: getPnLColor(data.unrealizedPl)
                          }}
                        >
                          {formatPercentage(data.unrealizedPlPercentage)}
                        </ResponsiveTypography>
                      </Box>
                    </Box>
                  </Box>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="unrealizedPl" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getPnLColor(entry.unrealizedPl)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <ResponsiveTypography variant="cardTitle" color="text.secondary">
          {t('portfolio.noAllocationData')}
        </ResponsiveTypography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Trade History Modal */}
      <TradeHistoryModal
        open={tradeModalOpen}
        onClose={handleCloseTrades}
        symbol={selectedSymbol}
        baseCurrency={baseCurrency}
        accountId={accountId}
        portfolioId={portfolioId}
        assetId={selectedAssetId || ""}
      />
      {!compact && (
        <>
          <ResponsiveTypography variant="pageTitle">
            {title}
          </ResponsiveTypography>
          <ResponsiveTypography variant="labelSmall" color="text.secondary" sx={{ mb: 3 }}>
            {t('portfolio.individualAssetHoldingsDescription')}
          </ResponsiveTypography>
        </>
      )}
      
      {/* Charts */}
      <Grid container spacing={compact ? 1.5 : 3} sx={{ mb: compact ? 1.5 : 3 }}>
        {/* Allocation Chart */}
        <Grid item xs={12} md={6}>
          <ResponsiveTypography variant="chartTitle" >
            {t('portfolio.assetAllocation')} (%)
          </ResponsiveTypography>
          {isMobile ? <MobileAllocationChart /> : <DesktopAllocationChart />}
        </Grid>

        {/* P&L Chart */}
        <Grid item xs={12} md={6}>
          <ResponsiveTypography variant="chartTitle" >
            {t('portfolio.unrealizedPL')}
          </ResponsiveTypography>
          {isMobile ? <MobilePnLChart /> : <DesktopPnLChart />}
        </Grid>
      </Grid>

      {/* P&L Summary */}
      <Box sx={{ 
        mb: compact ? 1.5 : 3, 
        p: compact ? 1.5 : 2, 
        backgroundColor: 'rgba(25, 118, 210, 0.04)', 
        borderRadius: 2,
        border: '1px solid rgba(25, 118, 210, 0.12)'
      }}>
        <ResponsiveTypography variant="cardTitle" sx={{ 
          fontWeight: 600, 
          mb: compact ? 1 : 2
        }}>
          {t('portfolio.portfolioPerformanceSummary')}
        </ResponsiveTypography>
        <Grid container spacing={compact ? 1 : 2}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('portfolio.totalUnrealizedPL')}
              </ResponsiveTypography>
              <ResponsiveTypography 
                variant="cardValue" 
                color={chartData.reduce((sum, asset) => sum + asset.unrealizedPl, 0) >= 0 ? "success.main" : "error.main"}
                sx={{ 
                  fontWeight: 'bold', 
                  display: 'block'
                }}
              >
                {formatCurrency(
                  chartData.reduce((sum, asset) => sum + asset.unrealizedPl, 0), 
                  baseCurrency
                )}
              </ResponsiveTypography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('portfolio.profitableAssets')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="success.main" sx={{ 
                fontWeight: 'bold', 
                display: 'block'
              }}>
                {chartData.filter(asset => asset.unrealizedPl > 0).length} / {chartData.length}
              </ResponsiveTypography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('portfolio.bestPerformer')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="tableCell" color="primary" sx={{ 
                fontWeight: 'bold', 
                display: 'block'
              }}>
                {chartData.length > 0 ? 
                  chartData.reduce((best, asset) => 
                    asset.unrealizedPlPercentage > best.unrealizedPlPercentage ? asset : best
                  ).symbol : t('common.noData')
                }
              </ResponsiveTypography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Asset Detail Cards */}
      <Grid container spacing={compact ? 1 : 1.5}>
        {chartData.map((asset, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                }
              }}
            >
              <CardContent sx={{ p: compact ? 1 : 1.5, '&:last-child': { pb: compact ? 1 : 1.5 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: asset.color,
                        borderRadius: '50%',
                        mr: 0.75,
                      }}
                    />
                    <ResponsiveTypography 
                      variant="cardValueMedium"
                      sx={{ cursor: asset.assetId ? 'pointer' : 'default', textDecoration: asset.assetId ? 'underline' : 'none', textUnderlineOffset: '2px' }}
                      onClick={() => asset.assetId && handleOpenTrades(asset.symbol, asset.assetId)}
                    >
                      {asset.symbol}
                    </ResponsiveTypography>
                  </Box>
                  <Chip 
                    label={asset.assetType} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ 
                      height: 18,
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                  />
                </Box>
                
                {/* Asset Name */}
                <ResponsiveTypography 
                  variant="labelSmall" 
                  color="text.secondary" 
                  sx={{ 
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 1,
                    fontSize: '0.7rem!important'
                  }}
                >
                  {asset.name}
                </ResponsiveTypography>
                
                {/* Allocation & Total Value */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1,
                  p: 0.75,
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  borderRadius: 1,
                  border: '1px solid rgba(25, 118, 210, 0.12)'
                }}>
                  <Box>
                    <ResponsiveTypography variant="labelXSmall" sx={{color: "text.secondary" }}>
                      {t('portfolio.allocation')}
                    </ResponsiveTypography>
                    <ResponsiveTypography 
                      variant="cardValueSmall" 
                      color="primary" 
                      sx={{ fontWeight: 'bold', display: 'block' }}
                    >
                      {formatPercentage(asset.percentage)}
                    </ResponsiveTypography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <ResponsiveTypography variant="labelXSmall" sx={{color: "text.secondary" }}>
                      {t('portfolio.value')}
                    </ResponsiveTypography>
                    <ResponsiveTypography 
                      variant="cardValueSmall" 
                      color="text.primary" 
                      sx={{ fontWeight: 'bold', display: 'block' }}
                    >
                      {formatCurrency(asset.totalValue, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Box>
                
                {/* Details Grid */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 0.5
                }}>
                  <Box>
                    <ResponsiveTypography variant="labelXSmall" color="text.secondary">
                      {t('portfolio.qty')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="labelSmall" sx={{ fontWeight: 'bold', display: 'block' }}>
                      {asset.quantity?.toLocaleString() || '0'}
                    </ResponsiveTypography>
                  </Box>
                  
                  <Box>
                    <ResponsiveTypography variant="labelXSmall" color="text.secondary">
                      {t('portfolio.marketPrice')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="labelSmall" sx={{ fontWeight: 'bold', display: 'block' }}>
                      {formatCurrency(asset.currentPrice, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Box>
                
                {/* P&L - Highlighted */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mt: 1,
                  p: 0.75,
                  backgroundColor: getPnLLightColor(asset.unrealizedPl),
                  borderRadius: 1,
                  border: `1px solid ${getPnLColor(asset.unrealizedPl)}30`
                }}>
                  <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
                    <ResponsiveTypography 
                      variant="labelXSmall" 
                      sx={{ 
                        color: "text.secondary",
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%'
                      }}
                    >
                      {t('portfolio.unrealizedPL')}
                    </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="cardValueSmall" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: asset.unrealizedPl >= 0 ? "success.main" : "error.main",
                          display: 'block' 
                        }}
                      >
                        {formatCurrency(asset.unrealizedPl, baseCurrency)}
                      </ResponsiveTypography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <ResponsiveTypography 
                      variant="cardValueSmall" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: asset.unrealizedPl >= 0 ? "success.main" : "error.main",
                        display: 'block' 
                      }}
                    >
                      {formatPercentage(asset.unrealizedPlPercentage)}
                    </ResponsiveTypography>
                    <ResponsiveTypography 
                      variant="labelXSmall" 
                      sx={{ color: "text.secondary" }}
                    > 
                      {asset.unrealizedPl >= 0 ? t('portfolio.profit') : t('portfolio.loss')}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Summary Stats */}
      <Box sx={{ 
        mt: 3, 
        p: 3, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 2,
      }}>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary" gutterBottom>
                {t('portfolio.totalAssets')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="primary" sx={{ fontWeight: 'bold' }}>
                {data.length}
              </ResponsiveTypography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary" gutterBottom>
                {t('portfolio.totalAssetValue')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="primary" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(data.reduce((sum, asset) => sum + asset.totalValue, 0), baseCurrency)}
              </ResponsiveTypography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary" gutterBottom>
                {t('portfolio.totalPL')}
              </ResponsiveTypography>
              <ResponsiveTypography 
                variant="cardValue" 
                sx={{ 
                  fontWeight: 'bold',
                  color: data.reduce((sum, asset) => sum + asset.unrealizedPl, 0) >= 0 ? "success.main" : "error.main"
                }}
              >
                {formatCurrency(data.reduce((sum, asset) => sum + asset.unrealizedPl, 0), baseCurrency)}
              </ResponsiveTypography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary" gutterBottom>
                {t('portfolio.assetTypes')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="primary" sx={{ fontWeight: 'bold' }}>
                {new Set(data.map(asset => asset.assetType)).size}
              </ResponsiveTypography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AssetDetailSummary;
