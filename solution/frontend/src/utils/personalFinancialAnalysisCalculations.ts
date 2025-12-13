/**
 * Calculation utilities for Personal Financial Analysis System
 */

import {
  AnalysisAsset,
  AnalysisIncome,
  AnalysisExpense,
  AnalysisDebt,
  SummaryMetrics,
  IncomeExpenseBreakdown,
  AssetCategory,
  AssetLayer,
  IncomeCategory,
  ExpenseCategory,
} from '../types/personalFinancialAnalysis.types';

/**
 * Map asset category to asset layer
 * This is a default mapping, can be overridden by explicit layer assignment
 */
export function getAssetLayer(asset: AnalysisAsset): AssetLayer {
  // If layer is explicitly set, use it
  if (asset.layer) {
    return asset.layer;
  }

  // Default mapping based on category and asset type
  // Protection Layer: Cash, savings, emergency fund, insurance
  if (asset.category === AssetCategory.CONSUMER) {
    return AssetLayer.PROTECTION;
  }

  // Income Generation Layer: Real estate (rental), bonds, dividend stocks
  if (asset.category === AssetCategory.REAL_ESTATE) {
    return AssetLayer.INCOME_GENERATION;
  }

  // Growth Layer: Business assets, balanced investments
  if (asset.category === AssetCategory.BUSINESS) {
    return AssetLayer.GROWTH;
  }

  // Risk Layer: Financial investments (stocks, crypto, high-risk assets)
  if (asset.category === AssetCategory.FINANCIAL) {
    // Can be further refined based on assetType if available
    if (asset.assetType === 'BOND' || asset.assetType === 'FIXED_INCOME') {
      return AssetLayer.INCOME_GENERATION;
    }
    return AssetLayer.RISK;
  }

  // Default to protection layer for safety
  return AssetLayer.PROTECTION;
}

/**
 * Calculate summary metrics from analysis data
 * @param data - Analysis data containing assets, income, expenses, and debts
 * @returns Calculated summary metrics
 */
export function calculateSummaryMetrics(data: {
  assets: AnalysisAsset[];
  income: AnalysisIncome[];
  expenses: AnalysisExpense[];
  debts: AnalysisDebt[];
}): SummaryMetrics {
  // Calculate total income by category
  const totalFamilyIncome = data.income
    .filter((i) => i.category === IncomeCategory.FAMILY)
    .reduce((sum, i) => sum + i.monthlyValue * 12, 0);

  const totalBusinessIncome = data.income
    .filter((i) => i.category === IncomeCategory.BUSINESS)
    .reduce((sum, i) => sum + i.monthlyValue * 12, 0);

  const totalOtherIncome = data.income
    .filter((i) => i.category === IncomeCategory.OTHER)
    .reduce((sum, i) => sum + i.monthlyValue * 12, 0);

  // Calculate total expenses by category
  const totalLivingExpenses = data.expenses
    .filter((e) => e.category === ExpenseCategory.LIVING)
    .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

  const totalEducationExpenses = data.expenses
    .filter((e) => e.category === ExpenseCategory.EDUCATION)
    .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

  const totalInsuranceExpenses = data.expenses
    .filter((e) => e.category === ExpenseCategory.INSURANCE)
    .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

  const totalOtherExpenses = data.expenses
    .filter((e) => e.category === ExpenseCategory.OTHER)
    .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

  // Calculate total assets by category
  const totalConsumerAssets = data.assets
    .filter((a) => a.category === AssetCategory.CONSUMER)
    .reduce((sum, a) => sum + a.value, 0);

  const totalBusinessAssets = data.assets
    .filter((a) => a.category === AssetCategory.BUSINESS)
    .reduce((sum, a) => sum + a.value, 0);

  const totalFinancialAssets = data.assets
    .filter((a) => a.category === AssetCategory.FINANCIAL)
    .reduce((sum, a) => sum + a.value, 0);

  const totalRealEstateAssets = data.assets
    .filter((a) => a.category === AssetCategory.REAL_ESTATE)
    .reduce((sum, a) => sum + a.value, 0);

  const totalAssets = totalConsumerAssets + totalBusinessAssets + totalFinancialAssets + totalRealEstateAssets;

  // Calculate total assets by layer
  const totalProtectionLayer = data.assets
    .filter((a) => getAssetLayer(a) === AssetLayer.PROTECTION)
    .reduce((sum, a) => sum + a.value, 0);

  const totalIncomeGenerationLayer = data.assets
    .filter((a) => getAssetLayer(a) === AssetLayer.INCOME_GENERATION)
    .reduce((sum, a) => sum + a.value, 0);

  const totalGrowthLayer = data.assets
    .filter((a) => getAssetLayer(a) === AssetLayer.GROWTH)
    .reduce((sum, a) => sum + a.value, 0);

  const totalRiskLayer = data.assets
    .filter((a) => getAssetLayer(a) === AssetLayer.RISK)
    .reduce((sum, a) => sum + a.value, 0);

  // Calculate total debt (always use principalAmount)
  const totalDebt = data.debts.reduce(
    (sum, d) => sum + d.principalAmount,
    0
  );

  // Calculate debt-to-asset ratio
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

  // Calculate net worth
  const netWorth = totalAssets - totalDebt;

  // Calculate emergency fund recommendation (6 months of total expenses)
  const totalMonthlyExpenses = data.expenses.reduce((sum, e) => sum + e.monthlyValue, 0);
  const emergencyFundRecommended = totalMonthlyExpenses * 6;

  // Calculate emergency fund from assets marked as emergency fund
  const emergencyFund = data.assets
    .filter((a) => a.isEmergencyFund === true)
    .reduce((sum, a) => sum + a.value, 0);

  return {
    totalFamilyIncome,
    totalBusinessIncome,
    totalOtherIncome,
    totalLivingExpenses,
    totalEducationExpenses,
    totalInsuranceExpenses,
    totalOtherExpenses,
    totalConsumerAssets,
    totalBusinessAssets,
    totalFinancialAssets,
    totalRealEstateAssets,
    totalAssets,
    totalProtectionLayer,
    totalIncomeGenerationLayer,
    totalGrowthLayer,
    totalRiskLayer,
    emergencyFund,
    emergencyFundRecommended,
    totalDebt,
    debtToAssetRatio,
    netWorth,
  };
}

