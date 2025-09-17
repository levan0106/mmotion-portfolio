import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Resolve duplicate symbol conflicts per user
 * This migration handles cases where multiple assets have the same symbol
 * within the same user account by adding numeric suffixes.
 */
export class ResolveSymbolConflicts20250915090002 implements MigrationInterface {
  name = 'ResolveSymbolConflicts20250915090002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Find and resolve duplicate symbols per user
    const conflicts = await queryRunner.query(`
      SELECT 
        created_by as user_id,
        symbol,
        COUNT(*) as count
      FROM assets 
      WHERE symbol IS NOT NULL
        AND migration_status IN ('migrated_from_code', 'generated_from_name', 'symbol_only')
      GROUP BY created_by, symbol
      HAVING COUNT(*) > 1
      ORDER BY created_by, symbol
    `);

    console.log(`🔍 Found ${conflicts.length} symbol conflicts to resolve`);

    let totalResolved = 0;

    for (const conflict of conflicts) {
      const { user_id, symbol } = conflict;
      
      // Get all assets with this conflicting symbol for this user, ordered by creation date
      const conflictingAssets = await queryRunner.query(`
        SELECT id, symbol, created_at
        FROM assets 
        WHERE created_by = $1 
          AND symbol = $2
          AND migration_status IN ('migrated_from_code', 'generated_from_name', 'symbol_only')
        ORDER BY created_at ASC
      `, [user_id, symbol]);

      // Keep the first asset with original symbol, add suffix to others
      for (let i = 1; i < conflictingAssets.length; i++) {
        const asset = conflictingAssets[i];
        const newSymbol = `${symbol}_${i}`;
        
        await queryRunner.query(`
          UPDATE assets 
          SET 
            symbol = $1,
            migration_status = 'conflict_resolved'
          WHERE id = $2
        `, [newSymbol, asset.id]);
        
        totalResolved++;
        console.log(`  ✅ Resolved conflict for asset ${asset.id}: ${symbol} -> ${newSymbol}`);
      }
    }

    console.log(`✅ Resolved ${totalResolved} symbol conflicts`);

    // Log final conflict status
    const remainingConflicts = await queryRunner.query(`
      SELECT 
        created_by as user_id,
        symbol,
        COUNT(*) as count
      FROM assets 
      WHERE symbol IS NOT NULL
        AND migration_status IN ('migrated_from_code', 'generated_from_name', 'symbol_only', 'conflict_resolved')
      GROUP BY created_by, symbol
      HAVING COUNT(*) > 1
    `);

    if (remainingConflicts.length > 0) {
      console.log(`⚠️  Warning: ${remainingConflicts.length} conflicts still remain`);
      remainingConflicts.forEach((conflict: any) => {
        console.log(`  - User ${conflict.user_id}, Symbol ${conflict.symbol}: ${conflict.count} assets`);
      });
    } else {
      console.log('✅ All symbol conflicts resolved successfully');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Restore original symbols for conflict-resolved assets
    const rollbackResult = await queryRunner.query(`
      UPDATE assets 
      SET 
        symbol = REGEXP_REPLACE(symbol, '_\\d+$', ''),
        migration_status = CASE 
          WHEN migration_status = 'conflict_resolved' THEN 'migrated_from_code'
          ELSE migration_status
        END
      WHERE migration_status = 'conflict_resolved'
        AND symbol ~ '_\\d+$'
    `);

    console.log(`✅ Rolled back ${rollbackResult[1]} conflict resolutions`);

    // Reset migration status for conflict-resolved assets
    await queryRunner.query(`
      UPDATE assets 
      SET migration_status = 'migrated_from_code'
      WHERE migration_status = 'conflict_resolved'
    `);

    console.log('✅ Reset migration status for conflict-resolved assets');
  }
}
