import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetPrice } from '../entities/asset-price.entity';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { PriceType, PriceSource } from '../enums/price-type.enum';
import { PriceMode } from '../enums/price-mode.enum';
import { ExternalMarketDataService } from '../../market-data/services/external-market-data.service';
import { MarketDataType } from '../../market-data/types/market-data.types';
import { CircuitBreakerService } from '../../shared/services/circuit-breaker.service';
import { GlobalAssetTrackingService } from './global-asset-tracking.service';
import { GlobalAssetSyncType, GlobalAssetSyncSource, GlobalAssetSyncStatus } from '../entities/global-asset-tracking.entity';
import * as cron from 'node-cron';
import * as moment from 'moment-timezone';

export interface AutoSyncConfig {
  enabled: boolean;
  scheduleType: 'interval' | 'fixed_times';
  intervalMinutes?: number; // Sync interval in minutes (for interval type)
  fixedTimes?: string[]; // Fixed times for execution (for fixed_times type)
  timezone?: string; // Timezone for fixed times
  cronExpression?: string; // Custom cron expression
}

@Injectable()
export class AutoSyncService {
  private readonly logger = new Logger(AutoSyncService.name);
  private autoSyncEnabled: boolean;
  private lastSyncTime: Date | null = null;
  private scheduleType: 'interval' | 'fixed_times';
  private syncInterval = 15; // 15 minutes - now configurable
  private fixedTimes: string[] = ['09:01', '15:01', '18:50']; // Default fixed times
  private timezone = 'Asia/Ho_Chi_Minh'; // Default timezone
  private cronExpression = '0 */15 * * * *'; // Default: every 15 minutes
  private cronJob: cron.ScheduledTask | null = null;
  private cronJobs: cron.ScheduledTask[] = []; // Store multiple cron jobs

