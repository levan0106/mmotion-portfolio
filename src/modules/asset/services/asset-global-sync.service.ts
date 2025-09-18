import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '../entities/asset.entity';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { NationConfigService } from './nation-config.service';

export interface AssetSyncData {
  symbol: string;
  name: string;
  type: AssetType;
  currency: string;
  userId: string;
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
  ) {
    console.log('[SYNC SERVICE] AssetGlobalSyncService constructor called');
  }

  /**
   * Sync asset with global asset when creating new asset
   * @param assetData - Asset data to sync
   * @returns GlobalAsset ID if created/found
   */
  async syncAssetOnCreate(assetData: AssetSyncData): Promise<string | null> {
    try {
      console.log(`[SYNC SERVICE] Starting sync for asset: ${assetData.symbol}`);
      this.logger.log(`Syncing asset on create: ${assetData.symbol}`);

      // Check if global asset already exists
      let globalAsset = await this.globalAssetRepository.findOne({
        where: { symbol: assetData.symbol }
      });

      if (globalAsset) {
        console.log(`[SYNC SERVICE] Global asset already exists: ${globalAsset.id}`);
        this.logger.log(`Global asset already exists: ${globalAsset.id}`);
        return globalAsset.id;
      }

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
      });

      const savedGlobalAsset = await this.globalAssetRepository.save(globalAsset);
      this.logger.log(`Created new global asset: ${savedGlobalAsset.id}`);

      return savedGlobalAsset.id;
    } catch (error) {
      this.logger.error(`Failed to sync asset on create: ${error.message}`, error.stack);
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
        return await this.syncAssetOnCreate({
          symbol: asset.symbol,
          name: asset.name,
          type: asset.type,
        currency: 'VND', // Default currency for now
        userId: asset.createdBy,
        });
      }

      // Update global asset if needed
      const needsUpdate = 
        (assetData.name && globalAsset.name !== assetData.name) ||
        (assetData.type && globalAsset.type !== assetData.type) ||
        (assetData.currency && globalAsset.currency !== assetData.currency);

      if (needsUpdate) {
        this.logger.log(`Updating global asset: ${globalAsset.id}`);
        
        if (assetData.name) globalAsset.name = assetData.name;
        if (assetData.type) globalAsset.type = assetData.type;
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
        this.logger.log(`Updated global asset: ${globalAsset.id}`);
      }

      return globalAsset.id;
    } catch (error) {
      this.logger.error(`Failed to sync asset on update: ${error.message}`, error.stack);
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
}
