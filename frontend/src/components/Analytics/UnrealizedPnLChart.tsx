/**
 * Unrealized P&L by Asset Type chart component
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Box, Typography } from '@mui/material';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface AssetPerformanceData {
  assetType: string;
  performance: number;
  value: number;
  color: string;
  unrealizedPl: number;
  positionCount: number;
}

interface UnrealizedPnLChartProps {
  data: AssetPerformanceData[];
  baseCurrency: string;
  compact?: boolean;
}


const UnrealizedPnLChart: React.FC<UnrealizedPnLChartProps> = ({
  data,
  baseCurrency,
  compact = false,
}) => {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  // Transform data for the chart
  const chartData = safeData.map((item) => {
    const unrealizedPnLPercentage = item.value > 0 
      ? (item.unrealizedPl / item.value) * 100 
      : 0;
    
    return {
      name: item.assetType,
      unrealizedPnL: item.unrealizedPl,
      unrealizedPnLPercentage: unrealizedPnLPercentage,
      marketValue: item.value,
      positionCount: item.positionCount,
      color: item.unrealizedPl >= 0 ? '#00C49F' : '#FF8042', // Green for profit, Red for loss
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProfit = (data.unrealizedPnL || 0) >= 0;
      
      return (
        <Box sx={{ 
          p: 2.5, 
          backgroundColor: 'white', 
          borderRadius: 2, 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e0e0e0',
          minWidth: 200,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            right: -8,
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid white',
            borderTop: '8px solid transparent',
            borderBottom: '8px solid transparent',
          }
        }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1.5,
            pb: 1,
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: data.color,
                borderRadius: '50%',
                mr: 1,
                flexShrink: 0
              }}
            />
            <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: '0.9rem' }}>
              {data.name || 'Unknown'}
            </Typography>
          </Box>

          {/* P&L Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              Unrealized P&L
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 0.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: isProfit ? '#00C49F' : '#FF8042',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  mr: 1
                }}
              >
                {isProfit ? '+' : ''}{formatCurrency(data.unrealizedPnL || 0, baseCurrency)}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: isProfit ? '#00C49F' : '#FF8042',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  backgroundColor: isProfit ? '#E8F5E8' : '#FFE8E8',
                  px: 1,
                  py: 0.25,
                  borderRadius: 1
                }}
              >
                {isProfit ? '+' : ''}{formatPercentage(data.unrealizedPnLPercentage || 0)}
              </Typography>
            </Box>
          </Box>

            {/* Current Value Section */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500
              }}>
                Current Value
              </Typography>
              <Typography variant="body2" fontWeight="500" sx={{ 
                mt: 0.5,
                fontSize: '0.85rem',
                color: 'text.primary'
              }}>
                {formatCurrency(data.marketValue || 0, baseCurrency)}
              </Typography>
            </Box>

          {/* Performance Indicator */}
          <Box sx={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {isProfit ? (
              <Typography variant="caption" sx={{ 
                color: '#00C49F',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↗ PROFIT
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ 
                color: '#FF8042',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↘ LOSS
              </Typography>
            )}
          </Box>
        </Box>
      );
    }
    return null;
  };

  if (!safeData || safeData.length === 0) {
    return (
      <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <Typography variant={compact ? "body2" : "h6"} color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: compact ? 133 : 187 }}>
      <Typography variant={compact ? "subtitle2" : "h6"} gutterBottom sx={{ 
        mb: compact ? 1 : 2,
        fontSize: compact ? '0.8rem' : undefined,
        fontWeight: 600,
        textAlign: 'center'
      }}>
        Unrealized P&L by Asset Type
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ 
          top: compact ? 5 : 10, 
          right: compact ? 5 : 10, 
          left: compact ? 5 : 10, 
          bottom: compact ? 5 : 10 
        }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: compact ? 8 : 10 }}
            angle={compact ? -45 : -30}
            textAnchor="end"
            height={compact ? 40 : 60}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, baseCurrency)}
            tick={{ fontSize: compact ? 8 : 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="unrealizedPnL" radius={compact ? [2, 2, 0, 0] : [4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default UnrealizedPnLChart;
