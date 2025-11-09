import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { InvestorHolding } from '../../portfolio/entities/investor-holding.entity';
import { PortfolioPermission } from '../../portfolio/entities/portfolio-permission.entity';
import { User } from './user.entity';

/**
 * Account entity representing user accounts in the system.
 * Each account can own multiple portfolios.
 */
@Entity('accounts')
export class Account {
  /**
   * Unique identifier for the account.
   */
  @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
  accountId: string;

  /**
   * Account holder's name.
   */
  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  /**
   * Account holder's email address.
   */
  @Column({ type: 'varchar', length: 255, unique: true, name: 'email' })
  email: string;

  /**
   * Base currency for the account (e.g., 'VND', 'USD').
   */
  @Column({ type: 'varchar', length: 3, default: 'VND', name: 'base_currency' })
  baseCurrency: string;

  /**
   * Whether this account can invest in funds
   */
  @Column({ type: 'boolean', default: false, name: 'is_investor' })
  isInvestor: boolean;

  /**
   * Whether this is the main account (cannot be deleted)
   */
  @Column({ type: 'boolean', default: false, name: 'is_main_account' })
  isMainAccount: boolean;

  /**
   * Whether this is a demo account (accessible by all users)
   */
  @Column({ type: 'boolean', default: false, name: 'is_demo_account' })
  isDemoAccount: boolean;

  /**
   * ID of the user who owns this account.
   */
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId?: string;

  /**
   * Timestamp when the account was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the account was last updated.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Portfolios owned by this account.
   */
  @OneToMany(() => Portfolio, (portfolio) => portfolio.account)
  portfolios: Portfolio[];

  /**
   * Investor holdings in funds (only applicable when isInvestor = true)
   */
  @OneToMany(() => InvestorHolding, (holding) => holding.account)
  investorHoldings: InvestorHolding[];

  /**
   * Portfolio permissions for this account (portfolios this account has access to)
   */
  @OneToMany(() => PortfolioPermission, (permission) => permission.account)
  portfolioPermissions: PortfolioPermission[];

  /**
   * User who owns this account.
   */
  @ManyToOne(() => User, (user) => user.accounts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user?: User;

  // Computed properties for investor management
  /**
   * Check if this account can invest in funds
   */
  get canInvestInFunds(): boolean {
    return this.isInvestor;
  }

  /**
   * Get total number of fund holdings
   */
  get fundHoldingsCount(): number {
    return this.investorHoldings?.length || 0;
  }
}
