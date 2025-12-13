/**
 * Expense by Category Chart Component
 * Displays expense breakdown by category (Living, Education, Insurance, Other)
 */

import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { formatCurrency, formatPercentageValue } from '../../utils/format';
import { useTranslation } from 'react-i18next';
import { SummaryMetrics } from '../../types/personalFinancialAnalysis.types';
import { ExpenseCategory } from '../../types/personalFinancialAnalysis.types';

interface ExpenseByCategoryChartProps {
  summaryMetrics: SummaryMetrics;
  baseCurrency?: string;
  height?: number;
}

const COLORS = {
  [ExpenseCategory.LIVING]: '#f44336',      // Red
  [ExpenseCategory.EDUCATION]: '#9c27b0',  // Purple
  [ExpenseCategory.INSURANCE]: '#2196f3',   // Blue
  [ExpenseCategory.OTHER]: '#ff9800',       // Orange
};

export const ExpenseByCategoryChart: React.FC<ExpenseByCategoryChartProps> = ({
  summaryMetrics,
  baseCurrency = 'VND',
  height = 300,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const chartData = [
    {
      name: t('personalFinancialAnalysis.expenseCategories.living'),
      value: summaryMetrics.totalLivingExpenses,
      category: ExpenseCategory.LIVING,
      percentage: (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses) > 0
        ? (summaryMetrics.totalLivingExpenses / (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses)) * 100
        : 0,
    },
    {
      name: t('personalFinancialAnalysis.expenseCategories.education'),
      value: summaryMetrics.totalEducationExpenses,
      category: ExpenseCategory.EDUCATION,
      percentage: (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses) > 0
        ? (summaryMetrics.totalEducationExpenses / (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses)) * 100
        : 0,
    },
    {
      name: t('personalFinancialAnalysis.expenseCategories.insurance'),
      value: summaryMetrics.totalInsuranceExpenses,
      category: ExpenseCategory.INSURANCE,
      percentage: (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses) > 0
        ? (summaryMetrics.totalInsuranceExpenses / (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses)) * 100
        : 0,
    },
    {
      name: t('personalFinancialAnalysis.expenseCategories.other'),
      value: summaryMetrics.totalOtherExpenses,
      category: ExpenseCategory.OTHER,
      percentage: (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses) > 0
        ? (summaryMetrics.totalOtherExpenses / (summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses)) * 100
        : 0,
    },
  ].filter((item) => item.value > 0); // Only show categories with expenses

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

  const totalExpenses = summaryMetrics.totalLivingExpenses + summaryMetrics.totalEducationExpenses + summaryMetrics.totalInsuranceExpenses + summaryMetrics.totalOtherExpenses;

  if (chartData.length === 0 || totalExpenses === 0) {
    return (
      <Box>
        <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
          {t('personalFinancialAnalysis.charts.expenseByCategory.title')}
        </ResponsiveTypography>
        <Paper sx={{ p: 2 }}>
          <ResponsiveTypography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {t('personalFinancialAnalysis.charts.expenseByCategory.noData')}
          </ResponsiveTypography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
        {t('personalFinancialAnalysis.charts.expenseByCategory.title')}
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

