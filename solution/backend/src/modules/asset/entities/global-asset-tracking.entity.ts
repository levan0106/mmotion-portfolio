import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GlobalAssetSyncStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum GlobalAssetSyncType {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
  TRIGGERED = 'triggered',
}

export enum GlobalAssetSyncSource {
  CRON_JOB = 'cron_job',
  API_TRIGGER = 'api_trigger',
  MANUAL_TRIGGER = 'manual_trigger',
  SYSTEM_RECOVERY = 'system_recovery',
}

/**
 * Global Asset Tracking Entity
 * Tracks detailed information about each global asset sync execution for monitoring and troubleshooting
 */
@Entity('global_asset_tracking')
@Index(['executionId'])
@Index(['status'])
@Index(['type'])
@Index(['source'])
@Index(['createdAt'])
@Index(['startedAt'])
@Index(['completedAt'])
export class GlobalAssetTracking {
  @ApiProperty({
    description: 'Unique identifier for the tracking record',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Unique execution ID for this sync operation',
    example: 'auto_1703123456789',
  })
  @Column({ 
    type: 'varchar', 
    length: 100, 
    name: 'execution_id',
    comment: 'Unique execution ID for this sync operation'
  })
  executionId: string;

  @ApiProperty({
    description: 'Current status of the sync operation',
    enum: GlobalAssetSyncStatus,
    example: GlobalAssetSyncStatus.COMPLETED,
  })
  @Column({
    type: 'enum',
    enum: GlobalAssetSyncStatus,
    default: GlobalAssetSyncStatus.STARTED,
    name: 'status',
    comment: 'Current status of the sync operation'
  })
  status: GlobalAssetSyncStatus;

  @ApiProperty({
    description: 'Type of sync operation',
    enum: GlobalAssetSyncType,
    example: GlobalAssetSyncType.SCHEDULED,
  })
  @Column({
    type: 'enum',
    enum: GlobalAssetSyncType,
    default: GlobalAssetSyncType.SCHEDULED,
    name: 'type',
    comment: 'Type of sync operation'
  })
  type: GlobalAssetSyncType;

  @ApiProperty({
    description: 'Source that triggered the sync',
    enum: GlobalAssetSyncSource,
    example: GlobalAssetSyncSource.CRON_JOB,
  })
  @Column({
    type: 'enum',
    enum: GlobalAssetSyncSource,
    default: GlobalAssetSyncSource.CRON_JOB,
    name: 'source',
    comment: 'Source that triggered the sync'
  })
  source: GlobalAssetSyncSource;

  @ApiProperty({
    description: 'When the sync operation started',
    example: '2023-12-21T10:30:00.000Z',
  })
  @Column({
    type: 'timestamp',
    name: 'started_at',
    comment: 'When the sync operation started'
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'When the sync operation completed',
    example: '2023-12-21T10:35:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'completed_at',
    comment: 'When the sync operation completed'
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Total execution time in milliseconds',
    example: 300000,
  })
  @Column({ 
    type: 'bigint', 
    default: 0, 
    name: 'execution_time_ms',
    comment: 'Total execution time in milliseconds'
  })
  executionTimeMs: number;

