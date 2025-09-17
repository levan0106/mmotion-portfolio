import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

/**
 * CashFlow entity representing cash movements in and out of portfolios.
 * Used for tracking deposits, withdrawals, and other cash transactions.
 */
@Entity('cash_flows')
@Index(['portfolioId'])
@Index(['flowDate'])
export class CashFlow {
  /**
   * Unique identifier for the cash flow record.
   */
  @PrimaryGeneratedColumn('uuid')
  cashflowId: string;

  /**
   * ID of the portfolio this cash flow belongs to.
   */
  @Column({ type: 'uuid' })
  portfolioId: string;

  /**
   * Date of the cash flow transaction.
   */
  @Column({ type: 'timestamp' })
  flowDate: Date;

  /**
   * Amount of the cash flow (positive for inflow, negative for outflow).
   */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  /**
   * Currency of the cash flow.
   */
  @Column({ type: 'varchar', length: 3 })
  currency: string;

  /**
   * Type of cash flow (e.g., 'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST').
   */
  @Column({ type: 'varchar', length: 50 })
  type: string;

  /**
   * Description of the cash flow transaction.
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Timestamp when this cash flow record was created.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Portfolio this cash flow belongs to.
   */
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.cashFlows)
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;
}
