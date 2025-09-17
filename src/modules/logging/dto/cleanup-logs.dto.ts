import { IsOptional, IsDateString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum LogType {
  APPLICATION = 'application',
  REQUEST = 'request',
  BUSINESS_EVENT = 'business_event',
  PERFORMANCE = 'performance',
  ALL = 'all',
}

export enum CleanupStrategy {
  BY_AGE = 'by_age',
  BY_COUNT = 'by_count',
  BY_SIZE = 'by_size',
}

/**
 * DTO for log cleanup operations
 */
export class CleanupLogsDto {
  @ApiPropertyOptional({
    description: 'Type of logs to cleanup',
    enum: LogType,
    example: LogType.APPLICATION,
  })
  @IsOptional()
  @IsEnum(LogType)
  logType?: LogType = LogType.ALL;

  @ApiPropertyOptional({
    description: 'Cleanup strategy to use',
    enum: CleanupStrategy,
    example: CleanupStrategy.BY_AGE,
  })
  @IsOptional()
  @IsEnum(CleanupStrategy)
  strategy?: CleanupStrategy = CleanupStrategy.BY_AGE;

  @ApiPropertyOptional({
    description: 'Cutoff date for age-based cleanup (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  cutoffDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of logs to keep (for count-based cleanup)',
    example: 10000,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxLogs?: number;

  @ApiPropertyOptional({
    description: 'Maximum size in MB (for size-based cleanup)',
    example: 1000,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxSizeMb?: number;

  @ApiPropertyOptional({
    description: 'Dry run mode - preview what would be deleted without actually deleting',
    example: true,
  })
  @IsOptional()
  dryRun?: boolean = false;

  @ApiPropertyOptional({
    description: 'Filter by log level for cleanup',
    example: 'debug',
  })
  @IsOptional()
  logLevel?: string;

  @ApiPropertyOptional({
    description: 'Filter by service name for cleanup',
    example: 'portfolio-service',
  })
  @IsOptional()
  serviceName?: string;
}
