/**
 * API service for Personal Financial Analysis System
 */

import apiService from './api';
import {
  PersonalFinancialAnalysis,
  AnalysisResponse,
  CreateAnalysisRequest,
  UpdateAnalysisRequest,
  LinkPortfolioRequest,
  CreateScenarioRequest,
  UpdateScenarioRequest,
  LinkPlanRequest,
  SummaryMetricsResponse,
  AnalysisAsset,
  AssetCategory,
  IncomeCategory,
  ExpenseCategory,
  AnalysisStatus,
} from '../types/personalFinancialAnalysis.types';
// Helper function to generate UUID
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Mock data flag - set to false when backend is ready
const USE_MOCK_DATA = false;

// Mock data storage (in-memory)
let mockAnalyses: PersonalFinancialAnalysis[] = [];
let mockAnalysisCounter = 1;

// Generate mock analysis data
const generateMockAnalysis = (): PersonalFinancialAnalysis => {
  const id = `mock-analysis-${mockAnalysisCounter++}`;
  const now = new Date().toISOString();
  
  return {
    id,
    accountId: 'mock-account-id',
    name: `Phân tích tài chính ${mockAnalysisCounter - 1}`,
    analysisDate: new Date().toISOString().split('T')[0],
    baseCurrency: 'VND',
    assets: [
      {
        id: generateUUID(),
        name: 'Nhà ở',
        value: 5000000000,
        category: AssetCategory.CONSUMER,
        source: 'custom',
      },
      {
        id: generateUUID(),
        name: 'Xe ô tô',
        value: 800000000,
        category: AssetCategory.CONSUMER,
        source: 'custom',
      },
      {
        id: generateUUID(),
        name: 'Cổ phiếu VN30',
        value: 2000000000,
        category: AssetCategory.FINANCIAL,
        source: 'portfolio',
        portfolioId: 'mock-portfolio-1',
        portfolioName: 'Portfolio Chính',
        assetId: 'mock-asset-1',
        assetType: 'STOCK',
        symbol: 'VN30',
      },
    ],
    income: [
      {
        id: generateUUID(),
        name: 'Lương',
        monthlyValue: 50000000,
        category: IncomeCategory.FAMILY,
      },
      {
        id: generateUUID(),
        name: 'Thu nhập từ kinh doanh',
        monthlyValue: 20000000,
        category: IncomeCategory.BUSINESS,
      },
    ],
    expenses: [
      {
        id: generateUUID(),
        name: 'Chi phí sinh hoạt',
        monthlyValue: 30000000,
        category: ExpenseCategory.LIVING,
      },
      {
        id: generateUUID(),
        name: 'Học phí',
        monthlyValue: 5000000,
        category: ExpenseCategory.EDUCATION,
      },
      {
        id: generateUUID(),
        name: 'Bảo hiểm',
        monthlyValue: 3000000,
        category: ExpenseCategory.INSURANCE,
      },
    ],
    debts: [
      {
        id: generateUUID(),
        name: 'Vay mua nhà',
        principalAmount: 2000000000,
        interestRate: 8.5,
        term: 240,
        monthlyPayment: 20000000,
        remainingBalance: 1800000000,
      },
    ],
    linkedPortfolioIds: ['mock-portfolio-1'],
    scenarios: [],
    status: AnalysisStatus.DRAFT,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Get all analyses for current user
 */
export async function getAllAnalyses(accountId: string): Promise<AnalysisResponse[]> {
  if (USE_MOCK_DATA) {
    // Return mock data
    if (mockAnalyses.length === 0) {
      // Generate 2 mock analyses
      mockAnalyses = [generateMockAnalysis(), generateMockAnalysis()];
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockAnalyses]), 500);
    });
  }

  const response = await apiService.api.get<AnalysisResponse[]>(
    `/api/v1/personal-financial-analysis?accountId=${accountId}`
  );
  return response.data;
}

/**
 * Get analysis by ID
 */