  constructor(
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
    @InjectRepository(AssetPriceHistory)
    private readonly assetPriceHistoryRepository: Repository<AssetPriceHistory>,
    private readonly externalMarketDataService: ExternalMarketDataService,
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly globalAssetTrackingService: GlobalAssetTrackingService,
  ) {
    // Load configuration from environment
    this.loadConfiguration();
    
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
    scheduleType: string;
    interval?: number;
    fixedTimes?: string[];
    timezone?: string;
    cronExpression: string;
  }> {
    // Determine last sync from in-memory or tracking history as fallback
    let lastSyncDate: Date | null = this.lastSyncTime;
    if (!lastSyncDate) {
      try {
        const latestFinished = await this.globalAssetTrackingService.getLatestFinishedExecutionTime();
        if (latestFinished) {
          lastSyncDate = latestFinished;
        }
      } catch (err) {
        this.logger.warn(`[AutoSyncService] Failed to fetch latest finished execution time: ${err?.message || err}`);
      }
    }

    let nextSync: Date | null = null;
    if (this.autoSyncEnabled) {
      if (this.scheduleType === 'fixed_times') {
        nextSync = this.getNextFixedTimeSync();
      } else if (lastSyncDate) {
        nextSync = new Date(lastSyncDate.getTime() + this.syncInterval * 60 * 1000);
      }
    }
    
    const status: any = {
      enabled: this.autoSyncEnabled,
      lastSync: lastSyncDate?.toISOString(),
      nextSync: nextSync?.toISOString(),
      scheduleType: this.scheduleType,
      cronExpression: this.cronExpression,
    };

    if (this.scheduleType === 'fixed_times') {
      status.fixedTimes = this.fixedTimes;
      status.timezone = this.timezone;
    } else {
      status.interval = this.syncInterval;
    }

    return status;
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoSyncConfig {
    const config: AutoSyncConfig = {
      enabled: this.autoSyncEnabled,
      scheduleType: this.scheduleType,
      cronExpression: this.cronExpression,
    };

    if (this.scheduleType === 'fixed_times') {
      config.fixedTimes = this.fixedTimes;
      config.timezone = this.timezone;
    } else {
      config.intervalMinutes = this.syncInterval;
    }

    return config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutoSyncConfig>): void {
    if (config.enabled !== undefined) {
      this.autoSyncEnabled = this.normalizeBoolean(config.enabled);
    }
    
    if (config.scheduleType !== undefined) {
      this.scheduleType = config.scheduleType;
    }
    
    if (config.intervalMinutes !== undefined) {
      this.syncInterval = config.intervalMinutes;
      this.cronExpression = this.generateCronExpression(config.intervalMinutes);
    }
    
    if (config.fixedTimes !== undefined) {
      this.fixedTimes = config.fixedTimes;
      if (this.scheduleType === 'fixed_times') {
        this.cronExpression = this.generateFixedTimesCronExpression();
      }
    }
    
    if (config.timezone !== undefined) {
      this.timezone = config.timezone;
    }
    
    if (config.cronExpression !== undefined) {
      this.cronExpression = config.cronExpression;
      // Try to extract interval from cron expression
      const extractedInterval = this.extractIntervalFromCron(config.cronExpression);
      if (extractedInterval > 0) {
        this.syncInterval = extractedInterval;
      }
    }

    
    // Update cron job when config changes
    this.setupDynamicCronJob();
  }

  /**
   * Setup dynamic cron job based on configuration
   * Ultra-optimized: Only run at exact scheduled times
   */
  private setupDynamicCronJob(): void {
    // Stop existing cron jobs if they exist
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    // Stop all existing multiple cron jobs
    if (this.cronJobs.length > 0) {
      this.cronJobs.forEach(job => job.stop());
      this.cronJobs = [];
    }
    
    if (this.scheduleType === 'fixed_times') {
      // For fixed times, use single cron job with custom logic
      this.setupFixedTimesCronJob();
    } else {
      // Interval - use single cron job
      this.cronJob = cron.schedule(this.cronExpression, () => {
        this.handleAutoSync();
      }, {
        scheduled: true,
      });
      
    }
  }

  /**
   * Setup single cron job for fixed times with custom logic
   * More reliable than multiple cron jobs
   */
  private setupFixedTimesCronJob(): void {
    // Use a cron job that runs every minute and check if current time matches any fixed time
    this.cronJob = cron.schedule('* * * * *', () => {
      this.checkAndExecuteFixedTimeSync();
    }, {
      scheduled: true,
    });
  }

  /**
   * Check if current time matches any fixed time and execute sync
   */
  private checkAndExecuteFixedTimeSync(): void {
    const now = moment().tz(this.timezone);
    const currentTime = now.format('HH:mm');
    
    // Check if current time matches any of the fixed times
    for (const fixedTime of this.fixedTimes) {
      if (currentTime === fixedTime) {
        this.handleAutoSync();
        return;
      }
    }
  }

  /**
   * Setup multiple cron jobs for multiple fixed times
   * Ultra-optimized: Each time gets its own cron job
   */
  private setupMultipleCronJobs(): void {
    // Create individual cron jobs for each fixed time
    this.fixedTimes.forEach((fixedTime, index) => {
      const [hour, minute] = fixedTime.split(':').map(Number);
      
      // Convert Asia/Ho_Chi_Minh time to UTC for cron scheduling
      // Asia/Ho_Chi_Minh is UTC+7, so we need to subtract 7 hours
      const asiaTime = moment.tz(`${moment().format('YYYY-MM-DD')} ${fixedTime}`, 'YYYY-MM-DD HH:mm', this.timezone);
      const utcTime = asiaTime.utc();
      const utcHour = utcTime.hour();
      const utcMinute = utcTime.minute();
      
      const cronExpression = `${utcMinute} ${utcHour} * * *`;
      
      const job = cron.schedule(cronExpression, () => {
        this.handleAutoSync();
      }, {
        scheduled: true,
      });
      
      // Store the job for management
      this.cronJobs.push(job);
    });
  }

  /**
   * Generate cron expression from minutes
   */
  private generateCronExpression(minutes: number): string {
    if (minutes < 1) {
      throw new Error('Interval must be at least 1 minute');
    }
    
    if (minutes === 1) {
      return '0 * * * * *'; // Every minute
    } else if (minutes > 1 && minutes < 60) {
      return `0 */${minutes} * * * *`; // Every X minutes
    } else if (minutes === 60) {
      return '0 0 * * * *'; // Every hour on minute 0
    } else if (minutes > 60 && minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `0 0 */${hours} * * *`; // Every X hours
      } else {
        // Mixed hours and minutes - use hourly with custom logic
        return '0 0 * * * *'; // Every hour, custom logic will handle the actual interval
      }
    } else if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      const remainingMinutes = minutes % 1440;
      
      if (remainingMinutes === 0) {
        return `0 0 0 */${days} * *`; // Every X days
      } else {
        // Mixed days and hours/minutes - use daily with custom logic
        return '0 0 0 * * *'; // Every day, custom logic will handle the actual interval
      }
    } else {
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
    // Common presets
    if (cronExpression.trim() === '0 0 * * * *') {
      return 60; // hourly
    }
    return 0; // Could not extract interval
  }

