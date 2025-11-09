import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Account } from '../../shared/entities/account.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Trade } from '../../trading/entities/trade.entity';

/**
 * BusinessEventLog entity for storing business process events.
 * Tracks business events like portfolio creation, trade execution,
 * asset allocation changes, and other significant business operations.
 */
@Entity('business_event_logs')
@Unique('UQ_business_event_logs_event_id', ['eventId'])
@Index('idx_biz_logs_timestamp', ['timestamp'])
@Index('idx_biz_logs_event_type', ['eventType'])
@Index('idx_biz_logs_entity_type', ['entityType'])
@Index('idx_biz_logs_user_id', ['userId'])
@Index('idx_biz_logs_action', ['action'])
export class BusinessEventLog {
  /**
   * Unique identifier for the log entry.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique identifier for the business event.
   * Used for correlating related events and preventing duplicates.
   */
  @Column({ type: 'uuid', unique: true, name: 'event_id' })
  eventId: string;

  /**
   * Timestamp when the business event occurred.
   * Uses timezone-aware timestamp for accurate time tracking.
   */
  @Column({ 
    type: 'timestamp with time zone', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  timestamp: Date;

  /**
   * Type of business event that occurred.
   * Examples: 'PORTFOLIO_CREATED', 'TRADE_EXECUTED', 'ASSET_ALLOCATED', 'RISK_TARGET_SET'
   */
  @Column({ type: 'varchar', length: 100, name: 'event_type' })
  eventType: string;

  /**
   * Type of entity that was affected by the event.
   * Examples: 'PORTFOLIO', 'TRADE', 'ASSET', 'RISK_TARGET'
   */
  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType: string;

  /**
   * ID of the specific entity that was affected.
   * References the primary key of the affected entity.
   */
  @Column({ type: 'uuid', name: 'entity_id' })
  entityId: string;

  /**
   * ID of the user who triggered the business event.
   * References the Account entity.
   */
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  /**
   * Action that was performed on the entity.
   * Examples: 'CREATE', 'UPDATE', 'DELETE', 'EXECUTE', 'ALLOCATE'
   */
  @Column({ type: 'varchar', length: 50, name: 'action' })
  action: string;

  /**
   * Previous values of the entity before the event.
   * Contains the state of the entity before the change occurred.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
  oldValues: Record<string, any>;

  /**
   * New values of the entity after the event.
   * Contains the state of the entity after the change occurred.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
  newValues: Record<string, any>;

  /**
   * Additional metadata about the business event.
   * Contains context-specific information like source, reason, etc.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any>;

  /**
   * Timestamp when the log entry was created in the database.
   * Automatically set by TypeORM.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Reference to the Account entity that triggered the event.
   * Optional relationship for user-related events.
   */
  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  account?: Account;

  /**
   * Reference to the Portfolio entity related to this event.
   * Optional relationship for portfolio-related events.
   */
  @ManyToOne(() => Portfolio, { nullable: true })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio?: Portfolio;

  /**
   * Reference to the Trade entity related to this event.
   * Optional relationship for trade-related events.
   */
  @ManyToOne(() => Trade, { nullable: true })
  @JoinColumn({ name: 'trade_id', referencedColumnName: 'tradeId' })
  trade?: Trade;
}