export async function getAnalysisById(id: string, accountId: string): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === id);
    if (!analysis) {
      // Generate new mock if not found
      const newAnalysis = generateMockAnalysis();
      newAnalysis.id = id;
      mockAnalyses.push(newAnalysis);
      return new Promise((resolve) => {
        setTimeout(() => resolve(newAnalysis), 500);
      });
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...analysis }), 500);
    });
  }

  const response = await apiService.api.get<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${id}?accountId=${accountId}`
  );
  return response.data;
}

/**
 * Create new analysis
 */
export async function createAnalysis(
  data: CreateAnalysisRequest,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const newAnalysis: PersonalFinancialAnalysis = {
      id: generateUUID(),
      accountId: 'mock-account-id',
      name: data.name || `Phân tích tài chính ${mockAnalysisCounter}`,
      analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
      baseCurrency: data.baseCurrency || 'VND',
      assets: data.assets || [],
      income: data.income || [],
      expenses: data.expenses || [],
      debts: data.debts || [],
      linkedPortfolioIds: [],
      scenarios: [],
      status: AnalysisStatus.DRAFT,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAnalyses.push(newAnalysis);
    return new Promise((resolve) => {
      setTimeout(() => resolve(newAnalysis), 500);
    });
  }

  const response = await apiService.api.post<AnalysisResponse>(
    `/api/v1/personal-financial-analysis?accountId=${accountId}`,
    data
  );
  return response.data;
}

/**
 * Update analysis
 */
export async function updateAnalysis(
  id: string,
  data: UpdateAnalysisRequest,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const index = mockAnalyses.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Analysis not found');
    }
    const updated = {
      ...mockAnalyses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    mockAnalyses[index] = updated;
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.put<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${id}?accountId=${accountId}`,
    data
  );
  return response.data;
}

/**
 * Delete analysis
 */
export async function deleteAnalysis(id: string, accountId: string): Promise<void> {
  if (USE_MOCK_DATA) {
    const index = mockAnalyses.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAnalyses.splice(index, 1);
    }
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }

  await apiService.api.delete(`/api/v1/personal-financial-analysis/${id}?accountId=${accountId}`);
}

/**
 * Link portfolio and load assets
 */
export async function linkPortfolio(
  analysisId: string,
  portfolioId: string,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    // Mock portfolio assets
    const portfolioAssets: AnalysisAsset[] = [
      {
        id: generateUUID(),
        name: 'Cổ phiếu VIC',
        value: 1000000000,
        category: AssetCategory.FINANCIAL,
        source: 'portfolio',
        portfolioId,
        portfolioName: 'Portfolio Mock',
        assetId: 'mock-asset-vic',
        assetType: 'STOCK',
        symbol: 'VIC',
      },
      {
        id: generateUUID(),
        name: 'Trái phiếu Chính phủ',
        value: 500000000,
        category: AssetCategory.FINANCIAL,
        source: 'portfolio',
        portfolioId,
        portfolioName: 'Portfolio Mock',
        assetId: 'mock-asset-bond',
        assetType: 'BOND',
        symbol: 'GOVBOND',
      },
    ];
    
    const updated = {
      ...analysis,
      assets: [...analysis.assets, ...portfolioAssets],
      linkedPortfolioIds: [...new Set([...analysis.linkedPortfolioIds, portfolioId])],
      updatedAt: new Date().toISOString(),
    };
    
    const index = mockAnalyses.findIndex((a) => a.id === analysisId);
    mockAnalyses[index] = updated;
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.post<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/link-portfolio?accountId=${accountId}`,
    { portfolioId } as LinkPortfolioRequest
  );
  return response.data;
}

/**
 * Unlink portfolio
 */
export async function unlinkPortfolio(
  analysisId: string,
  portfolioId: string,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const updated = {
      ...analysis,
      assets: analysis.assets.filter(
        (a) => !(a.source === 'portfolio' && a.portfolioId === portfolioId)
      ),
      linkedPortfolioIds: analysis.linkedPortfolioIds.filter((id) => id !== portfolioId),
      updatedAt: new Date().toISOString(),
    };
    
    const index = mockAnalyses.findIndex((a) => a.id === analysisId);
    mockAnalyses[index] = updated;
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.delete<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/unlink-portfolio/${portfolioId}?accountId=${accountId}`
  );
  return response.data;
}

/**
 * Create scenario
 */