  /**
   * Toggle auto sync on/off
   * Now only manages one service - no need to toggle MarketDataService
   */
  async toggle(enabled: boolean): Promise<void> {
    this.autoSyncEnabled = enabled;
    
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
    
    // Get total assets in database for proper success rate calculation
    const totalAssetsInDatabase = await this.globalAssetRepository.count({
      where: { 
        isActive: true,
        priceMode: Not(PriceMode.MANUAL)
      }
    });
    
    // Create tracking record
    let tracking = await this.globalAssetTrackingService.createTracking(
      syncId,
      GlobalAssetSyncType.MANUAL,
      GlobalAssetSyncSource.MANUAL_TRIGGER,
      undefined, // triggeredBy
      undefined, // triggerIp
      {
        cronExpression: this.cronExpression,
        timezone: 'Asia/Ho_Chi_Minh',
        autoSyncEnabled: this.autoSyncEnabled,
      }
    );
    
    try {
      // Update tracking status to in progress
      tracking = await this.globalAssetTrackingService.updateProgress(
        syncId,
        GlobalAssetSyncStatus.IN_PROGRESS,
        0, // totalSymbols
        0, // successfulUpdates
        0, // failedUpdates
        0, // totalApis
        0, // successfulApis
        0, // failedApis
      );

      // Step 1: Fetch all market data from external APIs
      const marketDataResult = await this.externalMarketDataService.fetchAllMarketData(syncId);
      
      // Update tracking with API statistics
      const totalApis = Object.keys(marketDataResult.summary.sources).length;
      // Count successful APIs based on whether they have data (non-zero count)
      const successfulApis = Object.values(marketDataResult.summary.sources).filter((source: any) => source > 0).length;
      const failedApis = totalApis - successfulApis;
      

      tracking = await this.globalAssetTrackingService.updateProgress(
        syncId,
        GlobalAssetSyncStatus.IN_PROGRESS,
        totalAssetsInDatabase, // Use database assets count, not API symbols
        0, // successfulUpdates - will be updated after sync
        0, // failedUpdates - will be updated after sync
        totalApis,
        successfulApis,
        failedApis,
      );
      
      // Step 2: Sync to database
      const syncResult = await this.performSync(syncId, marketDataResult, true); // true = manual sync
      
      // Step 3: Update API statistics based on actual API call details
      // Add small delay to ensure all API call details are saved
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.updateApiStatisticsFromCallDetails(syncId);
      
      // Get updated tracking record to get latest API statistics
      const updatedTracking = await this.globalAssetTrackingService.getByExecutionId(syncId);
      if (!updatedTracking) {
        throw new Error(`Tracking record not found for execution ID: ${syncId}`);
      }
      
      // Get final API statistics from updated tracking
      const finalTotalApis = updatedTracking.totalApis || totalApis;
      const finalSuccessfulApis = updatedTracking.successfulApis || 0;
      const finalFailedApis = updatedTracking.failedApis || 0;
      
      // Calculate final success rate for asset updates
      const finalSuccessRate = totalAssetsInDatabase > 0 ? ((syncResult.successfulUpdates || 0) / totalAssetsInDatabase) * 100 : 0;
      
      // Determine final status: BOTH conditions must be met:
      // 1. All APIs must be SUCCESS (finalSuccessfulApis === finalTotalApis)
      // 2. All assets must be updated successfully (finalSuccessRate === 100)
      const allApisSuccessful = finalTotalApis > 0 && finalSuccessfulApis === finalTotalApis && finalFailedApis === 0;
      const allAssetsUpdated = finalSuccessRate === 100;
      
      const finalStatus = (allApisSuccessful && allAssetsUpdated) 
        ? GlobalAssetSyncStatus.COMPLETED 
        : GlobalAssetSyncStatus.FAILED;
      
      // Log status determination for debugging
      if (!allApisSuccessful) {
        this.logger.warn(
          `[AutoSyncService] Manual sync ${syncId} marked as FAILED: Not all APIs successful. ` +
          `Successful: ${finalSuccessfulApis}/${finalTotalApis}, Failed: ${finalFailedApis}`
        );
      }
      if (!allAssetsUpdated) {
        this.logger.warn(
          `[AutoSyncService] Manual sync ${syncId} marked as FAILED: Not all assets updated. ` +
          `Success rate: ${finalSuccessRate.toFixed(2)}% (${syncResult.successfulUpdates || 0}/${totalAssetsInDatabase})`
        );
      }
      
      //step 4: update tracking with final results
      tracking = await this.globalAssetTrackingService.updateProgress(
        syncId,
        finalStatus,
        totalAssetsInDatabase, // Use database assets count, not API symbols
        syncResult.successfulUpdates || 0,
        syncResult.failedUpdates || 0,
        finalTotalApis,
        finalSuccessfulApis,
        finalFailedApis,
        syncResult.failedSymbols || []
      );
      
      this.lastSyncTime = new Date();
      return syncId;
    } catch (error) {
      this.logger.error(`[AutoSyncService] Manual sync failed: ${syncId}`, error);
      
      // Update tracking with error information
      await this.globalAssetTrackingService.updateError(
        syncId,
        error.message,
        error.code || 'UNKNOWN_ERROR',
        error.stack,
      );
      
      throw error;
    }
  }

