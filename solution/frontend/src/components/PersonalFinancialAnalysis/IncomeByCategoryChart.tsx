/**
 * Income by Category Chart Component
 * Displays income breakdown by category (Family, Business, Other)
 */

import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { formatCurrency, formatPercentageValue } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import { SummaryMetrics } from '../../types/personalFinancialAnalysis.types';
import { IncomeCategory } from '../../types/personalFinancialAnalysis.types';

interface IncomeByCategoryChartProps {
  summaryMetrics: SummaryMetrics;
  baseCurrency?: string;
  height?: number;
}

const COLORS = {
  [IncomeCategory.FAMILY]: '#4caf50',      // Green
  [IncomeCategory.BUSINESS]: '#2196f3',   // Blue
  [IncomeCategory.OTHER]: '#ff9800',       // Orange
};

export const IncomeByCategoryChart: React.FC<IncomeByCategoryChartProps> = ({
  summaryMetrics,
  baseCurrency = 'VND',
  height = 300,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const chartData = [
    {
      name: t('personalFinancialAnalysis.incomeCategories.family'),
      value: summaryMetrics.totalFamilyIncome,
      category: IncomeCategory.FAMILY,
      percentage: (summaryMetrics.totalFamilyIncome + summaryMetrics.totalBusinessIncome + summaryMetrics.totalOtherIncome) > 0
        ? (summaryMetrics.totalFamilyIncome / (summaryMetrics.totalFamilyIncome + summaryMetrics.totalBusinessIncome + summaryMetrics.totalOtherIncome)) * 100
        : 0,
    },
    {
      name: t('personalFinancialAnalysis.incomeCategories.business'),
      value: summaryMetrics.totalBusinessIncome,
      category: IncomeCategory.BUSINESS,
      percentage: (summaryMetrics.totalFamilyIncome + summaryMetrics.totalBusinessIncome + summaryMetrics.totalOtherIncome) > 0
        ? (summaryMetrics.totalBusinessIncome / (summaryMetrics.totalFamilyIncome + summaryMetrics.totalBusinessIncome + summaryMetrics.totalOtherIncome)) * 100
        : 0,
    },
    {
      name: t('personalFinancialAnalysis.incomeCategories.other'),
      value: summaryMetrics.totalOtherIncome,
      category: IncomeCategory.OTHER,
      percentage: (summaryMetrics.totalFamilyIncome + summaryMetrics.totalBusinessIncome + summaryMetrics.totalOtherIncome) > 0
        ? (summaryMetrics.totalOtherIncome / (summaryMetrics.totalFamilyIncome + summaryMetrics.totalBusinessIncome + summaryMetrics.totalOtherIncome)) * 100
        : 0,
    },
  ].filter((item) => item.value > 0); // Only show categories with income

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper
          elevation={4}
          sx={{
            p: 2,
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1.5,
            minWidth: 200,
            boxShadow: theme.shadows[8],
          }}
        >
          <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {data.name}
          </ResponsiveTypography>
          <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <ResponsiveTypography variant="caption" color="text.secondary">
                {t('personalFinancialAnalysis.incomeExpenseBreakdown.total')}:
              </ResponsiveTypography>
              <ResponsiveTypography variant="caption" sx={{ fontWeight: 600 }}>
                {formatCurrency(data.value, baseCurrency)}
              </ResponsiveTypography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <ResponsiveTypography variant="caption" color="text.secondary">
                {t('common.percentage')}:
              </ResponsiveTypography>
              <ResponsiveTypography variant="caption" sx={{ fontWeight: 600, color: data.payload.fill }}>
                {formatPercentageValue(data.percentage)}
              </ResponsiveTypography>
            </Box>
          </Box>
        </Paper>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any): React.ReactNode => {
    if (percent < 0.05) return null; // Don't show label if slice is too small
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isMobile ? 10 : 12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalIncome = summaryMetrics.totalFamilyIncome + summaryMetrics.totalBusinessIncome + summaryMetrics.totalOtherIncome;

  if (chartData.length === 0 || totalIncome === 0) {
    return (
      <Box>
        <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
          {t('personalFinancialAnalysis.charts.incomeByCategory.title')}
        </ResponsiveTypography>
        <Paper sx={{ p: 2 }}>
          <ResponsiveTypography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('personalFinancialAnalysis.charts.incomeByCategory.noData')}
          </ResponsiveTypography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
        {t('personalFinancialAnalysis.charts.incomeByCategory.title')}
      </ResponsiveTypography>
      <Paper sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={isMobile ? 80 : 100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[chartData[index].category]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => {
                const data = chartData.find((d) => d.name === value);
                return `${value}: ${formatPercentageValue(data?.percentage || 0)}`;
              }}
              wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

