import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketDataService } from './services/market-data.service';
import { ExternalMarketDataService } from './services/external-market-data.service';
import { MarketDataController } from './controllers/market-data.controller';
import { ExternalMarketDataController } from './controllers/external-market-data.controller';
import { MarketDataClientsModule } from './market-data-clients.module';
import { AssetPriceHistory } from '../asset/entities/asset-price-history.entity';
import { GlobalAsset } from '../asset/entities/global-asset.entity';
import { AssetModule } from '../asset/asset.module';
import { ApiTrackingHelper } from './utils/api-tracking.helper';

/**
 * Market Data Module
 * Handles real-time market data and price updates
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
    HttpModule, // Enable HTTP requests
    MarketDataClientsModule, // Import external API clients
    TypeOrmModule.forFeature([AssetPriceHistory, GlobalAsset]), // Import AssetPriceHistory and GlobalAsset entities
    forwardRef(() => AssetModule), // Import AssetModule to get ApiCallDetailService and AutoSyncService
  ],
  controllers: [
    MarketDataController,
    ExternalMarketDataController,
  ],
  providers: [
    MarketDataService,
    ExternalMarketDataService,
    ApiTrackingHelper,
  ],
  exports: [
    MarketDataService,
    ExternalMarketDataService,
  ],
})
export class MarketDataModule {}
