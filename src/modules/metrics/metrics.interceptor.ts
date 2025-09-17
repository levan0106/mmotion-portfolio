import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

/**
 * Metrics interceptor for tracking HTTP requests and performance.
 * Automatically records request metrics for Prometheus monitoring.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const method = request.method;
    const route = request.route?.path || request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = response.statusCode;

          // Record metrics
          this.metricsService.incrementHttpRequests(method, route, statusCode);
          this.metricsService.recordHttpRequestDuration(method, route, duration);
        },
        error: (error) => {
          const duration = (Date.now() - startTime) / 1000;
          const statusCode = error.status || 500;

          // Record error metrics
          this.metricsService.incrementHttpRequests(method, route, statusCode);
          this.metricsService.recordHttpRequestDuration(method, route, duration);
        },
      }),
    );
  }
}
