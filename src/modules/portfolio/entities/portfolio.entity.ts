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
import { InvestorHolding } from './investor-holding.entity';

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

  // ===== NEW FIELDS FOR EXPLICIT VALUE AND P&L CATEGORIZATION =====
  
  /**
   * Total value of assets only (stocks, bonds, etc.)
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_asset_value' })
  totalAssetValue: number;

  /**
   * Total value of assets + deposits
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_invest_value' })
  totalInvestValue: number;

  /**
   * Total value of assets + deposits + cash
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'total_all_value' })
  totalAllValue: number;

  /**
   * Realized P&L from assets only
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'realized_asset_pnl' })
  realizedAssetPnL: number;

  /**
   * Realized P&L from assets + deposits
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'realized_invest_pnl' })
  realizedInvestPnL: number;

  /**
   * Realized P&L from assets + deposits + cash
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'realized_all_pnl' })
  realizedAllPnL: number;

  /**
   * Unrealized P&L from assets only
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'unrealized_asset_pnl' })
  unrealizedAssetPnL: number;

  /**
   * Unrealized P&L from assets + deposits
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'unrealized_invest_pnl' })
  unrealizedInvestPnL: number;

  /**
   * Unrealized P&L from assets + deposits + cash
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'unrealized_all_pnl' })
  unrealizedAllPnL: number;

  // ===== NAV/UNIT SYSTEM FIELDS =====
  
  /**
   * Whether this portfolio operates as a fund with multiple investors
   */
  @Column({ type: 'boolean', default: false, name: 'is_fund' })
  isFund: boolean;

  /**
   * Total number of fund units outstanding
   */
  @Column({ type: 'decimal', precision: 20, scale: 3, default: 0, name: 'total_outstanding_units' })
  totalOutstandingUnits: number;

  /**
   * Current NAV per unit
   */
  @Column({ type: 'decimal', precision: 20, scale: 3, default: 0, name: 'nav_per_unit' })
  navPerUnit: number;

  /**
   * Timestamp when NAV per unit was last calculated and updated
   */
  @Column({ type: 'timestamp', nullable: true, name: 'last_nav_date' })
  lastNavDate: Date;

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

  /**
   * Investor holdings in this fund (only applicable when isFund = true)
   */
  @OneToMany(() => InvestorHolding, (holding) => holding.portfolio)
  investorHoldings: InvestorHolding[];

  // Computed properties for fund management
  /**
   * Check if this portfolio can accept new investors
   */
  get canAcceptInvestors(): boolean {
    return this.isFund;
  }

  /**
   * Get total number of investors in this fund
   */
  get investorCount(): number {
    return this.investorHoldings?.length || 0;
  }

  /**
   * Check if NAV per unit is valid
   */
  get hasValidNavPerUnit(): boolean {
    return this.isFund && this.totalOutstandingUnits > 0 && this.navPerUnit > 0;
  }
}
