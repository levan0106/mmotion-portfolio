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
  Timeline as TimelineIcon,
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
      pnl: parseFloat(month.totalPl?.toString() || '0'),
      trades: month.tradesCount || 0,
      winRate: month.winRate || 0,
      totalVolume: parseFloat(month.totalVolume?.toString() || '0'),
      winningTrades: month.winningTrades || 0,
      losingTrades: month.losingTrades || 0,
      // Format for display
      formattedPnl: formatCurrency(parseFloat(month.totalPl?.toString() || '0'), currency, {}, locale),
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
            minWidth: 200,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {entry.dataKey === 'pnl' ? 'P&L' : 
                 entry.dataKey === 'trades' ? 'Trades' :
                 entry.dataKey === 'winRate' ? 'Win Rate' :
                 entry.dataKey === 'value' ? 'Value' : entry.dataKey}:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color={entry.color}>
                {entry.dataKey === 'pnl' && data?.formattedPnl ? data.formattedPnl :
                 entry.dataKey === 'trades' ? entry.value :
                 entry.dataKey === 'winRate' && data?.formattedWinRate ? data.formattedWinRate :
                 entry.dataKey === 'value' && data?.formattedValue ? data.formattedValue :
                 entry.dataKey === 'pnl' ? formatCurrency(entry.value, currency, {}, locale) : entry.value}
              </Typography>
            </Box>
          ))}
          {/* Additional info for asset performance */}
          {data?.fullName && (
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #f0f0f0' }}>
              <Typography variant="caption" color="text.secondary">
                {data.fullName}
              </Typography>
            </Box>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total P&L
                  </Typography>
                  <Typography variant="h4" color={analysis.pnlSummary.totalPnl >= 0 ? 'success.main' : 'error.main'}>
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
                  <TrendingUpIcon />
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={`${formatPercentage(analysis.pnlSummary.winRate, 1, locale)} Win Rate`}
                  color={analysis.pnlSummary.winRate >= 50 ? 'success' : 'warning'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Trades Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Trades
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(analysis.statistics.totalTrades, 0, locale)}
                  </Typography>
                </Box>
                <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon />
                </Box>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={`${analysis.statistics.buyTrades} Buy`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${analysis.statistics.sellTrades} Sell`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Volume Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Volume
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(analysis.statistics.totalVolume, currency, {}, locale)}
                  </Typography>
                </Box>
                <Box sx={{ color: 'info.main', display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Avg: {formatCurrency(analysis.statistics.averagePrice, currency, {}, locale)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Metrics Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {analysis.riskMetrics.sharpeRatio}
                  </Typography>
                </Box>
                <Box sx={{ color: 'warning.main', display: 'flex', alignItems: 'center' }}>
                  <ShowChartIcon />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Risk-Adjusted Return
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* Monthly Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ boxShadow: 2, height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6">
                  Monthly Performance
                </Typography>
                <Chip
                  label="P&L Trend"
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e0e0e0' }}
                    tickFormatter={(value) => formatCurrency(value, currency, {}, locale)}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke="#1976d2"
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={payload?.color || '#1976d2'}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 6, stroke: '#1976d2', strokeWidth: 2 }}
                    name="P&L"
                  />
                </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Asset Performance Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ boxShadow: 2, height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header with Toggle Controls */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Asset Performance
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip
                    label="Pie Chart"
                    size="small"
                    color={chartView === 'pie' ? 'primary' : 'default'}
                    onClick={() => setChartView('pie')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Compact List"
                    size="small"
                    color={chartView === 'compact' ? 'primary' : 'default'}
                    onClick={() => setChartView('compact')}
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>
              </Box>
              
              {assetChartData && assetChartData.length > 0 && assetChartData.some(item => item.value > 0) ? (
                <Box sx={{ height: 350, display: 'flex', flexDirection: 'column' }}>

                  {chartView === 'pie' ? (
                    <Box sx={{ 
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '& .recharts-pie-label-text': {
                        fontSize: '10px !important',
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
                            outerRadius={90}
                            innerRadius={35}
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
                      p: 2
                    }}>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {assetChartData.map((entry, index) => {
                          const totalValue = assetChartData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
                          
                          return (
                            <Chip
                              key={index}
                              icon={
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: entry.color || COLORS[index % COLORS.length],
                                    border: '1px solid white',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                  }}
                                />
                              }
                              label={
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Typography variant="caption" fontWeight="bold">
                                    {entry.name}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    fontWeight="bold"
                                    color={entry.originalValue >= 0 ? 'success.main' : 'error.main'}
                                  >
                                    {entry.formattedValue}
                                  </Typography>
                                  <Typography variant="caption" color="primary" fontWeight="bold">
                                    ({formatPercentage(percentage, 1, locale)})
                                  </Typography>
                                </Box>
                              }
                              variant="outlined"
                              sx={{
                                height: 32,
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
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="text.secondary" gutterBottom>
                    No asset performance data available
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Debug: assetChartData length = {assetChartData?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Analysis has assetPerformance: {analysis?.assetPerformance ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Has positive values: {assetChartData?.some(item => item.value > 0) ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Values: {assetChartData?.map(item => `${item.name}: ${item.value}`).join(', ')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top and Worst Trades Tables */}
      <Grid container spacing={3} mb={4}>
        {/* Top Trades */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: 2, height: 500 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6">
                  Top Performing Trades
                </Typography>
                <Chip
                  label="Best"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              </Box>
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Side</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>P&L</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.topTrades.slice(0, 5).map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {trade.assetSymbol}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {trade.assetName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trade.side}
                            color={trade.side === 'BUY' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell color={trade.realizedPl >= 0 ? 'success.main' : 'error.main'}>
                          {formatCurrency(Number(trade.realizedPl) || 0, currency, {}, locale)}
                        </TableCell>
                        <TableCell>
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
          <Card sx={{ boxShadow: 2, height: 500 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6">
                  Worst Performing Trades
                </Typography>
                <Chip
                  label="Worst"
                  color="error"
                  size="small"
                  variant="outlined"
                />
              </Box>
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Asset</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Side</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>P&L</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.worstTrades.slice(0, 5).map((trade) => (
                      <TableRow key={trade.tradeId}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {trade.assetSymbol}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {trade.assetName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trade.side}
                            color={trade.side === 'BUY' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell color={trade.realizedPl >= 0 ? 'success.main' : 'error.main'}>
                          {formatCurrency(Number(trade.realizedPl) || 0, currency, {}, locale)}
                        </TableCell>
                        <TableCell>
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
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Asset Performance Details
              </Typography>
              <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Avg Cost</TableCell>
                      <TableCell>Market Value</TableCell>
                      <TableCell>P&L</TableCell>
                      <TableCell>Trades</TableCell>
                      <TableCell>Win Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assetChartData && assetChartData.length > 0 ? (
                      assetChartData.map((asset) => (
                        <TableRow key={asset.assetId || asset.name} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {asset.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {asset.fullName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatNumber(asset.quantity, 2, locale)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(asset.avgCost, currency, {}, locale)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(asset.marketValue, currency, {}, locale)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={asset.value >= 0 ? 'success.main' : 'error.main'}
                            >
                              {asset.formattedValue}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {asset.trades}
                              </Typography>
                              <Chip
                                label={asset.winRate >= 50 ? 'Win' : 'Loss'}
                                size="small"
                                color={asset.winRate >= 50 ? 'success' : 'error'}
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {asset.formattedWinRate}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
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