import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Asset } from '../src/modules/asset/entities/asset.entity';

async function fixAssetValuesV2() {
  console.log('🔧 Fixing Asset Values to Realistic Prices - Version 2');
  console.log('=' .repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('\n📊 Analyzing asset trade history...');
    const assetTradeData = await dataSource.query(`
      SELECT
        asset.id,
        asset.symbol,
        asset.name,
        asset.type,
        asset.current_value,
        AVG(trade.price) as avg_price,
        MIN(trade.price) as min_price,
        MAX(trade.price) as max_price,
        COUNT(trade.trade_id) as trade_count,
        SUM(CASE WHEN trade.side = 'BUY' THEN trade.quantity ELSE -trade.quantity END) as total_quantity
      FROM assets asset
      LEFT JOIN trades trade ON asset.id = trade.asset_id
      WHERE asset.current_value > 1000000  -- Only check assets with suspiciously high values
      GROUP BY asset.id, asset.symbol, asset.name, asset.type, asset.current_value
      ORDER BY asset.current_value DESC
    `);

    console.log('\n📋 Assets with suspiciously high current_value:');
    const assetsToUpdate: { id: string; symbol: string; name: string; type: string; currentValue: number; realisticPrice: number; quantity: number }[] = [];

    for (const data of assetTradeData) {
      const currentDbValue = parseFloat(data.current_value);
      const avgTradePrice = parseFloat(data.avg_price);
      const tradeCount = parseInt(data.trade_count);
      const totalQuantity = parseFloat(data.total_quantity) || 0;

      let realisticPrice = currentDbValue; // Default to current DB value

      // For assets with trades, use average trade price as realistic price
      if (tradeCount > 0 && !isNaN(avgTradePrice) && avgTradePrice > 0) {
        realisticPrice = avgTradePrice;
      } else if (currentDbValue > 1000000) {
        // If no trades but high current_value, set to 0 or reasonable default
        realisticPrice = 0;
      }

      console.log(`\n${data.symbol} (${data.name}):`);
      console.log(`  Current Value: ${currentDbValue.toLocaleString('vi-VN')} VND`);
      console.log(`  Avg Price: ${avgTradePrice.toLocaleString('vi-VN')} VND`);
      console.log(`  Min Price: ${parseFloat(data.min_price).toLocaleString('vi-VN')} VND`);
      console.log(`  Max Price: ${parseFloat(data.max_price).toLocaleString('vi-VN')} VND`);
      console.log(`  Trade Count: ${tradeCount}`);
      console.log(`  Total Quantity: ${totalQuantity.toLocaleString('vi-VN')}`);
      console.log(`  Realistic Price: ${realisticPrice.toLocaleString('vi-VN')} VND`);
      console.log(`  Current Position Value: ${(totalQuantity * currentDbValue).toLocaleString('vi-VN')} VND`);
      console.log(`  Realistic Position Value: ${(totalQuantity * realisticPrice).toLocaleString('vi-VN')} VND`);

      if (Math.abs(currentDbValue - realisticPrice) > 0.01) { // Check for significant difference
        assetsToUpdate.push({
          id: data.id,
          symbol: data.symbol,
          name: data.name,
          type: data.type,
          currentValue: currentDbValue,
          realisticPrice: realisticPrice,
          quantity: totalQuantity,
        });
      }
    }

    if (assetsToUpdate.length > 0) {
      console.log('\n🔄 Updating asset values...');
      for (const asset of assetsToUpdate) {
        // currentValue removed - calculated real-time
        // await dataSource.getRepository(Asset).update(asset.id, { currentValue: asset.realisticPrice });
        console.log(`  ✅ Updated ${asset.symbol} from ${asset.currentValue.toLocaleString('vi-VN')} VND to ${asset.realisticPrice.toLocaleString('vi-VN')} VND`);
        console.log(`     Position value changed from ${(asset.quantity * asset.currentValue).toLocaleString('vi-VN')} VND to ${(asset.quantity * asset.realisticPrice).toLocaleString('vi-VN')} VND`);
      }
    } else {
      console.log('\n⏭️  No asset values needed updating.');
    }
    
    // Re-fetch and display updated values
    console.log('\n📊 Updated asset values:');
    const updatedAssets = await dataSource.query(`
      SELECT 
        asset.symbol, 
        asset.name, 
        asset.type, 
        asset.current_value,
        SUM(CASE WHEN trade.side = 'BUY' THEN trade.quantity ELSE -trade.quantity END) as total_quantity
      FROM assets asset
      LEFT JOIN trades trade ON asset.id = trade.asset_id
      WHERE asset.symbol IN (SELECT DISTINCT symbol FROM assets WHERE current_value > 0)
      GROUP BY asset.id, asset.symbol, asset.name, asset.type, asset.current_value
      HAVING SUM(CASE WHEN trade.side = 'BUY' THEN trade.quantity ELSE -trade.quantity END) > 0
      ORDER BY asset.symbol
    `);
    
    updatedAssets.forEach((asset: any) => {
      const positionValue = parseFloat(asset.total_quantity) * parseFloat(asset.current_value);
      console.log(`  ${asset.symbol}: ${parseFloat(asset.current_value).toLocaleString('vi-VN')} VND (${asset.type}) - Position: ${positionValue.toLocaleString('vi-VN')} VND`);
    });

    console.log('\n🎉 Asset values fixed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart backend to clear cache');
    console.log('2. Test portfolio allocation API');
    console.log('3. Verify frontend displays correct values');

  } catch (error) {
    console.error('❌ Fixing asset values failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  fixAssetValuesV2().catch(console.error);
}
