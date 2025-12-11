// Financial Freedom Planning Types

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export enum PaymentType {
  CONTRIBUTION = 'contribution',
  WITHDRAWAL = 'withdrawal',
}

export enum RiskTolerance {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}

export enum CalculatedVariableType {
  RETURN_RATE = 'returnRate',
  YEARS = 'years',
  PERIODIC_PAYMENT = 'periodicPayment',
  FUTURE_VALUE = 'futureValue',
  INITIAL_INVESTMENT = 'initialInvestment',
}

export enum TemplateCategory {
  SAVINGS = 'savings',
  RETIREMENT = 'retirement',
  PURCHASE = 'purchase',
  EDUCATION = 'education',
  EMERGENCY = 'emergency',
}

export interface CalculationInputs {
  // Target amount (one of these)
  targetPresentValue?: number;
  monthlyExpenses?: number;
  withdrawalRate?: number; // Default: 0.04 (4%)
  
  // Investment parameters (leave one empty to calculate)
  initialInvestment?: number;
  periodicPayment?: number;
  investmentYears?: number;
  expectedReturnRate?: number;
  
  // Required
  paymentFrequency: PaymentFrequency;
  paymentType: PaymentType;
  inflationRate: number;
  riskTolerance: RiskTolerance;
}

export interface CalculatedVariable {
  type: CalculatedVariableType;
  value: number;
  label: string;
  formula?: string;
}

export interface CalculationResult {
  calculatedVariable: CalculatedVariable;
  futureValueRequired?: number; // Only present if target was provided by user
  targetPresentValue?: number; // Only present if target was actually provided by user
  totalFutureValue?: number; // Total future value calculated from investment (FV = PV₀(1+r)^n + PMT[((1+r)^n-1)/r])
  totalFutureValuePresentValue?: number; // Total future value discounted to present value
  monthlyExpensesPresentValue?: number; // Monthly expenses (from totalFutureValue) discounted to present value
  investmentYears?: number; // Number of investment years used in calculation
  isFeasible?: boolean; // Only present if target was provided (for comparison)
  warnings: string[];
  suggestions?: string[];
}

// Dynamic asset allocation - supports any asset type
export interface AssetAllocation {
  [assetType: string]: number;
}

// Asset allocation item with code, allocation, and expectedReturn
export interface AssetAllocationItem {
  code: string;
  allocation: number;
  expectedReturn: number;
}

// Asset type metadata for planning (stored in DB)
export interface AssetTypeMetadata {
  code: string; // Unique identifier (e.g., 'stock', 'bond')
  name: string; // Display name
  nameEn?: string; // English display name (optional)
  allocation: number; // Allocation percentage (0-100) - required
  expectedReturn: number; // Expected return rate (0-100) - required
}

// Asset type template for selection (not stored in DB)
export interface AssetTypeTemplate {
  code: string;
  name: string;
  nameEn: string;
  color: string; // For UI display only
  defaultExpectedReturn: number; // Default expected return for this asset type
}

export interface AllocationSuggestion {
  expectedReturn: number; // Portfolio expected return
  assetTypes: AssetTypeMetadata[]; // Asset types with allocation and expected return
  isAligned: boolean;
  recommendations: string[];
}

export interface YearlyProjection {
  year: number;
  portfolioValue: number;
  contributions: number;
  returns: number;
  cumulativeValue: number;
  progressToGoal: number;
}

export interface ScenarioResult {
  finalValue: number;
  yearsToGoal: number;
  progressPercentage: number;
  returnRate?: number; // Annual return rate percentage (e.g., 8.5 for 8.5%)
}

export interface Scenarios {
  conservative: ScenarioResult;
  moderate: ScenarioResult;
  aggressive: ScenarioResult;
}

export interface Milestone {
  year: number;
  description: string;
  targetValue: number;
  achieved: boolean;
  achievedAt?: Date;
}

export interface ProgressAlert {
  type: 'rebalancing' | 'performance' | 'milestone';
  severity: 'info' | 'warning' | 'error';
  message: string;
  action?: string;
}

