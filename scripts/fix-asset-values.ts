#!/usr/bin/env ts-node

/**
 * Fix Asset Values Script
 * This script fixes asset current_value to realistic prices based on trade history
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Asset } from '../src/modules/asset/entities/asset.entity';

async function fixAssetValues() {
  console.log('🔧 Fixing Asset Values to Realistic Prices');
  console.log('=' .repeat(50));

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Get all assets with their trade history
    console.log('\n📊 Analyzing asset trade history...');
    
    const assetsWithTrades = await dataSource.query(`
      SELECT 
        asset.id,
        asset.symbol,
        asset.name,
        asset.type,
        asset.current_value,
        AVG(trade.price) as avg_price,
        MIN(trade.price) as min_price,
        MAX(trade.price) as max_price,
        COUNT(trade.trade_id) as trade_count
      FROM assets asset
      LEFT JOIN trades trade ON asset.id = trade.asset_id
      WHERE asset.symbol IN ('VFF', 'VESAF', 'SSISCA', '9999', 'HPG', 'VCB')
      GROUP BY asset.id, asset.symbol, asset.name, asset.type, asset.current_value
      ORDER BY asset.symbol
    `);

    console.log('\n📋 Current asset values and trade history:');
    assetsWithTrades.forEach(asset => {
      console.log(`\n${asset.symbol} (${asset.name}):`);
      console.log(`  Current Value: ${Number(asset.current_value).toLocaleString()} VND`);
      console.log(`  Avg Price: ${Number(asset.avg_price || 0).toLocaleString()} VND`);
      console.log(`  Min Price: ${Number(asset.min_price || 0).toLocaleString()} VND`);
      console.log(`  Max Price: ${Number(asset.max_price || 0).toLocaleString()} VND`);
      console.log(`  Trade Count: ${asset.trade_count}`);
      
      // Calculate realistic price
      let realisticPrice = asset.avg_price || asset.current_value;
      if (asset.type === 'GOLD') {
        // Keep gold prices high as they are realistic
        realisticPrice = asset.current_value;
      } else if (asset.avg_price && asset.avg_price > 0) {
        // Use average price from trades
        realisticPrice = Math.round(asset.avg_price);
      } else {
        // Use current value if no trades
        realisticPrice = asset.current_value;
      }
      
      console.log(`  Realistic Price: ${Number(realisticPrice).toLocaleString()} VND`);
    });

    // Update assets with realistic prices
    console.log('\n🔄 Updating asset values...');
    
    for (const asset of assetsWithTrades) {
      let realisticPrice = asset.avg_price || asset.current_value;
      
      if (asset.type === 'GOLD') {
        // Keep gold prices as they are realistic
        realisticPrice = asset.current_value;
      } else if (asset.avg_price && asset.avg_price > 0) {
        // Use average price from trades
        realisticPrice = Math.round(asset.avg_price);
      } else {
        // Use current value if no trades
        realisticPrice = asset.current_value;
      }

      // Only update if price is significantly different
      const currentPrice = Number(asset.current_value);
      const newPrice = Number(realisticPrice);
      
      if (Math.abs(currentPrice - newPrice) > currentPrice * 0.1) { // 10% difference
        await dataSource.query(
          'UPDATE assets SET current_value = $1 WHERE id = $2',
          [newPrice, asset.id]
        );
        console.log(`  ✅ Updated ${asset.symbol}: ${currentPrice.toLocaleString()} → ${newPrice.toLocaleString()} VND`);
      } else {
        console.log(`  ⏭️  Skipped ${asset.symbol}: Price is already realistic (${currentPrice.toLocaleString()} VND)`);
      }
    }

    // Verify updated values
    console.log('\n📊 Updated asset values:');
    const updatedAssets = await dataSource.query(`
      SELECT symbol, name, type, current_value 
      FROM assets 
      WHERE symbol IN ('VFF', 'VESAF', 'SSISCA', '9999', 'HPG', 'VCB')
      ORDER BY symbol
    `);

    updatedAssets.forEach(asset => {
      console.log(`  ${asset.symbol}: ${Number(asset.current_value).toLocaleString()} VND (${asset.type})`);
    });

    console.log('\n🎉 Asset values fixed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart backend to clear cache');
    console.log('2. Test portfolio allocation API');
    console.log('3. Verify frontend displays correct values');

  } catch (error) {
    console.error('\n❌ Fixing asset values failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
if (require.main === module) {
  fixAssetValues().catch(console.error);
}

export { fixAssetValues };
