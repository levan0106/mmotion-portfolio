import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { PriceType, PriceSource } from '../enums/price-type.enum';
import { NationConfigService } from './nation-config.service';
import { BasicPriceService } from './basic-price.service';
import { ExternalMarketDataService } from '../../market-data/services/external-market-data.service';
import { PriceMode } from '../enums/price-mode.enum';

export interface AssetSyncData {
  symbol: string;
  name: string;
  type: AssetType;
  currency: string;
  userId: string;
  priceMode?: string;
  manualPrice?: number;
}

@Injectable()
export class AssetGlobalSyncService {
  private readonly logger = new Logger(AssetGlobalSyncService.name);

  constructor(
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    private readonly nationConfigService: NationConfigService,
    private readonly basicPriceService: BasicPriceService,
    @Optional() private readonly externalMarketDataService?: ExternalMarketDataService,
  ) {}

  /**
   * Sync asset with global asset when creating new asset
   * @param assetData - Asset data to sync
   * @returns GlobalAsset ID if created/found
   */
  async syncAssetOnCreate(assetData: AssetSyncData): Promise<string | null> {
    try {
      this.logger.log(`Syncing asset on create: ${assetData.symbol}`);

      // Check if global asset already exists
      let globalAsset = await this.globalAssetRepository.findOne({
        where: { symbol: assetData.symbol }
      });

      if (globalAsset) {
        this.logger.log(`Global asset already exists: ${globalAsset.id} for symbol: ${assetData.symbol}`);
        
        // Ensure market price exists even if global asset already exists
        await this.ensureMarketPriceExists(globalAsset.id, assetData.userId);
        
        return globalAsset.id;
      }

      this.logger.log(`No existing global asset found for symbol: ${assetData.symbol}, creating new one...`);

      // Get nation config for user's currency - default to VN for now
      let nationCode = 'VN';
      try {
        // Try to find nation by currency
        const allConfigs = Object.keys(this.nationConfigService['config'] || {});
        const foundNation = allConfigs.find(code => {
          const config = this.nationConfigService.getNationConfig(code as any);
          return config.currency === assetData.currency;
        });
        if (foundNation) {
          nationCode = foundNation;
        }
      } catch (error) {
        this.logger.warn(`Could not find nation for currency ${assetData.currency}, using VN as default`);
      }

      // Create new global asset
      globalAsset = this.globalAssetRepository.create({
        symbol: assetData.symbol,
        name: assetData.name,
        type: assetData.type,
        nation: nationCode,
        currency: assetData.currency,
        marketCode: 'HOSE', // Default market code for VN
        timezone: 'Asia/Ho_Chi_Minh', // Default timezone for VN
        isActive: true,
        priceMode: assetData.priceMode as any || 'AUTOMATIC', // Use user's priceMode or default to AUTOMATIC
        createdBy: assetData.userId,
      });

      console.log(`[SYNC SERVICE] Creating global asset with symbol: ${assetData.symbol}, name: ${assetData.name}`);
      const savedGlobalAsset = await this.globalAssetRepository.save(globalAsset);
      console.log(`[SYNC SERVICE] Created new global asset: ${savedGlobalAsset.id} with symbol: ${savedGlobalAsset.symbol}`);
      this.logger.log(`Created new global asset: ${savedGlobalAsset.id} with symbol: ${savedGlobalAsset.symbol}`);

      // Create initial market price record for the global asset
      await this.createInitialMarketPrice(savedGlobalAsset.id, assetData.userId, assetData.manualPrice);

      return savedGlobalAsset.id;
    } catch (error) {
      this.logger.error(`Failed to sync asset on create: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Update global asset price simply (like priceMode update)
   * @param globalAssetId - Global asset ID
   * @param newPrice - New price value
   * @returns Updated AssetPrice ID or null if failed
   */
  private async updateGlobalAssetPrice(globalAssetId: string, newPrice: number): Promise<string | null> {
    try {
      console.log(`[SYNC SERVICE] Updating global asset price: ${globalAssetId} with new price: ${newPrice}`);
      
      // Update existing price with new value
      const priceResponse = await this.basicPriceService.updateByAssetId(globalAssetId, {
        currentPrice: newPrice,
        priceType: PriceType.MANUAL,
        priceSource: PriceSource.USER_INPUT,
        metadata: {
          is_manual_update: true,
          note: `Manual price update: ${newPrice}`,
          market_source: 'manual',
          updated_at: new Date().toISOString()
        }
      });

      console.log(`[SYNC SERVICE] Updated global asset price: ${globalAssetId} to ${newPrice}`);
      this.logger.log(`Updated global asset price: ${globalAssetId} to ${newPrice}`);
      
      return priceResponse.id;
    } catch (error) {
      this.logger.error(`Failed to update global asset price: ${error.message}`, error.stack);
      return null;
    }
  }


  /**
   * Create initial market price record for a global asset using BasicPriceService
   * Tries to fetch real market price first, falls back to default value 1 if no market data available
   * Only creates if it doesn't already exist to avoid overwriting existing prices
   * @param globalAssetId - Global asset ID
   * @param userId - User ID who created the asset
   * @returns Created AssetPrice ID or null if already exists
   */
  private async createInitialMarketPrice(globalAssetId: string, userId?: string, manualPrice?: number): Promise<string | null> {
    try {
      console.log(`[SYNC SERVICE] Checking if market price exists for global asset: ${globalAssetId}, userId: ${userId}`);
      
      // First check if price already exists
      const existingPrice = await this.basicPriceService.findByAssetId(globalAssetId);
      if (existingPrice) {
        console.log(`[SYNC SERVICE] Market price already exists for global asset: ${globalAssetId}, skipping creation`);
        this.logger.log(`Market price already exists for global asset: ${globalAssetId}, skipping creation`);
        return existingPrice.id;
      }

      console.log(`[SYNC SERVICE] No existing market price found, fetching market data for global asset: ${globalAssetId}`);
      
      // Get asset information to fetch market price
      const globalAsset = await this.globalAssetRepository.findOne({
        where: { id: globalAssetId }
      });
      
      if (!globalAsset) {
        this.logger.error(`Global asset not found: ${globalAssetId}`);
        return null;
      }

      // Use manual price if provided, otherwise use default price
      const currentPrice = manualPrice || 1; // Use manual price or default
      const priceType = manualPrice ? PriceType.MANUAL : PriceType.MANUAL;
      const priceSource = manualPrice ? PriceSource.USER_INPUT : PriceSource.USER_INPUT;
      const metadata = {
        created_by: userId || 'asset_creation',
        is_initial: true,
        note: manualPrice ? `Manual price: ${manualPrice}` : 'Default price - market data will be fetched in background',
        market_source: manualPrice ? 'manual' : 'default',
        created_at: new Date().toISOString(),
        needs_market_update: !manualPrice // Only need market update if no manual price provided
      };
      
      console.log(`[SYNC SERVICE] Using ${manualPrice ? 'manual' : 'default'} price: ${currentPrice} for asset: ${globalAsset.symbol}`);
      
      // ✅ BACKGROUND PRICE FETCHING: Schedule market price update in background only if no manual price
      if (!manualPrice) {
        this.scheduleMarketPriceUpdate(globalAsset);
      }

      // Use BasicPriceService to create market price
      const priceResponse = await this.basicPriceService.create({
        assetId: globalAssetId,
        currentPrice,
        priceType,
        priceSource,
        lastPriceUpdate: new Date().toISOString(),
        metadata
      });

      this.logger.log(`Created initial market price: ${priceResponse.id} for global asset: ${globalAssetId} with price: ${currentPrice}`);
      return priceResponse.id;
    } catch (error) {
      // If price already exists, that's fine - just log and continue
      if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
        console.log(`[SYNC SERVICE] Market price already exists for global asset: ${globalAssetId}, skipping creation`);
        return null;
      }
      this.logger.error(`Failed to create initial market price: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Fetch market price for a global asset using ExternalMarketDataService
   * Tries multiple external sources: Fund, Gold, Stock, Crypto, Exchange Rate APIs
   * @param globalAsset - Global asset to fetch price for
   * @returns Market price or null if not available
   */
  private async fetchMarketPriceForAsset(globalAsset: GlobalAsset): Promise<number | null> {
    try {
      console.log(`[SYNC SERVICE] Fetching market price for asset: ${globalAsset.symbol}.${globalAsset.nation}`);
      
      // Try to get price from ExternalMarketDataService first (if available)
      if (this.externalMarketDataService) {
        try {
          const priceResult = await this.externalMarketDataService.getPriceBySymbol(globalAsset.symbol);
          if (priceResult && priceResult.success && priceResult.price > 0) {
            console.log(`[SYNC SERVICE] Found market price from ExternalMarketDataService: ${priceResult.price} for ${globalAsset.symbol} (${priceResult.type} from ${priceResult.source})`);
            return priceResult.price;
          }
        } catch (error) {
          console.log(`[SYNC SERVICE] ExternalMarketDataService failed for ${globalAsset.symbol}: ${error.message}`);
        }
      } else {
        console.log(`[SYNC SERVICE] ExternalMarketDataService not available, skipping external market data fetch`);
      }


      console.log(`[SYNC SERVICE] No market price found for ${globalAsset.symbol}.${globalAsset.nation}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to fetch market price for ${globalAsset.symbol}: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Sync asset with global asset when updating asset
   * @param assetId - Asset ID being updated
   * @param assetData - Updated asset data
   * @returns GlobalAsset ID if updated/found
   */
  async syncAssetOnUpdate(assetId: string, assetData: Partial<AssetSyncData>): Promise<string | null> {
    try {
      this.logger.log(`Syncing asset on update: ${assetId}`);

      // Get current asset
      const asset = await this.assetRepository.findOne({
        where: { id: assetId }
      });

      if (!asset) {
        this.logger.warn(`Asset not found: ${assetId}`);
        return null;
      }

      // Check if global asset exists
      let globalAsset = await this.globalAssetRepository.findOne({
        where: { symbol: asset.symbol }
      });

      if (!globalAsset) {
        // Create global asset if it doesn't exist
        this.logger.log(`Global asset not found, creating new one for: ${asset.symbol}`);
        const globalAssetId = await this.syncAssetOnCreate({
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
          currency: 'VND', // Default currency for now
          userId: asset.createdBy,
          priceMode: asset.priceMode as any
        });
        // If manual price is provided, update the price directly
        if (assetData.priceMode === PriceMode.MANUAL && assetData.manualPrice !== undefined) {
          await this.updateGlobalAssetPrice(globalAssetId, assetData.manualPrice);
        }
        return globalAssetId;
      }

      // Update global asset if needed
      const needsUpdate = 
        (assetData.name && globalAsset.name !== assetData.name) ||
        (assetData.type && globalAsset.type !== assetData.type) ||
        (assetData.currency && globalAsset.currency !== assetData.currency) ||
        (assetData.priceMode && globalAsset.priceMode !== assetData.priceMode) ||
        (assetData.manualPrice !== undefined);

      console.log(`[SYNC SERVICE] needsUpdate: ${needsUpdate}`);
      if (needsUpdate) {
        // this.logger.log(`Updating global asset: ${globalAsset.id} createdby: ${globalAsset.createdBy} editBy: ${assetData.userId}`);
        
        // only update global asset if this asset is owned by the user
        if (globalAsset.createdBy === assetData.userId) {
          // console.log(`[SYNC SERVICE] Updating global asset: ${globalAsset.id} createdby: ${globalAsset.createdBy} editBy: ${assetData.userId}`);
          if (assetData.name) globalAsset.name = assetData.name;
          if (assetData.type) globalAsset.type = assetData.type;
          if (assetData.priceMode) globalAsset.priceMode = assetData.priceMode as any;
          if (assetData.currency) {
            globalAsset.currency = assetData.currency;
            // Update nation if currency changed
            let nationCode = 'VN';
            try {
              const allConfigs = Object.keys(this.nationConfigService['config'] || {});
              const foundNation = allConfigs.find(code => {
                const config = this.nationConfigService.getNationConfig(code as any);
                return config.currency === assetData.currency;
              });
              if (foundNation) {
                nationCode = foundNation;
              }
            } catch (error) {
              this.logger.warn(`Could not find nation for currency ${assetData.currency}, keeping current nation`);
            }
            globalAsset.nation = nationCode;
          }
          await this.globalAssetRepository.save(globalAsset);
          // this.logger.log(`Updated global asset: ${globalAsset.id}`);

          // If manual price is provided, update the price directly
          if (assetData.priceMode === PriceMode.MANUAL && assetData.manualPrice !== undefined) {
            await this.updateGlobalAssetPrice(globalAsset.id, assetData.manualPrice);
          }
        }
      }

      // Ensure market price record exists for the global asset
      await this.ensureMarketPriceExists(globalAsset.id, assetData.userId);

      return globalAsset.id;
    } catch (error) {
      this.logger.error(`Failed to sync asset on update: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Ensure market price record exists for a global asset
   * Only creates if it doesn't already exist to avoid overwriting existing prices
   * @param globalAssetId - Global asset ID
   * @param userId - User ID who created the asset
   * @returns AssetPrice ID if created/found
   */
  private async ensureMarketPriceExists(globalAssetId: string, userId?: string): Promise<string | null> {
    try {
      console.log(`[SYNC SERVICE] Ensuring market price exists for global asset: ${globalAssetId}`);
      
      // Check if price already exists first
      const existingPrice = await this.basicPriceService.findByAssetId(globalAssetId);
      if (existingPrice) {
        console.log(`[SYNC SERVICE] Market price already exists for global asset: ${globalAssetId}, no action needed`);
        return existingPrice.id;
      }

      // Create market price if it doesn't exist
      return await this.createInitialMarketPrice(globalAssetId, userId);
    } catch (error) {
      this.logger.error(`Failed to ensure market price exists: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get current price from global asset
   * @param symbol - Asset symbol
   * @returns Current price or null if not found
   */
  async getCurrentPriceFromGlobalAsset(symbol: string): Promise<number | null> {
    try {
      const globalAsset = await this.globalAssetRepository.findOne({
        where: { symbol },
        relations: ['assetPrice']
      });

      if (!globalAsset || !globalAsset.assetPrice) {
        this.logger.debug(`No price data found for symbol: ${symbol}`);
        return null;
      }

      return globalAsset.assetPrice.currentPrice;
    } catch (error) {
      this.logger.error(`Failed to get current price from global asset: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Schedule market price update in background (non-blocking)
   * @private
   */
  private scheduleMarketPriceUpdate(globalAsset: any): void {
    // Use setImmediate to run in next tick (non-blocking)
    setImmediate(async () => {
      try {
        console.log(`[SYNC SERVICE] Starting background market price update for: ${globalAsset.symbol}`);
        
        // Fetch market price in background
        const marketPrice = await this.fetchMarketPriceForAsset(globalAsset);
        
        if (marketPrice && marketPrice > 0) {
          // Update the price with real market data
          await this.basicPriceService.updateByAssetId(globalAsset.id, {
            currentPrice: marketPrice,
            priceType: PriceType.EXTERNAL,
            priceSource: PriceSource.EXTERNAL_API
          });
          
          console.log(`[SYNC SERVICE] Background market price update completed for: ${globalAsset.symbol}, new price: ${marketPrice}`);
        } else {
          console.log(`[SYNC SERVICE] No market data available for background update: ${globalAsset.symbol}`);
        }
      } catch (error) {
        console.error(`[SYNC ERROR] Background market price update failed for ${globalAsset.symbol}: ${error.message}`);
      }
    });
  }

  /**
   * Get global asset by symbol
   * @param symbol - Asset symbol
   * @returns GlobalAsset or null if not found
   */
  async getGlobalAssetBySymbol(symbol: string): Promise<GlobalAsset | null> {
    try {
      return await this.globalAssetRepository.findOne({
        where: { symbol },
        relations: ['assetPrice']
      });
    } catch (error) {
      this.logger.error(`Failed to get global asset by symbol: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Get global asset by ID
   * @param id - Global asset ID
   * @returns GlobalAsset or null if not found
   */
  async getGlobalAssetById(id: string): Promise<GlobalAsset | null> {
    try {
      return await this.globalAssetRepository.findOne({
        where: { id },
        relations: ['assetPrice']
      });
    } catch (error) {
      this.logger.error(`Failed to get global asset by ID: ${error.message}`, error.stack);
      return null;
    }
  }
}
