import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketDataService } from './services/market-data.service';
import { MarketDataController } from './controllers/market-data.controller';

/**
 * Market Data Module
 * Handles real-time market data and price updates
 */
@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [
    MarketDataController,
  ],
  providers: [
    MarketDataService,
  ],
  exports: [
    MarketDataService,
  ],
})
export class MarketDataModule {}
