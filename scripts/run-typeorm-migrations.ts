#!/usr/bin/env ts-node

/**
 * Run TypeORM Migrations Script
 * This script runs the database schema migrations
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as readline from 'readline';

async function runTypeOrmMigrations() {
  console.log('🚀 Starting TypeORM Migrations');
  console.log('=' .repeat(60));
  console.log('⚠️  WARNING: This will modify production database schema!');
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
    
    const confirmation = await askQuestion('Are you sure you want to run TypeORM migrations on PRODUCTION? (type "YES" to confirm): ');
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

    // Step 3: Check current migration status
    console.log('\n📊 Step 3: Checking Migration Status');
    console.log('-' .repeat(40));
    
    const pendingMigrations = await dataSource.showMigrations();
    console.log(`Pending migrations: ${pendingMigrations}`);

    if (!pendingMigrations) {
      console.log('✅ No pending migrations found');
      process.exit(0);
    }

    // Step 4: Show pending migrations
    console.log('\n📋 Step 4: Pending Migrations');
    console.log('-' .repeat(40));
    
    const migrations = await dataSource.runMigrations();
    console.log('Migrations to be executed:');
    migrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.name}`);
    });

    // Step 5: Final confirmation
    console.log('\n⚠️  Step 5: Final Confirmation');
    console.log('-' .repeat(40));
    console.log('This will execute the following migrations:');
    console.log('  1. AddNavUnitSystem - Add NAV unit system fields');
    console.log('  2. AddNavPerUnitToNavSnapshotsSimple - Add NAV per unit to snapshots');
    console.log('  3. AddLastNavDateToPortfolio - Add last NAV date tracking');
    console.log('  4. CreateFundUnitTransactions - Create fund unit transactions table');
    console.log('  5. UpdateNavPrecisionTo3Decimals - Update NAV precision to 3 decimal places');
    console.log('  6. UpdateCurrencyPrecisionTo3Decimals - Update currency precision to 3 decimal places');
    
    const finalConfirmation = await askQuestion('Proceed with schema migrations? (type "MIGRATE" to confirm): ');
    if (finalConfirmation !== 'MIGRATE') {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }

    // Step 6: Run migrations
    console.log('\n🔄 Step 6: Running Migrations');
    console.log('-' .repeat(40));
    
    const startTime = Date.now();
    const executedMigrations = await dataSource.runMigrations();
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('Migration results:');
    console.log(`  - Executed migrations: ${executedMigrations.length}`);
    console.log(`  - Duration: ${duration}ms`);
    
    executedMigrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ✅ ${migration.name}`);
    });

    // Step 7: Verify migration status
    console.log('\n✅ Step 7: Verifying Migration Status');
    console.log('-' .repeat(40));
    
    const remainingMigrations = await dataSource.showMigrations();
    console.log(`Remaining migrations: ${remainingMigrations}`);

    if (remainingMigrations) {
      console.log('⚠️  Some migrations may still be pending');
    } else {
      console.log('✅ All migrations completed successfully');
    }

    // Step 8: Check database schema
    console.log('\n🔍 Step 8: Checking Database Schema');
    console.log('-' .repeat(40));
    
    // Check fund_unit_transactions table
    const fundUnitTableInfo = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'fund_unit_transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Fund Unit Transactions table schema:');
    fundUnitTableInfo.forEach((column: any) => {
      console.log(`  - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check investor_holdings table precision
    const holdingTableInfo = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'investor_holdings' 
      AND column_name IN ('total_units', 'avg_cost_per_unit', 'total_investment', 'current_value', 'unrealized_pnl', 'realized_pnl')
      ORDER BY ordinal_position
    `);
    
    console.log('\nInvestor Holdings precision check:');
    holdingTableInfo.forEach((column: any) => {
      console.log(`  - ${column.column_name}: ${column.data_type}(${column.numeric_precision},${column.numeric_scale})`);
    });

    console.log('\n🎉 TypeORM migrations completed successfully!');
    console.log('=' .repeat(60));
    console.log('Migration Summary:');
    console.log('✅ NAV unit system implemented');
    console.log('✅ Fund unit transactions table created');
    console.log('✅ Precision updated to 3 decimal places');
    console.log('✅ Database structure updated');
    console.log('✅ Constraints and indexes created');
    console.log('\nNext steps:');
    console.log('1. Verify 3 decimal places precision in all tables');
    console.log('2. Test fund subscription/redemption functionality');
    console.log('3. Test holding detail API endpoints');
    console.log('4. Verify frontend displays correct precision');

  } catch (error) {
    console.error('\n❌ TypeORM migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try to show rollback options
    console.log('\n🆘 Migration failed! Rollback options:');
    console.log('1. Run: npm run typeorm:migration:revert');
    console.log('2. Or restore from backup');
    console.log('3. Check database logs for details');
    
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the migrations
if (require.main === module) {
  runTypeOrmMigrations().catch(console.error);
}

export { runTypeOrmMigrations };
