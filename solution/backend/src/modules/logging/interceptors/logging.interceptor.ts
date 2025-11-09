import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService } from '../services/logging.service';
import { ContextManager } from '../services/context-manager.service';
import { LogSanitizationService } from '../services/log-sanitization.service';

export interface LoggingInterceptorOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  logErrors?: boolean;
  logPerformance?: boolean;
  maxBodySize?: number;
  excludePaths?: string[];
  includeHeaders?: string[];
  excludeHeaders?: string[];
  redactSensitiveData?: boolean;
}

/**
 * LoggingInterceptor provides comprehensive HTTP request/response logging.
 * Captures request details, response status, timing, and error information
 * while maintaining request correlation and context propagation.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  private options: LoggingInterceptorOptions = {
    logRequests: true,
    logResponses: true,
    logErrors: true,
    logPerformance: true,
    maxBodySize: 10000, // 10KB
    excludePaths: ['/health', '/metrics', '/favicon.ico'],
    includeHeaders: ['user-agent', 'content-type', 'authorization', 'x-request-id'],
    excludeHeaders: ['cookie', 'set-cookie'],
    redactSensitiveData: true,
  };

  constructor(
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager,
    private readonly sanitizationService: LogSanitizationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip logging for excluded paths
    if (this.shouldSkipLogging(request)) {
      return next.handle();
    }

    const startTime = Date.now();
    const requestId = this.generateRequestId(request);
    const correlationId = this.getCorrelationId(request);

    // Set up request context
    const requestContext = this.createRequestContext(request, requestId, correlationId);
    
    // Log incoming request
    if (this.options.logRequests) {
      this.logRequest(request, requestId, correlationId);
    }

    return this.contextManager.runSync(requestContext, () => {
      return next.handle().pipe(
      tap((responseData) => {
        // Log successful response
        if (this.options.logResponses) {
          this.logResponse(request, response, responseData, startTime, requestId);
        }

        // Log performance metrics
        if (this.options.logPerformance) {
          this.logPerformance(request, response, startTime, requestId);
        }
      }),
      catchError((error) => {
        // Log error response
        if (this.options.logErrors) {
          this.logError(request, response, error, startTime, requestId);
        }

        // Log performance metrics even for errors
        if (this.options.logPerformance) {
          this.logPerformance(request, response, startTime, requestId);
        }

        throw error;
      }),
    );
    });
  }

  /**
   * Check if logging should be skipped for this request.
   */
  private shouldSkipLogging(request: Request): boolean {
    const path = request.path;
    return this.options.excludePaths?.some(excludePath => 
      path.startsWith(excludePath)
    ) || false;
  }

  /**
   * Generate or extract request ID.
   */
  private generateRequestId(request: Request): string {
    const existingRequestId = request.headers['x-request-id'] as string;
    if (existingRequestId) {
      return existingRequestId;
    }

    // Generate new request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set in response headers for client correlation
    const response = request.res;
    if (response) {
      response.setHeader('x-request-id', requestId);
    }

    return requestId;
  }

  /**
   * Get or generate correlation ID.
   */
  private getCorrelationId(request: Request): string {
    const existingCorrelationId = request.headers['x-correlation-id'] as string;
    if (existingCorrelationId) {
      return existingCorrelationId;
    }

    // Generate new correlation ID
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create request context for logging.
   */
  private createRequestContext(
    request: Request,
    requestId: string,
    correlationId: string,
  ) {
    return {
      requestId,
      correlationId,
      method: request.method,
      url: request.url,
      path: request.path,
      userAgent: request.headers['user-agent'],
      ipAddress: this.getClientIp(request),
      userId: this.extractUserId(request),
      sessionId: this.extractSessionId(request),
    };
  }

  /**
   * Extract client IP address.
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

  /**
   * Extract user ID from request (if available).
   */
  private extractUserId(request: Request): string | undefined {
    // This would typically come from authentication middleware
    return (request as any).user?.id || (request as any).user?.userId;
  }

  /**
   * Extract session ID from request (if available).
   */
  private extractSessionId(request: Request): string | undefined {
    // This would typically come from session middleware
    return (request as any).session?.id;
  }

  /**
   * Log incoming HTTP request.
   */
  private logRequest(request: Request, requestId: string, correlationId: string): void {
    const requestData = {
      method: request.method,
      url: request.url,
      path: request.path,
      query: request.query,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
      ip: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    this.loggingService.info('HTTP Request', {
      requestId,
      correlationId,
      ...requestData,
    });
  }

  /**
   * Log outgoing HTTP response.
   */
  private logResponse(
    request: Request,
    response: Response,
    responseData: any,
    startTime: number,
    requestId: string,
  ): void {
    const duration = Date.now() - startTime;
    const responseInfo = {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: this.sanitizeHeaders(response.getHeaders()),
      duration,
      timestamp: new Date().toISOString(),
    };

    // Only log response body for small responses
    if (this.shouldLogResponseBody(responseData)) {
      responseInfo['body'] = this.sanitizeBody(responseData);
    }

    this.loggingService.info('HTTP Response', {
      requestId,
      method: request.method,
      url: request.url,
      ...responseInfo,
    });
  }

  /**
   * Log HTTP error.
   */
  private logError(
    request: Request,
    response: Response,
    error: any,
    startTime: number,
    requestId: string,
  ): void {
    const duration = Date.now() - startTime;
    const errorInfo = {
      statusCode: response.statusCode || 500,
      statusMessage: response.statusMessage || 'Internal Server Error',
      errorMessage: error.message,
      errorStack: error.stack,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.loggingService.error('HTTP Error', {
      requestId,
      method: request.method,
      url: request.url,
      ...errorInfo,
    } as any);
  }

  /**
   * Log performance metrics.
   */
  private logPerformance(
    request: Request,
    response: Response,
    startTime: number,
    requestId: string,
  ): void {
    const duration = Date.now() - startTime;
    const performanceData = {
      operationName: `${request.method} ${request.path}`,
      operationType: 'HTTP_REQUEST',
      durationMs: duration,
      statusCode: response.statusCode,
      timestamp: new Date().toISOString(),
    };

    this.loggingService.logPerformance(
      performanceData.operationName,
      performanceData.operationType,
      performanceData.durationMs,
      {},
      {
        requestId,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ipAddress: this.getClientIp(request),
        statusCode: performanceData.statusCode,
        method: request.method,
        path: request.path,
      } as any,
    );
  }

  /**
   * Sanitize request/response headers.
   */
  private sanitizeHeaders(headers: any): Record<string, any> {
    if (!headers || typeof headers !== 'object') {
      return {};
    }

    const sanitized: Record<string, any> = {};
    const headersToInclude = this.options.includeHeaders || [];
    const headersToExclude = this.options.excludeHeaders || [];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();

      // Skip excluded headers
      if (headersToExclude.some(exclude => lowerKey.includes(exclude.toLowerCase()))) {
        continue;
      }

      // Include specific headers or all if no filter specified
      if (headersToInclude.length === 0 || 
          headersToInclude.some(include => lowerKey.includes(include.toLowerCase()))) {
        
        if (this.options.redactSensitiveData) {
          sanitized[key] = this.sanitizationService.sanitizeString(String(value));
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request/response body.
   */
  private sanitizeBody(body: any): any {
    if (!body) {
      return body;
    }

    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    let processedBody = body;
    
    // Truncate large bodies
    if (bodyString.length > this.options.maxBodySize) {
      processedBody = `${bodyString.substring(0, this.options.maxBodySize)}... [TRUNCATED]`;
    }

    if (this.options.redactSensitiveData) {
      return this.sanitizationService.sanitizeObject(processedBody);
    }

    return processedBody;
  }

  /**
   * Check if response body should be logged.
   */
  private shouldLogResponseBody(responseData: any): boolean {
    if (!responseData) {
      return false;
    }

    const bodyString = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
    return bodyString.length <= this.options.maxBodySize;
  }

  /**
   * Update interceptor options.
   */
  updateOptions(newOptions: Partial<LoggingInterceptorOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current interceptor options.
   */
  getOptions(): LoggingInterceptorOptions {
    return { ...this.options };
  }
}
