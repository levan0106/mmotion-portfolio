/**
 * Risk-Return Scatter Plot component
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Box, Paper } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { ResponsiveFormSelect } from '../Common/ResponsiveFormControl';
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
  onPeriodChange?: (period: string) => void;
  selectedPeriod?: string;
}

const RiskReturnChart: React.FC<RiskReturnChartProps> = ({
  data,
  baseCurrency,
  title = 'Risk-Return Analysis',
  compact = false,
  onPeriodChange,
  selectedPeriod = '1Y',
}) => {
  const { t } = useTranslation();
  const [localPeriod, setLocalPeriod] = useState(selectedPeriod);

  const handlePeriodChange = (value: string | number) => {
    const newPeriod = String(value);
    setLocalPeriod(newPeriod);
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };
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
            <ResponsiveTypography variant="cardTitle" sx={{ fontSize: '0.9rem' }}>
              {data.assetType.toUpperCase()}
            </ResponsiveTypography>
          </Box>

          {/* Return Section */}
          <Box sx={{ mb: 1.5 }}>
            <ResponsiveTypography variant="formHelper" sx={{ 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              {t('portfolio.returnBubbleSize')}
            </ResponsiveTypography>
            <ResponsiveTypography 
              variant="cardValue" 
              sx={{ 
                color: isPositiveReturn ? '#00C49F' : '#FF8042',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                mt: 0.5
              }}
            >
              {isPositiveReturn ? '+' : ''}{formatPercentage(data.return)}
            </ResponsiveTypography>
            <ResponsiveTypography variant="formHelper" sx={{ 
              fontStyle: 'italic',
              mt: 0.5,
              display: 'block'
            }}>
              {t('portfolio.bubbleSizeDescription')}
            </ResponsiveTypography>
          </Box>

          {/* Risk Section */}
          <Box sx={{ mb: 1.5 }}>
            <ResponsiveTypography variant="formHelper" sx={{ 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              {t('portfolio.riskVolatility')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ 
              mt: 0.5,
              fontSize: '0.85rem',
              color: 'text.primary'
            }}>
              {formatPercentage(data.risk)}
            </ResponsiveTypography>
          </Box>

          {/* Value Section */}
          <Box sx={{ mb: 1.5 }}>
            <ResponsiveTypography variant="formHelper" sx={{ 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              {t('portfolio.portfolioValue')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ 
              mt: 0.5,
              fontSize: '0.85rem',
              color: 'text.primary'
            }}>
              {formatCurrency(data.value, baseCurrency)}
            </ResponsiveTypography>
          </Box>

          {/* Performance Rating Section */}
          <Box sx={{ mb: 1.5 }}>
            <ResponsiveTypography variant="formHelper" sx={{ 
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 500
            }}>
              {t('portfolio.performanceRating')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell" sx={{ 
              mt: 0.5,
              fontSize: '0.85rem',
              color: data.return > 0 ? 'success.main' : data.return < -5 ? 'error.main' : 'warning.main'
            }}>
              {data.return > 10 ? t('portfolio.excellent') : 
               data.return > 5 ? t('portfolio.good') : 
               data.return > 0 ? t('portfolio.positive') : 
               data.return > -5 ? t('portfolio.poor') : t('portfolio.veryPoor')}
            </ResponsiveTypography>
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
              <ResponsiveTypography variant="statusText" sx={{ 
                color: '#00C49F',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↗ {t('portfolio.highReturn')}
              </ResponsiveTypography>
            ) : (
              <ResponsiveTypography variant="statusText" sx={{ 
                color: '#FF8042',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                ↘ {t('portfolio.lowReturn')}
              </ResponsiveTypography>
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
        <ResponsiveTypography variant={compact ? "formHelper" : "cardTitle"} color="text.secondary">
          {t('portfolio.noRiskReturnData')}
        </ResponsiveTypography>
      </Box>
    );
  }

  // Calculate bubble sizes for all data points

  const dataWithBubbleSizes = data.map((entry) => {
    // Calculate bubble size based on return value for quick performance review
    const minSize = 15;   // Kích thước tối thiểu
    const maxSize = 40;  // Kích thước tối đa
    
    // Sử dụng return value để bubble size phản ánh hiệu quả (dương = tốt, âm = xấu)
    const returns = data.map(d => d.return);
    const minReturn = Math.min(...returns);
    const maxReturn = Math.max(...returns);
    const returnRange = maxReturn - minReturn;
    
    let bubbleSize = minSize;
    if (returnRange > 0) {
      // Normalize return value to 0-1 range
      const normalizedReturn = (entry.return - minReturn) / returnRange;
      
      // Áp dụng power function để tăng contrast và làm nổi bật hiệu quả cao
      const enhancedNormalized = Math.pow(normalizedReturn, 0.5); // 0.5 để tăng contrast
      
      // Scale to bubble size range
      bubbleSize = minSize + (enhancedNormalized * (maxSize - minSize));
      
      // Đảm bảo không vượt quá maxSize
      bubbleSize = Math.min(bubbleSize, maxSize);
    } else {
      // Nếu tất cả return giống nhau, dùng kích thước trung bình
      bubbleSize = (minSize + maxSize) / 2;
    }
    
    // Đảm bảo bubble size tối thiểu
    bubbleSize = Math.max(bubbleSize, minSize);
    
    return {
      ...entry,
      size: bubbleSize
    };
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: compact ? 1 : 2 }}>
        <Box>
          <ResponsiveTypography variant="chartTitle" sx={{ 
            mb: 0
          }}>
            {title}
          </ResponsiveTypography>
          <ResponsiveTypography variant="chartSubtitle" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {t('portfolio.riskVsReturnAnalysis')}
          </ResponsiveTypography>
        </Box>
        
        {onPeriodChange && (
          <ResponsiveFormSelect
            compact={compact}
            size="small"
            options={[
              { value: '1M', label: '1M' },
              { value: '3M', label: '3M' },
              { value: '1Y', label: '1Y' },
            ]}
            value={localPeriod}
            onChange={handlePeriodChange}
          />
        )}
      </Box>
      
      {/* <ResponsiveTypography variant="formHelper" color="text.secondary" sx={{ 
        mb: compact ? 1 : 2,
        fontStyle: 'italic'
      }}>
        • Bubble size represents return performance - larger bubbles indicate higher returns (better performance)
      </ResponsiveTypography> */}
      <Box sx={{ 
        height: compact ? 167 : 267,
        px: { xs: 0, sm: 1 },
        mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ 
            top: compact ? 10 : 20, 
            right: compact ? 0 : 20, 
            bottom: compact ? 10 : 20, 
            left: compact ? 0 : 20 
          }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="risk"
              name="Risk"
              tickFormatter={(value) => formatPercentage(value)}
              tick={{ fontSize: compact ? 10 : 12 }}
              label={{ 
                value: t('portfolio.riskVolatility'), 
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
                value: t('portfolio.return'), 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: compact ? '0.7rem' : '0.8rem' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {dataWithBubbleSizes.map((entry, index) => {
              // Create custom shape component for each bubble size
              const CustomShape = (props: any) => {
                const { cx, cy, fill } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={entry.size || 20}
                    fill={fill}
                    fillOpacity={0.7}
                    stroke="#fff"
                    strokeWidth={2}
                    strokeOpacity={0.9}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.setAttribute('fillOpacity', '0.9');
                      e.currentTarget.setAttribute('strokeWidth', '3');
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('fillOpacity', '0.7');
                      e.currentTarget.setAttribute('strokeWidth', '2');
                    }}
                  />
                );
              };

              return (
                <Scatter 
                  key={`scatter-${index}`}
                  data={[entry]}
                  shape={CustomShape}
                >
                  <Cell fill={entry.color} />
                </Scatter>
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default RiskReturnChart;
