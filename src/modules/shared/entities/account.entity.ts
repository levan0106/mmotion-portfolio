import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

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
}
