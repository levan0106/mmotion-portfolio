import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpStatus,
  HttpCode,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { LogRepository, LogFilterOptions } from '../repositories/log.repository';
import { LoggingService } from '../services/logging.service';
import { ContextManager } from '../services/context-manager.service';
import { LogSanitizationService } from '../services/log-sanitization.service';
import { LogAggregationService, LogAggregationOptions } from '../services/log-aggregation.service';
import { LogSummarizationService, LogSummaryOptions } from '../services/log-summarization.service';
import { LogAnalyticsService, LogAnalyticsOptions } from '../services/log-analytics.service';
import { LogAccessControlService } from '../services/log-access-control.service';
import { LogAccessGuard, LogPermissions, LogRole, LOG_PERMISSIONS, LOG_ROLES } from '../guards/log-access.guard';
import {
  CreateLogDto,
  CreateBusinessEventLogDto,
  CreatePerformanceLogDto,
  LogQueryDto,
  LogStatisticsQueryDto,
  CleanupLogsDto,
  ApplicationLogResponseDto,
  PaginatedApplicationLogsDto,
  PaginatedRequestLogsDto,
  PaginatedBusinessEventLogsDto,
  PaginatedPerformanceLogsDto,
} from '../dto';

// Additional DTOs for advanced features
export class LogAggregationQueryDto {
  startDate: string;
  endDate: string;
  groupBy: 'hour' | 'day' | 'week' | 'month';
  levels?: string[];
  modules?: string[];
  userIds?: string[];
  requestIds?: string[];
}

export class LogSummaryQueryDto {
  startDate: string;
  endDate: string;
  summaryType: 'daily' | 'weekly' | 'monthly' | 'custom';
  levels?: string[];
  modules?: string[];
  userIds?: string[];
  requestIds?: string[];
}

export class LogAnalyticsQueryDto {
  startDate: string;
  endDate: string;
  granularity: 'hour' | 'day' | 'week' | 'month';
  levels?: string[];
  modules?: string[];
  userIds?: string[];
  requestIds?: string[];
}

/**
 * LogController provides REST API endpoints for logging operations.
 * Handles log creation, retrieval, statistics, and maintenance operations.
 * 
 * @apiVersion 1.0.0
 * @apiBasePath /api/v1
 * @apiDescription Comprehensive logging system for portfolio management application
 * 
 * Features:
 * - Application logging (info, warn, error, debug)
 * - Request/response logging with performance metrics
 * - Business event logging for audit trails
 * - Performance monitoring and metrics
 * - Log aggregation and analytics
 * - Data sanitization for sensitive information
 * - Log cleanup and retention management
 */
@ApiTags('Logs')
@Controller('logs')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(LogAccessGuard)
@ApiSecurity('bearer')
export class LogController {
  constructor(
    private readonly logRepository: LogRepository,
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager,
    private readonly sanitizationService: LogSanitizationService,
    private readonly logAggregationService: LogAggregationService,
    private readonly logSummarizationService: LogSummarizationService,
    private readonly logAnalyticsService: LogAnalyticsService,
    private readonly logAccessControlService: LogAccessControlService,
  ) {}