  /**
   * Scheduled auto sync (runs based on configured interval)
   * Now manages both cache updates and database sync
   * Note: Cron expression is configurable via updateConfig()
   */
  async handleAutoSync(): Promise<void> {
    // Check if auto sync is enabled
    if (!this.autoSyncEnabled) {
      return;
    }

    // For fixed times, check if current time matches any of the fixed times
    if (this.scheduleType === 'fixed_times') {
      if (!this.shouldRunAtFixedTime()) {
        return;
      }
    }

    const syncId = `auto_${Date.now()}`;
    
    // Get total assets in database for proper success rate calculation
    const totalAssetsInDatabase = await this.globalAssetRepository.count({
      where: { 
        isActive: true,
        priceMode: Not(PriceMode.MANUAL)
      }
    });
    
    // Create tracking record
    let tracking = await this.globalAssetTrackingService.createTracking(
      syncId,
      GlobalAssetSyncType.SCHEDULED,
      GlobalAssetSyncSource.CRON_JOB,
      undefined, // triggeredBy
      undefined, // triggerIp
      {
        cronExpression: this.cronExpression,
        timezone: 'Asia/Ho_Chi_Minh',
        autoSyncEnabled: this.autoSyncEnabled,
      }
    );
    
    try {
      // Update tracking status to in progress
      tracking = await this.globalAssetTrackingService.updateProgress(
        syncId,
        GlobalAssetSyncStatus.IN_PROGRESS,
        0, // totalSymbols
        0, // successfulUpdates
        0, // failedUpdates
        0, // totalApis
        0, // successfulApis
        0, // failedApis
      );

      // Step 1: Fetch all market data from external APIs
      const marketDataResult = await this.externalMarketDataService.fetchAllMarketData(syncId);
      
      // Update tracking with API statistics
      const totalApis = Object.keys(marketDataResult.summary.sources).length;
      // Count successful APIs based on whether they have data (non-zero count)
      const successfulApis = Object.values(marketDataResult.summary.sources).filter((source: any) => source > 0).length;
      const failedApis = totalApis - successfulApis;
      

      tracking = await this.globalAssetTrackingService.updateProgress(
        syncId,
        GlobalAssetSyncStatus.IN_PROGRESS,
        totalAssetsInDatabase, // Use database assets count, not API symbols
        0, // successfulUpdates - will be updated after sync
        0, // failedUpdates - will be updated after sync
        totalApis,
        successfulApis,
        failedApis,
      );
      
      // Step 2: Sync to database
      const syncResult = await this.performSync(syncId, marketDataResult, false); // false = auto sync
      
      // Step 3: Update API statistics based on actual API call details
      // Add small delay to ensure all API call details are saved
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.updateApiStatisticsFromCallDetails(syncId);
      
      // Get updated tracking record to get latest API statistics
      const updatedTracking = await this.globalAssetTrackingService.getByExecutionId(syncId);
      if (!updatedTracking) {
        throw new Error(`Tracking record not found for execution ID: ${syncId}`);
      }
      
      // Get final API statistics from updated tracking
      const finalTotalApis = updatedTracking.totalApis || totalApis;
      const finalSuccessfulApis = updatedTracking.successfulApis || 0;
      const finalFailedApis = updatedTracking.failedApis || 0;
      
      // Calculate final success rate for asset updates
      const finalSuccessRate = totalAssetsInDatabase > 0 ? ((syncResult.successfulUpdates || 0) / totalAssetsInDatabase) * 100 : 0;
      
      // Determine final status: BOTH conditions must be met:
      // 1. All APIs must be SUCCESS (finalSuccessfulApis === finalTotalApis)
      // 2. All assets must be updated successfully (finalSuccessRate === 100)
      const allApisSuccessful = finalTotalApis > 0 && finalSuccessfulApis === finalTotalApis && finalFailedApis === 0;
      const allAssetsUpdated = finalSuccessRate === 100;
      
      const finalStatus = (allApisSuccessful && allAssetsUpdated) 
        ? GlobalAssetSyncStatus.COMPLETED 
        : GlobalAssetSyncStatus.FAILED;
      
      // Log status determination for debugging
      if (!allApisSuccessful) {
        this.logger.warn(
          `[AutoSyncService] Sync ${syncId} marked as FAILED: Not all APIs successful. ` +
          `Successful: ${finalSuccessfulApis}/${finalTotalApis}, Failed: ${finalFailedApis}`
        );
      }
      if (!allAssetsUpdated) {
        this.logger.warn(
          `[AutoSyncService] Sync ${syncId} marked as FAILED: Not all assets updated. ` +
          `Success rate: ${finalSuccessRate.toFixed(2)}% (${syncResult.successfulUpdates || 0}/${totalAssetsInDatabase})`
        );
      }
      
      // Update tracking with final results including failed symbols
      tracking = await this.globalAssetTrackingService.updateProgress(
        syncId,
        finalStatus,
        totalAssetsInDatabase, // Use database assets count, not API symbols
        syncResult.successfulUpdates || 0,
        syncResult.failedUpdates || 0,
        finalTotalApis,
        finalSuccessfulApis,
        finalFailedApis,
        syncResult.failedSymbols || [],
      );
      
      this.lastSyncTime = new Date();
    } catch (error) {
      this.logger.error(`[AutoSyncService] Auto sync failed: ${syncId}`, error);
      
      // Update tracking with error information
      await this.globalAssetTrackingService.updateError(
        syncId,
        error.message,
        error.code || 'UNKNOWN_ERROR',
        error.stack,
      );
      
      // Don't throw error for scheduled sync to prevent cron job failure
    }
  }

