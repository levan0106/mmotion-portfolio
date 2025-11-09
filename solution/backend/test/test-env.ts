import { config } from 'dotenv';

// Load environment variables
config();

export const testConfig = {
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'portfolio_test',
    synchronize: false, // Never use synchronize in production
    logging: process.env.NODE_ENV === 'test' ? false : true,
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Application configuration
  app: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    baseUrl: `http://${process.env.HOST || 'localhost'}:${process.env.PORT || '3000'}`,
  },

  // Test configuration
  test: {
    timeout: 30000, // 30 seconds
    retries: 3,
    parallel: false, // Run tests sequentially to avoid conflicts
  },

  // Test data configuration
  testData: {
    portfolioId: '550e8400-e29b-41d4-a716-446655440000',
    assetId: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440002',
  },
};

export default testConfig;
