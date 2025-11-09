import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Account } from '../../shared/entities/account.entity';
import { GoalPortfolio } from './goal-portfolio.entity';


export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  ACHIEVED = 'ACHIEVED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

@Entity('portfolio_goals')
@Index(['accountId', 'status'])
export class PortfolioGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'target_value', type: 'decimal', precision: 20, scale: 2, nullable: true })
  targetValue: number;

  @Column({ name: 'target_date', type: 'date', nullable: true })
  targetDate: Date;

  @Column({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'auto_track', type: 'boolean', default: true })
  autoTrack: boolean;

  @Column({ name: 'current_value', type: 'decimal', precision: 20, scale: 2, default: 0 })
  currentValue: number;

  @Column({ name: 'achievement_percentage', type: 'decimal', precision: 8, scale: 4, default: 0 })
  achievementPercentage: number;

  @Column({ name: 'days_remaining', type: 'int', nullable: true })
  daysRemaining: number;

  @Column({ name: 'last_updated', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => GoalPortfolio, (goalPortfolio) => goalPortfolio.goal, { cascade: true })
  goalPortfolios: GoalPortfolio[];

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;


  // Business logic methods
  calculateDaysRemaining(): number {
    if (!this.targetDate) return null;
    const today = new Date();
    const target = new Date(this.targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateAchievementPercentage(): number {
    if (!this.targetValue || this.targetValue === 0) return 0;
    return (this.currentValue / this.targetValue) * 100;
  }

  isAchieved(): boolean {
    return this.achievementPercentage >= 100;
  }

  isOverdue(): boolean {
    if (!this.targetDate) return false;
    return new Date() > new Date(this.targetDate) && !this.isAchieved();
  }

  getProgressStatus(): string {
    if (this.isAchieved()) return 'ACHIEVED';
    if (this.isOverdue()) return 'OVERDUE';
    if (this.achievementPercentage >= 80) return 'ON_TRACK';
    if (this.achievementPercentage >= 50) return 'MODERATE';
    return 'NEEDS_ATTENTION';
  }
}
