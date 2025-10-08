import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration to create the complete portfolio management schema.
 * Creates all tables: accounts, assets, portfolios, portfolio_assets, nav_snapshots, cash_flows
 */
export class CreatePortfolioSchema1734567890120 implements MigrationInterface {
  name = 'CreatePortfolioSchema1734567890120';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create accounts table
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'account_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'base_currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create assets table
    await queryRunner.createTable(
      new Table({
        name: 'assets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'asset_class',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create portfolios table
    await queryRunner.createTable(
      new Table({
        name: 'portfolios',
        columns: [
          {
            name: 'portfolioId',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'account_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'base_currency',
            type: 'varchar',
            length: '3',
            default: "'VND'",
          },
          {
            name: 'total_value',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'cash_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'unrealized_pl',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'realized_pl',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['account_id'],
            referencedTableName: 'accounts',
            referencedColumnNames: ['account_id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create portfolio_assets table
    await queryRunner.createTable(
      new Table({
        name: 'portfolio_assets',
        columns: [
          {
            name: 'portfolioId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'assetId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 15,
            scale: 6,
            default: 0,
          },
          {
            name: 'avg_cost',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'market_value',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'unrealized_pl',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['portfolioId'],
            referencedTableName: 'portfolios',
            referencedColumnNames: ['portfolioId'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['assetId'],
            referencedTableName: 'assets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create nav_snapshots table
    await queryRunner.createTable(
      new Table({
        name: 'nav_snapshots',
        columns: [
          {
            name: 'portfolioId',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'nav_date',
            type: 'date',
            isPrimary: true,
          },
          {
            name: 'nav_value',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'cash_balance',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'total_value',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['portfolioId'],
            referencedTableName: 'portfolios',
            referencedColumnNames: ['portfolioId'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create cash_flows table
    await queryRunner.createTable(
      new Table({
        name: 'cash_flows',
        columns: [
          {
            name: 'cashflow_id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'portfolioId',
            type: 'uuid',
          },
          {
            name: 'flow_date',
            type: 'timestamp',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 15,
            scale: 2,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['portfolioId'],
            referencedTableName: 'portfolios',
            referencedColumnNames: ['portfolioId'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex('portfolios', new TableIndex({
      name: 'IDX_portfolios_account_id',
      columnNames: ['account_id'],
    }));

    await queryRunner.createIndex('portfolio_assets', new TableIndex({
      name: 'IDX_portfolio_assets_asset_id',
      columnNames: ['assetId'],
    }));

    await queryRunner.createIndex('nav_snapshots', new TableIndex({
      name: 'IDX_nav_snapshots_portfolio_date',
      columnNames: ['portfolioId', 'nav_date'],
    }));

    await queryRunner.createIndex('nav_snapshots', new TableIndex({
      name: 'IDX_nav_snapshots_nav_date',
      columnNames: ['nav_date'],
    }));

    await queryRunner.createIndex('cash_flows', new TableIndex({
      name: 'IDX_cash_flows_portfolio_id',
      columnNames: ['portfolioId'],
    }));

    await queryRunner.createIndex('cash_flows', new TableIndex({
      name: 'IDX_cash_flows_flow_date',
      columnNames: ['flow_date'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.dropTable('cash_flows');
    await queryRunner.dropTable('nav_snapshots');
    await queryRunner.dropTable('portfolio_assets');
    await queryRunner.dropTable('portfolios');
    await queryRunner.dropTable('assets');
    await queryRunner.dropTable('accounts');
  }
}
