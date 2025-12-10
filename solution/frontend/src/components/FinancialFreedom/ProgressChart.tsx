import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Label,
} from 'recharts';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { YearlyProjection } from '../../types/financialFreedom.types';
import { formatCurrency } from '../../utils/format';
import { useTranslation } from 'react-i18next';

interface ProgressChartProps {
  projections: YearlyProjection[];
  baseCurrency?: string;
  targetValue?: number;
  title?: string;
  height?: number;
  showTarget?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  projections,
  baseCurrency = 'VND',
  targetValue,
  title,
  height = 300,
  showTarget = true,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const chartData = projections.map((proj) => ({
    year: proj.year,
    portfolioValue: proj.portfolioValue,
    cumulativeValue: proj.cumulativeValue,
    contributions: proj.contributions,
    returns: proj.returns,
    targetValue: targetValue || proj.portfolioValue,
    progressToGoal: proj.progressToGoal,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 2,
            boxShadow: 4,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            minWidth: 200,
          }}
        >
          <Box sx={{ mb: 1.5, pb: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <ResponsiveTypography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {t('financialFreedom.chart.year')}: {label}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {payload.map((entry: any, index: number) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      backgroundColor: entry.color,
                      borderRadius: '50%',
                      border: `2px solid ${theme.palette.background.paper}`,
                      boxShadow: `0 0 0 1px ${entry.color}40`,
                    }}
                  />
                  <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                    {entry.name}
                  </ResponsiveTypography>
                </Box>
                <ResponsiveTypography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: entry.color,
                    minWidth: 'fit-content',
                  }}
                >
                  {formatCurrency(entry.value, baseCurrency)}
                </ResponsiveTypography>
              </Box>
            ))}
            {showTarget && targetValue && (
              <>
                <Box
                  sx={{
                    mt: 0.5,
                    pt: 1,
                    borderTop: `1px solid ${theme.palette.divider}`,
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        backgroundColor: '#2e7d32',
                        borderRadius: '50%',
                        border: `2px solid ${theme.palette.background.paper}`,
                        boxShadow: `0 0 0 1px #2e7d3240`,
                      }}
                    />
                    <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                      {t('financialFreedom.chart.targetValue')}
                    </ResponsiveTypography>
                  </Box>
                  <ResponsiveTypography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#2e7d32',
                      minWidth: 'fit-content',
                    }}
                  >
                    {formatCurrency(targetValue, baseCurrency)}
                  </ResponsiveTypography>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      {title && (
        <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
          {title}
        </ResponsiveTypography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: showTarget && targetValue ? 80 : 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1} />
            </linearGradient>
            {showTarget && targetValue && (
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2e7d32" stopOpacity={0.1} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="year"
            stroke={theme.palette.text.secondary}
            fontSize={isMobile ? 12 : 14}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            fontSize={isMobile ? 12 : 14}
            tickFormatter={(value) => formatCurrency(value, baseCurrency, { compact: true })}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="cumulativeValue"
            stroke="#1976d2"
            fillOpacity={1}
            fill="url(#colorPortfolio)"
            name={t('financialFreedom.chart.portfolioValue')}
          />
          {showTarget && targetValue && (
            <>
              <Line
                type="monotone"
                dataKey="targetValue"
                stroke="#2e7d32"
                strokeWidth={2}
                strokeDasharray="5 5"
                name={t('financialFreedom.chart.targetValue')}
              />
              <ReferenceLine
                y={targetValue}
                stroke="#2e7d32"
                strokeDasharray="5 5"
                strokeWidth={2}
              >
                <Label
                  value={t('financialFreedom.chart.target')}
                  position="top"
                  offset={5}
                  fill="#2e7d32"
                  fontSize={isMobile ? 11 : 12}
                  fontWeight={600}
                />
              </ReferenceLine>
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

