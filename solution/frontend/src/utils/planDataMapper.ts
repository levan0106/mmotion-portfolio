import { PlanData, CreatePlanRequest, FinancialFreedomPlan, FinalCalculationResult, CalculationInputs } from '../types/financialFreedom.types';
import { ASSET_TYPE_TEMPLATES } from '../config/assetTypeTemplates';

/**
 * Map FinancialFreedomPlan to PlanData for wizard initialization
 */
export function mapPlanToPlanData(plan: FinancialFreedomPlan): PlanData {
  // Create FinalCalculationResult from plan data
  const finalResult: FinalCalculationResult = {
    targetPresentValue: plan.targetPresentValue,
    futureValueRequired: plan.futureValueRequired,
    initialInvestment: plan.initialInvestment,
    periodicPayment: plan.periodicPayment,
    paymentFrequency: plan.paymentFrequency,
    paymentType: plan.paymentType,
    investmentYears: plan.investmentYears,
    returnRate: plan.requiredReturnRate, // Map requiredReturnRate to returnRate
    inflationRate: plan.inflationRate,
    riskTolerance: plan.riskTolerance,
    totalFutureValue: plan.futureValueRequired,
    totalFutureValuePresentValue: plan.targetPresentValue,
  };

  // Create calculationInputs from finalResult to pre-fill the form
  // This is needed because CalculationForm expects calculationInputs, not finalResult
  const calculationInputs: CalculationInputs = {
    targetPresentValue: finalResult.targetPresentValue,
    monthlyExpenses: plan.monthlyExpenses, // Load from plan
    withdrawalRate: plan.withdrawalRate, // Load from plan
    initialInvestment: finalResult.initialInvestment,
    periodicPayment: finalResult.periodicPayment,
    investmentYears: finalResult.investmentYears,
    expectedReturnRate: finalResult.returnRate || finalResult.expectedReturnRate, // Use returnRate if available
    paymentFrequency: finalResult.paymentFrequency,
    paymentType: finalResult.paymentType,
    inflationRate: finalResult.inflationRate,
    riskTolerance: finalResult.riskTolerance,
  };

  // Don't set step3.consolidationResult - always recalculate it in Step3ConsolidatedOverview
  // to ensure accuracy and avoid using stale data from API
  return {
    step1: {
      finalResult,
      calculationInputs, // Add calculationInputs so form can be pre-filled
      targetMethod: plan.targetMethod || 'direct', // Load from plan or default to direct
    },
    step2: plan.suggestedAllocation && Array.isArray(plan.suggestedAllocation) ? {
      allocationSuggestion: {
        expectedReturn: plan.requiredReturnRate || 0,
        assetTypes: plan.suggestedAllocation.map(item => {
          // Find template to get name and nameEn based on code
          const template = ASSET_TYPE_TEMPLATES.find(t => t.code === item.code);
          return {
            code: item.code,
            name: template?.name || item.code, // Use template name or fallback to code
            nameEn: template?.nameEn || item.code, // Use template nameEn or fallback to code
            allocation: item.allocation,
            expectedReturn: item.expectedReturn,
          };
        }),
        isAligned: true,
        recommendations: [],
      },
    } : undefined,
    // step3 is intentionally left undefined - will be calculated fresh in Step3ConsolidatedOverview
    // But include plan name for edit mode
    step3: {
      planName: plan.name,
    },
  };
}

/**
 * Map PlanData from wizard to CreatePlanRequest for API
 */
export function mapPlanDataToCreateRequest(planData: PlanData, planName?: string): CreatePlanRequest {
  const step1 = planData.step1;
  const step2 = planData.step2;
  const step3 = planData.step3;

  const finalResult = step1?.finalResult;
  if (!finalResult) {
    throw new Error('Missing finalResult from step 1');
  }

  // Map finalResult to CreatePlanRequest
  // Note: Backend expects requiredReturnRate, frontend uses returnRate in finalResult
  // Note: templateId is not saved - templates are only used for pre-filling form data
  // Note: investmentYears must be an integer for database, round decimal values
  // Use planName from step3 if available, otherwise use provided planName or generate default
  const finalPlanName = step3?.planName?.trim() || planName || `Financial Plan - ${new Date().toLocaleDateString()}`;
  
  // Get calculationInputs to extract monthlyExpenses, withdrawalRate
  const calculationInputs = step1?.calculationInputs;
  
  const request: CreatePlanRequest = {
    name: finalPlanName,
    targetMethod: step1?.targetMethod || 'direct', // Get from step1, not calculationInputs
    targetPresentValue: finalResult.targetPresentValue ?? 0,
    futureValueRequired: finalResult.futureValueRequired ?? 0,
    monthlyExpenses: calculationInputs?.monthlyExpenses || finalResult.monthlyExpenses,
    withdrawalRate: calculationInputs?.withdrawalRate || finalResult.withdrawalRate,
    initialInvestment: finalResult.initialInvestment,
    periodicPayment: finalResult.periodicPayment,
    paymentFrequency: finalResult.paymentFrequency,
    paymentType: finalResult.paymentType,
    investmentYears: finalResult.investmentYears, // Allow decimal values
    requiredReturnRate: finalResult.returnRate, // Map returnRate to requiredReturnRate for backend
    inflationRate: finalResult.inflationRate,
    riskTolerance: finalResult.riskTolerance,
    // Map suggestedAllocation from allocationSuggestion.assetTypes (new mapping structure)
    // Send full array with code, allocation, and expectedReturn for each asset type
    suggestedAllocation: step2?.allocationSuggestion?.assetTypes?.map(at => ({
      code: at.code,
      allocation: at.allocation,
      expectedReturn: at.expectedReturn,
    })) || undefined,
    // Only include yearlyProjections if it's a valid array with data
    yearlyProjections: step3?.consolidationResult?.yearlyProjections && 
                       Array.isArray(step3.consolidationResult.yearlyProjections) &&
                       step3.consolidationResult.yearlyProjections.length > 0 &&
                       step3.consolidationResult.yearlyProjections.every((p: any) => p && typeof p === 'object' && 'year' in p)
                       ? step3.consolidationResult.yearlyProjections
                       : undefined,
    scenarios: step3?.consolidationResult?.scenarios,
    linkedPortfolioIds: [],
    linkedGoalIds: [],
    // Map milestones from ConsolidateResponse format to Milestone format
    milestones: step3?.consolidationResult?.milestones?.map(m => ({
      year: m.year,
      description: m.description,
      targetValue: m.targetValue ?? m.value,
      achieved: false, // Default to false for new plans
    })),
  };

  return request;
}

/**
 * Map PlanData from wizard to UpdatePlanRequest for API
 */
export function mapPlanDataToUpdateRequest(planData: PlanData, planName?: string): Partial<CreatePlanRequest> {
  // UpdateRequest has the same structure as CreatePlanRequest but all fields are optional
  const createRequest = mapPlanDataToCreateRequest(planData, planName);
  return createRequest;
}

