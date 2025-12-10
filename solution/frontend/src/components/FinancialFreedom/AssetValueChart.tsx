import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { formatCurrency } from '../../utils/format';
import { useTranslation } from 'react-i18next';

interface AssetValueChartProps {
  projections: Array<{ year: number; value: number; totalFutureValuePresentValue: number; totalCapital: number }>;
  baseCurrency?: string;
  height?: number;
  inflationRate?: number;
}

export const AssetValueChart: React.FC<AssetValueChartProps> = ({
  projections,
  baseCurrency = 'VND',
  height = 300,
  inflationRate: _inflationRate = 4.5, // Prefix with _ to indicate intentionally unused
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          </Box>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
        {t('financialFreedom.chart.assetValueOverTime')}
      </ResponsiveTypography>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={projections} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="year"
            stroke={theme.palette.text.secondary}
            fontSize={isMobile ? 12 : 14}
            // label={{ value: t('financialFreedom.chart.year'), position: 'outsideBottom' }}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            fontSize={isMobile ? 12 : 14}
            tickFormatter={(value) => formatCurrency(value, baseCurrency, { compact: true })}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            formatter={(value) => (
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>{value}</span>
            )}
          />
          {/* Thứ tự: Tổng giá trị danh nghĩa > Tổng giá trị thực > Vốn góp */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={t('financialFreedom.chart.totalFutureValue')}
          />
          <Line
            type="monotone"
            dataKey="totalFutureValuePresentValue"
            stroke="#2e7d32"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={t('financialFreedom.chart.totalFutureValuePresentValue')}
          />
          <Line
            type="monotone"
            dataKey="totalCapital"
            stroke="#ff9800"
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={t('financialFreedom.chart.totalCapital')}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