export async function createScenario(
  analysisId: string,
  scenario: CreateScenarioRequest,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const newScenario = {
      id: generateUUID(),
      name: scenario.name,
      description: scenario.description,
      assets: scenario.assets || analysis.assets,
      income: scenario.income || analysis.income,
      expenses: scenario.expenses || analysis.expenses,
      debts: scenario.debts || analysis.debts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updated = {
      ...analysis,
      scenarios: [...analysis.scenarios, newScenario],
      updatedAt: new Date().toISOString(),
    };
    
    const index = mockAnalyses.findIndex((a) => a.id === analysisId);
    mockAnalyses[index] = updated;
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.post<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/scenarios?accountId=${accountId}`,
    scenario
  );
  return response.data;
}

/**
 * Update scenario
 */
export async function updateScenario(
  analysisId: string,
  scenarioId: string,
  scenario: UpdateScenarioRequest,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const scenarioIndex = analysis.scenarios.findIndex((s) => s.id === scenarioId);
    if (scenarioIndex === -1) {
      throw new Error('Scenario not found');
    }
    
    const updatedScenario = {
      ...analysis.scenarios[scenarioIndex],
      ...scenario,
      updatedAt: new Date().toISOString(),
    };
    
    const updated = {
      ...analysis,
      scenarios: analysis.scenarios.map((s, i) =>
        i === scenarioIndex ? updatedScenario : s
      ),
      updatedAt: new Date().toISOString(),
    };
    
    const index = mockAnalyses.findIndex((a) => a.id === analysisId);
    mockAnalyses[index] = updated;
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.put<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/scenarios/${scenarioId}?accountId=${accountId}`,
    scenario
  );
  return response.data;
}

/**
 * Delete scenario
 */
export async function deleteScenario(
  analysisId: string,
  scenarioId: string,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const updated = {
      ...analysis,
      scenarios: analysis.scenarios.filter((s) => s.id !== scenarioId),
      currentScenarioId:
        analysis.currentScenarioId === scenarioId
          ? undefined
          : analysis.currentScenarioId,
      updatedAt: new Date().toISOString(),
    };
    
    const index = mockAnalyses.findIndex((a) => a.id === analysisId);
    mockAnalyses[index] = updated;
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.delete<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/scenarios/${scenarioId}?accountId=${accountId}`
  );
  return response.data;
}

/**
 * Link Financial Freedom Plan
 */
export async function linkPlan(
  analysisId: string,
  planId: string,
  accountId: string
): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const updated = {
      ...analysis,
      linkedFinancialFreedomPlanId: planId,
      updatedAt: new Date().toISOString(),
    };
    
    const index = mockAnalyses.findIndex((a) => a.id === analysisId);
    mockAnalyses[index] = updated;
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.post<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/link-plan?accountId=${accountId}`,
    { planId } as LinkPlanRequest
  );
  return response.data;
}

/**
 * Unlink Financial Freedom Plan
 */
export async function unlinkPlan(analysisId: string, accountId: string): Promise<AnalysisResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const updated = {
      ...analysis,
      linkedFinancialFreedomPlanId: undefined,
      updatedAt: new Date().toISOString(),
    };
    
    const index = mockAnalyses.findIndex((a) => a.id === analysisId);
    mockAnalyses[index] = updated;
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(updated), 500);
    });
  }

  const response = await apiService.api.delete<AnalysisResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/unlink-plan?accountId=${accountId}`
  );
  return response.data;
}

/**
 * Calculate metrics
 */
export async function calculateMetrics(
  analysisId: string,
  accountId: string
): Promise<SummaryMetricsResponse> {
  if (USE_MOCK_DATA) {
    const analysis = mockAnalyses.find((a) => a.id === analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    // Import calculation function
    const { calculateSummaryMetrics } = await import(
      '../utils/personalFinancialAnalysisCalculations'
    );
    
    const metrics = calculateSummaryMetrics({
      assets: analysis.assets,
      income: analysis.income,
      expenses: analysis.expenses,
      debts: analysis.debts,
    });
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(metrics), 500);
    });
  }

  const response = await apiService.api.get<SummaryMetricsResponse>(
    `/api/v1/personal-financial-analysis/${analysisId}/calculate-metrics?accountId=${accountId}`
  );
  return response.data;
}

