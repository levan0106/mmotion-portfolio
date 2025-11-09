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

export enum CelebrationType {
  NONE = 'NONE',
  EMAIL = 'EMAIL',
  NOTIFICATION = 'NOTIFICATION',
  REPORT = 'REPORT',
  CUSTOM = 'CUSTOM',
}

@Entity('goal_achievements')
@Index(['goalId'])
@Index(['achievedDate'])
export class GoalAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({ name: 'achieved_date', type: 'date' })
  achievedDate: Date;

  @Column({ name: 'achieved_value', type: 'decimal', precision: 20, scale: 2 })
  achievedValue: number;

  @Column({ name: 'achievement_percentage', type: 'decimal', precision: 8, scale: 4 })
  achievementPercentage: number;

  @Column({ name: 'days_ahead', type: 'int', nullable: true })
  daysAhead: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({
    name: 'celebration_type',
    type: 'varchar',
    length: 50,
    enum: CelebrationType,
    default: CelebrationType.NOTIFICATION,
  })
  celebrationType: CelebrationType;

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
  isEarlyAchievement(): boolean {
    return this.daysAhead > 0;
  }

  isLateAchievement(): boolean {
    return this.daysAhead < 0;
  }

  isOnTimeAchievement(): boolean {
    return this.daysAhead === 0;
  }

  getAchievementQuality(): string {
    if (this.achievementPercentage >= 110) return 'EXCEEDED';
    if (this.achievementPercentage >= 100) return 'ACHIEVED';
    if (this.achievementPercentage >= 90) return 'NEARLY_ACHIEVED';
    return 'PARTIAL';
  }
}
