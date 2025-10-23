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

export enum MetricType {
  VALUE = 'VALUE',
  PERCENTAGE = 'PERCENTAGE',
  RATIO = 'RATIO',
  COUNT = 'COUNT',
}

@Entity('goal_metrics')
@Index(['goalId'])
export class GoalMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({ name: 'metric_name', type: 'varchar', length: 100 })
  metricName: string;

  @Column({
    name: 'metric_type',
    type: 'varchar',
    length: 50,
    enum: MetricType,
  })
  metricType: MetricType;

  @Column({ name: 'target_value', type: 'decimal', precision: 20, scale: 4, nullable: true })
  targetValue: number;

  @Column({ name: 'current_value', type: 'decimal', precision: 20, scale: 4, default: 0 })
  currentValue: number;

  @Column({ name: 'unit', type: 'varchar', length: 20, nullable: true })
  unit: string;

  @Column({ name: 'warning_threshold', type: 'decimal', precision: 8, scale: 4, nullable: true })
  warningThreshold: number;

  @Column({ name: 'critical_threshold', type: 'decimal', precision: 8, scale: 4, nullable: true })
  criticalThreshold: number;

  @Column({ name: 'is_positive', type: 'boolean', default: true })
  isPositive: boolean;

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
    if (!this.targetValue || this.targetValue === 0) return 0;
    return ((this.currentValue - this.targetValue) / this.targetValue) * 100;
  }

  isWarning(): boolean {
    if (!this.warningThreshold) return false;
    const deviation = Math.abs(this.calculateDeviation());
    return deviation >= this.warningThreshold;
  }

  isCritical(): boolean {
    if (!this.criticalThreshold) return false;
    const deviation = Math.abs(this.calculateDeviation());
    return deviation >= this.criticalThreshold;
  }

  getStatus(): string {
    if (this.isCritical()) return 'CRITICAL';
    if (this.isWarning()) return 'WARNING';
    return 'NORMAL';
  }
}
