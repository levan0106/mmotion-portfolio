import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ApplicationLog } from '../entities/application-log.entity';
import { RequestLog } from '../entities/request-log.entity';
import { BusinessEventLog } from '../entities/business-event-log.entity';
import { PerformanceLog } from '../entities/performance-log.entity';

/**
 * LoggingService provides comprehensive logging functionality for the application.
 * Handles different types of logging including errors, business events, performance metrics,
 * and request/response logging with proper context management and data sanitization.
 */
@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);

  constructor(
    @InjectRepository(ApplicationLog)
    private readonly applicationLogRepository: Repository<ApplicationLog>,
    @InjectRepository(RequestLog)
    private readonly requestLogRepository: Repository<RequestLog>,
    @InjectRepository(BusinessEventLog)
    private readonly businessEventLogRepository: Repository<BusinessEventLog>,
    @InjectRepository(PerformanceLog)
    private readonly performanceLogRepository: Repository<PerformanceLog>,
  ) {}

  /**
   * Log an error message with context and stack trace.
   * @param message - Error message
   * @param error - Error object with stack trace
   * @param context - Additional context data
   * @param options - Logging options
   */
  async error(
    message: string,
    error?: Error,
    context?: Record<string, any>,
    options?: {
      serviceName?: string;
      moduleName?: string;
      functionName?: string;
      errorCode?: string;
      userId?: string;
      requestId?: string;
    },
  ): Promise<void> {
    try {
      const logEntry = this.applicationLogRepository.create({
        level: 'error',
        message,
        context: this.sanitizeContext({
          ...context,
          error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : undefined,
        }),
        serviceName: options?.serviceName || 'unknown',
        moduleName: options?.moduleName,
        functionName: options?.functionName,
        errorCode: options?.errorCode,
        stackTrace: error?.stack,
        userId: options?.userId,
        requestId: options?.requestId,
        timestamp: new Date(),
      });

      await this.applicationLogRepository.save(logEntry);
      this.logger.error(`Error logged: ${message}`, error?.stack);
    } catch (logError) {
      this.logger.error('Failed to log error', logError.stack);
    }
  }

  /**
   * Log a critical error message with highest priority.
   * @param message - Critical error message
   * @param error - Error object with stack trace
   * @param context - Additional context data
   * @param options - Logging options
   */
  async critical(
    message: string,
    error?: Error,
    context?: Record<string, any>,
    options?: {
      serviceName?: string;
      moduleName?: string;
      functionName?: string;
      errorCode?: string;
      userId?: string;
      requestId?: string;
    },
  ): Promise<void> {
    try {
      const logEntry = this.applicationLogRepository.create({
        level: 'critical',
        message,
        context: this.sanitizeContext({
          ...context,
          error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : undefined,
        }),
        serviceName: options?.serviceName || 'unknown',
        moduleName: options?.moduleName,
        functionName: options?.functionName,
        errorCode: options?.errorCode,
        stackTrace: error?.stack,
        userId: options?.userId,
        requestId: options?.requestId,
        timestamp: new Date(),
      });

      await this.applicationLogRepository.save(logEntry);
      this.logger.error(`Critical error logged: ${message}`, error?.stack);
    } catch (logError) {
      this.logger.error('Failed to log critical error', logError.stack);
    }
  }

  /**
   * Log an informational message.
   * @param message - Info message
   * @param context - Additional context data
   * @param options - Logging options
   */
  async info(
    message: string,
    context?: Record<string, any>,
    options?: {
      serviceName?: string;
      moduleName?: string;
      functionName?: string;
      userId?: string;
      requestId?: string;
    },
  ): Promise<void> {
    try {
      const logEntry = this.applicationLogRepository.create({
        level: 'info',
        message,
        context: this.sanitizeContext(context),
        serviceName: options?.serviceName || 'unknown',
        moduleName: options?.moduleName,
        functionName: options?.functionName,
        userId: options?.userId,
        requestId: options?.requestId,
        timestamp: new Date(),
      });

      await this.applicationLogRepository.save(logEntry);
      this.logger.log(`Info logged: ${message}`);
    } catch (logError) {
      this.logger.error('Failed to log info', logError.stack);
    }
  }

  /**
   * Log a warning message.
   * @param message - Warning message
   * @param context - Additional context data
   * @param options - Logging options
   */
  async warn(
    message: string,
    context?: Record<string, any>,
    options?: {
      serviceName?: string;
      moduleName?: string;
      functionName?: string;
      userId?: string;
      requestId?: string;
    },
  ): Promise<void> {
    try {
      const logEntry = this.applicationLogRepository.create({
        level: 'warn',
        message,
        context: this.sanitizeContext(context),
        serviceName: options?.serviceName || 'unknown',
        moduleName: options?.moduleName,
        functionName: options?.functionName,
        userId: options?.userId,
        requestId: options?.requestId,
        timestamp: new Date(),
      });

      await this.applicationLogRepository.save(logEntry);
      this.logger.warn(`Warning logged: ${message}`);
    } catch (logError) {
      this.logger.error('Failed to log warning', logError.stack);
    }
  }

  /**
   * Log a debug message.
   * @param message - Debug message
   * @param context - Additional context data
   * @param options - Logging options
   */
  async debug(
    message: string,
    context?: Record<string, any>,
    options?: {
      serviceName?: string;
      moduleName?: string;
      functionName?: string;
      userId?: string;
      requestId?: string;
    },
  ): Promise<void> {
    try {
      const logEntry = this.applicationLogRepository.create({
        level: 'debug',
        message,
        context: this.sanitizeContext(context),
        serviceName: options?.serviceName || 'unknown',
        moduleName: options?.moduleName,
        functionName: options?.functionName,
        userId: options?.userId,
        requestId: options?.requestId,
        timestamp: new Date(),
      });

      await this.applicationLogRepository.save(logEntry);
      this.logger.debug(`Debug logged: ${message}`);
    } catch (logError) {
      this.logger.error('Failed to log debug', logError.stack);
    }
  }

  /**
   * Log a business event with old and new values.
   * @param eventType - Type of business event
   * @param entityType - Type of entity affected
   * @param entityId - ID of entity affected
   * @param action - Action performed
   * @param oldValues - Previous values
   * @param newValues - New values
   * @param options - Logging options
   */
  async logBusinessEvent(
    eventType: string,
    entityType: string,
    entityId: string,
    action: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    options?: {
      userId?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    try {
      const logEntry = this.businessEventLogRepository.create({
        eventId: randomUUID(),
        eventType: eventType,
        entityType: entityType,
        entityId: entityId,
        action,
        oldValues: this.sanitizeContext(oldValues),
        newValues: this.sanitizeContext(newValues),
        userId: options?.userId,
        metadata: this.sanitizeContext(options?.metadata),
        timestamp: new Date(),
      });

      await this.businessEventLogRepository.save(logEntry);
      this.logger.log(`Business event logged: ${eventType} - ${action} on ${entityType}:${entityId}`);
    } catch (logError) {
      this.logger.error('Failed to log business event', logError.stack);
    }
  }

  /**
   * Log performance metrics for an operation.
   * @param operationName - Name of the operation
   * @param operationType - Type of operation
   * @param durationMs - Duration in milliseconds
   * @param metrics - Additional performance metrics
   * @param options - Logging options
   */
  async logPerformance(
    operationName: string,
    operationType: string,
    durationMs: number,
    metrics?: {
      memoryUsageMb?: number;
      cpuUsagePercent?: number;
      databaseQueries?: number;
      cacheHits?: number;
      cacheMisses?: number;
      externalApiCalls?: number;
    },
    options?: {
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    try {
      const logEntry = this.performanceLogRepository.create({
        operationName: operationName,
        operationType: operationType,
        durationMs: durationMs,
        memoryUsageMb: metrics?.memoryUsageMb,
        cpuUsagePercent: metrics?.cpuUsagePercent,
        databaseQueries: metrics?.databaseQueries,
        cacheHits: metrics?.cacheHits,
        cacheMisses: metrics?.cacheMisses,
        externalApiCalls: metrics?.externalApiCalls,
        metadata: this.sanitizeContext(options?.metadata),
        timestamp: new Date(),
      });

      await this.performanceLogRepository.save(logEntry);
      this.logger.log(`Performance logged: ${operationName} - ${durationMs}ms`);
    } catch (logError) {
      this.logger.error('Failed to log performance', logError.stack);
    }
  }

  /**
   * Log HTTP request and response data.
   * @param requestId - Unique request identifier
   * @param method - HTTP method
   * @param url - Request URL
   * @param headers - Request headers
   * @param body - Request body
   * @param queryParams - Query parameters
   * @param responseStatus - HTTP response status
   * @param responseTimeMs - Response time in milliseconds
   * @param responseSizeBytes - Response size in bytes
   * @param options - Logging options
   */
  async logRequest(
    requestId: string,
    method: string,
    url: string,
    headers?: Record<string, any>,
    body?: Record<string, any>,
    queryParams?: Record<string, any>,
    responseStatus?: number,
    responseTimeMs?: number,
    responseSizeBytes?: number,
    options?: {
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ): Promise<void> {
    try {
      const logEntry = this.requestLogRepository.create({
        requestId: requestId,
        method,
        url,
        headers: this.sanitizeContext(headers),
        body: this.sanitizeContext(body),
        queryParams: this.sanitizeContext(queryParams),
        responseStatus: responseStatus,
        responseTimeMs: responseTimeMs,
        responseSizeBytes: responseSizeBytes,
        userId: options?.userId,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        timestamp: new Date(),
      });

      await this.requestLogRepository.save(logEntry);
      this.logger.log(`Request logged: ${method} ${url} - ${responseStatus || 'pending'}`);
    } catch (logError) {
      this.logger.error('Failed to log request', logError.stack);
    }
  }

  /**
   * Sanitize context data to remove sensitive information.
   * @param context - Context data to sanitize
   * @returns Sanitized context data
   */
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session',
      'creditcard',
      'credit_card',
      'ssn',
      'socialsecuritynumber',
      'social_security_number',
    ];

    const sanitized = { ...context };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
        sanitized[key] = this.sanitizeContext(sanitized[key]);
      }
    }

    return sanitized;
  }
}
