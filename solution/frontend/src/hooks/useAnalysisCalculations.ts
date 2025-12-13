/**
 * React hooks for Personal Financial Analysis calculations
 */

import { useMemo } from 'react';
import {
  PersonalFinancialAnalysis,
  AnalysisScenario,
} from '../types/personalFinancialAnalysis.types';
import {
  calculateSummaryMetrics,
  calculateIncomeExpenseBreakdown,
  calculateScenarioMetrics,
  calculateScenarioBreakdown,
} from '../utils/personalFinancialAnalysisCalculations';

/**
 * Hook to calculate summary metrics with memoization
 */
export const useSummaryMetrics = (analysis: PersonalFinancialAnalysis | undefined) => {
  return useMemo(() => {
    if (!analysis) {
      return undefined;
    }
    return calculateSummaryMetrics({
      assets: analysis.assets,
      income: analysis.income,
      expenses: analysis.expenses,
      debts: analysis.debts,
    });
  }, [analysis?.assets, analysis?.income, analysis?.expenses, analysis?.debts]);
};

/**
 * Hook to calculate income and expense breakdown with memoization
 */
export const useIncomeExpenseBreakdown = (analysis: PersonalFinancialAnalysis | undefined) => {
  return useMemo(() => {
    if (!analysis) {
      return undefined;
    }
    return calculateIncomeExpenseBreakdown({
      income: analysis.income,
      expenses: analysis.expenses,
      debts: analysis.debts,
    });
  }, [analysis?.income, analysis?.expenses, analysis?.debts]);
};

/**
 * Hook to calculate metrics for a scenario with memoization
 */
export const useScenarioMetrics = (scenario: AnalysisScenario | undefined) => {
  return useMemo(() => {
    if (!scenario) {
      return undefined;
    }
    return calculateScenarioMetrics(scenario);
  }, [scenario?.assets, scenario?.income, scenario?.expenses, scenario?.debts]);
};

/**
 * Hook to calculate breakdown for a scenario with memoization
 */
export const useScenarioBreakdown = (scenario: AnalysisScenario | undefined) => {
  return useMemo(() => {
    if (!scenario) {
      return undefined;
    }
    return calculateScenarioBreakdown(scenario);
  }, [scenario?.income, scenario?.expenses, scenario?.debts]);
};

