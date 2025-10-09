import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePortfolioSnapshots1736332000002 implements MigrationInterface {
  name = 'CreatePortfolioSnapshots1736332000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'portfolio_snapshots',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'portfolio_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'portfolio_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'snapshot_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'granularity',
            type: 'enum',
            enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
            default: "'DAILY'",
            isNullable: false,
          },
          // Portfolio Summary Data
          {
            name: 'total_value',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'total_pl',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'total_return',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'cash_balance',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'invested_value',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          // Performance Metrics
          {
            name: 'daily_return',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'weekly_return',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'monthly_return',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'ytd_return',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          // Risk Metrics
          {
            name: 'volatility',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'max_drawdown',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          // Dynamic Asset Allocation
          {
            name: 'asset_allocation',
            type: 'jsonb',
            isNullable: true,
          },
          // Portfolio Statistics
          {
            name: 'asset_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'active_asset_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          // Metadata
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'portfolio_snapshots',
      new TableIndex({
        name: 'IDX_portfolio_snapshots_portfolio_date_granularity',
        columnNames: [
          'portfolio_id',
          'snapshot_date',
          'granularity',
        ]
      })
    );

    await queryRunner.createIndex(
      'portfolio_snapshots',
      new TableIndex({
        name: 'IDX_portfolio_snapshots_date_granularity',
        columnNames: [
          'snapshot_date',
          'granularity',
        ]
      })
    );

    await queryRunner.createIndex(
      'portfolio_snapshots',
      new TableIndex({
        name: 'IDX_portfolio_snapshots_portfolio_date',
        columnNames: [
          'portfolio_id',
          'snapshot_date',
        ]
      })
    );

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE portfolio_snapshots 
      ADD CONSTRAINT FK_portfolio_snapshots_portfolio_id 
      FOREIGN KEY (portfolio_id) 
      REFERENCES portfolios(portfolio_id) 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('portfolio_snapshots');
  }
}
