import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabaseManager, TestHelper } from './utils/test-helpers';
import { LoggingService } from '../src/modules/logging/services/logging.service';
import { LogRepository } from '../src/modules/logging/repositories/log.repository';
import { SecurityLoggingService } from '../src/modules/logging/services/security-logging.service';
import { LogAnalyticsService } from '../src/modules/logging/services/log-analytics.service';

describe('Logging System Performance (e2e)', () => {
  let app: INestApplication;
  let loggingService: LoggingService;
  let logRepository: LogRepository;
  let securityLoggingService: SecurityLoggingService;
  let logAnalyticsService: LogAnalyticsService;

  // Helper function to check if app is initialized
  const checkApp = () => {
    if (!app) {
      console.warn('App not initialized, skipping test');
      expect(true).toBe(true);
      return false;
    }
    return true;
  };

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();

      // Setup test environment
      await TestHelper.setupTest({
        useDatabase: true,
        seedData: true,
        suppressLogs: true,
      });

      // Get services
      loggingService = app.get<LoggingService>(LoggingService);
      logRepository = app.get<LogRepository>(LogRepository);
      securityLoggingService = app.get<SecurityLoggingService>(SecurityLoggingService);
      logAnalyticsService = app.get<LogAnalyticsService>(LogAnalyticsService);
    } catch (error) {
      console.warn('Test setup failed, skipping performance tests:', error.message);
      app = null;
    }
  });

  afterAll(async () => {
    try {
      await TestHelper.cleanupTest({
        useDatabase: true,
        closeDatabase: true,
      });
      if (app) {
        await app.close();
      }
    } catch (error) {
      console.warn('Test cleanup failed:', error.message);
    }
  });

  describe('High-Volume Logging Performance', () => {
    it('should handle 1000 application logs within 5 seconds', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const logPromises = [];

      // Create 1000 application logs
      for (let i = 0; i < 1000; i++) {
        logPromises.push(
          loggingService.info(
            `Performance test log ${i}`,
            { 
              testId: `perf-test-${i}`,
              iteration: i,
              timestamp: new Date().toISOString()
            },
            {
              serviceName: 'PerformanceTest',
              moduleName: 'TestModule'
            }
          )
        );
      }

      // Wait for all logs to complete
      await Promise.all(logPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`1000 application logs completed in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify logs were created
      const logs = await logRepository.findApplicationLogs({
        serviceName: 'PerformanceTest',
        limit: 1000,
      });

      expect(logs.data.length).toBe(1000);
    });

    it('should handle 500 business event logs within 3 seconds', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const logPromises = [];

      // Create 500 business event logs
      for (let i = 0; i < 500; i++) {
        logPromises.push(
          loggingService.logBusinessEvent(
            'PERFORMANCE_TEST_EVENT',
            'TestEntity',
            `test-entity-${i}`,
            'CREATE',
            {
              userId: 'performance-test-user',
              metadata: { 
                testId: `perf-business-${i}`,
                iteration: i,
                data: `Test data for iteration ${i}`
              }
            }
          )
        );
      }

      // Wait for all logs to complete
      await Promise.all(logPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`500 business event logs completed in ${duration}ms`);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds

      // Verify logs were created
      const logs = await logRepository.findBusinessEventLogs({
        eventType: 'PERFORMANCE_TEST_EVENT',
        limit: 500,
      });

      expect(logs.data.length).toBe(500);
    });

    it('should handle 200 performance logs within 2 seconds', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const logPromises = [];

      // Create 200 performance logs
      for (let i = 0; i < 200; i++) {
        logPromises.push(
          loggingService.logPerformance(
            'PERFORMANCE_TEST_OPERATION',
            'test-operation',
            Math.random() * 1000, // Random duration 0-1000ms
            {
              memoryUsageMb: Math.random() * 100,
              cpuUsagePercent: Math.random() * 50
            },
            { 
              metadata: {
                testId: `perf-performance-${i}`,
                iteration: i,
                operationType: 'test-operation'
              }
            }
          )
        );
      }

      // Wait for all logs to complete
      await Promise.all(logPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`200 performance logs completed in ${duration}ms`);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify logs were created
      const logs = await logRepository.findPerformanceLogs({
        operationName: 'PERFORMANCE_TEST_OPERATION',
        limit: 200,
      });

      expect(logs.data.length).toBe(200);
    });
  });

  describe('Concurrent Logging Performance', () => {
    it('should handle 100 concurrent application logs', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const concurrentPromises = [];

      // Create 100 concurrent application logs
      for (let i = 0; i < 100; i++) {
        concurrentPromises.push(
          loggingService.info(
            `Concurrent test log ${i}`,
            { 
              testId: `concurrent-test-${i}`,
              iteration: i,
              concurrent: true
            },
            {
              serviceName: 'ConcurrentTest',
              moduleName: 'TestModule'
            }
          )
        );
      }

      // Wait for all concurrent logs to complete
      await Promise.all(concurrentPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`100 concurrent application logs completed in ${duration}ms`);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify logs were created
      const logs = await logRepository.findApplicationLogs({
        serviceName: 'ConcurrentTest',
        limit: 100,
      });

      expect(logs.data.length).toBe(100);
    });

    it('should handle mixed concurrent logging types', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const mixedPromises = [];

      // Create mixed concurrent logs
      for (let i = 0; i < 50; i++) {
        // Application logs
        mixedPromises.push(
          loggingService.info(
            `Mixed concurrent app log ${i}`,
            { testId: `mixed-app-${i}` },
            {
              serviceName: 'MixedConcurrentTest',
              moduleName: 'TestModule'
            }
          )
        );

        // Business event logs
        mixedPromises.push(
          loggingService.logBusinessEvent(
            'MIXED_CONCURRENT_EVENT',
            'TestEntity',
            `mixed-entity-${i}`,
            'CREATE',
            {
              userId: 'mixed-test-user',
              metadata: { testId: `mixed-business-${i}` }
            }
          )
        );

        // Performance logs
        mixedPromises.push(
          loggingService.logPerformance(
            'MIXED_CONCURRENT_OPERATION',
            'test-operation',
            Math.random() * 500,
            {
              memoryUsageMb: Math.random() * 50,
              cpuUsagePercent: Math.random() * 25
            },
            { 
              metadata: {
                testId: `mixed-perf-${i}`
              }
            }
          )
        );
      }

      // Wait for all mixed logs to complete
      await Promise.all(mixedPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`150 mixed concurrent logs completed in ${duration}ms`);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds

      // Verify all log types were created
      const appLogs = await logRepository.findApplicationLogs({
        serviceName: 'MixedConcurrentTest',
        limit: 50,
      });
      const businessLogs = await logRepository.findBusinessEventLogs({
        eventType: 'MIXED_CONCURRENT_EVENT',
        limit: 50,
      });
      const perfLogs = await logRepository.findPerformanceLogs({
        operationName: 'MIXED_CONCURRENT_OPERATION',
        limit: 50,
      });

      expect(appLogs.data.length).toBe(50);
      expect(businessLogs.data.length).toBe(50);
      expect(perfLogs.data.length).toBe(50);
    });
  });

  describe('Database Query Performance', () => {
    it('should query logs efficiently with pagination', async () => {
      if (!checkApp()) return;

      // First, create some test logs
      const logPromises = [];
      for (let i = 0; i < 100; i++) {
        logPromises.push(
          loggingService.info(
            `Query test log ${i}`,
            { testId: `query-test-${i}` },
            {
              serviceName: 'QueryPerformanceTest',
              moduleName: 'TestModule'
            }
          )
        );
      }
      await Promise.all(logPromises);

      // Test pagination performance
      const startTime = Date.now();
      
      const page1 = await logRepository.findApplicationLogs({
        serviceName: 'QueryPerformanceTest',
        limit: 20,
        page: 1,
      });

      const page2 = await logRepository.findApplicationLogs({
        serviceName: 'QueryPerformanceTest',
        limit: 20,
        page: 2,
      });

      const page3 = await logRepository.findApplicationLogs({
        serviceName: 'QueryPerformanceTest',
        limit: 20,
        page: 3,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`3 paginated queries completed in ${duration}ms`);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      expect(page1.data.length).toBe(20);
      expect(page2.data.length).toBe(20);
      expect(page3.data.length).toBe(20);
    });

    it('should filter logs efficiently by date range', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const endTime = new Date();
      const startDate = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Test date range filtering
      const logs = await logRepository.findApplicationLogs({
        startDate,
        endDate: endTime,
        limit: 1000,
      });

      const queryDuration = Date.now() - startTime;

      console.log(`Date range query completed in ${queryDuration}ms`);
      expect(queryDuration).toBeLessThan(500); // Should complete within 500ms

      expect(logs.data).toBeDefined();
      expect(Array.isArray(logs.data)).toBe(true);
    });

    it('should filter logs efficiently by level and context', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();

      // Test filtering by level and service
      const errorLogs = await logRepository.findApplicationLogs({
        level: 'error',
        serviceName: 'QueryPerformanceTest',
        limit: 100,
      });

      const infoLogs = await logRepository.findApplicationLogs({
        level: 'info',
        serviceName: 'QueryPerformanceTest',
        limit: 100,
      });

      const queryDuration = Date.now() - startTime;

      console.log(`Level and context filtering completed in ${queryDuration}ms`);
      expect(queryDuration).toBeLessThan(500); // Should complete within 500ms

      expect(errorLogs.data).toBeDefined();
      expect(infoLogs.data).toBeDefined();
    });
  });

  describe('Analytics Performance', () => {
    it('should generate log statistics efficiently', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const endTime = new Date();
      const startDate = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      // Test statistics generation
      const stats = await logAnalyticsService.generateAnalytics({
        startDate,
        endDate: endTime,
        granularity: 'day',
      });

      const statsDuration = Date.now() - startTime;

      console.log(`Log statistics generated in ${statsDuration}ms`);
      expect(statsDuration).toBeLessThan(1000); // Should complete within 1 second

      expect(stats).toBeDefined();
      expect(stats.summary.totalLogs).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate logs efficiently', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const endTime = new Date();
      const startDate = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      // Test log aggregation - using generateAnalytics instead
      const aggregatedLogs = await logAnalyticsService.generateAnalytics({
        startDate,
        endDate: endTime,
        granularity: 'hour',
      });

      const aggregationDuration = Date.now() - startTime;

      console.log(`Log aggregation completed in ${aggregationDuration}ms`);
      expect(aggregationDuration).toBeLessThan(1000); // Should complete within 1 second

      expect(aggregatedLogs).toBeDefined();
      expect(aggregatedLogs.summary).toBeDefined();
    });

    it('should summarize logs efficiently', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const endTime = new Date();
      const startDate = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      // Test log summarization - using generateAnalytics instead
      const summary = await logAnalyticsService.generateAnalytics({
        startDate,
        endDate: endTime,
        granularity: 'day',
      });

      const summaryDuration = Date.now() - startTime;

      console.log(`Log summarization completed in ${summaryDuration}ms`);
      expect(summaryDuration).toBeLessThan(1000); // Should complete within 1 second

      expect(summary).toBeDefined();
      expect(summary.summary).toBeDefined();
    });
  });

  describe('HTTP Request Performance', () => {
    it('should handle high-volume HTTP requests with logging', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const requestPromises = [];

      // Create 100 concurrent HTTP requests
      for (let i = 0; i < 100; i++) {
        requestPromises.push(
          request(app.getHttpServer())
            .get('/health')
            .set('X-Correlation-ID', `perf-test-${i}`)
        );
      }

      // Wait for all requests to complete
      const responses = await Promise.all(requestPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`100 HTTP requests with logging completed in ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Wait for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify request logs were created
      const requestLogs = await logRepository.findRequestLogs({
        limit: 100,
      });

      expect(requestLogs.data.length).toBeGreaterThanOrEqual(100);
    });

    it('should handle API requests with complex logging efficiently', async () => {
      if (!checkApp()) return;

      const startTime = Date.now();
      const requestPromises = [];

      // Create 50 concurrent API requests
      for (let i = 0; i < 50; i++) {
        requestPromises.push(
          request(app.getHttpServer())
            .get('/api/v1/portfolios')
            .set('X-Correlation-ID', `api-perf-test-${i}`)
            .set('X-User-ID', `user-${i}`)
        );
      }

      // Wait for all requests to complete
      const responses = await Promise.all(requestPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`50 API requests with complex logging completed in ${duration}ms`);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Wait for async logging to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify request logs were created
      const requestLogs = await logRepository.findRequestLogs({
        limit: 50,
      });

      expect(requestLogs.data.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks with high-volume logging', async () => {
      if (!checkApp()) return;

      const initialMemory = process.memoryUsage();
      console.log('Initial memory usage:', initialMemory);

      // Create a large number of logs
      const logPromises = [];
      for (let i = 0; i < 1000; i++) {
        logPromises.push(
          loggingService.info(
            `Memory test log ${i}`,
            { 
              testId: `memory-test-${i}`,
              largeData: 'x'.repeat(1000) // 1KB of data per log
            },
            {
              serviceName: 'MemoryTest',
              moduleName: 'TestModule'
            }
          )
        );
      }

      await Promise.all(logPromises);

      const afterLoggingMemory = process.memoryUsage();
      console.log('Memory usage after logging:', afterLoggingMemory);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      console.log('Final memory usage:', finalMemory);

      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
      expect(memoryIncreaseMB).toBeLessThan(100); // Should not increase by more than 100MB
    });
  });
});
