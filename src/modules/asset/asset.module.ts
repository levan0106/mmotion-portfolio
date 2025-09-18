import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalAsset } from './entities/global-asset.entity';
import { AssetPrice } from './entities/asset-price.entity';
import { AssetPriceHistory } from './entities/asset-price-history.entity';
import { Asset } from './entities/asset.entity';
import { Trade } from '../trading/entities/trade.entity';
import { TradeDetail } from '../trading/entities/trade-detail.entity';
import { GlobalAssetController } from './controllers/global-asset.controller';
import { BasicPriceController } from './controllers/basic-price.controller';
import { PriceHistoryController } from './controllers/price-history.controller';
import { MarketDataController } from './controllers/market-data.controller';
import { AssetController } from './controllers/asset.controller';
import { GlobalAssetService } from './services/global-asset.service';
import { BasicPriceService } from './services/basic-price.service';
import { NationConfigService } from './services/nation-config.service';
import { PriceHistoryService } from './services/price-history.service';
import { MarketDataService } from './services/market-data.service';
import { ScheduledPriceUpdateService } from './services/scheduled-price-update.service';
import { AssetService } from './services/asset.service';
import { AssetGlobalSyncService } from './services/asset-global-sync.service';
import { AssetValidationService } from './services/asset-validation.service';
import { AssetAnalyticsService } from './services/asset-analytics.service';
import { AssetCacheService } from './services/asset-cache.service';
import { AssetValueCalculatorService } from './services/asset-value-calculator.service';
import { AssetRepository } from './repositories/asset.repository';
import { IAssetRepository } from './repositories/asset.repository.interface';
import { MarketDataModule } from '../market-data/market-data.module';
import { TradingModule } from '../trading/trading.module';
import { LoggingModule } from '../logging/logging.module';

/**
 * Asset Module for the Global Assets System.
 * 
 * This module provides comprehensive asset management capabilities including:
 * - Multi-national asset management
 * - Separated price data management
 * - Price history tracking
 * - Nation-specific configuration
 * - System resilience with graceful degradation
 * 
 * CR-005 Global Assets System:
 * - Centralized asset management
 * - Support for multiple nations and markets
 * - Flexible pricing system
 * - Audit trail for price changes
 * - Integration with external market data services
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      GlobalAsset,
      AssetPrice,
      AssetPriceHistory,
      Asset,
      Trade,
      TradeDetail,
    ]),
    MarketDataModule,
    TradingModule,
    LoggingModule,
  ],
  controllers: [
    GlobalAssetController,
    BasicPriceController,
    PriceHistoryController,
    MarketDataController,
    AssetController,
  ],
  providers: [
    // New Global Assets System services
    GlobalAssetService,
    BasicPriceService,
    NationConfigService,
    PriceHistoryService,
    MarketDataService,
    ScheduledPriceUpdateService,
    
    // Legacy Asset System services (for backward compatibility)
    AssetService,
    AssetGlobalSyncService,
    AssetValidationService,
    AssetAnalyticsService,
    AssetCacheService,
    AssetValueCalculatorService,
    AssetRepository,
    {
      provide: 'IAssetRepository',
      useClass: AssetRepository,
    },
  ],
  exports: [
    // New Global Assets System exports
    GlobalAssetService,
    BasicPriceService,
    NationConfigService,
    PriceHistoryService,
    MarketDataService,
    ScheduledPriceUpdateService,
    
    // Legacy Asset System exports (for backward compatibility)
    AssetService,
    AssetGlobalSyncService,
    AssetValidationService,
    AssetAnalyticsService,
    AssetCacheService,
    AssetValueCalculatorService,
    TypeOrmModule,
  ],
})
export class AssetModule {}