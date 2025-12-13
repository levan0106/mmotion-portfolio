/**
 * Step 2: Financial Analysis Component
 */

import React, { useState } from 'react';
import { Box, Grid, Paper, useTheme, List, ListItem, ListItemText, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField } from '@mui/material';
import {
  AccountBalance as AssetsIcon,
  CreditCard as DebtIcon,
  TrendingUp as NetWorthIcon,
  Percent as RatioIcon,
  HealthAndSafety as EmergencyIcon,
  AttachMoney as IncomeIcon,
  ShoppingCart as ExpenseIcon,
  Savings as SavingsIcon,
  Home as ConsumerIcon,
  Business as BusinessIcon,
  AccountBalanceWallet as FinancialIcon,
  Apartment as RealEstateIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { Step2FinancialAnalysisProps } from '../../types/personalFinancialAnalysis.types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/format';
import { useAccount } from '../../contexts/AccountContext';
import { useSummaryMetrics, useIncomeExpenseBreakdown } from '../../hooks/useAnalysisCalculations';
import { BalanceSheetChart } from './BalanceSheetChart';
import { AssetStructureChart } from './AssetStructureChart';
import { IncomeByCategoryChart } from './IncomeByCategoryChart';
import { ExpenseByCategoryChart } from './ExpenseByCategoryChart';
import { AssetPyramidChart } from './AssetPyramidChart';
import { AssetCategory, IncomeCategory, ExpenseCategory } from '../../types/personalFinancialAnalysis.types';

// Component for collapsible income category breakdown
const IncomeCategoryBreakdown: React.FC<{
  categories: Array<{ key: string; label: string; value: number }>;
  baseCurrency: string;
  expanded: boolean;
}> = ({ categories, baseCurrency, expanded }) => {
  if (!expanded) return null;
  
  return (
    <>
      {categories.map((item) => (
        <TableRow key={item.key}>
          <TableCell sx={{ borderBottom: 'none', py: 0.5, width: '50%', px: 2 }}>
            <Box sx={{ pl: 3 }}>
              <ResponsiveTypography variant="caption" color="text.secondary">
                {item.label}
              </ResponsiveTypography>
            </Box>
          </TableCell>
          <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
            <ResponsiveTypography variant="caption" sx={{ color: 'success.main' }} ellipsis={false}>
              {formatCurrency(item.value / 12, baseCurrency)}
            </ResponsiveTypography>
          </TableCell>
          <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
            <ResponsiveTypography variant="caption" sx={{ color: 'success.main' }} ellipsis={false}>
              {formatCurrency(item.value, baseCurrency)}
            </ResponsiveTypography>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

// Component for collapsible expense category breakdown
const ExpenseCategoryBreakdown: React.FC<{
  categories: Array<{ key: string; label: string; value: number }>;
  baseCurrency: string;
  expanded: boolean;
}> = ({ categories, baseCurrency, expanded }) => {
  if (!expanded) return null;
  
  return (
    <>
      {categories.map((item) => (
        <TableRow key={item.key}>
          <TableCell sx={{ borderBottom: 'none', py: 0.5, width: '50%', px: 2 }}>
            <Box sx={{ pl: 3 }}>
              <ResponsiveTypography variant="caption" color="text.secondary">
                {item.label}
              </ResponsiveTypography>
            </Box>
          </TableCell>
          <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
            <ResponsiveTypography variant="caption" sx={{ color: 'error.main' }} ellipsis={false}>
              {formatCurrency(item.value / 12, baseCurrency)}
            </ResponsiveTypography>
          </TableCell>
          <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
            <ResponsiveTypography variant="caption" sx={{ color: 'error.main' }} ellipsis={false}>
              {formatCurrency(item.value, baseCurrency)}
            </ResponsiveTypography>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

export const Step2FinancialAnalysis: React.FC<Step2FinancialAnalysisProps> = ({
  analysis,
  summaryMetrics: propsSummaryMetrics,
  incomeExpenseBreakdown: propsBreakdown,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { baseCurrency } = useAccount();
  const theme = useTheme();
  
  // Collapse state for Income and Expenses categories
  const [incomeExpanded, setIncomeExpanded] = useState(false);
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  
  // Notes state
  const [notes, setNotes] = useState(analysis.notes || '');
  
  // Handle notes change with debounce
  const handleNotesChange = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    setNotes(newNotes);
    
    // Auto-save notes
    if (onUpdate) {
      try {
        await onUpdate({ notes: newNotes });
      } catch (error) {
        console.error('Failed to update notes:', error);
      }
    }
  };
  
  // Use calculated metrics if not provided
  const calculatedMetrics = useSummaryMetrics(analysis);
  const calculatedBreakdown = useIncomeExpenseBreakdown(analysis);
  
  const summaryMetrics = propsSummaryMetrics || calculatedMetrics || {
    totalFamilyIncome: 0,
    totalBusinessIncome: 0,
    totalOtherIncome: 0,
    totalLivingExpenses: 0,
    totalEducationExpenses: 0,
    totalInsuranceExpenses: 0,
    totalOtherExpenses: 0,
    totalConsumerAssets: 0,
    totalBusinessAssets: 0,
    totalFinancialAssets: 0,
    totalRealEstateAssets: 0,
    totalAssets: 0,
    totalProtectionLayer: 0,
    totalIncomeGenerationLayer: 0,
    totalGrowthLayer: 0,
    totalRiskLayer: 0,
    emergencyFund: 0,
    emergencyFundRecommended: 0,
    totalDebt: 0,
    debtToAssetRatio: 0,
    netWorth: 0,
  };
  
  const incomeExpenseBreakdown = propsBreakdown || calculatedBreakdown || {
    monthlyPrincipalPayment: 0,
    annualPrincipalPayment: 0,
    monthlyInterestPayment: 0,
    annualInterestPayment: 0,
    monthlyTotalDebtPayment: 0,
    annualTotalDebtPayment: 0,
    debtPaymentToIncomeRatio: 0,
    totalMonthlyIncome: 0,
    totalAnnualIncome: 0,
    totalMonthlyExpenses: 0,
    totalAnnualExpenses: 0,
    expenseToIncomeRatio: 0,
    remainingMonthlySavings: 0,
    remainingAnnualSavings: 0,
    savingsToIncomeRatio: 0,
  };

  // Calculate breakdown from analysis data (Step 1)
  const assetBreakdown = analysis?.assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + asset.value;
    return acc;
  }, {} as Record<AssetCategory, number>) || {};

  const incomeBreakdown = analysis?.income.reduce((acc, income) => {
    acc[income.category] = (acc[income.category] || 0) + income.monthlyValue * 12;
    return acc;
  }, {} as Record<IncomeCategory, number>) || {};

  const expenseBreakdown = analysis?.expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.monthlyValue * 12;
    return acc;
  }, {} as Record<ExpenseCategory, number>) || {};

  // Key-value data for summary metrics
  const summaryMetricsData = [
    {
      key: 'totalAssets',
      label: t('personalFinancialAnalysis.metrics.totalAssets'),
      value: formatCurrency(summaryMetrics.totalAssets, baseCurrency),
      icon: <AssetsIcon />,
      color: theme.palette.primary.main,
    },
    {
      key: 'totalDebt',
      label: t('personalFinancialAnalysis.metrics.totalDebt'),
      value: formatCurrency(summaryMetrics.totalDebt, baseCurrency),
      icon: <DebtIcon />,
      color: theme.palette.error.main,
    },
    {
      key: 'netWorth',
      label: t('personalFinancialAnalysis.metrics.netWorth'),
      value: formatCurrency(summaryMetrics.netWorth, baseCurrency),
      icon: <NetWorthIcon />,
      color: summaryMetrics.netWorth >= 0 ? theme.palette.success.main : theme.palette.error.main,
    },
    {
      key: 'debtToAssetRatio',
      label: t('personalFinancialAnalysis.metrics.debtToAssetRatio'),
      value: `${summaryMetrics.debtToAssetRatio.toFixed(1)}%`,
      icon: <RatioIcon />,
      color: theme.palette.warning.main,
    },
    {
      key: 'emergencyFund',
      label: t('personalFinancialAnalysis.metrics.emergencyFund'),
      value: formatCurrency(summaryMetrics.emergencyFund, baseCurrency),
      icon: <EmergencyIcon />,
      color: theme.palette.info.main,
      secondary: t('personalFinancialAnalysis.metrics.recommended') + ': ' + formatCurrency(summaryMetrics.emergencyFundRecommended, baseCurrency),
    },
  ];

  // Asset breakdown by category
  const assetCategoryData = [
    {
      key: AssetCategory.CONSUMER,
      label: t('personalFinancialAnalysis.assetCategories.consumer'),
      value: assetBreakdown[AssetCategory.CONSUMER] || 0,
      icon: <ConsumerIcon />,
      color: theme.palette.primary.main,
    },
    {
      key: AssetCategory.BUSINESS,
      label: t('personalFinancialAnalysis.assetCategories.business'),
      value: assetBreakdown[AssetCategory.BUSINESS] || 0,
      icon: <BusinessIcon />,
      color: theme.palette.secondary.main,
    },
    {
      key: AssetCategory.FINANCIAL,
      label: t('personalFinancialAnalysis.assetCategories.financial'),
      value: assetBreakdown[AssetCategory.FINANCIAL] || 0,
      icon: <FinancialIcon />,
      color: theme.palette.warning.main,
    },
    {
      key: AssetCategory.REAL_ESTATE,
      label: t('personalFinancialAnalysis.assetCategories.realEstate'),
      value: assetBreakdown[AssetCategory.REAL_ESTATE] || 0,
      icon: <RealEstateIcon />,
      color: theme.palette.info.main,
    },
  ].filter((item) => item.value > 0);

  // Income breakdown by category
  const incomeCategoryData = [
    {
      key: IncomeCategory.FAMILY,
      label: t('personalFinancialAnalysis.incomeCategories.family'),
      value: incomeBreakdown[IncomeCategory.FAMILY] || 0,
    },
    {
      key: IncomeCategory.BUSINESS,
      label: t('personalFinancialAnalysis.incomeCategories.business'),
      value: incomeBreakdown[IncomeCategory.BUSINESS] || 0,
    },
    {
      key: IncomeCategory.OTHER,
      label: t('personalFinancialAnalysis.incomeCategories.other'),
      value: incomeBreakdown[IncomeCategory.OTHER] || 0,
    },
  ].filter((item) => item.value > 0);

  // Expense breakdown by category
  const expenseCategoryData = [
    {
      key: ExpenseCategory.LIVING,
      label: t('personalFinancialAnalysis.expenseCategories.living'),
      value: expenseBreakdown[ExpenseCategory.LIVING] || 0,
    },
    {
      key: ExpenseCategory.EDUCATION,
      label: t('personalFinancialAnalysis.expenseCategories.education'),
      value: expenseBreakdown[ExpenseCategory.EDUCATION] || 0,
    },
    {
      key: ExpenseCategory.INSURANCE,
      label: t('personalFinancialAnalysis.expenseCategories.insurance'),
      value: expenseBreakdown[ExpenseCategory.INSURANCE] || 0,
    },
    {
      key: ExpenseCategory.OTHER,
      label: t('personalFinancialAnalysis.expenseCategories.other'),
      value: expenseBreakdown[ExpenseCategory.OTHER] || 0,
    },
  ].filter((item) => item.value > 0);

  // Debt breakdown (always use principalAmount)
  const debtBreakdown = analysis?.debts.map((debt) => ({
    key: debt.id,
    label: debt.name,
    value: debt.principalAmount,
    monthlyPayment: debt.monthlyPayment,
    interestRate: debt.interestRate,
  })) || [];

  // Calculate total expenses including debt payments
  const totalMonthlyExpensesWithDebt = incomeExpenseBreakdown.totalMonthlyExpenses + incomeExpenseBreakdown.monthlyTotalDebtPayment;
  const totalAnnualExpensesWithDebt = incomeExpenseBreakdown.totalAnnualExpenses + incomeExpenseBreakdown.annualTotalDebtPayment;

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        {/* <ResponsiveTypography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          {t('personalFinancialAnalysis.steps.step2.title')}
        </ResponsiveTypography> */}
        <ResponsiveTypography variant="body2" color="text.secondary">
          {t('personalFinancialAnalysis.steps.step2.subtitle') || 'Comprehensive overview of your financial health'}
        </ResponsiveTypography>
      </Box>

      {/* Two Column Layout */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Left Column: Summary Metrics & Asset Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              backgroundColor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <ResponsiveTypography variant="h6" sx={{ mb: 2.5, fontWeight: 600 }}>
              {t('personalFinancialAnalysis.metrics.title')}
            </ResponsiveTypography>
            <List disablePadding>
              {summaryMetricsData.map((metric, index) => (
                <React.Fragment key={metric.key}>
                  <ListItem
                    disablePadding
                    sx={{
                      py: 1.5,
                      px: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          backgroundColor: metric.color + '15',
                          color: metric.color,
                          mr: 1.5,
                          flexShrink: 0,
                        }}
                      >
                        {metric.icon}
                      </Box>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ flex: 1, pr: 2 }}>
                              {metric.label}
                            </ResponsiveTypography>
                            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                              <ResponsiveTypography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: metric.color,
                                }}
                              >
                                {metric.value}
                              </ResponsiveTypography>
                              {metric.secondary && (
                                <ResponsiveTypography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  {metric.secondary}
                                </ResponsiveTypography>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </Box>
                  </ListItem>
                  {index < summaryMetricsData.length - 1 && (
                    <Box
                      component="hr"
                      sx={{
                        border: 'none',
                        borderTop: `1px solid ${theme.palette.divider}`,
                        my: 0,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>

          {/* Asset Breakdown by Category */}
          {assetCategoryData.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    backgroundColor: theme.palette.primary.main + '15',
                    color: theme.palette.primary.main,
                    mr: 1.5,
                  }}
                >
                  <AssetsIcon />
                </Box>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('personalFinancialAnalysis.assets.title')}
                </ResponsiveTypography>
              </Box>
              <List disablePadding>
                {assetCategoryData.map((item, index) => (
                  <React.Fragment key={item.key}>
                    <ListItem
                      disablePadding
                      sx={{
                        py: 1,
                        px: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            backgroundColor: item.color + '15',
                            color: item.color,
                            mr: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <ResponsiveTypography variant="body2" color="text.secondary" sx={{ flex: 1, pr: 2 }}>
                                {item.label}
                              </ResponsiveTypography>
                              <ResponsiveTypography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: item.color,
                                  flexShrink: 0,
                                }}
                              >
                                {formatCurrency(item.value, baseCurrency)}
                              </ResponsiveTypography>
                            </Box>
                          }
                        />
                      </Box>
                    </ListItem>
                    {index < assetCategoryData.length - 1 && (
                      <Box
                        component="hr"
                        sx={{
                          border: 'none',
                          borderTop: `1px solid ${theme.palette.divider}`,
                          my: 0,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Grid>

        {/* Right Column: Income/Expense Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              backgroundColor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
            }}
          >
            <ResponsiveTypography variant="h6" sx={{ mb: 2.5, fontWeight: 600 }}>
              {t('personalFinancialAnalysis.incomeExpenseBreakdown.title')}
            </ResponsiveTypography>
            
            {/* Income Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    backgroundColor: theme.palette.success.main + '15',
                    color: theme.palette.success.main,
                    mr: 1.5,
                  }}
                >
                  <IncomeIcon />
                </Box>
                <ResponsiveTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('personalFinancialAnalysis.incomeExpenseBreakdown.income')}
                </ResponsiveTypography>
              </Box>
              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '50%', px: 2 }}>
                        {incomeCategoryData.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => setIncomeExpanded(!incomeExpanded)}
                            sx={{ p: 0.5, ml: -1 }}
                          >
                            {incomeExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '25%', px: 2 }}>
                        {t('personalFinancialAnalysis.incomeExpenseBreakdown.monthly')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '25%', px: 2 }}>
                        {t('personalFinancialAnalysis.incomeExpenseBreakdown.annual')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5, width: '50%', px: 2 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('common.total')}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.totalMonthlyIncome, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.totalAnnualIncome, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                    </TableRow>
                    {incomeCategoryData.length > 0 && (
                      <IncomeCategoryBreakdown
                        categories={incomeCategoryData}
                        baseCurrency={baseCurrency}
                        expanded={incomeExpanded}
                      />
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Expenses Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    backgroundColor: theme.palette.error.main + '15',
                    color: theme.palette.error.main,
                    mr: 1.5,
                  }}
                >
                  <ExpenseIcon />
                </Box>
                <ResponsiveTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('personalFinancialAnalysis.incomeExpenseBreakdown.expenses')}
                </ResponsiveTypography>
              </Box>
              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '50%', px: 2 }}>
                        {expenseCategoryData.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => setExpensesExpanded(!expensesExpanded)}
                            sx={{ p: 0.5, ml: -1 }}
                          >
                            {expensesExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '25%', px: 2 }}>
                        {t('personalFinancialAnalysis.incomeExpenseBreakdown.monthly')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '25%', px: 2 }}>
                        {t('personalFinancialAnalysis.incomeExpenseBreakdown.annual')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5, width: '50%', px: 2 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('personalFinancialAnalysis.expenses.title')}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.totalMonthlyExpenses, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.totalAnnualExpenses, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                    </TableRow>
                    {expenseCategoryData.length > 0 && (
                      <ExpenseCategoryBreakdown
                        categories={expenseCategoryData}
                        baseCurrency={baseCurrency}
                        expanded={expensesExpanded}
                      />
                    )}
                    <TableRow>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5, width: '50%', px: 2 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('personalFinancialAnalysis.debts.title')}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.monthlyTotalDebtPayment, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.annualTotalDebtPayment, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell sx={{ borderBottom: 'none', py: 1, pt: 1.5, width: '50%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600 }}>
                          {t('common.total')}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 1, pt: 1.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }} ellipsis={false}>
                          {formatCurrency(totalMonthlyExpensesWithDebt, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 1, pt: 1.5, width: '25%', px: 2 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }} ellipsis={false}>
                          {formatCurrency(totalAnnualExpensesWithDebt, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Savings Section */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    backgroundColor: (incomeExpenseBreakdown.remainingAnnualSavings >= 0 ? theme.palette.success.main : theme.palette.error.main) + '15',
                    color: incomeExpenseBreakdown.remainingAnnualSavings >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    mr: 1.5,
                  }}
                >
                  <SavingsIcon />
                </Box>
                <ResponsiveTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('personalFinancialAnalysis.incomeExpenseBreakdown.savings')}
                </ResponsiveTypography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '50%' }}></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '25%' }}>
                        {t('personalFinancialAnalysis.incomeExpenseBreakdown.monthly')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, borderBottom: 'none', pb: 0.5, width: '25%' }}>
                        {t('personalFinancialAnalysis.incomeExpenseBreakdown.annual')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ borderBottom: 'none', py: 0.5 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('common.total')}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: incomeExpenseBreakdown.remainingMonthlySavings >= 0 ? 'success.main' : 'error.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.remainingMonthlySavings, baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none', py: 0.5 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: incomeExpenseBreakdown.remainingAnnualSavings >= 0 ? 'success.main' : 'error.main' }} ellipsis={false}>
                          {formatCurrency(incomeExpenseBreakdown.remainingAnnualSavings, baseCurrency)}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          ({t('personalFinancialAnalysis.incomeExpenseBreakdown.percentageOfIncome', { percentage: incomeExpenseBreakdown.savingsToIncomeRatio.toFixed(1) })})
                        </ResponsiveTypography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>

          {/* Debt Breakdown */}
          {debtBreakdown.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    backgroundColor: theme.palette.error.main + '15',
                    color: theme.palette.error.main,
                    mr: 1.5,
                  }}
                >
                  <DebtIcon />
                </Box>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('personalFinancialAnalysis.debts.title')}
                </ResponsiveTypography>
              </Box>
              <List disablePadding>
                {debtBreakdown.map((debt, index) => (
                  <React.Fragment key={debt.key}>
                    <ListItem
                      disablePadding
                      sx={{
                        py: 1,
                        px: 0,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', mb: 0.5 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                          {debt.label}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }} ellipsis={false}>
                          {formatCurrency(debt.value, baseCurrency)}
                        </ResponsiveTypography>
                      </Box>
                      <Box sx={{ pl: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ResponsiveTypography variant="caption" color="text.secondary" ellipsis={false}>
                          {t('personalFinancialAnalysis.debts.monthlyPayment')}: {formatCurrency(debt.monthlyPayment, baseCurrency)}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="caption" color="text.secondary" ellipsis={false}>
                          {debt.interestRate.toFixed(1)}% {t('personalFinancialAnalysis.debts.interestRate')}
                        </ResponsiveTypography>
                      </Box>
                    </ListItem>
                    {index < debtBreakdown.length - 1 && (
                      <Box
                        component="hr"
                        sx={{
                          border: 'none',
                          borderTop: `1px solid ${theme.palette.divider}`,
                          my: 0,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Charts Section - Full Width */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <ResponsiveTypography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          {t('personalFinancialAnalysis.charts.title')}
        </ResponsiveTypography>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <BalanceSheetChart
              summaryMetrics={summaryMetrics}
              incomeExpenseBreakdown={incomeExpenseBreakdown}
              analysis={analysis}
              baseCurrency={baseCurrency}
              height={400}
            />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Paper
              elevation={0}
            >
              <ResponsiveTypography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('personalFinancialAnalysis.notes.title') || 'Nhận định về kết quả tài chính'}
              </ResponsiveTypography>
              <TextField
                multiline
                minRows={8}
                maxRows={15}
                fullWidth
                value={notes}
                onChange={handleNotesChange}
                placeholder={t('personalFinancialAnalysis.notes.placeholder') || 'Nhập ghi chú về kết quả phân tích tài chính của bạn...'}
                variant="outlined"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& textarea': {
                    resize: 'vertical', // Allow vertical resizing
                  },
                }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <AssetStructureChart
              summaryMetrics={summaryMetrics}
              baseCurrency={baseCurrency}
              height={300}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <Box>
              <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
                {t('personalFinancialAnalysis.charts.assetPyramid.title')}
              </ResponsiveTypography>
              <Paper sx={{ p: 2 }}>
                <AssetPyramidChart
                  summaryMetrics={summaryMetrics}
                  baseCurrency={baseCurrency}
                  height={300}
                />
              </Paper>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <IncomeByCategoryChart
              summaryMetrics={summaryMetrics}
              baseCurrency={baseCurrency}
              height={300}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <ExpenseByCategoryChart
              summaryMetrics={summaryMetrics}
              baseCurrency={baseCurrency}
              height={300}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
