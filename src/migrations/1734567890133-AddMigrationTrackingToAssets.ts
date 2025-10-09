import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add migration tracking column to assets table
 * This migration adds a temporary column to track migration status
 * for the code to symbol field migration process.
 */
export class AddMigrationTrackingToAssets1734567890133 implements MigrationInterface {
  name = 'AddMigrationTrackingToAssets1734567890133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add migration status tracking column
    await queryRunner.query(`
      ALTER TABLE assets 
      ADD COLUMN migration_status VARCHAR(20) DEFAULT 'pending'
    `);

    // Add index for migration status queries
    await queryRunner.query(`
      CREATE INDEX IDX_ASSET_MIGRATION_STATUS ON assets (migration_status)
    `);

    // Log migration start
    console.log('✅ Added migration tracking column to assets table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove migration status index
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_ASSET_MIGRATION_STATUS
    `);

    // Remove migration status column
    await queryRunner.query(`
      ALTER TABLE assets 
      DROP COLUMN migration_status
    `);

    console.log('✅ Removed migration tracking column from assets table');
  }
}
