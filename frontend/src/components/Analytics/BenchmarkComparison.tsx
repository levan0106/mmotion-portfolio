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
  Tooltip as RechartsTooltip,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton
} from '@mui/material';
import { formatPercentage, formatDateFns as formatDate } from '../../utils/format';
import { TrendingUp, TrendingDown, CompareArrows, InfoOutlined } from '@mui/icons-material';

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
  onTwrPeriodChange?: (twrPeriod: string) => void;
  currentTwrPeriod?: string;
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
  onTwrPeriodChange,
  currentTwrPeriod = 'YTD',
}) => {
  const [timeframe, setTimeframe] = useState(currentTimeframe);
  const [twrPeriod, setTwrPeriod] = useState(currentTwrPeriod);

  // Sync local state with prop changes
  useEffect(() => {
    setTimeframe(currentTimeframe);
  }, [currentTimeframe]);

  useEffect(() => {
    setTwrPeriod(currentTwrPeriod);
  }, [currentTwrPeriod]);

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  const handleTwrPeriodChange = (newTwrPeriod: string) => {
    setTwrPeriod(newTwrPeriod);
    if (onTwrPeriodChange) {
      onTwrPeriodChange(newTwrPeriod);
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
    <Card>
      <CardContent>
        {/* Header with Timeframe and TWR Period Dropdowns */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: getUltraSpacing(2, 1)
        }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              {title}
            </Typography>
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Ghi chú cho nhà đầu tư:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>TWR</strong> phản ánh năng lực quản lý quỹ, đã loại bỏ ảnh hưởng của dòng tiền.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>MWR</strong> phản ánh lợi nhuận thực tế của từng nhà đầu tư, có thể khác nhau tùy thời điểm nạp/rút vốn.
                  </Typography>
                  <Typography variant="body2">
                    NĐT nên so sánh MWR cá nhân với TWR quỹ để hiểu rõ sự khác biệt.
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: {
                    maxWidth: 400,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 3,
                    '& .MuiTooltip-arrow': {
                      color: 'background.paper',
                      '&::before': {
                        border: '1px solid',
                        borderColor: 'divider',
                      }
                    }
                  }
                }
              }}
            >
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Portfolio performance vs {benchmarkName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>TWR Period</InputLabel>
            <Select
              value={twrPeriod}
              label="TWR Period"
              onChange={(e) => handleTwrPeriodChange(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '0.875rem'
                }
              }}
            >
              <MenuItem value="1D">1 Day TWR</MenuItem>
              <MenuItem value="1W">1 Week TWR</MenuItem>
              <MenuItem value="1M">1 Month TWR</MenuItem>
              <MenuItem value="3M">3 Months TWR</MenuItem>
              <MenuItem value="6M">6 Months TWR</MenuItem>
              <MenuItem value="1Y">1 Year TWR</MenuItem>
              <MenuItem value="YTD">YTD TWR</MenuItem>
            </Select>
          </FormControl>
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
        </Box>

        {/* Performance Metrics */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <TrendingUp color="primary" sx={{ fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Portfolio
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  color={portfolioReturn >= 0 ? "success.main" : "error.main"} 
                  fontWeight="bold"
                  sx={{ fontSize: '0.9rem' }}
                >
                  {formatPercentage(portfolioReturn)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <TrendingUp color="info" sx={{ fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {benchmarkName}
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  color={benchmarkReturn >= 0 ? "success.main" : "error.main"} 
                  fontWeight="bold"
                  sx={{ fontSize: '0.9rem' }}
                >
                  {formatPercentage(benchmarkReturn)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <CompareArrows color={excessReturn >= 0 ? "success" : "error"} sx={{ fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Excess
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  color={excessReturn >= 0 ? "success.main" : "error.main"} 
                  fontWeight="bold"
                  sx={{ fontSize: '0.9rem' }}
                >
                  {formatPercentage(excessReturn)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <TrendingDown color="warning" sx={{ fontSize: 16 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Tracking Error
                  </Typography>
                </Box>
                <Typography variant="body1" color="warning.main" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
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
            <RechartsTooltip content={<CustomTooltip />} />
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

      </CardContent>
    </Card>
  );
};

export default BenchmarkComparison;
