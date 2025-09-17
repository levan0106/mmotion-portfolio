/**
 * Asset allocation pie chart component
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Box, Typography } from '@mui/material';
import { AssetAllocationResponse } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface AssetAllocationChartProps {
  data: AssetAllocationResponse;
  baseCurrency: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98',
];

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data,
  baseCurrency,
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mt: 2 }}>
        {payload.map((entry: any, index: number) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: entry.color,
                borderRadius: '50%',
              }}
            />
            <Typography variant="caption">
              {entry.value} ({formatPercentage(entry.payload.value)})
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  if (!data || Object.keys(data.allocation).length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No asset allocation data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${formatPercentage(value)}`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AssetAllocationChart;
