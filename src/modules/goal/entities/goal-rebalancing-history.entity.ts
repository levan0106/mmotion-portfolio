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

export enum RebalanceType {
  SCHEDULED = 'SCHEDULED',
  THRESHOLD = 'THRESHOLD',
  MANUAL = 'MANUAL',
  MARKET_CONDITION = 'MARKET_CONDITION',
  GOAL_CHANGE = 'GOAL_CHANGE',
}

@Entity('goal_rebalancing_history')
@Index(['goalId'])
@Index(['rebalanceDate'])
export class GoalRebalancingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({ name: 'rebalance_date', type: 'date' })
  rebalanceDate: Date;

  @Column({
    name: 'rebalance_type',
    type: 'varchar',
    length: 50,
    enum: RebalanceType,
  })
  rebalanceType: RebalanceType;

  @Column({ name: 'trigger_reason', type: 'text', nullable: true })
  triggerReason: string;

  @Column({ name: 'old_allocation', type: 'jsonb', nullable: true })
  oldAllocation: Record<string, any>;

  @Column({ name: 'new_allocation', type: 'jsonb', nullable: true })
  newAllocation: Record<string, any>;

  @Column({ name: 'changes_made', type: 'jsonb', nullable: true })
  changesMade: Record<string, any>;

  @Column({ name: 'expected_improvement', type: 'decimal', precision: 8, scale: 4, nullable: true })
  expectedImprovement: number;

  @Column({ name: 'actual_improvement', type: 'decimal', precision: 8, scale: 4, nullable: true })
  actualImprovement: number;

  @Column({ name: 'cost_of_rebalancing', type: 'decimal', precision: 20, scale: 2, default: 0 })
  costOfRebalancing: number;

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
  calculateNetImprovement(): number {
    return (this.actualImprovement || 0) - (this.costOfRebalancing || 0);
  }

  isProfitable(): boolean {
    return this.calculateNetImprovement() > 0;
  }

  getEfficiencyRatio(): number {
    if (!this.expectedImprovement || this.expectedImprovement === 0) return 0;
    return (this.actualImprovement || 0) / this.expectedImprovement;
  }

  isEfficient(): boolean {
    return this.getEfficiencyRatio() >= 0.8; // 80% efficiency threshold
  }

  getRebalancingQuality(): string {
    const efficiency = this.getEfficiencyRatio();
    if (efficiency >= 1.0) return 'EXCELLENT';
    if (efficiency >= 0.8) return 'GOOD';
    if (efficiency >= 0.6) return 'FAIR';
    return 'POOR';
  }
}
