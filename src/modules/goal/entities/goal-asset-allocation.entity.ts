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
import { PortfolioGoal } from './portfolio-goal.entity';

export enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  GOLD = 'GOLD',
  DEPOSIT = 'DEPOSIT',
  CASH = 'CASH',
  REAL_ESTATE = 'REAL_ESTATE',
  CRYPTO = 'CRYPTO',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RebalanceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

@Entity('goal_asset_allocation')
@Index(['goalId'])
@Index(['assetType'])
export class GoalAssetAllocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({
    name: 'asset_type',
    type: 'varchar',
    length: 50,
    enum: AssetType,
  })
  assetType: AssetType;

  @Column({ name: 'target_percentage', type: 'decimal', precision: 8, scale: 4 })
  targetPercentage: number;

  @Column({ name: 'current_percentage', type: 'decimal', precision: 8, scale: 4, default: 0 })
  currentPercentage: number;

  @Column({ name: 'min_percentage', type: 'decimal', precision: 8, scale: 4, nullable: true })
  minPercentage: number;

  @Column({ name: 'max_percentage', type: 'decimal', precision: 8, scale: 4, nullable: true })
  maxPercentage: number;

  @Column({ name: 'expected_return', type: 'decimal', precision: 8, scale: 4, nullable: true })
  expectedReturn: number;

  @Column({
    name: 'risk_level',
    type: 'varchar',
    length: 20,
    enum: RiskLevel,
    nullable: true,
  })
  riskLevel: RiskLevel;

  @Column({ name: 'volatility', type: 'decimal', precision: 8, scale: 4, nullable: true })
  volatility: number;

  @Column({
    name: 'rebalance_frequency',
    type: 'varchar',
    length: 20,
    enum: RebalanceFrequency,
    default: RebalanceFrequency.MONTHLY,
  })
  rebalanceFrequency: RebalanceFrequency;

  @Column({ name: 'last_rebalanced', type: 'timestamp', nullable: true })
  lastRebalanced: Date;

  @Column({ name: 'next_rebalance', type: 'timestamp', nullable: true })
  nextRebalance: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'auto_rebalance', type: 'boolean', default: true })
  autoRebalance: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PortfolioGoal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: PortfolioGoal;

  // Business logic methods
  calculateDeviation(): number {
    return this.currentPercentage - this.targetPercentage;
  }

  isOutOfRange(): boolean {
    const deviation = Math.abs(this.calculateDeviation());
    return deviation > 5; // 5% deviation threshold
  }

  isMinViolated(): boolean {
    if (!this.minPercentage) return false;
    return this.currentPercentage < this.minPercentage;
  }

  isMaxViolated(): boolean {
    if (!this.maxPercentage) return false;
    return this.currentPercentage > this.maxPercentage;
  }

  needsRebalancing(): boolean {
    return this.isOutOfRange() || this.isMinViolated() || this.isMaxViolated();
  }

  calculateNextRebalanceDate(): Date {
    if (!this.lastRebalanced) return new Date();
    
    const lastDate = new Date(this.lastRebalanced);
    const nextDate = new Date(lastDate);
    
    switch (this.rebalanceFrequency) {
      case RebalanceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RebalanceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RebalanceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RebalanceFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RebalanceFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }
}
