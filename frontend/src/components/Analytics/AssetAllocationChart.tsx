/**
 * Asset allocation pie chart component
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';
import { AssetAllocationResponse } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface AssetAllocationChartProps {
  data: AssetAllocationResponse;
  baseCurrency: string;
  compact?: boolean;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98',
];

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data,
  baseCurrency,
  compact = false,
}) => {
  // Transform data for the chart
  const chartData = Object.entries(data.allocation).map(([assetType, allocation], index) => ({
    name: assetType.toUpperCase(),
    value: allocation.percentage,
    marketValue: allocation.value,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'white', 
          borderRadius: 1, 
          boxShadow: 3,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Allocation: {formatPercentage(data.value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Market Value: {formatCurrency(data.marketValue, baseCurrency)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: compact ? 0.5 : 0.8,
        alignItems: 'flex-start'
      }}>
        {payload.map((entry: any, index: number) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: compact ? 0.4 : 0.6,
            width: '100%'
          }}>
            <Box
              sx={{
                width: compact ? 8 : 10,
                height: compact ? 8 : 10,
                backgroundColor: entry.color,
                borderRadius: '50%',
                flexShrink: 0
              }}
            />
            <Typography variant="caption" sx={{ 
              fontSize: compact ? '0.65rem' : '0.75rem',
              lineHeight: 1.2,
              fontWeight: 500
            }}>
              {entry.value}
            </Typography>
            <Typography variant="caption" sx={{ 
              fontSize: compact ? '0.6rem' : '0.7rem',
              lineHeight: 1.2,
              color: 'text.secondary',
              ml: 'auto'
            }}>
              {formatPercentage(entry.payload.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  if (!data || Object.keys(data.allocation).length === 0) {
    return (
      <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <Typography variant={compact ? "body2" : "h6"} color="text.secondary">
          No asset allocation data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: compact ? 133 : 187, display: 'flex', alignItems: 'center' }}>
      <Box sx={{ flex: 1, height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={compact ? 60 : 90}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ 
        width: compact ? 120 : 150, 
        ml: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <CustomLegend payload={chartData.map((entry) => ({
          value: entry.name,
          color: entry.color,
          payload: { value: entry.value }
        }))} />
      </Box>
    </Box>
  );
};

export default AssetAllocationChart;
