import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggingService } from '../services/logging.service';
import { ContextManager } from '../services/context-manager.service';
import { LogSanitizationService } from '../services/log-sanitization.service';
import { LOG_BUSINESS_EVENT_KEY, BusinessEventMetadata } from '../decorators/log-business-event.decorator';

/**
 * Interceptor that automatically logs business events when methods decorated with @LogBusinessEvent are called.
 * 
 * Features:
 * - Automatically captures method execution
 * - Logs business events with context
 * - Includes request/response data if configured
 * - Sanitizes sensitive data
 * - Handles errors gracefully
 */
@Injectable()
export class BusinessEventLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BusinessEventLoggingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager,
    private readonly sanitizationService: LogSanitizationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<BusinessEventMetadata>(
      LOG_BUSINESS_EVENT_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const startTime = Date.now();
    const currentContext = this.contextManager.getCurrentContext();
    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;

    // Prepare base event data
    const eventData = {
      eventName: metadata.eventName,
      description: metadata.description,
      category: metadata.category,
      severity: metadata.severity || 'medium',
      methodName,
      className,
      timestamp: new Date().toISOString(),
      requestId: currentContext?.requestId,
      userId: currentContext?.userId,
      correlationId: currentContext?.correlationId,
    };

    // Add request data if configured
    if (metadata.includeRequestData && request) {
      eventData['requestData'] = this.sanitizeRequestData(request);
    }

    // Add user context if configured
    if (metadata.includeUserContext && currentContext) {
      eventData['userContext'] = this.sanitizeUserContext(currentContext);
    }

    // Add custom fields
    if (metadata.customFields) {
      eventData['customFields'] = this.sanitizationService.sanitizeObject(metadata.customFields);
    }

    return next.handle().pipe(
      tap((responseData) => {
        const duration = Date.now() - startTime;
        
        // Add response data if configured
        if (metadata.includeResponseData) {
          eventData['responseData'] = this.sanitizationService.sanitizeObject(responseData);
        }

        // Add performance data
        eventData['duration'] = duration;
        eventData['status'] = 'success';

        // Log the business event
        this.logBusinessEvent(eventData, metadata.severity);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Add error data
        eventData['error'] = {
          message: error.message,
          name: error.name,
          stack: error.stack,
        };
        eventData['duration'] = duration;
        eventData['status'] = 'error';

        // Log the business event with error
        this.logBusinessEvent(eventData, 'high');

        throw error;
      }),
    );
  }

  /**
   * Log business event with appropriate severity level
   */
  private logBusinessEvent(eventData: any, severity: string = 'medium'): void {
    const sanitizedEventData = this.sanitizationService.sanitizeContext(eventData);
    
    switch (severity) {
      case 'critical':
        this.loggingService.error(`Business Event: ${eventData.eventName}`, sanitizedEventData as any);
        break;
      case 'high':
        this.loggingService.error(`Business Event: ${eventData.eventName}`, sanitizedEventData as any);
        break;
      case 'medium':
        this.loggingService.warn(`Business Event: ${eventData.eventName}`, sanitizedEventData);
        break;
      case 'low':
        this.loggingService.info(`Business Event: ${eventData.eventName}`, sanitizedEventData);
        break;
      default:
        this.loggingService.info(`Business Event: ${eventData.eventName}`, sanitizedEventData);
    }
  }

  /**
   * Sanitize request data
   */
  private sanitizeRequestData(request: any): any {
    const requestData = {
      method: request.method,
      url: request.url,
      headers: this.sanitizationService.sanitizeObject(request.headers),
      body: this.sanitizationService.sanitizeObject(request.body),
      query: this.sanitizationService.sanitizeObject(request.query),
      params: this.sanitizationService.sanitizeObject(request.params),
    };

    return this.sanitizationService.sanitizeObject(requestData);
  }

  /**
   * Sanitize user context
   */
  private sanitizeUserContext(context: any): any {
    return this.sanitizationService.sanitizeObject({
      userId: context.userId,
      userRole: context.userRole,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
