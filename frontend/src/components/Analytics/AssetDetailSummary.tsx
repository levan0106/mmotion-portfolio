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
    quantity: asset.quantity,
    currentPrice: asset.currentPrice,
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
      <Grid container spacing={1.5}>
        {chartData.map((asset, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} xl={2} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                }
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: asset.color,
                        borderRadius: '50%',
                        mr: 0.75,
                      }}
                    />
                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>
                      {asset.symbol}
                    </Typography>
                  </Box>
                  <Chip 
                    label={asset.assetType} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ 
                      height: 18,
                      fontSize: '0.65rem',
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                  />
                </Box>
                
                {/* Asset Name */}
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: '0.7rem',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    mb: 1
                  }}
                >
                  {asset.name}
                </Typography>
                
                {/* Allocation & Total Value */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 1,
                  p: 0.75,
                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  borderRadius: 1,
                  border: '1px solid rgba(25, 118, 210, 0.12)'
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Allocation
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="primary" 
                      fontWeight="bold" 
                      sx={{ fontSize: '0.85rem', display: 'block' }}
                    >
                      {formatPercentage(asset.percentage)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Value
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.primary" 
                      fontWeight="bold" 
                      sx={{ fontSize: '0.8rem', display: 'block' }}
                    >
                      {formatCurrency(asset.totalValue, baseCurrency)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Details Grid */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 0.5,
                  fontSize: '0.7rem'
                }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Qty
                    </Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem', display: 'block' }}>
                      {asset.quantity?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Market Price
                    </Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem', display: 'block' }}>
                      {formatCurrency(asset.currentPrice, baseCurrency)}
                    </Typography>
                  </Box>
                </Box>
                
                {/* P&L */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mt: 1,
                  pt: 0.5,
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    P&L
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="caption" 
                      fontWeight="bold"
                      color={asset.unrealizedPl >= 0 ? "success.main" : "error.main"}
                      sx={{ fontSize: '0.7rem', display: 'block' }}
                    >
                      {formatCurrency(asset.unrealizedPl, baseCurrency)}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color={asset.unrealizedPl >= 0 ? "success.main" : "error.main"}
                      sx={{ fontSize: '0.65rem' }}
                    >
                      {formatPercentage(asset.unrealizedPlPercentage)}
                    </Typography>
                  </Box>
                </Box>
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
