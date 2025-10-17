import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SnapshotTrackingStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum SnapshotTrackingType {
  AUTOMATED = 'automated',
  MANUAL = 'manual',
  TEST = 'test',
}

@Entity('snapshot_tracking')
@Index(['executionId'])
@Index(['status'])
@Index(['type'])
@Index(['createdAt'])
@Index(['portfolioId'])
export class SnapshotTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'execution_id' })
  executionId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'portfolio_id' })
  portfolioId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'portfolio_name' })
  portfolioName: string;

  @Column({
    type: 'enum',
    enum: SnapshotTrackingStatus,
    default: SnapshotTrackingStatus.STARTED,
  })
  status: SnapshotTrackingStatus;

  @Column({
    type: 'enum',
    enum: SnapshotTrackingType,
    default: SnapshotTrackingType.AUTOMATED,
  })
  type: SnapshotTrackingType;

  @Column({ type: 'timestamp', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date;

  @Column({ type: 'int', default: 0, name: 'total_snapshots' })
  totalSnapshots: number;

  @Column({ type: 'int', default: 0, name: 'successful_snapshots' })
  successfulSnapshots: number;

  @Column({ type: 'int', default: 0, name: 'failed_snapshots' })
  failedSnapshots: number;

  @Column({ type: 'int', default: 0, name: 'total_portfolios' })
  totalPortfolios: number;

  @Column({ type: 'int', default: 0, name: 'execution_time_ms' })
  executionTimeMs: number;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'created_by' })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'cron_expression' })
  cronExpression: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'timezone' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
