import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PortfolioGoal } from './portfolio-goal.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

@Entity('goal_portfolios')
@Index(['goalId', 'portfolioId'], { unique: true })
@Index(['portfolioId'], { unique: true })
export class GoalPortfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  @Column({ name: 'weight', type: 'decimal', precision: 5, scale: 4, default: 1.0 })
  weight: number; // Trọng số của portfolio trong mục tiêu (0-1)

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean; // Portfolio chính cho mục tiêu

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PortfolioGoal, (goal) => goal.goalPortfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: PortfolioGoal;

  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;
}
