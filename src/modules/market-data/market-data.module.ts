import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { MarketDataService } from './services/market-data.service';
import { ExternalMarketDataService } from './services/external-market-data.service';
import { MarketDataController } from './controllers/market-data.controller';
import { ExternalMarketDataController } from './controllers/external-market-data.controller';
import { MarketDataClientsModule } from './market-data-clients.module';

/**
 * Market Data Module
 * Handles real-time market data and price updates
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
    HttpModule, // Enable HTTP requests
    MarketDataClientsModule, // Import external API clients
  ],
  controllers: [
    MarketDataController,
    ExternalMarketDataController,
  ],
  providers: [
    MarketDataService,
    ExternalMarketDataService,
  ],
  exports: [
    MarketDataService,
    ExternalMarketDataService,
  ],
})
export class MarketDataModule {}
