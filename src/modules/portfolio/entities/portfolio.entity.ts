import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../shared/entities/account.entity';
import { NavSnapshot } from './nav-snapshot.entity';
import { CashFlow } from './cash-flow.entity';
import { Trade } from '../../trading/entities/trade.entity';
import { Deposit } from './deposit.entity';

/**
 * Portfolio entity representing investment portfolios.
 * Each portfolio belongs to an account and contains multiple assets.
 */
@Entity('portfolios')
@Index(['accountId'])
export class Portfolio {
  /**
   * Unique identifier for the portfolio.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  /**
   * ID of the account that owns this portfolio.
   */
  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  /**
   * Name of the portfolio.
   */
  @Column({ type: 'varchar', length: 255 })
  name: string;

  /**
   * Base currency for the portfolio (e.g., 'VND', 'USD').
   */
  @Column({ type: 'varchar', length: 3, default: 'VND', name: 'base_currency' })
  baseCurrency: string;

  /**
   * Current total value of the portfolio in base currency.
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_value' })
  totalValue: number;

  /**
   * Current cash balance in the portfolio.
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'cash_balance' })
  cashBalance: number;

  /**
   * Unrealized profit/loss from current positions.
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'unrealized_pl' })
  unrealizedPl: number;

  /**
   * Realized profit/loss from completed trades.
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'realized_pl' })
  realizedPl: number;

  /**
   * Timestamp when the portfolio was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the portfolio was last updated.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Account that owns this portfolio.
   */
  @ManyToOne(() => Account, (account) => account.portfolios)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  /**
   * Historical NAV snapshots for this portfolio.
   */
  @OneToMany(() => NavSnapshot, (navSnapshot) => navSnapshot.portfolio)
  navSnapshots: NavSnapshot[];

  /**
   * Cash flows for this portfolio.
   */
  @OneToMany(() => CashFlow, (cashFlow) => cashFlow.portfolio)
  cashFlows: CashFlow[];

  /**
   * Trades for this portfolio.
   * Portfolio is linked to Assets through Trades only.
   */
  @OneToMany(() => Trade, (trade) => trade.portfolio)
  trades: Trade[];

  /**
   * Deposits for this portfolio.
   */
  @OneToMany(() => Deposit, (deposit) => deposit.portfolio)
  deposits: Deposit[];
}
