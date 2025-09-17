import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../services/logging.service';
import { ContextManager } from '../services/context-manager.service';
import { LogSanitizationService } from '../services/log-sanitization.service';
import { WinstonLoggerService } from '../services/winston-logger.service';

/**
 * Global exception filter that catches all unhandled exceptions and logs them
 * with comprehensive context information.
 * 
 * Features:
 * - Logs all exceptions with stack traces and context
 * - Categorizes errors by type and severity
 * - Includes request context (request ID, user ID, etc.)
 * - Sanitizes sensitive data in error logs
 * - Provides structured error responses
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager,
    private readonly sanitizationService: LogSanitizationService,
    private readonly winstonLogger: WinstonLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Get current context
    const context = this.contextManager.getCurrentContext();
    const requestId = context?.requestId || 'unknown';
    const userId = context?.userId || 'anonymous';

    // Determine error details
    const errorDetails = this.getErrorDetails(exception);
    const statusCode = errorDetails.statusCode;
    const errorMessage = errorDetails.message;
    const errorName = errorDetails.name;
    const stackTrace = errorDetails.stack;

    // Create error context
    const errorContext = {
      requestId,
      userId,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ipAddress: this.getClientIp(request),
      timestamp: new Date().toISOString(),
      statusCode,
      errorName,
      errorMessage,
      stackTrace,
    };

    // Sanitize error context
    const sanitizedContext = this.sanitizationService.sanitizeContext(errorContext);

    // Log the error
    this.logError(exception, sanitizedContext, errorDetails.severity);

    // Prepare error response
    const errorResponse = this.prepareErrorResponse(errorDetails, requestId);

    // Send response
    response.status(statusCode).json(errorResponse);
  }

  /**
   * Extract detailed error information from exception
   */
  private getErrorDetails(exception: unknown): {
    statusCode: number;
    message: string;
    name: string;
    stack?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      
      let message: string;
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message || exception.message;
      } else {
        message = exception.message;
      }

      return {
        statusCode: status,
        message,
        name: exception.name,
        stack: exception.stack,
        severity: this.getSeverityFromStatusCode(status),
      };
    }

    // Handle non-HTTP exceptions
    const error = exception as Error;
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'Internal server error',
      name: error.name || 'UnknownError',
      stack: error.stack,
      severity: 'critical',
    };
  }

  /**
   * Determine error severity based on status code
   */
  private getSeverityFromStatusCode(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
    if (statusCode >= 500) {
      return 'critical';
    } else if (statusCode >= 400) {
      return 'high';
    } else if (statusCode >= 300) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Log error with appropriate level based on severity
   */
  private logError(
    exception: unknown,
    context: any,
    severity: 'low' | 'medium' | 'high' | 'critical',
  ): void {
    const logMessage = `Unhandled exception: ${context.errorName}`;
    
    // Log to database via LoggingService
    switch (severity) {
      case 'critical':
        this.loggingService.error(logMessage, exception as Error, context);
        break;
      case 'high':
        this.loggingService.error(logMessage, exception as Error, context);
        break;
      case 'medium':
        this.loggingService.warn(logMessage, context);
        break;
      case 'low':
        this.loggingService.info(logMessage, context);
        break;
    }

    // Also log to file via WinstonLoggerService
    switch (severity) {
      case 'critical':
        this.winstonLogger.error(logMessage, context);
        break;
      case 'high':
        this.winstonLogger.error(logMessage, context);
        break;
      case 'medium':
        this.winstonLogger.warn(logMessage, context);
        break;
      case 'low':
        this.winstonLogger.info(logMessage, context);
        break;
    }

    // Also log to console for immediate visibility
    this.logger.error(`[${context.requestId}] ${logMessage}`, exception);
  }

  /**
   * Prepare structured error response for client
   */
  private prepareErrorResponse(
    errorDetails: {
      statusCode: number;
      message: string;
      name: string;
    },
    requestId: string,
  ): {
    statusCode: number;
    message: string;
    error: string;
    requestId: string;
    timestamp: string;
  } {
    return {
      statusCode: errorDetails.statusCode,
      message: errorDetails.message,
      error: errorDetails.name,
      requestId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
