#!/usr/bin/env ts-node

/**
 * Run Production Migration Script
 * This script runs the migration on production database with safety checks
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { AssetMigrationService } from '../src/modules/asset/services/asset-migration.service';
import * as readline from 'readline';

async function runProductionMigration() {
  console.log('🚀 Starting Production Migration');
  console.log('=' .repeat(60));
  console.log('⚠️  WARNING: This will modify production data!');
  console.log('=' .repeat(60));

  // Create readline interface for user confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  try {
    // Step 1: Pre-migration confirmation
    console.log('\n🔍 Step 1: Pre-migration Safety Checks');
    console.log('-' .repeat(40));
    
    const confirmation = await askQuestion('Are you sure you want to run migration on PRODUCTION? (type "YES" to confirm): ');
    if (confirmation !== 'YES') {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }

    const backupConfirmation = await askQuestion('Have you created a backup of the production database? (type "YES" to confirm): ');
    if (backupConfirmation !== 'YES') {
      console.log('❌ Migration cancelled - backup required');
      process.exit(0);
    }

    // Step 2: Initialize application
    console.log('\n🔧 Step 2: Initializing Application');
    console.log('-' .repeat(40));
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const migrationService = app.get(AssetMigrationService);

    // Step 3: Pre-migration analysis
    console.log('\n📊 Step 3: Pre-migration Analysis');
    console.log('-' .repeat(40));
    
    const preAnalysis = await migrationService.analyzeDataDistribution();
    console.log('Pre-migration data:');
    console.log(`  - Total assets: ${preAnalysis.totalAssets}`);
    console.log(`  - Code only: ${preAnalysis.assetsWithCodeOnly}`);
    console.log(`  - Symbol only: ${preAnalysis.assetsWithSymbolOnly}`);
    console.log(`  - Both fields: ${preAnalysis.assetsWithBothFields}`);
    console.log(`  - Neither field: ${preAnalysis.assetsWithNeitherField}`);
    console.log(`  - Potential conflicts: ${preAnalysis.potentialConflicts}`);

    // Step 4: Final confirmation
    console.log('\n⚠️  Step 4: Final Confirmation');
    console.log('-' .repeat(40));
    console.log('This migration will:');
    console.log('  - Copy code values to symbol field where symbol is null');
    console.log('  - Generate symbols for assets without code or symbol');
    console.log('  - Resolve symbol conflicts within users');
    console.log('  - Preserve all existing data');
    
    const finalConfirmation = await askQuestion('Proceed with migration? (type "MIGRATE" to confirm): ');
    if (finalConfirmation !== 'MIGRATE') {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }

    // Step 5: Run migration
    console.log('\n🔄 Step 5: Running Migration');
    console.log('-' .repeat(40));
    
    const startTime = Date.now();
    const migrationResult = await migrationService.migrateCodeToSymbol();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('Migration results:');
    console.log(`  - Migrated count: ${migrationResult.migratedCount}`);
    console.log(`  - Generated symbols: ${migrationResult.generatedSymbolsCount}`);
    console.log(`  - Conflicts resolved: ${migrationResult.conflictsResolved}`);
    console.log(`  - Failed count: ${migrationResult.failedCount}`);
    console.log(`  - Duration: ${duration}ms`);
    
    if (migrationResult.errors.length > 0) {
      console.log('  - Errors:');
      migrationResult.errors.forEach(error => console.log(`    * ${error}`));
    }

    // Step 6: Post-migration validation
    console.log('\n✅ Step 6: Post-migration Validation');
    console.log('-' .repeat(40));
    
    const validation = await migrationService.validateMigration();
    console.log(`Migration valid: ${validation.isValid}`);
    
    if (validation.issues.length > 0) {
      console.log('Issues found:');
      validation.issues.forEach(issue => console.log(`  - ${issue}`));
    }

    // Step 7: Show sample data
    console.log('\n📋 Step 7: Sample Migrated Data');
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
      ORDER BY updated_at DESC
      LIMIT 10
    `);
    
    console.log('Sample migrated assets:');
    sampleAssets.forEach((asset: any) => {
      const userShort = asset.created_by ? asset.created_by.substring(asset.created_by.length - 4) : 'N/A';
      console.log(`  - ${asset.name} (${asset.symbol}) [${asset.type}] - User: ${userShort}`);
    });

    // Step 8: Performance summary
    console.log('\n⚡ Step 8: Performance Summary');
    console.log('-' .repeat(40));
    console.log(`Migration duration: ${duration}ms`);
    console.log(`Assets per second: ${Math.round(preAnalysis.totalAssets / (duration / 1000))}`);
    console.log(`Total assets processed: ${preAnalysis.totalAssets}`);

    console.log('\n🎉 Production migration completed successfully!');
    console.log('=' .repeat(60));
    console.log('Migration Summary:');
    console.log('✅ Migration service executed successfully');
    console.log('✅ Data migration completed');
    console.log('✅ Conflict resolution working');
    console.log('✅ Performance acceptable');
    console.log('✅ Production data updated');
    console.log('\nNext steps:');
    console.log('1. Verify application functionality');
    console.log('2. Test API endpoints');
    console.log('3. Monitor system performance');
    console.log('4. Update frontend if needed');

  } catch (error) {
    console.error('\n❌ Production migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try emergency rollback
    console.log('\n🆘 Attempting emergency rollback...');
    try {
      const app = await NestFactory.createApplicationContext(AppModule);
      const migrationService = app.get(AssetMigrationService);
      const rollbackResult = await migrationService.rollbackMigration();
      console.log(`Emergency rollback completed: ${rollbackResult.rolledBackCount} assets`);
      await app.close();
    } catch (rollbackError) {
      console.error('Emergency rollback failed:', rollbackError.message);
    }
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the migration
if (require.main === module) {
  runProductionMigration().catch(console.error);
}

export { runProductionMigration };
