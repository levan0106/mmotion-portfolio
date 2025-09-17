import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketDataService } from './market-data.service';
import { LoggingService } from '../../logging/services/logging.service';

/**
 * Service for managing scheduled price updates.
 * Handles automatic price updates using cron jobs.
 */
@Injectable()
export class ScheduledPriceUpdateService {
  private readonly logger = new Logger(ScheduledPriceUpdateService.name);
  private isRunning = false;

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Scheduled price update every 15 minutes.
   * This cron job runs every 15 minutes to update all asset prices.
   */
  @Cron('0 */15 * * * *')
  async handleScheduledPriceUpdate(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Scheduled price update is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting scheduled price update');

    try {
      const results = await this.marketDataService.updateAllPrices();
      
      const successfulUpdates = results.filter(r => r.success).length;
      const failedUpdates = results.filter(r => !r.success).length;

      await this.loggingService.logBusinessEvent(
        'SCHEDULED_PRICE_UPDATE_COMPLETED',
        'ScheduledPriceUpdateService',
        'scheduled-update',
        'UPDATE',
        undefined,
        {
          totalAssets: results.length,
          successfulUpdates,
          failedUpdates,
          successRate: results.length > 0 ? (successfulUpdates / results.length) * 100 : 0,
        },
      );

      this.logger.log(`Scheduled price update completed: ${successfulUpdates}/${results.length} successful`);
    } catch (error) {
      this.logger.error(`Scheduled price update failed: ${error.message}`);
      
      await this.loggingService.logBusinessEvent(
        'SCHEDULED_PRICE_UPDATE_FAILED',
        'ScheduledPriceUpdateService',
        'scheduled-update',
        'UPDATE',
        undefined,
        { error: error.message },
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual trigger for price update.
   * Can be called to manually trigger a price update outside of the scheduled time.
   */
  async triggerManualUpdate(): Promise<void> {
    this.logger.log('Manual price update triggered');

    if (this.isRunning) {
      this.logger.warn('Price update is already running, cannot trigger manual update');
      throw new Error('Price update is already running');
    }

    this.isRunning = true;

    try {
      const results = await this.marketDataService.updateAllPrices();
      
      const successfulUpdates = results.filter(r => r.success).length;
      const failedUpdates = results.filter(r => !r.success).length;

      await this.loggingService.logBusinessEvent(
        'MANUAL_PRICE_UPDATE_COMPLETED',
        'ScheduledPriceUpdateService',
        'manual-update',
        'UPDATE',
        undefined,
        {
          totalAssets: results.length,
          successfulUpdates,
          failedUpdates,
          successRate: results.length > 0 ? (successfulUpdates / results.length) * 100 : 0,
        },
      );

      this.logger.log(`Manual price update completed: ${successfulUpdates}/${results.length} successful`);
    } catch (error) {
      this.logger.error(`Manual price update failed: ${error.message}`);
      
      await this.loggingService.logBusinessEvent(
        'MANUAL_PRICE_UPDATE_FAILED',
        'ScheduledPriceUpdateService',
        'manual-update',
        'UPDATE',
        undefined,
        { error: error.message },
      );
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get the current running status.
   * @returns True if price update is currently running, false otherwise
   */
  isUpdateRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the next scheduled update time.
   * @returns Next scheduled update time
   */
  getNextScheduledUpdate(): Date {
    const now = new Date();
    const nextUpdate = new Date(now);
    
    // Calculate next 15-minute interval
    const minutes = nextUpdate.getMinutes();
    const nextMinutes = Math.ceil(minutes / 15) * 15;
    
    if (nextMinutes >= 60) {
      nextUpdate.setHours(nextUpdate.getHours() + 1);
      nextUpdate.setMinutes(0);
    } else {
      nextUpdate.setMinutes(nextMinutes);
    }
    
    nextUpdate.setSeconds(0);
    nextUpdate.setMilliseconds(0);
    
    return nextUpdate;
  }

  /**
   * Get update statistics for the last 24 hours.
   * @returns Update statistics
   */
  async getLast24HoursStatistics(): Promise<{
    totalUpdates: number;
    successfulUpdates: number;
    failedUpdates: number;
    successRate: number;
    averageUpdateTime: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    return this.marketDataService.getUpdateStatistics(startDate, endDate);
  }

  /**
   * Get update statistics for the last 7 days.
   * @returns Update statistics
   */
  async getLast7DaysStatistics(): Promise<{
    totalUpdates: number;
    successfulUpdates: number;
    failedUpdates: number;
    successRate: number;
    averageUpdateTime: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    return this.marketDataService.getUpdateStatistics(startDate, endDate);
  }

  /**
   * Get update statistics for the last 30 days.
   * @returns Update statistics
   */
  async getLast30DaysStatistics(): Promise<{
    totalUpdates: number;
    successfulUpdates: number;
    failedUpdates: number;
    successRate: number;
    averageUpdateTime: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    return this.marketDataService.getUpdateStatistics(startDate, endDate);
  }
}
