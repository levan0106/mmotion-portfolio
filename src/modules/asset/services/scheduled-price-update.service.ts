import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { MarketDataService } from './market-data.service';
import { LoggingService } from '../../logging/services/logging.service';
import * as cron from 'node-cron';
import * as moment from 'moment-timezone';

/**
 * Service for managing scheduled price updates.
 * Handles automatic price updates using cron jobs.
 */
@Injectable()
export class ScheduledPriceUpdateService {
  private readonly logger = new Logger(ScheduledPriceUpdateService.name);
  private isRunning = false;
  private readonly updateIntervalMinutes: number;
  private readonly scheduleType: string;
  private readonly fixedTimes: string[];
  private readonly timezone: string;
  private cronJob: cron.ScheduledTask | null = null;
  private lastExecutionTime: Date | null = null;
  private autoSyncEnabled: boolean = false;

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly loggingService: LoggingService,
    private readonly configService: ConfigService,
  ) {
    const configValue = this.configService.get<string>('PRICE_UPDATE_INTERVAL_MINUTES', '60');
    this.updateIntervalMinutes = parseInt(configValue, 10);
    this.scheduleType = this.configService.get<string>('PRICE_UPDATE_SCHEDULE_TYPE', 'interval');
    this.fixedTimes = this.configService.get<string>('PRICE_UPDATE_FIXED_TIMES', '09:00,15:00').split(',');
    this.timezone = this.configService.get<string>('PRICE_UPDATE_TIMEZONE', 'Asia/Ho_Chi_Minh');
    this.autoSyncEnabled = this.configService.get<string>('AUTO_SYNC_ENABLED', 'false') === 'true';
    
    if (this.scheduleType === 'fixed_times') {
      this.logger.log(`ScheduledPriceUpdateService initialized with fixed times: ${this.fixedTimes.join(', ')} (${this.timezone})`);
    } else {
      this.logger.log(`ScheduledPriceUpdateService initialized with ${this.updateIntervalMinutes} minute interval (config: ${configValue})`);
    }
    this.logger.log(`Auto sync status: ${this.autoSyncEnabled ? 'enabled' : 'disabled'}`);
    
    // Setup dynamic cron job
    this.setupDynamicCronJob();
  }

  /**
   * Setup dynamic cron job based on configuration
   */
  private setupDynamicCronJob(): void {
    const cronExpression = this.generateCronExpression();
    
    // Stop existing cron job if it exists
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    // Create new cron job
    this.cronJob = cron.schedule(cronExpression, () => {
      this.logger.log('[ScheduledPriceUpdateService] Running scheduled price update');
      this.handleScheduledPriceUpdate();
    }, {
      scheduled: true,
    });
    
    this.logger.log(`[ScheduledPriceUpdateService] Dynamic cron job created with expression: ${cronExpression}`);
  }

  /**
   * Update cron job when configuration changes
   */
  updateCronJob(): void {
    this.logger.log('[ScheduledPriceUpdateService] Updating cron job due to configuration change');
    this.setupDynamicCronJob();
  }

  /**
   * Cleanup cron job when service is destroyed
   */
  onModuleDestroy(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.logger.log('[ScheduledPriceUpdateService] Cron job stopped and cleaned up');
    }
  }

  /**
   * Generate cron expression based on configured schedule type.
   * @returns Cron expression string
   */
  private generateCronExpression(): string {
    if (this.scheduleType === 'fixed_times') {
      // For fixed times, we need to create a cron expression that runs at specific times
      // Since we can only have one cron expression, we'll use the first time and handle others in the job
      const firstTime = this.fixedTimes[0];
      const [hour, minute] = firstTime.split(':').map(Number);
      
      this.logger.log(`[ScheduledPriceUpdateService] Using fixed time schedule: ${this.fixedTimes.join(', ')} (${this.timezone})`);
      return `${minute} ${hour} * * *`; // Run at the first fixed time daily
    } else {
      // Original interval-based logic
      if (this.updateIntervalMinutes === 1) {
        return '0 * * * * *'; // Every minute
      } else if (this.updateIntervalMinutes > 1 && this.updateIntervalMinutes <= 60) {
        // For any interval from 2-60 minutes, use minute-based cron
        return `0 */${this.updateIntervalMinutes} * * * *`;
      } else if (this.updateIntervalMinutes > 60 && this.updateIntervalMinutes < 1440) {
        // For intervals > 1 hour but < 24 hours, use hourly with custom logic
        const hours = Math.floor(this.updateIntervalMinutes / 60);
        const minutes = this.updateIntervalMinutes % 60;
        
        if (minutes === 0) {
          // Exact hours: every N hours
          return `0 0 */${hours} * * *`;
        } else {
          // Mixed hours and minutes: every hour, but we'll handle the custom logic in the job
          this.logger.warn(`[ScheduledPriceUpdateService] Mixed interval ${this.updateIntervalMinutes} minutes (${hours}h ${minutes}m) - using hourly schedule with custom logic`);
          return '0 0 * * * *'; // Every hour, custom logic will handle the actual interval
        }
      } else if (this.updateIntervalMinutes >= 1440) {
        // For intervals >= 24 hours, use daily schedule
        const days = Math.floor(this.updateIntervalMinutes / 1440);
        const remainingMinutes = this.updateIntervalMinutes % 1440;
        
        if (remainingMinutes === 0) {
          // Exact days: every N days
          return `0 0 0 */${days} * *`;
        } else {
          // Mixed days and hours/minutes: daily with custom logic
          this.logger.warn(`[ScheduledPriceUpdateService] Large interval ${this.updateIntervalMinutes} minutes (${days}d ${Math.floor(remainingMinutes/60)}h ${remainingMinutes%60}m) - using daily schedule with custom logic`);
          return '0 0 0 * * *'; // Every day, custom logic will handle the actual interval
        }
      } else {
        // Fallback for any other cases
        this.logger.warn(`[ScheduledPriceUpdateService] Invalid interval ${this.updateIntervalMinutes} minutes, falling back to 15 minutes`);
        return '0 */15 * * * *';
      }
    }
  }

  /**
   * Scheduled price update based on configured interval.
   * This method is called by the dynamic cron job.
   */
  async handleScheduledPriceUpdate(): Promise<void> {
    this.logger.log(`[ScheduledPriceUpdateService] Auto sync enabled: ${this.autoSyncEnabled}`);
    // Check if we should actually run based on the configured interval and auto sync enabled
    if (!this.shouldRunUpdate() || !this.autoSyncEnabled) {
      return;
    }

    if (this.isRunning) {
      this.logger.warn('[ScheduledPriceUpdateService] Scheduled price update is already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    this.lastExecutionTime = new Date();
    this.logger.log('[ScheduledPriceUpdateService] Starting scheduled price update');

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

      this.logger.log(`[ScheduledPriceUpdateService] Scheduled price update completed: ${successfulUpdates}/${results.length} successful`);
    } catch (error) {
      this.logger.error(`[ScheduledPriceUpdateService] Scheduled price update failed: ${error.message}`);
      
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
   * Check if the update should run based on the configured schedule
   * @returns true if update should run, false otherwise
   */
  private shouldRunUpdate(): boolean {
    if (this.scheduleType === 'fixed_times') {
      return this.shouldRunUpdateFixedTimes();
    } else {
      return this.shouldRunUpdateInterval();
    }
  }

  /**
   * Check if the update should run based on fixed times
   * @returns true if update should run, false otherwise
   */
  private shouldRunUpdateFixedTimes(): boolean {
    const now = moment().tz(this.timezone);
    const currentTime = now.format('HH:mm');
    
    // Check if current time matches any of the fixed times
    for (const fixedTime of this.fixedTimes) {
      if (currentTime === fixedTime) {
        this.logger.log(`[ScheduledPriceUpdateService] Current time ${currentTime} matches fixed time ${fixedTime}`);
        return true;
      }
    }
    
    // If no previous execution today, check if we should run at the next available time
    if (!this.lastExecutionTime) {
      const today = now.format('YYYY-MM-DD');
      const lastExecutionDate = this.lastExecutionTime ? moment(this.lastExecutionTime).tz(this.timezone).format('YYYY-MM-DD') : null;
      
      if (lastExecutionDate !== today) {
        // Check if current time is past any of the fixed times today
        for (const fixedTime of this.fixedTimes) {
          const [hour, minute] = fixedTime.split(':').map(Number);
          const fixedDateTime = now.clone().hour(hour).minute(minute).second(0);
          
          if (now.isAfter(fixedDateTime)) {
            this.logger.log(`[ScheduledPriceUpdateService] Current time ${currentTime} is past fixed time ${fixedTime} today, running update`);
            return true;
          }
        }
      }
    }
    
    this.logger.debug(`[ScheduledPriceUpdateService] Current time ${currentTime} does not match any fixed times: ${this.fixedTimes.join(', ')}`);
    return false;
  }

  /**
   * Check if the update should run based on the configured interval
   * @returns true if update should run, false otherwise
   */
  private shouldRunUpdateInterval(): boolean {
    // If no previous execution, always run
    if (!this.lastExecutionTime) {
      return true;
    }

    const now = new Date();
    const timeSinceLastExecution = now.getTime() - this.lastExecutionTime.getTime();
    const intervalMs = this.updateIntervalMinutes * 60 * 1000;

    // If enough time has passed, run the update
    if (timeSinceLastExecution >= intervalMs) {
      return true;
    }

    // Log why we're skipping
    const remainingMs = intervalMs - timeSinceLastExecution;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    this.logger.debug(`[ScheduledPriceUpdateService] Skipping update - ${remainingMinutes} minutes remaining until next scheduled update`);
    
    return false;
  }

  /**
   * Manual trigger for price update.
   * Can be called to manually trigger a price update outside of the scheduled time.
   */
  async triggerManualUpdate(): Promise<void> {
    this.logger.log('[ScheduledPriceUpdateService] Manual price update triggered');

    if (this.isRunning) {
      this.logger.warn('[ScheduledPriceUpdateService] Price update is already running, cannot trigger manual update');
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

      this.logger.log(`[ScheduledPriceUpdateService] Manual price update completed: ${successfulUpdates}/${results.length} successful`);
    } catch (error) {
      this.logger.error(`[ScheduledPriceUpdateService] Manual price update failed: ${error.message}`);
      
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
    if (this.scheduleType === 'fixed_times') {
      return this.getNextScheduledUpdateFixedTimes();
    } else {
      return this.getNextScheduledUpdateInterval();
    }
  }

  /**
   * Get the next scheduled update time for fixed times
   * @returns Next scheduled update time
   */
  private getNextScheduledUpdateFixedTimes(): Date {
    const now = moment().tz(this.timezone);
    const currentTime = now.format('HH:mm');
    
    // Find the next fixed time today
    for (const fixedTime of this.fixedTimes) {
      if (currentTime < fixedTime) {
        const [hour, minute] = fixedTime.split(':').map(Number);
        const nextUpdate = now.clone().hour(hour).minute(minute).second(0);
        this.logger.log(`[ScheduledPriceUpdateService] Next update scheduled for today at ${fixedTime} (${this.timezone})`);
        return nextUpdate.toDate();
      }
    }
    
    // If no more times today, use the first time tomorrow
    const firstTime = this.fixedTimes[0];
    const [hour, minute] = firstTime.split(':').map(Number);
    const nextUpdate = now.clone().add(1, 'day').hour(hour).minute(minute).second(0);
    this.logger.log(`[ScheduledPriceUpdateService] Next update scheduled for tomorrow at ${firstTime} (${this.timezone})`);
    return nextUpdate.toDate();
  }

  /**
   * Get the next scheduled update time for interval-based scheduling
   * @returns Next scheduled update time
   */
  private getNextScheduledUpdateInterval(): Date {
    const now = new Date();
    
    // If we have a last execution time, calculate from there
    if (this.lastExecutionTime) {
      const nextUpdate = new Date(this.lastExecutionTime.getTime() + (this.updateIntervalMinutes * 60 * 1000));
      return nextUpdate;
    }
    
    // Otherwise, calculate based on current time and interval
    const nextUpdate = new Date(now);
    
    if (this.updateIntervalMinutes < 60) {
      // For intervals < 1 hour, use minute-based calculation
      const minutes = nextUpdate.getMinutes();
      const nextMinutes = Math.ceil(minutes / this.updateIntervalMinutes) * this.updateIntervalMinutes;
      
      if (nextMinutes >= 60) {
        nextUpdate.setHours(nextUpdate.getHours() + 1);
        nextUpdate.setMinutes(0);
      } else {
        nextUpdate.setMinutes(nextMinutes);
      }
    } else if (this.updateIntervalMinutes < 1440) {
      // For intervals < 24 hours, use hour-based calculation
      const hours = Math.floor(this.updateIntervalMinutes / 60);
      const minutes = this.updateIntervalMinutes % 60;
      
      if (minutes === 0) {
        // Exact hours
        const currentHour = nextUpdate.getHours();
        const nextHour = Math.ceil(currentHour / hours) * hours;
        
        if (nextHour >= 24) {
          nextUpdate.setDate(nextUpdate.getDate() + 1);
          nextUpdate.setHours(0);
        } else {
          nextUpdate.setHours(nextHour);
        }
      } else {
        // Mixed hours and minutes - use current time + interval
        nextUpdate.setTime(now.getTime() + (this.updateIntervalMinutes * 60 * 1000));
      }
    } else {
      // For intervals >= 24 hours, use day-based calculation
      const days = Math.floor(this.updateIntervalMinutes / 1440);
      const remainingMinutes = this.updateIntervalMinutes % 1440;
      
      if (remainingMinutes === 0) {
        // Exact days
        const currentDay = nextUpdate.getDate();
        const nextDay = Math.ceil(currentDay / days) * days;
        
        if (nextDay > new Date(nextUpdate.getFullYear(), nextUpdate.getMonth() + 1, 0).getDate()) {
          nextUpdate.setMonth(nextUpdate.getMonth() + 1);
          nextUpdate.setDate(1);
        } else {
          nextUpdate.setDate(nextDay);
        }
      } else {
        // Mixed days and hours/minutes - use current time + interval
        nextUpdate.setTime(now.getTime() + (this.updateIntervalMinutes * 60 * 1000));
      }
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
