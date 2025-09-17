/**
 * Test Database Configuration
 * Separate configuration for testing environment to avoid conflicts with development data
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Portfolio } from '../modules/portfolio/entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from '../modules/portfolio/entities/nav-snapshot.entity';
import { CashFlow } from '../modules/portfolio/entities/cash-flow.entity';
import { Account } from '../modules/shared/entities/account.entity';
import { Asset } from '../modules/asset/entities/asset.entity';

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT, 10) || 5433,
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_NAME || 'portfolio_test_db',
  
  // Test-specific settings
  synchronize: true, // Auto-create tables for tests
  dropSchema: true, // Drop schema before each test run
  logging: false, // Disable logging for cleaner test output
  
  // Entities
  entities: [
    Portfolio,
    NavSnapshot,
    CashFlow,
    Account,
    Asset,
  ],
  
  // Connection pooling for tests
  extra: {
    max: 5, // Smaller connection pool for tests
    min: 1,
    acquire: 30000,
    idle: 10000,
  },
  
  // Migrations (disabled for tests as we use synchronize)
  migrations: [],
  migrationsRun: false,
  
  // Subscribers (disabled for tests)
  subscribers: [],
};

/**
 * Test Redis Configuration
 */
export const testRedisConfig = {
  host: process.env.TEST_REDIS_HOST || 'localhost',
  port: parseInt(process.env.TEST_REDIS_PORT, 10) || 6380,
  db: parseInt(process.env.TEST_REDIS_DB, 10) || 1,
  password: process.env.TEST_REDIS_PASSWORD || undefined,
  
  // Test-specific Redis settings
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: false,
};

/**
 * Test Cache Configuration
 */
export const testCacheConfig = {
  ttl: 60, // Short TTL for tests (1 minute)
  max: 100, // Small cache size for tests
  store: 'memory', // Use memory store for tests
};

/**
 * Test Application Configuration
 */
export const testAppConfig = {
  port: parseInt(process.env.TEST_APP_PORT, 10) || 3001,
  host: process.env.TEST_APP_HOST || 'localhost',
  environment: 'test',
  
  // JWT configuration for tests
  jwt: {
    secret: process.env.TEST_JWT_SECRET || 'test-jwt-secret-key',
    expiresIn: process.env.TEST_JWT_EXPIRES_IN || '1h',
  },
  
  // Logging configuration for tests
  logging: {
    level: 'error', // Only log errors during tests
    silent: true, // Suppress most logs
  },
  
  // Test timeouts
  timeouts: {
    test: 30000, // 30 seconds
    database: 5000, // 5 seconds
    cache: 1000, // 1 second
  },
};

/**
 * Helper function to create test module configuration
 */
export const createTestConfig = () => ({
  database: testDatabaseConfig,
  redis: testRedisConfig,
  cache: testCacheConfig,
  app: testAppConfig,
});

/**
 * Environment validation for tests
 */
export const validateTestEnvironment = (): boolean => {
  const requiredEnvVars = [
    'NODE_ENV',
  ];
  
  const missingVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );
  
  if (missingVars.length > 0) {
    console.warn(`Missing test environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  if (process.env.NODE_ENV !== 'test') {
    console.warn('NODE_ENV is not set to "test"');
    return false;
  }
  
  return true;
};
