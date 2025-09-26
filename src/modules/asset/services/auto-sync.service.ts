import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetPrice } from '../entities/asset-price.entity';
import { PriceType, PriceSource } from '../enums/price-type.enum';
import { MarketDataService } from '../../market-data/services/market-data.service';
import * as cron from 'node-cron';

export interface AutoSyncConfig {
  enabled: boolean;
  intervalMinutes: number; // Sync interval in minutes
  cronExpression?: string; // Custom cron expression
}

@Injectable()
export class AutoSyncService {
  private readonly logger = new Logger(AutoSyncService.name);
  private autoSyncEnabled = false;
  private lastSyncTime: Date | null = null;
  private syncInterval = 15; // 15 minutes - now configurable
  private cronExpression = '0 */15 * * * *'; // Default: every 15 minutes
  private cronJob: cron.ScheduledTask | null = null;

  constructor(
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
    private readonly marketDataService: MarketDataService,
    private readonly configService: ConfigService,
  ) {
    // Load auto sync status from environment or database
    this.loadAutoSyncStatus();
    
    // Setup dynamic cron job 
    this.setupDynamicCronJob();
  }

  /**
   * Get current auto sync status
   */
  async getStatus(): Promise<{
    enabled: boolean;
    lastSync?: string;
    nextSync?: string;
    interval: number;
    cronExpression: string;
  }> {
    const nextSync = this.getNextSyncTime();
    
    return {
      enabled: this.autoSyncEnabled,
      lastSync: this.lastSyncTime?.toISOString(),
      nextSync: nextSync?.toISOString(),
      interval: this.syncInterval,
      cronExpression: this.cronExpression,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoSyncConfig {
    return {
      enabled: this.autoSyncEnabled,
      intervalMinutes: this.syncInterval,
      cronExpression: this.cronExpression,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoSyncConfig>): void {
    if (config.enabled !== undefined) {
      this.autoSyncEnabled = config.enabled;
    }
    
    if (config.intervalMinutes !== undefined) {
      this.syncInterval = config.intervalMinutes;
      this.cronExpression = this.generateCronExpression(config.intervalMinutes);
    }
    
    if (config.cronExpression !== undefined) {
      this.cronExpression = config.cronExpression;
      // Try to extract interval from cron expression
      const extractedInterval = this.extractIntervalFromCron(config.cronExpression);
      if (extractedInterval > 0) {
        this.syncInterval = extractedInterval;
      }
    }

    this.logger.log(`[AutoSyncService] Auto sync configuration updated: ${JSON.stringify(this.getConfig())}`);
    
    // Update cron job when config changes
    this.setupDynamicCronJob();
  }

  /**
   * Setup dynamic cron job based on configuration
   */
  private setupDynamicCronJob(): void {
    // Stop existing cron job if it exists
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    this.cronJob = cron.schedule(this.cronExpression, () => {
      this.handleAutoSync();
    }, {
      scheduled: true,
    });
  }

  /**
   * Generate cron expression from minutes (consistent with scheduled-price-update.service.ts)
   */
  private generateCronExpression(minutes: number): string {
    if (minutes < 1) {
      throw new Error('Interval must be at least 1 minute');
    }
    
    if (minutes === 1) {
      return '0 * * * * *'; // Every minute
    } else if (minutes > 1 && minutes <= 60) {
      return `0 */${minutes} * * * *`; // Every X minutes
    } else if (minutes > 60 && minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `0 0 */${hours} * * *`; // Every X hours
      } else {
        // Mixed hours and minutes - use hourly with custom logic
        this.logger.warn(`[AutoSyncService] Mixed interval ${minutes} minutes (${hours}h ${remainingMinutes}m) - using hourly schedule with custom logic`);
        return '0 0 * * * *'; // Every hour, custom logic will handle the actual interval
      }
    } else if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      const remainingMinutes = minutes % 1440;
      
      if (remainingMinutes === 0) {
        return `0 0 0 */${days} * *`; // Every X days
      } else {
        // Mixed days and hours/minutes - use daily with custom logic
        this.logger.warn(`[AutoSyncService] Large interval ${minutes} minutes (${days}d ${Math.floor(remainingMinutes/60)}h ${remainingMinutes%60}m) - using daily schedule with custom logic`);
        return '0 0 0 * * *'; // Every day, custom logic will handle the actual interval
      }
    } else {
      this.logger.warn(`[AutoSyncService] Invalid interval ${minutes} minutes, falling back to 15 minutes`);
      return '0 */15 * * * *';
    }
  }

  /**
   * Extract interval from cron expression
   */
  private extractIntervalFromCron(cronExpression: string): number {
    // Parse cron expression like "0 */5 * * * *" to extract 5
    const match = cronExpression.match(/^\d+\s+\*\/(\d+)\s+/);
    if (match) {
      return parseInt(match[1]);
    }
    return 0; // Could not extract interval
  }

  /**
   * Toggle auto sync on/off
   * Now only manages one service - no need to toggle MarketDataService
   */
  async toggle(enabled: boolean): Promise<void> {
    this.autoSyncEnabled = enabled;
    this.logger.log(`[AutoSyncService] Auto sync ${enabled ? 'enabled' : 'disabled'}`);
    
    if (enabled) {
      // Trigger immediate update when enabling
      await this.marketDataService.updateAllPrices();
      await this.triggerManualSync();
    }
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(): Promise<string> {
    const syncId = `manual_${Date.now()}`;
    this.logger.log(`[AutoSyncService] Manual sync triggered: ${syncId}`);
    
    try {
      await this.performSync(syncId);
      this.lastSyncTime = new Date();
      return syncId;
    } catch (error) {
      this.logger.error(`[AutoSyncService] Manual sync failed: ${syncId}`, error);
      throw error;
    }
    
    return syncId;
  }

  /**
   * Scheduled auto sync (runs based on configured interval)
   * Now manages both cache updates and database sync
   * Note: Cron expression is configurable via updateConfig()
   */
  async handleAutoSync(): Promise<void> {
    this.logger.log(`[AutoSyncService] Auto sync enabled: ${this.autoSyncEnabled}`);
    // Check if auto sync is enabled
    if (!this.autoSyncEnabled) {
      this.logger.debug('[AutoSyncService] Auto sync is disabled, skipping scheduled sync');
      return;
    }

    const syncId = `auto_${Date.now()}`;
    this.logger.log(`[AutoSyncService] Auto sync triggered: ${syncId}`);
    
    try {
      // Step 1: Update market data cache
      await this.marketDataService.updateAllPrices();
      
      // Step 2: Sync to database
      await this.performSync(syncId);
      
      this.lastSyncTime = new Date();
      this.logger.log(`[AutoSyncService] Auto sync completed: ${syncId}`);
    } catch (error) {
      this.logger.error(`[AutoSyncService] Auto sync failed: ${syncId}`, error);
      // Don't throw error for scheduled sync to prevent cron job failure
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(syncId: string): Promise<void> {
    this.logger.log(`[AutoSyncService] Starting sync operation: ${syncId}`);
    
    try {
      // Get all active global assets
      const globalAssets = await this.globalAssetRepository.find({
        where: { isActive: true },
        relations: ['assetPrice']
      });

      this.logger.log(`[AutoSyncService] Found ${globalAssets.length} active global assets to sync`);

      let successCount = 0;
      let errorCount = 0;

      // Update prices for each asset
      for (const asset of globalAssets) {
        try {
          // Get current price from MarketDataService cache
          const currentPrice = await this.marketDataService.getCurrentPrice(asset.symbol);
          
          if (currentPrice && currentPrice > 0) {
            // Update or create asset price
            if (asset.assetPrice) {
              await this.assetPriceRepository.update(asset.assetPrice.id, {
                currentPrice: currentPrice,
                priceType: PriceType.MARKET_DATA, // Use enum instead of string
                priceSource: PriceSource.MARKET_DATA_SERVICE, // Use enum instead of string
                lastPriceUpdate: new Date(),
              });
            } else {
              const newAssetPrice = this.assetPriceRepository.create({
                assetId: asset.id,
                currentPrice: currentPrice,
                priceType: PriceType.MARKET_DATA, // Use enum instead of string
                priceSource: PriceSource.MARKET_DATA_SERVICE, // Use enum instead of string
                lastPriceUpdate: new Date(),
              });
              await this.assetPriceRepository.save(newAssetPrice);
            }
            
            successCount++;
            this.logger.debug(`[AutoSyncService] Updated price for ${asset.symbol}: ${currentPrice}`);
          } else {
            this.logger.warn(`[AutoSyncService] No valid price found for ${asset.symbol}`);
          }
        } catch (error) {
          errorCount++;
          this.logger.error(`[AutoSyncService] Failed to update price for ${asset.symbol}:`, error);
        }
      }

      this.logger.log(`[AutoSyncService] Sync operation ${syncId} completed: ${successCount} successful, ${errorCount} errors`);
    } catch (error) {
      this.logger.error(`[AutoSyncService] Sync operation ${syncId} failed:`, error);
      throw error;
    }
  }

  /**
   * Load auto sync status from configuration
   */
  private loadAutoSyncStatus(): void {
    // Use the same config as scheduled-price-update.service.ts for consistency
    this.autoSyncEnabled = this.configService.get<string>('AUTO_SYNC_ENABLED', 'false') === 'true';
    this.syncInterval = parseInt(this.configService.get<string>('PRICE_UPDATE_INTERVAL_MINUTES', '15'), 10);
    this.cronExpression = this.generateCronExpression(this.syncInterval);
    
    this.logger.log(`[AutoSyncService] Auto sync status loaded: ${this.autoSyncEnabled ? 'enabled' : 'disabled'}, interval: ${this.syncInterval} minutes (using PRICE_UPDATE_INTERVAL_MINUTES config)`);
  }

  /**
   * Get next sync time based on interval
   */
  private getNextSyncTime(): Date | null {
    if (!this.autoSyncEnabled || !this.lastSyncTime) {
      return null;
    }

    const nextSync = new Date(this.lastSyncTime);
    nextSync.setMinutes(nextSync.getMinutes() + this.syncInterval);
    return nextSync;
  }

  /**
   * Cleanup cron job when service is destroyed
   */
  onModuleDestroy(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.logger.log('[AutoSyncService] Auto sync cron job stopped and cleaned up');
    }
  }
}