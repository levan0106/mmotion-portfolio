import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketDataService } from './services/market-data.service';
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
    MarketDataClientsModule, // Import external API clients
  ],
  controllers: [
    MarketDataController,
    ExternalMarketDataController,
  ],
  providers: [
    MarketDataService,
  ],
  exports: [
    MarketDataService,
  ],
})
export class MarketDataModule {}
