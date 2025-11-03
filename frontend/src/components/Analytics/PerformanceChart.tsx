/**
 * Performance line chart component
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
} from 'recharts';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { PerformanceHistoryDataPoint } from '../../types';
import { formatCurrency, formatDateFns as formatDate } from '../../utils/format';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';

interface PerformanceChartProps {
  portfolioId: string;
  baseCurrency: string;
  title?: string;
  showReferenceLine?: boolean;
  referenceValue?: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  portfolioId,
  baseCurrency,
  title = 'Performance Chart',
  showReferenceLine = false,
  referenceValue = 0,
}) => {
  const [timeframe, setTimeframe] = useState('1Y');
  const [data, setData] = useState<PerformanceHistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accountId } = useAccount();

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!accountId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Convert timeframe to months
        const monthsMap: Record<string, number> = {
          '1M': 1,
          '3M': 3,
          '6M': 6,
          '1Y': 12,
          '2Y': 24,
          '5Y': 60,
          'ALL': 120, // 10 years max
        };
        
        const months = monthsMap[timeframe] || 12;
        
        // Use NAV history API instead of performance-history
        const response = await apiService.getPortfolioNAVHistory(portfolioId, accountId, {
          months,
          granularity: 'DAILY',
        });
        
        // Transform NAV history data to PerformanceHistoryDataPoint format
        const transformedData = (response.data || []).map((item: any) => ({
          date: item.date,
          value: item.navValue || item.totalValue || 0,
          return: item.portfolioDailyReturn || 0,
        }));
        
        setData(transformedData);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [portfolioId, timeframe, accountId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {formatDate(label)}
          </Typography>
          <Typography variant="body2" color="primary">
            Value: {formatCurrency(payload[0].value, baseCurrency)}
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

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading performance data...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No performance data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          {title}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={(e) => setTimeframe(e.target.value)}
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
      
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, baseCurrency, { compact: true })}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#1976d2', strokeWidth: 2 }}
            />
            {showReferenceLine && (
              <ReferenceLine
                y={referenceValue}
                stroke="#ff9800"
                strokeDasharray="5 5"
                label={{ value: "Reference", position: "top" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default PerformanceChart;
