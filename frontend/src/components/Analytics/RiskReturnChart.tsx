/**
 * Risk-Return Scatter Plot component
 */

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface RiskReturnDataPoint {
  assetType: string;
  return: number;
  risk: number;
  value: number;
  color: string;
}

interface RiskReturnChartProps {
  data: RiskReturnDataPoint[];
  baseCurrency: string;
  title?: string;
  compact?: boolean;
}

const RiskReturnChart: React.FC<RiskReturnChartProps> = ({
  data,
  baseCurrency,
  title = 'Risk-Return Analysis',
  compact = false,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositiveReturn = data.return >= 0;
      
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

          {/* Return Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              Return (Bubble Size)
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: isPositiveReturn ? '#00C49F' : '#FF8042',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                mt: 0.5
              }}
            >
              {isPositiveReturn ? '+' : ''}{formatPercentage(data.return)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontSize: '0.65rem',
              fontStyle: 'italic',
              mt: 0.5,
              display: 'block'
            }}>
              Larger bubble = Higher return
            </Typography>
          </Box>

          {/* Risk Section */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              Risk (Volatility)
            </Typography>
            <Typography variant="body2" fontWeight="500" sx={{ 
              mt: 0.5,
              fontSize: '0.85rem',
              color: 'text.primary'
            }}>
              {formatPercentage(data.risk)}
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
              Portfolio Value
            </Typography>
            <Typography variant="body2" fontWeight="500" sx={{ 
              mt: 0.5,
              fontSize: '0.85rem',
              color: 'text.primary'
            }}>
              {formatCurrency(data.value, baseCurrency)}
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
            {isPositiveReturn ? (
              <Typography variant="caption" sx={{ 
                color: '#00C49F',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↗ HIGH RETURN
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ 
                color: '#FF8042',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↘ LOW RETURN
              </Typography>
            )}
          </Box>
        </Paper>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <Typography variant={compact ? "body2" : "h6"} color="text.secondary">
          No risk-return data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant={compact ? "subtitle1" : "h6"} gutterBottom sx={{ 
        fontSize: compact ? '0.9rem' : undefined,
        mb: compact ? 1 : 2
      }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ 
        mb: compact ? 1 : 2,
        fontSize: compact ? '0.75rem' : undefined
      }}>
        Risk vs Return analysis of portfolio assets
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ 
        mb: compact ? 1 : 2,
        fontSize: compact ? '0.65rem' : '0.7rem',
        fontStyle: 'italic'
      }}>
        • Bubble size represents return percentage (enhanced contrast for better visibility)
      </Typography>
      <Box sx={{ height: compact ? 167 : 267 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ 
            top: compact ? 10 : 20, 
            right: compact ? 10 : 20, 
            bottom: compact ? 10 : 20, 
            left: compact ? 10 : 20 
          }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="risk"
              name="Risk"
              tickFormatter={(value) => formatPercentage(value)}
              tick={{ fontSize: compact ? 10 : 12 }}
              label={{ 
                value: 'Risk (Volatility)', 
                position: 'insideBottom', 
                offset: compact ? -5 : -10,
                style: { fontSize: compact ? '0.7rem' : '0.8rem' }
              }}
            />
            <YAxis
              type="number"
              dataKey="return"
              name="Return"
              tickFormatter={(value) => formatPercentage(value)}
              tick={{ fontSize: compact ? 10 : 12 }}
              label={{ 
                value: 'Return', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: compact ? '0.7rem' : '0.8rem' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#1976d2">
              {data.map((entry, index) => {
                // Calculate bubble size based on return percentage with enhanced contrast
                const minSize = 8;   // Kích thước tối thiểu (tăng từ 6)
                const maxSize = 35;  // Kích thước tối đa (tăng từ 25)
                
                // Tìm min/max return trong dataset
                const returns = data.map(d => d.return);
                const minReturn = Math.min(...returns);
                const maxReturn = Math.max(...returns);
                const returnRange = maxReturn - minReturn;
                
                let bubbleSize = minSize;
                if (returnRange > 0) {
                  // Normalize return value to 0-1 range
                  const normalizedReturn = (entry.return - minReturn) / returnRange;
                  
                  // Áp dụng power function để tăng contrast (bubble size khác biệt rõ ràng hơn)
                  const enhancedNormalized = Math.pow(normalizedReturn, 0.7); // 0.7 để tăng contrast
                  
                  // Scale to bubble size range với multiplier để tăng chênh lệch
                  const sizeMultiplier = 1.5; // Tăng chênh lệch 1.5 lần
                  bubbleSize = minSize + (enhancedNormalized * (maxSize - minSize) * sizeMultiplier);
                  
                  // Đảm bảo không vượt quá maxSize
                  bubbleSize = Math.min(bubbleSize, maxSize);
                } else {
                  // Nếu tất cả return giống nhau, dùng kích thước trung bình
                  bubbleSize = (minSize + maxSize) / 2;
                }
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    r={bubbleSize}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default RiskReturnChart;