  // Sync Statistics
  @ApiProperty({
    description: 'Total number of symbols processed',
    example: 150,
  })
  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'total_symbols',
    comment: 'Total number of symbols processed'
  })
  totalSymbols: number;

  @ApiProperty({
    description: 'Number of symbols successfully updated',
    example: 145,
  })
  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'successful_updates',
    comment: 'Number of symbols successfully updated'
  })
  successfulUpdates: number;

  @ApiProperty({
    description: 'Number of symbols that failed to update',
    example: 5,
  })
  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'failed_updates',
    comment: 'Number of symbols that failed to update'
  })
  failedUpdates: number;

  @ApiProperty({
    description: 'Success rate percentage',
    example: 96.67,
  })
  @Column({ 
    type: 'decimal', 
    precision: 5, 
    scale: 2, 
    default: 0, 
    name: 'success_rate',
    comment: 'Success rate percentage'
  })
  successRate: number;

  // External API Statistics
  @ApiProperty({
    description: 'Number of external APIs used',
    example: 5,
  })
  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'total_apis',
    comment: 'Number of external APIs used'
  })
  totalApis: number;

  @ApiProperty({
    description: 'Number of APIs that succeeded',
    example: 4,
  })
  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'successful_apis',
    comment: 'Number of APIs that succeeded'
  })
  successfulApis: number;

  @ApiProperty({
    description: 'Number of APIs that failed',
    example: 1,
  })
  @Column({ 
    type: 'int', 
    default: 0, 
    name: 'failed_apis',
    comment: 'Number of APIs that failed'
  })
  failedApis: number;

  @ApiPropertyOptional({
    description: 'List of symbols that failed to sync',
    example: ['AAPL', 'GOOGL', 'MSFT'],
  })
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'failed_symbols',
    comment: 'List of symbols that failed to sync'
  })
  failedSymbols: string[];

  // Error Information
  @ApiPropertyOptional({
    description: 'Error message if sync failed',
    example: 'Connection timeout to external API',
  })
  @Column({ 
    type: 'text', 
    nullable: true, 
    name: 'error_message',
    comment: 'Error message if sync failed'
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Error code if sync failed',
    example: 'CONNECTION_TIMEOUT',
  })
  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    name: 'error_code',
    comment: 'Error code if sync failed'
  })
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Stack trace if sync failed',
    example: 'Error: Connection timeout\n    at fetchData...',
  })
  @Column({ 
    type: 'text', 
    nullable: true, 
    name: 'stack_trace',
    comment: 'Stack trace if sync failed'
  })
  stackTrace?: string;

  // Configuration Information
  @ApiPropertyOptional({
    description: 'Cron expression used for scheduled syncs',
    example: '0 */15 * * * *',
  })
  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    name: 'cron_expression',
    comment: 'Cron expression used for scheduled syncs'
  })
  cronExpression?: string;

  @ApiPropertyOptional({
    description: 'Timezone used for the sync',
    example: 'Asia/Ho_Chi_Minh',
  })
  @Column({ 
    type: 'varchar', 
    length: 50, 
    nullable: true, 
    name: 'timezone',
    comment: 'Timezone used for the sync'
  })
  timezone?: string;

  @ApiProperty({
    description: 'Whether auto sync was enabled at the time of execution',
    example: true,
  })
  @Column({ 
    type: 'boolean', 
    default: true, 
    name: 'auto_sync_enabled',
    comment: 'Whether auto sync was enabled at the time of execution'
  })
  autoSyncEnabled: boolean;

  // User Information
  @ApiPropertyOptional({
    description: 'User who triggered the sync (if manual)',
    example: 'admin@example.com',
  })
  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: true, 
    name: 'triggered_by',
    comment: 'User who triggered the sync (if manual)'
  })
  triggeredBy?: string;

  @ApiPropertyOptional({
    description: 'IP address that triggered the sync',
    example: '192.168.1.100',
  })
  @Column({ 
    type: 'varchar', 
    length: 45, 
    nullable: true, 
    name: 'trigger_ip',
    comment: 'IP address that triggered the sync'
  })
  triggerIp?: string;

  // Metadata
  @ApiPropertyOptional({
    description: 'Additional metadata about the sync operation',
    example: { version: '1.0.0', environment: 'production' },
  })
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'metadata',
    comment: 'Additional metadata about the sync operation'
  })
  metadata?: Record<string, any>;

  // Timestamps
  @ApiProperty({
    description: 'When the record was created',
    example: '2023-12-21T10:30:00.000Z',
  })
  @CreateDateColumn({
    name: 'created_at',
    comment: 'When the record was created'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the record was last updated',
    example: '2023-12-21T10:35:00.000Z',
  })
  @UpdateDateColumn({
    name: 'updated_at',
    comment: 'When the record was last updated'
  })
  updatedAt: Date;

  /**
   * Calculate execution time in milliseconds
   */
  calculateExecutionTime(): number {
    if (!this.startedAt) return 0;
    const endTime = this.completedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  /**
   * Check if the sync operation is currently running
   */
  isRunning(): boolean {
    return this.status === GlobalAssetSyncStatus.IN_PROGRESS;
  }

  /**
   * Check if the sync operation completed successfully
   */
  isCompleted(): boolean {
    return this.status === GlobalAssetSyncStatus.COMPLETED;
  }

  /**
   * Check if the sync operation failed
   */
  isFailed(): boolean {
    return this.status === GlobalAssetSyncStatus.FAILED;
  }

  /**
   * Check if the sync operation was cancelled
   */
  isCancelled(): boolean {
    return this.status === GlobalAssetSyncStatus.CANCELLED;
  }

  /**
   * Get execution duration in a human-readable format
   */
  getExecutionDuration(): string {
    const ms = this.executionTimeMs;
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  /**
   * Get success rate as a formatted string
   */
  getSuccessRateFormatted(): string {
    return `${this.successRate.toFixed(2)}%`;
  }

  /**
   * Check if the sync has any errors
   */
  hasErrors(): boolean {
    return !!(this.errorMessage || this.errorCode || this.stackTrace);
  }

  /**
   * Get a summary of the sync operation
   */
  getSummary(): string {
    const status = this.status.toUpperCase();
    const duration = this.getExecutionDuration();
    const successRate = this.getSuccessRateFormatted();
    return `${status} - ${duration} - ${successRate} success rate`;
  }
}