export interface AllocationDeviation {
  assetType: string;
  currentAllocation: number;
  suggestedAllocation: number;
  deviation: number;
  absoluteDeviation: number;
}

export interface AllocationComparison {
  planId: string;
  currentAllocation: Record<string, number>;
  suggestedAllocation: Record<string, number>;
  deviations: AllocationDeviation[];
  needsRebalancing: boolean;
  significantDeviationsCount: number;
  recommendations: string[];
}

export interface ProgressResult {
  planId: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  remainingAmount: number;
  remainingYears: number;
  currentReturnRate: number;
  requiredReturnRate: number;
  gap: number;
  milestones: Milestone[];
  alerts: ProgressAlert[];
  yearlyComparison: Array<{
    year: number;
    targetValue: number;
    actualValue: number;
    difference: number;
  }>;
}

export interface PlanningTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  category: TemplateCategory;
  defaults: {
    targetMethod: 'direct' | 'fromExpenses';
    monthlyExpenses?: number;
    monthsToSustain?: number;
    withdrawalRate?: number;
    targetPresentValue?: number;
    initialInvestment: number;
    periodicPayment?: number;
    paymentFrequency: PaymentFrequency;
    paymentType: PaymentType;
    investmentYears?: number;
    expectedReturnRate?: number;
    inflationRate: number;
    riskTolerance: RiskTolerance;
  };
  calculateVariable: CalculatedVariableType;
  guidance: string;
  guidanceEn: string;
  tips: string[];
  tipsEn: string[];
}

export interface FinancialFreedomPlan {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  startDate?: Date | string;
  
  // Step 1: Goals & Investment Info
  targetMethod?: 'direct' | 'fromExpenses';
  targetPresentValue: number;
  futureValueRequired: number;
  monthlyExpenses?: number;
  withdrawalRate?: number;
  initialInvestment?: number;
  periodicPayment?: number;
  paymentFrequency: PaymentFrequency;
  paymentType: PaymentType;
  investmentYears?: number;
  requiredReturnRate?: number;
  inflationRate: number;
  riskTolerance: RiskTolerance;
  
  // Step 2: Asset Allocation (array format with code, allocation, expectedReturn)
  suggestedAllocation?: AssetAllocationItem[];
  
  // Step 3: Consolidated Plan
  yearlyProjections?: YearlyProjection[];
  scenarios?: Scenarios;
  
