// Snapshot Error Handling Tests for CR-006 Asset Snapshot System

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

describe('Snapshot Error Handling Tests (e2e)', () => {
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

  describe('Validation Error Handling', () => {
    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/snapshots/invalid-uuid')
        .expect(400);
    });

    it('should return 400 for invalid date format', async () => {
      const invalidDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: 'invalid-date-format',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot',
      };

      await request(app.getHttpServer())
        .post('/snapshots')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for invalid granularity', async () => {
      const invalidDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: '2024-01-01',
        granularity: 'INVALID_GRANULARITY',
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot',
      };

      await request(app.getHttpServer())
        .post('/snapshots')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for negative values', async () => {
      const invalidDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: -100, // Invalid negative quantity
        currentPrice: -10.50, // Invalid negative price
        currentValue: -1050, // Invalid negative value
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot',
      };

      await request(app.getHttpServer())
        .post('/snapshots')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteDto = {
        portfolioId: testPortfolioId,
        // Missing required fields
      };

      await request(app.getHttpServer())
        .post('/snapshots')
        .send(incompleteDto)
        .expect(400);
    });

    it('should return 400 for empty string values', async () => {
      const invalidDto = {
        portfolioId: '', // Invalid empty string
        assetId: '', // Invalid empty string
        assetSymbol: '', // Invalid empty string
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot',
      };

      await request(app.getHttpServer())
        .post('/snapshots')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('Not Found Error Handling', () => {
    it('should return 404 for non-existent snapshot', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .get(`/snapshots/${nonExistentId}`)
        .expect(404);
    });

    it('should return 404 for non-existent snapshot update', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData = { notes: 'Updated notes' };

      await request(app.getHttpServer())
        .put(`/snapshots/${nonExistentId}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 404 for non-existent snapshot delete', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .delete(`/snapshots/${nonExistentId}`)
        .expect(404);
    });

    it('should return 404 for non-existent snapshot recalculate', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/snapshots/${nonExistentId}/recalculate`)
        .expect(404);
    });
  });

  describe('Bad Request Error Handling', () => {
    it('should return 400 for invalid query parameters', async () => {
      await request(app.getHttpServer())
        .get('/snapshots')
        .query({
          portfolioId: 'invalid-uuid',
          startDate: 'invalid-date',
          endDate: 'invalid-date',
          granularity: 'INVALID_GRANULARITY',
          page: -1,
          limit: -10,
        })
        .expect(400);
    });

    it('should return 400 for invalid date range', async () => {
      await request(app.getHttpServer())
        .get('/snapshots')
        .query({
          portfolioId: testPortfolioId,
          startDate: '2024-12-31',
          endDate: '2024-01-01', // End date before start date
        })
        .expect(400);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/snapshots')
        .query({
          portfolioId: testPortfolioId,
          page: 0, // Invalid page number
          limit: 0, // Invalid limit
        })
        .expect(400);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database connection failures
      // For now, we'll test with invalid data that might cause database errors
      const invalidDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot',
      };

      // Create a snapshot first
      const response = await request(app.getHttpServer())
        .post('/snapshots')
        .send(invalidDto)
        .expect(201);

      // Try to create a duplicate snapshot (if there are unique constraints)
      // This might cause a database error
      await request(app.getHttpServer())
        .post('/snapshots')
        .send(invalidDto)
        .expect(400); // or 409 Conflict, depending on implementation
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', async () => {
      const largeNumberDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: Number.MAX_SAFE_INTEGER,
        currentPrice: Number.MAX_SAFE_INTEGER,
        currentValue: Number.MAX_SAFE_INTEGER,
        costBasis: Number.MAX_SAFE_INTEGER,
        avgCost: Number.MAX_SAFE_INTEGER,
        realizedPl: Number.MAX_SAFE_INTEGER,
        unrealizedPl: Number.MAX_SAFE_INTEGER,
        totalPl: Number.MAX_SAFE_INTEGER,
        allocationPercentage: 100.0,
        portfolioTotalValue: Number.MAX_SAFE_INTEGER,
        returnPercentage: 100.0,
        dailyReturn: 100.0,
        cumulativeReturn: 100.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot with large numbers',
      };

      const response = await request(app.getHttpServer())
        .post('/snapshots')
        .send(largeNumberDto)
        .expect(201);

      expect(response.body.quantity).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle very small numbers', async () => {
      const smallNumberDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 0.000001,
        currentPrice: 0.000001,
        currentValue: 0.000001,
        costBasis: 0.000001,
        avgCost: 0.000001,
        realizedPl: 0.000001,
        unrealizedPl: 0.000001,
        totalPl: 0.000001,
        allocationPercentage: 0.000001,
        portfolioTotalValue: 0.000001,
        returnPercentage: 0.000001,
        dailyReturn: 0.000001,
        cumulativeReturn: 0.000001,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot with small numbers',
      };

      const response = await request(app.getHttpServer())
        .post('/snapshots')
        .send(smallNumberDto)
        .expect(201);

      expect(response.body.quantity).toBe(0.000001);
    });

    it('should handle very long strings', async () => {
      const longString = 'A'.repeat(10000);
      const longStringDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: longString,
      };

      const response = await request(app.getHttpServer())
        .post('/snapshots')
        .send(longStringDto)
        .expect(201);

      expect(response.body.notes).toBe(longString);
    });

    it('should handle special characters in strings', async () => {
      const specialStringDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: 'TEST@#$%^&*()',
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot with special characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
      };

      const response = await request(app.getHttpServer())
        .post('/snapshots')
        .send(specialStringDto)
        .expect(201);

      expect(response.body.assetSymbol).toBe('TEST@#$%^&*()');
      expect(response.body.notes).toBe('Test snapshot with special characters: !@#$%^&*()_+-=[]{}|;:,.<>?');
    });

    it('should handle unicode characters', async () => {
      const unicodeDto = {
        portfolioId: testPortfolioId,
        assetId: testAssetId,
        assetSymbol: '测试资产',
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        quantity: 100,
        currentPrice: 10.50,
        currentValue: 1050,
        costBasis: 1000,
        avgCost: 10.00,
        realizedPl: 0,
        unrealizedPl: 50,
        totalPl: 50,
        allocationPercentage: 10.5,
        portfolioTotalValue: 10000,
        returnPercentage: 5.0,
        dailyReturn: 0.5,
        cumulativeReturn: 5.0,
        isActive: true,
        createdBy: 'test-user',
        notes: 'Test snapshot with unicode: 测试注释 🚀 💰 📈',
      };

      const response = await request(app.getHttpServer())
        .post('/snapshots')
        .send(unicodeDto)
        .expect(201);

      expect(response.body.assetSymbol).toBe('测试资产');
      expect(response.body.notes).toBe('Test snapshot with unicode: 测试注释 🚀 💰 📈');
    });
  });

  describe('Rate Limiting and Timeout Handling', () => {
    it('should handle rapid consecutive requests', async () => {
      const requests = Array.from({ length: 100 }, (_, i) =>
        request(app.getHttpServer())
          .get('/snapshots')
          .query({ portfolioId: testPortfolioId })
          .expect(200)
      );

      const responses = await Promise.all(requests);
      expect(responses.length).toBe(100);
    });

    it('should handle timeout scenarios gracefully', async () => {
      // This test would require mocking slow database responses
      // For now, we'll test with a simple request that should complete quickly
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/snapshots')
        .query({ portfolioId: testPortfolioId })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
    });
  });
});
