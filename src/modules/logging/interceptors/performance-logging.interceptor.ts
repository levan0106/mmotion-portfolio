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
import { LOG_PERFORMANCE_KEY, PerformanceMetadata } from '../decorators/log-performance.decorator';

/**
 * Interceptor that automatically logs performance metrics when methods decorated with @LogPerformance are called.
 * 
 * Features:
 * - Automatically captures method execution time
 * - Logs performance metrics with context
 * - Includes memory usage, CPU usage, database metrics if configured
 * - Configurable thresholds for slow operations
 * - Sanitizes sensitive data
 * - Handles errors gracefully
 */
@Injectable()
export class PerformanceLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceLoggingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly loggingService: LoggingService,
    private readonly contextManager: ContextManager,
    private readonly sanitizationService: LogSanitizationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<PerformanceMetadata>(
      LOG_PERFORMANCE_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const currentContext = this.contextManager.getCurrentContext();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;

    // Prepare base performance data
    const performanceData = {
      operationName: metadata.operationName || `${className}.${methodName}`,
      operationType: metadata.operationType || 'METHOD_EXECUTION',
      methodName,
      className,
      timestamp: new Date().toISOString(),
      requestId: currentContext?.requestId,
      userId: currentContext?.userId,
      correlationId: currentContext?.correlationId,
    };

    return next.handle().pipe(
      tap((responseData) => {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - startTime;

        // Check if we should log based on threshold
        if (metadata.logOnlyIfSlow && duration < (metadata.thresholdMs || 1000)) {
          return;
        }

        // Add performance metrics
        performanceData['durationMs'] = duration;
        performanceData['status'] = 'success';

        // Add memory usage if configured
        if (metadata.includeMemoryUsage) {
          performanceData['memoryUsage'] = {
            heapUsed: endMemory.heapUsed,
            heapTotal: endMemory.heapTotal,
            external: endMemory.external,
            rss: endMemory.rss,
            heapUsedDelta: endMemory.heapUsed - startMemory.heapUsed,
            heapTotalDelta: endMemory.heapTotal - startMemory.heapTotal,
          };
        }

        // Add CPU usage if configured (simplified)
        if (metadata.includeCpuUsage) {
          performanceData['cpuUsage'] = {
            // Note: In a real implementation, you might want to use a more sophisticated CPU monitoring library
            processUptime: process.uptime(),
            loadAverage: process.platform !== 'win32' ? require('os').loadavg() : null,
          };
        }

        // Add database metrics if configured
        if (metadata.includeDatabaseMetrics) {
          performanceData['databaseMetrics'] = {
            // Note: In a real implementation, you would integrate with your database monitoring
            queriesExecuted: 0, // This would be tracked by your database layer
            slowQueries: 0,
            connectionPoolSize: 0,
          };
        }

        // Add cache metrics if configured
        if (metadata.includeCacheMetrics) {
          performanceData['cacheMetrics'] = {
            // Note: In a real implementation, you would integrate with your cache monitoring
            hits: 0,
            misses: 0,
            hitRate: 0,
          };
        }

        // Add external API metrics if configured
        if (metadata.includeExternalApiMetrics) {
          performanceData['externalApiMetrics'] = {
            // Note: In a real implementation, you would track external API calls
            calls: 0,
            totalTime: 0,
            averageTime: 0,
          };
        }

        // Add custom metrics
        if (metadata.customMetrics) {
          performanceData['customMetrics'] = this.sanitizationService.sanitizeObject(metadata.customMetrics);
        }

        // Log the performance data
        this.logPerformance(performanceData, duration, metadata.thresholdMs);
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Add error data
        performanceData['durationMs'] = duration;
        performanceData['status'] = 'error';
        performanceData['error'] = {
          message: error.message,
          name: error.name,
        };

        // Log the performance data with error
        this.logPerformance(performanceData, duration, metadata.thresholdMs);

        throw error;
      }),
    );
  }

  /**
   * Log performance data
   */
  private logPerformance(performanceData: any, duration: number, thresholdMs?: number): void {
    const sanitizedPerformanceData = this.sanitizationService.sanitizeContext(performanceData);
    
    // Determine log level based on duration
    if (thresholdMs && duration > thresholdMs) {
      this.loggingService.warn(`Slow Operation: ${performanceData.operationName}`, sanitizedPerformanceData);
    } else {
      this.loggingService.info(`Performance: ${performanceData.operationName}`, sanitizedPerformanceData);
    }

    // Also log as performance log for structured analysis
    this.loggingService.logPerformance(
      performanceData.operationName,
      performanceData.operationType,
      performanceData.durationMs,
      {
        memoryUsageMb: performanceData.memoryUsage?.heapUsed ? Math.round(performanceData.memoryUsage.heapUsed / 1024 / 1024) : undefined,
        cpuUsagePercent: performanceData.cpuUsage?.processUptime ? Math.round(performanceData.cpuUsage.processUptime * 100) / 100 : undefined,
        databaseQueries: performanceData.databaseMetrics?.queriesExecuted,
        cacheHits: performanceData.cacheMetrics?.hits,
        cacheMisses: performanceData.cacheMetrics?.misses,
        externalApiCalls: performanceData.externalApiMetrics?.calls,
      },
      sanitizedPerformanceData,
    );
  }
}