  /**
   * Map API provider name to MarketDataSource enum
   */
  private mapProviderToSource(provider: string): string {
    const providerMap: Record<string, string> = {
      'Doji': 'DOJI',
      'FMarket': 'FMARKET',
      'Vietcombank': 'VIETCOMBANK',
      'SSI': 'SSI',
      'CoinGecko': 'COINGECKO',
    };
    return providerMap[provider] || provider.toUpperCase();
  }

  /**
   * Get database symbol variations for a given API gold symbol
   * This handles cases where API uses different symbol format than database
   * Example: API returns 'GOLDSJC' but database has 'SJCGOLD' or 'DOJI'
   */
  private getGoldSymbolVariations(apiSymbol: string): string[] {
    const symbol = apiSymbol.toUpperCase();
    
    // Gold symbol mapping: API symbols -> Database symbol variations
    if (symbol === 'GOLDSJC' || symbol.includes('SJC')) {
      return ['GOLDSJC', 'SJCGOLD', 'SJC', 'GOLD-SJC'];
    } else if (symbol === 'GOLDDOJI' || symbol.includes('DOJI')) {
      return ['GOLDDOJI', 'DOJIGOLD', 'DOJI', 'GOLD-DOJI'];
    } else if (symbol === 'GOLDPNJ' || symbol.includes('PNJ')) {
      return ['GOLDPNJ', 'PNJGOLD', 'PNJ', 'GOLD-PNJ'];
    } else if (symbol === 'GOLD' || symbol.includes('VANG') || symbol.includes('9999')) {
      return ['GOLD', 'VANG', 'VANG9999', 'GOLD9999'];
    }
    
    // Return original symbol if no mapping found
    return [apiSymbol];
  }

