/**
 * Asset Summary Chart component
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
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { AssetAllocationResponse } from '../../types';

interface AssetSummaryChartProps {
  data: AssetAllocationResponse;
  baseCurrency: string;
  title?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98',
];

const AssetSummaryChart: React.FC<AssetSummaryChartProps> = ({
  data,
  baseCurrency,
  title = 'Asset Summary',
}) => {
  // Transform data for the chart
  const chartData = Object.entries(data.allocation).map(([assetType, allocation], index) => ({
    assetType: assetType.toUpperCase(),
    percentage: allocation.percentage,
    value: allocation.value,
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
            {data.assetType}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Allocation: {formatPercentage(data.percentage)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {formatCurrency(data.value, baseCurrency)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (!data || Object.keys(data.allocation).length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No asset summary data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Asset allocation overview with values and percentages
      </Typography>
      
      {/* Chart */}
      <Box sx={{ height: 300, mb: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="assetType" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tickFormatter={(value) => formatPercentage(value)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        {chartData.map((asset, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: asset.color,
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight="bold">
                    {asset.assetType}
                  </Typography>
                </Box>
                <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
                  {formatPercentage(asset.percentage)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(asset.value, baseCurrency)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Total Portfolio Value */}
      <Box sx={{ 
        mt: 3, 
        p: 3, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 2,
        textAlign: 'center'
      }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total Portfolio Value
        </Typography>
        <Typography variant="h4" color="primary" fontWeight="bold">
          {formatCurrency(data.totalValue, baseCurrency)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {Object.keys(data.allocation).length} Asset Classes
        </Typography>
      </Box>
    </Box>
  );
};

export default AssetSummaryChart;
