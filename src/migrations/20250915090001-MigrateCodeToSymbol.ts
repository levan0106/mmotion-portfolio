import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Migrate code field values to symbol field
 * This migration copies code values to symbol field for assets that have code but no symbol.
 * It also updates the migration status to track the migration process.
 */
export class MigrateCodeToSymbol20250915090001 implements MigrationInterface {
  name = 'MigrateCodeToSymbol20250915090001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Migrate assets with code field only to symbol field
    const migrateResult = await queryRunner.query(`
      UPDATE assets 
      SET 
        symbol = code,
        migration_status = 'migrated_from_code'
      WHERE code IS NOT NULL 
        AND symbol IS NULL
        AND migration_status = 'pending'
    `);

    console.log(`✅ Migrated ${migrateResult[1]} assets from code to symbol field`);

    // Step 2: Generate symbols for assets without either field
    const generateResult = await queryRunner.query(`
      UPDATE assets 
      SET 
        symbol = UPPER(SUBSTRING(REPLACE(name, ' ', ''), 1, 10)) || '_' || UPPER(SUBSTRING(created_by::text, LENGTH(created_by::text) - 3)),
        migration_status = 'generated_from_name'
      WHERE code IS NULL 
        AND symbol IS NULL
        AND migration_status = 'pending'
    `);

    console.log(`✅ Generated symbols for ${generateResult[1]} assets from name field`);

    // Step 3: Handle assets that already have both fields
    await queryRunner.query(`
      UPDATE assets 
      SET migration_status = 'already_has_symbol'
      WHERE code IS NOT NULL 
        AND symbol IS NOT NULL
        AND migration_status = 'pending'
    `);

    // Step 4: Handle assets that only have symbol field
    await queryRunner.query(`
      UPDATE assets 
      SET migration_status = 'symbol_only'
      WHERE code IS NULL 
        AND symbol IS NOT NULL
        AND migration_status = 'pending'
    `);

    // Log final migration status
    const statusCounts = await queryRunner.query(`
      SELECT migration_status, COUNT(*) as count
      FROM assets 
      GROUP BY migration_status
    `);

    console.log('📊 Migration status summary:');
    statusCounts.forEach((row: any) => {
      console.log(`  - ${row.migration_status}: ${row.count} assets`);
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Restore code field from symbol for migrated assets
    const rollbackResult = await queryRunner.query(`
      UPDATE assets 
      SET code = symbol
      WHERE migration_status = 'migrated_from_code'
        AND symbol IS NOT NULL
    `);

    console.log(`✅ Rolled back ${rollbackResult[1]} assets from symbol to code field`);

    // Clear symbol field for generated assets
    const clearResult = await queryRunner.query(`
      UPDATE assets 
      SET symbol = NULL
      WHERE migration_status = 'generated_from_name'
    `);

    console.log(`✅ Cleared symbol field for ${clearResult[1]} generated assets`);

    // Reset migration status
    await queryRunner.query(`
      UPDATE assets 
      SET migration_status = 'pending'
      WHERE migration_status IN ('migrated_from_code', 'generated_from_name', 'already_has_symbol', 'symbol_only')
    `);

    console.log('✅ Reset migration status for all assets');
  }
}
