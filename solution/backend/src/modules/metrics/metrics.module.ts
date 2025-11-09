import { Module } from '@nestjs/common';
import { PrometheusModule, makeCounterProvider, makeHistogramProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';

/**
 * Metrics module for Prometheus monitoring.
 * Provides application metrics and health monitoring.
 */
@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'portfolio_',
        },
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    MetricsInterceptor,
    // Custom metric providers
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    }),
    makeGaugeProvider({
      name: 'active_connections',
      help: 'Number of active connections',
    }),
    makeGaugeProvider({
      name: 'database_connections_active',
      help: 'Number of active database connections',
    }),
    makeGaugeProvider({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
    }),
    makeGaugeProvider({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
    }),
  ],
  exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}
