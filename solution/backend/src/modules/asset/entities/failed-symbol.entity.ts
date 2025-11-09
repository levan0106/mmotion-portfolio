import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalAssetTracking } from './global-asset-tracking.entity';

export enum FailedSymbolReason {
  API_ERROR = 'api_error',
  DATA_VALIDATION_ERROR = 'data_validation_error',
  PRICE_NOT_FOUND = 'price_not_found',
  INVALID_FORMAT = 'invalid_format',
  NETWORK_TIMEOUT = 'network_timeout',
  RATE_LIMIT = 'rate_limit',
  UNKNOWN_ERROR = 'unknown_error',
}

@Entity('failed_symbols')
@Index(['executionId'])
@Index(['symbol'])
@Index(['reason'])
@Index(['createdAt'])
export class FailedSymbol {
  @ApiProperty({
    description: 'Unique identifier for the failed symbol record',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Execution ID this failed symbol belongs to',
    example: 'auto_1703123456789',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'execution_id',
    comment: 'Execution ID this failed symbol belongs to'
  })
  executionId: string;

  @ApiProperty({
    description: 'Symbol that failed to process',
    example: 'AAPL',
  })
  @Column({
    type: 'varchar',
    length: 50,
    name: 'symbol',
    comment: 'Symbol that failed to process'
  })
  symbol: string;

  @ApiProperty({
    description: 'Asset type',
    example: 'FUND',
  })
  @Column({
    type: 'varchar',
    length: 20,
    name: 'asset_type',
    comment: 'Asset type'
  })
  assetType: string;

  @ApiProperty({
    description: 'Provider that failed',
    example: 'Alpha Vantage',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'provider',
    comment: 'Provider that failed'
  })
  provider: string;

  @ApiProperty({
    description: 'Reason for failure',
    enum: FailedSymbolReason,
    example: FailedSymbolReason.API_ERROR,
  })
  @Column({
    type: 'enum',
    enum: FailedSymbolReason,
    name: 'reason',
    comment: 'Reason for failure'
  })
  reason: FailedSymbolReason;

  @ApiProperty({
    description: 'Error message',
    example: 'Connection timeout after 30 seconds',
  })
  @Column({
    type: 'text',
    name: 'error_message',
    comment: 'Error message'
  })
  errorMessage: string;

  @ApiPropertyOptional({
    description: 'Error code if available',
    example: 'TIMEOUT_ERROR',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'error_code',
    comment: 'Error code if available'
  })
  errorCode: string;

  @ApiPropertyOptional({
    description: 'HTTP status code if available',
    example: 408,
  })
  @Column({
    type: 'int',
    nullable: true,
    name: 'status_code',
    comment: 'HTTP status code if available'
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Raw data that caused the failure',
    example: { symbol: 'AAPL', price: null, error: 'Invalid data format' },
  })
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'raw_data',
    comment: 'Raw data that caused the failure'
  })
  rawData: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Retry count',
    example: 2,
  })
  @Column({
    type: 'int',
    default: 0,
    name: 'retry_count',
    comment: 'Retry count'
  })
  retryCount: number;

  @ApiPropertyOptional({
    description: 'Whether this symbol was successfully retried',
    example: false,
  })
  @Column({
    type: 'boolean',
    default: false,
    name: 'retry_successful',
    comment: 'Whether this symbol was successfully retried'
  })
  retrySuccessful: boolean;

  @ApiPropertyOptional({
    description: 'When the retry was successful',
    example: '2023-12-21T10:35:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'retry_successful_at',
    comment: 'When the retry was successful'
  })
  retrySuccessfulAt: Date;

  @ApiProperty({
    description: 'When this record was created',
    example: '2023-12-21T10:30:00.000Z',
  })
  @CreateDateColumn({
    name: 'created_at',
    comment: 'When this record was created'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When this record was last updated',
    example: '2023-12-21T10:30:01.250Z',
  })
  @UpdateDateColumn({
    name: 'updated_at',
    comment: 'When this record was last updated'
  })
  updatedAt: Date;

  // Relationship
  @ManyToOne(() => GlobalAssetTracking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'executionId', referencedColumnName: 'executionId' })
  globalAssetTracking: GlobalAssetTracking;
}
