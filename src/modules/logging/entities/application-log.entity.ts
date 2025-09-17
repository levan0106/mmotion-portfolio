import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../shared/entities/account.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Trade } from '../../trading/entities/trade.entity';

/**
 * ApplicationLog entity for storing application-level logs.
 * Tracks errors, warnings, info messages, and debug information
 * with context about the request, user, and business entities.
 */
@Entity('application_logs')
@Index('idx_app_logs_timestamp', ['timestamp'])
@Index('idx_app_logs_level', ['level'])
@Index('idx_app_logs_request_id', ['requestId'])
@Index('idx_app_logs_user_id', ['userId'])
@Index('idx_app_logs_service', ['serviceName'])
@Index('idx_app_logs_context', ['context'])
export class ApplicationLog {
  /**
   * Unique identifier for the log entry.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Timestamp when the log event occurred.
   * Uses timezone-aware timestamp for accurate time tracking.
   */
  @Column({ 
    type: 'timestamp with time zone', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  timestamp: Date;

  /**
   * Log level indicating the severity of the event.
   * Values: 'error', 'warn', 'info', 'debug', 'critical'
   */
  @Column({ type: 'varchar', length: 20, name: 'level' })
  level: string;

  /**
   * Human-readable message describing the log event.
   */
  @Column({ type: 'text', name: 'message' })
  message: string;

  /**
   * Additional context data as JSON.
   * Contains request details, business context, and metadata.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'context' })
  context: Record<string, any>;

  /**
   * Unique identifier for the HTTP request that generated this log.
   * Used for correlating logs within the same request.
   */
  @Column({ type: 'uuid', nullable: true, name: 'request_id' })
  requestId: string;

  /**
   * ID of the user who triggered the event.
   * References the Account entity.
   */
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  /**
   * Name of the service that generated the log.
   * Example: 'portfolio-management', 'trading-service'
   */
  @Column({ type: 'varchar', length: 100, name: 'service_name' })
  serviceName: string;

  /**
   * Name of the module within the service.
   * Example: 'portfolio', 'trading', 'market-data'
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'module_name' })
  moduleName: string;

  /**
   * Name of the function or method that generated the log.
   * Example: 'createPortfolio', 'executeTrade'
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'function_name' })
  functionName: string;

  /**
   * Error code for error-level logs.
   * Example: 'DB_CONNECTION_ERROR', 'VALIDATION_FAILED'
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  errorCode: string;

  /**
   * Stack trace for error-level logs.
   * Contains the full error stack for debugging purposes.
   */
  @Column({ type: 'text', nullable: true, name: 'stack_trace' })
  stackTrace: string;

  /**
   * Timestamp when the log entry was created in the database.
   * Automatically set by TypeORM.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Reference to the Account entity that generated this log.
   * Optional relationship for user-related logs.
   */
  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  account?: Account;

  /**
   * ID of the portfolio related to this log.
   * References the Portfolio entity.
   */
  @Column({ type: 'uuid', nullable: true, name: 'portfolio_id' })
  portfolioId: string;

  /**
   * ID of the trade related to this log.
   * References the Trade entity.
   */
  @Column({ type: 'uuid', nullable: true, name: 'trade_id' })
  tradeId: string;

  /**
   * Reference to the Portfolio entity related to this log.
   * Optional relationship for portfolio-related logs.
   */
  @ManyToOne(() => Portfolio, { nullable: true })
  @JoinColumn({ name: 'portfolio_id', referencedColumnName: 'portfolioId' })
  portfolio?: Portfolio;

  /**
   * Reference to the Trade entity related to this log.
   * Optional relationship for trade-related logs.
   */
  @ManyToOne(() => Trade, { nullable: true })
  @JoinColumn({ name: 'trade_id', referencedColumnName: 'tradeId' })
  trade?: Trade;
}
