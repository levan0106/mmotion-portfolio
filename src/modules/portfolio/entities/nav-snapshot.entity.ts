import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

/**
 * NavSnapshot entity representing historical Net Asset Value snapshots.
 * Used for tracking portfolio performance over time.
 */
@Entity('nav_snapshots')
@Index(['portfolioId', 'navDate'])
@Index(['navDate'])
export class NavSnapshot {
  /**
   * ID of the portfolio this snapshot belongs to.
   */
  @PrimaryColumn({ type: 'uuid' })
  portfolioId: string;

  /**
   * Date of the NAV snapshot.
   */
  @PrimaryColumn({ type: 'date', name: 'nav_date' })
  navDate: Date;

  /**
   * Net Asset Value on this date.
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'nav_value' })
  navValue: number;

  /**
   * Cash balance on this date.
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'cash_balance' })
  cashBalance: number;

  /**
   * Total portfolio value on this date.
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_value' })
  totalValue: number;

  /**
   * Total outstanding units for funds on this date.
   */
  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'total_outstanding_units', default: 0 })
  totalOutstandingUnits: number;

  /**
   * NAV per unit for funds on this date.
   */
  @Column({ type: 'decimal', precision: 20, scale: 8, name: 'nav_per_unit', default: 0 })
  navPerUnit: number;

  /**
   * Timestamp when this snapshot was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Portfolio this snapshot belongs to.
   */
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.navSnapshots)
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;
}
