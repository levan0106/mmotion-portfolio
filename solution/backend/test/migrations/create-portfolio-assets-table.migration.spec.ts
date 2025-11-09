import { DataSource } from 'typeorm';
import { CreatePortfolioAssetsTable20250913100905 } from '../../src/migrations/20250913100905-CreatePortfolioAssetsTable';
import { TestDatabaseManager } from '../utils/database-test.utils';

describe('CreatePortfolioAssetsTable Migration', () => {
  let dataSource: DataSource;
  let migration: CreatePortfolioAssetsTable20250913100905;

  beforeAll(async () => {
    dataSource = await TestDatabaseManager.initialize();
    migration = new CreatePortfolioAssetsTable20250913100905();
  });

  afterAll(async () => {
    await TestDatabaseManager.cleanup();
  });

  beforeEach(async () => {
    // Clean up before each test
    await dataSource.query('DROP TABLE IF EXISTS portfolio_assets CASCADE');
  });

  describe('up() method', () => {
    it('should create portfolio_assets table with correct structure', async () => {
      await migration.up(dataSource.createQueryRunner());

      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeDefined();
      expect(table?.name).toBe('portfolio_assets');
    });

    it('should create all required columns', async () => {
      await migration.up(dataSource.createQueryRunner());

      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      const columns = table?.columns || [];

      // Check primary key
      const idColumn = columns.find(col => col.name === 'id');
      expect(idColumn).toBeDefined();
      expect(idColumn?.isPrimary).toBe(true);
      expect(idColumn?.type).toBe('uuid');

      // Check required columns
      const requiredColumns = [
        'portfolioId', 'name', 'type', 'initialValue', 'initialQuantity',
        'createdAt', 'updatedAt', 'createdBy', 'updatedBy'
      ];

      requiredColumns.forEach(columnName => {
        const column = columns.find(col => col.name === columnName);
        expect(column).toBeDefined();
        expect(column?.isNullable).toBe(false);
      });

      // Check optional columns
      const optionalColumns = ['code', 'description', 'currentValue', 'currentQuantity'];
      optionalColumns.forEach(columnName => {
        const column = columns.find(col => col.name === columnName);
        expect(column).toBeDefined();
        expect(column?.isNullable).toBe(true);
      });
    });

    it('should create correct column types', async () => {
      await migration.up(dataSource.createQueryRunner());

      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      const columns = table?.columns || [];

      // Check specific column types
      const nameColumn = columns.find(col => col.name === 'name');
      expect(nameColumn?.type).toBe('varchar');
      expect(nameColumn?.length).toBe('255');

      const codeColumn = columns.find(col => col.name === 'code');
      expect(codeColumn?.type).toBe('varchar');
      expect(codeColumn?.length).toBe('50');

      const typeColumn = columns.find(col => col.name === 'type');
      expect(typeColumn?.type).toBe('enum');
      expect(typeColumn?.enum).toEqual(['STOCK', 'BOND', 'GOLD', 'DEPOSIT', 'CASH']);

      const initialValueColumn = columns.find(col => col.name === 'initialValue');
      expect(initialValueColumn?.type).toBe('decimal');
      expect(initialValueColumn?.precision).toBe(15);
      expect(initialValueColumn?.scale).toBe(2);

      const initialQuantityColumn = columns.find(col => col.name === 'initialQuantity');
      expect(initialQuantityColumn?.type).toBe('decimal');
      expect(initialQuantityColumn?.precision).toBe(15);
      expect(initialQuantityColumn?.scale).toBe(4);
    });

    it('should create all required indexes', async () => {
      await migration.up(dataSource.createQueryRunner());

      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      const indexes = table?.indices || [];

      const expectedIndexes = [
        'IDX_PORTFOLIO_ASSET_PORTFOLIO_ID',
        'IDX_PORTFOLIO_ASSET_TYPE',
        'IDX_PORTFOLIO_ASSET_CODE',
        'IDX_PORTFOLIO_ASSET_NAME',
        'IDX_PORTFOLIO_ASSET_PORTFOLIO_TYPE',
        'IDX_PORTFOLIO_ASSET_PORTFOLIO_NAME',
        'IDX_PORTFOLIO_ASSET_UNIQUE_NAME',
        'IDX_PORTFOLIO_ASSET_UNIQUE_CODE'
      ];

      expectedIndexes.forEach(indexName => {
        const index = indexes.find(idx => idx.name === indexName);
        expect(index).toBeDefined();
      });
    });

    it('should create unique constraints', async () => {
      await migration.up(dataSource.createQueryRunner());

      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      const indexes = table?.indices || [];

      // Check unique constraint for portfolio + name
      const uniqueNameIndex = indexes.find(idx => idx.name === 'IDX_PORTFOLIO_ASSET_UNIQUE_NAME');
      expect(uniqueNameIndex).toBeDefined();
      expect(uniqueNameIndex?.isUnique).toBe(true);
      expect(uniqueNameIndex?.columnNames).toEqual(['portfolioId', 'name']);

      // Check unique constraint for code
      const uniqueCodeIndex = indexes.find(idx => idx.name === 'IDX_PORTFOLIO_ASSET_UNIQUE_CODE');
      expect(uniqueCodeIndex).toBeDefined();
      expect(uniqueCodeIndex?.isUnique).toBe(true);
      expect(uniqueCodeIndex?.columnNames).toEqual(['code']);
    });

    it('should create foreign key constraint to portfolios table', async () => {
      // First create portfolios table for foreign key reference
      await dataSource.query(`
        CREATE TABLE portfolios (
          portfolio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          account_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          base_currency VARCHAR(3) DEFAULT 'VND',
          total_value DECIMAL(15,2) DEFAULT 0,
          cash_balance DECIMAL(15,2) DEFAULT 0,
          unrealized_pl DECIMAL(15,2) DEFAULT 0,
          realized_pl DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await migration.up(dataSource.createQueryRunner());

      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      const foreignKeys = table?.foreignKeys || [];

      expect(foreignKeys.length).toBeGreaterThan(0);
      
      const portfolioFk = foreignKeys.find(fk => 
        fk.columnNames.includes('portfolioId') && 
        fk.referencedTableName === 'portfolios'
      );
      expect(portfolioFk).toBeDefined();
      expect(portfolioFk?.referencedColumnNames).toEqual(['portfolioId']);
    });
  });

  describe('down() method', () => {
    beforeEach(async () => {
      // Create portfolios table first
      await dataSource.query(`
        CREATE TABLE portfolios (
          portfolio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          account_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          base_currency VARCHAR(3) DEFAULT 'VND',
          total_value DECIMAL(15,2) DEFAULT 0,
          cash_balance DECIMAL(15,2) DEFAULT 0,
          unrealized_pl DECIMAL(15,2) DEFAULT 0,
          realized_pl DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create portfolio_assets table
      await migration.up(dataSource.createQueryRunner());
    });

    it('should drop portfolio_assets table', async () => {
      await migration.down(dataSource.createQueryRunner());

      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeUndefined();
    });

    it('should drop all indexes before dropping table', async () => {
      // Verify table exists with indexes
      let table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeDefined();
      expect(table?.indices.length).toBeGreaterThan(0);

      await migration.down(dataSource.createQueryRunner());

      // Verify table is dropped
      table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeUndefined();
    });

    it('should handle foreign key constraints properly', async () => {
      // Insert test data to verify foreign key works
      await dataSource.query(`
        INSERT INTO portfolios (portfolio_id, account_id, name) 
        VALUES ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Test Portfolio')
      `);

      await dataSource.query(`
        INSERT INTO portfolio_assets (id, portfolioId, name, type, initialValue, initialQuantity, createdBy, updatedBy)
        VALUES ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Test Asset', 'STOCK', 1000, 10, '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003')
      `);

      // Verify data exists
      const result = await dataSource.query('SELECT * FROM portfolio_assets WHERE id = $1', ['550e8400-e29b-41d4-a716-446655440002']);
      expect(result.length).toBe(1);

      // Run down migration
      await migration.down(dataSource.createQueryRunner());

      // Verify table is dropped
      const table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeUndefined();
    });
  });

  describe('migration integration', () => {
    it('should be able to run up and down multiple times', async () => {
      // Create portfolios table first
      await dataSource.query(`
        CREATE TABLE portfolios (
          portfolio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          account_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          base_currency VARCHAR(3) DEFAULT 'VND',
          total_value DECIMAL(15,2) DEFAULT 0,
          cash_balance DECIMAL(15,2) DEFAULT 0,
          unrealized_pl DECIMAL(15,2) DEFAULT 0,
          realized_pl DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Run up migration
      await migration.up(dataSource.createQueryRunner());
      let table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeDefined();

      // Run down migration
      await migration.down(dataSource.createQueryRunner());
      table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeUndefined();

      // Run up migration again
      await migration.up(dataSource.createQueryRunner());
      table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeDefined();

      // Run down migration again
      await migration.down(dataSource.createQueryRunner());
      table = await dataSource.createQueryRunner().getTable('portfolio_assets');
      expect(table).toBeUndefined();
    });
  });
});
