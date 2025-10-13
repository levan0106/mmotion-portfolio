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
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Tooltip,
  IconButton
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { ResponsiveFormSelect } from '../Common/ResponsiveFormControl';
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
  const [selectedMwrPeriod, setSelectedMwrPeriod] = useState(currentMWRPeriod || 'YTD');
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
          <ResponsiveTypography variant="cardTitle" gutterBottom>
            {formatDate(label)}
          </ResponsiveTypography>
          {payload.map((entry: any, index: number) => (
            <ResponsiveTypography key={index} variant="tableCell" color={entry.color}>
              {entry.name}: {formatPercentage(entry.value)}
            </ResponsiveTypography>
          ))}
          <ResponsiveTypography variant="formHelper" color="text.secondary" sx={{ mt: 1 }}>
            Difference: {formatPercentage(payload[0]?.payload?.difference || 0)}
          </ResponsiveTypography>
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
              <ResponsiveTypography variant="chartTitle" sx={{ mb: 0 }}>
                {title}
              </ResponsiveTypography>
              <Tooltip
                title={
                  <Box sx={{ p: 1 }}>
                    <ResponsiveTypography variant="chartTitle" sx={{ mb: 1 }} ellipsis={false}>
                      Ghi chú cho nhà đầu tư:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="formHelper" sx={{ mb: 1 }} ellipsis={false}>
                      <strong>MWR</strong> phản ánh lợi nhuận thực tế của từng nhà đầu tư, có thể khác nhau tùy thời điểm nạp/rút vốn.
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="formHelper" sx={{ mb: 1 }} ellipsis={false}>
                      <strong>TWR</strong> phản ánh năng lực quản lý quỹ, đã loại bỏ ảnh hưởng của dòng tiền.
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="formHelper" ellipsis={false}>
                      NĐT nên so sánh MWR cá nhân với TWR quỹ để hiểu rõ sự khác biệt.
                    </ResponsiveTypography>
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
            <ResponsiveTypography variant="formHelper" color="text.secondary">
              Portfolio performance vs {benchmarkName}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ResponsiveFormSelect
              compact={false}
              size="small"
              options={[
                { value: '1D', label: '1 Day MWR' },
                { value: '1W', label: '1 Week MWR' },
                { value: '1M', label: '1 Month MWR' },
                { value: '3M', label: '3 Months MWR' },
                { value: '6M', label: '6 Months MWR' },
                { value: '1Y', label: '1 Year MWR' },
                { value: 'YTD', label: 'YTD MWR' },
              ]}
              value={selectedMwrPeriod}
              onChange={(value) => handleMWRPeriodChange({ target: { value: String(value) } })}
              formControlSx={{ minWidth: 80 }}
            />
            <ResponsiveFormSelect
              compact={false}
              size="small"
              options={[
                { value: '1M', label: '1 Month' },
                { value: '3M', label: '3 Months' },
                { value: '6M', label: '6 Months' },
                { value: '1Y', label: '1 Year' },
                { value: '2Y', label: '2 Years' },
                { value: '5Y', label: '5 Years' },
                { value: 'ALL', label: 'All Time' },
              ]}
              value={timeframe}
              onChange={(value) => handleTimeframeChange({ target: { value: String(value) } })}
              formControlSx={{ minWidth: 80 }}
            />
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: { xs: 0.5, sm: 1.5 }, '&:last-child': { pb: { xs: 0.5, sm: 1.5 } }, textAlign: 'center', width: '100%' }}>
                <ResponsiveTypography variant="cardValue" color="primary" fontWeight="bold">
                  {formatPercentage(portfolioReturn)}
                </ResponsiveTypography>
                <ResponsiveTypography variant="formHelper" color="text.secondary">
                  Portfolio (MWR)
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: { xs: 0.5, sm: 1.5 }, '&:last-child': { pb: { xs: 0.5, sm: 1.5 } }, textAlign: 'center', width: '100%' }}>
                <ResponsiveTypography variant="cardValue" color="secondary" fontWeight="bold">
                  {formatPercentage(benchmarkReturn)}
                </ResponsiveTypography>
                <ResponsiveTypography variant="formHelper" color="text.secondary">
                  {benchmarkName}
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ height: 80, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ p: { xs: 0.5, sm: 1.5 }, '&:last-child': { pb: { xs: 0.5, sm: 1.5 } }, textAlign: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                  {isOutperforming && <TrendingUp color="success" sx={{ fontSize: 16 }} />}
                  {isUnderperforming && <TrendingDown color="error" sx={{ fontSize: 16 }} />}
                  <ResponsiveTypography 
                    variant="cardValue" 
                    color={isOutperforming ? 'success.main' : isUnderperforming ? 'error.main' : 'text.secondary'}
                    fontWeight="bold"
                  >
                    {formatPercentage(difference)}
                  </ResponsiveTypography>
                </Box>
                <ResponsiveTypography variant="formHelper" color="text.secondary">
                  Difference
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Chart */}
        <Box sx={{ 
          height: 267, 
          mb: 3,
          px: { xs: 0, sm: 1 },
          mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
        }}>
          {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ 
                top: 20, 
                right: 30, 
                left: 20, 
                bottom: 5 
              }}>
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
              <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                No data available for MWR chart
              </ResponsiveTypography>
            </Box>
          )}
        </Box>

      </CardContent>
    </Card>
  );
};

export default MWRBenchmarkComparison;
