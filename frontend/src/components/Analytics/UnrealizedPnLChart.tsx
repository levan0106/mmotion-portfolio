/**
 * Unrealized P&L by Asset Type chart component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Box } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { getAssetTypeColor, getPnLColors, type PnLColorScheme } from '../../config/chartColors';

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
  colorScheme?: PnLColorScheme;
}

const UnrealizedPnLChart: React.FC<UnrealizedPnLChartProps> = ({
  data,
  baseCurrency,
  compact = false,
  colorScheme = 'default',
}) => {
  const { t } = useTranslation();
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  // Get P&L colors based on scheme
  const pnlColors = getPnLColors(colorScheme);
  
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
      color: getAssetTypeColor(item.assetType), // Use standard asset type colors
      isPositive: item.unrealizedPl >= 0, // Track if P&L is positive
    };
  });

  const CustomTooltip = ({ active, payload, pnlColors }: any) => {
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
            <ResponsiveTypography variant="chartTitle">
              {data.name || 'Unknown'}
            </ResponsiveTypography>
          </Box>

          {/* P&L Section */}
          <Box sx={{ mb: 1.5 }}>
            <ResponsiveTypography variant="chartTooltip" sx={{ 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              Unrealized P&L 
            </ResponsiveTypography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 1 }}>
              {isProfit ? (
                <TrendingUp sx={{ fontSize: 20, color: pnlColors.positive }} />
              ) : (
                <TrendingDown sx={{ fontSize: 20, color: pnlColors.negative }} />
              )}
              <ResponsiveTypography 
                variant="cardValueMedium" 
                sx={{ 
                  color: isProfit ? pnlColors.positive : pnlColors.negative,
                  fontWeight: 'bold',
                }}
              >
                {isProfit ? '+' : ''}{formatCurrency(data.unrealizedPnL || 0, baseCurrency)}
              </ResponsiveTypography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                backgroundColor: isProfit ? pnlColors.positiveLight : pnlColors.negativeLight,
                px: 1,
                py: 0.25,
                borderRadius: 1
              }}>
                {isProfit ? (
                  <TrendingUp sx={{ fontSize: 14, color: pnlColors.positive }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 14, color: pnlColors.negative }} />
                )}
                <ResponsiveTypography 
                  variant="tableCell" 
                  sx={{ 
                    color: isProfit ? pnlColors.positive : pnlColors.negative,
                    fontWeight: 600,
                  }}
                >
                  {isProfit ? '+' : ''}{formatPercentage(data.unrealizedPnLPercentage || 0)}
                </ResponsiveTypography>
              </Box>
            </Box>
          </Box>

            {/* Current Value Section */}
            <Box>
              <ResponsiveTypography variant="chartTooltip" sx={{ 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 500
              }}>
                Current Value
              </ResponsiveTypography>
              <ResponsiveTypography variant="tableCell" sx={{ 
                mt: 0.5,
                color: 'text.primary'
              }}>
                {formatCurrency(data.marketValue || 0, baseCurrency)}
              </ResponsiveTypography>
            </Box>

          {/* Performance Indicator */}
          <Box sx={{ 
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
            {isProfit ? (
              <ResponsiveTypography variant="chartTooltip" sx={{ 
                color: '#00C49F',
                fontWeight: 600
              }}>
                ↗ PROFIT
              </ResponsiveTypography>
            ) : (
              <ResponsiveTypography variant="chartTooltip" sx={{ 
                color: '#FF8042',
                fontWeight: 600
              }}>
                ↘ LOSS
              </ResponsiveTypography>
            )}
          </Box>
        </Box>
      );
    }
    return null;
  };

  if (!safeData || safeData.length === 0) {
    return (
      <Box>
        <ResponsiveTypography variant="chartTitle" sx={{ 
          textAlign: 'center'
        }}>
          {t('portfolio.unrealizedPLByAssetType')}
        </ResponsiveTypography>
        <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
          <ResponsiveTypography variant="formHelper" color="text.secondary">
            No data available
          </ResponsiveTypography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: compact ? 133 : 200,
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      px: { xs: 0, sm: 1 }
    }}>
      <ResponsiveTypography variant="chartTitle" sx={{ 
        textAlign: 'center'
      }}>
        {t('portfolio.unrealizedPLByAssetType')}
      </ResponsiveTypography>
      <Box sx={{ 
        flex: 1, 
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
      }}>
        <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
        <BarChart data={chartData} margin={{ 
          top: compact ? 2 : 10, 
          right: compact ? 0 : 10, 
          left: compact ? 0 : 10, 
          bottom: compact ? 2 : 10 
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
          <Tooltip content={<CustomTooltip pnlColors={pnlColors} />} />
          <Bar dataKey="unrealizedPnL" radius={compact ? [2, 2, 0, 0] : [4, 4, 0, 0]}>
            {chartData.map((entry, index) => {
              // Use configurable colors for positive/negative values
              const barColor = entry.isPositive ? pnlColors.positive : pnlColors.negative;
              
              return (
                <Cell key={`cell-${index}`} fill={barColor} />
              );
            })}
          </Bar>
        </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default UnrealizedPnLChart;
