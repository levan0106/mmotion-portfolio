/**
 * Asset Performance Comparison Bar Chart component
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface AssetPerformanceDataPoint {
  assetType: string;
  performance: number;
  value: number;
  color: string;
}

interface AssetPerformanceChartProps {
  data: AssetPerformanceDataPoint[];
  baseCurrency: string;
  title?: string;
}

const AssetPerformanceChart: React.FC<AssetPerformanceChartProps> = ({
  data,
  baseCurrency,
  title = 'Asset Performance Comparison',
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.assetType.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Performance: {formatPercentage(data.performance)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {formatCurrency(data.value, baseCurrency)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No performance data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Performance comparison across asset types
      </Typography>
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="assetType" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toUpperCase()}
            />
            <YAxis
              tickFormatter={(value) => formatPercentage(value)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="performance" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default AssetPerformanceChart;
