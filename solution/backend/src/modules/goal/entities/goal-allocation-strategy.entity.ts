import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PortfolioGoal } from './portfolio-goal.entity';
import { Account } from '../../shared/entities/account.entity';

export enum StrategyType {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
  CUSTOM = 'CUSTOM',
}

export enum MarketCondition {
  BULL = 'BULL',
  BEAR = 'BEAR',
  SIDEWAYS = 'SIDEWAYS',
  VOLATILE = 'VOLATILE',
}

export enum EconomicCycle {
  EXPANSION = 'EXPANSION',
  RECESSION = 'RECESSION',
  RECOVERY = 'RECOVERY',
  PEAK = 'PEAK',
}

@Entity('goal_allocation_strategies')
@Index(['goalId'])
@Index(['strategyType'])
export class GoalAllocationStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({ name: 'strategy_name', type: 'varchar', length: 100 })
  strategyName: string;

  @Column({
    name: 'strategy_type',
    type: 'varchar',
    length: 50,
    enum: StrategyType,
  })
  strategyType: StrategyType;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'target_return', type: 'decimal', precision: 8, scale: 4, nullable: true })
  targetReturn: number;

  @Column({ name: 'max_volatility', type: 'decimal', precision: 8, scale: 4, nullable: true })
  maxVolatility: number;

  @Column({ name: 'max_drawdown', type: 'decimal', precision: 8, scale: 4, nullable: true })
  maxDrawdown: number;

  @Column({ name: 'sharpe_ratio_target', type: 'decimal', precision: 8, scale: 4, nullable: true })
  sharpeRatioTarget: number;

  @Column({
    name: 'market_condition',
    type: 'varchar',
    length: 50,
    enum: MarketCondition,
    nullable: true,
  })
  marketCondition: MarketCondition;

  @Column({
    name: 'economic_cycle',
    type: 'varchar',
    length: 50,
    enum: EconomicCycle,
    nullable: true,
  })
  economicCycle: EconomicCycle;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => PortfolioGoal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: PortfolioGoal;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: Account;

  // Business logic methods
  isEffective(): boolean {
    const now = new Date();
    if (this.effectiveFrom && now < this.effectiveFrom) return false;
    if (this.effectiveTo && now > this.effectiveTo) return false;
    return this.isActive;
  }

  isExpired(): boolean {
    return this.effectiveTo && new Date() > this.effectiveTo;
  }

  isUpcoming(): boolean {
    return this.effectiveFrom && new Date() < this.effectiveFrom;
  }

  getDaysUntilEffective(): number {
    if (!this.effectiveFrom) return 0;
    const now = new Date();
    const effective = new Date(this.effectiveFrom);
    const diffTime = effective.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilExpiry(): number {
    if (!this.effectiveTo) return null;
    const now = new Date();
    const expiry = new Date(this.effectiveTo);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
