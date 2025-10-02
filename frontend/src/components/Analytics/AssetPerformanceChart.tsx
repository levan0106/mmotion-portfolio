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
  compact?: boolean;
}

const AssetPerformanceChart: React.FC<AssetPerformanceChartProps> = ({
  data,
  baseCurrency,
  title = 'Asset Performance Comparison',
  compact = false,
}) => {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositivePerformance = data.performance >= 0;
      
      return (
        <Paper sx={{ 
          p: 2.5, 
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
              {data.assetType.toUpperCase()}
            </Typography>
          </Box>

          {/* Performance Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              Performance (Unrealized P&L)
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: isPositivePerformance ? '#00C49F' : '#FF8042',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                mt: 0.5
              }}
            >
              {isPositivePerformance ? '+' : ''}{formatPercentage(data.performance)}
            </Typography>
          </Box>

          {/* Value Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              Total Value
            </Typography>
            <Typography variant="body2" fontWeight="500" sx={{ 
              mt: 0.5,
              fontSize: '0.85rem',
              color: 'text.primary'
            }}>
              {formatCurrency(data.value, baseCurrency)}
            </Typography>
          </Box>

          {/* Unrealized P&L Section */}
          {data.unrealizedPl !== undefined && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500
              }}>
                Unrealized P&L
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight="500" 
                sx={{ 
                  mt: 0.5,
                  fontSize: '0.85rem',
                  color: isPositivePerformance ? '#00C49F' : '#FF8042'
                }}
              >
                {isPositivePerformance ? '+' : ''}{formatCurrency(data.unrealizedPl, baseCurrency)}
              </Typography>
            </Box>
          )}

          {/* Position Count */}
          {data.positionCount && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500
              }}>
                Positions
              </Typography>
              <Typography variant="body2" fontWeight="500" sx={{ 
                mt: 0.5,
                fontSize: '0.85rem',
                color: 'text.primary'
              }}>
                {data.positionCount} {data.positionCount === 1 ? 'position' : 'positions'}
              </Typography>
            </Box>
          )}

          {/* Performance Indicator */}
          <Box sx={{ 
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {isPositivePerformance ? (
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
        </Paper>
      );
    }
    return null;
  };

  if (safeData.length === 0) {
    return (
      <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <Typography variant={compact ? "body2" : "h6"} color="text.secondary">
          No performance data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ 
        fontSize: compact ? '0.7rem' : '0.8rem',
        fontWeight: 600,
        textAlign: 'center',
        mb: compact ? 1 : 2
      }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ 
        mb: compact ? 1 : 2,
        fontSize: compact ? '0.75rem' : undefined
      }}>
        Performance comparison across asset types
      </Typography>
      <Box sx={{ height: compact ? 167 : 267 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={safeData} margin={{ 
            top: compact ? 10 : 20, 
            right: compact ? 15 : 30, 
            left: compact ? 10 : 20, 
            bottom: compact ? 5 : 5 
          }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="assetType" 
              tick={{ fontSize: compact ? 10 : 12 }}
              tickFormatter={(value) => value.toUpperCase()}
            />
            <YAxis
              tickFormatter={(value) => formatPercentage(value)}
              tick={{ fontSize: compact ? 10 : 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="performance" radius={compact ? [2, 2, 0, 0] : [4, 4, 0, 0]}>
              {safeData.map((entry, index) => (
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
