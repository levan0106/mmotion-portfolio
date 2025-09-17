import { Injectable, Logger } from '@nestjs/common';
import { 
  NationConfiguration, 
  NationConfig, 
  NationCode, 
  AssetType, 
  MarketCodeType, 
  PriceSourceType,
  CurrencyType,
  TimezoneType 
} from '../../config/nation-config.interface';
import { NationConfigUtils } from '../../config/nation-config.utils';

/**
 * Service for managing nation configuration in the Global Assets System.
 * Provides methods to access nation-specific defaults and configurations.
 * 
 * CR-005 Global Assets System:
 * - Centralized nation configuration management
 * - Type-safe access to nation-specific defaults
 * - Caching for performance optimization
 * - Integration with nation configuration utilities
 */
@Injectable()
export class NationConfigService {
  private readonly logger = new Logger(NationConfigService.name);
  private config: NationConfiguration | null = null;
  private configCache = new Map<string, any>();

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load nation configuration from file.
   * @private
   */
  private loadConfiguration(): void {
    try {
      this.config = NationConfigUtils.loadConfig();
      this.logger.log('Nation configuration loaded successfully');
    } catch (error) {
      this.logger.error(`Failed to load nation configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reload nation configuration from file.
   * Clears cache and reloads configuration.
   */
  reloadConfiguration(): void {
    try {
      this.config = NationConfigUtils.reloadConfig();
      this.configCache.clear();
      this.logger.log('Nation configuration reloaded successfully');
    } catch (error) {
      this.logger.error(`Failed to reload nation configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get configuration for a specific nation.
   * @param nationCode - Nation code (e.g., 'VN', 'US', 'UK')
   * @returns Nation configuration
   */
  getNationConfig(nationCode: NationCode): NationConfig {
    const cacheKey = `nation_${nationCode}`;
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const nationConfig = NationConfigUtils.getNationConfig(nationCode);
      this.configCache.set(cacheKey, nationConfig);
      return nationConfig;
    } catch (error) {
      this.logger.error(`Failed to get nation configuration for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all available nation codes.
   * @returns Array of nation codes
   */
  getAvailableNations(): NationCode[] {
    const cacheKey = 'available_nations';
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const nations = NationConfigUtils.getAvailableNations();
      this.configCache.set(cacheKey, nations);
      return nations;
    } catch (error) {
      this.logger.error(`Failed to get available nations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get default nation configuration.
   * @returns Default nation configuration
   */
  getDefaultNationConfig(): NationConfig {
    const cacheKey = 'default_nation';
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const defaultConfig = NationConfigUtils.getDefaultNationConfig();
      this.configCache.set(cacheKey, defaultConfig);
      return defaultConfig;
    } catch (error) {
      this.logger.error(`Failed to get default nation configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get default values for a nation.
   * @param nationCode - Nation code
   * @returns Default values object
   */
  getNationDefaults(nationCode: NationCode): {
    currency: CurrencyType;
    timezone: TimezoneType;
    marketCode: MarketCodeType;
    priceSource: PriceSourceType;
  } {
    const cacheKey = `defaults_${nationCode}`;
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const defaults = NationConfigUtils.getNationDefaults(nationCode);
      this.configCache.set(cacheKey, defaults);
      return defaults;
    } catch (error) {
      this.logger.error(`Failed to get nation defaults for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get market codes for a nation.
   * @param nationCode - Nation code
   * @returns Array of market codes
   */
  getMarketCodes(nationCode: NationCode): MarketCodeType[] {
    const cacheKey = `market_codes_${nationCode}`;
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const marketCodes = NationConfigUtils.getMarketCodes(nationCode);
      this.configCache.set(cacheKey, marketCodes);
      return marketCodes;
    } catch (error) {
      this.logger.error(`Failed to get market codes for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get price sources for a nation.
   * @param nationCode - Nation code
   * @returns Array of price sources
   */
  getPriceSources(nationCode: NationCode): PriceSourceType[] {
    const cacheKey = `price_sources_${nationCode}`;
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const priceSources = NationConfigUtils.getPriceSources(nationCode);
      this.configCache.set(cacheKey, priceSources);
      return priceSources;
    } catch (error) {
      this.logger.error(`Failed to get price sources for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get asset type configuration for a nation.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @returns Asset type configuration
   */
  getAssetTypeConfig(nationCode: NationCode, assetType: AssetType): any {
    const cacheKey = `asset_type_${nationCode}_${assetType}`;
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const assetTypeConfig = NationConfigUtils.getAssetTypeConfig(nationCode, assetType);
      this.configCache.set(cacheKey, assetTypeConfig);
      return assetTypeConfig;
    } catch (error) {
      this.logger.error(`Failed to get asset type configuration for ${nationCode}/${assetType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if an asset type is enabled for a nation.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @returns True if enabled, false otherwise
   */
  isAssetTypeEnabled(nationCode: NationCode, assetType: AssetType): boolean {
    const cacheKey = `asset_type_enabled_${nationCode}_${assetType}`;
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const isEnabled = NationConfigUtils.isAssetTypeEnabled(nationCode, assetType);
      this.configCache.set(cacheKey, isEnabled);
      return isEnabled;
    } catch (error) {
      this.logger.error(`Failed to check if asset type is enabled for ${nationCode}/${assetType}: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate symbol format for a nation and asset type.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @param symbol - Symbol to validate
   * @returns True if valid, false otherwise
   */
  validateSymbolFormat(nationCode: NationCode, assetType: AssetType, symbol: string): boolean {
    try {
      return NationConfigUtils.validateSymbolFormat(nationCode, assetType, symbol);
    } catch (error) {
      this.logger.error(`Failed to validate symbol format for ${nationCode}/${assetType}/${symbol}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get trading hours for a nation.
   * @param nationCode - Nation code
   * @returns Trading hours configuration
   */
  getTradingHours(nationCode: NationCode): any {
    const cacheKey = `trading_hours_${nationCode}`;
    
    if (this.configCache.has(cacheKey)) {
      return this.configCache.get(cacheKey);
    }

    try {
      const tradingHours = NationConfigUtils.getTradingHours(nationCode);
      this.configCache.set(cacheKey, tradingHours);
      return tradingHours;
    } catch (error) {
      this.logger.error(`Failed to get trading hours for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a nation is currently in trading hours.
   * @param nationCode - Nation code
   * @returns True if in trading hours, false otherwise
   */
  isInTradingHours(nationCode: NationCode): boolean {
    try {
      return NationConfigUtils.isInTradingHours(nationCode);
    } catch (error) {
      this.logger.error(`Failed to check trading hours for ${nationCode}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get default market code for a nation and asset type.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @returns Default market code
   */
  getDefaultMarketCode(nationCode: NationCode, assetType: AssetType): MarketCodeType {
    try {
      const assetTypeConfig = this.getAssetTypeConfig(nationCode, assetType);
      return assetTypeConfig.defaultMarketCode;
    } catch (error) {
      this.logger.error(`Failed to get default market code for ${nationCode}/${assetType}: ${error.message}`);
      // Fallback to nation's default market code
      const nationConfig = this.getNationConfig(nationCode);
      return nationConfig.defaultMarketCode;
    }
  }

  /**
   * Get default price source for a nation.
   * @param nationCode - Nation code
   * @returns Default price source
   */
  getDefaultPriceSource(nationCode: NationCode): PriceSourceType {
    try {
      const nationConfig = this.getNationConfig(nationCode);
      return nationConfig.defaultPriceSource;
    } catch (error) {
      this.logger.error(`Failed to get default price source for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get currency for a nation.
   * @param nationCode - Nation code
   * @returns Currency code
   */
  getCurrency(nationCode: NationCode): CurrencyType {
    try {
      const nationConfig = this.getNationConfig(nationCode);
      return nationConfig.currency;
    } catch (error) {
      this.logger.error(`Failed to get currency for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get timezone for a nation.
   * @param nationCode - Nation code
   * @returns Timezone
   */
  getTimezone(nationCode: NationCode): TimezoneType {
    try {
      const nationConfig = this.getNationConfig(nationCode);
      return nationConfig.timezone;
    } catch (error) {
      this.logger.error(`Failed to get timezone for ${nationCode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clear configuration cache.
   * Useful for testing or when configuration changes.
   */
  clearCache(): void {
    this.configCache.clear();
    this.logger.log('Configuration cache cleared');
  }

  /**
   * Get cache statistics.
   * @returns Cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.configCache.size,
      keys: Array.from(this.configCache.keys()),
    };
  }

  /**
   * Check if a nation code is valid.
   * @param nationCode - Nation code to validate
   * @returns True if valid, false otherwise
   */
  isValidNationCode(nationCode: string): nationCode is NationCode {
    try {
      const availableNations = this.getAvailableNations();
      return availableNations.includes(nationCode as NationCode);
    } catch {
      return false;
    }
  }

  /**
   * Get nation display name.
   * @param nationCode - Nation code
   * @returns Nation display name
   */
  getNationDisplayName(nationCode: NationCode): string {
    try {
      const nationConfig = this.getNationConfig(nationCode);
      return nationConfig.displayName;
    } catch (error) {
      this.logger.error(`Failed to get nation display name for ${nationCode}: ${error.message}`);
      return nationCode;
    }
  }

  /**
   * Get market code display name.
   * @param nationCode - Nation code
   * @param marketCode - Market code
   * @returns Market code display name
   */
  getMarketCodeDisplayName(nationCode: NationCode, marketCode: MarketCodeType): string {
    try {
      const nationConfig = this.getNationConfig(nationCode);
      const marketCodeConfig = nationConfig.marketCodes.find(mc => mc.code === marketCode);
      return marketCodeConfig?.displayName || marketCode;
    } catch (error) {
      this.logger.error(`Failed to get market code display name for ${nationCode}/${marketCode}: ${error.message}`);
      return marketCode;
    }
  }

  /**
   * Get price source display name.
   * @param nationCode - Nation code
   * @param priceSource - Price source
   * @returns Price source display name
   */
  getPriceSourceDisplayName(nationCode: NationCode, priceSource: PriceSourceType): string {
    try {
      const nationConfig = this.getNationConfig(nationCode);
      const priceSourceConfig = nationConfig.priceSources.find(ps => ps.code === priceSource);
      return priceSourceConfig?.displayName || priceSource;
    } catch (error) {
      this.logger.error(`Failed to get price source display name for ${nationCode}/${priceSource}: ${error.message}`);
      return priceSource;
    }
  }
}
