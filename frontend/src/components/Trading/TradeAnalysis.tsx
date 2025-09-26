import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
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
  selectedMetric?: string;
  onTimeframeChange?: (timeframe: string) => void;
  onMetricChange?: (metric: string) => void;
  isCompactMode?: boolean;
}

/**
 * TradeAnalysis component for displaying comprehensive trading performance analysis.
 * Shows statistics, charts, and performance metrics.
 */
export const TradeAnalysis: React.FC<TradeAnalysisProps> = ({
  analysis,
  currency = 'USD', // Default fallback
  isLoading = false,
  error,
  selectedTimeframe = 'ALL',
  selectedMetric = 'pnl',
  onTimeframeChange,
  onMetricChange,
  isCompactMode = false,
}) => {
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

  // ✅ ĐÚNG - Sử dụng formatting utils từ UTILS_GUIDE.md
  // formatCurrency, formatPercentage, formatNumber đã được import từ utils/format

  // ✅ ĐÚNG - Xác định locale dựa trên currency
  const getLocale = (currency: string): string => {
    switch (currency) {
      case 'VND':
        return 'vi-VN';
      case 'USD':
        return 'en-US';
      case 'EUR':
        return 'de-DE';
      case 'GBP':
        return 'en-GB';
      case 'JPY':
        return 'ja-JP';
      default:
        return 'en-US';
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
      month: month.month,
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
    console.log('🔍 Asset Performance Debug:', {
      hasAnalysis: !!analysis,
      hasAssetPerformance: !!analysis?.assetPerformance,
      isArray: Array.isArray(analysis?.assetPerformance),
      assetPerformance: analysis?.assetPerformance,
      length: analysis?.assetPerformance?.length
    });
    
    if (!analysis.assetPerformance || !Array.isArray(analysis.assetPerformance)) {
      console.log('Asset performance not available or not an array');
      return [];
    }
    
    const data = analysis.assetPerformance.map((asset, index) => {
      const originalValue = parseFloat(asset.totalPl?.toString() || '0');
      // Use absolute value for pie chart visualization, but keep original for display
      const chartValue = Math.abs(originalValue);
      
      return {
        assetId: asset.assetId || `asset-${index}`,
        name: asset.assetSymbol || 'Unknown',
        fullName: asset.assetName || 'Unknown Asset',
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
    
    console.log('🔍 Asset Chart Data Processed:', {
      originalLength: data.length,
      sortedLength: sortedData.length,
      sampleData: sortedData.slice(0, 3),
      allValues: sortedData.map(item => item.value),
      originalValues: sortedData.map(item => item.originalValue),
      hasPositiveValues: sortedData.some(item => item.value > 0),
      colors: sortedData.map(item => item.color)
    });
    
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
            boxShadow: 3,
            minWidth: 280,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
            {label}
          </Typography>
          
          {/* Monthly Performance Chart Tooltip */}
          {data?.month && (
            <>
              {/* P&L Summary */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  P&L Summary
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Total P&L:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color={data.pnl >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(data.pnl || 0, currency, {}, locale)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Realized P&L:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color={data.realizedPnl >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(data.realizedPnl || 0, currency, {}, locale)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Unrealized P&L:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color={data.unrealizedPnl >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(data.unrealizedPnl || 0, currency, {}, locale)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Trading Statistics */}
              <Box sx={{ mb: 1.5, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Trading Statistics
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Trades:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {data.trades || 0}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Win Rate:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatPercentage(data.winRate || 0, 1, locale)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Volume:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(data.totalVolume || 0, currency, {}, locale)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

            </>
          )}

          {/* Asset Performance Chart Tooltip */}
          {data?.name && !data?.month && (
            <>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Asset Performance
                </Typography>
                <Box sx={{ pl: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Symbol:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {data.name}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      P&L:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color={data.originalValue >= 0 ? 'success.main' : 'error.main'}>
                      {formatCurrency(data.originalValue || 0, currency, {}, locale)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Percentage:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium" color={data.percentage >= 0 ? 'success.main' : 'error.main'}>
                      {formatPercentage(data.percentage || 0, 2, locale)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Additional info for asset performance */}
              {data?.fullName && (
                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #f0f0f0' }}>
                  <Typography variant="caption" color="text.secondary">
                    {data.fullName}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      );
    }
    return null;
  };

  // Custom label function for pie chart
  const renderCustomLabel = ({ name, percent, payload }: any) => {
    // Show labels for all slices, but with different styling based on size
    const percentage = formatPercentageWithSeparators(percent * 100, 1, locale);
    const value = payload?.formattedValue || formatCurrency(payload?.value || 0, currency, {}, locale);
    
    
    // For very small slices, show only name and value
    if (percent < 0.02) {
      return `${name}\n${value}`;
    }
    
    // For small slices, show name, percentage and value
    if (percent < 0.05) {
      return `${name}\n${percentage}\n${value}`;
    }
    
    // For larger slices, show full info
    return `${name}\n${percentage}\n${value}`;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading analysis...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {(error as any)?.message || 'Failed to load trade analysis'}
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert severity="info">
        No trade data available for analysis
      </Alert>
    );
  }

  // ✅ ĐÚNG - Validation data trước khi render theo UTILS_GUIDE.md
  if (!isValidAnalysis) {
    return (
      <Alert severity="error">
        Invalid analysis data format
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={isCompactMode ? 2 : 4}>
        <Box>
          <Typography variant={isCompactMode ? "h5" : "h4"} component="h1" gutterBottom sx={{ fontSize: isCompactMode ? '0.9rem' : undefined }}>
            Trading Analysis
          </Typography>
          <Typography variant={isCompactMode ? "body2" : "body1"} color="text.secondary" sx={{ fontSize: isCompactMode ? '0.75rem' : undefined }}>
            Comprehensive performance insights and analytics
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={selectedTimeframe}
              label="Timeframe"
              onChange={(e) => onTimeframeChange?.(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="ALL">All Time</MenuItem>
              <MenuItem value="1M">1 Month</MenuItem>
              <MenuItem value="3M">3 Months</MenuItem>
              <MenuItem value="6M">6 Months</MenuItem>
              <MenuItem value="1Y">1 Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              label="Metric"
              onChange={(e) => onMetricChange?.(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="pnl">P&L</MenuItem>
              <MenuItem value="trades">Trades</MenuItem>
              <MenuItem value="winrate">Win Rate</MenuItem>
            </Select>
          </FormControl>
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
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: isCompactMode ? '0.7rem' : '0.8rem' }}
                  >
                    Total P&L
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color={analysis.pnlSummary.totalPnl >= 0 ? 'success.main' : 'error.main'} 
                    fontWeight="bold"
                    sx={{ fontSize: isCompactMode ? '1.1rem' : '1.5rem' }}
                  >
                    {formatCurrency(analysis.pnlSummary.totalPnl, currency, {}, locale)}
                  </Typography>
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
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Realized P&L:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={(analysis.pnlSummary as any).totalRealizedPnl >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {formatCurrency((analysis.pnlSummary as any).totalRealizedPnl, currency, {}, locale)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Unrealized P&L:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color={(analysis.pnlSummary as any).totalUnrealizedPnl >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {formatCurrency((analysis.pnlSummary as any).totalUnrealizedPnl, currency, {}, locale)}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* Win Rate */}
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`${formatPercentage(analysis.pnlSummary.winRate, 1, locale)} Win Rate`}
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
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: isCompactMode ? '0.7rem' : '0.8rem' }}
                  >
                    Trading Statistics
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color="primary" 
                    fontWeight="bold"
                    sx={{ fontSize: isCompactMode ? '1.1rem' : '1.5rem' }}
                  >
                    {formatNumber(analysis.statistics.totalTrades, 0, locale)} Trades
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`Avg: ${formatCurrency(analysis.statistics.averagePrice, currency, {}, locale)}`}
                    color="info"
                    size={isCompactMode ? "small" : "medium"}
                    variant="outlined"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  />
                  <AssessmentIcon sx={{ color: 'primary.main', fontSize: isCompactMode ? 18 : 24 }} />
                </Box>
              </Box>
              
              {/* Trades Breakdown */}
              {!isCompactMode && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Buy Trades:
                    </Typography>
                    <Typography variant="body2" color="success.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                      {analysis.statistics.buyTrades}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Sell Trades:
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                      {analysis.statistics.sellTrades}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Total Volume:
                    </Typography>
                    <Typography variant="body2" color="info.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                      {formatCurrency(analysis.statistics.totalVolume, currency, {}, locale)}
                    </Typography>
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
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: isCompactMode ? '0.7rem' : '0.8rem' }}
                  >
                    Risk Metrics
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color="warning.main" 
                    fontWeight="bold"
                    sx={{ fontSize: isCompactMode ? '1.1rem' : '1.5rem' }}
                  >
                    {analysis.riskMetrics.volatility?.toFixed(2) || 'N/A'}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`Risk Level: ${analysis.riskMetrics.volatility > 20 ? 'High' : analysis.riskMetrics.volatility > 10 ? 'Medium' : 'Low'}`}
                    color={analysis.riskMetrics.volatility > 20 ? 'error' : analysis.riskMetrics.volatility > 10 ? 'warning' : 'success'}
                    size={isCompactMode ? "small" : "medium"}
                    variant="outlined"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  />
                  <ShowChartIcon sx={{ color: 'warning.main', fontSize: isCompactMode ? 18 : 24 }} />
                </Box>
              </Box>
              
              {/* Risk Breakdown */}
              {!isCompactMode && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Max Drawdown:
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                      {formatCurrency(analysis.riskMetrics.maxDrawdown || 0, currency, {}, locale)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      VaR 95%:
                    </Typography>
                    <Typography variant="body2" color="warning.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                      {formatCurrency(analysis.riskMetrics.var95 || 0, currency, {}, locale)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Sharpe Ratio:
                    </Typography>
                    <Typography variant="body2" color="primary.main" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                      {analysis.riskMetrics.sharpeRatio?.toFixed(2) || 'N/A'}
                    </Typography>
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
                <Typography 
                  variant="h6"
                  sx={{ fontSize: isCompactMode ? '0.9rem' : '1.25rem' }}
                >
                  Monthly Performance
                </Typography>
                <Box display="flex" gap={isCompactMode ? 0.5 : 1}>
                  <Chip
                    label="Total P&L"
                    size={isCompactMode ? "small" : "medium"}
                    color={pnlLines.total ? 'primary' : 'default'}
                    onClick={() => setPnlLines(prev => ({ ...prev, total: !prev.total }))}
                    sx={{ 
                      cursor: 'pointer',
                      fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                  <Chip
                    label="Realized P&L"
                    size={isCompactMode ? "small" : "medium"}
                    color={pnlLines.realized ? 'success' : 'default'}
                    onClick={() => setPnlLines(prev => ({ ...prev, realized: !prev.realized }))}
                    sx={{ 
                      cursor: 'pointer',
                      fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                  <Chip
                    label="Unrealized P&L"
                    size={isCompactMode ? "small" : "medium"}
                    color={pnlLines.unrealized ? 'warning' : 'default'}
                    onClick={() => setPnlLines(prev => ({ ...prev, unrealized: !prev.unrealized }))}
                    sx={{ 
                      cursor: 'pointer',
                      fontSize: isCompactMode ? '0.65rem' : '0.75rem'
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
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: isCompactMode ? '0.75rem' : '0.875rem'
                    }}
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
                      name="Total P&L"
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
                      name="Realized P&L"
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
                      name="Unrealized P&L"
                    />
                  )}
                </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Asset Performance Pie Chart */}
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
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    color: 'text.primary',
                    fontSize: isCompactMode ? '0.9rem' : '1.25rem'
                  }}
                >
                  Asset Performance
                </Typography>
                <Box display="flex" gap={isCompactMode ? 0.5 : 1}>
                  <Chip
                    label="Pie Chart"
                    size={isCompactMode ? "small" : "medium"}
                    color={chartView === 'pie' ? 'primary' : 'default'}
                    onClick={() => setChartView('pie')}
                    sx={{ 
                      cursor: 'pointer',
                      fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                    }}
                  />
                  <Chip
                    label="Compact List"
                    size={isCompactMode ? "small" : "medium"}
                    color={chartView === 'compact' ? 'primary' : 'default'}
                    onClick={() => setChartView('compact')}
                    sx={{ 
                      cursor: 'pointer',
                      fontSize: isCompactMode ? '0.65rem' : '0.75rem'
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
                            label={renderCustomLabel}
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
                              backgroundColor: 'white',
                              border: '1px solid #e0e0e0',
                              borderRadius: 8,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
                                  <Typography 
                                    variant="caption" 
                                    fontWeight="bold"
                                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                                  >
                                    {entry.name}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    fontWeight="bold"
                                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                                    color={entry.originalValue >= 0 ? 'success.main' : 'error.main'}
                                  >
                                    {entry.formattedValue}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="primary" 
                                    fontWeight="bold"
                                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                                  >
                                    ({formatPercentage(percentage, 1, locale)})
                                  </Typography>
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
                  <Typography 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: isCompactMode ? '0.75rem' : '0.875rem' }}
                  >
                    No asset performance data available
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  >
                    Debug: assetChartData length = {assetChartData?.length || 0}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  >
                    Analysis has assetPerformance: {analysis?.assetPerformance ? 'Yes' : 'No'}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  >
                    Has positive values: {assetChartData?.some(item => item.value > 0) ? 'Yes' : 'No'}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                  >
                    Values: {assetChartData?.map(item => `${item.name}: ${item.value}`).join(', ')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top and Worst Trades Tables */}
      <Grid container spacing={isCompactMode ? 1 : 3} mb={isCompactMode ? 2 : 4}>
        {/* Top Trades */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            boxShadow: 2, 
            height: isCompactMode ? 300 : 500,
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
                <Typography 
                  variant="h6"
                  sx={{ fontSize: isCompactMode ? '0.9rem' : '1.25rem' }}
                >
                  Top Performing Trades
                </Typography>
                <Chip
                  label="Best"
                  color="success"
                  size={isCompactMode ? "small" : "medium"}
                  variant="outlined"
                  sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                />
              </Box>
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size={isCompactMode ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Asset
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Side
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        P&L
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Date
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.topTrades.slice(0, 5).map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              sx={{ fontSize: isCompactMode ? '0.7rem' : '0.875rem' }}
                            >
                              {trade.assetSymbol}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                            >
                              {trade.assetName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                          <Chip
                            label={trade.side}
                            color={trade.side === 'BUY' ? 'success' : 'error'}
                            size={isCompactMode ? "small" : "medium"}
                            sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                          />
                        </TableCell>
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

        {/* Worst Trades */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            boxShadow: 2, 
            height: isCompactMode ? 300 : 500,
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
                <Typography 
                  variant="h6"
                  sx={{ fontSize: isCompactMode ? '0.9rem' : '1.25rem' }}
                >
                  Worst Performing Trades
                </Typography>
                <Chip
                  label="Worst"
                  color="error"
                  size={isCompactMode ? "small" : "medium"}
                  variant="outlined"
                  sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                />
              </Box>
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size={isCompactMode ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Asset
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Side
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        P&L
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Date
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.worstTrades.slice(0, 5).map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                          <Box>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              sx={{ fontSize: isCompactMode ? '0.7rem' : '0.875rem' }}
                            >
                              {trade.assetSymbol}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                            >
                              {trade.assetName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                          <Chip
                            label={trade.side}
                            color={trade.side === 'BUY' ? 'success' : 'error'}
                            size={isCompactMode ? "small" : "medium"}
                            sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                          />
                        </TableCell>
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
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: isCompactMode ? '0.9rem' : '1.25rem',
                  mb: isCompactMode ? 1.5 : 2
                }}
              >
                Asset Performance Details
              </Typography>
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size={isCompactMode ? "small" : "medium"} stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Asset
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Quantity
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Avg Cost
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Market Value
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        P&L
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Trades
                      </TableCell>
                      <TableCell sx={{ 
                        fontWeight: 600,
                        fontSize: isCompactMode ? '0.7rem' : '0.875rem',
                        py: isCompactMode ? 0.5 : 1
                      }}>
                        Win Rate
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetChartData && assetChartData.length > 0 ? (
                      assetChartData.map((asset) => (
                        <TableRow key={asset.assetId || asset.name} hover>
                          <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Box>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                sx={{ fontSize: isCompactMode ? '0.7rem' : '0.875rem' }}
                              >
                                {asset.name}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                              >
                                {asset.fullName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <Typography variant="body2">
                              {formatNumber(asset.quantity, 2, locale)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <Typography variant="body2">
                              {formatCurrency(asset.avgCost, currency, {}, locale)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <Typography variant="body2">
                              {formatCurrency(asset.marketValue, currency, {}, locale)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={asset.value >= 0 ? 'success.main' : 'error.main'}
                              sx={{ fontSize: isCompactMode ? '0.7rem' : '0.875rem' }}
                            >
                              {asset.formattedValue}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Box display="flex" alignItems="center" gap={isCompactMode ? 0.5 : 1}>
                              <Typography 
                                variant="body2"
                                sx={{ fontSize: isCompactMode ? '0.7rem' : '0.875rem' }}
                              >
                                {asset.trades}
                              </Typography>
                              <Chip
                                label={asset.winRate >= 50 ? 'Win' : 'Loss'}
                                size={isCompactMode ? "small" : "medium"}
                                color={asset.winRate >= 50 ? 'success' : 'error'}
                                variant="outlined"
                                sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            py: isCompactMode ? 0.5 : 1,
                            fontSize: isCompactMode ? '0.7rem' : '0.875rem'
                          }}>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              sx={{ fontSize: isCompactMode ? '0.7rem' : '0.875rem' }}
                            >
                              {asset.formattedWinRate}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: isCompactMode ? 2 : 4 }}>
                          <Typography 
                            color="text.secondary"
                            sx={{ fontSize: isCompactMode ? '0.75rem' : '0.875rem' }}
                          >
                            No asset performance data available
                          </Typography>
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
  const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');
  const [selectedMetric, setSelectedMetric] = useState('pnl');

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
    metric: selectedMetric,
  };
  
  const { data: analysis, isLoading, error } = useTradeAnalysis(portfolioId, filters);

  // Debug: Log filter values and analysis data
  console.log('🔍 TradeAnalysisContainer - Filters:', {
    selectedTimeframe,
    selectedMetric,
    portfolioId
  });
  
  console.log('🔍 TradeAnalysisContainer - Analysis Data:', {
    hasAnalysis: !!analysis,
    analysisKeys: analysis ? Object.keys(analysis) : [],
    assetPerformance: analysis?.assetPerformance,
    monthlyPerformance: analysis?.monthlyPerformance,
    pnlSummary: analysis?.pnlSummary,
    statistics: analysis?.statistics,
    riskMetrics: analysis?.riskMetrics
  });

  if (isPortfolioLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading analysis...</Typography>
      </Box>
    );
  }

  if (portfolioError) {
    return (
      <Alert severity="error">
        {(portfolioError as any)?.message || 'Failed to load portfolio information'}
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {(error as any)?.message || 'Failed to load trade analysis'}
      </Alert>
    );
  }

  if (!portfolio) {
    return (
      <Alert severity="error">
        Portfolio not found
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert severity="info">
        No trade data available for analysis
      </Alert>
    );
  }

  // ✅ ĐÚNG - Truyền currency từ portfolio vào component
  return (
    <TradeAnalysis 
      analysis={analysis} 
      currency={portfolio.baseCurrency}
      selectedTimeframe={selectedTimeframe}
      selectedMetric={selectedMetric}
      onTimeframeChange={setSelectedTimeframe}
      onMetricChange={setSelectedMetric}
      isCompactMode={isCompactMode}
    />
  );
};

export default TradeAnalysis;