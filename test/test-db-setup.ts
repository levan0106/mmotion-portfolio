import { DataSource } from 'typeorm';
import { testConfig } from './test-env';
import { TestDataSetup } from './test-data-setup';

export class TestDatabaseSetup {
  private dataSource: DataSource;
  private testDataSetup: TestDataSetup;

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: testConfig.database.host,
      port: testConfig.database.port,
      username: testConfig.database.username,
      password: testConfig.database.password,
      database: testConfig.database.database,
      synchronize: false,
      logging: false,
      entities: [
        'src/modules/portfolio/entities/*.entity.ts',
        'src/modules/asset/entities/*.entity.ts',
        'src/modules/account/entities/*.entity.ts',
      ],
      migrations: ['src/migrations/*.ts'],
    });

    this.testDataSetup = new TestDataSetup(this.dataSource);
  }

  /**
   * Initialize the test database
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing test database...');
      
      // Initialize the data source
      await this.dataSource.initialize();
      console.log('✅ Database connection established');

      // Run migrations
      await this.runMigrations();
      console.log('✅ Migrations completed');

      // Setup test data
      await this.testDataSetup.setupTestData();
      console.log('✅ Test data setup completed');

    } catch (error) {
      console.error('❌ Failed to initialize test database:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('Running database migrations...');
      await this.dataSource.runMigrations();
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Clean up test database
   */
  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up test database...');
      
      // Clear test data
      await this.testDataSetup.cleanup();
      console.log('✅ Test data cleaned up');

      // Close database connection
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        console.log('✅ Database connection closed');
      }

    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error);
      throw error;
    }
  }

  /**
   * Get the data source
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.dataSource.isInitialized;
  }

  /**
   * Reset test data
   */
  async resetTestData(): Promise<void> {
    await this.testDataSetup.cleanup();
    await this.testDataSetup.setupTestData();
  }
}
