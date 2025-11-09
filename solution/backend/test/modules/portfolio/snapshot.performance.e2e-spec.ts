// Snapshot Performance Tests for CR-006 Asset Snapshot System

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { SnapshotModule } from '../../../src/modules/portfolio/snapshot.module';
import { AssetAllocationSnapshot } from '../../../src/modules/portfolio/entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../../../src/modules/portfolio/enums/snapshot-granularity.enum';
import { CreateTestModule } from '../../utils/test-module.factory';
import { DatabaseTestUtils } from '../../utils/database-test.utils';

describe('Snapshot Performance Tests (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testModule: TestingModule;

  const testPortfolioId = 'test-portfolio-id';
  const testAssetId = 'test-asset-id';
  const testAssetSymbol = 'TEST';

  beforeAll(async () => {
    testModule = await CreateTestModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'portfolio_test',
          entities: [AssetAllocationSnapshot],
          synchronize: false,
          logging: false,
        }),
        SnapshotModule,
      ],
    });

    app = testModule.createNestApplication();
    dataSource = testModule.get<DataSource>(DataSource);
    
    await app.init();
    await DatabaseTestUtils.cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await DatabaseTestUtils.cleanDatabase(dataSource);
    await app.close();
    await testModule.close();
  });

  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase(dataSource);
  });

  describe('Performance Tests', () => {
    it('should handle bulk snapshot creation efficiently', async () => {
      const startTime = Date.now();
      const snapshotCount = 100;
      const snapshots = [];

      // Create multiple snapshots
      for (let i = 0; i < snapshotCount; i++) {
        const snapshotData = {
          portfolioId: testPortfolioId,
          assetId: `${testAssetId}-${i}`,
          assetSymbol: `${testAssetSymbol}${i}`,
          snapshotDate: '2024-01-01',
          granularity: SnapshotGranularity.DAILY,
          quantity: 100 + i,
          currentPrice: 10.50 + i * 0.1,
          currentValue: 1050 + i * 10,
          costBasis: 1000 + i * 10,
          avgCost: 10.00 + i * 0.1,
          realizedPl: 0,
          unrealizedPl: 50 + i,
          totalPl: 50 + i,
          allocationPercentage: 10.5 + i * 0.1,
          portfolioTotalValue: 10000 + i * 100,
          returnPercentage: 5.0 + i * 0.1,
          dailyReturn: 0.5 + i * 0.01,
          cumulativeReturn: 5.0 + i * 0.1,
          isActive: true,
          createdBy: 'test-user',
          notes: `Test snapshot ${i}`,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/snapshots')
          .send(snapshotData)
          .expect(201);

        snapshots.push(response.body);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTimePerSnapshot = duration / snapshotCount;

      console.log(`Created ${snapshotCount} snapshots in ${duration}ms`);
      console.log(`Average time per snapshot: ${avgTimePerSnapshot}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(avgTimePerSnapshot).toBeLessThan(100); // Average should be less than 100ms per snapshot
      expect(snapshots.length).toBe(snapshotCount);
    });

    it('should handle large dataset queries efficiently', async () => {
      // Create a large dataset
      const snapshotCount = 1000;
      await createBulkSnapshots(snapshotCount);

      const startTime = Date.now();

      // Test query performance
      const response = await request(app.getHttpServer())
        .get('/api/v1/snapshots')
        .query({
          portfolioId: testPortfolioId,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Queried ${response.body.length} snapshots in ${duration}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.body.length).toBe(snapshotCount);
    });

    it('should handle pagination efficiently with large datasets', async () => {
      // Create a large dataset
      const snapshotCount = 1000;
      await createBulkSnapshots(snapshotCount);

      const pageSize = 50;
      const totalPages = Math.ceil(snapshotCount / pageSize);
      const queryTimes = [];

      // Test pagination performance
      for (let page = 1; page <= Math.min(totalPages, 10); page++) {
        const startTime = Date.now();

        const response = await request(app.getHttpServer())
          .get('/api/v1/snapshots')
          .query({
            portfolioId: testPortfolioId,
            page,
            limit: pageSize,
          })
          .expect(200);

        const endTime = Date.now();
        const duration = endTime - startTime;
        queryTimes.push(duration);

        expect(response.body.length).toBeLessThanOrEqual(pageSize);
      }

      const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      const maxQueryTime = Math.max(...queryTimes);

      console.log(`Average pagination query time: ${avgQueryTime}ms`);
      console.log(`Max pagination query time: ${maxQueryTime}ms`);

      // Performance assertions
      expect(avgQueryTime).toBeLessThan(1000); // Average should be less than 1 second
      expect(maxQueryTime).toBeLessThan(2000); // Max should be less than 2 seconds
    });

    it('should handle timeline queries efficiently', async () => {
      // Create a large dataset with different dates
      const snapshotCount = 500;
      await createBulkSnapshotsWithDates(snapshotCount);

      const startTime = Date.now();

      // Test timeline query performance
      const response = await request(app.getHttpServer())
        .get('/api/v1/snapshots/timeline')
        .query({
          portfolioId: testPortfolioId,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          granularity: SnapshotGranularity.DAILY,
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Timeline query completed in ${duration}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle aggregated timeline queries efficiently', async () => {
      // Create a large dataset
      const snapshotCount = 500;
      await createBulkSnapshotsWithDates(snapshotCount);

      const startTime = Date.now();

      // Test aggregated timeline query performance
      const response = await request(app.getHttpServer())
        .get(`/api/v1/snapshots/aggregated-timeline/${testPortfolioId}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          granularity: SnapshotGranularity.DAILY,
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Aggregated timeline query completed in ${duration}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle concurrent requests efficiently', async () => {
      // Create initial data
      await createBulkSnapshots(100);

      const concurrentRequests = 10;
      const startTime = Date.now();

      // Make concurrent requests
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app.getHttpServer())
          .get('/api/v1/snapshots')
          .query({
            portfolioId: testPortfolioId,
            page: 1,
            limit: 10,
          })
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Handled ${concurrentRequests} concurrent requests in ${duration}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(responses.length).toBe(concurrentRequests);
      responses.forEach(response => {
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    it('should handle bulk update operations efficiently', async () => {
      // Create initial data
      const snapshotCount = 100;
      const snapshots = await createBulkSnapshots(snapshotCount);

      const startTime = Date.now();

      // Update multiple snapshots
      const updatePromises = snapshots.slice(0, 50).map(snapshot =>
        request(app.getHttpServer())
          .put(`/api/v1/snapshots/${snapshot.id}`)
          .send({
            notes: `Updated snapshot ${snapshot.id}`,
            quantity: snapshot.quantity + 10,
          })
          .expect(200)
      );

      await Promise.all(updatePromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Updated 50 snapshots in ${duration}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle bulk delete operations efficiently', async () => {
      // Create initial data
      const snapshotCount = 100;
      const snapshots = await createBulkSnapshots(snapshotCount);

      const startTime = Date.now();

      // Delete multiple snapshots
      const deletePromises = snapshots.slice(0, 50).map(snapshot =>
        request(app.getHttpServer())
          .delete(`/api/v1/snapshots/${snapshot.id}`)
          .expect(200)
      );

      await Promise.all(deletePromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Deleted 50 snapshots in ${duration}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  // Helper functions
  async function createBulkSnapshots(count: number) {
    const snapshots = [];
    
    for (let i = 0; i < count; i++) {
      const snapshotData = {
        portfolioId: testPortfolioId,
        assetId: `${testAssetId}-${i}`,
        assetSymbol: `${testAssetSymbol}${i}`,
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100 + i,
        currentPrice: 10.50 + i * 0.1,
        currentValue: 1050 + i * 10,
        costBasis: 1000 + i * 10,
        avgCost: 10.00 + i * 0.1,
        realizedPl: 0,
        unrealizedPl: 50 + i,
        totalPl: 50 + i,
        allocationPercentage: 10.5 + i * 0.1,
        portfolioTotalValue: 10000 + i * 100,
        returnPercentage: 5.0 + i * 0.1,
        dailyReturn: 0.5 + i * 0.01,
        cumulativeReturn: 5.0 + i * 0.1,
        isActive: true,
        createdBy: 'test-user',
        notes: `Test snapshot ${i}`,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/snapshots')
        .send(snapshotData)
        .expect(201);

      snapshots.push(response.body);
    }

    return snapshots;
  }

  async function createBulkSnapshotsWithDates(count: number) {
    const snapshots = [];
    const startDate = new Date('2024-01-01');
    
    for (let i = 0; i < count; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      const snapshotData = {
        portfolioId: testPortfolioId,
        assetId: `${testAssetId}-${i}`,
        assetSymbol: `${testAssetSymbol}${i}`,
        snapshotDate: dateString,
        granularity: SnapshotGranularity.DAILY,
        quantity: 100 + i,
        currentPrice: 10.50 + i * 0.1,
        currentValue: 1050 + i * 10,
        costBasis: 1000 + i * 10,
        avgCost: 10.00 + i * 0.1,
        realizedPl: 0,
        unrealizedPl: 50 + i,
        totalPl: 50 + i,
        allocationPercentage: 10.5 + i * 0.1,
        portfolioTotalValue: 10000 + i * 100,
        returnPercentage: 5.0 + i * 0.1,
        dailyReturn: 0.5 + i * 0.01,
        cumulativeReturn: 5.0 + i * 0.1,
        isActive: true,
        createdBy: 'test-user',
        notes: `Test snapshot ${i}`,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/snapshots')
        .send(snapshotData)
        .expect(201);

      snapshots.push(response.body);
    }

    return snapshots;
  }
});
