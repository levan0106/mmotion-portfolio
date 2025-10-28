import React, { useState, useMemo } from 'react';
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
  Alert,
  CircularProgress,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { ResponsiveFormSelect } from '../Common/ResponsiveFormControl';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { TradeAnalysis as TradeAnalysisType } from '../../types';
import { useTradeAnalysis } from '../../hooks/useTrading';
import { usePortfolio } from '../../hooks/usePortfolios';
// ✅ ĐÚNG - Import từ utils chính theo UTILS_GUIDE.md
import { formatCurrency, formatPercentage, formatNumber, formatPercentageWithSeparators } from '../../utils/format';
import { isValidUUID } from '../../utils/validation';

export interface TradeAnalysisProps {
  analysis: TradeAnalysisType;
  currency?: string;
  isLoading?: boolean;
  error?: string;
  selectedTimeframe?: string;
  selectedGranularity?: string;
  onTimeframeChange?: (timeframe: string) => void;
  onGranularityChange?: (granularity: string) => void;
  isCompactMode?: boolean;
}

/**
 * TradeAnalysis component for displaying comprehensive trading performance analysis.
 * Shows statistics, charts, and performance metrics.
 */
export const TradeAnalysis: React.FC<TradeAnalysisProps> = ({
  analysis,
  currency = 'VND', // Default fallback
  isLoading = false,
  error,
  selectedTimeframe = '3M',
  selectedGranularity = 'weekly',
  onTimeframeChange,
  onGranularityChange,
  isCompactMode = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [chartView, setChartView] = useState<'pie' | 'compact'>('pie');
  const [pnlLines, setPnlLines] = useState({
    total: true,
    realized: true,
    unrealized: true,
  });

  // Color palette for charts - more distinct colors
  const COLORS = [
    '#0088FE', // Blue
    '#00C49F', // Teal
    '#FFBB28', // Yellow
    '#FF8042', // Orange
    '#8884D8', // Purple
    '#82CA9D', // Light Green
    '#FFC658', // Gold
    '#FF7C7C', // Pink
    '#8DD1E1', // Light Blue
    '#D084D0', // Light Purple
    '#FFB347', // Peach
    '#87CEEB', // Sky Blue
    '#DDA0DD', // Plum
    '#F0E68C', // Khaki
    '#98FB98', // Pale Green
    '#F4A460', // Sandy Brown
    '#20B2AA', // Light Sea Green
    '#FF6347', // Tomato
    '#4682B4', // Steel Blue
    '#D2691E'  // Chocolate
  ];


  // ✅ ĐÚNG - Xác định locale dựa trên currency
  const getLocale = (currency: string): string => {
    switch (currency) {
      case 'VND':
        return 'vi-VN';
      case 'USD':
        return 'en-US';
      default:
        return 'vi-VN';
    }
  };

  const locale = getLocale(currency);

  // ✅ ĐÚNG - Validation data trước khi sử dụng theo UTILS_GUIDE.md
  const isValidAnalysis = useMemo(() => {
    if (!analysis) return false;
    
    // Validate required fields
    if (!analysis.pnlSummary || !analysis.statistics || !analysis.riskMetrics) {
      return false;
    }
    
    // Validate assetPerformance exists (allow empty array)
    if (!Array.isArray(analysis.assetPerformance)) {
      return false;
    }
    
    // Validate percentage values (more lenient)
    if (analysis.pnlSummary.winRate !== undefined) {
      const winRate = Number(analysis.pnlSummary.winRate);
      if (isNaN(winRate) || winRate < 0 || winRate > 100) {
        return false;
      }
    }
    
    // Validate volatility (more lenient - allow higher values)
    if (analysis.riskMetrics.volatility !== undefined) {
      const volatility = Number(analysis.riskMetrics.volatility);
      if (isNaN(volatility) || volatility < 0) {
        return false;
      }
    }
    
    return true;
  }, [analysis]);

  // Prepare chart data
  const monthlyChartData = useMemo(() => {
    return analysis.monthlyPerformance.map((month) => ({
      month: month.period,
      // Total P&L (realized + unrealized)
      pnl: parseFloat(month.totalPl?.toString() || '0'),
      // Realized P&L from trades
      realizedPnl: parseFloat((month as any).realizedPl?.toString() || '0'),
      // Unrealized P&L from current positions
      unrealizedPnl: parseFloat((month as any).unrealizedPl?.toString() || '0'),
      trades: month.tradesCount || 0,
      winRate: month.winRate || 0,
      totalVolume: parseFloat(month.totalVolume?.toString() || '0'),
      winningTrades: month.winningTrades || 0,
      losingTrades: month.losingTrades || 0,
      // Format for display
      formattedPnl: formatCurrency(parseFloat(month.totalPl?.toString() || '0'), currency, {}, locale),
      formattedRealizedPnl: formatCurrency(parseFloat((month as any).realizedPl?.toString() || '0'), currency, {}, locale),
      formattedUnrealizedPnl: formatCurrency(parseFloat((month as any).unrealizedPl?.toString() || '0'), currency, {}, locale),
      formattedVolume: formatCurrency(parseFloat(month.totalVolume?.toString() || '0'), currency, {}, locale),
      formattedWinRate: formatPercentage(month.winRate || 0, 1, locale),
      // Color based on P&L
      color: parseFloat(month.totalPl?.toString() || '0') >= 0 ? '#00C49F' : '#FF8042',
    }));
  }, [analysis.monthlyPerformance, currency, locale]);

  const assetChartData = useMemo(() => {
    
    if (!analysis.assetPerformance || !Array.isArray(analysis.assetPerformance)) {
      return [];
    }
    
    const data = analysis.assetPerformance.map((asset, index) => {
      const originalValue = parseFloat(asset.totalPl?.toString() || '0');
      // Use absolute value for pie chart visualization, but keep original for display
      const chartValue = Math.abs(originalValue);
      
      return {
        assetId: asset.assetId || `asset-${index}`,
        name: asset.assetSymbol || t('tradeAnalysis.unknown.asset'),
        fullName: asset.assetName || t('tradeAnalysis.unknown.assetName'),
        value: chartValue, // Use absolute value for pie chart
        originalValue: originalValue, // Keep original for reference
        trades: asset.tradesCount || 0,
        winRate: asset.winRate || 0,
        totalVolume: parseFloat(asset.totalVolume?.toString() || '0'),
        quantity: parseFloat(asset.quantity?.toString() || '0'),
        avgCost: parseFloat(asset.avgCost?.toString() || '0'),
        marketValue: parseFloat(asset.marketValue?.toString() || '0'),
        color: COLORS[index % COLORS.length], // Use consistent color for each asset
        // Format for display
        formattedValue: formatCurrency(originalValue, currency, {}, locale),
        formattedVolume: formatCurrency(parseFloat(asset.totalVolume?.toString() || '0'), currency, {}, locale),
        formattedWinRate: formatPercentage(asset.winRate || 0, 1, locale),
      };
    });
    
    // Sort by P&L value (descending) for better visualization
    const sortedData = data.sort((a, b) => b.value - a.value);
    
    return sortedData;
  }, [analysis.assetPerformance, currency, locale]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            p: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: 250,
            maxWidth: 300,
          }}
        >
          {/* Header */}
          <ResponsiveTypography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
            {label}
          </ResponsiveTypography>
          
          {/* Monthly Performance Chart Tooltip */}
          {data?.month && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* P&L Information */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('tradeAnalysis.tooltip.totalPnL')}:
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" fontWeight="bold" color={data.pnl >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(data.pnl || 0, currency, {}, locale)}
                </ResponsiveTypography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('tradeAnalysis.tooltip.realizedPnL')}:
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" fontWeight="medium" color={data.realizedPnl >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(data.realizedPnl || 0, currency, {}, locale)}
                </ResponsiveTypography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('tradeAnalysis.tooltip.unrealizedPnL')}:
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" fontWeight="medium" color={data.unrealizedPnl >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(data.unrealizedPnl || 0, currency, {}, locale)}
                </ResponsiveTypography>
              </Box>

              {/* Trading Statistics */}
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {t('tradeAnalysis.tooltip.trades')}:
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium">
                    {data.trades || 0}
                  </ResponsiveTypography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {t('tradeAnalysis.tooltip.winRate')}:
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium" color={data.winRate >= 50 ? 'success.main' : 'warning.main'}>
                    {formatPercentage(data.winRate || 0, 1, locale)}
                  </ResponsiveTypography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {t('tradeAnalysis.tooltip.volume')}:
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium">
                    {formatCurrency(data.totalVolume || 0, currency, {}, locale)}
                  </ResponsiveTypography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Asset Performance Chart Tooltip */}
          {data?.name && !data?.month && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('tradeAnalysis.tooltip.symbol')}:
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" fontWeight="bold" color="primary">
                  {data.name}
                </ResponsiveTypography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('tradeAnalysis.tooltip.pnl')}:
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" fontWeight="bold" color={data.originalValue >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(data.originalValue || 0, currency, {}, locale)}
                </ResponsiveTypography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <ResponsiveTypography variant="body2" color="text.secondary">
                  {t('tradeAnalysis.tooltip.performance')}:
                </ResponsiveTypography>
                <ResponsiveTypography variant="body2" fontWeight="medium" color={data.percentage >= 0 ? 'success.main' : 'error.main'}>
                  {formatPercentage(data.percentage || 0, 2, locale)}
                </ResponsiveTypography>
              </Box>

              {data?.fullName && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                  <ResponsiveTypography variant="body2" color="text.secondary">
                    {data.fullName}
                  </ResponsiveTypography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      );
    }
    return null;
  };

  // Custom label component for pie chart
  const CustomLabel = ({ name, percent, payload, x, y }: any) => {
    const percentage = formatPercentageWithSeparators(percent * 100, 1, locale);
    const value = payload?.formattedValue || formatCurrency(payload?.value || 0, currency, {}, locale);

    return (
      <g>
        <text x={x} y={y - 6} textAnchor="middle" fill="#333" fontSize="10" fontWeight="bold">
          {name}
        </text>
        {percent >= 0.02 && (
          <text x={x} y={y + 6} textAnchor="middle" fill="#333" fontSize="9" fontWeight="normal">
            {percentage}
          </text>
        )}
        {percent >= 0.05 && (
          <text x={x} y={y + 18} textAnchor="middle" fill="#333" fontSize="9" fontWeight="normal">
            {value}
          </text>
        )}
        {percent < 0.02 && (
          <text x={x} y={y + 6} textAnchor="middle" fill="#333" fontSize="9" fontWeight="normal">
            {value}
          </text>
        )}
      </g>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <ResponsiveTypography variant="pageSubtitle" sx={{ ml: 2 }}>{t('tradeAnalysis.loading')}</ResponsiveTypography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {(error as any)?.message || t('tradeAnalysis.error.loadFailed')}
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert severity="info">
        {t('tradeAnalysis.noData')}
      </Alert>
    );
  }

  // ✅ ĐÚNG - Validation data trước khi render theo UTILS_GUIDE.md
  if (!isValidAnalysis) {
    return (
      <Alert severity="error">
        {t('tradeAnalysis.error.invalidData')}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={isCompactMode ? 2 : 4}>
        <Box>
          <ResponsiveTypography variant="pageTitle" component="h1" gutterBottom>
            {t('tradeAnalysis.title')}
          </ResponsiveTypography>
          <ResponsiveTypography variant="pageSubtitle" color="text.secondary" display={isMobile ? 'none' : 'block'}>
            {t('tradeAnalysis.subtitle')}
          </ResponsiveTypography>
        </Box>
        <Box display="flex" gap={2}>
          <ResponsiveFormSelect
            compact={isCompactMode}
            size="small"
            options={[
              { value: 'ALL', label: t('tradeAnalysis.timeframe.allTime') },
              { value: '1M', label: t('tradeAnalysis.timeframe.oneMonth') },
              { value: '3M', label: t('tradeAnalysis.timeframe.threeMonths') },
              { value: '6M', label: t('tradeAnalysis.timeframe.sixMonths') },
              { value: '1Y', label: t('tradeAnalysis.timeframe.oneYear') },
            ]}
            value={selectedTimeframe}
            onChange={(value) => onTimeframeChange?.(String(value))}
            formControlSx={{ minWidth: 80 }}
            selectSx={{ borderRadius: 2 }}
          />
          <ResponsiveFormSelect
            compact={isCompactMode}
            size="small"
            options={[
              { value: 'daily', label: t('tradeAnalysis.granularity.daily') },
              { value: 'weekly', label: t('tradeAnalysis.granularity.weekly') },
              { value: 'monthly', label: t('tradeAnalysis.granularity.monthly') },
            ]}
            value={selectedGranularity}
            onChange={(value) => onGranularityChange?.(String(value))}
            formControlSx={{ minWidth: 80 }}
            selectSx={{ borderRadius: 2 }}
          />
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={isCompactMode ? 1 : 3} mb={isCompactMode ? 2 : 4}>
        {/* Total P&L Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            height: isCompactMode ? 120 : 200, 
            boxShadow: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid #e3f2fd',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ p: isCompactMode ? 1.5 : 2 }}>
              {/* Header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={isCompactMode ? 1 : 2}>
                <Box>
                  <ResponsiveTypography 
                    variant="formHelper" 
                    color="text.secondary" 
                    gutterBottom
                  >
                    {t('tradeAnalysis.totalPnL')}
                  </ResponsiveTypography>
                  <ResponsiveTypography 
                    variant="cardValue" 
                    color={analysis.pnlSummary.totalPnl >= 0 ? 'success.main' : 'error.main'} 
                    fontWeight="bold"
                  >
                    {formatCurrency(analysis.pnlSummary.totalPnl, currency, {}, locale)}
                  </ResponsiveTypography>
                </Box>
                <Box
                  sx={{
                    color: analysis.pnlSummary.totalPnl >= 0 ? 'success.main' : 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: isCompactMode ? 18 : 24 }} />
                </Box>
              </Box>
              
              {/* P&L Breakdown */}
              {!isCompactMode && (
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.realizedPnL')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography 
                      variant="tableCell" 
                      color={(analysis.pnlSummary as any).totalRealizedPnl >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatCurrency((analysis.pnlSummary as any).totalRealizedPnl, currency, {}, locale)}
                    </ResponsiveTypography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.unrealizedPnL')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography 
                      variant="tableCell" 
                      color={(analysis.pnlSummary as any).totalUnrealizedPnl >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatCurrency((analysis.pnlSummary as any).totalUnrealizedPnl, currency, {}, locale)}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              )}
              
              {/* Win Rate */}
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`${formatPercentage(analysis.pnlSummary.winRate, 1, locale)} ${t('tradeAnalysis.winRate')}`}
                  color={analysis.pnlSummary.winRate >= 50 ? 'success' : 'warning'}
                  size={isCompactMode ? "small" : "medium"}
                  variant="outlined"
                  sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trading Statistics Card - Combined Trades & Volume */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            height: isCompactMode ? 120 : 200, 
            boxShadow: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f3e5f5 100%)',
            border: '1px solid #e1bee7',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ p: isCompactMode ? 1.5 : 2 }}>
              {/* Header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={isCompactMode ? 1 : 2}>
                <Box>
                  <ResponsiveTypography 
                    variant="formHelper" 
                    color="text.secondary" 
                    gutterBottom
                  >
                    {t('tradeAnalysis.tradingStatistics')}
                  </ResponsiveTypography>
                  <ResponsiveTypography 
                    variant="cardValue" 
                    color="primary" 
                    fontWeight="bold"
                  >
                    {formatNumber(analysis.statistics.totalTrades, 0, locale)} {t('tradeAnalysis.trades')}
                  </ResponsiveTypography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${t('tradeAnalysis.average')}: ${formatCurrency(analysis.statistics.averagePrice, currency, {}, locale)}`}
                    color="info"
                    size={isCompactMode ? "small" : "medium"}
                    variant="outlined"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  />
                  <AssessmentIcon sx={{ display:{xs: 'none', sm: 'block'}, color: 'primary.main', fontSize: isCompactMode ? 18 : 24 }} />
                </Box>
              </Box>
              
              {/* Trades Breakdown */}
              {!isCompactMode && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.buyTrades')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="tableCell" color="success.main" fontWeight="medium">
                      {analysis.statistics.buyTrades}
                    </ResponsiveTypography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.sellTrades')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="tableCell" color="error.main" fontWeight="medium">
                      {analysis.statistics.sellTrades}
                    </ResponsiveTypography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.totalVolume')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="tableCell" color="info.main" fontWeight="medium">
                      {formatCurrency(analysis.statistics.totalVolume, currency, {}, locale)}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Metrics Card - Volatility & Max Drawdown */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ 
            height: isCompactMode ? 120 : 200, 
            boxShadow: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)',
            border: '1px solid #ffcc02',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ p: isCompactMode ? 1.5 : 2 }}>
              {/* Header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={isCompactMode ? 1 : 2}>
                <Box>
                  <ResponsiveTypography 
                    variant="formHelper" 
                    color="text.secondary" 
                    gutterBottom
                  >
                    {t('tradeAnalysis.riskMetrics')}
                  </ResponsiveTypography>
                  <ResponsiveTypography 
                    variant="cardValue" 
                    color="warning.main" 
                    fontWeight="bold"
                  >
                    {analysis.riskMetrics.volatility?.toFixed(2) || 'N/A'}%
                  </ResponsiveTypography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${t('tradeAnalysis.riskLevel')}: ${analysis.riskMetrics.volatility > 20 ? t('tradeAnalysis.riskLevels.high') : analysis.riskMetrics.volatility > 10 ? t('tradeAnalysis.riskLevels.medium') : t('tradeAnalysis.riskLevels.low')}`}
                    color={analysis.riskMetrics.volatility > 20 ? 'error' : analysis.riskMetrics.volatility > 10 ? 'warning' : 'success'}
                    size={isCompactMode ? "small" : "medium"}
                    variant="outlined"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  />
                  <ShowChartIcon sx={{display:{xs: 'none', sm: 'block'}, color: 'warning.main', fontSize: isCompactMode ? 18 : 24 }} />
                </Box>
              </Box>
              
              {/* Risk Breakdown */}
              {!isCompactMode && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.maxDrawdown')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="tableCell" color="error.main" fontWeight="medium">
                      {formatCurrency(analysis.riskMetrics.maxDrawdown || 0, currency, {}, locale)}
                    </ResponsiveTypography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.var95')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="tableCell" color="warning.main" fontWeight="medium">
                      {formatCurrency(analysis.riskMetrics.var95 || 0, currency, {}, locale)}
                    </ResponsiveTypography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ResponsiveTypography variant="formHelper" color="text.secondary">
                      {t('tradeAnalysis.sharpeRatio')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="tableCell" color="primary.main" fontWeight="medium">
                      {analysis.riskMetrics.sharpeRatio?.toFixed(2) || 'N/A'}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={isCompactMode ? 1 : 3} mb={isCompactMode ? 2 : 4}>
        {/* Monthly Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            boxShadow: 2, 
            height: isCompactMode ? 250 : 400,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid #e3f2fd',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: isCompactMode ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={isCompactMode ? 1.5 : 3}>
                <ResponsiveTypography variant="chartTitle">
                  {t('tradeAnalysis.monthlyPerformance')}
                </ResponsiveTypography>
                <Box display="flex" gap={isCompactMode ? 0.5 : 1}>
                  <Chip
                    label={t('tradeAnalysis.totalPnL')}
                    size={isCompactMode ? "small" : "medium"}
                    color={pnlLines.total ? 'primary' : 'default'}
                    onClick={() => setPnlLines(prev => ({ ...prev, total: !prev.total }))}
                    sx={{ 
                      cursor: 'pointer',
                      //fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                  <Chip
                    label={t('tradeAnalysis.realizedPnL')}
                    size={isCompactMode ? "small" : "medium"}
                    color={pnlLines.realized ? 'success' : 'default'}
                    onClick={() => setPnlLines(prev => ({ ...prev, realized: !prev.realized }))}
                    sx={{ 
                      cursor: 'pointer',
                      //fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                  <Chip
                    label={t('tradeAnalysis.unrealizedPnL')}
                    size={isCompactMode ? "small" : "medium"}
                    color={pnlLines.unrealized ? 'warning' : 'default'}
                    onClick={() => setPnlLines(prev => ({ ...prev, unrealized: !prev.unrealized }))}
                    sx={{ 
                      cursor: 'pointer',
                      //fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: isCompactMode ? 9 : 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: isCompactMode ? 9 : 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickFormatter={(value) => formatCurrency(value, currency, {}, locale)}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    contentStyle={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                      padding: 0
                    }}
                    cursor={{ stroke: '#1976d2', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  
                  {/* Total P&L Line */}
                  {pnlLines.total && (
                    <Line
                      type="monotone"
                      dataKey="pnl"
                      stroke="#1976d2"
                      strokeWidth={isCompactMode ? 2 : 3}
                      dot={{ r: isCompactMode ? 3 : 4, fill: '#1976d2', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: isCompactMode ? 4 : 6, stroke: '#1976d2', strokeWidth: 2 }}
                      name={t('tradeAnalysis.totalPnL')}
                    />
                  )}
                  
                  {/* Realized P&L Line */}
                  {pnlLines.realized && (
                    <Line
                      type="monotone"
                      dataKey="realizedPnl"
                      stroke="#00C49F"
                      strokeWidth={isCompactMode ? 1.5 : 2}
                      dot={{ r: isCompactMode ? 2 : 3, fill: '#00C49F', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: isCompactMode ? 3 : 5, stroke: '#00C49F', strokeWidth: 2 }}
                      name={t('tradeAnalysis.realizedPnL')}
                    />
                  )}
                  
                  {/* Unrealized P&L Line */}
                  {pnlLines.unrealized && (
                    <Line
                      type="monotone"
                      dataKey="unrealizedPnl"
                      stroke="#FF8042"
                      strokeWidth={isCompactMode ? 1.5 : 2}
                      dot={{ r: isCompactMode ? 2 : 3, fill: '#FF8042', stroke: '#fff', strokeWidth: 2 }}
                      activeDot={{ r: isCompactMode ? 3 : 5, stroke: '#FF8042', strokeWidth: 2 }}
                      name={t('tradeAnalysis.unrealizedPnL')}
                    />
                  )}
                </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Asset Performance Chart */}
        {!isMobile && (
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            boxShadow: 2, 
            height: isCompactMode ? 250 : 400,
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: isCompactMode ? 1.5 : 2 }}>
              {/* Header with Toggle Controls */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={isCompactMode ? 1.5 : 3}>
                <ResponsiveTypography variant="chartTitle">
                  {t('tradeAnalysis.assetPerformance')}
                </ResponsiveTypography>
                <Box display="flex" gap={isCompactMode ? 0.5 : 1}>
                  <Chip
                    label={t('tradeAnalysis.pieChart')}
                    size={isCompactMode ? "small" : "medium"}
                    color={chartView === 'pie' ? 'primary' : 'default'}
                    onClick={() => setChartView('pie')}
                    sx={{ 
                      cursor: 'pointer',
                      //fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                  <Chip
                    label={t('tradeAnalysis.compactList')}
                    size={isCompactMode ? "small" : "medium"}
                    color={chartView === 'compact' ? 'primary' : 'default'}
                    onClick={() => setChartView('compact')}
                    sx={{ 
                      cursor: 'pointer',
                      //fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                </Box>
              </Box>
              
              {assetChartData && assetChartData.length > 0 ? (
                <Box sx={{ height: isCompactMode ? 200 : 350, display: 'flex', flexDirection: 'column' }}>

                  {chartView === 'pie' ? (
                    <Box sx={{ 
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '& .recharts-pie-label-text': {
                        fontSize: isCompactMode ? '8px !important' : '10px !important',
                        fontWeight: 'bold !important',
                        fill: '#333 !important',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.8) !important'
                      }
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={<CustomLabel />}
                            outerRadius={isCompactMode ? 60 : 90}
                            innerRadius={isCompactMode ? 25 : 35}
                            fill="#8884d8"
                            dataKey="value"
                            minAngle={1}
                            paddingAngle={1}
                          >
                            {assetChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={<CustomTooltip />}
                            contentStyle={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              boxShadow: 'none',
                              padding: 0
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      flex: 1,
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      borderRadius: 1,
                      backgroundColor: 'grey.50',
                      p: isCompactMode ? 1 : 2
                    }}>
                      <Box display="flex" flexWrap="wrap" gap={isCompactMode ? 0.5 : 1}>
                        {assetChartData.map((entry, index) => {
                          const totalValue = assetChartData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
                          
                          return (
                            <Chip
                              key={index}
                              size={isCompactMode ? "small" : "medium"}
                              icon={
                                <Box
                                  sx={{
                                    width: isCompactMode ? 6 : 8,
                                    height: isCompactMode ? 6 : 8,
                                    borderRadius: '50%',
                                    backgroundColor: entry.color || COLORS[index % COLORS.length],
                                    border: '1px solid white',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                  }}
                                />
                              }
                              label={
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <ResponsiveTypography 
                                    variant="formHelper" 
                                    sx={{ color: 'text.primary' }}
                                    fontWeight="bold"
                                  >
                                    {entry.name}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography 
                                    variant="formHelper" 
                                    fontWeight="bold"
                                    sx={{ color: entry.originalValue >= 0 ? 'success.main' : 'error.main' }}
                                  >
                                    {entry.formattedValue}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography 
                                    variant="formHelper" 
                                    sx={{ color: 'primary' }}
                                    fontWeight="bold"
                                  >
                                    ({formatPercentage(percentage, 1, locale)})
                                  </ResponsiveTypography>
                                </Box>
                              }
                              variant="outlined"
                              sx={{
                                height: isCompactMode ? 24 : 32,
                                backgroundColor: entry.originalValue >= 0 ? 'success.50' : 'error.50',
                                borderColor: 'grey.300',
                                borderWidth: 1,
                                '&:hover': {
                                  backgroundColor: entry.originalValue >= 0 ? 'success.100' : 'error.100',
                                  transform: 'scale(1.02)',
                                  borderColor: entry.originalValue >= 0 ? 'success.main' : 'error.main'
                                },
                                transition: 'all 0.2s ease-in-out'
                              }}
                            />
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={isCompactMode ? 200 : 300}>
                  <ResponsiveTypography 
                    variant="pageSubtitle" 
                    color="text.secondary" 
                    gutterBottom
                  >
                    {t('tradeAnalysis.noAssetData')}
                  </ResponsiveTypography>
                  
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        )}
      </Grid>

      {/* Top and Worst Trades Tables */}
      <Grid container spacing={isCompactMode ? 1 : 3} mb={isCompactMode ? 2 : 4}>
        {/* Top Trades */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            boxShadow: 2, 
            minHeight: 100,
            maxHeight: isCompactMode ? 400 : 600,
            background: 'white',
            border: '1px solid #c8e6c9',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: isCompactMode ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={isCompactMode ? 1.5 : 3}>
                <ResponsiveTypography variant="chartTitle">
                  {t('tradeAnalysis.topTrades')}
                </ResponsiveTypography>
                <Chip
                  label={t('tradeAnalysis.best')}
                  color="success"
                  size={isCompactMode ? "small" : "medium"}
                  variant="outlined"
                  sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                />
              </Box>
              <TableContainer sx={{ 
                flex: 1, 
                overflow: 'auto',
                maxHeight: isCompactMode ? 300 : 450,
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: '3px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: '#a8a8a8'
                  }
                }
              }}>
                <Table size={isCompactMode ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1,
                        maxWidth: { xs: '120px', sm: '150px', md: '200px' },
                        minWidth: '100px'
                      }}>
                        {t('tradeAnalysis.table.asset')}
                      </TableCell>
                      {/* <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.side')}
                      </TableCell> */}
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.pnl')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.date')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.topTrades.slice(0, 5).map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell sx={{ 
                          py: isCompactMode ? 0.5 : 1,
                          maxWidth: { xs: '120px', sm: '150px', md: '200px' },
                          minWidth: '100px'
                        }}>
                          <Box>
                            <ResponsiveTypography 
                              variant="tableCell" 
                              fontWeight="medium"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {trade.assetSymbol}
                            </ResponsiveTypography>
                            <ResponsiveTypography 
                              variant="formHelper" 
                              color="text.secondary"
                              sx={{
                                display: {'xs': 'none', 'sm': 'block'},
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {trade.assetName}
                            </ResponsiveTypography>
                          </Box>
                        </TableCell>
                        {/* <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                          <Chip
                            label={trade.side}
                            color={trade.side === 'BUY' ? 'success' : 'error'}
                            size={isCompactMode ? "small" : "medium"}
                            sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                          />
                        </TableCell> */}
                        <TableCell 
                          sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                            color: trade.realizedPl >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {formatCurrency(Number(trade.realizedPl) || 0, currency, {}, locale)}
                        </TableCell>
                        <TableCell sx={{ 
                          py: isCompactMode ? 0.5 : 1,
                          // fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                        }}>
                          {new Date(trade.tradeDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Worst Trades */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            boxShadow: 2, 
            minHeight: 100,
            maxHeight: isCompactMode ? 400 : 600,
            background: 'white',
            border: '1px solid #ffcdd2',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: isCompactMode ? 1.5 : 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={isCompactMode ? 1.5 : 3}>
                <ResponsiveTypography variant="chartTitle">
                  {t('tradeAnalysis.worstTrades')}
                </ResponsiveTypography>
                <Chip
                  label={t('tradeAnalysis.worst')}
                  color="error"
                  size={isCompactMode ? "small" : "medium"}
                  variant="outlined"
                  sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                />
              </Box>
              <TableContainer sx={{ 
                flex: 1, 
                overflow: 'auto',
                maxHeight: isCompactMode ? 300 : 450,
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: '3px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: '#a8a8a8'
                  }
                }
              }}>
                <Table size={isCompactMode ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1,
                        maxWidth: { xs: '120px', sm: '150px', md: '200px' },
                        minWidth: '100px'
                      }}>
                        {t('tradeAnalysis.table.asset')}
                      </TableCell>
                      {/* <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.side')}
                      </TableCell> */}
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.pnl')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.date')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.worstTrades.slice(0, 5).map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell sx={{ 
                          py: isCompactMode ? 0.5 : 1,
                          maxWidth: { xs: '120px', sm: '150px', md: '200px' },
                          minWidth: '100px'
                        }}>
                          <Box>
                            <ResponsiveTypography 
                              variant="tableCell" 
                              fontWeight="medium"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {trade.assetSymbol}
                            </ResponsiveTypography>
                            <ResponsiveTypography 
                              variant="formHelper" 
                              color="text.secondary"
                              sx={{
                                display: {'xs': 'none', 'sm': 'block'},
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {trade.assetName}
                            </ResponsiveTypography>
                          </Box>
                        </TableCell>
                        {/* <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                          <Chip
                            label={trade.side}
                            color={trade.side === 'BUY' ? 'success' : 'error'}
                            size={isCompactMode ? "small" : "medium"}
                            sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                          />
                        </TableCell> */}
                        <TableCell 
                          sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                            color: trade.realizedPl >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {formatCurrency(Number(trade.realizedPl) || 0, currency, {}, locale)}
                        </TableCell>
                        <TableCell sx={{ 
                          py: isCompactMode ? 0.5 : 1,
                          fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                        }}>
                          {new Date(trade.tradeDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asset Performance Table */}
      <Grid container spacing={isCompactMode ? 1 : 3}>
        <Grid item xs={12}>
          <Card sx={{ 
            boxShadow: 2,
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ p: isCompactMode ? 1.5 : 2 }}>
              <ResponsiveTypography 
                variant="chartTitle" 
                gutterBottom
                sx={{ 
                  mb: isCompactMode ? 1.5 : 2
                }}
              >
                {t('tradeAnalysis.assetPerformanceDetails')}
              </ResponsiveTypography>
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size={isCompactMode ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1,
                        maxWidth: { xs: '120px', sm: '150px', md: '200px' },
                        minWidth: '100px'
                      }}>
                        {t('tradeAnalysis.table.asset')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.quantity')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.avgCost')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.marketValue')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.pnl')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.table.trades')}
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        // fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        {t('tradeAnalysis.winRate')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetChartData && assetChartData.length > 0 ? (
                      assetChartData.map((asset) => (
                        <TableRow key={asset.assetId || asset.name} hover>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            maxWidth: { xs: '120px', sm: '150px', md: '200px' },
                            minWidth: '100px'
                          }}>
                            <Box>
                            <ResponsiveTypography 
                              variant="tableCell" 
                              fontWeight="bold"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {asset.name}
                            </ResponsiveTypography>
                            <ResponsiveTypography 
                              variant="formHelper" 
                              color="text.secondary"
                              sx={{
                                display: {'xs': 'none', 'sm': 'block'},
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {asset.fullName}
                            </ResponsiveTypography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            // fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <ResponsiveTypography variant="tableCell">
                              {formatNumber(asset.quantity, 2, locale)}
                            </ResponsiveTypography>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            // fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <ResponsiveTypography variant="tableCell">
                              {formatCurrency(asset.avgCost, currency, {}, locale)}
                            </ResponsiveTypography>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            // fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <ResponsiveTypography variant="tableCell">
                              {formatCurrency(asset.marketValue, currency, {}, locale)}
                            </ResponsiveTypography>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            // fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <ResponsiveTypography 
                              variant="tableCell" 
                              fontWeight="bold"
                              color={asset.value >= 0 ? 'success.main' : 'error.main'}
                            >
                              {asset.formattedValue}
                            </ResponsiveTypography>
                          </TableCell>
                          <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Box display="flex" alignItems="center" gap={isCompactMode ? 0.5 : 1}>
                              <ResponsiveTypography variant="tableCell">
                                {asset.trades}
                              </ResponsiveTypography>
                              <Chip
                                label={asset.winRate >= 50 ? t('tradeAnalysis.status.win') : t('tradeAnalysis.status.loss')}
                                size={isCompactMode ? "small" : "medium"}
                                color={asset.winRate >= 50 ? 'success' : 'error'}
                                variant="outlined"
                                sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            // fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <ResponsiveTypography 
                              variant="tableCell" 
                              fontWeight="bold"
                            >
                              {asset.formattedWinRate}
                            </ResponsiveTypography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: isCompactMode ? 2 : 4 }}>
                          <ResponsiveTypography 
                            variant="pageSubtitle" 
                            color="text.secondary"
                          >
                            {t('tradeAnalysis.noAssetData')}
                          </ResponsiveTypography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Wrapper component that uses the hook
export const TradeAnalysisContainer: React.FC<{ portfolioId: string; isCompactMode?: boolean }> = ({ portfolioId, isCompactMode = false }) => {
  const { t } = useTranslation();
  const [selectedTimeframe, setSelectedTimeframe] = useState('3M');
  const [selectedGranularity, setSelectedGranularity] = useState('weekly');

  // ✅ ĐÚNG - Sử dụng validation utils theo UTILS_GUIDE.md
  if (!isValidUUID(portfolioId)) {
    return (
      <Alert severity="error">
        Invalid portfolio ID format
      </Alert>
    );
  }

  // ✅ ĐÚNG - Lấy currency từ portfolio thay vì hard code
  const { portfolio, isLoading: isPortfolioLoading, error: portfolioError } = usePortfolio(portfolioId);
  
  // Always pass filters to ensure React Query detects changes
  const filters = {
    timeframe: selectedTimeframe,
    granularity: selectedGranularity,
  };
  
  const { data: analysis, isLoading, error } = useTradeAnalysis(portfolioId, filters);


  if (isPortfolioLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <ResponsiveTypography variant="pageSubtitle" sx={{ ml: 2 }}>{t('tradeAnalysis.loading')}</ResponsiveTypography>
      </Box>
    );
  }

  if (portfolioError) {
    return (
      <Alert severity="error">
        {(portfolioError as any)?.message || t('tradeAnalysis.error.portfolioLoadFailed')}
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {(error as any)?.message || t('tradeAnalysis.error.loadFailed')}
      </Alert>
    );
  }

  if (!portfolio) {
    return (
      <Alert severity="error">
        {t('tradeAnalysis.error.portfolioNotFound')}
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert severity="info">
        {t('tradeAnalysis.noData')}
      </Alert>
    );
  }

  // ✅ ĐÚNG - Truyền currency từ portfolio vào component
  return (
    <TradeAnalysis 
      analysis={analysis} 
      currency={portfolio.baseCurrency}
      selectedTimeframe={selectedTimeframe}
      selectedGranularity={selectedGranularity}
      onTimeframeChange={setSelectedTimeframe}
      onGranularityChange={setSelectedGranularity}
      isCompactMode={isCompactMode}
    />
  );
};

export default TradeAnalysis;
