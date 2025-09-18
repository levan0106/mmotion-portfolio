/**
 * Asset Allocation Timeline component
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { formatPercentage, formatDateFns as formatDate } from '../../utils/format';

interface TimelineDataPoint {
  date: string;
  [key: string]: string | number; // Dynamic asset type keys
}

interface AssetAllocationTimelineProps {
  data: TimelineDataPoint[];
  baseCurrency?: string;
  title?: string;
}

const AssetAllocationTimeline: React.FC<AssetAllocationTimelineProps> = ({
  data,
  title = 'Asset Allocation Timeline',
}) => {
  const colors = ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50', '#f44336', '#00bcd4', '#8bc34a'];

  // Get asset types from all data points (exclude 'date' key)
  const assetTypes = data.length > 0 
    ? Array.from(new Set(data.flatMap(item => Object.keys(item).filter(key => key !== 'date'))))
    : [];


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {formatDate(label)}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.dataKey}: {formatPercentage(entry.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No timeline data available
        </Typography>
      </Box>
    );
  }

  if (assetTypes.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No asset allocation data available
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
        Historical allocation changes over time
      </Typography>
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {assetTypes.map((assetType, index) => (
              <Line
                key={assetType}
                type="monotone"
                dataKey={assetType}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default AssetAllocationTimeline;
