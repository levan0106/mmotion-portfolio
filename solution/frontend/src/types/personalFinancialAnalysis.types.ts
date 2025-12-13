/**
 * TypeScript type definitions for Personal Financial Analysis System
 */

// Enums for categories
export enum AssetCategory {
  CONSUMER = 'consumer',
  BUSINESS = 'business',
  FINANCIAL = 'financial',
  REAL_ESTATE = 'real_estate',
}

// Asset layers for Asset Pyramid visualization
export enum AssetLayer {
  PROTECTION = 'protection',      // Lớp bảo vệ - Tài sản an toàn, thanh khoản cao
  INCOME_GENERATION = 'income_generation', // Lớp tạo thu nhập - Tài sản tạo thu nhập thụ động
  GROWTH = 'growth',              // Lớp tăng trưởng - Tài sản tăng trưởng vừa phải
  RISK = 'risk',                  // Lớp rủi ro - Tài sản rủi ro cao, tiềm năng tăng trưởng cao
}

export enum IncomeCategory {
  FAMILY = 'family',
  BUSINESS = 'business',
  OTHER = 'other',
}

export enum ExpenseCategory {
  LIVING = 'living',
  EDUCATION = 'education',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export enum AnalysisStatus {
  DRAFT = 'draft',
  FINAL = 'final',
}

// Asset entry in analysis
export interface AnalysisAsset {
  id: string; // UUID for frontend tracking
  name: string;
  value: number;
  category: AssetCategory;
  layer?: AssetLayer; // Asset layer for pyramid visualization (optional, can be auto-calculated)
  source: 'custom' | 'portfolio';
  portfolioId?: string; // If loaded from portfolio
  portfolioName?: string; // For display
  assetId?: string; // Portfolio asset ID if from portfolio
  assetType?: string; // STOCK, BOND, etc. if from portfolio
  symbol?: string; // Asset symbol if from portfolio
  isEmergencyFund?: boolean; // Whether this asset is part of emergency fund
}

// Income entry in analysis
export interface AnalysisIncome {
  id: string;
  name: string;
  monthlyValue: number;
  category: IncomeCategory;
}

// Expense entry in analysis
export interface AnalysisExpense {
  id: string;
  name: string;
  monthlyValue: number;
  category: ExpenseCategory;
}

// Debt entry in analysis
export interface AnalysisDebt {
  id: string;
  name: string;
  principalAmount: number;
  interestRate: number; // Percentage (e.g., 12 for 12%)
  term: number; // Months
  monthlyPayment: number;
  remainingBalance?: number; // Optional
}

// Scenario for restructuring
export interface AnalysisScenario {
  id: string;
  name: string;
  description?: string;
  assets: AnalysisAsset[];
  income: AnalysisIncome[];
  expenses: AnalysisExpense[];
  debts: AnalysisDebt[];
  createdAt: string;
  updatedAt: string;
}

// Summary metrics calculated from analysis data
export interface SummaryMetrics {
  totalFamilyIncome: number;
  totalBusinessIncome: number;
  totalOtherIncome: number;
  totalLivingExpenses: number;
  totalEducationExpenses: number;
  totalInsuranceExpenses: number;
  totalOtherExpenses: number;
  totalConsumerAssets: number;
  totalBusinessAssets: number;
  totalFinancialAssets: number;
  totalRealEstateAssets: number;
  totalAssets: number;
  // Asset layers for pyramid
  totalProtectionLayer: number;
  totalIncomeGenerationLayer: number;
  totalGrowthLayer: number;
  totalRiskLayer: number;
  emergencyFund: number;
  emergencyFundRecommended: number;
  totalDebt: number;
  debtToAssetRatio: number; // Percentage
  netWorth: number;
}

// Income and expense breakdown
export interface IncomeExpenseBreakdown {
  // Debt payments
  monthlyPrincipalPayment: number;
  annualPrincipalPayment: number;
  monthlyInterestPayment: number;
  annualInterestPayment: number;
  monthlyTotalDebtPayment: number;
  annualTotalDebtPayment: number;
  debtPaymentToIncomeRatio: number; // Percentage
  
  // Income and expenses
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  totalMonthlyExpenses: number;
  totalAnnualExpenses: number;
  expenseToIncomeRatio: number; // Percentage
  