  /**
   * Create a new application log entry.
   * 
   * @description Creates a new application log entry with the provided data.
   * The log entry will be sanitized to remove sensitive information before storage.
   * 
   * @example
   * ```json
   * {
   *   "level": "info",
   *   "message": "User logged in successfully",
   *   "serviceName": "AuthService",
   *   "moduleName": "Authentication",
   *   "context": {
   *     "userId": "user-123",
   *     "ipAddress": "192.168.1.100"
   *   }
   * }
   * ```
   */
  @Post('application')
  @HttpCode(HttpStatus.CREATED)
  @LogPermissions([LOG_PERMISSIONS.WRITE])
  @LogRole(LOG_ROLES.DEVELOPER)
  @ApiOperation({ 
    summary: 'Create application log entry',
    description: 'Creates a new application log entry with sanitized data. Supports all log levels (info, warn, error, debug, critical).',
    tags: ['Application Logs']
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Log entry created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
        message: { type: 'string', example: 'Log entry created successfully' },
        timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['level must be a valid log level'] },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
        error: { type: 'string', example: 'Internal Server Error' }
      }
    }
  })
  @ApiBody({ 
    type: CreateLogDto,
    description: 'Application log data',
    examples: {
      info: {
        summary: 'Info level log',
        value: {
          level: 'info',
          message: 'User action completed',
          serviceName: 'UserService',
          moduleName: 'UserManagement',
          context: { userId: 'user-123', action: 'profile_update' }
        }
      },
      error: {
        summary: 'Error level log',
        value: {
          level: 'error',
          message: 'Database connection failed',
          serviceName: 'DatabaseService',
          moduleName: 'Database',
          context: { error: 'Connection timeout', retryCount: 3 }
        }
      }
    }
  })
  async createApplicationLog(@Body(ValidationPipe) createLogDto: CreateLogDto) {
    const sanitizedContext = this.sanitizationService.sanitizeContext(createLogDto.context || {});

    return await this.loggingService.info(
      createLogDto.message,
      sanitizedContext,
      {
        serviceName: createLogDto.serviceName,
        moduleName: createLogDto.moduleName,
      },
    );
  }

  /**
   * Create a new business event log entry.
   */
  @Post('business-event')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create business event log entry' })
  @ApiResponse({ status: 201, description: 'Business event log created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreateBusinessEventLogDto })
  async createBusinessEventLog(
    @Body(ValidationPipe) createBusinessEventLogDto: CreateBusinessEventLogDto,
  ) {
    const sanitizedOldValues = this.sanitizationService.sanitizeContext(
      createBusinessEventLogDto.oldValues || {},
    );
    const sanitizedNewValues = this.sanitizationService.sanitizeContext(
      createBusinessEventLogDto.newValues || {},
    );
    const sanitizedMetadata = this.sanitizationService.sanitizeContext(
      createBusinessEventLogDto.metadata || {},
    );

    const context = this.contextManager.getCurrentContext();
    
    return await this.loggingService.logBusinessEvent(
      createBusinessEventLogDto.eventType,
      createBusinessEventLogDto.entityType,
      createBusinessEventLogDto.entityId,
      createBusinessEventLogDto.action,
      {
        oldValues: sanitizedOldValues,
        newValues: sanitizedNewValues,
        metadata: sanitizedMetadata,
        userId: context?.userId,
      },
    );
  }

  /**
   * Create a new performance log entry.
   */
  @Post('performance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create performance log entry' })
  @ApiResponse({ status: 201, description: 'Performance log created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBody({ type: CreatePerformanceLogDto })
  async createPerformanceLog(
    @Body(ValidationPipe) createPerformanceLogDto: CreatePerformanceLogDto,
  ) {
    const sanitizedMetadata = this.sanitizationService.sanitizeContext(
      createPerformanceLogDto.metadata || {},
    );

    return await this.loggingService.logPerformance(
      createPerformanceLogDto.operationName,
      'api', // operationType - default value
      parseInt(createPerformanceLogDto.durationMs),
      {
        memoryUsageMb: createPerformanceLogDto.memoryUsageMb ? parseFloat(createPerformanceLogDto.memoryUsageMb) : undefined,
        cpuUsagePercent: createPerformanceLogDto.cpuUsagePercent ? parseFloat(createPerformanceLogDto.cpuUsagePercent) : undefined,
      },
      sanitizedMetadata,
    );
  }

  /**
   * Get application logs with filtering and pagination.
   * 
   * @description Retrieves application logs with advanced filtering and pagination options.
   * Supports filtering by date range, log level, user, service, module, and request ID.
   * 
   * @example
   * GET /api/v1/logs/application?level=error&startDate=2024-01-01&endDate=2024-01-31&limit=50&page=1
   */
  @Get('application')
  @LogPermissions([LOG_PERMISSIONS.READ])
  @LogRole(LOG_ROLES.VIEWER)
  @ApiOperation({ 
    summary: 'Get application logs',
    description: 'Retrieves application logs with advanced filtering and pagination. Supports filtering by date range, log level, user, service, module, and request ID.',
    tags: ['Application Logs']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application logs retrieved successfully',
    type: PaginatedApplicationLogsDto,
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
              level: { type: 'string', enum: ['info', 'warn', 'error', 'debug', 'critical'], example: 'info' },
              message: { type: 'string', example: 'User action completed' },
              serviceName: { type: 'string', example: 'UserService' },
              moduleName: { type: 'string', example: 'UserManagement' },
              context: { type: 'object', example: { userId: 'user-123', action: 'profile_update' } },
              timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
              userId: { type: 'string', example: 'user-123' },
              requestId: { type: 'string', example: 'req-456' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 50 },
            total: { type: 'number', example: 150 },
            totalPages: { type: 'number', example: 3 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid query parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['startDate must be a valid ISO 8601 date string'] },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number for pagination',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Number of logs per page (max 1000)',
    example: 50
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    type: String, 
    description: 'Start date for filtering (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    type: String, 
    description: 'End date for filtering (ISO 8601 format)',
    example: '2024-01-31T23:59:59Z'
  })
  @ApiQuery({ 
    name: 'level', 
    required: false, 
    type: String, 
    description: 'Filter by log level',
    enum: ['info', 'warn', 'error', 'debug', 'critical'],
    example: 'error'
  })
  @ApiQuery({ 
    name: 'userId', 
    required: false, 
    type: String, 
    description: 'Filter by user ID',
    example: 'user-123'
  })
  @ApiQuery({ 
    name: 'serviceName', 
    required: false, 
    type: String, 
    description: 'Filter by service name',
    example: 'UserService'
  })
  @ApiQuery({ 
    name: 'moduleName', 
    required: false, 
    type: String, 
    description: 'Filter by module name',
    example: 'UserManagement'
  })
  @ApiQuery({ 
    name: 'requestId', 
    required: false, 
    type: String, 
    description: 'Filter by request ID',
    example: 'req-456'
  })
  async getApplicationLogs(@Query() query: LogQueryDto) {
    const filters: LogFilterOptions = {
      page: query.page,
      limit: query.limit,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      level: query.level,
      userId: query.userId,
      serviceName: query.serviceName,
      moduleName: query.moduleName,
      requestId: query.requestId,
    };

    return await this.logRepository.findApplicationLogs(filters);
  }

  /**
   * Get request logs with filtering and pagination.
   */
  @Get('request')
  @ApiOperation({ summary: 'Get request logs' })
  @ApiResponse({ 
    status: 200, 
    description: 'Request logs retrieved successfully',
    type: PaginatedRequestLogsDto,
  })
  async getRequestLogs(@Query() query: LogQueryDto) {
    const filters: LogFilterOptions = {
      page: query.page,
      limit: query.limit,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      userId: query.userId,
      requestId: query.requestId,
    };

    return await this.logRepository.findRequestLogs(filters);
  }

  /**
   * Get business event logs with filtering and pagination.
   */
  @Get('business-event')
  @ApiOperation({ summary: 'Get business event logs' })
  @ApiResponse({ 
    status: 200, 
    description: 'Business event logs retrieved successfully',
    type: PaginatedBusinessEventLogsDto,
  })
  async getBusinessEventLogs(@Query() query: LogQueryDto) {
    const filters: LogFilterOptions = {
      page: query.page,
      limit: query.limit,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      userId: query.userId,
    };

    return await this.logRepository.findBusinessEventLogs(filters);
  }

  /**
   * Get performance logs with filtering and pagination.
   */
  @Get('performance')
  @ApiOperation({ summary: 'Get performance logs' })
  @ApiResponse({ 
    status: 200, 
    description: 'Performance logs retrieved successfully',
    type: PaginatedPerformanceLogsDto,
  })
  async getPerformanceLogs(@Query() query: LogQueryDto) {
    const filters: LogFilterOptions = {
      page: query.page,
      limit: query.limit,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      // Performance-specific filters removed as they're not in the new DTO
    };

    return await this.logRepository.findPerformanceLogs(filters);
  }

  /**
   * Get logs by type with filtering and pagination.
   */
  @Get(':type')
  @ApiOperation({ summary: 'Get logs by type' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  @ApiParam({ name: 'type', enum: ['application', 'request', 'business-event', 'performance'] })
  async getLogsByType(
    @Param('type') type: 'application' | 'request' | 'business-event' | 'performance',
    @Query() query: LogQueryDto,
  ) {
    const filters: LogFilterOptions = {
      page: query.page,
      limit: query.limit,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      level: query.level,
      userId: query.userId,
      serviceName: query.serviceName,
      moduleName: query.moduleName,
      requestId: query.requestId,
    };

    return await this.logRepository.findLogs(type, filters);
  }

  /**
   * Get log statistics for dashboard.
   * 
   * @description Retrieves comprehensive log statistics for dashboard visualization.
   * Provides counts by level, context, time periods, and performance metrics.
   * 
   * @example
   * GET /api/v1/logs/statistics?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
   */
  @Get('statistics')
  @LogPermissions([LOG_PERMISSIONS.READ])
  @LogRole(LOG_ROLES.VIEWER)
  @ApiOperation({ 
    summary: 'Get log statistics',
    description: 'Retrieves comprehensive log statistics for dashboard visualization. Provides counts by level, context, time periods, and performance metrics.',
    tags: ['Log Analytics']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Log statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalLogs: { type: 'number', example: 15420, description: 'Total number of logs in the period' },
        logsByLevel: {
          type: 'object',
          properties: {
            info: { type: 'number', example: 12000 },
            warn: { type: 'number', example: 2500 },
            error: { type: 'number', example: 800 },
            debug: { type: 'number', example: 100 },
            critical: { type: 'number', example: 20 }
          }
        },
        logsByContext: {
          type: 'object',
          properties: {
            'UserService': { type: 'number', example: 5000 },
            'PortfolioService': { type: 'number', example: 4000 },
            'TradingService': { type: 'number', example: 3000 },
            'DatabaseService': { type: 'number', example: 2000 },
            'AuthService': { type: 'number', example: 1420 }
          }
        },
        logsByHour: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hour: { type: 'string', example: '2024-01-15T10:00:00Z' },
              count: { type: 'number', example: 150 }
            }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            averageResponseTime: { type: 'number', example: 250.5, description: 'Average response time in milliseconds' },
            errorRate: { type: 'number', example: 0.05, description: 'Error rate as percentage' },
            peakHour: { type: 'string', example: '2024-01-15T14:00:00Z', description: 'Hour with highest log volume' },
            topErrors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  message: { type: 'string', example: 'Database connection timeout' },
                  count: { type: 'number', example: 45 }
                }
              }
            }
          }
        },
        period: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00Z' },
            endDate: { type: 'string', format: 'date-time', example: '2024-01-31T23:59:59Z' },
            duration: { type: 'string', example: '31 days' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid query parameters',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['startDate must be a valid ISO 8601 date string'] },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiQuery({ 
    name: 'startDate', 
    required: true, 
    type: String, 
    description: 'Start date for statistics (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: true, 
    type: String, 
    description: 'End date for statistics (ISO 8601 format)',
    example: '2024-01-31T23:59:59Z'
  })
  @ApiQuery({ 
    name: 'groupBy', 
    required: false, 
    type: String, 
    description: 'Group statistics by time period',
    enum: ['hour', 'day', 'week', 'month'],
    example: 'day'
  })
  @ApiQuery({ 
    name: 'levels', 
    required: false, 
    type: String, 
    description: 'Filter by log levels (comma-separated)',
    example: 'error,warn'
  })
  @ApiQuery({ 
    name: 'contexts', 
    required: false, 
    type: String, 
    description: 'Filter by contexts (comma-separated)',
    example: 'UserService,PortfolioService'
  })
  async getLogStatistics(@Query() query: LogStatisticsQueryDto) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    return await this.logRepository.getLogStatistics(startDate, endDate);
  }

  /**
   * Get a specific log entry by ID.
   */
  @Get('application/:id')
  @ApiOperation({ summary: 'Get application log by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application log retrieved successfully',
    type: ApplicationLogResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Log entry not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getApplicationLogById(@Param('id', ParseUUIDPipe) id: string) {
    // This would need to be implemented in LogRepository
    // For now, return a placeholder response
    return { message: 'Get application log by ID not implemented yet', id };
  }

  /**
   * Clean up old logs based on retention policy.
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @LogPermissions([LOG_PERMISSIONS.DELETE, LOG_PERMISSIONS.ADMIN])
  @LogRole(LOG_ROLES.ADMIN)
  @ApiOperation({ summary: 'Clean up old logs' })
  @ApiResponse({ status: 200, description: 'Logs cleaned up successfully' })
  @ApiBody({ type: CleanupLogsDto })
  async cleanupLogs(@Body(ValidationPipe) cleanupLogsDto: CleanupLogsDto) {
    // Use the new CleanupLogsDto structure - convert to retention days
    const cutoffDate = cleanupLogsDto.cutoffDate ? new Date(cleanupLogsDto.cutoffDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const retentionDays = Math.ceil((Date.now() - cutoffDate.getTime()) / (24 * 60 * 60 * 1000));
    return await this.logRepository.cleanupOldLogs(retentionDays);
  }

  /**
   * Test sanitization with sample data.
   */
  @Post('test-sanitization')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test data sanitization' })
  @ApiResponse({ status: 200, description: 'Sanitization test completed' })
  @ApiBody({ description: 'Sample data to test sanitization' })
  async testSanitization(@Body() sampleData: any) {
    return this.sanitizationService.testSanitization(sampleData);
  }

  /**
   * Get sanitization statistics for input data.
   */
  @Post('sanitization-stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sanitization statistics' })
  @ApiResponse({ status: 200, description: 'Sanitization statistics retrieved' })
  @ApiBody({ description: 'Input data to analyze' })
  async getSanitizationStats(@Body() inputData: { data: string }) {
    return this.sanitizationService.getSanitizationStats(inputData.data);
  }

  /**
   * Get aggregated log data
   */
  @Get('aggregated')
  @ApiOperation({ summary: 'Get aggregated log data' })
  @ApiResponse({ status: 200, description: 'Aggregated log data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getAggregatedLogs(@Query(ValidationPipe) query: LogAggregationQueryDto) {
    const options: LogAggregationOptions = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      groupBy: query.groupBy,
      filters: {
        levels: query.levels,
        modules: query.modules,
        userIds: query.userIds,
        requestIds: query.requestIds,
      },
    };

    return this.logAggregationService.aggregateLogs(options);
  }

  /**
   * Get log summary
   */
  @Get('summary')
  @ApiOperation({ summary: 'Get log summary' })
  @ApiResponse({ status: 200, description: 'Log summary retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getLogSummary(@Query(ValidationPipe) query: LogSummaryQueryDto) {
    const options: LogSummaryOptions = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      summaryType: query.summaryType,
      filters: {
        levels: query.levels,
        modules: query.modules,
        userIds: query.userIds,
        requestIds: query.requestIds,
      },
    };

    return this.logSummarizationService.generateSummary(options);
  }

  /**
   * Get log analytics
   */
  @Get('analytics')
  @ApiOperation({ summary: 'Get log analytics' })
  @ApiResponse({ status: 200, description: 'Log analytics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getLogAnalytics(@Query(ValidationPipe) query: LogAnalyticsQueryDto) {
    const options: LogAnalyticsOptions = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      granularity: query.granularity,
      filters: {
        levels: query.levels,
        modules: query.modules,
        userIds: query.userIds,
        requestIds: query.requestIds,
      },
    };

    return this.logAnalyticsService.generateAnalytics(options);
  }

  /**
   * Get log analytics comparison
   */
  @Get('analytics/comparison')
  @ApiOperation({ summary: 'Get log analytics comparison' })
  @ApiResponse({ status: 200, description: 'Log analytics comparison retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getLogAnalyticsComparison(
    @Query('currentStartDate') currentStartDate: string,
    @Query('currentEndDate') currentEndDate: string,
    @Query('previousStartDate') previousStartDate: string,
    @Query('previousEndDate') previousEndDate: string,
    @Query('granularity') granularity: 'hour' | 'day' | 'week' | 'month' = 'day',
    @Query('levels') levels?: string,
    @Query('modules') modules?: string,
    @Query('userIds') userIds?: string,
    @Query('requestIds') requestIds?: string,
  ) {
    const currentOptions: LogAnalyticsOptions = {
      startDate: new Date(currentStartDate),
      endDate: new Date(currentEndDate),
      granularity,
      filters: {
        levels: levels ? levels.split(',') : undefined,
        modules: modules ? modules.split(',') : undefined,
        userIds: userIds ? userIds.split(',') : undefined,
        requestIds: requestIds ? requestIds.split(',') : undefined,
      },
    };

    const previousOptions: LogAnalyticsOptions = {
      startDate: new Date(previousStartDate),
      endDate: new Date(previousEndDate),
      granularity,
      filters: {
        levels: levels ? levels.split(',') : undefined,
        modules: modules ? modules.split(',') : undefined,
        userIds: userIds ? userIds.split(',') : undefined,
        requestIds: requestIds ? requestIds.split(',') : undefined,
      },
    };

    return this.logAnalyticsService.generateComparisonAnalytics(currentOptions, previousOptions);
  }

  /**
   * Get log insights
   */
  @Get('insights')
  @ApiOperation({ summary: 'Get log insights' })
  @ApiResponse({ status: 200, description: 'Log insights retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  async getLogInsights(@Query(ValidationPipe) query: LogSummaryQueryDto) {
    const options: LogSummaryOptions = {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
      summaryType: query.summaryType,
      filters: {
        levels: query.levels,
        modules: query.modules,
        userIds: query.userIds,
        requestIds: query.requestIds,
      },
    };

    const summary = await this.logSummarizationService.generateSummary(options);
    return this.logSummarizationService.generateInsights(summary);
  }
}