  /**
   * Perform the actual sync operation with circuit breaker protection
   * Only updates prices for symbols from successful APIs (no fallback)
   */
  private async performSync(syncId: string, marketDataResult?: any, isManual: boolean = false): Promise<{
    successfulUpdates: number;
    failedUpdates: number;
    failedSymbols: string[];
  }> {
    return this.circuitBreakerService.execute(
      'auto-sync-operation',
      async () => {
        
        // Get all active global assets that are NOT MANUAL price mode (includes AUTOMATIC and null)
        const globalAssets = await this.globalAssetRepository.find({
          where: { 
            isActive: true,
            priceMode: Not(PriceMode.MANUAL)
          },
          relations: ['assetPrice']
        });


        let successCount = 0;
        let errorCount = 0;
        const totalAssetsInDatabase = globalAssets.length; // Tổng số assets trong database

        // Get failed API sources from multiple sources
        // Only update prices for symbols from successful APIs (no fallback)
        const failedSources = new Set<string>();
        
        // Method 1: Get from API call details (if available)
        try {
          const apiCallDetails = await this.globalAssetTrackingService.getApiCallDetailsByExecutionId(syncId);
          apiCallDetails.forEach(detail => {
            if (detail.status === 'failed' || detail.status === 'timeout') {
              const source = this.mapProviderToSource(detail.provider);
              failedSources.add(source);
            }
          });
        } catch (error) {
          // API call details not available yet, will use marketDataResult.errors as fallback
        }
        
        // Method 2: Get from marketDataResult.errors (backup method)
        if (marketDataResult && marketDataResult.errors && marketDataResult.errors.length > 0) {
          marketDataResult.errors.forEach((error: any) => {
            if (error.source) {
              failedSources.add(error.source);
            }
          });
        }

        if (failedSources.size > 0) {
          this.logger.warn(
            `[AutoSyncService] ${failedSources.size} API source(s) failed: ${Array.from(failedSources).join(', ')}. ` +
            `Prices from these sources will NOT be updated (no fallback).`
          );
        }

        // Create a map of all market data for quick lookup
        // Only include data from successful API sources
        const marketDataMap = new Map<string, any>();
        
        if (marketDataResult) {
          // Filter and map market data by symbol, excluding failed sources
          const allMarketData = [
            ...marketDataResult.funds, 
            ...marketDataResult.gold, 
            ...marketDataResult.exchangeRates, 
            ...marketDataResult.stocks, 
            ...marketDataResult.crypto
          ];
          
          allMarketData.forEach(item => {
            // Only include data from successful API sources
            if (item.source && !failedSources.has(item.source)) {
              // Normalize symbol to uppercase for case-insensitive matching
              const normalizedSymbol = item.symbol.toUpperCase();
              marketDataMap.set(normalizedSymbol, item);
              
              // For gold assets, add symbol variations to the map for direct lookup
              // API returns 'GOLDSJC' but DB might have 'SJCGOLD' or 'DOJI'
              if (item.type === 'GOLD' || item.type === MarketDataType.GOLD) {
                const apiSymbol = normalizedSymbol;
                const dbSymbolVariations = this.getGoldSymbolVariations(apiSymbol);
                
                // Add all variations to the map for direct lookup (normalized to uppercase)
                dbSymbolVariations.forEach(dbSymbol => {
                  const normalizedDbSymbol = dbSymbol.toUpperCase();
                  if (!marketDataMap.has(normalizedDbSymbol)) {
                    marketDataMap.set(normalizedDbSymbol, item);
                  }
                });
              }
            }
          });
        }

      // Track failed symbols
      const failedSymbols: string[] = [];

      // Update prices for each asset
      for (const asset of globalAssets) {
        try {
          // Only try exact match - NO fuzzy matching/fallback
          // Normalize asset symbol to uppercase for case-insensitive matching
          const normalizedAssetSymbol = asset.symbol.toUpperCase();
          const marketData = marketDataMap.get(normalizedAssetSymbol);
          
          if (!marketData) {
            // No data found for this symbol (either not in market data or from failed API)
            failedSymbols.push(asset.symbol);
            errorCount++;
            continue;
          }
          
          // Check if source is failed (double check)
          if (marketData.source && failedSources.has(marketData.source)) {
            failedSymbols.push(asset.symbol);
            errorCount++;
            this.logger.warn(
              `[AutoSyncService] Skipping ${asset.symbol} - source ${marketData.source} failed`
            );
            continue;
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
          } else {
            failedSymbols.push(asset.symbol);
            errorCount++;
          }
        } catch (error) {
          failedSymbols.push(asset.symbol);
          errorCount++;
          this.logger.error(`[AutoSyncService] Failed to update price for ${asset.symbol}:`, error);
        }
      }

        
        // Calculate success rate based on database assets, not API symbols
        const successRate = totalAssetsInDatabase > 0 ? (successCount / totalAssetsInDatabase) * 100 : 0;
        
        // Return sync results
        return {
          successfulUpdates: successCount,
          failedUpdates: errorCount,
          failedSymbols: failedSymbols,
        };
      },
      {
        failureThreshold: 3, // Open circuit after 3 sync failures
        timeout: 120000, // Wait 2 minutes before trying again
        successThreshold: 2, // Need 2 successes to close circuit
        monitoringPeriod: 600000 // 10 minutes monitoring window
      }
    ).catch(error => {
      this.logger.error(`[AutoSyncService] Sync operation ${syncId} failed:`, error);
      throw error;
    });
  }

