/**
 * Test Module Factory
 * Utilities for creating NestJS test modules with mocked dependencies
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';

import { Portfolio } from '../../src/modules/portfolio/entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from '../../src/modules/portfolio/entities/nav-snapshot.entity';
import { CashFlow } from '../../src/modules/portfolio/entities/cash-flow.entity';
import { Account } from '../../src/modules/shared/entities/account.entity';
import { Asset } from '../../src/modules/asset/entities/asset.entity';

/**
 * Interface for test module configuration
 */
export interface TestModuleConfig {
  providers?: any[];
  imports?: any[];
  controllers?: any[];
  exports?: any[];
  mockRepositories?: any[];
  mockServices?: any[];
  customMocks?: { [key: string]: any };
}

/**
 * Creates a NestJS testing module with common mocked dependencies
 */
export class TestModuleFactory {
  /**
   * Create a test module with default mocks
   */
  static async createTestModule(config: TestModuleConfig = {}): Promise<TestingModule> {
    const {
      providers = [],
      imports = [],
      controllers = [],
      exports = [],
      mockRepositories = [],
      mockServices = [],
      customMocks = {},
    } = config;

    // Default repository mocks
    const defaultRepositoryMocks = [
      Portfolio,
      NavSnapshot,
      CashFlow,
      Account,
      Asset,
    ];

    // Combine default and custom repository mocks
    const allRepositoryMocks = [...defaultRepositoryMocks, ...mockRepositories];

    // Create repository providers with mocks
    const repositoryProviders = allRepositoryMocks.map((entity) => ({
      provide: getRepositoryToken(entity),
      useValue: global.createMockRepository(),
    }));

    // Default service mocks
    const defaultServiceMocks = [
      {
        provide: CACHE_MANAGER,
        useValue: global.createMockCacheManager(),
      },
      {
        provide: Logger,
        useValue: global.createMockLogger(),
      },
    ];

    // Custom mock providers
    const customMockProviders = Object.entries(customMocks).map(([token, mock]) => ({
      provide: token,
      useValue: mock,
    }));

    // Service mock providers
    const serviceMockProviders = mockServices.map((ServiceClass) => ({
      provide: ServiceClass,
      useValue: TestModuleFactory.createMockService(ServiceClass),
    }));

    // Combine all providers
    const allProviders = [
      ...providers,
      ...repositoryProviders,
      ...defaultServiceMocks,
      ...customMockProviders,
      ...serviceMockProviders,
    ];

    // Create the testing module
    const moduleBuilder = Test.createTestingModule({
      imports,
      controllers,
      providers: allProviders,
      exports,
    });

    return await moduleBuilder.compile();
  }

  /**
   * Create a mock service with all methods as jest functions
   */
  static createMockService(ServiceClass: any): any {
    const mockService: any = {};
    
    // Get all method names from the service prototype
    const prototype = ServiceClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function'
    );

    // Create jest mock functions for each method
    methodNames.forEach((methodName) => {
      mockService[methodName] = jest.fn();
    });

    return mockService;
  }

  /**
   * Create a test module specifically for service testing
   */
  static async createServiceTestModule(
    ServiceClass: any,
    dependencies: any[] = []
  ): Promise<{
    module: TestingModule;
    service: any;
    mocks: { [key: string]: any };
  }> {
    const mockRepositories = [Portfolio, NavSnapshot, CashFlow, Account, Asset];
    const mockServices = dependencies.filter((dep) => !mockRepositories.includes(dep));

    const module = await TestModuleFactory.createTestModule({
      providers: [ServiceClass],
      mockRepositories,
      mockServices,
    });

    const service = module.get<any>(ServiceClass);
    
    // Collect all mocks for easy access in tests
    const mocks: { [key: string]: any } = {};
    
    // Repository mocks
    mockRepositories.forEach((entity) => {
      const repositoryToken = getRepositoryToken(entity);
      mocks[`${entity.name.toLowerCase()}Repository`] = module.get(repositoryToken);
    });
    
    // Service mocks
    mockServices.forEach((ServiceClass) => {
      mocks[`${ServiceClass.name.toLowerCase()}`] = module.get(ServiceClass);
    });
    
    // Default mocks
    mocks.cacheManager = module.get(CACHE_MANAGER);
    mocks.logger = module.get(Logger);

    return { module, service, mocks };
  }

  /**
   * Create a test module specifically for controller testing
   */
  static async createControllerTestModule(
    ControllerClass: any,
    services: any[] = []
  ): Promise<{
    module: TestingModule;
    controller: any;
    mocks: { [key: string]: any };
  }> {
    const module = await TestModuleFactory.createTestModule({
      controllers: [ControllerClass],
      mockServices: services,
    });

    const controller = module.get<any>(ControllerClass);
    
    // Collect service mocks for easy access in tests
    const mocks: { [key: string]: any } = {};
    services.forEach((ServiceClass) => {
      mocks[`${ServiceClass.name.toLowerCase()}`] = module.get(ServiceClass);
    });

    return { module, controller, mocks };
  }

  /**
   * Create a test module for repository testing
   */
  static async createRepositoryTestModule(
    repositoryEntity: any
  ): Promise<{
    module: TestingModule;
    repository: any;
  }> {
    const module = await TestModuleFactory.createTestModule({
      mockRepositories: [repositoryEntity],
    });

    const repository = module.get(getRepositoryToken(repositoryEntity));

    return { module, repository };
  }

  /**
   * Helper method to reset all mocks in a test module
   */
  static resetAllMocks(mocks: { [key: string]: any }): void {
    Object.values(mocks).forEach((mock) => {
      if (mock && typeof mock === 'object') {
        Object.values(mock).forEach((method) => {
          if (jest.isMockFunction(method)) {
            (method as jest.Mock).mockReset();
          }
        });
      }
    });
  }

  /**
   * Helper method to clear all mocks in a test module
   */
  static clearAllMocks(mocks: { [key: string]: any }): void {
    Object.values(mocks).forEach((mock) => {
      if (mock && typeof mock === 'object') {
        Object.values(mock).forEach((method) => {
          if (jest.isMockFunction(method)) {
            (method as jest.Mock).mockClear();
          }
        });
      }
    });
  }
}

/**
 * Helper function to create mock repository
 * (Re-exported from global setup for convenience)
 */
export const createMockRepository = <T>() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
  })),
});

/**
 * Helper function to create mock cache manager
 * (Re-exported from global setup for convenience)
 */
export const createMockCacheManager = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
  store: {
    keys: jest.fn(),
    ttl: jest.fn(),
  },
});

/**
 * Helper function to create mock logger
 * (Re-exported from global setup for convenience)
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});
