/**
 * Test Environment Utilities
 * Utilities for managing test environment setup and configuration
 */

import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { testAppConfig, testCacheConfig } from '../../src/config/database.test.config';

/**
 * Test Environment Manager
 * Manages test environment configuration and setup
 */
export class TestEnvironmentManager {
  private static isSetup = false;

  /**
   * Setup test environment
   */
  static async setup(): Promise<void> {
    if (this.isSetup) {
      return;
    }

    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433';
    process.env.DB_USERNAME = 'postgres';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_NAME = 'portfolio_test_db';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_DB = '1';
    process.env.JWT_SECRET = 'test-jwt-secret-key';
    process.env.LOG_LEVEL = 'error';

    // Suppress console output during tests
    this.suppressConsoleOutput();

    this.isSetup = true;
    console.log('Test environment setup completed');
  }

  /**
   * Teardown test environment
   */
  static async teardown(): Promise<void> {
    if (!this.isSetup) {
      return;
    }

    // Restore console methods
    this.restoreConsoleOutput();

    this.isSetup = false;
    console.log('Test environment teardown completed');
  }

  /**
   * Suppress console output during tests
   */
  private static suppressConsoleOutput(): void {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    // Store original methods for restoration
    (global as any).__originalConsole = {
      error: originalConsoleError,
      warn: originalConsoleWarn,
      log: originalConsoleLog,
    };

    // Mock console methods
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  }

  /**
   * Restore console output
   */
  private static restoreConsoleOutput(): void {
    const originalConsole = (global as any).__originalConsole;
    if (originalConsole) {
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.log = originalConsole.log;
    }
  }

  /**
   * Check if running in test environment
   */
  static isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test';
  }

  /**
   * Get test configuration
   */
  static getTestConfig() {
    return {
      app: testAppConfig,
      cache: testCacheConfig,
    };
  }
}

/**
 * Create test configuration module
 */
export function createTestConfigModule() {
  return ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env.test',
    load: [() => TestEnvironmentManager.getTestConfig()],
  });
}

/**
 * Create test cache module
 */
export function createTestCacheModule() {
  return CacheModule.register({
    ...testCacheConfig,
    isGlobal: true,
  });
}

/**
 * Test timing utilities
 */
export class TestTimingUtils {
  private static timers: Map<string, number> = new Map();

  /**
   * Start timing a test operation
   */
  static startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * End timing and get duration
   */
  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    return duration;
  }

  /**
   * Time an async operation
   */
  static async timeOperation<T>(name: string, operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.startTimer(name);
    const result = await operation();
    const duration = this.endTimer(name);
    
    return { result, duration };
  }

  /**
   * Clear all timers
   */
  static clearTimers(): void {
    this.timers.clear();
  }
}

/**
 * Test assertion utilities
 */
export class TestAssertionUtils {
  /**
   * Assert that a promise rejects with specific error
   */
  static async expectToReject(
    promise: Promise<any>,
    expectedError?: string | RegExp | Error
  ): Promise<Error> {
    try {
      await promise;
      throw new Error('Expected promise to reject, but it resolved');
    } catch (error) {
      if (expectedError) {
        if (typeof expectedError === 'string') {
          expect(error.message).toContain(expectedError);
        } else if (expectedError instanceof RegExp) {
          expect(error.message).toMatch(expectedError);
        } else if (expectedError instanceof Error) {
          expect(error.message).toBe(expectedError.message);
        }
      }
      return error as Error;
    }
  }

  /**
   * Assert that an object has specific properties
   */
  static expectToHaveProperties(obj: any, properties: string[]): void {
    for (const prop of properties) {
      expect(obj).toHaveProperty(prop);
    }
  }

  /**
   * Assert that an object matches a partial structure
   */
  static expectToMatchPartial(actual: any, expected: any): void {
    expect(actual).toMatchObject(expected);
  }

  /**
   * Assert that an array contains items matching criteria
   */
  static expectArrayToContain<T>(
    array: T[],
    matcher: (item: T) => boolean,
    count?: number
  ): void {
    const matchingItems = array.filter(matcher);
    
    if (count !== undefined) {
      expect(matchingItems).toHaveLength(count);
    } else {
      expect(matchingItems.length).toBeGreaterThan(0);
    }
  }

  /**
   * Assert that a value is within a range
   */
  static expectToBeInRange(value: number, min: number, max: number): void {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  }

  /**
   * Assert that a date is recent (within last N milliseconds)
   */
  static expectToBeRecentDate(date: Date, withinMs = 5000): void {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    expect(diff).toBeLessThanOrEqual(withinMs);
    expect(diff).toBeGreaterThanOrEqual(0);
  }
}

/**
 * Test data validation utilities
 */
export class TestValidationUtils {
  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate currency code (ISO 4217)
   */
  static isValidCurrency(currency: string): boolean {
    const validCurrencies = ['VND', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'HKD'];
    return validCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Validate positive number
   */
  static isPositiveNumber(value: any): boolean {
    return typeof value === 'number' && value > 0;
  }

  /**
   * Validate date object
   */
  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate portfolio data structure
   */
  static validatePortfolioStructure(portfolio: any): void {
    expect(portfolio).toBeDefined();
    expect(portfolio.portfolioId).toBeDefined();
    expect(this.isValidUUID(portfolio.portfolioId)).toBe(true);
    expect(portfolio.accountId).toBeDefined();
    expect(this.isValidUUID(portfolio.accountId)).toBe(true);
    expect(portfolio.name).toBeDefined();
    expect(typeof portfolio.name).toBe('string');
    expect(portfolio.baseCurrency).toBeDefined();
    expect(this.isValidCurrency(portfolio.baseCurrency)).toBe(true);
    expect(portfolio.createdAt).toBeDefined();
    expect(this.isValidDate(portfolio.createdAt)).toBe(true);
    expect(portfolio.updatedAt).toBeDefined();
    expect(this.isValidDate(portfolio.updatedAt)).toBe(true);
  }

  /**
   * Validate account data structure
   */
  static validateAccountStructure(account: any): void {
    expect(account).toBeDefined();
    expect(account.accountId).toBeDefined();
    expect(this.isValidUUID(account.accountId)).toBe(true);
    expect(account.name).toBeDefined();
    expect(typeof account.name).toBe('string');
    expect(account.email).toBeDefined();
    expect(this.isValidEmail(account.email)).toBe(true);
    expect(account.baseCurrency).toBeDefined();
    expect(this.isValidCurrency(account.baseCurrency)).toBe(true);
  }
}

/**
 * Performance testing utilities
 */
export class TestPerformanceUtils {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    
    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    return { result, executionTime };
  }

  /**
   * Assert that operation completes within time limit
   */
  static async expectToCompleteWithin<T>(
    operation: () => Promise<T>,
    maxTimeMs: number
  ): Promise<T> {
    const { result, executionTime } = await this.measureExecutionTime(operation);
    
    expect(executionTime).toBeLessThanOrEqual(maxTimeMs);
    
    return result;
  }

  /**
   * Benchmark multiple operations
   */
  static async benchmark(
    operations: { name: string; fn: () => Promise<any> }[],
    iterations = 1
  ): Promise<{ name: string; avgTime: number; minTime: number; maxTime: number }[]> {
    const results = [];
    
    for (const operation of operations) {
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const { executionTime } = await this.measureExecutionTime(operation.fn);
        times.push(executionTime);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      results.push({
        name: operation.name,
        avgTime,
        minTime,
        maxTime,
      });
    }
    
    return results;
  }
}
