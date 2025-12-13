import { Injectable, Logger } from '@nestjs/common';
import {
  PersonalFinancialAnalysis,
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
} from '../entities/personal-financial-analysis.entity';

/**
 * Analysis Calculation Service
 * Provides calculation methods for summary metrics and income/expense breakdown
 */
@Injectable()
export class AnalysisCalculationService {
  private readonly logger = new Logger(AnalysisCalculationService.name);

  /**
   * Map asset category to asset layer
   * This is a default mapping, can be overridden by explicit layer assignment
   */
  private getAssetLayer(asset: AnalysisAsset): AssetLayer {
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
   * @param analysis - PersonalFinancialAnalysis entity
   * @returns Calculated summary metrics
   */
  calculateSummaryMetrics(analysis: PersonalFinancialAnalysis): SummaryMetrics {
    const assets = analysis.assets || [];
    const income = analysis.income || [];
    const expenses = analysis.expenses || [];
    const debts = analysis.debts || [];

    // Calculate total income by category
    const totalFamilyIncome = income
      .filter((i) => i.category === IncomeCategory.FAMILY)
      .reduce((sum, i) => sum + i.monthlyValue * 12, 0);

    const totalBusinessIncome = income
      .filter((i) => i.category === IncomeCategory.BUSINESS)
      .reduce((sum, i) => sum + i.monthlyValue * 12, 0);

    const totalOtherIncome = income
      .filter((i) => i.category === IncomeCategory.OTHER)
      .reduce((sum, i) => sum + i.monthlyValue * 12, 0);

    // Calculate total expenses by category
    const totalLivingExpenses = expenses
      .filter((e) => e.category === ExpenseCategory.LIVING)
      .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

    const totalEducationExpenses = expenses
      .filter((e) => e.category === ExpenseCategory.EDUCATION)
      .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

    const totalInsuranceExpenses = expenses
      .filter((e) => e.category === ExpenseCategory.INSURANCE)
      .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

    const totalOtherExpenses = expenses
      .filter((e) => e.category === ExpenseCategory.OTHER)
      .reduce((sum, e) => sum + e.monthlyValue * 12, 0);

    // Calculate total assets by category
    const totalConsumerAssets = assets
      .filter((a) => a.category === AssetCategory.CONSUMER)
      .reduce((sum, a) => sum + a.value, 0);

    const totalBusinessAssets = assets
      .filter((a) => a.category === AssetCategory.BUSINESS)
      .reduce((sum, a) => sum + a.value, 0);

    const totalFinancialAssets = assets
      .filter((a) => a.category === AssetCategory.FINANCIAL)
      .reduce((sum, a) => sum + a.value, 0);

    const totalRealEstateAssets = assets
      .filter((a) => a.category === AssetCategory.REAL_ESTATE)
      .reduce((sum, a) => sum + a.value, 0);

    const totalAssets =
      totalConsumerAssets + totalBusinessAssets + totalFinancialAssets + totalRealEstateAssets;

    // Calculate total assets by layer
    const totalProtectionLayer = assets
      .filter((a) => this.getAssetLayer(a) === AssetLayer.PROTECTION)
      .reduce((sum, a) => sum + a.value, 0);

    const totalIncomeGenerationLayer = assets
      .filter((a) => this.getAssetLayer(a) === AssetLayer.INCOME_GENERATION)
      .reduce((sum, a) => sum + a.value, 0);

    const totalGrowthLayer = assets
      .filter((a) => this.getAssetLayer(a) === AssetLayer.GROWTH)
      .reduce((sum, a) => sum + a.value, 0);

    const totalRiskLayer = assets
      .filter((a) => this.getAssetLayer(a) === AssetLayer.RISK)
      .reduce((sum, a) => sum + a.value, 0);

    // Calculate total debt (always use principalAmount)
    const totalDebt = debts.reduce((sum, d) => sum + d.principalAmount, 0);

    // Calculate debt-to-asset ratio (handle division by zero)
    const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

    // Calculate net worth
    const netWorth = totalAssets - totalDebt;

    // Calculate emergency fund recommendation (6 months of total expenses)
    const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.monthlyValue, 0);
    const emergencyFundRecommended = totalMonthlyExpenses * 6;

    // Calculate emergency fund from assets marked as emergency fund
    const emergencyFund = assets
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
   * @param analysis - PersonalFinancialAnalysis entity
   * @returns Calculated income and expense breakdown
   */
  calculateIncomeExpenseBreakdown(analysis: PersonalFinancialAnalysis): IncomeExpenseBreakdown {
    const income = analysis.income || [];
    const expenses = analysis.expenses || [];
    const debts = analysis.debts || [];

    // Calculate debt payments
    const monthlyPrincipalPayment = debts.reduce((sum, d) => {
      // Principal payment = monthly payment - interest payment
      // Always use principalAmount for interest calculation
      const monthlyInterest = (d.principalAmount * d.interestRate) / 100 / 12;
      return sum + Math.max(0, d.monthlyPayment - monthlyInterest);
    }, 0);

    const annualPrincipalPayment = monthlyPrincipalPayment * 12;

    const monthlyInterestPayment = debts.reduce((sum, d) => {
      // Always use principalAmount for interest calculation
      const monthlyInterest = (d.principalAmount * d.interestRate) / 100 / 12;
      return sum + Math.min(monthlyInterest, d.monthlyPayment);
    }, 0);

    const annualInterestPayment = monthlyInterestPayment * 12;

    const monthlyTotalDebtPayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    const annualTotalDebtPayment = monthlyTotalDebtPayment * 12;

    // Calculate total income
    const totalMonthlyIncome = income.reduce((sum, i) => sum + i.monthlyValue, 0);
    const totalAnnualIncome = totalMonthlyIncome * 12;

    // Calculate total expenses (excluding debt payments)
    const totalMonthlyExpenses = expenses.reduce((sum, e) => sum + e.monthlyValue, 0);
    const totalAnnualExpenses = totalMonthlyExpenses * 12;

    // Calculate ratios (handle division by zero)
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
}

