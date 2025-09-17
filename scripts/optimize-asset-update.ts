import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Asset } from '../src/modules/asset/entities/asset.entity';

async function optimizeAssetUpdate() {
  console.log('🔧 Analyzing Asset Update Optimization');
  console.log('=' .repeat(50));

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('\n📊 Current Asset Update Logic Analysis:');
    console.log('1. UpdateAssetDto only allows: name, type, description, updatedBy');
    console.log('2. These fields DO NOT affect currentValue calculation');
    console.log('3. currentValue depends on: currentQuantity (from trades) + currentMarketPrice');
    console.log('4. Recalculating currentValue on every update is UNNECESSARY');

    console.log('\n🎯 Optimization Recommendations:');
    console.log('1. Remove updateAssetWithComputedFields() from asset update');
    console.log('2. Only recalculate when trades change (via TradeEventListener)');
    console.log('3. Use lazy loading for computed fields when needed');
    console.log('4. Add computed fields only when specifically requested');

    console.log('\n📈 Performance Impact:');
    console.log('- Current: Every asset update triggers market data call + trade calculation');
    console.log('- Optimized: Only metadata update, no unnecessary calculations');
    console.log('- Benefit: Faster updates, reduced database load, better performance');

    console.log('\n🔧 Suggested Code Changes:');
    console.log(`
// BEFORE (Current - Inefficient):
async update(id: string, updateAssetDto: UpdateAssetDto) {
  const asset = await this.assetService.update(id, updateAssetDto);
  // ❌ UNNECESSARY: Recalculates currentValue for metadata changes
  const assetWithComputedFields = await this.assetService.updateAssetWithComputedFields(asset.id);
  return AssetMapper.toResponseDto(assetWithComputedFields);
}

// AFTER (Optimized):
async update(id: string, updateAssetDto: UpdateAssetDto) {
  const asset = await this.assetService.update(id, updateAssetDto);
  // ✅ EFFICIENT: Only update metadata, no unnecessary calculations
  return AssetMapper.toResponseDto(asset);
}

// Computed fields only when needed:
async getAssetWithComputedFields(id: string) {
  const asset = await this.assetService.findById(id);
  const computedFields = await this.assetService.calculateComputedFields(id);
  return { ...asset, ...computedFields };
}
    `);

    console.log('\n✅ Analysis Complete!');
    console.log('Recommendation: Remove unnecessary currentValue recalculation from asset updates');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  optimizeAssetUpdate().catch(console.error);
}
