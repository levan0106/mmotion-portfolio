import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  InfoOutlined,
  AccountBalance
} from '@mui/icons-material';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Legend,
  Bar
} from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface NAVHistoryData {
  date: string;
  navValue: number;
  totalValue: number;
  cashBalance: number;
  assetValue: number;
  totalReturn: number;
  portfolioPnL: number;
  portfolioDailyReturn: number;
  portfolioWeeklyReturn: number;
  portfolioMonthlyReturn: number;
  portfolioYtdReturn: number;
}

interface NAVHistoryResponse {
  portfolioId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  granularity: string;
  data: NAVHistoryData[];
  totalRecords: number;
  retrievedAt: string;
}

interface NAVHistoryChartProps {
  portfolioId: string;
  baseCurrency: string;
}

const NAVHistoryChart: React.FC<NAVHistoryChartProps> = ({
  portfolioId,
  baseCurrency
}) => {
  const [data, setData] = useState<NAVHistoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('12');
  const [granularity, setGranularity] = useState('DAILY');
  const [showReturn, setShowReturn] = useState(false);

  const timeframeOptions = [
    { value: '3', label: '3M' },
    { value: '6', label: '6M' },
    { value: '12', label: '12M' },
    { value: '24', label: '24M' },
    { value: '36', label: '36M' }
  ];

  const granularityOptions = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' }
  ];

  const fetchNAVHistory = async () => {
    if (!portfolioId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/portfolios/${portfolioId}/nav/history?months=${timeframe}&granularity=${granularity}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: NAVHistoryResponse = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error('Error fetching NAV history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load NAV history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNAVHistory();
  }, [portfolioId, timeframe, granularity]);

  const handleTimeframeChange = (event: any) => {
    setTimeframe(event.target.value);
  };

  const handleGranularityChange = (event: any) => {
    setGranularity(event.target.value);
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    if (granularity === 'DAILY') {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    } else if (granularity === 'WEEKLY') {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
    }
  };

  // Calculate summary metrics first
  const currentNAV = data.length > 0 ? data[data.length - 1]?.navValue : 0;
  const firstNAV = data.length > 0 ? data[0]?.navValue : 0;

  // Calculate Y-axis domains with balanced range
  const navValues = data.map(d => d.navValue);
  const pnlValues = data.map(d => d.portfolioPnL);
  
  const navMin = data.length > 0 ? Math.min(...navValues) : 0;
  const navMax = data.length > 0 ? Math.max(...navValues) : 0;
  const navRange = navMax - navMin;
  const navDomainMin = navMin - navRange / 2;
  const navDomainMax = navMax + navRange / 2;
  
  const pnlMin = data.length > 0 ? Math.min(...pnlValues) : 0;
  const pnlMax = data.length > 0 ? Math.max(...pnlValues) : 0;
  const pnlRange = pnlMax - pnlMin;
  const pnlDomainMin = pnlMin - pnlRange / 2;
  const pnlDomainMax = pnlMax + pnlRange / 2;

  // Calculate cumulative return for each data point
  const processedData = data.map((point) => {
    const cumulativeReturn = firstNAV > 0 ? ((point.navValue - firstNAV) / firstNAV) * 100 : 0;
    return {
      ...point,
      cumulativeReturn
    };
  });

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const totalReturn = firstNAV > 0 ? ((currentNAV - firstNAV) / firstNAV) * 100 : 0;
  const isPositive = totalReturn >= 0;

  // Calculate peak and current drawdown
  let peak = firstNAV;
  let maxDrawdown = 0;
  data.forEach(point => {
    if (point.navValue > peak) {
      peak = point.navValue;
    }
    const drawdown = ((point.navValue - peak) / peak) * 100;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalance color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              NAV History
            </Typography>
            <Tooltip title="Net Asset Value history showing portfolio growth over time">
              <IconButton size="small">
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={showReturn ? "Return %" : "NAV Value"}
              onClick={() => setShowReturn(!showReturn)}
              color={showReturn ? "secondary" : "primary"}
              variant={showReturn ? "filled" : "outlined"}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={timeframe}
                onChange={handleTimeframeChange}
                displayEmpty
              >
                {timeframeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select
                value={granularity}
                onChange={handleGranularityChange}
                displayEmpty
              >
                {granularityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center', width: '100%' }}>
                <Typography variant="body1" color="primary" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                  {formatCurrency(currentNAV, baseCurrency)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Current NAV
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                  {isPositive && <TrendingUp color="success" sx={{ fontSize: 16 }} />}
                  {!isPositive && <TrendingDown color="error" sx={{ fontSize: 16 }} />}
                  <Typography
                    variant="body1"
                    color={isPositive ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {formatPercentage(totalReturn)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Total Return
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center', width: '100%' }}>
                <Typography variant="body1" color="warning.main" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                  {formatPercentage(maxDrawdown)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Max Drawdown
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center', width: '100%' }}>
                <Typography variant="body1" color="info.main" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                  {data.length}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Data Points
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Chart */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2" textAlign="center" p={2}>
            {error}
          </Typography>
        ) : data.length === 0 ? (
          <Typography color="text.secondary" variant="body2" textAlign="center" p={2}>
            No NAV history data available
          </Typography>
        ) : (
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisLabel}
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="nav"
                  tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                  stroke="#1976d2"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[navDomainMin, navDomainMax]}
                />
                <YAxis
                  yAxisId="pnl"
                  orientation="right"
                  tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                  stroke="#ff9800"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[pnlDomainMin, pnlDomainMax]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => {
                    if (value === 'navValue') return 'NAV Value';
                    if (value === 'portfolioPnL') return 'Portfolio P&L';
                    return value;
                  }}
                />
                <RechartsTooltip
                  formatter={(value, name) => {
                    if (name === 'navValue') {
                      return [formatCurrency(value as number, baseCurrency), 'NAV Value'];
                    } else if (name === 'portfolioPnL') {
                      return [formatCurrency(value as number, baseCurrency), 'Portfolio P&L'];
                    } else if (name === 'cumulativeReturn') {
                      return [formatPercentage(value as number), 'Cumulative Return'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={formatTooltipLabel}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                
                {/* NAV Value Line */}
                <Line
                  yAxisId="nav"
                  type="monotone"
                  dataKey="navValue"
                  stroke="#1976d2"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#1976d2' }}
                  connectNulls={false}
                />
                
                {/* Portfolio P&L Bar */}
                <Bar
                  yAxisId="pnl"
                  dataKey="portfolioPnL"
                  fill="#ff9800"
                  fillOpacity={0.6}
                  radius={[2, 2, 0, 0]}
                />
                
                {firstNAV > 0 && (
                  <ReferenceLine
                    yAxisId="nav"
                    y={firstNAV}
                    stroke="#666"
                    strokeDasharray="2 2"
                    strokeOpacity={0.5}
                  />
                )}
                
                {/* Zero line for P&L */}
                <ReferenceLine
                  yAxisId="pnl"
                  y={0}
                  stroke="#666"
                  strokeDasharray="2 2"
                  strokeOpacity={0.3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NAVHistoryChart;
