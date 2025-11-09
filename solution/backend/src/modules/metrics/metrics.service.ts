import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

/**
 * Metrics service for collecting and managing application metrics.
 * Provides counters, histograms, and gauges for monitoring.
 */
@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('active_connections')
    private readonly activeConnections: Gauge<string>,
    @InjectMetric('database_connections_active')
    private readonly databaseConnectionsActive: Gauge<string>,
    @InjectMetric('memory_usage_bytes')
    private readonly memoryUsage: Gauge<string>,
    @InjectMetric('cpu_usage_percent')
    private readonly cpuUsage: Gauge<string>,
  ) {}

  /**
   * Increment HTTP requests counter.
   * @param method HTTP method
   * @param route HTTP route
   * @param statusCode HTTP status code
   */
  incrementHttpRequests(method: string, route: string, statusCode: number): void {
    this.httpRequestsTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  /**
   * Record HTTP request duration.
   * @param method HTTP method
   * @param route HTTP route
   * @param duration Duration in seconds
   */
  recordHttpRequestDuration(method: string, route: string, duration: number): void {
    this.httpRequestDuration
      .labels(method, route)
      .observe(duration);
  }

  /**
   * Set active connections count.
   * @param count Number of active connections
   */
  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  /**
   * Set database connections count.
   * @param count Number of active database connections
   */
  setDatabaseConnections(count: number): void {
    this.databaseConnectionsActive.set(count);
  }

  /**
   * Update memory usage metrics.
   */
  updateMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    this.memoryUsage.set(memUsage.heapUsed);
  }

  /**
   * Update CPU usage metrics.
   * @param cpuPercent CPU usage percentage
   */
  updateCpuUsage(cpuPercent: number): void {
    this.cpuUsage.set(cpuPercent);
  }

  /**
   * Get application metrics summary.
   * @returns Metrics summary object
   */
  getMetricsSummary(): object {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
