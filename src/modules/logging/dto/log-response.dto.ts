import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  CRITICAL = 'critical',
}

/**
 * Base response DTO for all log types
 */
export class BaseLogResponseDto {
  @ApiProperty({
    description: 'Unique log ID',
    example: 'log-123',
  })
  id: string;

  @ApiProperty({
    description: 'Log timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'User ID associated with the log',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Request ID for correlation',
    example: 'req-456',
  })
  requestId: string;
}

/**
 * Response DTO for application logs
 */
export class ApplicationLogResponseDto extends BaseLogResponseDto {
  @ApiProperty({
    description: 'Log level',
    enum: LogLevel,
    example: LogLevel.ERROR,
  })
  level: LogLevel;

  @ApiProperty({
    description: 'Log message',
    example: 'User authentication failed',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Service name',
    example: 'portfolio-service',
  })
  serviceName?: string;

  @ApiPropertyOptional({
    description: 'Module name',
    example: 'authentication',
  })
  moduleName?: string;

  @ApiPropertyOptional({
    description: 'Additional context data',
    example: { userId: 'user-123', action: 'login' },
  })
  context?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Account ID if applicable',
    example: 'account-123',
  })
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Portfolio ID if applicable',
    example: 'portfolio-123',
  })
  portfolioId?: string;

  @ApiPropertyOptional({
    description: 'Trade ID if applicable',
    example: 'trade-123',
  })
  tradeId?: string;
}

/**
 * Response DTO for request logs
 */
export class RequestLogResponseDto extends BaseLogResponseDto {
  @ApiProperty({
    description: 'HTTP method',
    example: 'GET',
  })
  method: string;

  @ApiProperty({
    description: 'Request URL',
    example: '/api/v1/portfolios',
  })
  url: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Request headers',
    example: { 'content-type': 'application/json' },
  })
  headers?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Request body',
    example: { name: 'New Portfolio' },
  })
  requestBody?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Response body',
    example: { id: 'portfolio-123', name: 'New Portfolio' },
  })
  responseBody?: Record<string, any>;

  @ApiProperty({
    description: 'Response time in milliseconds',
    example: 150,
  })
  responseTimeMs: number;

  @ApiPropertyOptional({
    description: 'Client IP address',
    example: '192.168.1.1',
  })
  clientIp?: string;

  @ApiPropertyOptional({
    description: 'User agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent?: string;
}

/**
 * Response DTO for business event logs
 */
export class BusinessEventLogResponseDto extends BaseLogResponseDto {
  @ApiProperty({
    description: 'Unique event ID',
    example: 'event-123',
  })
  eventId: string;

  @ApiProperty({
    description: 'Type of business event',
    example: 'portfolio_created',
  })
  eventType: string;

  @ApiProperty({
    description: 'Type of entity affected',
    example: 'portfolio',
  })
  entityType: string;

  @ApiProperty({
    description: 'ID of the affected entity',
    example: 'portfolio-123',
  })
  entityId: string;

  @ApiProperty({
    description: 'Action performed on the entity',
    example: 'create',
  })
  action: string;

  @ApiPropertyOptional({
    description: 'Previous values before the action',
    example: { name: 'Old Portfolio' },
  })
  oldValues?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'New values after the action',
    example: { name: 'New Portfolio' },
  })
  newValues?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'api', version: '1.0' },
  })
  metadata?: Record<string, any>;
}

/**
 * Response DTO for performance logs
 */
export class PerformanceLogResponseDto extends BaseLogResponseDto {
  @ApiProperty({
    description: 'Name of the operation being measured',
    example: 'database_query',
  })
  operationName: string;

  @ApiProperty({
    description: 'Duration of the operation in milliseconds',
    example: 150,
  })
  durationMs: number;

  @ApiPropertyOptional({
    description: 'Memory usage in MB',
    example: 25.5,
  })
  memoryUsageMb?: number;

  @ApiPropertyOptional({
    description: 'CPU usage percentage',
    example: 15.2,
  })
  cpuUsagePercent?: number;

  @ApiPropertyOptional({
    description: 'Additional performance metrics',
    example: { queryCount: 5, cacheHits: 3 },
  })
  metadata?: Record<string, any>;
}

/**
 * Pagination metadata DTO
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevious: boolean;
}

/**
 * Paginated response DTO for application logs
 */
export class PaginatedApplicationLogsDto {
  @ApiProperty({
    description: 'Array of application logs',
    type: [ApplicationLogResponseDto],
  })
  data: ApplicationLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

/**
 * Paginated response DTO for request logs
 */
export class PaginatedRequestLogsDto {
  @ApiProperty({
    description: 'Array of request logs',
    type: [RequestLogResponseDto],
  })
  data: RequestLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

/**
 * Paginated response DTO for business event logs
 */
export class PaginatedBusinessEventLogsDto {
  @ApiProperty({
    description: 'Array of business event logs',
    type: [BusinessEventLogResponseDto],
  })
  data: BusinessEventLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}

/**
 * Paginated response DTO for performance logs
 */
export class PaginatedPerformanceLogsDto {
  @ApiProperty({
    description: 'Array of performance logs',
    type: [PerformanceLogResponseDto],
  })
  data: PerformanceLogResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
