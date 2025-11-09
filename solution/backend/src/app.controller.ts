import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AppService } from './app.service';

/**
 * Application controller for health checks and basic information.
 */
@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint.
   */
  @Get()
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({ status: 200, description: 'Application information retrieved successfully' })
  getAppInfo(): object {
    return this.appService.getAppInfo();
  }

  /**
   * Health check endpoint.
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  getHealth(): object {
    return this.appService.getHealth();
  }
  
  /**
   * Prometheus metrics endpoint.
   * Returns basic application metrics in Prometheus format.
   */
  /**
  @Get('metrics')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  getMetrics(): string {
    return this.appService.getMetrics();
  }
  @Get('metrics')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics in Prometheus format',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: '# HELP portfolio_up Application is up\n# TYPE portfolio_up gauge\nportfolio_up 1'
        }
      }
    }
  })
  getMetrics(@Res() res: Response): void {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const metrics = [
      '# HELP portfolio_up Application is up',
      '# TYPE portfolio_up gauge',
      'portfolio_up 1',
      '',
      '# HELP portfolio_memory_usage_bytes Memory usage in bytes',
      '# TYPE portfolio_memory_usage_bytes gauge',
      `portfolio_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      `portfolio_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`,
      `portfolio_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`,
      `portfolio_memory_usage_bytes{type="external"} ${memUsage.external}`,
      '',
      '# HELP portfolio_uptime_seconds Application uptime in seconds',
      '# TYPE portfolio_uptime_seconds gauge',
      `portfolio_uptime_seconds ${uptime}`,
      '',
      '# HELP portfolio_nodejs_version Node.js version',
      '# TYPE portfolio_nodejs_version gauge',
      `portfolio_nodejs_version{version="${process.version}"} 1`,
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  }
  */
}
