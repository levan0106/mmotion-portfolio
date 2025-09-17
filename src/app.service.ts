import { Injectable } from '@nestjs/common';

/**
 * Application service for basic application information and health checks.
 */
@Injectable()
export class AppService {
  /**
   * Get application information.
   * @returns Application information object
   */
  getAppInfo(): object {
    return {
      name: 'Portfolio Management System',
      version: '1.0.0',
      description: 'Portfolio Management System with NestJS, TypeORM, and PostgreSQL',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get health status.
   * @returns Health status object
   */
  getHealth(): object {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };
  }
}
