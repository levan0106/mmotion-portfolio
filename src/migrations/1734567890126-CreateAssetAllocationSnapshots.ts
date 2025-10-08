import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateAssetAllocationSnapshots1734567890126 implements MigrationInterface {
  name = 'CreateAssetAllocationSnapshots1734567890126';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for snapshot granularity
    await queryRunner.query(`
      CREATE TYPE "snapshot_granularity_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY')
    `);

    // Create asset_allocation_snapshots table
    await queryRunner.createTable(
      new Table({
        name: 'asset_allocation_snapshots',
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
            name: 'asset_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'asset_symbol',
            type: 'varchar',
            length: '50',
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
          // Asset Position Data
          {
            name: 'quantity',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'current_price',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'current_value',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'cost_basis',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'avg_cost',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          // P&L Calculations
          {
            name: 'realized_pl',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          {
            name: 'unrealized_pl',
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
          // Allocation Data
          {
            name: 'allocation_percentage',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'portfolio_total_value',
            type: 'decimal',
            precision: 20,
            scale: 8,
            default: 0,
            isNullable: false,
          },
          // Performance Metrics
          {
            name: 'return_percentage',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'daily_return',
            type: 'decimal',
            precision: 8,
            scale: 4,
            default: 0,
            isNullable: false,
          },
          {
            name: 'cumulative_return',
            type: 'decimal',
            precision: 8,
            scale: 4,
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

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "asset_allocation_snapshots" 
      ADD CONSTRAINT "FK_asset_allocation_snapshots_portfolio_id" 
      FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("portfolio_id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "asset_allocation_snapshots" 
      ADD CONSTRAINT "FK_asset_allocation_snapshots_asset_id" 
      FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE
    `);

    // Create performance indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_asset_allocation_snapshots_portfolio_date_granularity" 
      ON "asset_allocation_snapshots" ("portfolio_id", "snapshot_date", "granularity")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_asset_allocation_snapshots_portfolio_asset_date" 
      ON "asset_allocation_snapshots" ("portfolio_id", "asset_id", "snapshot_date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_asset_allocation_snapshots_date_granularity" 
      ON "asset_allocation_snapshots" ("snapshot_date", "granularity")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_asset_allocation_snapshots_asset_symbol_date" 
      ON "asset_allocation_snapshots" ("asset_symbol", "snapshot_date")
    `);

    // Create unique constraint to prevent duplicate snapshots
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_asset_allocation_snapshots_unique" 
      ON "asset_allocation_snapshots" ("portfolio_id", "asset_id", "snapshot_date", "granularity")
    `);

    // Create partial index for active snapshots only
    await queryRunner.query(`
      CREATE INDEX "IDX_asset_allocation_snapshots_active" 
      ON "asset_allocation_snapshots" ("portfolio_id", "snapshot_date", "granularity") 
      WHERE "is_active" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_asset_allocation_snapshots_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_asset_allocation_snapshots_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_asset_allocation_snapshots_asset_symbol_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_asset_allocation_snapshots_date_granularity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_asset_allocation_snapshots_portfolio_asset_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_asset_allocation_snapshots_portfolio_date_granularity"`);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "asset_allocation_snapshots" 
      DROP CONSTRAINT "FK_asset_allocation_snapshots_asset_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "asset_allocation_snapshots" 
      DROP CONSTRAINT "FK_asset_allocation_snapshots_portfolio_id"
    `);

    // Drop table
    await queryRunner.dropTable('asset_allocation_snapshots');

    // Drop enum type
    await queryRunner.query(`DROP TYPE "snapshot_granularity_enum"`);
  }
}
