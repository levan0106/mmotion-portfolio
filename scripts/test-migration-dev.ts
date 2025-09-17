#!/usr/bin/env ts-node

/**
 * Test Migration Script for Development
 * This script tests the asset migration process on development database
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { AssetMigrationService } from '../src/modules/asset/services/asset-migration.service';

async function testMigration() {
  console.log('🚀 Starting Asset Migration Test on Development Database');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const migrationService = app.get(AssetMigrationService);

  try {
    // Step 1: Analyze current data
    console.log('\n📊 Step 1: Analyzing current data distribution...');
    const analysis = await migrationService.analyzeDataDistribution();
    console.log('Current data analysis:');
    console.log(`  - Total assets: ${analysis.totalAssets}`);
    console.log(`  - Assets with code only: ${analysis.assetsWithCodeOnly}`);
    console.log(`  - Assets with symbol only: ${analysis.assetsWithSymbolOnly}`);
    console.log(`  - Assets with both fields: ${analysis.assetsWithBothFields}`);
    console.log(`  - Assets with neither field: ${analysis.assetsWithNeitherField}`);
    console.log(`  - Assets needing symbol generation: ${analysis.assetsNeedingSymbolGeneration}`);
    console.log(`  - Potential conflicts: ${analysis.potentialConflicts}`);

    // Step 2: Run migration
    console.log('\n🔄 Step 2: Running migration...');
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

    // Step 3: Validate migration
    console.log('\n✅ Step 3: Validating migration...');
    const validation = await migrationService.validateMigration();
    console.log(`Migration valid: ${validation.isValid}`);
    
    if (validation.issues.length > 0) {
      console.log('Issues found:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Step 4: Show sample data
    console.log('\n📋 Step 4: Sample migrated data...');
    const sampleAssets = await dataSource.query(`
      SELECT id, name, symbol, code, created_by
      FROM assets 
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('Sample assets:');
    sampleAssets.forEach((asset: any) => {
      console.log(`  - ${asset.name} (${asset.symbol}) - User: ${asset.created_by.substring(0, 8)}...`);
    });

    console.log('\n✅ Migration test completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try rollback
    console.log('\n🔄 Attempting rollback...');
    try {
      const rollbackResult = await migrationService.rollbackMigration();
      console.log(`Rollback completed: ${rollbackResult.rolledBackCount} assets rolled back`);
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }
    
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the test
if (require.main === module) {
  testMigration().catch(console.error);
}

export { testMigration };
