import apiService from './api';
import {
  SuggestAllocationRequest,
  AllocationSuggestion,
  ProgressResult,
  PlanningTemplate,
  FinancialFreedomPlan,
  CreatePlanRequest,
  UpdatePlanRequest,
  PaymentFrequency,
  PaymentType,
  RiskTolerance,
  AssetTypeMetadata,
} from '../types/financialFreedom.types';
import { FINANCIAL_FREEDOM_TEMPLATES } from '../config/planningTemplates';

// Mock data flag - set to false when backend is ready
const USE_MOCK_DATA = false;

// Default asset types metadata (without allocation/expectedReturn - these come from API)
// Use singular form (stock, bond) to match assetTypeTemplates
interface DefaultAssetTypeInfo {
  code: string;
  name: string;
  nameEn: string;
}

const DEFAULT_ASSET_TYPES_INFO: DefaultAssetTypeInfo[] = [
  { code: 'stock', name: 'Cổ phiếu', nameEn: 'Stocks' },
  { code: 'bond', name: 'Trái phiếu', nameEn: 'Bonds' },
  { code: 'gold', name: 'Vàng', nameEn: 'Gold' },
  { code: 'cash', name: 'Tiền mặt', nameEn: 'Cash' },
];

// Export default asset types with default allocation and expectedReturn (for initial state)
export const DEFAULT_ASSET_TYPES: AssetTypeMetadata[] = DEFAULT_ASSET_TYPES_INFO.map(info => ({
  ...info,
  allocation: 0,
  expectedReturn: 0,
}));

/**
 * Allocation configuration by risk tolerance
 * Contains all information: asset type code, allocation percentage, and expected return
 */
interface AssetAllocationConfig {
  code: string;
  allocation: number;
  expectedReturn: number;
}

const ALLOCATION_BY_RISK: Record<RiskTolerance, AssetAllocationConfig[]> = {
  [RiskTolerance.CONSERVATIVE]: [
    { code: 'stock', allocation: 45, expectedReturn: 10 },
    { code: 'bond', allocation: 25, expectedReturn: 7.5 },
    { code: 'gold', allocation: 25, expectedReturn: 10 },
    { code: 'cash', allocation: 10, expectedReturn: 0 },
  ],
  [RiskTolerance.MODERATE]: [
    { code: 'stock', allocation: 65, expectedReturn: 12 },
    { code: 'bond', allocation: 20, expectedReturn: 7.5 },
    { code: 'gold', allocation: 10, expectedReturn: 10 },
    { code: 'cash', allocation: 5, expectedReturn: 0 },
  ],
  [RiskTolerance.AGGRESSIVE]: [
    { code: 'stock', allocation: 75, expectedReturn: 14 },
    { code: 'bond', allocation: 15, expectedReturn: 7. },
    { code: 'gold', allocation: 10, expectedReturn: 10 },
    { code: 'cash', allocation: 0, expectedReturn: 0 },
  ],
};

// Expected portfolio return by risk tolerance
const PORTFOLIO_RETURN_BY_RISK: Record<RiskTolerance, number> = {
  [RiskTolerance.CONSERVATIVE]: 7,
  [RiskTolerance.MODERATE]: 10,
  [RiskTolerance.AGGRESSIVE]: 13,
};

/**
 * Generate recommendations based on risk tolerance
 */
const generateRecommendations = (_riskTolerance: RiskTolerance): string[] => {
  return [
    'Your current allocation aligns well with your risk tolerance',
    'Consider rebalancing quarterly to maintain target allocation',
  ];
};

