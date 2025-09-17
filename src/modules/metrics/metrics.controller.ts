import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { MetricsService } from './metrics.service';
import { register } from 'prom-client';

/**
 * Metrics controller for Prometheus monitoring.
 * Provides /metrics endpoint for Prometheus scraping.
 */
@ApiTags('Metrics')
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Prometheus metrics endpoint.
   * Returns metrics in Prometheus format for scraping.
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics in Prometheus format',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: '# HELP portfolio_http_requests_total Total number of HTTP requests\n# TYPE portfolio_http_requests_total counter\nportfolio_http_requests_total{method="GET",route="/health",status_code="200"} 1'
        }
      }
    }
  })
  async getMetrics(@Res() res: Response): Promise<void> {
    // Update runtime metrics
    this.metricsService.updateMemoryUsage();
    
    // Get all metrics in Prometheus format
    const metrics = await register.metrics();
    
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  }

  /**
   * Application metrics summary endpoint.
   * Returns human-readable metrics summary.
   */
  @Get('metrics/summary')
  @ApiOperation({ summary: 'Get application metrics summary' })
  @ApiResponse({ 
    status: 200, 
    description: 'Application metrics summary retrieved successfully' 
  })
  getMetricsSummary(): object {
    return this.metricsService.getMetricsSummary();
  }
}
