/**
 * Asset Performance Comparison Bar Chart component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { Box, Paper } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
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
  const { t } = useTranslation();
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
            <ResponsiveTypography variant="chartLegend">
              {data.assetType.toUpperCase()}
            </ResponsiveTypography>
          </Box>

          {/* Performance Section */}
          <Box sx={{ mb: 1.5 }}>
            <ResponsiveTypography variant="formHelper" sx={{ 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              {t('portfolio.performanceUnrealizedPL')}
            </ResponsiveTypography>
            <ResponsiveTypography 
              variant="cardValue" 
              sx={{ 
                color: isPositivePerformance ? '#00C49F' : '#FF8042',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                mt: 0.5
              }}
            >
              {isPositivePerformance ? '+' : ''}{formatPercentage(data.performance)}
            </ResponsiveTypography>
          </Box>

          {/* Value Section */}
          <Box sx={{ mb: 1.5 }}>
            <ResponsiveTypography variant="formHelper" sx={{ 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              {t('portfolio.totalValue')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ 
              mt: 0.5,
              fontSize: '0.85rem',
              color: 'text.primary'
            }}>
              {formatCurrency(data.value, baseCurrency)}
            </ResponsiveTypography>
          </Box>

          {/* Unrealized P&L Section */}
          {data.unrealizedPl !== undefined && (
            <Box sx={{ mb: 1.5 }}>
              <ResponsiveTypography variant="formHelper" sx={{ 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500
              }}>
                {t('portfolio.unrealizedPL')}
              </ResponsiveTypography>
              <ResponsiveTypography 
                variant="tableCell" 
                sx={{ 
                  mt: 0.5,
                  fontSize: '0.85rem',
                  color: isPositivePerformance ? '#00C49F' : '#FF8042'
                }}
              >
                {isPositivePerformance ? '+' : ''}{formatCurrency(data.unrealizedPl, baseCurrency)}
              </ResponsiveTypography>
            </Box>
          )}

          {/* Position Count */}
          {data.positionCount && (
            <Box>
              <ResponsiveTypography variant="formHelper" sx={{ 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500
              }}>
                {t('portfolio.positions')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="tableCell" sx={{ 
                mt: 0.5,
                fontSize: '0.85rem',
                color: 'text.primary'
              }}>
                {data.positionCount} {data.positionCount === 1 ? t('portfolio.position') : t('portfolio.positions')}
              </ResponsiveTypography>
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
              <ResponsiveTypography variant="statusText" sx={{ 
                color: '#00C49F',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↗ {t('portfolio.profit')}
              </ResponsiveTypography>
            ) : (
              <ResponsiveTypography variant="statusText" sx={{ 
                color: '#FF8042',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↘ {t('portfolio.loss')}
              </ResponsiveTypography>
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
        <ResponsiveTypography variant={compact ? "formHelper" : "cardTitle"} color="text.secondary">
          {t('portfolio.noPerformanceData')}
        </ResponsiveTypography>
      </Box>
    );
  }

  return (
    <Box>
      <ResponsiveTypography variant="chartTitle" >
        {title}
      </ResponsiveTypography>
      <ResponsiveTypography variant="chartSubtitle" color="text.secondary">
        {t('portfolio.performanceComparison')}
      </ResponsiveTypography>
      <Box sx={{ 
        height: compact ? 167 : 267,
        px: { xs: 0, sm: 1 },
        mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={safeData} margin={{ 
            top: compact ? 10 : 20, 
            right: compact ? 0 : 30, 
            left: compact ? 0 : 20, 
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
