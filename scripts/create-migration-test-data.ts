#!/usr/bin/env ts-node

/**
 * Create Migration Test Data Script
 * This script creates realistic test data for migration testing
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Asset } from '../src/modules/asset/entities/asset.entity';
import { AssetType } from '../src/modules/asset/enums/asset-type.enum';

async function createTestData() {
  console.log('🚀 Creating Migration Test Data');
  console.log('=' .repeat(50));

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Clear existing test data
    console.log('\n🧹 Clearing existing test data...');
    await dataSource.query('DELETE FROM assets WHERE created_by IN (\'550e8400-e29b-41d4-a716-446655440001\', \'550e8400-e29b-41d4-a716-446655440002\', \'550e8400-e29b-41d4-a716-446655440003\')');
    console.log('✅ Existing test data cleared');

    // Create test users (using real UUIDs)
    const testUsers = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002', 
      '550e8400-e29b-41d4-a716-446655440003'
    ];

    // Test data scenarios
    const testAssets = [
      // Scenario 1: Assets with code field only
      {
        name: 'Hoa Phat Group',
        code: 'HPG',
        symbol: null,
        type: AssetType.STOCK,
        description: 'Leading steel manufacturer in Vietnam',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Vietcombank',
        code: 'VCB',
        symbol: null,
        type: AssetType.STOCK,
        description: 'Vietnam Commercial Bank',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'FPT Corporation',
        code: 'FPT',
        symbol: null,
        type: AssetType.STOCK,
        description: 'Technology and telecommunications company',
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        updatedBy: '550e8400-e29b-41d4-a716-446655440002'
      },

      // Scenario 2: Assets with symbol field only
      {
        name: 'VinGroup',
        code: null,
        symbol: 'VIC',
        type: AssetType.STOCK,
        description: 'Conglomerate with real estate and retail',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Masan Group',
        code: null,
        symbol: 'MSN',
        type: AssetType.STOCK,
        description: 'Consumer goods and retail company',
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        updatedBy: '550e8400-e29b-41d4-a716-446655440002'
      },

      // Scenario 3: Assets with both code and symbol fields
      {
        name: 'PetroVietnam Gas',
        code: 'GAS',
        symbol: 'GAS',
        type: AssetType.STOCK,
        description: 'Petroleum and gas company',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Vietnam Dairy Products',
        code: 'VNM',
        symbol: 'VNM',
        type: AssetType.STOCK,
        description: 'Dairy products manufacturer',
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        updatedBy: '550e8400-e29b-41d4-a716-446655440002'
      },

      // Scenario 4: Assets with neither field (need symbol generation)
      {
        name: 'Gold Investment',
        code: null,
        symbol: null,
        type: AssetType.GOLD,
        description: 'Physical gold investment',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Savings Account',
        code: null,
        symbol: null,
        type: AssetType.DEPOSIT,
        description: 'Bank savings account',
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        updatedBy: '550e8400-e29b-41d4-a716-446655440002'
      },
      {
        name: 'Cash Holdings',
        code: null,
        symbol: null,
        type: AssetType.CASH,
        description: 'Cash in hand',
        createdBy: '550e8400-e29b-41d4-a716-446655440003',
        updatedBy: '550e8400-e29b-41d4-a716-446655440003'
      },

      // Scenario 5: Duplicate names across users (should be allowed)
      {
        name: 'Apple Inc',
        code: 'AAPL',
        symbol: null,
        type: AssetType.STOCK,
        description: 'Technology company - User 1',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Apple Inc',
        code: 'AAPL',
        symbol: null,
        type: AssetType.STOCK,
        description: 'Technology company - User 2',
        createdBy: '550e8400-e29b-41d4-a716-446655440002',
        updatedBy: '550e8400-e29b-41d4-a716-446655440002'
      },

      // Scenario 6: Potential symbol conflicts (same symbol, same user)
      {
        name: 'Microsoft Corporation',
        code: 'MSFT',
        symbol: null,
        type: AssetType.STOCK,
        description: 'Technology company - First',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },
      {
        name: 'Microsoft Corp',
        code: 'MSFT',
        symbol: null,
        type: AssetType.STOCK,
        description: 'Technology company - Second',
        createdBy: '550e8400-e29b-41d4-a716-446655440001',
        updatedBy: '550e8400-e29b-41d4-a716-446655440001'
      },

      // Scenario 7: Long names that need symbol generation
      {
        name: 'The Bank for Investment and Development of Vietnam',
        code: null,
        symbol: null,
        type: AssetType.STOCK,
        description: 'State-owned commercial bank',
        createdBy: '550e8400-e29b-41d4-a716-446655440003',
        updatedBy: '550e8400-e29b-41d4-a716-446655440003'
      },
      {
        name: 'Saigon Securities Incorporation',
        code: null,
        symbol: null,
        type: AssetType.STOCK,
        description: 'Securities brokerage and investment banking',
        createdBy: '550e8400-e29b-41d4-a716-446655440003',
        updatedBy: '550e8400-e29b-41d4-a716-446655440003'
      }
    ];

    // Insert test data
    console.log('\n📝 Inserting test data...');
    const assetRepository = dataSource.getRepository(Asset);
    
    for (const assetData of testAssets) {
      const asset = assetRepository.create(assetData);
      await assetRepository.save(asset);
      console.log(`  ✅ Created: ${assetData.name} (${assetData.code || 'no-code'}, ${assetData.symbol || 'no-symbol'})`);
    }

    // Verify test data
    console.log('\n📊 Test data summary:');
    const summary = await dataSource.query(`
      SELECT 
        COUNT(*) as total_assets,
        COUNT(CASE WHEN code IS NOT NULL AND symbol IS NULL THEN 1 END) as code_only,
        COUNT(CASE WHEN code IS NULL AND symbol IS NOT NULL THEN 1 END) as symbol_only,
        COUNT(CASE WHEN code IS NOT NULL AND symbol IS NOT NULL THEN 1 END) as both_fields,
        COUNT(CASE WHEN code IS NULL AND symbol IS NULL THEN 1 END) as neither_field,
        COUNT(DISTINCT created_by) as unique_users
      FROM assets 
      WHERE created_by IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003')
    `);

    const stats = summary[0];
    console.log(`  - Total test assets: ${stats.total_assets}`);
    console.log(`  - Code only: ${stats.code_only}`);
    console.log(`  - Symbol only: ${stats.symbol_only}`);
    console.log(`  - Both fields: ${stats.both_fields}`);
    console.log(`  - Neither field: ${stats.neither_field}`);
    console.log(`  - Unique users: ${stats.unique_users}`);

    // Check for potential conflicts
    const conflicts = await dataSource.query(`
      SELECT 
        created_by,
        symbol,
        COUNT(*) as count
      FROM assets 
      WHERE created_by IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003')
        AND symbol IS NOT NULL
      GROUP BY created_by, symbol
      HAVING COUNT(*) > 1
    `);

    if (conflicts.length > 0) {
      console.log(`\n⚠️  Potential conflicts found: ${conflicts.length}`);
      conflicts.forEach((conflict: any) => {
        console.log(`  - User ${conflict.created_by}, Symbol ${conflict.symbol}: ${conflict.count} assets`);
      });
    } else {
      console.log('\n✅ No symbol conflicts found');
    }

    console.log('\n🎉 Test data creation completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run migration test: npm run test:migration');
    console.log('2. Verify migration results');
    console.log('3. Test rollback functionality');

  } catch (error) {
    console.error('\n❌ Test data creation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
if (require.main === module) {
  createTestData().catch(console.error);
}

export { createTestData };
