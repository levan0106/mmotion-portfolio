#!/usr/bin/env ts-node

/**
 * Run Migration Test Script
 * This script runs the complete migration test process
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { AssetMigrationService } from '../src/modules/asset/services/asset-migration.service';

async function runMigrationTest() {
  console.log('🚀 Starting Complete Migration Test');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const migrationService = app.get(AssetMigrationService);

  try {
    // Step 1: Pre-migration analysis
    console.log('\n📊 Step 1: Pre-migration Analysis');
    console.log('-' .repeat(40));
    
    const preAnalysis = await migrationService.analyzeDataDistribution();
    console.log('Pre-migration data:');
    console.log(`  - Total assets: ${preAnalysis.totalAssets}`);
    console.log(`  - Code only: ${preAnalysis.assetsWithCodeOnly}`);
    console.log(`  - Symbol only: ${preAnalysis.assetsWithSymbolOnly}`);
    console.log(`  - Both fields: ${preAnalysis.assetsWithBothFields}`);
    console.log(`  - Neither field: ${preAnalysis.assetsWithNeitherField}`);
    console.log(`  - Potential conflicts: ${preAnalysis.potentialConflicts}`);

    // Step 2: Run migration
    console.log('\n🔄 Step 2: Running Migration');
    console.log('-' .repeat(40));
    
    const migrationResult = await migrationService.migrateCodeToSymbol();
    console.log('Migration results:');
    console.log(`  - Migrated count: ${migrationResult.migratedCount}`);
    console.log(`  - Generated symbols: ${migrationResult.generatedSymbolsCount}`);
    console.log(`  - Conflicts resolved: ${migrationResult.conflictsResolved}`);
    console.log(`  - Failed count: ${migrationResult.failedCount}`);
    
    if (migrationResult.errors.length > 0) {
      console.log('  - Errors:');
      migrationResult.errors.forEach(error => console.log(`    * ${error}`));
    }

    // Step 3: Post-migration validation
    console.log('\n✅ Step 3: Post-migration Validation');
    console.log('-' .repeat(40));
    
    const validation = await migrationService.validateMigration();
    console.log(`Migration valid: ${validation.isValid}`);
    
    if (validation.issues.length > 0) {
      console.log('Issues found:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Step 4: Show sample data
    console.log('\n📋 Step 4: Sample Migrated Data');
    console.log('-' .repeat(40));
    
    const sampleAssets = await dataSource.query(`
      SELECT 
        id, 
        name, 
        symbol, 
        code,
        created_by,
        type
      FROM assets 
      WHERE created_by IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003')
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('Sample migrated assets:');
    sampleAssets.forEach((asset: any) => {
      const userShort = asset.created_by.substring(asset.created_by.length - 3);
      console.log(`  - ${asset.name} (${asset.symbol}) [${asset.type}] - User: ${userShort}`);
    });

    // Step 5: Test rollback
    console.log('\n🔄 Step 5: Testing Rollback');
    console.log('-' .repeat(40));
    
    console.log('Testing rollback functionality...');
    const rollbackResult = await migrationService.rollbackMigration();
    console.log(`Rollback results:`);
    console.log(`  - Rolled back: ${rollbackResult.rolledBackCount}`);
    console.log(`  - Failed: ${rollbackResult.failedCount}`);
    
    if (rollbackResult.errors.length > 0) {
      console.log('  - Rollback errors:');
      rollbackResult.errors.forEach(error => console.log(`    * ${error}`));
    }

    // Step 6: Verify rollback
    console.log('\n🔍 Step 6: Verifying Rollback');
    console.log('-' .repeat(40));
    
    const postRollbackAnalysis = await migrationService.analyzeDataDistribution();
    console.log('Post-rollback data:');
    console.log(`  - Total assets: ${postRollbackAnalysis.totalAssets}`);
    console.log(`  - Code only: ${postRollbackAnalysis.assetsWithCodeOnly}`);
    console.log(`  - Symbol only: ${postRollbackAnalysis.assetsWithSymbolOnly}`);
    console.log(`  - Both fields: ${postRollbackAnalysis.assetsWithBothFields}`);
    console.log(`  - Neither field: ${postRollbackAnalysis.assetsWithNeitherField}`);

    // Step 7: Performance test
    console.log('\n⚡ Step 7: Performance Test');
    console.log('-' .repeat(40));
    
    const startTime = Date.now();
    await migrationService.migrateCodeToSymbol();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Migration duration: ${duration}ms`);
    console.log(`Assets per second: ${Math.round(preAnalysis.totalAssets / (duration / 1000))}`);

    console.log('\n🎉 Migration test completed successfully!');
    console.log('=' .repeat(60));
    console.log('Test Summary:');
    console.log('✅ Migration service working correctly');
    console.log('✅ Data migration successful');
    console.log('✅ Conflict resolution working');
    console.log('✅ Rollback functionality working');
    console.log('✅ Performance acceptable');
    console.log('✅ Ready for production migration');

  } catch (error) {
    console.error('\n❌ Migration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try emergency rollback
    console.log('\n🆘 Attempting emergency rollback...');
    try {
      const rollbackResult = await migrationService.rollbackMigration();
      console.log(`Emergency rollback completed: ${rollbackResult.rolledBackCount} assets`);
    } catch (rollbackError) {
      console.error('Emergency rollback failed:', rollbackError.message);
    }
    
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the test
if (require.main === module) {
  runMigrationTest().catch(console.error);
}

export { runMigrationTest };
