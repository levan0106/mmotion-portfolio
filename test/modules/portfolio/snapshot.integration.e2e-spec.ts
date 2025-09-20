// Snapshot Integration Tests for CR-006 Asset Snapshot System

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

describe('Snapshot Integration Tests (e2e)', () => {
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

  describe('POST /snapshots', () => {
    it('should create a new snapshot', async () => {
      const createSnapshotDto = {
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

      const response = await request(app.getHttpServer())
        .post('/snapshots')
        .send(createSnapshotDto)
        .expect(201);

      expect(response.body).toMatchObject({
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
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const invalidDto = {
        portfolioId: '', // Invalid empty string
        assetId: testAssetId,
        assetSymbol: testAssetSymbol,
        snapshotDate: 'invalid-date',
        granularity: 'INVALID_GRANULARITY',
        quantity: -100, // Invalid negative quantity
        currentPrice: -10.50, // Invalid negative price
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
  });

  describe('GET /snapshots', () => {
    beforeEach(async () => {
      // Create test snapshots
      await createTestSnapshots();
    });

    it('should return all snapshots', async () => {
      const response = await request(app.getHttpServer())
        .get('/snapshots')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter snapshots by portfolioId', async () => {
      const response = await request(app.getHttpServer())
        .get('/snapshots')
        .query({ portfolioId: testPortfolioId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((snapshot: any) => {
        expect(snapshot.portfolioId).toBe(testPortfolioId);
      });
    });

    it('should filter snapshots by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/snapshots')
        .query({
          portfolioId: testPortfolioId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((snapshot: any) => {
        expect(snapshot.portfolioId).toBe(testPortfolioId);
        expect(snapshot.snapshotDate).toBeGreaterThanOrEqual('2024-01-01');
        expect(snapshot.snapshotDate).toBeLessThanOrEqual('2024-01-31');
      });
    });

    it('should filter snapshots by granularity', async () => {
      const response = await request(app.getHttpServer())
        .get('/snapshots')
        .query({
          portfolioId: testPortfolioId,
          granularity: SnapshotGranularity.DAILY,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((snapshot: any) => {
        expect(snapshot.granularity).toBe(SnapshotGranularity.DAILY);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/snapshots')
        .query({
          portfolioId: testPortfolioId,
          page: 1,
          limit: 2,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /snapshots/:id', () => {
    let snapshotId: string;

    beforeEach(async () => {
      const snapshot = await createTestSnapshot();
      snapshotId = snapshot.id;
    });

    it('should return a snapshot by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/snapshots/${snapshotId}`)
        .expect(200);

      expect(response.body.id).toBe(snapshotId);
      expect(response.body.portfolioId).toBe(testPortfolioId);
    });

    it('should return 404 for non-existent snapshot', async () => {
      await request(app.getHttpServer())
        .get('/snapshots/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /snapshots/:id', () => {
    let snapshotId: string;

    beforeEach(async () => {
      const snapshot = await createTestSnapshot();
      snapshotId = snapshot.id;
    });

    it('should update a snapshot', async () => {
      const updateData = {
        notes: 'Updated snapshot notes',
        quantity: 150,
        currentPrice: 11.00,
        currentValue: 1650,
      };

      const response = await request(app.getHttpServer())
        .put(`/snapshots/${snapshotId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.id).toBe(snapshotId);
      expect(response.body.notes).toBe(updateData.notes);
      expect(response.body.quantity).toBe(updateData.quantity);
      expect(response.body.currentPrice).toBe(updateData.currentPrice);
      expect(response.body.currentValue).toBe(updateData.currentValue);
    });

    it('should return 404 for non-existent snapshot', async () => {
      const updateData = { notes: 'Updated notes' };

      await request(app.getHttpServer())
        .put('/snapshots/non-existent-id')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /snapshots/:id', () => {
    let snapshotId: string;

    beforeEach(async () => {
      const snapshot = await createTestSnapshot();
      snapshotId = snapshot.id;
    });

    it('should soft delete a snapshot', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/snapshots/${snapshotId}`)
        .expect(200);

      expect(response.body.id).toBe(snapshotId);
      expect(response.body.isActive).toBe(false);
    });

    it('should return 404 for non-existent snapshot', async () => {
      await request(app.getHttpServer())
        .delete('/snapshots/non-existent-id')
        .expect(404);
    });
  });

  describe('POST /snapshots/portfolio/:portfolioId', () => {
    it('should create portfolio snapshots', async () => {
      const query = {
        snapshotDate: '2024-01-01',
        granularity: SnapshotGranularity.DAILY,
        createdBy: 'test-user',
      };

      const response = await request(app.getHttpServer())
        .post(`/snapshots/portfolio/${testPortfolioId}`)
        .query(query)
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /snapshots/:id/recalculate', () => {
    let snapshotId: string;

    beforeEach(async () => {
      const snapshot = await createTestSnapshot();
      snapshotId = snapshot.id;
    });

    it('should recalculate snapshot values', async () => {
      const response = await request(app.getHttpServer())
        .post(`/snapshots/${snapshotId}/recalculate`)
        .expect(200);

      expect(response.body.id).toBe(snapshotId);
      expect(response.body.currentValue).toBeDefined();
      expect(response.body.totalPl).toBeDefined();
    });

    it('should return 404 for non-existent snapshot', async () => {
      await request(app.getHttpServer())
        .post('/snapshots/non-existent-id/recalculate')
        .expect(404);
    });
  });

  describe('GET /snapshots/timeline', () => {
    beforeEach(async () => {
      await createTestSnapshots();
    });

    it('should return timeline data', async () => {
      const response = await request(app.getHttpServer())
        .get('/snapshots/timeline')
        .query({
          portfolioId: testPortfolioId,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          granularity: SnapshotGranularity.DAILY,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /snapshots/aggregated-timeline/:portfolioId', () => {
    beforeEach(async () => {
      await createTestSnapshots();
    });

    it('should return aggregated timeline data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/snapshots/aggregated-timeline/${testPortfolioId}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          granularity: SnapshotGranularity.DAILY,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /snapshots/statistics/:portfolioId', () => {
    beforeEach(async () => {
      await createTestSnapshots();
    });

    it('should return portfolio statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/snapshots/statistics/${testPortfolioId}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSnapshots');
      expect(response.body).toHaveProperty('latestSnapshotDate');
      expect(response.body).toHaveProperty('oldestSnapshotDate');
      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('totalPl');
      expect(response.body).toHaveProperty('averageReturn');
    });
  });

  describe('POST /snapshots/cleanup', () => {
    beforeEach(async () => {
      await createTestSnapshots();
    });

    it('should cleanup old snapshots', async () => {
      const response = await request(app.getHttpServer())
        .post('/snapshots/cleanup')
        .send({
          portfolioId: testPortfolioId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('deletedCount');
    });
  });

  // Helper functions
  async function createTestSnapshot(overrides: any = {}) {
    const snapshotData = {
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
      ...overrides,
    };

    const response = await request(app.getHttpServer())
      .post('/snapshots')
      .send(snapshotData)
      .expect(201);

    return response.body;
  }

  async function createTestSnapshots() {
    const snapshots = [];
    
    // Create snapshots for different dates
    for (let i = 1; i <= 5; i++) {
      const snapshot = await createTestSnapshot({
        snapshotDate: `2024-01-${i.toString().padStart(2, '0')}`,
        quantity: 100 + i * 10,
        currentPrice: 10.50 + i * 0.5,
        currentValue: 1050 + i * 100,
      });
      snapshots.push(snapshot);
    }

    // Create snapshots for different granularities
    await createTestSnapshot({
      snapshotDate: '2024-01-01',
      granularity: SnapshotGranularity.WEEKLY,
    });

    await createTestSnapshot({
      snapshotDate: '2024-01-01',
      granularity: SnapshotGranularity.MONTHLY,
    });

    return snapshots;
  }
});
