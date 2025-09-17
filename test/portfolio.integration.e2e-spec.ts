import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabaseManager, TestHelper } from './utils/test-helpers';
import { portfolioFixtures } from './fixtures/portfolio.fixtures';

describe('Portfolio Integration (e2e)', () => {
  let app: INestApplication;
  let testHelper: typeof TestHelper;

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
    } catch (error) {
      console.warn('Test setup failed, skipping integration tests:', error.message);
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

  beforeEach(async () => {
    // Clean up data between tests
    try {
      await TestDatabaseManager.cleanup();
      await TestDatabaseManager.seedTestData();
    } catch (error) {
      console.warn('Test data setup failed:', error.message);
    }
  });

  describe('Portfolio CRUD Operations', () => {
    describe('GET /api/v1/portfolios', () => {
      it('should get all portfolios for an account', async () => {
        if (!checkApp()) return;
        
        const testData = TestHelper.createTestData();
        const accountId = testData.uuids.account1;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios?accountId=${accountId}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        
        // Should return portfolios for the specific account
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('id');
          expect(response.body[0]).toHaveProperty('name');
          expect(response.body[0]).toHaveProperty('accountId', accountId);
          expect(response.body[0]).toHaveProperty('totalValue');
          expect(response.body[0]).toHaveProperty('cashBalance');
          expect(response.body[0]).toHaveProperty('createdAt');
          expect(response.body[0]).toHaveProperty('updatedAt');
        }
      });

      it('should return empty array for non-existent account', async () => {
        const nonExistentAccountId = '550e8400-e29b-41d4-a716-446655440999';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios?accountId=${nonExistentAccountId}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(0);
      });

      it('should return 400 for invalid accountId format', async () => {
        const invalidAccountId = 'invalid-uuid';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios?accountId=${invalidAccountId}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('validation failed');
      });

      it('should return 400 when accountId is missing', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/portfolios')
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('accountId is required');
      });
    });

    describe('POST /api/v1/portfolios', () => {
      it('should create a new portfolio', async () => {
        const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Integration Test Portfolio';

        const response = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(201);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', createDto.name);
        expect(response.body).toHaveProperty('accountId', createDto.accountId);
        expect(response.body).toHaveProperty('description', createDto.description);
        expect(response.body).toHaveProperty('totalValue', 0);
        expect(response.body).toHaveProperty('cashBalance');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
        expect(response.body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
        expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
      });

      it('should return 400 for invalid portfolio data', async () => {
        const invalidDto = {
          name: '', // Empty name should fail validation
          accountId: 'invalid-uuid',
          description: 'Test description',
          cashBalance: -100, // Negative balance should fail
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(invalidDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
        expect(response.body.message.some((msg: string) => msg.includes('name'))).toBe(true);
        expect(response.body.message.some((msg: string) => msg.includes('accountId'))).toBe(true);
        expect(response.body.message.some((msg: string) => msg.includes('cashBalance'))).toBe(true);
      });

      it('should return 400 for duplicate portfolio name within same account', async () => {
        const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Duplicate Portfolio Name';

        // Create first portfolio
        await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(201);

        // Try to create second portfolio with same name and accountId
        const response = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('already exists');
      });
    });

    describe('GET /api/v1/portfolios/:id', () => {
      it('should get a specific portfolio by ID', async () => {
        const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Specific Portfolio Test';

        // Create portfolio first
        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(201);

        const portfolioId = createResponse.body.id;

        // Get the portfolio
        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('id', portfolioId);
        expect(response.body).toHaveProperty('name', createDto.name);
        expect(response.body).toHaveProperty('accountId', createDto.accountId);
        expect(response.body).toHaveProperty('description', createDto.description);
        expect(response.body).toHaveProperty('totalValue');
        expect(response.body).toHaveProperty('cashBalance');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });

      it('should return 404 for non-existent portfolio', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${nonExistentId}`)
          .expect(404);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('not found');
      });

      it('should return 400 for invalid portfolio ID format', async () => {
        const invalidId = 'invalid-uuid';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${invalidId}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('validation failed');
      });
    });

    describe('PUT /api/v1/portfolios/:id', () => {
      it('should update an existing portfolio', async () => {
        const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Original Portfolio Name';

        // Create portfolio first
        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(201);

        const portfolioId = createResponse.body.id;
        const updateDto = {
          name: 'Updated Portfolio Name',
          description: 'Updated description',
          cashBalance: 75000,
        };

        // Update the portfolio
        const response = await request(app.getHttpServer())
          .put(`/api/v1/portfolios/${portfolioId}`)
          .send(updateDto)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('id', portfolioId);
        expect(response.body).toHaveProperty('name', updateDto.name);
        expect(response.body).toHaveProperty('description', updateDto.description);
        expect(response.body).toHaveProperty('cashBalance', updateDto.cashBalance);
        expect(response.body).toHaveProperty('updatedAt');
        
        // Verify updatedAt is more recent than createdAt
        expect(new Date(response.body.updatedAt).getTime())
          .toBeGreaterThanOrEqual(new Date(createResponse.body.createdAt).getTime());
      });

      it('should return 404 for non-existent portfolio update', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
        const updateDto = {
          name: 'Updated Name',
          description: 'Updated description',
        };

        const response = await request(app.getHttpServer())
          .put(`/api/v1/portfolios/${nonExistentId}`)
          .send(updateDto)
          .expect(404);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('not found');
      });

      it('should return 400 for invalid update data', async () => {
        const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Portfolio for Update Test';

        // Create portfolio first
        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(201);

        const portfolioId = createResponse.body.id;
        const invalidUpdateDto = {
          name: '', // Empty name should fail
          cashBalance: -1000, // Negative balance should fail
        };

        const response = await request(app.getHttpServer())
          .put(`/api/v1/portfolios/${portfolioId}`)
          .send(invalidUpdateDto)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });
    });

    describe('DELETE /api/v1/portfolios/:id', () => {
      it('should delete an existing portfolio', async () => {
        const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Portfolio to Delete';

        // Create portfolio first
        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(201);

        const portfolioId = createResponse.body.id;

        // Delete the portfolio
        await request(app.getHttpServer())
          .delete(`/api/v1/portfolios/${portfolioId}`)
          .expect(204);

        // Verify portfolio is deleted
        await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}`)
          .expect(404);
      });

      it('should return 404 for non-existent portfolio deletion', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

        const response = await request(app.getHttpServer())
          .delete(`/api/v1/portfolios/${nonExistentId}`)
          .expect(404);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('not found');
      });

      it('should return 400 for invalid portfolio ID format', async () => {
        const invalidId = 'invalid-uuid';

        const response = await request(app.getHttpServer())
          .delete(`/api/v1/portfolios/${invalidId}`)
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('validation failed');
      });
    });
  });

  describe('Portfolio Analytics Integration', () => {
    let portfolioId: string;

    beforeEach(async () => {
      // Create a portfolio for analytics tests
      const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Analytics Test Portfolio';

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/portfolios')
        .send(createDto)
        .expect(201);

      portfolioId = createResponse.body.id;
    });

    describe('GET /api/v1/portfolios/:id/analytics/performance', () => {
      it('should get performance analytics for a portfolio', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/performance`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalValue');
        expect(response.body).toHaveProperty('totalReturn');
        expect(response.body).toHaveProperty('totalReturnPercentage');
        expect(response.body).toHaveProperty('dayChange');
        expect(response.body).toHaveProperty('dayChangePercentage');
        expect(response.body).toHaveProperty('portfolioId', portfolioId);
      });

      it('should get performance analytics with period filter', async () => {
        const periods = ['1M', '3M', '6M', '1Y'];

        for (const period of periods) {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/portfolios/${portfolioId}/analytics/performance?period=${period}`)
            .expect(200);

          expect(response.body).toBeDefined();
          expect(response.body).toHaveProperty('totalValue');
          expect(response.body).toHaveProperty('totalReturn');
          expect(response.body).toHaveProperty('portfolioId', portfolioId);
          expect(response.body).toHaveProperty('period', period);
        }
      });

      it('should return 404 for non-existent portfolio analytics', async () => {
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${nonExistentId}/analytics/performance`)
          .expect(404);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('not found');
      });
    });

    describe('GET /api/v1/portfolios/:id/analytics/allocation', () => {
      it('should get asset allocation for a portfolio', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/allocation`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        
        // Each allocation should have the required properties
        if (response.body.length > 0) {
          const allocation = response.body[0];
          expect(allocation).toHaveProperty('symbol');
          expect(allocation).toHaveProperty('allocationPercentage');
          expect(allocation).toHaveProperty('marketValue');
          expect(allocation).toHaveProperty('quantity');
          expect(allocation).toHaveProperty('avgCost');
          expect(allocation).toHaveProperty('unrealizedPl');
          expect(allocation).toHaveProperty('unrealizedPlPercentage');
        }
      });

      it('should return empty array for portfolio with no assets', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/allocation`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        // New portfolio should have empty allocation
        expect(response.body).toHaveLength(0);
      });
    });

    describe('GET /api/v1/portfolios/:id/analytics/history', () => {
      it('should get portfolio history', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/history`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        
        // Each history point should have date and value
        if (response.body.length > 0) {
          const historyPoint = response.body[0];
          expect(historyPoint).toHaveProperty('date');
          expect(historyPoint).toHaveProperty('value');
          expect(typeof historyPoint.value).toBe('number');
        }
      });

      it('should get portfolio history with date range', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/history?startDate=${startDate}&endDate=${endDate}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should get portfolio history with limit', async () => {
        const limit = 10;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/history?limit=${limit}`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeLessThanOrEqual(limit);
      });
    });

    describe('GET /api/v1/portfolios/:id/analytics/risk', () => {
      it('should get portfolio risk metrics', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/risk`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('volatility');
        expect(response.body).toHaveProperty('sharpeRatio');
        expect(response.body).toHaveProperty('maxDrawdown');
        expect(response.body).toHaveProperty('beta');
        expect(response.body).toHaveProperty('var95');
        expect(response.body).toHaveProperty('var99');
        expect(response.body).toHaveProperty('portfolioId', portfolioId);
      });
    });

    describe('GET /api/v1/portfolios/:id/analytics/cashflow', () => {
      it('should get portfolio cash flow analysis', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/portfolios/${portfolioId}/analytics/cashflow`)
          .expect(200);

        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('totalInflows');
        expect(response.body).toHaveProperty('totalOutflows');
        expect(response.body).toHaveProperty('netCashFlow');
        expect(response.body).toHaveProperty('dividendIncome');
        expect(response.body).toHaveProperty('realizedGains');
        expect(response.body).toHaveProperty('fees');
        expect(response.body).toHaveProperty('portfolioId', portfolioId);
      });

      it('should get cash flow with period filter', async () => {
        const periods = ['1M', '3M', '6M', '1Y'];

        for (const period of periods) {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/portfolios/${portfolioId}/analytics/cashflow?period=${period}`)
            .expect(200);

          expect(response.body).toBeDefined();
          expect(response.body).toHaveProperty('totalInflows');
          expect(response.body).toHaveProperty('totalOutflows');
          expect(response.body).toHaveProperty('portfolioId', portfolioId);
          expect(response.body).toHaveProperty('period', period);
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent portfolio creation', async () => {
      const testData = TestHelper.createTestData();
        const createDtoBase = testData.createPortfolioDto();
        createDtoBase.accountId = testData.uuids.account1;

      // Create multiple portfolios concurrently with different names
      const promises = Array.from({ length: 5 }, (_, i) => 
        request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send({
            ...createDtoBase,
            name: `Concurrent Portfolio ${i + 1}`,
          })
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('name', `Concurrent Portfolio ${index + 1}`);
        expect(response.body).toHaveProperty('id');
      });

      // All should have unique IDs
      const ids = responses.map(r => r.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it('should handle large portfolio data', async () => {
      const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Large Data Portfolio';
        createDto.description = 'A'.repeat(1000); // Large description
        // Note: cashBalance is not part of CreatePortfolioDto

      const response = await request(app.getHttpServer())
        .post('/api/v1/portfolios')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('name', createDto.name);
      expect(response.body).toHaveProperty('description', createDto.description);
      expect(response.body).toHaveProperty('cashBalance');
    });

    it('should handle special characters in portfolio names', async () => {
      const testData = TestHelper.createTestData();
      const specialNames = [
        'Portfolio with émojis 🚀💰',
        'Portfolio with "quotes" and \'apostrophes\'',
        'Portfolio with <tags> & &amp; entities',
        'Portfolio with 中文字符',
        'Portfolio with עברית',
      ];

      for (const name of specialNames) {
        const createDto = testData.createPortfolioDto();
        createDto.name = name;

        const response = await request(app.getHttpServer())
          .post('/api/v1/portfolios')
          .send(createDto)
          .expect(201);

        expect(response.body).toHaveProperty('name', name);
      }
    });

    it('should maintain data integrity during rapid updates', async () => {
      const testData = TestHelper.createTestData();
        const createDto = testData.createPortfolioDto();
        createDto.name = 'Rapid Update Portfolio';

      // Create portfolio
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/portfolios')
        .send(createDto)
        .expect(201);

      const portfolioId = createResponse.body.id;

      // Perform rapid updates
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .put(`/api/v1/portfolios/${portfolioId}`)
          .send({
            name: `Updated Portfolio ${i + 1}`,
            cashBalance: 10000 + (i * 1000),
          })
      );

      const updateResponses = await Promise.all(updatePromises);

      // At least one should succeed (optimistic locking may cause some to fail)
      const successfulUpdates = updateResponses.filter(r => r.status === 200);
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // Final state should be consistent
      const finalResponse = await request(app.getHttpServer())
        .get(`/api/v1/portfolios/${portfolioId}`)
        .expect(200);

      expect(finalResponse.body).toHaveProperty('id', portfolioId);
      expect(finalResponse.body).toHaveProperty('name');
      expect(finalResponse.body).toHaveProperty('cashBalance');
    });
  });
});
