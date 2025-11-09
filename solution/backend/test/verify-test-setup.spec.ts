/**
 * Test Setup Verification
 * Verifies that all test utilities and database setup are working correctly
 */

import { TestHelper, testUtils } from './utils/test-helpers';
import { TestDatabaseManager } from './utils/database-test.utils';
import { TestEnvironmentManager } from './utils/test-environment.utils';

describe('Test Setup Verification', () => {
  beforeAll(async () => {
    await TestHelper.setupTest({
      useDatabase: false, // Start without database for basic tests
      suppressLogs: true,
    });
  });

  afterAll(async () => {
    await TestHelper.cleanupTest({
      useDatabase: false,
    });
  });

  describe('Environment Setup', () => {
    it('should have test environment configured', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(TestEnvironmentManager.isTestEnvironment()).toBe(true);
    });

    it('should have test configuration available', () => {
      const config = TestEnvironmentManager.getTestConfig();
      expect(config).toBeDefined();
      expect(config.app).toBeDefined();
      expect(config.cache).toBeDefined();
    });
  });

  describe('Test Utilities', () => {
    it('should have all test utilities available', () => {
      expect(testUtils).toBeDefined();
      expect(testUtils.helper).toBeDefined();
      expect(testUtils.fixtures).toBeDefined();
      expect(testUtils.validation).toBeDefined();
      expect(testUtils.assertions).toBeDefined();
      expect(testUtils.database).toBeDefined();
      expect(testUtils.environment).toBeDefined();
    });

    it('should have test fixtures available', () => {
      const fixtures = testUtils.fixtures;
      
      expect(fixtures.account).toBeDefined();
      expect(fixtures.portfolio).toBeDefined();
      expect(fixtures.asset).toBeDefined();
      expect(fixtures.createPortfolioDto).toBeDefined();
      expect(fixtures.uuids).toBeDefined();
    });

    it('should create valid test data', () => {
      const testData = TestHelper.createTestData();
      
      expect(testData.account).toBeDefined();
      expect(testData.portfolio).toBeDefined();
      expect(testData.uuids).toBeDefined();
      
      // Test account creation
      const account = testData.account();
      testUtils.validation.validateAccountStructure(account);
      
      // Test portfolio creation
      const portfolio = testData.portfolio();
      testUtils.validation.validatePortfolioStructure(portfolio);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate UUIDs correctly', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      const invalidUUID = 'not-a-uuid';
      
      expect(testUtils.validation.isValidUUID(validUUID)).toBe(true);
      expect(testUtils.validation.isValidUUID(invalidUUID)).toBe(false);
    });

    it('should validate emails correctly', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'not-an-email';
      
      expect(testUtils.validation.isValidEmail(validEmail)).toBe(true);
      expect(testUtils.validation.isValidEmail(invalidEmail)).toBe(false);
    });

    it('should validate currencies correctly', () => {
      expect(testUtils.validation.isValidCurrency('VND')).toBe(true);
      expect(testUtils.validation.isValidCurrency('USD')).toBe(true);
      expect(testUtils.validation.isValidCurrency('INVALID')).toBe(false);
    });

    it('should validate positive numbers correctly', () => {
      expect(testUtils.validation.isPositiveNumber(5)).toBe(true);
      expect(testUtils.validation.isPositiveNumber(-5)).toBe(false);
      expect(testUtils.validation.isPositiveNumber(0)).toBe(false);
      expect(testUtils.validation.isPositiveNumber('5')).toBe(false);
    });

    it('should validate dates correctly', () => {
      const validDate = new Date();
      const invalidDate = new Date('invalid');
      
      expect(testUtils.validation.isValidDate(validDate)).toBe(true);
      expect(testUtils.validation.isValidDate(invalidDate)).toBe(false);
    });
  });

  describe('Assertion Utilities', () => {
    it('should test promise rejections', async () => {
      const rejectingPromise = Promise.reject(new Error('Test error'));
      
      const error = await testUtils.assertions.expectToReject(
        rejectingPromise,
        'Test error'
      );
      
      expect(error.message).toBe('Test error');
    });

    it('should test object properties', () => {
      const obj = { a: 1, b: 2, c: 3 };
      
      expect(() => {
        testUtils.assertions.expectToHaveProperties(obj, ['a', 'b']);
      }).not.toThrow();
      
      expect(() => {
        testUtils.assertions.expectToHaveProperties(obj, ['a', 'd']);
      }).toThrow();
    });

    it('should test value ranges', () => {
      expect(() => {
        testUtils.assertions.expectToBeInRange(5, 1, 10);
      }).not.toThrow();
      
      expect(() => {
        testUtils.assertions.expectToBeInRange(15, 1, 10);
      }).toThrow();
    });

    it('should test recent dates', () => {
      const recentDate = new Date();
      const oldDate = new Date('2020-01-01');
      
      expect(() => {
        testUtils.assertions.expectToBeRecentDate(recentDate);
      }).not.toThrow();
      
      expect(() => {
        testUtils.assertions.expectToBeRecentDate(oldDate);
      }).toThrow();
    });
  });

  describe('Test Module Factory', () => {
    it('should create service test modules', async () => {
      class MockService {
        getData() {
          return 'data';
        }
      }
      
      const { module, service, mocks } = await TestHelper.createServiceTest(MockService);
      
      expect(module).toBeDefined();
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(MockService);
      expect(mocks).toBeDefined();
      expect(mocks.cacheManager).toBeDefined();
      expect(mocks.logger).toBeDefined();
    });

    it('should create controller test modules', async () => {
      class MockController {
        getData() {
          return 'data';
        }
      }
      
      const { module, controller, mocks } = await TestHelper.createControllerTest(MockController);
      
      expect(module).toBeDefined();
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(MockController);
      expect(mocks).toBeDefined();
    });
  });
});

// Database tests (only run if database is available)
describe('Database Setup Verification', () => {
  const isDatabaseAvailable = process.env.TEST_WITH_DATABASE === 'true';
  
  beforeAll(async () => {
    if (isDatabaseAvailable) {
      await TestHelper.setupTest({
        useDatabase: true,
        seedData: true,
      });
    }
  });

  afterAll(async () => {
    if (isDatabaseAvailable) {
      await TestHelper.cleanupTest({
        useDatabase: true,
        closeDatabase: true,
      });
    }
  });

  describe('Database Connection', () => {
    it('should connect to test database', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping database test - TEST_WITH_DATABASE not set');
        return;
      }

      expect(TestDatabaseManager.getDataSource().isInitialized).toBe(true);
    });

    it('should seed test data successfully', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping database test - TEST_WITH_DATABASE not set');
        return;
      }

      const accountCount = await testUtils.database.utils.countRecords('accounts');
      const assetCount = await testUtils.database.utils.countRecords('assets');
      
      expect(accountCount).toBeGreaterThan(0);
      expect(assetCount).toBeGreaterThan(0);
    });

    it('should clean up test data', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping database test - TEST_WITH_DATABASE not set');
        return;
      }

      await TestDatabaseManager.cleanup();
      
      const accountCount = await testUtils.database.utils.countRecords('accounts');
      const assetCount = await testUtils.database.utils.countRecords('assets');
      
      expect(accountCount).toBe(0);
      expect(assetCount).toBe(0);
    });
  });
});