  // Step 4: Tracking
  linkedPortfolioIds: string[];
  linkedGoalIds: string[];
  currentPortfolioValue?: number;
  currentValue?: number; // Alias for currentPortfolioValue
  currentProgressPercentage?: number;
  milestones?: Milestone[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  status?: 'active' | 'paused' | 'completed';
  baseCurrency?: string;
  
  // Optional: Template used
  templateId?: string;
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  startDate?: Date | string;
  templateId?: string;
  targetMethod?: 'direct' | 'fromExpenses';
  targetPresentValue: number;
  futureValueRequired: number;
  monthlyExpenses?: number;
  withdrawalRate?: number;
  initialInvestment?: number;
  periodicPayment?: number;
  paymentFrequency: PaymentFrequency;
  paymentType: PaymentType;
  investmentYears?: number;
  requiredReturnRate?: number;
  inflationRate: number;
  riskTolerance: RiskTolerance;
  suggestedAllocation?: AssetAllocationItem[];
  yearlyProjections?: YearlyProjection[];
  scenarios?: Scenarios;
  linkedPortfolioIds?: string[];
  linkedGoalIds?: string[];
  milestones?: Milestone[];
}

export interface UpdatePlanRequest {
  name?: string;
  description?: string;
  startDate?: Date | string;
  targetMethod?: 'direct' | 'fromExpenses';
  targetPresentValue?: number;
  futureValueRequired?: number;
  monthlyExpenses?: number;
  withdrawalRate?: number;
  initialInvestment?: number;
  periodicPayment?: number;
  paymentFrequency?: PaymentFrequency;
  paymentType?: PaymentType;
  investmentYears?: number;
  requiredReturnRate?: number;
  inflationRate?: number;
  riskTolerance?: RiskTolerance;
  suggestedAllocation?: AssetAllocationItem[];
  yearlyProjections?: YearlyProjection[];
  scenarios?: Scenarios;
  linkedPortfolioIds?: string[];
  linkedGoalIds?: string[];
  milestones?: Milestone[];
}

export interface ConsolidateRequest {
  planIds?: string[]; // Optional for new plans
  goalIds?: string[];
  plans?: Array<{ // For new plans not yet saved
    targetPresentValue: number;
    futureValueRequired: number;
    initialInvestment?: number;
    periodicPayment?: number;
    paymentFrequency: PaymentFrequency;
    paymentType: PaymentType;
    investmentYears?: number;
    requiredReturnRate?: number;
    inflationRate: number;
    riskTolerance: RiskTolerance;
    suggestedAllocation?: AssetAllocation; // Keep as AssetAllocation for calculation (Record<string, number>)
  }>;
}

export interface ConsolidateResponse {
  totalTargetValue: number;
  totalFutureValueRequired: number; // Alias for totalTargetValue
  weightedAverageRRR: number;
  combinedAllocation: AssetAllocation;
  yearlyProjections: YearlyProjection[];
  scenarios: Scenarios;
  recommendedScenario?: 'conservative' | 'moderate' | 'aggressive';
  milestones: Array<{
    year: number;
    description: string;
    value: number;
    targetValue?: number; // Alias for value
  }>;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    diversificationScore: number;
    recommendations: string[];
  };
}

export interface SuggestAllocationRequest {
  requiredReturnRate: number;
  riskTolerance: RiskTolerance;
  investmentYears?: number; // Optional, can be calculated
  currentAllocation?: AssetAllocation;
  portfolioId?: string;
}

// Final result combining calculation inputs and result
// calculatedVariable is flattened: if type is RETURN_RATE, value is assigned to returnRate field
export interface FinalCalculationResult extends Omit<CalculationResult, 'calculatedVariable' | 'warnings' | 'suggestions'> {
  // All fields from CalculationInputs
  targetPresentValue?: number;
  monthlyExpenses?: number;
  withdrawalRate?: number;
  initialInvestment?: number;
  periodicPayment?: number;
  investmentYears?: number;
  expectedReturnRate?: number;
  paymentFrequency: PaymentFrequency;
  paymentType: PaymentType;
  inflationRate: number;
  riskTolerance: RiskTolerance;
  
  // Calculated variable value assigned directly based on type
  // If calculatedVariable.type is RETURN_RATE, value is assigned to returnRate
  // If calculatedVariable.type is YEARS, value is assigned to investmentYears (overrides input)
  // If calculatedVariable.type is PERIODIC_PAYMENT, value is assigned to periodicPayment (overrides input)
  // If calculatedVariable.type is FUTURE_VALUE, value is assigned to futureValue
  // If calculatedVariable.type is INITIAL_INVESTMENT, value is assigned to initialInvestment (overrides input)
  returnRate?: number; // When calculatedVariable.type is RETURN_RATE
  futureValue?: number; // When calculatedVariable.type is FUTURE_VALUE
}

// Plan data structure for wizard state
export interface PlanData {
  step1?: {
    calculationInputs?: CalculationInputs;
    calculationResult?: CalculationResult;
    finalResult?: FinalCalculationResult; // Merged calculationInputs + calculationResult
    template?: PlanningTemplate;
    targetMethod?: 'direct' | 'fromExpenses';
  };
  step2?: {
    allocationSuggestion?: AllocationSuggestion;
    allocation?: AssetAllocation;
    expectedReturns?: AssetAllocation;
    assetTypes?: AssetTypeMetadata[];
  };
  step3?: {
    consolidationResult?: ConsolidateResponse;
    planName?: string; // Plan name entered by user
    description?: string; // Plan description/notes
    startDate?: Date | string; // Plan start date
  };
}

