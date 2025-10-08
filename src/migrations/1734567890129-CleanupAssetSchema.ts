import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Cleanup asset schema after migration
 * This migration removes the code column, old constraints, and adds new user-scoped constraints.
 * It also removes the migration tracking column as it's no longer needed.
 */
export class CleanupAssetSchema1734567890129 implements MigrationInterface {
  name = 'CleanupAssetSchema1734567890129';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Ensure all assets have symbol field (validation)
    const assetsWithoutSymbol = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM assets 
      WHERE symbol IS NULL
    `);

    if (assetsWithoutSymbol[0].count > 0) {
      throw new Error(`Cannot proceed: ${assetsWithoutSymbol[0].count} assets still missing symbol field`);
    }

    console.log('✅ All assets have symbol field - proceeding with cleanup');

    // Step 2: Remove old indexes and constraints
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_ASSET_CODE
    `);
    console.log('✅ Removed IDX_ASSET_CODE index');

    await queryRunner.query(`
      DROP INDEX IF EXISTS UQ_ASSET_NAME
    `);
    console.log('✅ Removed UQ_ASSET_NAME unique constraint');

    // Step 3: Add new user-scoped constraints
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_ASSET_USER_SYMBOL ON assets (created_by, symbol)
    `);
    console.log('✅ Created UQ_ASSET_USER_SYMBOL unique constraint');

    await queryRunner.query(`
      CREATE INDEX IDX_ASSET_USER_NAME ON assets (created_by, name)
    `);
    console.log('✅ Created IDX_ASSET_USER_NAME index');

    // Step 4: Make symbol field NOT NULL
    await queryRunner.query(`
      ALTER TABLE assets 
      ALTER COLUMN symbol SET NOT NULL
    `);
    console.log('✅ Made symbol field NOT NULL');

    // Step 5: Remove code column
    await queryRunner.query(`
      ALTER TABLE assets 
      DROP COLUMN code
    `);
    console.log('✅ Removed code column');

    // Step 6: Remove migration tracking column
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_ASSET_MIGRATION_STATUS
    `);
    console.log('✅ Removed migration status index');

    await queryRunner.query(`
      ALTER TABLE assets 
      DROP COLUMN migration_status
    `);
    console.log('✅ Removed migration status column');

    // Step 7: Update remaining indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_ASSET_SYMBOL
    `);
    console.log('✅ Removed old IDX_ASSET_SYMBOL index');

    await queryRunner.query(`
      CREATE INDEX IDX_ASSET_SYMBOL ON assets (symbol)
    `);
    console.log('✅ Created new IDX_ASSET_SYMBOL index');

    // Final validation
    const finalValidation = await queryRunner.query(`
      SELECT 
        COUNT(*) as total_assets,
        COUNT(DISTINCT created_by) as unique_users,
        COUNT(DISTINCT symbol) as unique_symbols,
        COUNT(DISTINCT CONCAT(created_by, ':', symbol)) as unique_user_symbols
      FROM assets
    `);

    const stats = finalValidation[0];
    console.log('📊 Final schema validation:');
    console.log(`  - Total assets: ${stats.total_assets}`);
    console.log(`  - Unique users: ${stats.unique_users}`);
    console.log(`  - Unique symbols: ${stats.unique_symbols}`);
    console.log(`  - Unique user-symbol combinations: ${stats.unique_user_symbols}`);

    if (stats.total_assets !== stats.unique_user_symbols) {
      throw new Error('Schema validation failed: Duplicate user-symbol combinations found');
    }

    console.log('✅ Schema cleanup completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add code column back
    await queryRunner.query(`
      ALTER TABLE assets 
      ADD COLUMN code VARCHAR(50)
    `);
    console.log('✅ Added code column back');

    // Step 2: Restore code values from symbol (this is a best-effort rollback)
    await queryRunner.query(`
      UPDATE assets 
      SET code = symbol
    `);
    console.log('✅ Restored code values from symbol');

    // Step 3: Make symbol field nullable
    await queryRunner.query(`
      ALTER TABLE assets 
      ALTER COLUMN symbol DROP NOT NULL
    `);
    console.log('✅ Made symbol field nullable');

    // Step 4: Remove new constraints
    await queryRunner.query(`
      DROP INDEX IF EXISTS UQ_ASSET_USER_SYMBOL
    `);
    console.log('✅ Removed UQ_ASSET_USER_SYMBOL constraint');

    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_ASSET_USER_NAME
    `);
    console.log('✅ Removed IDX_ASSET_USER_NAME index');

    // Step 5: Restore old constraints
    await queryRunner.query(`
      CREATE INDEX IDX_ASSET_CODE ON assets (code)
    `);
    console.log('✅ Restored IDX_ASSET_CODE index');

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_ASSET_NAME ON assets (name)
    `);
    console.log('✅ Restored UQ_ASSET_NAME unique constraint');

    // Step 6: Restore old symbol index
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_ASSET_SYMBOL
    `);
    console.log('✅ Removed new IDX_ASSET_SYMBOL index');

    await queryRunner.query(`
      CREATE INDEX IDX_ASSET_SYMBOL ON assets (symbol)
    `);
    console.log('✅ Restored old IDX_ASSET_SYMBOL index');

    console.log('✅ Schema rollback completed');
  }
}
