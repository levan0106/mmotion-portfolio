import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeAllocationTimelinePerformance1734567890123 implements MigrationInterface {
  name = 'OptimizeAllocationTimelinePerformance1734567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add composite index for analytics queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_asset_allocation_snapshots_analytics" 
      ON "asset_allocation_snapshots" ("portfolio_id", "snapshot_date", "granularity", "is_active") 
      WHERE "is_active" = true
    `);

    // Add index for asset type queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_asset_allocation_snapshots_asset_type" 
      ON "asset_allocation_snapshots" ("portfolio_id", "asset_type", "snapshot_date") 
      WHERE "is_active" = true
    `);

    // Add index for date range queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_asset_allocation_snapshots_date_range" 
      ON "asset_allocation_snapshots" ("portfolio_id", "snapshot_date") 
      WHERE "is_active" = true AND "granularity" = 'DAILY'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_asset_allocation_snapshots_analytics"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_asset_allocation_snapshots_asset_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_asset_allocation_snapshots_date_range"`);
  }
}