  /**
   * Update API statistics based on actual API call details
   */
  private async updateApiStatisticsFromCallDetails(syncId: string): Promise<void> {
    try {
      // Get API call details from the tracking service
      const apiCallDetails = await this.globalAssetTrackingService.getApiCallDetailsByExecutionId(syncId);
      
      if (apiCallDetails.length > 0) {
        const totalApis = apiCallDetails.length;
        const successfulApis = apiCallDetails.filter(detail => detail.status === 'success').length;
        const failedApis = totalApis - successfulApis;
        
        
        // Update tracking record with correct API statistics
        await this.globalAssetTrackingService.updateProgress(
          syncId,
          GlobalAssetSyncStatus.IN_PROGRESS,
          undefined, // totalSymbols
          undefined, // successfulUpdates
          undefined, // failedUpdates
          totalApis,
          successfulApis,
          failedApis,
        );
      } else {
      }
    } catch (error) {
      this.logger.error(`[AutoSyncService] Failed to update API statistics from call details:`, error);
    }
  }

  /**
   * Load configuration from environment
   */
  private loadConfiguration(): void {
    // Load schedule type and configuration
    this.scheduleType = this.configService.get<string>('PRICE_UPDATE_SCHEDULE_TYPE', 'interval') as 'interval' | 'fixed_times';
    this.autoSyncEnabled = this.configService.get<string>('AUTO_SYNC_ENABLED', 'false') === 'true';
    
    if (this.scheduleType === 'fixed_times') {
      // Load fixed times configuration
      this.fixedTimes = this.configService.get<string>('PRICE_UPDATE_FIXED_TIMES', '09:01,15:01,18:50').split(',');
      this.timezone = this.configService.get<string>('PRICE_UPDATE_TIMEZONE', 'Asia/Ho_Chi_Minh');
      this.cronExpression = this.generateFixedTimesCronExpression();
      
    } else {
      // Load interval configuration
      this.syncInterval = parseInt(this.configService.get<string>('PRICE_UPDATE_INTERVAL_MINUTES', '60'), 10);
      this.cronExpression = this.generateCronExpression(this.syncInterval);
      
    }
    
  }

