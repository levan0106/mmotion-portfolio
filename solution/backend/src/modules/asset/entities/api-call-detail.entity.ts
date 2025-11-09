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

export enum ApiCallStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

@Entity('api_call_details')
@Index(['executionId'])
@Index(['provider'])
@Index(['status'])
@Index(['startedAt'])
export class ApiCallDetail {
  @ApiProperty({
    description: 'Unique identifier for the API call detail',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Execution ID this API call belongs to',
    example: 'auto_1703123456789',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'execution_id',
    comment: 'Execution ID this API call belongs to'
  })
  executionId: string;

  @ApiProperty({
    description: 'API provider name',
    example: 'Alpha Vantage',
  })
  @Column({
    type: 'varchar',
    length: 100,
    name: 'provider',
    comment: 'API provider name'
  })
  provider: string;

  @ApiProperty({
    description: 'API endpoint URL',
    example: 'https://api.alphavantage.co/query',
  })
  @Column({
    type: 'text',
    name: 'endpoint',
    comment: 'API endpoint URL'
  })
  endpoint: string;

  @ApiProperty({
    description: 'HTTP method used',
    example: 'GET',
  })
  @Column({
    type: 'varchar',
    length: 10,
    name: 'method',
    comment: 'HTTP method used'
  })
  method: string;

  @ApiProperty({
    description: 'API call status',
    enum: ApiCallStatus,
    example: ApiCallStatus.SUCCESS,
  })
  @Column({
    type: 'enum',
    enum: ApiCallStatus,
    default: ApiCallStatus.PENDING,
    name: 'status',
    comment: 'API call status'
  })
  status: ApiCallStatus;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 1250,
  })
  @Column({
    type: 'int',
    name: 'response_time',
    comment: 'Response time in milliseconds'
  })
  responseTime: number;

  @ApiPropertyOptional({
    description: 'HTTP status code',
    example: 200,
  })
  @Column({
    type: 'int',
    nullable: true,
    name: 'status_code',
    comment: 'HTTP status code'
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Error message if call failed',
    example: 'Connection timeout',
  })
  @Column({
    type: 'text',
    nullable: true,
    name: 'error_message',
    comment: 'Error message if call failed'
  })
  errorMessage: string;

  @ApiProperty({
    description: 'Number of symbols processed',
    example: 150,
  })
  @Column({
    type: 'int',
    default: 0,
    name: 'symbols_processed',
    comment: 'Number of symbols processed'
  })
  symbolsProcessed: number;

  @ApiProperty({
    description: 'Number of successful symbols',
    example: 145,
  })
  @Column({
    type: 'int',
    default: 0,
    name: 'successful_symbols',
    comment: 'Number of successful symbols'
  })
  successfulSymbols: number;

  @ApiProperty({
    description: 'Number of failed symbols',
    example: 5,
  })
  @Column({
    type: 'int',
    default: 0,
    name: 'failed_symbols',
    comment: 'Number of failed symbols'
  })
  failedSymbols: number;

  @ApiPropertyOptional({
    description: 'Request data sent to API',
    example: { function: 'TIME_SERIES_DAILY', symbol: 'AAPL' },
  })
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'request_data',
    comment: 'Request data sent to API'
  })
  requestData: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Response data from API',
    example: { 'Meta Data': { '1. Information': 'Daily Prices' } },
  })
  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'response_data',
    comment: 'Response data from API'
  })
  responseData: Record<string, any>;

  @ApiProperty({
    description: 'When the API call started',
    example: '2023-12-21T10:30:00.000Z',
  })
  @Column({
    type: 'timestamp',
    name: 'started_at',
    comment: 'When the API call started'
  })
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'When the API call completed',
    example: '2023-12-21T10:30:01.250Z',
  })
  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'completed_at',
    comment: 'When the API call completed'
  })
  completedAt: Date;

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
  @JoinColumn({ name: 'execution_id', referencedColumnName: 'executionId' })
  globalAssetTracking: GlobalAssetTracking;
}
