/**
 * Asset Detail Summary component
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
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface AssetDetail {
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  percentage: number;
  unrealizedPl: number;
  unrealizedPlPercentage: number;
}

interface AssetDetailSummaryProps {
  data: AssetDetail[];
  baseCurrency: string;
  title?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
  '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98',
];

const AssetDetailSummary: React.FC<AssetDetailSummaryProps> = ({
  data,
  baseCurrency,
  title = 'Asset Detail Summary',
}) => {
  // Add null checks
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No asset detail data available
        </Typography>
      </Box>
    );
  }

  // Transform data for the chart
  const chartData = data.map((asset, index) => ({
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.assetType,
    totalValue: asset.totalValue,
    percentage: asset.percentage,
    unrealizedPl: asset.unrealizedPl,
    unrealizedPlPercentage: asset.unrealizedPlPercentage,
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
            {data.symbol} - {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Allocation: {formatPercentage(data.percentage || 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {formatCurrency(data.totalValue, baseCurrency)}
          </Typography>
          <Typography variant="body2" color={(data.unrealizedPl || 0) >= 0 ? "success.main" : "error.main"}>
            P&L: {formatCurrency(data.unrealizedPl || 0, baseCurrency)} ({formatPercentage(data.unrealizedPlPercentage || 0)})
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No asset detail data available
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
        Individual asset holdings with values and performance
      </Typography>
      
      {/* Chart */}
      <Box sx={{ height: 300, mb: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="symbol" 
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

      {/* Asset Detail Cards */}
      <Grid container spacing={2}>
        {chartData.map((asset, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                      {asset.symbol}
                    </Typography>
                  </Box>
                  <Chip 
                    label={asset.assetType} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {asset.name}
                </Typography>
                
                <Typography variant="h6" color="primary" fontWeight="bold" gutterBottom>
                  {formatPercentage(asset.percentage)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {formatCurrency(asset.totalValue, baseCurrency)}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mt: 1
                }}>
                  <Typography variant="body2" color="text.secondary">
                    P&L:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={asset.unrealizedPl >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(asset.unrealizedPl, baseCurrency)}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="caption" 
                  color={asset.unrealizedPl >= 0 ? "success.main" : "error.main"}
                  sx={{ display: 'block', textAlign: 'right' }}
                >
                  {formatPercentage(asset.unrealizedPlPercentage)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Summary Stats */}
      <Box sx={{ 
        mt: 3, 
        p: 3, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 2,
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Assets
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {data.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {formatCurrency(data.reduce((sum, asset) => sum + asset.totalValue, 0), baseCurrency)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total P&L
              </Typography>
              <Typography 
                variant="h5" 
                fontWeight="bold"
                color={data.reduce((sum, asset) => sum + asset.unrealizedPl, 0) >= 0 ? "success.main" : "error.main"}
              >
                {formatCurrency(data.reduce((sum, asset) => sum + asset.unrealizedPl, 0), baseCurrency)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Asset Types
              </Typography>
              <Typography variant="h5" color="primary" fontWeight="bold">
                {new Set(data.map(asset => asset.assetType)).size}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AssetDetailSummary;