  // Savings
  remainingMonthlySavings: number;
  remainingAnnualSavings: number;
  savingsToIncomeRatio: number; // Percentage
}

// Personal Financial Analysis main interface
export interface PersonalFinancialAnalysis {
  id: string;
  accountId: string;
  name?: string;
  analysisDate: string;
  baseCurrency: string;
  assets: AnalysisAsset[];
  income: AnalysisIncome[];
  expenses: AnalysisExpense[];
  debts: AnalysisDebt[];
  linkedPortfolioIds: string[];
  summaryMetrics?: SummaryMetrics;
  incomeExpenseBreakdown?: IncomeExpenseBreakdown;
  scenarios: AnalysisScenario[];
  currentScenarioId?: string;
  linkedFinancialFreedomPlanId?: string;
  notes?: string; // Notes about the analysis results
  status: AnalysisStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request DTOs
export interface CreateAnalysisRequest {
  name?: string;
  analysisDate?: string;
  baseCurrency?: string;
  assets?: AnalysisAsset[];
  income?: AnalysisIncome[];
  expenses?: AnalysisExpense[];
  debts?: AnalysisDebt[];
}

export interface UpdateAnalysisRequest {
  name?: string;
  analysisDate?: string;
  assets?: AnalysisAsset[];
  income?: AnalysisIncome[];
  expenses?: AnalysisExpense[];
  debts?: AnalysisDebt[];
  scenarios?: AnalysisScenario[];
  status?: AnalysisStatus;
}

export interface LinkPortfolioRequest {
  portfolioId: string;
}

export interface CreateScenarioRequest {
  name: string;
  description?: string;
  assets?: AnalysisAsset[];
  income?: AnalysisIncome[];
  expenses?: AnalysisExpense[];
  debts?: AnalysisDebt[];
}

export interface UpdateScenarioRequest {
  name?: string;
  description?: string;
  assets?: AnalysisAsset[];
  income?: AnalysisIncome[];
  expenses?: AnalysisExpense[];
  debts?: AnalysisDebt[];
}

export interface LinkPlanRequest {
  planId: string;
}

// Response DTOs
export interface AnalysisResponse extends PersonalFinancialAnalysis {}

export interface SummaryMetricsResponse extends SummaryMetrics {}

// Form data types for components
export interface AssetFormData {
  name: string;
  value: number;
  category: AssetCategory;
}

export interface IncomeFormData {
  name: string;
  monthlyValue: number;
  category: IncomeCategory;
}

export interface ExpenseFormData {
  name: string;
  monthlyValue: number;
  category: ExpenseCategory;
}

export interface DebtFormData {
  name: string;
  principalAmount: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  remainingBalance?: number;
}

// Component prop types
export interface Step1CashFlowSurveyProps {
  onOpenSuggestionModal?: () => void;
  analysis: PersonalFinancialAnalysis;
  onUpdate: (updates: Partial<UpdateAnalysisRequest>) => void;
  onPortfolioLink: (portfolioId: string) => Promise<void>;
  onPortfolioUnlink: (portfolioId: string) => Promise<void>;
  isLoading?: boolean;
  defaultCollapsed?: boolean; // If true, all sections are collapsed by default
}

export interface Step2FinancialAnalysisProps {
  analysis: PersonalFinancialAnalysis;
  summaryMetrics: SummaryMetrics;
  incomeExpenseBreakdown: IncomeExpenseBreakdown;
  onUpdate?: (updates: Partial<PersonalFinancialAnalysis>) => Promise<void>;
}

export interface Step3AssetRestructuringProps {
  analysis: PersonalFinancialAnalysis;
  currentScenario?: AnalysisScenario;
  onScenarioCreate: (scenario: CreateScenarioRequest) => Promise<void>;
  onScenarioUpdate: (scenarioId: string, updates: UpdateScenarioRequest) => Promise<void>;
  onScenarioDelete: (scenarioId: string) => Promise<void>;
  onScenarioSelect: (scenarioId: string) => void;
  onDataUpdate: (updates: Partial<UpdateAnalysisRequest>) => void;
}

export interface Step4FinancialPlanningProps {
  analysis: PersonalFinancialAnalysis;
  onPlanCreate: () => void;
  onPlanLink: (planId: string) => Promise<void>;
  onPlanUnlink: () => Promise<void>;
}

export interface PortfolioLinkingSectionProps {
  linkedPortfolioIds: string[];
  onLink: (portfolioId: string) => Promise<void>;
  onUnlink: (portfolioId: string) => Promise<void>;
  isLoading?: boolean;
}

