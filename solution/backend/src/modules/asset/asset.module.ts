import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalAsset } from './entities/global-asset.entity';
import { AssetPrice } from './entities/asset-price.entity';
import { AssetPriceHistory } from './entities/asset-price-history.entity';
import { GlobalAssetTracking } from './entities/global-asset-tracking.entity';
import { ApiCallDetail } from './entities/api-call-detail.entity';
import { Asset } from './entities/asset.entity';
import { Trade } from '../trading/entities/trade.entity';
import { TradeDetail } from '../trading/entities/trade-detail.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { PortfolioPermission } from '../portfolio/entities/portfolio-permission.entity';
import { Account } from '../shared/entities/account.entity';
import { GlobalAssetController } from './controllers/global-asset.controller';
import { BasicPriceController } from './controllers/basic-price.controller';
import { PriceHistoryController } from './controllers/price-history.controller';
import { MarketDataController } from './controllers/market-data.controller';
import { AssetController } from './controllers/asset.controller';
import { AutoSyncController } from './controllers/auto-sync.controller';
import { GlobalAssetTrackingController } from './controllers/global-asset-tracking.controller';
import { GlobalAssetService } from './services/global-asset.service';
import { BasicPriceService } from './services/basic-price.service';
import { NationConfigService } from './services/nation-config.service';
import { PriceHistoryService } from './services/price-history.service';
import { MarketDataService } from './services/market-data.service';
// import { ScheduledPriceUpdateService } from './services/scheduled-price-update.service'; // REMOVED: No longer used
import { AssetService } from './services/asset.service';
import { AssetGlobalSyncService } from './services/asset-global-sync.service';
import { AssetValidationService } from './services/asset-validation.service';
import { AssetAnalyticsService } from './services/asset-analytics.service';
import { AssetCacheService } from './services/asset-cache.service';
import { AssetValueCalculatorService } from './services/asset-value-calculator.service';
import { AutoSyncService } from './services/auto-sync.service';
import { GlobalAssetTrackingService } from './services/global-asset-tracking.service';
import { ApiCallDetailService } from './services/api-call-detail.service';
import { TrackingAlertService } from './services/tracking-alert.service';
import { AutoAssetCreationListener } from './listeners/auto-asset-creation.listener';
import { TrackingAlertListener } from './listeners/tracking-alert.listener';
import { AssetRepository } from './repositories/asset.repository';
import { IAssetRepository } from './repositories/asset.repository.interface';
import { MarketDataModule } from '../market-data/market-data.module';
import { TradingModule } from '../trading/trading.module';
import { LoggingModule } from '../logging/logging.module';
import { SharedModule } from '../shared/shared.module';
import { NotificationModule } from '../../notification/notification.module';

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
      GlobalAssetTracking,
      ApiCallDetail,
      Asset,
      Trade,
      TradeDetail,
      Portfolio,
      PortfolioPermission,
      Account,
    ]),
    forwardRef(() => MarketDataModule),
    forwardRef(() => TradingModule),
    LoggingModule,
    SharedModule,
    NotificationModule,
  ],
  controllers: [
    GlobalAssetController,
    BasicPriceController,
    PriceHistoryController,
    MarketDataController,
    AssetController,
    AutoSyncController,
    GlobalAssetTrackingController,
  ],
  providers: [
    // New Global Assets System services
    GlobalAssetService,
    BasicPriceService,
    NationConfigService,
    PriceHistoryService,
    MarketDataService,
    // ScheduledPriceUpdateService, // DISABLED: Using AutoSyncService instead to avoid duplicate execution
    
    // Legacy Asset System services (for backward compatibility)
    AssetService,
    AssetGlobalSyncService,
    AssetValidationService,
    AssetAnalyticsService,
    AssetCacheService,
    AssetValueCalculatorService,
    AutoSyncService, // PRIMARY: Handles both external API sync and price updates
    GlobalAssetTrackingService,
    ApiCallDetailService,
    TrackingAlertService,
    AutoAssetCreationListener,
    TrackingAlertListener,
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
    // ScheduledPriceUpdateService, // DISABLED: Using AutoSyncService instead
    
    // Legacy Asset System exports (for backward compatibility)
    AssetService,
    AssetGlobalSyncService,
    AssetValidationService,
    AssetAnalyticsService,
    AssetCacheService,
    AssetValueCalculatorService,
    AutoSyncService, // PRIMARY: Handles both external API sync and price updates
    GlobalAssetTrackingService,
    ApiCallDetailService,
    TrackingAlertService,
    AutoAssetCreationListener,
    TrackingAlertListener,
    AssetRepository,
    TypeOrmModule,
  ],
})
export class AssetModule {}