  /**
   * Generate cron expression for fixed times
   * Ultra-optimized: Only run at exact scheduled times
   */
  private generateFixedTimesCronExpression(): string {
    if (this.fixedTimes.length === 1) {
      // Single fixed time - use specific cron expression
      const firstTime = this.fixedTimes[0];
      const [hour, minute] = firstTime.split(':').map(Number);
      return `${minute} ${hour} * * *`;
    } else {
      // Multiple fixed times - create multiple cron expressions
      // This will be handled by setupMultipleCronJobs()
      return this.generateMultipleFixedTimesCron();
    }
  }

  /**
   * Generate cron expression for multiple fixed times
   * Creates a single cron that runs at all specified times
   */
  private generateMultipleFixedTimesCron(): string {
    // For multiple times, we need to create a complex cron expression
    // Format: minute hour * * *
    // We'll use the first time as primary and handle others in shouldRunAtFixedTime()
    const firstTime = this.fixedTimes[0];
    const [hour, minute] = firstTime.split(':').map(Number);
    
    // Use the earliest time as the cron trigger
    // The shouldRunAtFixedTime() will handle checking all times
    return `${minute} ${hour} * * *`;
  }

  /**
   * Get next fixed time sync
   */
  private getNextFixedTimeSync(): Date | null {
    const now = moment().tz(this.timezone);
    const currentTime = now.format('HH:mm');
    
    // Find the next fixed time today
    for (const fixedTime of this.fixedTimes) {
      if (currentTime < fixedTime) {
        const [hour, minute] = fixedTime.split(':').map(Number);
        const nextUpdate = now.clone().hour(hour).minute(minute).second(0);
        return nextUpdate.toDate();
      }
    }
    
    // If no more times today, use the first time tomorrow
    const firstTime = this.fixedTimes[0];
    const [hour, minute] = firstTime.split(':').map(Number);
    const nextUpdate = now.clone().add(1, 'day').hour(hour).minute(minute).second(0);
    return nextUpdate.toDate();
  }

  /**
   * Check if current time matches any of the fixed times
   * Ultra-optimized: Since we have individual cron jobs, this is mainly for single-time scenarios
   */
  private shouldRunAtFixedTime(): boolean {
    // For multiple fixed times with individual cron jobs, this method is not needed
    // Each cron job runs at its exact time
    if (this.fixedTimes.length > 1) {
      return true; // Always run since individual cron jobs handle timing
    }
    
    // For single fixed time, we still need to verify
    const now = moment().tz(this.timezone);
    const currentTime = now.format('HH:mm');
    const currentMinute = now.minute();
    const currentHour = now.hour();
    
    const fixedTime = this.fixedTimes[0];
    const [hour, minute] = fixedTime.split(':').map(Number);
    
    // Exact match
    if (currentHour === hour && currentMinute === minute) {
      return true;
    }
    
    return false;
  }

  /**
   * Get next sync time based on interval
   */
  // private getNextSyncTime(): Date | null {
  //   if (!this.autoSyncEnabled || !this.lastSyncTime) {
  //     return null;
  //   }

  //   const nextSync = new Date(this.lastSyncTime);
  //   nextSync.setMinutes(nextSync.getMinutes() + this.syncInterval);
  //   return nextSync;
  // }

  /**
   * Get circuit breaker statistics for auto sync
   */
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getStats('auto-sync-operation');
  }

  /**
   * Reset circuit breaker for auto sync
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerService.reset('auto-sync-operation');
  }

  /**
   * Cleanup cron job when service is destroyed
   */
  onModuleDestroy(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    // Stop all multiple cron jobs
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs = [];
  }

  /**
   * Normalize various truthy/falsey representations to boolean
   */
  private normalizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      return v === 'true' || v === '1' || v === 'yes' || v === 'on';
    }
    return false;
  }
}