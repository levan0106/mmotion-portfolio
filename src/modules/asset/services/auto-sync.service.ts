import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetPrice } from '../entities/asset-price.entity';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { PriceType, PriceSource } from '../enums/price-type.enum';
import { ExternalMarketDataService } from '../../market-data/services/external-market-data.service';
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
    @InjectRepository(AssetPriceHistory)
    private readonly assetPriceHistoryRepository: Repository<AssetPriceHistory>,
    private readonly externalMarketDataService: ExternalMarketDataService,
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
      //await this.externalMarketDataService.fetchAllMarketData();
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
      // Step 1: Fetch all market data from external APIs
      const marketDataResult = await this.externalMarketDataService.fetchAllMarketData();
      this.logger.log(`[AutoSyncService] Fetched market data: ${marketDataResult.summary.totalSymbols} symbols from ${Object.keys(marketDataResult.summary.sources).length} sources`);
      
      // Step 2: Sync to database
      await this.performSync(syncId, marketDataResult, true); // true = manual sync
      this.lastSyncTime = new Date();
      return syncId;
    } catch (error) {
      this.logger.error(`[AutoSyncService] Manual sync failed: ${syncId}`, error);
      throw error;
    }
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
      // Step 1: Fetch all market data from external APIs
      const marketDataResult = await this.externalMarketDataService.fetchAllMarketData();
      this.logger.log(`[AutoSyncService] Fetched market data: ${marketDataResult.summary.totalSymbols} symbols from ${Object.keys(marketDataResult.summary.sources).length} sources`);
      
      // Step 2: Sync to database
      await this.performSync(syncId, marketDataResult, false); // false = auto sync
      
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
  private async performSync(syncId: string, marketDataResult?: any, isManual: boolean = false): Promise<void> {
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

      // Create a map of all market data for quick lookup
      const marketDataMap = new Map<string, any>();
      
      if (marketDataResult) {
        // Map all market data by symbol
        [...marketDataResult.funds, ...marketDataResult.gold, ...marketDataResult.exchangeRates, ...marketDataResult.stocks, ...marketDataResult.crypto].forEach(item => {
          marketDataMap.set(item.symbol, item);
        });
        this.logger.log(`[AutoSyncService] Created market data map with ${marketDataMap.size} symbols: ${Array.from(marketDataMap.keys()).slice(0, 10).join(', ')}...`);
      }

      // Update prices for each asset
      for (const asset of globalAssets) {
        try {
          // Try exact match first
          let marketData = marketDataMap.get(asset.symbol);
          this.logger.debug(`[AutoSyncService] Looking for ${asset.symbol}, exact match: ${marketData ? 'found' : 'not found'}`);
          
          // If no exact match, try fuzzy matching for common cases
          if (!marketData) {
            // Try different symbol variations
            const symbolVariations = [
              asset.symbol,
              asset.symbol.toUpperCase(),
              asset.symbol.toLowerCase(),
              // For vàng miếng SJC, code là GOLDSJC
              ...(asset.symbol.toLowerCase().includes('sjc')? 
                ['GOLDSJC'] : []),
              // For vàng 9999, doji, pnj, code là GOLD9999, GOLDPNJ
              ...(asset.symbol.toLowerCase().includes('gold')  || asset.symbol.toLowerCase().includes('9999')
                || asset.symbol.toLowerCase().includes('doji') || asset.symbol.toLowerCase().includes('pnj') 
                || asset.symbol.toLowerCase().includes('vàng') || asset.symbol.toLowerCase().includes('vang') ? 
                ['GOLD9999', 'GOLDPNJ', '9999', 'PNJ'] : []),
              // For crypto assets, try common crypto symbols
              ...(asset.symbol.toLowerCase().includes('btc') || asset.symbol.toLowerCase().includes('bitcoin') ? 
                ['BTC'] : []),
              ...(asset.symbol.toLowerCase().includes('eth') || asset.symbol.toLowerCase().includes('ethereum') ? 
                ['ETH'] : []),
            ];
            
            for (const variation of symbolVariations) {
              if (marketDataMap.has(variation)) {
                marketData = marketDataMap.get(variation);
                this.logger.debug(`[AutoSyncService] Found match for ${asset.symbol} using variation: ${variation}`);
                break;
              }
            }
            this.logger.debug(`[AutoSyncService] Tried variations for ${asset.symbol}: ${symbolVariations.join(', ')}, found: ${marketData ? 'yes' : 'no'}`);
          }
          
          const currentPrice = marketData?.buyPrice || marketData?.sellPrice;
          
          if (currentPrice && currentPrice > 0) {
            const now = new Date();
            const changeReason = isManual 
              ? `Market manual trigger sync ${now.toLocaleDateString('vi-VN')}`
              : `Market auto sync ${now.toLocaleDateString('vi-VN')}`;
            
            // Update or create asset price
            if (asset.assetPrice) {
              await this.assetPriceRepository.update(asset.assetPrice.id, {
                currentPrice: currentPrice,
                priceType: PriceType.EXTERNAL, // Use EXTERNAL for external API data
                priceSource: PriceSource.EXTERNAL_API, // Use EXTERNAL_API for external sources
                lastPriceUpdate: now,
              });
            } else {
              const newAssetPrice = this.assetPriceRepository.create({
                assetId: asset.id,
                currentPrice: currentPrice,
                priceType: PriceType.EXTERNAL, // Use EXTERNAL for external API data
                priceSource: PriceSource.EXTERNAL_API, // Use EXTERNAL_API for external sources
                lastPriceUpdate: now,
              });
              await this.assetPriceRepository.save(newAssetPrice);
            }
            
            // Save to price history for tracking
            const priceHistory = this.assetPriceHistoryRepository.create({
              assetId: asset.id,
              price: currentPrice,
              priceType: PriceType.EXTERNAL,
              priceSource: PriceSource.EXTERNAL_API,
              changeReason: changeReason,
              createdAt: now,
              metadata: {
                source: marketData?.source || 'unknown',
                type: marketData?.type || 'unknown',
                syncId: syncId
              }
            });
            await this.assetPriceHistoryRepository.save(priceHistory);
            
            successCount++;
            this.logger.debug(`[AutoSyncService] Updated price for ${asset.symbol}: ${currentPrice} (source: ${marketData?.source || 'unknown'}) and saved to history`);
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