import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum StatisticsGroupBy {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum StatisticsMetric {
  COUNT = 'count',
  ERROR_RATE = 'error_rate',
  RESPONSE_TIME = 'response_time',
  THROUGHPUT = 'throughput',
}

/**
 * DTO for querying log statistics with grouping and filtering options
 */
export class LogStatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by service name',
    example: 'portfolio-service',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Filter by module name',
    example: 'portfolio',
  })
  @IsOptional()
  @IsString()
  moduleName?: string;

  @ApiPropertyOptional({
    description: 'Start date for statistics (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for statistics (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Group statistics by time period',
    enum: StatisticsGroupBy,
    example: StatisticsGroupBy.DAY,
  })
  @IsOptional()
  @IsEnum(StatisticsGroupBy)
  groupBy?: StatisticsGroupBy = StatisticsGroupBy.DAY;

  @ApiPropertyOptional({
    description: 'Metric to calculate',
    enum: StatisticsMetric,
    example: StatisticsMetric.COUNT,
  })
  @IsOptional()
  @IsEnum(StatisticsMetric)
  metric?: StatisticsMetric = StatisticsMetric.COUNT;
}
