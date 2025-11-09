import { Injectable, Logger } from '@nestjs/common';
import { AssetType } from '../enums/asset-type.enum';
import { NationCode, NationConfig, NationConfigDefaults, 
  AssetTypeConfig, TradingHours, MarketCode, PriceSource } from '../../../config/nation-config.interface';

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
  private config: Record<string, NationConfig> = {};

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load nation configuration from file.
   * @private
   */
  private loadConfiguration(): void {
    try {
      // Mock configuration for now
      this.config = {
        VN: {
          name: 'Vietnam',
          displayName: 'Việt Nam',
          currency: 'VND',
          timezone: 'Asia/Ho_Chi_Minh',
          marketCodes: [
            { code: 'HOSE', name: 'Ho Chi Minh Stock Exchange', displayName: 'Sàn giao dịch chứng khoán TP.HCM', isDefault: true },
            { code: 'HNX', name: 'Hanoi Stock Exchange', displayName: 'Sàn giao dịch chứng khoán Hà Nội', isDefault: false },
            { code: 'UPCOM', name: 'Unlisted Public Company Market', displayName: 'Thị trường giao dịch của các công ty đại chúng chưa niêm yết', isDefault: false }
          ],
          defaultMarketCode: 'HOSE',
          assetTypes: {
            STOCK: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Cổ phiếu' },
            BOND: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Trái phiếu' },
            GOLD: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Vàng' },
            CRYPTO: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Tài sản số' },
            COMMODITY: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Hàng hóa' },
            REALESTATE: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Bất động sản' },
            OTHER: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Khác' },
            DEPOSIT: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Tiền gửi' },
            CASH: { enabled: true, defaultMarketCode: 'HOSE', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Tiền mặt' }
          },
          priceSources: [
            { code: 'VNDIRECT', name: 'VnDirect', displayName: 'VnDirect', isDefault: true, enabled: true },
            { code: 'CAFEF', name: 'Cafef', displayName: 'Cafef', isDefault: false, enabled: true },
            { code: 'VIETCOMBANK', name: 'Vietcombank', displayName: 'Vietcombank', isDefault: false, enabled: true }
          ],
          defaultPriceSource: 'VNDIRECT',
          tradingHours: {
            timezone: 'Asia/Ho_Chi_Minh',
            sessions: [
              { name: 'Morning', start: '09:00', end: '11:30', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
              { name: 'Afternoon', start: '13:00', end: '15:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
            ]
          }
        },
        US: {
          name: 'United States',
          displayName: 'United States',
          currency: 'USD',
          timezone: 'America/New_York',
          marketCodes: [
            { code: 'NYSE', name: 'New York Stock Exchange', displayName: 'New York Stock Exchange', isDefault: true },
            { code: 'NASDAQ', name: 'NASDAQ', displayName: 'NASDAQ', isDefault: false }
          ],
          defaultMarketCode: 'NYSE',
          assetTypes: {
            STOCK: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Stocks' },
            BOND: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Bonds' },
            GOLD: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Gold' },
            CRYPTO: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Cryptocurrency' },
            COMMODITY: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Commodities' },
            REALESTATE: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Real Estate' },
            OTHER: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Other' },
            DEPOSIT: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Deposits' },
            CASH: { enabled: true, defaultMarketCode: 'NYSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Cash' }
          },
          priceSources: [
            { code: 'YAHOO', name: 'Yahoo Finance', displayName: 'Yahoo Finance', isDefault: true, enabled: true },
            { code: 'ALPHA_VANTAGE', name: 'Alpha Vantage', displayName: 'Alpha Vantage', isDefault: false, enabled: true }
          ],
          defaultPriceSource: 'YAHOO',
          tradingHours: {
            timezone: 'America/New_York',
            sessions: [
              { name: 'Regular', start: '09:30', end: '16:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
            ]
          }
        },
        UK: {
          name: 'United Kingdom',
          displayName: 'United Kingdom',
          currency: 'GBP',
          timezone: 'Europe/London',
          marketCodes: [
            { code: 'LSE', name: 'London Stock Exchange', displayName: 'London Stock Exchange', isDefault: true }
          ],
          defaultMarketCode: 'LSE',
          assetTypes: {
            STOCK: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Stocks' },
            BOND: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Bonds' },
            GOLD: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Gold' },
            CRYPTO: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Cryptocurrency' },
            COMMODITY: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Commodities' },
            REALESTATE: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Real Estate' },
            OTHER: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Other' },
            DEPOSIT: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Deposits' },
            CASH: { enabled: true, defaultMarketCode: 'LSE', symbolPattern: '^[A-Z]{1,5}$', description: 'Cash' }
          },
          priceSources: [
            { code: 'LSE', name: 'London Stock Exchange', displayName: 'London Stock Exchange', isDefault: true, enabled: true }
          ],
          defaultPriceSource: 'LSE',
          tradingHours: {
            timezone: 'Europe/London',
            sessions: [
              { name: 'Regular', start: '08:00', end: '16:30', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
            ]
          }
        },
        JP: {
          name: 'Japan',
          displayName: 'Japan',
          currency: 'JPY',
          timezone: 'Asia/Tokyo',
          marketCodes: [
            { code: 'TSE', name: 'Tokyo Stock Exchange', displayName: 'Tokyo Stock Exchange', isDefault: true }
          ],
          defaultMarketCode: 'TSE',
          assetTypes: {
            STOCK: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Stocks' },
            BOND: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Bonds' },
            GOLD: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Gold' },
            CRYPTO: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Cryptocurrency' },
            COMMODITY: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Commodities' },
            REALESTATE: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Real Estate' },
            OTHER: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Other' },
            DEPOSIT: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Deposits' },
            CASH: { enabled: true, defaultMarketCode: 'TSE', symbolPattern: '^[0-9]{4}$', description: 'Cash' }
          },
          priceSources: [
            { code: 'TSE', name: 'Tokyo Stock Exchange', displayName: 'Tokyo Stock Exchange', isDefault: true, enabled: true }
          ],
          defaultPriceSource: 'TSE',
          tradingHours: {
            timezone: 'Asia/Tokyo',
            sessions: [
              { name: 'Morning', start: '09:00', end: '11:30', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
              { name: 'Afternoon', start: '12:30', end: '15:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
            ]
          }
        },
        SG: {
          name: 'Singapore',
          displayName: 'Singapore',
          currency: 'SGD',
          timezone: 'Asia/Singapore',
          marketCodes: [
            { code: 'SGX', name: 'Singapore Exchange', displayName: 'Singapore Exchange', isDefault: true }
          ],
          defaultMarketCode: 'SGX',
          assetTypes: {
            STOCK: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Stocks' },
            BOND: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Bonds' },
            GOLD: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Gold' },
            CRYPTO: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Cryptocurrency' },
            COMMODITY: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Commodities' },
            REALESTATE: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Real Estate' },
            OTHER: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Other' },
            DEPOSIT: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Deposits' },
            CASH: { enabled: true, defaultMarketCode: 'SGX', symbolPattern: '^[A-Z0-9]{3,10}$', description: 'Cash' }
          },
          priceSources: [
            { code: 'SGX', name: 'Singapore Exchange', displayName: 'Singapore Exchange', isDefault: true, enabled: true }
          ],
          defaultPriceSource: 'SGX',
          tradingHours: {
            timezone: 'Asia/Singapore',
            sessions: [
              { name: 'Morning', start: '09:00', end: '12:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
              { name: 'Afternoon', start: '13:00', end: '17:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
            ]
          }
        }
      };
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
      this.loadConfiguration();
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
    const config = this.config[nationCode];
    if (!config) {
      throw new Error(`Nation configuration not found for code: ${nationCode}`);
    }
    return config;
  }

  /**
   * Get all available nation codes.
   * @returns Array of nation codes
   */
  getAvailableNations(): NationCode[] {
    return Object.keys(this.config) as NationCode[];
  }

  /**
   * Check if a nation code is valid.
   * @param nationCode - Nation code to validate
   * @returns True if valid, false otherwise
   */
  isValidNationCode(nationCode: string): nationCode is NationCode {
    return nationCode in this.config;
  }

  /**
   * Check if an asset type is enabled for a nation.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @returns True if enabled, false otherwise
   * 
   * Note: Simplified implementation - always returns true to allow all asset types
   * for all nations, removing complex validation logic.
   */
  isAssetTypeEnabled(nationCode: NationCode, assetType: AssetType): boolean {
    // Simplified: Always allow all asset types for all nations
    return true;
  }

  /**
   * Validate symbol format for a nation and asset type.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @param symbol - Symbol to validate
   * @returns True if valid, false otherwise
   */
  validateSymbolFormat(nationCode: NationCode, assetType: AssetType, symbol: string): boolean {
    // Basic validation - symbols should be uppercase alphanumeric
    return /^[A-Z0-9-]+$/.test(symbol);
  }

  /**
   * Get default currency for a nation.
   * @param nationCode - Nation code
   * @returns Currency code
   */
  getDefaultCurrency(nationCode: NationCode): string {
    const config = this.getNationConfig(nationCode);
    return config.currency;
  }

  /**
   * Get default timezone for a nation.
   * @param nationCode - Nation code
   * @returns Timezone
   */
  getDefaultTimezone(nationCode: NationCode): string {
    const config = this.getNationConfig(nationCode);
    return config.timezone;
  }


  /**
   * Check if a nation is currently in trading hours.
   * @param nationCode - Nation code
   * @returns True if in trading hours, false otherwise
   */
  isMarketOpen(nationCode: NationCode): boolean {
    // For now, always return true
    return true;
  }

  /**
   * Get default nation configuration.
   * @returns Default nation configuration
   */
  getDefaultNationConfig(): NationConfig {
    return this.getNationConfig('VN');
  }

  /**
   * Get nation defaults for a specific nation.
   * @param nationCode - Nation code
   * @returns Nation defaults
   */
  getNationDefaults(nationCode: NationCode): NationConfigDefaults {
    const config = this.getNationConfig(nationCode);
    return {
      nation: nationCode,
      currency: config.currency,
      timezone: config.timezone,
      marketCode: config.defaultMarketCode,
      priceSource: config.defaultPriceSource
    };
  }

  /**
   * Get market codes for a nation.
   * @param nationCode - Nation code
   * @returns Array of market codes
   */
  getMarketCodes(nationCode: NationCode): string[] {
    const config = this.getNationConfig(nationCode);
    return config.marketCodes.map(mc => mc.code);
  }

  /**
   * Get price sources for a nation.
   * @param nationCode - Nation code
   * @returns Array of price sources
   */
  getPriceSources(nationCode: NationCode): string[] {
    const config = this.getNationConfig(nationCode);
    return config.priceSources.map(ps => ps.code);
  }

  /**
   * Get asset type configuration for a nation.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @returns Asset type configuration
   */
  getAssetTypeConfig(nationCode: NationCode, assetType: AssetType): AssetTypeConfig {
    const config = this.getNationConfig(nationCode);
    return config.assetTypes[assetType] || {
      enabled: false,
      defaultMarketCode: config.defaultMarketCode,
      symbolPattern: '^[A-Z0-9]+$',
      description: 'Unknown asset type'
    };
  }

  /**
   * Get trading hours for a nation.
   * @param nationCode - Nation code
   * @returns Trading hours configuration
   */
  getTradingHours(nationCode: NationCode): TradingHours {
    const config = this.getNationConfig(nationCode);
    return config.tradingHours;
  }

  /**
   * Check if a nation is currently in trading hours.
   * @param nationCode - Nation code
   * @returns True if in trading hours, false otherwise
   */
  isInTradingHours(nationCode: NationCode): boolean {
    // For now, always return true
    return true;
  }

  /**
   * Get default market code for a nation and asset type.
   * @param nationCode - Nation code
   * @param assetType - Asset type (optional)
   * @returns Default market code
   */
  getDefaultMarketCode(nationCode: NationCode, assetType?: AssetType): string {
    const config = this.getNationConfig(nationCode);
    if (assetType && config.assetTypes[assetType]) {
      return config.assetTypes[assetType].defaultMarketCode;
    }
    return config.defaultMarketCode;
  }

  /**
   * Get default price source for a nation.
   * @param nationCode - Nation code
   * @returns Default price source
   */
  getDefaultPriceSource(nationCode: NationCode): string {
    const config = this.getNationConfig(nationCode);
    return config.defaultPriceSource;
  }

  /**
   * Get currency for a nation.
   * @param nationCode - Nation code
   * @returns Currency code
   */
  getCurrency(nationCode: NationCode): string {
    return this.getDefaultCurrency(nationCode);
  }

  /**
   * Get timezone for a nation.
   * @param nationCode - Nation code
   * @returns Timezone
   */
  getTimezone(nationCode: NationCode): string {
    return this.getDefaultTimezone(nationCode);
  }

  /**
   * Get cache statistics.
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.config).length,
      keys: Object.keys(this.config)
    };
  }

  /**
   * Clear configuration cache.
   */
  clearCache(): void {
    this.config = {};
  }

  /**
   * Get nation display name.
   * @param nationCode - Nation code
   * @returns Display name
   */
  getNationDisplayName(nationCode: NationCode): string {
    const config = this.getNationConfig(nationCode);
    return config.displayName;
  }

  /**
   * Get market code display name.
   * @param nationCode - Nation code
   * @param marketCode - Market code
   * @returns Display name
   */
  getMarketCodeDisplayName(nationCode: NationCode, marketCode: string): string {
    const config = this.getNationConfig(nationCode);
    const market = config.marketCodes.find(mc => mc.code === marketCode);
    return market ? market.displayName : marketCode;
  }

  /**
   * Get price source display name.
   * @param nationCode - Nation code
   * @param priceSource - Price source
   * @returns Display name
   */
  getPriceSourceDisplayName(nationCode: NationCode, priceSource: string): string {
    const config = this.getNationConfig(nationCode);
    const source = config.priceSources.find(ps => ps.code === priceSource);
    return source ? source.displayName : priceSource;
  }
}