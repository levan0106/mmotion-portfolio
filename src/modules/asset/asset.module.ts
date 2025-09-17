import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { Trade } from '../trading/entities/trade.entity';
import { TradeDetail } from '../trading/entities/trade-detail.entity';
import { AssetRepository } from './repositories/asset.repository';
import { AssetService } from './services/asset.service';
import { AssetValidationService } from './services/asset-validation.service';
import { AssetAnalyticsService } from './services/asset-analytics.service';
import { AssetCacheService } from './services/asset-cache.service';
import { AssetMigrationService } from './services/asset-migration.service';
import { MarketDataModule } from '../market-data/market-data.module';
import { TradeEventListener } from './listeners/trade-event.listener';
import { AssetController } from './controllers/asset.controller';

/**
 * Asset Module
 * Provides asset management functionality
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Trade, TradeDetail]),
    MarketDataModule,
  ],
  controllers: [AssetController],
  providers: [
    AssetRepository,
    {
      provide: 'IAssetRepository',
      useClass: AssetRepository,
    },
    AssetService,
    AssetValidationService,
    AssetAnalyticsService,
    AssetCacheService,
    AssetMigrationService,
    TradeEventListener,
  ],
  exports: [
    AssetService,
    AssetValidationService,
    AssetAnalyticsService,
    'IAssetRepository',
  ],
})
export class AssetModule {}
