#!/usr/bin/env ts-node

import axios from 'axios';
import { performance } from 'perf_hooks';

/**
 * Test Health Check for CR-006 Asset Snapshot System
 * 
 * This script performs health checks on the application and test environment
 * to ensure everything is ready for testing.
 */

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  responseTime: number;
  message: string;
  details?: any;
}

class TestHealthCheck {
  private baseUrl: string;
  private results: HealthCheckResult[] = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<HealthCheckResult[]> {
    console.log('🏥 Running health checks for CR-006 Asset Snapshot System...');
    console.log('========================================================');

    // Check application health
    await this.checkApplicationHealth();
    
    // Check database connectivity
    await this.checkDatabaseHealth();
    
    // Check Redis connectivity
    await this.checkRedisHealth();
    
    // Check snapshot API endpoints
    await this.checkSnapshotApiHealth();
    
    // Check test environment
    await this.checkTestEnvironment();

    // Display results
    this.displayResults();

    return this.results;
  }

  /**
   * Check application health
   */
  private async checkApplicationHealth(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.status === 200) {
        this.results.push({
          service: 'Application',
          status: 'healthy',
          responseTime,
          message: 'Application is running and responding',
          details: response.data,
        });
      } else {
        this.results.push({
          service: 'Application',
          status: 'unhealthy',
          responseTime,
          message: `Application returned status ${response.status}`,
        });
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.results.push({
        service: 'Application',
        status: 'unhealthy',
        responseTime,
        message: `Application health check failed: ${error.message}`,
      });
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}/health/database`, {
        timeout: 5000,
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.status === 200) {
        this.results.push({
          service: 'Database',
          status: 'healthy',
          responseTime,
          message: 'Database is connected and responding',
          details: response.data,
        });
      } else {
        this.results.push({
          service: 'Database',
          status: 'unhealthy',
          responseTime,
          message: `Database health check failed with status ${response.status}`,
        });
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.results.push({
        service: 'Database',
        status: 'unhealthy',
        responseTime,
        message: `Database health check failed: ${error.message}`,
      });
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}/health/redis`, {
        timeout: 5000,
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.status === 200) {
        this.results.push({
          service: 'Redis',
          status: 'healthy',
          responseTime,
          message: 'Redis is connected and responding',
          details: response.data,
        });
      } else {
        this.results.push({
          service: 'Redis',
          status: 'unhealthy',
          responseTime,
          message: `Redis health check failed with status ${response.status}`,
        });
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.results.push({
        service: 'Redis',
        status: 'unhealthy',
        responseTime,
        message: `Redis health check failed: ${error.message}`,
      });
    }
  }

  /**
   * Check snapshot API health
   */
  private async checkSnapshotApiHealth(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/snapshots`, {
        timeout: 5000,
        params: {
          page: 1,
          limit: 1,
        },
      });
      
      const responseTime = performance.now() - startTime;
      
      if (response.status === 200) {
        this.results.push({
          service: 'Snapshot API',
          status: 'healthy',
          responseTime,
          message: 'Snapshot API is responding correctly',
          details: {
            totalSnapshots: response.data.total || 0,
            hasData: response.data.data && response.data.data.length > 0,
          },
        });
      } else {
        this.results.push({
          service: 'Snapshot API',
          status: 'unhealthy',
          responseTime,
          message: `Snapshot API returned status ${response.status}`,
        });
      }
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.results.push({
        service: 'Snapshot API',
        status: 'unhealthy',
        responseTime,
        message: `Snapshot API health check failed: ${error.message}`,
      });
    }
  }

  /**
   * Check test environment
   */
  private async checkTestEnvironment(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Check environment variables
      const requiredEnvVars = [
        'NODE_ENV',
        'DB_HOST',
        'DB_PORT',
        'DB_USERNAME',
        'DB_PASSWORD',
        'DB_NAME',
      ];
      
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingEnvVars.length > 0) {
        this.results.push({
          service: 'Test Environment',
          status: 'unhealthy',
          responseTime: performance.now() - startTime,
          message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
        });
        return;
      }
      
      // Check if we're in test mode
      if (process.env.NODE_ENV !== 'test') {
        this.results.push({
          service: 'Test Environment',
          status: 'warning',
          responseTime: performance.now() - startTime,
          message: `NODE_ENV is set to '${process.env.NODE_ENV}', expected 'test'`,
        });
        return;
      }
      
      this.results.push({
        service: 'Test Environment',
        status: 'healthy',
        responseTime: performance.now() - startTime,
        message: 'Test environment is properly configured',
        details: {
          nodeEnv: process.env.NODE_ENV,
          dbHost: process.env.DB_HOST,
          dbPort: process.env.DB_PORT,
          dbName: process.env.DB_NAME,
        },
      });
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.results.push({
        service: 'Test Environment',
        status: 'unhealthy',
        responseTime,
        message: `Test environment check failed: ${error.message}`,
      });
    }
  }

  /**
   * Display health check results
   */
  private displayResults(): void {
    console.log('\n📊 Health Check Results');
    console.log('=======================');
    
    let healthyCount = 0;
    let warningCount = 0;
    let unhealthyCount = 0;
    
    this.results.forEach(result => {
      const statusIcon = result.status === 'healthy' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${result.service}: ${result.message}`);
      console.log(`   Response Time: ${result.responseTime.toFixed(2)}ms`);
      
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      console.log('');
      
      if (result.status === 'healthy') healthyCount++;
      else if (result.status === 'warning') warningCount++;
      else unhealthyCount++;
    });
    
    console.log('Summary:');
    console.log(`  ✅ Healthy: ${healthyCount}`);
    console.log(`  ⚠️  Warnings: ${warningCount}`);
    console.log(`  ❌ Unhealthy: ${unhealthyCount}`);
    
    if (unhealthyCount > 0) {
      console.log('\n❌ Some services are unhealthy. Please fix issues before running tests.');
      process.exit(1);
    } else if (warningCount > 0) {
      console.log('\n⚠️  Some warnings detected. Tests may not run optimally.');
    } else {
      console.log('\n✅ All services are healthy. Ready to run tests!');
    }
  }

  /**
   * Get overall health status
   */
  getOverallStatus(): 'healthy' | 'warning' | 'unhealthy' {
    const unhealthyCount = this.results.filter(r => r.status === 'unhealthy').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  }
}

// Run health check if this file is executed directly
if (require.main === module) {
  const healthCheck = new TestHealthCheck();
  
  healthCheck.runAllChecks().catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
}

export { TestHealthCheck };
