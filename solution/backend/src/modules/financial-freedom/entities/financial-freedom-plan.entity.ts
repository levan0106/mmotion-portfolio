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

export enum PlanStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

@Entity('financial_freedom_plans')
@Index(['accountId', 'isActive'])
export class FinancialFreedomPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  // Step 1: Goals & Investment Info
  @Column({ name: 'target_method', type: 'varchar', length: 20, nullable: true })
  targetMethod?: 'direct' | 'fromExpenses';

  @Column({ name: 'target_present_value', type: 'decimal', precision: 20, scale: 2 })
  targetPresentValue: number;

  @Column({ name: 'future_value_required', type: 'decimal', precision: 20, scale: 2 })
  futureValueRequired: number;

  @Column({ name: 'monthly_expenses', type: 'decimal', precision: 20, scale: 2, nullable: true })
  monthlyExpenses?: number;

  @Column({ name: 'withdrawal_rate', type: 'decimal', precision: 6, scale: 4, nullable: true })
  withdrawalRate?: number;

  @Column({ name: 'initial_investment', type: 'decimal', precision: 20, scale: 2, nullable: true })
  initialInvestment?: number;

  @Column({ name: 'periodic_payment', type: 'decimal', precision: 20, scale: 2, nullable: true })
  periodicPayment?: number;

  @Column({
    name: 'payment_frequency',
    type: 'varchar',
    length: 20,
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY,
  })
  paymentFrequency: PaymentFrequency;

  @Column({
    name: 'payment_type',
    type: 'varchar',
    length: 20,
    enum: PaymentType,
    default: PaymentType.CONTRIBUTION,
  })
  paymentType: PaymentType;

  @Column({ name: 'investment_years', type: 'decimal', precision: 10, scale: 2, nullable: true })
  investmentYears?: number;

  @Column({ name: 'required_return_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  requiredReturnRate?: number;

  @Column({ name: 'inflation_rate', type: 'decimal', precision: 6, scale: 4, default: 4.5 })
  inflationRate: number;

  @Column({
    name: 'risk_tolerance',
    type: 'varchar',
    length: 20,
    enum: RiskTolerance,
    default: RiskTolerance.MODERATE,
  })
  riskTolerance: RiskTolerance;

  // Step 2: Asset Allocation (dynamic - supports any asset type)
  // Store as array of objects with code, allocation, and expectedReturn
  @Column({ name: 'suggested_allocation', type: 'jsonb', nullable: true })
  suggestedAllocation?: Array<{
    code: string;
    allocation: number;
    expectedReturn: number;
  }>;

  // Step 3: Consolidated Plan
  @Column({ 
    name: 'yearly_projections', 
    type: 'jsonb', 
    nullable: true,
  })
  yearlyProjections?: Array<{
    year: number;
    portfolioValue: number;
    contributions: number;
    returns: number;
    cumulativeValue: number;
    progressToGoal: number;
  }>;

  @Column({ name: 'scenarios', type: 'jsonb', nullable: true })
  scenarios?: {
    conservative: {
      finalValue: number;
      yearsToGoal: number;
      progressPercentage: number;
      returnRate: number;
    };
    moderate: {
      finalValue: number;
      yearsToGoal: number;
      progressPercentage: number;
      returnRate: number;
    };
    aggressive: {
      finalValue: number;
      yearsToGoal: number;
      progressPercentage: number;
      returnRate: number;
    };
  };

  // Tracking
  @Column({ name: 'linked_portfolio_ids', type: 'uuid', array: true, default: [] })
  linkedPortfolioIds: string[];

  @Column({ name: 'linked_goal_ids', type: 'uuid', array: true, default: [] })
  linkedGoalIds: string[];

  @Column({ name: 'current_portfolio_value', type: 'decimal', precision: 20, scale: 2, nullable: true })
  currentPortfolioValue?: number;

  @Column({ name: 'current_progress_percentage', type: 'decimal', precision: 8, scale: 4, nullable: true })
  currentProgressPercentage?: number;

  @Column({ 
    name: 'milestones', 
    type: 'jsonb', 
    nullable: true,
  })
  milestones?: Array<{
    year: number;
    description: string;
    value: number;
    targetValue?: number;
  }>;

  // Metadata
  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @Column({ name: 'base_currency', type: 'varchar', length: 10, default: 'VND' })
  baseCurrency: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;
}

