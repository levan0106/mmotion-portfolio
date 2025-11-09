/**
 * Database Test Utilities
 * Utilities for managing test database connections and cleanup
 */

import { DataSource, EntityTarget, Repository, DataSourceOptions } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../../src/config/database.test.config';

import { Portfolio } from '../../src/modules/portfolio/entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { NavSnapshot } from '../../src/modules/portfolio/entities/nav-snapshot.entity';
import { CashFlow } from '../../src/modules/portfolio/entities/cash-flow.entity';
import { Account } from '../../src/modules/shared/entities/account.entity';
import { Asset } from '../../src/modules/asset/entities/asset.entity';

/**
 * Test Database Manager
 * Manages database connections and cleanup for testing
 */
export class TestDatabaseManager {
  private static dataSource: DataSource;
  private static isInitialized = false;

  /**
   * Initialize test database connection
   */
  static async initialize(): Promise<DataSource> {
    if (this.isInitialized && this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    try {
      this.dataSource = new DataSource(testDatabaseConfig as DataSourceOptions);
      await this.dataSource.initialize();
      this.isInitialized = true;
      
      console.log('Test database connection initialized');
      return this.dataSource;
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      throw error;
    }
  }

  /**
   * Get the current data source
   */
  static getDataSource(): DataSource {
    if (!this.dataSource?.isInitialized) {
      throw new Error('Test database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  /**
   * Clean up all test data
   */
  static async cleanup(): Promise<void> {
    if (!this.dataSource?.isInitialized) {
      return;
    }

    try {
      // Clean up in reverse dependency order
      await this.dataSource.query('TRUNCATE TABLE cash_flows CASCADE');
      await this.dataSource.query('TRUNCATE TABLE nav_snapshots CASCADE');
      await this.dataSource.query('TRUNCATE TABLE portfolio_assets CASCADE');
      await this.dataSource.query('TRUNCATE TABLE portfolios CASCADE');
      await this.dataSource.query('TRUNCATE TABLE assets CASCADE');
      await this.dataSource.query('TRUNCATE TABLE accounts CASCADE');
      
      console.log('Test database cleaned up');
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  static async close(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      this.isInitialized = false;
      console.log('Test database connection closed');
    }
  }

  /**
   * Get repository for entity
   */
  static getRepository<T>(entity: EntityTarget<T>): Repository<T> {
    return this.getDataSource().getRepository(entity);
  }

  /**
   * Seed test data
   */
  static async seedTestData(): Promise<void> {
    const dataSource = this.getDataSource();
    
    // Seed accounts
    const accountRepo = dataSource.getRepository(Account);
    const accounts = [
      {
        accountId: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
        name: 'Test Account',
        email: 'tung@example.com',
        baseCurrency: 'VND',
      },
      {
        accountId: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Test Account 2',
        email: 'test2@example.com',
        baseCurrency: 'USD',
      },
    ];
    
    for (const accountData of accounts) {
      const account = accountRepo.create(accountData);
      await accountRepo.save(account);
    }

    // Seed assets
    const assetRepo = dataSource.getRepository(Asset);
    const assets = [
      {
        assetId: '550e8400-e29b-41d4-a716-446655440020',
        symbol: 'HPG',
        name: 'Hoa Phat Group Joint Stock Company',
        assetType: 'stock',
        exchange: 'HOSE',
        currency: 'VND',
        sector: 'Materials',
      },
      {
        assetId: '550e8400-e29b-41d4-a716-446655440021',
        symbol: 'VCB',
        name: 'Joint Stock Commercial Bank for Foreign Trade of Vietnam',
        assetType: 'stock',
        exchange: 'HOSE',
        currency: 'VND',
        sector: 'Financial Services',
      },
      {
        assetId: '550e8400-e29b-41d4-a716-446655440022',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        assetType: 'stock',
        exchange: 'NASDAQ',
        currency: 'USD',
        sector: 'Technology',
      },
    ];

    for (const assetData of assets) {
      const asset = assetRepo.create(assetData);
      await assetRepo.save(asset);
    }

    console.log('Test data seeded successfully');
  }

  /**
   * Reset database to clean state
   */
  static async reset(): Promise<void> {
    await this.cleanup();
    await this.seedTestData();
  }
}

/**
 * Create a test module with real database connection
 * Use this for integration tests that need actual database
 */
export async function createTestModuleWithDB(config: {
  imports?: any[];
  providers?: any[];
  controllers?: any[];
}): Promise<TestingModule> {
  const { imports = [], providers = [], controllers = [] } = config;

  await TestDatabaseManager.initialize();

  const module = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot(testDatabaseConfig),
      TypeOrmModule.forFeature([
        Portfolio,
        NavSnapshot,
        CashFlow,
        Account,
        Asset,
      ]),
      ...imports,
    ],
    providers,
    controllers,
  }).compile();

  return module;
}

/**
 * Database test helper functions
 */
export const dbTestUtils = {
  /**
   * Wait for database to be ready
   */
  async waitForDatabase(maxAttempts = 10, delay = 1000): Promise<void> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const dataSource = TestDatabaseManager.getDataSource();
        await dataSource.query('SELECT 1');
        return;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(`Database not ready after ${maxAttempts} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  /**
   * Execute raw SQL query
   */
  async executeQuery(query: string, parameters?: any[]): Promise<any> {
    const dataSource = TestDatabaseManager.getDataSource();
    return await dataSource.query(query, parameters);
  },

  /**
   * Count records in table
   */
  async countRecords(tableName: string): Promise<number> {
    const result = await this.executeQuery(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result[0].count);
  },

  /**
   * Check if table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      await this.executeQuery(`SELECT 1 FROM ${tableName} LIMIT 1`);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get table schema information
   */
  async getTableSchema(tableName: string): Promise<any[]> {
    return await this.executeQuery(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
  },
};

/**
 * Test transaction utilities
 */
export class TestTransactionManager {
  private static transactions: Map<string, any> = new Map();

  /**
   * Start a test transaction
   */
  static async startTransaction(testName: string): Promise<void> {
    const dataSource = TestDatabaseManager.getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    this.transactions.set(testName, queryRunner);
  }

  /**
   * Rollback test transaction
   */
  static async rollbackTransaction(testName: string): Promise<void> {
    const queryRunner = this.transactions.get(testName);
    if (queryRunner) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.transactions.delete(testName);
    }
  }

  /**
   * Get transaction query runner
   */
  static getQueryRunner(testName: string): any {
    return this.transactions.get(testName);
  }

  /**
   * Clean up all transactions
   */
  static async cleanup(): Promise<void> {
    for (const [testName, queryRunner] of this.transactions.entries()) {
      try {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
      } catch (error) {
        console.warn(`Failed to cleanup transaction for test: ${testName}`, error);
      }
    }
    this.transactions.clear();
  }
}
