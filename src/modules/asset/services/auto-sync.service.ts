import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetPrice } from '../entities/asset-price.entity';
import { MarketDataService } from './market-data.service';

@Injectable()
export class AutoSyncService {
  private readonly logger = new Logger(AutoSyncService.name);
  private autoSyncEnabled = false;
  private lastSyncTime: Date | null = null;
  private readonly syncInterval = 15; // 15 minutes

  constructor(
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
    private readonly marketDataService: MarketDataService,
  ) {
    // Load auto sync status from environment or database
    this.loadAutoSyncStatus();
  }

  /**
   * Get current auto sync status
   */
  async getStatus(): Promise<{
    enabled: boolean;
    lastSync?: string;
    nextSync?: string;
    interval: number;
  }> {
    const nextSync = this.getNextSyncTime();
    
    return {
      enabled: this.autoSyncEnabled,
      lastSync: this.lastSyncTime?.toISOString(),
      nextSync: nextSync?.toISOString(),
      interval: this.syncInterval,
    };
  }

  /**
   * Toggle auto sync on/off
   */
  async toggle(enabled: boolean): Promise<void> {
    this.autoSyncEnabled = enabled;
    this.logger.log(`Auto sync ${enabled ? 'enabled' : 'disabled'}`);
    
    // In a real implementation, you might want to persist this setting
    // to a configuration table or environment variable
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(): Promise<string> {
    const syncId = `manual_${Date.now()}`;
    this.logger.log(`Manual sync triggered: ${syncId}`);
    
    try {
      await this.performSync(syncId);
      this.lastSyncTime = new Date();
      this.logger.log(`Manual sync completed: ${syncId}`);
    } catch (error) {
      this.logger.error(`Manual sync failed: ${syncId}`, error);
      throw error;
    }
    
    return syncId;
  }

  /**
   * Scheduled auto sync (runs every 15 minutes)
   */
  @Cron('0 */15 * * * *') // Every 15 minutes
  async handleAutoSync(): Promise<void> {
    if (!this.autoSyncEnabled) {
      this.logger.debug('Auto sync is disabled, skipping scheduled sync');
      return;
    }

    const syncId = `auto_${Date.now()}`;
    this.logger.log(`Auto sync triggered: ${syncId}`);
    
    try {
      await this.performSync(syncId);
      this.lastSyncTime = new Date();
      this.logger.log(`Auto sync completed: ${syncId}`);
    } catch (error) {
      this.logger.error(`Auto sync failed: ${syncId}`, error);
      // Don't throw error for scheduled sync to prevent cron job failure
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(syncId: string): Promise<void> {
    this.logger.log(`Starting sync operation: ${syncId}`);
    
    try {
      // Get all active global assets
      const globalAssets = await this.globalAssetRepository.find({
        where: { isActive: true },
        relations: ['assetPrice']
      });

      this.logger.log(`Found ${globalAssets.length} active global assets to sync`);

      let successCount = 0;
      let errorCount = 0;

      // Update prices for each asset
      for (const asset of globalAssets) {
        try {
          // For now, use a mock price. In production, this would call external API
          const currentPrice = this.getMockPrice(asset.symbol);
          
          if (currentPrice && currentPrice > 0) {
            // Update or create asset price
            if (asset.assetPrice) {
              await this.assetPriceRepository.update(asset.assetPrice.id, {
                currentPrice: currentPrice,
                priceType: 'MARKET',
                priceSource: 'AUTO_SYNC',
                lastPriceUpdate: new Date(),
              });
            } else {
              const newAssetPrice = this.assetPriceRepository.create({
                assetId: asset.id,
                currentPrice: currentPrice,
                priceType: 'MARKET',
                priceSource: 'AUTO_SYNC',
                lastPriceUpdate: new Date(),
              });
              await this.assetPriceRepository.save(newAssetPrice);
            }
            
            successCount++;
            this.logger.debug(`Updated price for ${asset.symbol}: ${currentPrice}`);
          } else {
            this.logger.warn(`No valid price found for ${asset.symbol}`);
          }
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to update price for ${asset.symbol}:`, error);
        }
      }

      this.logger.log(`Sync operation completed: ${syncId} - Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      this.logger.error(`Sync operation failed: ${syncId}`, error);
      throw error;
    }
  }

  /**
   * Get next sync time
   */
  private getNextSyncTime(): Date | null {
    if (!this.autoSyncEnabled) {
      return null;
    }

    const now = new Date();
    const nextSync = new Date(now.getTime() + (this.syncInterval * 60 * 1000));
    return nextSync;
  }

  /**
   * Load auto sync status from configuration
   */
  private loadAutoSyncStatus(): void {
    // In a real implementation, load from database or environment
    // For now, default to disabled
    this.autoSyncEnabled = process.env.AUTO_SYNC_ENABLED === 'true' || false;
    this.logger.log(`Auto sync status loaded: ${this.autoSyncEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get mock price for testing purposes
   * In production, this would call external market data APIs
   */
  private getMockPrice(symbol: string): number {
    // Generate a realistic price based on symbol
    const basePrice = 1000 + (symbol.charCodeAt(0) * 100);
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    return Math.round(basePrice * (1 + variation) * 100) / 100;
  }
}
