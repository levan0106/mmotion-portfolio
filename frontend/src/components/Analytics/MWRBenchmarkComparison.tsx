/**
 * MWR Benchmark Comparison component
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
import { TrendingUp, TrendingDown, InfoOutlined } from '@mui/icons-material';

interface BenchmarkDataPoint {
  date: string;
  portfolio: number;
  benchmark: number;
  difference: number;
}

interface MWRBenchmarkComparisonProps {
  data: BenchmarkDataPoint[];
  title?: string;
  benchmarkName?: string;
  mwrPeriod?: string;
  onMWRPeriodChange?: (period: string) => void;
  currentMWRPeriod?: string;
  onTimeframeChange?: (timeframe: string) => void;
  currentTimeframe?: string;
}

const MWRBenchmarkComparison: React.FC<MWRBenchmarkComparisonProps> = ({
  data,
  title = 'Portfolio Performance (MWR)',
  benchmarkName = 'VN Index',
  mwrPeriod: _mwrPeriod,
  onMWRPeriodChange,
  currentMWRPeriod,
  onTimeframeChange,
  currentTimeframe = '1Y'
}) => {
  const [selectedMwrPeriod, setSelectedMwrPeriod] = useState(currentMWRPeriod || '1M');
  const [timeframe, setTimeframe] = useState(currentTimeframe);

  useEffect(() => {
    if (currentMWRPeriod) {
      setSelectedMwrPeriod(currentMWRPeriod);
    }
  }, [currentMWRPeriod]);

  useEffect(() => {
    setTimeframe(currentTimeframe);
  }, [currentTimeframe]);

  const handleMWRPeriodChange = (event: any) => {
    const newPeriod = event.target.value;
    setSelectedMwrPeriod(newPeriod);
    if (onMWRPeriodChange) {
      onMWRPeriodChange(newPeriod);
    }
  };

  const handleTimeframeChange = (event: any) => {
    const newTimeframe = event.target.value;
    setTimeframe(newTimeframe);
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe);
    }
  };

  const getUltraSpacing = (multiplier: number, base: number = 8) => base * multiplier;

  // Calculate summary statistics
  const latestData = data[data.length - 1];
  const portfolioReturn = latestData?.portfolio || 0;
  const benchmarkReturn = latestData?.benchmark || 0;
  const difference = latestData?.difference || 0;

  const isOutperforming = difference > 0;
  const isUnderperforming = difference < 0;

  // Custom tooltip component
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

  return (
    <Card>
      <CardContent>
        {/* Header */}
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
                      <strong>MWR</strong> phản ánh lợi nhuận thực tế của từng nhà đầu tư, có thể khác nhau tùy thời điểm nạp/rút vốn.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>TWR</strong> phản ánh năng lực quản lý quỹ, đã loại bỏ ảnh hưởng của dòng tiền.
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
              <InputLabel>MWR Period</InputLabel>
              <Select
                value={selectedMwrPeriod}
                onChange={handleMWRPeriodChange}
                label="MWR Period"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontSize: '0.875rem'
                  }
                }}
              >
                <MenuItem value="1D">1 Day MWR</MenuItem>
                <MenuItem value="1W">1 Week MWR</MenuItem>
                <MenuItem value="1M">1 Month MWR</MenuItem>
                <MenuItem value="3M">3 Months MWR</MenuItem>
                <MenuItem value="6M">6 Months MWR</MenuItem>
                <MenuItem value="1Y">1 Year MWR</MenuItem>
                <MenuItem value="YTD">YTD MWR</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={timeframe}
                onChange={handleTimeframeChange}
                label="Timeframe"
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

        {/* Summary Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center', width: '100%' }}>
                <Typography variant="body1" color="primary" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                  {formatPercentage(portfolioReturn)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Portfolio (MWR)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center', width: '100%' }}>
                <Typography variant="body1" color="secondary" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                  {formatPercentage(benchmarkReturn)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {benchmarkName}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                  {isOutperforming && <TrendingUp color="success" sx={{ fontSize: 16 }} />}
                  {isUnderperforming && <TrendingDown color="error" sx={{ fontSize: 16 }} />}
                  <Typography 
                    variant="body1" 
                    color={isOutperforming ? 'success.main' : isUnderperforming ? 'error.main' : 'text.secondary'}
                    fontWeight="bold"
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {formatPercentage(difference)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Difference
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Chart */}
        <Box sx={{ height: 267, mb: 3 }}>
          {data && data.length > 0 ? (
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
                name="Portfolio (MWR)"
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
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                No data available for MWR chart
              </Typography>
            </Box>
          )}
        </Box>

      </CardContent>
    </Card>
  );
};

export default MWRBenchmarkComparison;
