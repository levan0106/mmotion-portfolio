import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../shared/entities/account.entity';
import { FinancialFreedomPlan } from '../../financial-freedom/entities/financial-freedom-plan.entity';

/**
 * Status of the analysis
 */
export enum AnalysisStatus {
  DRAFT = 'draft',
  FINAL = 'final',
}

/**
 * Asset category enum
 */
export enum AssetCategory {
  CONSUMER = 'consumer',
  BUSINESS = 'business',
  FINANCIAL = 'financial',
  REAL_ESTATE = 'real_estate',
}

/**
 * Asset layer for pyramid visualization
 */
export enum AssetLayer {
  PROTECTION = 'protection',
  INCOME_GENERATION = 'income_generation',
  GROWTH = 'growth',
  RISK = 'risk',
}

/**
 * Income category enum
 */
export enum IncomeCategory {
  FAMILY = 'family',
  BUSINESS = 'business',
  OTHER = 'other',
}

/**
 * Expense category enum
 */
export enum ExpenseCategory {
  LIVING = 'living',
  EDUCATION = 'education',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

/**
 * Asset entry in analysis
 */
export interface AnalysisAsset {
  id: string;
  name: string;
  value: number;
  category: AssetCategory;
  layer?: AssetLayer;
  source: 'custom' | 'portfolio';
  portfolioId?: string;
  portfolioName?: string;
  assetId?: string;
  assetType?: string;
  symbol?: string;
  isEmergencyFund?: boolean;
}

/**
 * Income entry in analysis
 */
export interface AnalysisIncome {
  id: string;
  name: string;
  monthlyValue: number;
  category: IncomeCategory;
}

/**
 * Expense entry in analysis
 */
export interface AnalysisExpense {
  id: string;
  name: string;
  monthlyValue: number;
  category: ExpenseCategory;
}

/**
 * Debt entry in analysis
 */
export interface AnalysisDebt {
  id: string;
  name: string;
  principalAmount: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  remainingBalance?: number;
}

/**
 * Scenario for restructuring
 */
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

/**
 * Summary metrics calculated from analysis data
 */
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
  totalProtectionLayer: number;
  totalIncomeGenerationLayer: number;
  totalGrowthLayer: number;
  totalRiskLayer: number;
  emergencyFund: number;
  emergencyFundRecommended: number;
  totalDebt: number;
  debtToAssetRatio: number;
  netWorth: number;
}

/**
 * Income and expense breakdown
 */
export interface IncomeExpenseBreakdown {
  monthlyPrincipalPayment: number;
  annualPrincipalPayment: number;
  monthlyInterestPayment: number;
  annualInterestPayment: number;
  monthlyTotalDebtPayment: number;
  annualTotalDebtPayment: number;
  debtPaymentToIncomeRatio: number;
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  totalMonthlyExpenses: number;
  totalAnnualExpenses: number;
  expenseToIncomeRatio: number;
  remainingMonthlySavings: number;
  remainingAnnualSavings: number;
  savingsToIncomeRatio: number;
}

/**
 * Personal Financial Analysis entity
 * Stores comprehensive financial analysis data for users
 */
@Entity('personal_financial_analyses')
@Index(['accountId'])
@Index(['accountId', 'isActive'])
@Index(['analysisDate'])
export class PersonalFinancialAnalysis {
  /**
   * Unique identifier for the analysis
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the account that owns this analysis
   */
  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  /**
   * Name of the analysis
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'name' })
  name?: string;

  /**
   * Date of the analysis
   */
  @Column({ type: 'date', nullable: true, name: 'analysis_date' })
  analysisDate?: Date;

  /**
   * Base currency for the analysis (e.g., 'VND', 'USD')
   */
  @Column({ type: 'varchar', length: 10, default: 'VND', name: 'base_currency' })
  baseCurrency: string;

  /**
   * Status of the analysis (draft, final)
   */
  @Column({
    type: 'varchar',
    length: 20,
    enum: AnalysisStatus,
    default: AnalysisStatus.DRAFT,
    name: 'status',
  })
  status: AnalysisStatus;

  /**
   * Whether this analysis is active
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  /**
   * Assets data stored as JSONB
   */
  @Column({ type: 'jsonb', nullable: true, name: 'assets', default: [] })
  assets?: AnalysisAsset[];

  /**
   * Income data stored as JSONB
   */
  @Column({ type: 'jsonb', nullable: true, name: 'income', default: [] })
  income?: AnalysisIncome[];

  /**
   * Expenses data stored as JSONB
   */
  @Column({ type: 'jsonb', nullable: true, name: 'expenses', default: [] })
  expenses?: AnalysisExpense[];

  /**
   * Debts data stored as JSONB
   */
  @Column({ type: 'jsonb', nullable: true, name: 'debts', default: [] })
  debts?: AnalysisDebt[];

  /**
   * Calculated summary metrics stored as JSONB
   */
  @Column({ type: 'jsonb', nullable: true, name: 'summary_metrics' })
  summaryMetrics?: SummaryMetrics;

  /**
   * Income and expense breakdown stored as JSONB
   */
  @Column({ type: 'jsonb', nullable: true, name: 'income_expense_breakdown' })
  incomeExpenseBreakdown?: IncomeExpenseBreakdown;

  /**
   * Scenarios for restructuring stored as JSONB
   */
  @Column({ type: 'jsonb', nullable: true, name: 'scenarios', default: [] })
  scenarios?: AnalysisScenario[];

  /**
   * IDs of linked portfolios (array of UUIDs)
   */
  @Column({ type: 'uuid', array: true, default: [], name: 'linked_portfolio_ids' })
  linkedPortfolioIds: string[];

  /**
   * ID of linked Financial Freedom Plan (nullable)
   */
  @Column({ type: 'uuid', nullable: true, name: 'linked_financial_freedom_plan_id' })
  linkedFinancialFreedomPlanId?: string;

  /**
   * Notes about the analysis results
   */
  @Column({ type: 'text', nullable: true, name: 'notes' })
  notes?: string;

  /**
   * Timestamp when the analysis was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the analysis was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Relationship to Account entity
   */
  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  /**
   * Relationship to FinancialFreedomPlan entity (optional)
   */
  @ManyToOne(() => FinancialFreedomPlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'linked_financial_freedom_plan_id' })
  linkedFinancialFreedomPlan?: FinancialFreedomPlan;
}

