/**
 * Test Helpers
 * Centralized collection of all test utilities and helpers
 */

// Re-export all utilities for easy importing
export * from './test-module.factory';
export * from './database-test.utils';
export * from './test-environment.utils';

// Re-export fixtures
export * from '../fixtures/portfolio.fixtures';

// Import utilities for combined helper functions
import { TestModuleFactory } from './test-module.factory';
import { TestDatabaseManager, dbTestUtils } from './database-test.utils';
import { TestEnvironmentManager, TestAssertionUtils, TestValidationUtils } from './test-environment.utils';
import { portfolioFixtures } from '../fixtures/portfolio.fixtures';

/**
 * Comprehensive test setup helper
 * Use this for most test scenarios
 */
export class TestHelper {
  /**
   * Setup complete test environment
   * Call this in beforeAll or beforeEach
   */
  static async setupTest(options: {
    useDatabase?: boolean;
    seedData?: boolean;
    suppressLogs?: boolean;
  } = {}): Promise<void> {
    const { useDatabase = false, seedData = false, suppressLogs = true } = options;

    // Setup environment
    if (suppressLogs) {
      await TestEnvironmentManager.setup();
    }

    // Setup database if needed
    if (useDatabase) {
      await TestDatabaseManager.initialize();
      
      if (seedData) {
        await TestDatabaseManager.seedTestData();
      }
    }
  }

  /**
   * Cleanup test environment
   * Call this in afterAll or afterEach
   */
  static async cleanupTest(options: {
    useDatabase?: boolean;
    closeDatabase?: boolean;
  } = {}): Promise<void> {
    const { useDatabase = false, closeDatabase = false } = options;

    // Cleanup database if used
    if (useDatabase) {
      await TestDatabaseManager.cleanup();
      
      if (closeDatabase) {
        await TestDatabaseManager.close();
      }
    }

    // Cleanup environment
    await TestEnvironmentManager.teardown();
  }

  /**
   * Create a complete test module with all common dependencies
   */
  static async createTestModule(config: {
    services?: any[];
    controllers?: any[];
    useRealDatabase?: boolean;
    customMocks?: { [key: string]: any };
  } = {}) {
    const { services = [], controllers = [], useRealDatabase = false, customMocks = {} } = config;

    if (useRealDatabase) {
      // Use real database connection
      const { createTestModuleWithDB } = await import('./database-test.utils');
      return createTestModuleWithDB({
        providers: services,
        controllers,
      });
    } else {
      // Use mocked dependencies
      return TestModuleFactory.createTestModule({
        providers: services,
        controllers,
        customMocks,
      });
    }
  }

  /**
   * Quick service test setup
   */
  static async createServiceTest<T>(
    ServiceClass: new (...args: any[]) => T,
    dependencies: any[] = []
  ): Promise<{
    module: any;
    service: T;
    mocks: { [key: string]: any };
  }> {
    return TestModuleFactory.createServiceTestModule(ServiceClass, dependencies);
  }

  /**
   * Quick controller test setup
   */
  static async createControllerTest<T>(
    ControllerClass: new (...args: any[]) => T,
    services: any[] = []
  ): Promise<{
    module: any;
    controller: T;
    mocks: { [key: string]: any };
  }> {
    return TestModuleFactory.createControllerTestModule(ControllerClass, services);
  }

  /**
   * Create test data with fixtures
   */
  static createTestData() {
    return {
      // Entities
      account: portfolioFixtures.account,
      portfolio: portfolioFixtures.portfolio,
      asset: portfolioFixtures.asset,
      portfolioAsset: portfolioFixtures.portfolioAsset,
      
      // DTOs
      createPortfolioDto: portfolioFixtures.createPortfolioDto,
      updatePortfolioDto: portfolioFixtures.updatePortfolioDto,
      
      // Lists
      portfolioList: portfolioFixtures.portfolioList,
      
      // Mock UUIDs
      uuids: portfolioFixtures.uuids,
    };
  }

  /**
   * Validation helpers
   */
  static validation = TestValidationUtils;

  /**
   * Assertion helpers
   */
  static assertions = TestAssertionUtils;

  /**
   * Database helpers
   */
  static database = {
    manager: TestDatabaseManager,
    utils: dbTestUtils,
  };

  /**
   * Common test patterns
   */
  static patterns = {
    /**
     * Test CRUD operations pattern
     */
    async testCrudOperations<T>(
      service: any,
      createDto: any,
      updateDto: any,
      entityValidator: (entity: T) => void
    ) {
      // Test Create
      const created = await service.create(createDto);
      entityValidator(created);
      
      // Test Read
      const found = await service.findOne(created.id);
      entityValidator(found);
      expect(found.id).toBe(created.id);
      
      // Test Update
      const updated = await service.update(created.id, updateDto);
      entityValidator(updated);
      
      // Test Delete
      await service.remove(created.id);
      await expect(service.findOne(created.id)).rejects.toThrow();
    },

    /**
     * Test validation errors pattern
     */
    async testValidationErrors(
      operation: () => Promise<any>,
      expectedErrors: string[]
    ) {
      try {
        await operation();
        fail('Expected validation errors but operation succeeded');
      } catch (error) {
        expect(error.message).toBeDefined();
        
        for (const expectedError of expectedErrors) {
          expect(error.message).toContain(expectedError);
        }
      }
    },

    /**
     * Test pagination pattern
     */
    async testPagination(
      service: any,
      method: string,
      totalItems: number
    ) {
      const pageSize = 10;
      const totalPages = Math.ceil(totalItems / pageSize);
      
      // Test first page
      const firstPage = await service[method]({ page: 1, limit: pageSize });
      expect(firstPage.data).toHaveLength(Math.min(pageSize, totalItems));
      expect(firstPage.total).toBe(totalItems);
      expect(firstPage.page).toBe(1);
      
      // Test last page if more than one page
      if (totalPages > 1) {
        const lastPage = await service[method]({ page: totalPages, limit: pageSize });
        expect(lastPage.data.length).toBeGreaterThan(0);
        expect(lastPage.page).toBe(totalPages);
      }
    },

    /**
     * Test error handling pattern
     */
    async testErrorHandling(
      operation: () => Promise<any>,
      expectedErrorType: any,
      expectedMessage?: string
    ) {
      await expect(operation()).rejects.toThrow(expectedErrorType);
      
      if (expectedMessage) {
        await expect(operation()).rejects.toThrow(expectedMessage);
      }
    },
  };
}

/**
 * Decorator for test methods that need database
 */
export function WithDatabase(seedData = false) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      await TestHelper.setupTest({ useDatabase: true, seedData });
      
      try {
        return await method.apply(this, args);
      } finally {
        await TestHelper.cleanupTest({ useDatabase: true });
      }
    };
    
    return descriptor;
  };
}

/**
 * Decorator for test methods that need performance measurement
 */
export function WithPerformance(maxTimeMs: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const executionTime = Date.now() - startTime;
        
        expect(executionTime).toBeLessThanOrEqual(maxTimeMs);
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.warn(`Test failed after ${executionTime}ms:`, error.message);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Global test utilities available in all test files
 */
export const testUtils = {
  helper: TestHelper,
  fixtures: portfolioFixtures,
  validation: TestValidationUtils,
  assertions: TestAssertionUtils,
  database: {
    manager: TestDatabaseManager,
    utils: dbTestUtils,
  },
  environment: TestEnvironmentManager,
};