// Mock allocation suggestion
const mockSuggestAllocation = (request: SuggestAllocationRequest): Promise<AllocationSuggestion> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const riskTolerance = request.riskTolerance || RiskTolerance.MODERATE;
      const allocation = ALLOCATION_BY_RISK[riskTolerance];
      
      // Build assetTypes with all information from allocation configuration
      const assetTypes: AssetTypeMetadata[] = allocation.map(item => {
        // Get asset type metadata from DEFAULT_ASSET_TYPES_INFO
        const assetTypeInfo = DEFAULT_ASSET_TYPES_INFO.find(at => at.code === item.code);
        return {
          code: item.code,
          name: assetTypeInfo?.name || item.code,
          nameEn: assetTypeInfo?.nameEn,
          allocation: item.allocation,
          expectedReturn: item.expectedReturn,
        };
      });

      resolve({
        expectedReturn: PORTFOLIO_RETURN_BY_RISK[riskTolerance],
        assetTypes,
        isAligned: true,
        recommendations: generateRecommendations(riskTolerance),
      });
    }, 300);
  });
};

export const financialFreedomApi = {
  suggestAllocation: (request: SuggestAllocationRequest): Promise<AllocationSuggestion> => {
    
    return mockSuggestAllocation(request);
    
    // return apiService.post('/api/v1/financial-freedom/suggest-allocation', request);
  },

  // Templates
  getTemplates: (): Promise<PlanningTemplate[]> => {
      return Promise.resolve(FINANCIAL_FREEDOM_TEMPLATES);
  },

  getTemplateById: (id: string): Promise<PlanningTemplate | null> => {
      const template = FINANCIAL_FREEDOM_TEMPLATES.find(t => t.id === id);
      return Promise.resolve(template || null);
  },

  // Plans CRUD
  getPlans: (accountId: string): Promise<FinancialFreedomPlan[]> => {
    if (USE_MOCK_DATA) {
      return Promise.resolve([
        {
          id: '1',
          accountId,
          name: 'My Financial Freedom Plan',
          targetPresentValue: 5000000000,
          futureValueRequired: 8370000000,
          initialInvestment: 500000000,
          periodicPayment: 10000000,
          paymentFrequency: PaymentFrequency.MONTHLY,
          paymentType: PaymentType.CONTRIBUTION,
          investmentYears: 15,
          requiredReturnRate: 12.5,
          inflationRate: 3.5,
          riskTolerance: RiskTolerance.MODERATE,
          linkedPortfolioIds: [],
          linkedGoalIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      ]);
    }
    return apiService.get(`/api/v1/financial-freedom/plans?accountId=${accountId}`);
  },

  getPlanById: (id: string, accountId: string): Promise<FinancialFreedomPlan> => {
    if (USE_MOCK_DATA) {
      return Promise.resolve({
        id,
        accountId,
        name: 'My Financial Freedom Plan',
        targetPresentValue: 5000000000,
        futureValueRequired: 8370000000,
        initialInvestment: 500000000,
        periodicPayment: 10000000,
        paymentFrequency: PaymentFrequency.MONTHLY,
        paymentType: PaymentType.CONTRIBUTION,
        investmentYears: 15,
        requiredReturnRate: 12.5,
        inflationRate: 3.5,
        riskTolerance: RiskTolerance.MODERATE,
        linkedPortfolioIds: [],
        linkedGoalIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      });
    }
    return apiService.get(`/api/v1/financial-freedom/plans/${id}?accountId=${accountId}`);
  },

  createPlan: (data: CreatePlanRequest, accountId: string): Promise<FinancialFreedomPlan> => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now().toString(),
            accountId,
            ...data,
            linkedPortfolioIds: data.linkedPortfolioIds || [],
            linkedGoalIds: data.linkedGoalIds || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          });
        }, 300);
      });
    }
    return apiService.post(`/api/v1/financial-freedom/plans?accountId=${accountId}`, data);
  },

  updatePlan: (id: string, data: UpdatePlanRequest, accountId: string): Promise<FinancialFreedomPlan> => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id,
            accountId,
            name: data.name || 'Updated Plan',
            targetPresentValue: data.targetPresentValue || 5000000000,
            futureValueRequired: data.futureValueRequired || 8370000000,
            ...data,
            paymentFrequency: data.paymentFrequency || PaymentFrequency.MONTHLY,
            paymentType: data.paymentType || PaymentType.CONTRIBUTION,
            inflationRate: data.inflationRate || 3.5,
            riskTolerance: data.riskTolerance || RiskTolerance.MODERATE,
            linkedPortfolioIds: data.linkedPortfolioIds || [],
            linkedGoalIds: data.linkedGoalIds || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          });
        }, 300);
      });
    }
    return apiService.put(`/api/v1/financial-freedom/plans/${id}?accountId=${accountId}`, data);
  },

  deletePlan: (id: string, accountId: string): Promise<{ message: string }> => {
    if (USE_MOCK_DATA) {
      return Promise.resolve({ message: 'Plan deleted successfully' });
    }
    return apiService.delete(`/api/v1/financial-freedom/plans/${id}?accountId=${accountId}`);
  },

  duplicatePlan: (id: string, accountId: string): Promise<FinancialFreedomPlan> => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now().toString(),
            accountId,
            name: 'Duplicated Plan',
            targetPresentValue: 5000000000,
            futureValueRequired: 8370000000,
            initialInvestment: 500000000,
            periodicPayment: 10000000,
            paymentFrequency: PaymentFrequency.MONTHLY,
            paymentType: PaymentType.CONTRIBUTION,
            investmentYears: 15,
            requiredReturnRate: 12.5,
            inflationRate: 3.5,
            riskTolerance: RiskTolerance.MODERATE,
            linkedPortfolioIds: [],
            linkedGoalIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          });
        }, 300);
      });
    }
    return apiService.post(`/api/v1/financial-freedom/plans/${id}/duplicate?accountId=${accountId}`, {});
  },

  // Progress Tracking
  getProgress: (id: string, accountId: string): Promise<ProgressResult> => {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            planId: id,
            currentValue: 2000000000,
            targetValue: 8370000000,
            progressPercentage: 23.9,
            remainingAmount: 6370000000,
            remainingYears: 12,
            currentReturnRate: 11.5,
            requiredReturnRate: 12.5,
            gap: 1.0,
            milestones: [
              {
                year: 5,
                description: '25% of goal',
                targetValue: 2092500000,
                achieved: false,
              },
              {
                year: 10,
                description: '50% of goal',
                targetValue: 4185000000,
                achieved: false,
              },
            ],
            alerts: [
              {
                type: 'performance',
                severity: 'warning',
                message: 'Current return rate is slightly below required rate',
                action: 'Consider reviewing your portfolio allocation',
              },
            ],
            yearlyComparison: Array.from({ length: 3 }, (_, i) => ({
              year: new Date().getFullYear() - 2 + i,
              targetValue: 1000000000 + (i * 500000000),
              actualValue: 800000000 + (i * 400000000),
              difference: -200000000 - (i * 100000000),
            })),
          });
        }, 300);
      });
    }
    return apiService.get(`/api/v1/financial-freedom/plans/${id}/progress?accountId=${accountId}`);
  },

  // Link/Unlink operations
  linkGoal: (planId: string, goalId: string, accountId: string): Promise<FinancialFreedomPlan> => {
    return apiService.post(
      `/api/v1/financial-freedom/plans/${planId}/link-goal?accountId=${accountId}`,
      { goalId }
    );
  },

  unlinkGoal: (planId: string, goalId: string, accountId: string): Promise<FinancialFreedomPlan> => {
    return apiService.post(
      `/api/v1/financial-freedom/plans/${planId}/unlink-goal?accountId=${accountId}`,
      { goalId }
    );
  },

  linkPortfolio: (planId: string, portfolioId: string, accountId: string): Promise<FinancialFreedomPlan> => {
    return apiService.post(
      `/api/v1/financial-freedom/plans/${planId}/link-portfolio?accountId=${accountId}`,
      { portfolioId }
    );
  },

  unlinkPortfolio: (planId: string, portfolioId: string, accountId: string): Promise<FinancialFreedomPlan> => {
    return apiService.post(
      `/api/v1/financial-freedom/plans/${planId}/unlink-portfolio?accountId=${accountId}`,
      { portfolioId }
    );
  },
};

