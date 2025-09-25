#!/usr/bin/env ts-node

/**
 * Verify Migration Status Script
 * This script checks the current migration status and verifies the 3 decimal places precision
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  numeric_precision: number;
  numeric_scale: number;
  is_nullable: string;
}

interface MigrationInfo {
  id: number;
  timestamp: number;
  name: string;
}

async function verifyMigrationStatus() {
  console.log('🔍 Verifying Migration Status');
  console.log('=' .repeat(60));

  try {
    // Initialize application
    console.log('\n🔧 Initializing Application...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    // Check migration status
    console.log('\n📊 Migration Status Check');
    console.log('-' .repeat(40));
    
    const pendingMigrations = await dataSource.showMigrations();
    console.log(`Pending migrations: ${pendingMigrations}`);

    if (pendingMigrations) {
      console.log('⚠️  There are pending migrations that need to be run');
    } else {
      console.log('✅ All migrations are up to date');
    }

    // Get executed migrations
    const executedMigrations = await dataSource.query(`
      SELECT id, timestamp, name 
      FROM migrations 
      ORDER BY timestamp DESC
    `) as MigrationInfo[];

    console.log('\n📋 Executed Migrations:');
    executedMigrations.forEach((migration, index) => {
      const date = new Date(migration.timestamp);
      console.log(`  ${index + 1}. ${migration.name} (${date.toISOString()})`);
    });

    // Verify NAV unit system tables
    console.log('\n🔍 Verifying NAV Unit System Tables');
    console.log('-' .repeat(40));

    // Check if fund_unit_transactions table exists
    const fundUnitTableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'fund_unit_transactions'
      )
    `);

    if (fundUnitTableExists[0].exists) {
      console.log('✅ fund_unit_transactions table exists');
      
      // Check table structure
      const fundUnitColumns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'fund_unit_transactions'
        ORDER BY ordinal_position
      `);

      console.log('   Table structure:');
      fundUnitColumns.forEach((col: any) => {
        console.log(`     - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ fund_unit_transactions table does not exist');
    }

    // Verify precision settings
    console.log('\n🔍 Verifying 3 Decimal Places Precision');
    console.log('-' .repeat(40));

    // Check investor_holdings precision
    const holdingPrecision = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'investor_holdings' 
      AND column_name IN ('total_units', 'avg_cost_per_unit', 'total_investment', 'current_value', 'unrealized_pnl', 'realized_pnl')
      ORDER BY ordinal_position
    `) as ColumnInfo[];

    console.log('Investor Holdings precision:');
    let precisionCorrect = true;
    holdingPrecision.forEach((col) => {
      const expectedScale = ['total_units', 'avg_cost_per_unit'].includes(col.column_name) ? 3 : 3;
      const isCorrect = col.numeric_scale === expectedScale;
      const status = isCorrect ? '✅' : '❌';
      console.log(`   ${status} ${col.column_name}: ${col.data_type}(${col.numeric_precision},${col.numeric_scale})`);
      if (!isCorrect) precisionCorrect = false;
    });

    // Check fund_unit_transactions precision
    const fundUnitPrecision = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'fund_unit_transactions' 
      AND column_name IN ('units', 'nav_per_unit', 'amount')
      ORDER BY ordinal_position
    `) as ColumnInfo[];

    console.log('\nFund Unit Transactions precision:');
    fundUnitPrecision.forEach((col) => {
      const expectedScale = 3;
      const isCorrect = col.numeric_scale === expectedScale;
      const status = isCorrect ? '✅' : '❌';
      console.log(`   ${status} ${col.column_name}: ${col.data_type}(${col.numeric_precision},${col.numeric_scale})`);
      if (!isCorrect) precisionCorrect = false;
    });

    // Check portfolios precision
    const portfolioPrecision = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'portfolios' 
      AND column_name IN ('total_outstanding_units', 'nav_per_unit')
      ORDER BY ordinal_position
    `) as ColumnInfo[];

    console.log('\nPortfolios precision:');
    portfolioPrecision.forEach((col) => {
      const expectedScale = 3;
      const isCorrect = col.numeric_scale === expectedScale;
      const status = isCorrect ? '✅' : '❌';
      console.log(`   ${status} ${col.column_name}: ${col.data_type}(${col.numeric_precision},${col.numeric_scale})`);
      if (!isCorrect) precisionCorrect = false;
    });

    // Check nav_snapshots precision
    const navSnapshotPrecision = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'nav_snapshots' 
      AND column_name IN ('total_outstanding_units', 'nav_per_unit')
      ORDER BY ordinal_position
    `) as ColumnInfo[];

    console.log('\nNAV Snapshots precision:');
    navSnapshotPrecision.forEach((col) => {
      const expectedScale = 3;
      const isCorrect = col.numeric_scale === expectedScale;
      const status = isCorrect ? '✅' : '❌';
      console.log(`   ${status} ${col.column_name}: ${col.data_type}(${col.numeric_precision},${col.numeric_scale})`);
      if (!isCorrect) precisionCorrect = false;
    });

    // Summary
    console.log('\n📊 Migration Status Summary');
    console.log('=' .repeat(60));
    
    if (pendingMigrations) {
      console.log('⚠️  PENDING MIGRATIONS: Run migrations before proceeding');
    } else {
      console.log('✅ MIGRATIONS: All migrations are up to date');
    }

    if (fundUnitTableExists[0].exists) {
      console.log('✅ NAV SYSTEM: Fund unit transactions table exists');
    } else {
      console.log('❌ NAV SYSTEM: Fund unit transactions table missing');
    }

    if (precisionCorrect) {
      console.log('✅ PRECISION: All fields use 3 decimal places');
    } else {
      console.log('❌ PRECISION: Some fields do not use 3 decimal places');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (pendingMigrations) {
      console.log('   1. Run: npm run migration:run:full');
    }
    if (!fundUnitTableExists[0].exists) {
      console.log('   2. Run: npm run migration:run:full');
    }
    if (!precisionCorrect) {
      console.log('   3. Run: npm run migration:run:full');
    }
    if (!pendingMigrations && fundUnitTableExists[0].exists && precisionCorrect) {
      console.log('   ✅ System is ready for production use');
    }

    await app.close();

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the verification
if (require.main === module) {
  verifyMigrationStatus().catch(console.error);
}

export { verifyMigrationStatus };
