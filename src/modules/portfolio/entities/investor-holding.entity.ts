import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Account } from '../../shared/entities/account.entity';
import { Portfolio } from './portfolio.entity';
import { FundUnitTransaction } from './fund-unit-transaction.entity';

/**
 * InvestorHolding Entity
 * 
 * Tracks individual investor holdings in funds (portfolios with isFund = true).
 * Each record represents an investor's position in a specific fund.
 * 
 * Key Features:
 * - Tracks units, average cost, and P&L
 * - Links investors (accounts) to funds (portfolios)
 * - Maintains audit trail of holdings
 * - Supports subscription/redemption tracking
 */
@Entity('investor_holdings')
@Index(['accountId'])
@Index(['portfolioId'])
@Index(['createdAt'])
@Unique(['accountId', 'portfolioId'])
export class InvestorHolding {
  @PrimaryGeneratedColumn('uuid', { name: 'holding_id' })
  holdingId: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  /**
   * Total number of fund units held by the investor
   */
  @Column({ name: 'total_units', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalUnits: number;

  /**
   * Average cost per unit (weighted average of all purchases)
   */
  @Column({ name: 'avg_cost_per_unit', type: 'decimal', precision: 20, scale: 8, default: 0 })
  avgCostPerUnit: number;

  /**
   * Total amount invested by the investor
   */
  @Column({ name: 'total_investment', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalInvestment: number;

  /**
   * Current market value of the holding
   */
  @Column({ name: 'current_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
  currentValue: number;

  /**
   * Unrealized profit/loss (current value - total investment)
   */
  @Column({ name: 'unrealized_pnl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  unrealizedPnL: number;

  /**
   * Realized profit/loss from redemptions
   */
  @Column({ name: 'realized_pnl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  realizedPnL: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Account, account => account.investorHoldings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Portfolio, portfolio => portfolio.investorHoldings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @OneToMany(() => FundUnitTransaction, transaction => transaction.holding)
  transactions: FundUnitTransaction[];

  // Computed properties
  /**
   * Total profit/loss (realized + unrealized)
   */
  get totalPnL(): number {
    return this.realizedPnL + this.unrealizedPnL;
  }

  /**
   * Return percentage based on total investment
   */
  get returnPercentage(): number {
    if (this.totalInvestment <= 0) return 0;
    return (this.totalPnL / this.totalInvestment) * 100;
  }

  /**
   * Check if holding has any units
   */
  get hasUnits(): boolean {
    return this.totalUnits > 0;
  }

  /**
   * Check if holding is profitable
   */
  get isProfitable(): boolean {
    return this.totalPnL > 0;
  }
}
