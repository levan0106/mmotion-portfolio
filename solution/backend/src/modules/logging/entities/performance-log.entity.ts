import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * PerformanceLog entity for storing performance metrics and timing data.
 * Tracks operation performance, resource usage, and system metrics
 * for monitoring and optimization purposes.
 */
@Entity('performance_logs')
@Index('idx_perf_logs_timestamp', ['timestamp'])
@Index('idx_perf_logs_operation_name', ['operationName'])
@Index('idx_perf_logs_duration_ms', ['durationMs'])
@Index('idx_perf_logs_operation_type', ['operationType'])
export class PerformanceLog {
  /**
   * Unique identifier for the log entry.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Timestamp when the performance measurement was taken.
   * Uses timezone-aware timestamp for accurate time tracking.
   */
  @Column({ 
    type: 'timestamp with time zone', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  timestamp: Date;

  /**
   * Name of the operation that was measured.
   * Examples: 'portfolio_calculation', 'trade_execution', 'market_data_fetch'
   */
  @Column({ type: 'varchar', length: 100, name: 'operation_name' })
  operationName: string;

  /**
   * Type of operation that was performed.
   * Examples: 'CALCULATION', 'DATABASE_QUERY', 'API_CALL', 'CACHE_OPERATION'
   */
  @Column({ type: 'varchar', length: 50, name: 'operation_type' })
  operationType: string;

  /**
   * Duration of the operation in milliseconds.
   * Primary performance metric for operation timing.
   */
  @Column({ type: 'integer', name: 'duration_ms' })
  durationMs: number;

  /**
   * Memory usage during the operation in megabytes.
   * Optional metric for memory consumption tracking.
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'memory_usage_mb' })
  memoryUsageMb: number;

  /**
   * CPU usage percentage during the operation.
   * Optional metric for CPU consumption tracking.
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'cpu_usage_percent' })
  cpuUsagePercent: number;

  /**
   * Number of database queries executed during the operation.
   * Optional metric for database performance tracking.
   */
  @Column({ type: 'integer', nullable: true, name: 'database_queries' })
  databaseQueries: number;

  /**
   * Number of cache hits during the operation.
   * Optional metric for cache performance tracking.
   */
  @Column({ type: 'integer', nullable: true, name: 'cache_hits' })
  cacheHits: number;

  /**
   * Number of cache misses during the operation.
   * Optional metric for cache performance tracking.
   */
  @Column({ type: 'integer', nullable: true, name: 'cache_misses' })
  cacheMisses: number;

  /**
   * Number of external API calls made during the operation.
   * Optional metric for external service performance tracking.
   */
  @Column({ type: 'integer', nullable: true, name: 'external_api_calls' })
  externalApiCalls: number;

  /**
   * Additional metadata about the performance measurement.
   * Contains context-specific information like parameters, results, etc.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, any>;

  /**
   * Timestamp when the log entry was created in the database.
   * Automatically set by TypeORM.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
