import { IsString, IsOptional, IsEnum, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  CRITICAL = 'critical',
}

/**
 * DTO for creating application logs
 */
export class CreateLogDto {
  @ApiProperty({
    description: 'Log level',
    enum: LogLevel,
    example: LogLevel.ERROR,
  })
  @IsEnum(LogLevel)
  level: LogLevel;

  @ApiProperty({
    description: 'Log message',
    example: 'User authentication failed',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Service name that generated the log',
    example: 'portfolio-service',
  })
  @IsOptional()
  @IsString()
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Module name within the service',
    example: 'authentication',
  })
  @IsOptional()
  @IsString()
  moduleName?: string;

  @ApiPropertyOptional({
    description: 'Additional context data',
    example: { userId: 'user-123', action: 'login' },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

/**
 * DTO for creating business event logs
 */
export class CreateBusinessEventLogDto {
  @ApiProperty({
    description: 'Type of business event',
    example: 'portfolio_created',
  })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({
    description: 'Type of entity affected',
    example: 'portfolio',
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    description: 'ID of the affected entity',
    example: 'portfolio-123',
  })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Action performed on the entity',
    example: 'create',
  })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({
    description: 'Previous values before the action',
    example: { name: 'Old Portfolio' },
  })
  @IsOptional()
  @IsObject()
  oldValues?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'New values after the action',
    example: { name: 'New Portfolio' },
  })
  @IsOptional()
  @IsObject()
  newValues?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'api', version: '1.0' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for creating performance logs
 */
export class CreatePerformanceLogDto {
  @ApiProperty({
    description: 'Name of the operation being measured',
    example: 'database_query',
  })
  @IsString()
  @IsNotEmpty()
  operationName: string;

  @ApiProperty({
    description: 'Duration of the operation in milliseconds',
    example: 150,
  })
  @IsString()
  @IsNotEmpty()
  durationMs: string;

  @ApiPropertyOptional({
    description: 'Memory usage in MB',
    example: 25.5,
  })
  @IsOptional()
  @IsString()
  memoryUsageMb?: string;

  @ApiPropertyOptional({
    description: 'CPU usage percentage',
    example: 15.2,
  })
  @IsOptional()
  @IsString()
  cpuUsagePercent?: string;

  @ApiPropertyOptional({
    description: 'Additional performance metrics',
    example: { queryCount: 5, cacheHits: 3 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
