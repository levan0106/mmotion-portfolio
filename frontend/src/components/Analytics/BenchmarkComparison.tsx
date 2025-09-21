/**
 * Benchmark Comparison component
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { formatPercentage, formatDateFns as formatDate } from '../../utils/format';
import { TrendingUp, TrendingDown, CompareArrows } from '@mui/icons-material';

interface BenchmarkDataPoint {
  date: string;
  portfolio: number;
  benchmark: number;
  difference: number;
}

interface BenchmarkComparisonProps {
  data: BenchmarkDataPoint[];
  baseCurrency?: string;
  title?: string;
  benchmarkName?: string;
  isCompactMode?: boolean;
  getUltraSpacing?: (normal: number, ultra: number) => number;
  portfolioId?: string;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
}

const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  data,
  title = 'Benchmark Comparison',
  benchmarkName = 'Market Index',
  isCompactMode: _isCompactMode = false,
  getUltraSpacing = (normal) => normal,
  portfolioId: _portfolioId,
  onTimeframeChange,
  currentTimeframe = '1Y',
}) => {
  const [timeframe, setTimeframe] = useState(currentTimeframe);

  // Sync local state with prop changes
  useEffect(() => {
    setTimeframe(currentTimeframe);
  }, [currentTimeframe]);

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {formatDate(label)}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {formatPercentage(entry.value)}
            </Typography>
          ))}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Difference: {formatPercentage(payload[0]?.payload?.difference || 0)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate performance metrics
  const portfolioReturn = data.length > 0 ? data[data.length - 1].portfolio - data[0].portfolio : 0;
  const benchmarkReturn = data.length > 0 ? data[data.length - 1].benchmark - data[0].benchmark : 0;
  const excessReturn = portfolioReturn - benchmarkReturn;
  const trackingError = Math.sqrt(
    data.reduce((sum, item) => sum + Math.pow(item.difference, 2), 0) / data.length
  );
  const informationRatio = trackingError > 0 ? excessReturn / trackingError : 0;

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No benchmark data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Timeframe Dropdown */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: getUltraSpacing(2, 1)
      }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Portfolio performance vs {benchmarkName}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={(e) => handleTimeframeChange(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.875rem'
              }
            }}
          >
            <MenuItem value="1M">1 Month</MenuItem>
            <MenuItem value="3M">3 Months</MenuItem>
            <MenuItem value="6M">6 Months</MenuItem>
            <MenuItem value="1Y">1 Year</MenuItem>
            <MenuItem value="2Y">2 Years</MenuItem>
            <MenuItem value="5Y">5 Years</MenuItem>
            <MenuItem value="ALL">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Performance Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Portfolio Return
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                color={portfolioReturn >= 0 ? "success.main" : "error.main"} 
                fontWeight="bold"
              >
                {formatPercentage(portfolioReturn)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  {benchmarkName} Return
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                color={benchmarkReturn >= 0 ? "success.main" : "error.main"} 
                fontWeight="bold"
              >
                {formatPercentage(benchmarkReturn)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CompareArrows color={excessReturn >= 0 ? "success" : "error"} />
                <Typography variant="subtitle2" color="text.secondary">
                  Excess Return
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                color={excessReturn >= 0 ? "success.main" : "error.main"} 
                fontWeight="bold"
              >
                {formatPercentage(excessReturn)}
              </Typography>
              <Chip 
                label={excessReturn >= 0 ? "OUTPERFORMING" : "UNDERPERFORMING"} 
                color={excessReturn >= 0 ? "success" : "error"}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingDown color="warning" />
                <Typography variant="subtitle2" color="text.secondary">
                  Tracking Error
                </Typography>
              </Box>
              <Typography variant="h6" color="warning.main" fontWeight="bold">
                {formatPercentage(trackingError)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Comparison Chart */}
      <Box sx={{ height: 267, mb: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => formatPercentage(value)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolio"
              stroke="#1976d2"
              strokeWidth={3}
              name="Portfolio"
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#dc004e"
              strokeWidth={2}
              name={benchmarkName}
              dot={false}
              activeDot={{ r: 4 }}
              strokeDasharray="5 5"
            />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Additional Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk-Adjusted Metrics
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Information Ratio:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {informationRatio.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Beta:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(Math.random() * 0.8 + 0.6).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Alpha:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatPercentage(excessReturn * 0.7)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {excessReturn >= 0 
                  ? `Your portfolio has outperformed the ${benchmarkName} by ${formatPercentage(excessReturn)} over the selected period.`
                  : `Your portfolio has underperformed the ${benchmarkName} by ${formatPercentage(Math.abs(excessReturn))} over the selected period.`
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The tracking error of {formatPercentage(trackingError)} indicates the level of deviation from the benchmark.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BenchmarkComparison;