/**
 * Calculate income and expense breakdown
 * @param data - Analysis data containing income, expenses, and debts
 * @returns Calculated income and expense breakdown
 */
export function calculateIncomeExpenseBreakdown(data: {
  income: AnalysisIncome[];
  expenses: AnalysisExpense[];
  debts: AnalysisDebt[];
}): IncomeExpenseBreakdown {
  // Calculate debt payments
  const monthlyPrincipalPayment = data.debts.reduce((sum, d) => {
    // Principal payment = monthly payment - interest payment
    // Always use principalAmount for interest calculation
    const monthlyInterest = (d.principalAmount * d.interestRate) / 100 / 12;
    return sum + Math.max(0, d.monthlyPayment - monthlyInterest);
  }, 0);

  const annualPrincipalPayment = monthlyPrincipalPayment * 12;

  const monthlyInterestPayment = data.debts.reduce((sum, d) => {
    // Always use principalAmount for interest calculation
    const monthlyInterest = (d.principalAmount * d.interestRate) / 100 / 12;
    return sum + Math.min(monthlyInterest, d.monthlyPayment);
  }, 0);

  const annualInterestPayment = monthlyInterestPayment * 12;

  const monthlyTotalDebtPayment = data.debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const annualTotalDebtPayment = monthlyTotalDebtPayment * 12;

  // Calculate total income
  const totalMonthlyIncome = data.income.reduce((sum, i) => sum + i.monthlyValue, 0);
  const totalAnnualIncome = totalMonthlyIncome * 12;

  // Calculate total expenses (excluding debt payments)
  const totalMonthlyExpenses = data.expenses.reduce((sum, e) => sum + e.monthlyValue, 0);
  const totalAnnualExpenses = totalMonthlyExpenses * 12;

  // Calculate ratios
  const debtPaymentToIncomeRatio =
    totalAnnualIncome > 0 ? (annualTotalDebtPayment / totalAnnualIncome) * 100 : 0;

  const expenseToIncomeRatio =
    totalAnnualIncome > 0 ? (totalAnnualExpenses / totalAnnualIncome) * 100 : 0;

  // Calculate remaining savings
  const remainingMonthlySavings =
    totalMonthlyIncome - totalMonthlyExpenses - monthlyTotalDebtPayment;
  const remainingAnnualSavings = remainingMonthlySavings * 12;

  const savingsToIncomeRatio =
    totalAnnualIncome > 0 ? (remainingAnnualSavings / totalAnnualIncome) * 100 : 0;

  return {
    monthlyPrincipalPayment,
    annualPrincipalPayment,
    monthlyInterestPayment,
    annualInterestPayment,
    monthlyTotalDebtPayment,
    annualTotalDebtPayment,
    debtPaymentToIncomeRatio,
    totalMonthlyIncome,
    totalAnnualIncome,
    totalMonthlyExpenses,
    totalAnnualExpenses,
    expenseToIncomeRatio,
    remainingMonthlySavings,
    remainingAnnualSavings,
    savingsToIncomeRatio,
  };
}

/**
 * Calculate metrics for a scenario
 * @param scenario - Scenario data
 * @returns Calculated summary metrics for the scenario
 */
export function calculateScenarioMetrics(scenario: {
  assets: AnalysisAsset[];
  income: AnalysisIncome[];
  expenses: AnalysisExpense[];
  debts: AnalysisDebt[];
}): SummaryMetrics {
  return calculateSummaryMetrics(scenario);
}

/**
 * Calculate income and expense breakdown for a scenario
 * @param scenario - Scenario data
 * @returns Calculated income and expense breakdown for the scenario
 */
export function calculateScenarioBreakdown(scenario: {
  income: AnalysisIncome[];
  expenses: AnalysisExpense[];
  debts: AnalysisDebt[];
}): IncomeExpenseBreakdown {
  return calculateIncomeExpenseBreakdown(scenario);
}

