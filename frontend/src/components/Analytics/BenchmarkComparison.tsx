/**
 * Benchmark Comparison component
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Card, 
  CardContent, 
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
  Grid
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { ResponsiveFormSelect } from '../Common/ResponsiveFormControl';
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
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState(currentTimeframe);
  const [twrPeriod, setTwrPeriod] = useState(currentTwrPeriod);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
          <ResponsiveTypography variant="chartTooltip" gutterBottom>
            {formatDate(label)}
          </ResponsiveTypography>
          {payload.map((entry: any, index: number) => (
            <ResponsiveTypography key={index} variant="chartTooltip" sx={{ wordBreak: 'break-word', color: entry.color }}>
              {entry.name}: {formatPercentage(entry.value)}
            </ResponsiveTypography>
          ))}
          <ResponsiveTypography variant="chartTooltip" color="text.secondary" sx={{ mt: 1 }}>
            {t('benchmark.difference')}: {formatPercentage(payload[0]?.payload?.difference || 0)}
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
        <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
          {t('benchmark.noData')}
        </ResponsiveTypography>
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
            <ResponsiveTypography variant="chartTitle" gutterBottom sx={{ mb: 0 }}>
              {title}
            </ResponsiveTypography>
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <ResponsiveTypography variant="chartTitle" sx={{ mb: 1 }} ellipsis={false}>
                    {t('benchmark.tooltip.title')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="formHelper" sx={{ mb: 1 }} ellipsis={false}>
                    <strong>{t('benchmark.tooltip.twr')}</strong> {t('benchmark.tooltip.twrDescription')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="formHelper" sx={{ mb: 1 }} ellipsis={false}>
                    <strong>{t('benchmark.tooltip.mwr')}</strong> {t('benchmark.tooltip.mwrDescription')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="formHelper" ellipsis={false}>
                    {t('benchmark.tooltip.comparison')}
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
          <ResponsiveTypography variant="formHelper" color="text.secondary" display={isMobile ? 'none' : 'block'}>
            {t('benchmark.subtitle', { benchmarkName })}
          </ResponsiveTypography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ResponsiveFormSelect
            compact={false}
            size="small"
            options={[
              { value: '1D', label: '1 Day' },
              { value: '1W', label: '1 Week' },
              { value: '1M', label: '1 Month' },
              { value: '3M', label: '3 Months' },
              { value: '6M', label: '6 Months' },
              { value: '1Y', label: '1 Year' },
              { value: 'YTD', label: 'YTD' },
            ]}
            value={twrPeriod}
            onChange={(value) => handleTwrPeriodChange(String(value))}
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
            onChange={(value) => handleTimeframeChange(String(value))}
            formControlSx={{ minWidth: 80 }}
          />
        </Box>
        </Box>

        {/* Performance Metrics - Simple List View */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" sx={{ fontSize: 16 }} />
              <ResponsiveTypography variant="formHelper" color="text.secondary">
                {t('benchmark.portfolio')}
              </ResponsiveTypography>
            </Box>
            <ResponsiveTypography 
              variant="cardValue" 
              color={portfolioReturn >= 0 ? "success.main" : "error.main"} 
              fontWeight="bold"
            >
              {formatPercentage(portfolioReturn)}
            </ResponsiveTypography>
          </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="info" sx={{ fontSize: 16 }} />
              <ResponsiveTypography variant="formHelper" color="text.secondary">
                {benchmarkName}
              </ResponsiveTypography>
            </Box>
            <ResponsiveTypography 
              variant="cardValue" 
              color={benchmarkReturn >= 0 ? "success.main" : "error.main"} 
              fontWeight="bold"
            >
              {formatPercentage(benchmarkReturn)}
            </ResponsiveTypography>
          </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CompareArrows color={excessReturn >= 0 ? "success" : "error"} sx={{ fontSize: 16 }} />
              <ResponsiveTypography variant="formHelper" color="text.secondary">
                {t('benchmark.difference')}
              </ResponsiveTypography>
            </Box>
            <ResponsiveTypography 
              variant="cardValue" 
              color={excessReturn >= 0 ? "success.main" : "error.main"} 
              fontWeight="bold"
            >
              {formatPercentage(excessReturn)}
            </ResponsiveTypography>
          </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={2}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDown color="warning" sx={{ fontSize: 16 }} />
              <ResponsiveTypography variant="formHelper" color="text.secondary">
                {t('benchmark.trackingError')}
              </ResponsiveTypography>
            </Box>
            <ResponsiveTypography 
              variant="cardValue" 
              color="warning.main" 
              fontWeight="bold"
            >
              {formatPercentage(trackingError)}
            </ResponsiveTypography>
          </Box>
          </Grid>
        </Grid>

        {/* Performance Comparison Chart */}
        <Box sx={{ 
          height: 267, 
          mb: 3,
          px: { xs: 0, sm: 1 },
          mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
        }}>
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
              name={t('benchmark.portfolio')}
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
