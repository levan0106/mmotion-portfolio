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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';
import { TradingPerformanceResponseDto } from '../../types/trading';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/format';

export interface TradePerformanceChartProps {
  performance: TradingPerformanceResponseDto;
  height?: number;
  currency?: string;
}

/**
 * TradePerformanceChart component for visualizing trading performance over time.
 * Supports multiple chart types and time periods.
 */
export const TradePerformanceChart: React.FC<TradePerformanceChartProps> = ({
  performance,
  height = 400,
  currency = 'VND',
}) => {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed'>('line');
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!performance.monthlyPerformance) return [];

    return performance.monthlyPerformance.map((month: { month: string; year: number; pnl: number; trades: number; winRate: number }) => ({
      month: month.month,
      year: month.year,
      pnl: month.pnl,
      trades: month.trades,
      winRate: month.winRate,
      cumulativePnl: performance.monthlyPerformance
        .slice(0, performance.monthlyPerformance.indexOf(month) + 1)
        .reduce((sum: number, m: { pnl: number }) => sum + m.pnl, 0),
    }));
  }, [performance.monthlyPerformance]);

  // Create formatter functions for charts
  const formatCurrencyForChart = (value: number) => formatCurrency(value, currency);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            boxShadow: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {entry.name.includes('Rate') ? formatPercentage(entry.value) : 
                           entry.name.includes('P&L') ? formatCurrency(entry.value, currency) :
                           formatNumber(entry.value)}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" tickFormatter={formatCurrencyForChart} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={formatPercentage} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="pnl" 
          stroke="#8884d8" 
          strokeWidth={2}
          name="Monthly P&L"
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="winRate" 
          stroke="#82ca9d" 
          strokeWidth={2}
          name="Win Rate"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tickFormatter={formatCurrencyForChart} />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="pnl" 
          stroke="#8884d8" 
          fill="#8884d8"
          fillOpacity={0.3}
          name="Monthly P&L"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" tickFormatter={formatCurrencyForChart} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          yAxisId="left"
          dataKey="pnl" 
          fill="#8884d8"
          name="Monthly P&L"
        />
        <Bar 
          yAxisId="right"
          dataKey="trades" 
          fill="#82ca9d"
          name="Trades Count"
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderComposedChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" tickFormatter={formatCurrencyForChart} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={formatNumber} />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          yAxisId="right"
          dataKey="trades" 
          fill="#82ca9d"
          name="Trades Count"
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="cumulativePnl" 
          stroke="#ff7300" 
          strokeWidth={3}
          name="Cumulative P&L"
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="pnl" 
          stroke="#8884d8" 
          strokeWidth={2}
          name="Monthly P&L"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'bar':
        return renderBarChart();
      case 'composed':
        return renderComposedChart();
      default:
        return renderLineChart();
    }
  };

  const getChartTitle = () => {
    const typeMap = {
      line: 'Line Chart',
      area: 'Area Chart',
      bar: 'Bar Chart',
      composed: 'Composed Chart',
    };
    return `Trading Performance - ${typeMap[chartType]}`;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="h3">
            {getChartTitle()}
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={timeframe}
                label="Timeframe"
                onChange={(e) => setTimeframe(e.target.value as any)}
              >
                <MenuItem value="1M">1 Month</MenuItem>
                <MenuItem value="3M">3 Months</MenuItem>
                <MenuItem value="6M">6 Months</MenuItem>
                <MenuItem value="1Y">1 Year</MenuItem>
                <MenuItem value="ALL">All Time</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(_, value) => value && setChartType(value)}
              size="small"
            >
              <ToggleButton value="line">Line</ToggleButton>
              <ToggleButton value="area">Area</ToggleButton>
              <ToggleButton value="bar">Bar</ToggleButton>
              <ToggleButton value="composed">Composed</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {chartData.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={height}
            color="text.secondary"
          >
            <Typography>No performance data available</Typography>
          </Box>
        ) : (
          renderChart()
        )}

        {/* Performance Summary */}
        <Box mt={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {formatNumber(performance.totalTrades)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Trades
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography 
                  variant="h4" 
                  color={performance.totalPnl >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(performance.totalPnl, currency)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total P&L
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {formatPercentage(performance.winRate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Win Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(performance.averagePnl, currency)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average P&L
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Best and Worst Trades */}
        {(performance.bestTrade || performance.worstTrade) && (
          <Box mt={3}>
            <Grid container spacing={2}>
              {performance.bestTrade && (
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'success.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'success.200',
                    }}
                  >
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Best Trade
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {performance.bestTrade.assetSymbol}
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(performance.bestTrade.realizedPl, currency)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatPercentage(performance.bestTrade.realizedPlPercentage)}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {performance.worstTrade && (
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'error.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'error.200',
                    }}
                  >
                    <Typography variant="subtitle2" color="error.main" gutterBottom>
                      Worst Trade
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {performance.worstTrade.assetSymbol}
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(performance.worstTrade.realizedPl, currency)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatPercentage(performance.worstTrade.realizedPlPercentage)}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TradePerformanceChart;
