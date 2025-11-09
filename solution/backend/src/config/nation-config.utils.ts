import * as fs from 'fs';
import * as path from 'path';
import { 
  NationConfiguration, 
  NationConfig, 
  NationCode, 
  AssetType, 
  MarketCodeType, 
  PriceSourceType,
  CurrencyType,
  TimezoneType 
} from './nation-config.interface';

/**
 * Utility functions for nation configuration management.
 */
export class NationConfigUtils {
  private static config: NationConfiguration | null = null;
  private static configPath = path.join(__dirname, 'nations.json');

  /**
   * Load nation configuration from JSON file.
   * @returns Nation configuration object
   */
  static loadConfig(): NationConfiguration {
    if (this.config) {
      return this.config;
    }

    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData) as NationConfiguration;
      this.validateConfig(this.config);
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load nation configuration: ${error.message}`);
    }
  }

  /**
   * Reload nation configuration from file.
   * @returns Nation configuration object
   */
  static reloadConfig(): NationConfiguration {
    this.config = null;
    return this.loadConfig();
  }

  /**
   * Get configuration for a specific nation.
   * @param nationCode - Nation code (e.g., 'VN', 'US', 'UK')
   * @returns Nation configuration
   */
  static getNationConfig(nationCode: NationCode): NationConfig {
    const config = this.loadConfig();
    const nationConfig = config.nations[nationCode];
    
    if (!nationConfig) {
      throw new Error(`Nation configuration not found for code: ${nationCode}`);
    }
    
    return nationConfig;
  }

  /**
   * Get all available nation codes.
   * @returns Array of nation codes
   */
  static getAvailableNations(): NationCode[] {
    const config = this.loadConfig();
    return Object.keys(config.nations) as NationCode[];
  }

  /**
   * Get default nation configuration.
   * @returns Default nation configuration
   */
  static getDefaultNationConfig(): NationConfig {
    const config = this.loadConfig();
    const defaultNationCode = config.defaults.nation as NationCode;
    return this.getNationConfig(defaultNationCode);
  }

  /**
   * Get default values for a nation.
   * @param nationCode - Nation code
   * @returns Default values object
   */
  static getNationDefaults(nationCode: NationCode): {
    currency: CurrencyType;
    timezone: TimezoneType;
    marketCode: MarketCodeType;
    priceSource: PriceSourceType;
  } {
    const nationConfig = this.getNationConfig(nationCode);
    
    return {
      currency: nationConfig.currency,
      timezone: nationConfig.timezone,
      marketCode: nationConfig.defaultMarketCode,
      priceSource: nationConfig.defaultPriceSource,
    };
  }

  /**
   * Get market codes for a nation.
   * @param nationCode - Nation code
   * @returns Array of market codes
   */
  static getMarketCodes(nationCode: NationCode): MarketCodeType[] {
    const nationConfig = this.getNationConfig(nationCode);
    return nationConfig.marketCodes.map(mc => mc.code);
  }

  /**
   * Get price sources for a nation.
   * @param nationCode - Nation code
   * @returns Array of price sources
   */
  static getPriceSources(nationCode: NationCode): PriceSourceType[] {
    const nationConfig = this.getNationConfig(nationCode);
    return nationConfig.priceSources
      .filter(ps => ps.enabled)
      .map(ps => ps.code);
  }

  /**
   * Get asset type configuration for a nation.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @returns Asset type configuration
   */
  static getAssetTypeConfig(nationCode: NationCode, assetType: AssetType): any {
    const nationConfig = this.getNationConfig(nationCode);
    const assetTypeConfig = nationConfig.assetTypes[assetType];
    
    if (!assetTypeConfig) {
      throw new Error(`Asset type configuration not found for ${assetType} in nation ${nationCode}`);
    }
    
    return assetTypeConfig;
  }

  /**
   * Check if an asset type is enabled for a nation.
   * @param nationCode - Nation code
   * @param assetType - Asset type
   * @returns True if enabled, false otherwise
   */
  static isAssetTypeEnabled(nationCode: NationCode, assetType: AssetType): boolean {
    try {
      const assetTypeConfig = this.getAssetTypeConfig(nationCode, assetType);
      return assetTypeConfig.enabled;
    } catch {
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
  static validateSymbolFormat(nationCode: NationCode, assetType: AssetType, symbol: string): boolean {
    try {
      const assetTypeConfig = this.getAssetTypeConfig(nationCode, assetType);
      const pattern = new RegExp(assetTypeConfig.symbolPattern);
      return pattern.test(symbol);
    } catch {
      return false;
    }
  }

  /**
   * Get trading hours for a nation.
   * @param nationCode - Nation code
   * @returns Trading hours configuration
   */
  static getTradingHours(nationCode: NationCode): any {
    const nationConfig = this.getNationConfig(nationCode);
    return nationConfig.tradingHours;
  }

  /**
   * Check if a nation is currently in trading hours.
   * @param nationCode - Nation code
   * @returns True if in trading hours, false otherwise
   */
  static isInTradingHours(nationCode: NationCode): boolean {
    const tradingHours = this.getTradingHours(nationCode);
    const now = new Date();
    const timezone = tradingHours.timezone;
    
    // Convert current time to nation's timezone
    const nationTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const currentTime = nationTime.toTimeString().slice(0, 5); // HH:MM format
    const currentDay = nationTime.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    
    // Check if current time falls within any trading session
    return tradingHours.sessions.some(session => {
      const isCorrectDay = session.days.includes(currentDay);
      const isWithinTime = currentTime >= session.start && currentTime <= session.end;
      return isCorrectDay && isWithinTime;
    });
  }

  /**
   * Validate nation configuration structure.
   * @param config - Configuration to validate
   */
  private static validateConfig(config: NationConfiguration): void {
    if (!config.nations || typeof config.nations !== 'object') {
      throw new Error('Invalid configuration: nations object is required');
    }

    if (!config.defaults || typeof config.defaults !== 'object') {
      throw new Error('Invalid configuration: defaults object is required');
    }

    if (!config.metadata || typeof config.metadata !== 'object') {
      throw new Error('Invalid configuration: metadata object is required');
    }

    // Validate each nation configuration
    for (const [nationCode, nationConfig] of Object.entries(config.nations)) {
      this.validateNationConfig(nationCode, nationConfig);
    }

    // Validate defaults
    this.validateDefaults(config.defaults, config.nations);
  }

  /**
   * Validate individual nation configuration.
   * @param nationCode - Nation code
   * @param nationConfig - Nation configuration
   */
  private static validateNationConfig(nationCode: string, nationConfig: any): void {
    const requiredFields = ['name', 'displayName', 'currency', 'timezone', 'marketCodes', 'defaultMarketCode', 'assetTypes', 'priceSources', 'defaultPriceSource', 'tradingHours'];
    
    for (const field of requiredFields) {
      if (!nationConfig[field]) {
        throw new Error(`Invalid nation configuration for ${nationCode}: ${field} is required`);
      }
    }

    // Validate market codes
    if (!Array.isArray(nationConfig.marketCodes) || nationConfig.marketCodes.length === 0) {
      throw new Error(`Invalid nation configuration for ${nationCode}: marketCodes must be a non-empty array`);
    }

    // Validate default market code exists
    const marketCodes = nationConfig.marketCodes.map((mc: any) => mc.code);
    if (!marketCodes.includes(nationConfig.defaultMarketCode)) {
      throw new Error(`Invalid nation configuration for ${nationCode}: defaultMarketCode must exist in marketCodes`);
    }

    // Validate price sources
    if (!Array.isArray(nationConfig.priceSources) || nationConfig.priceSources.length === 0) {
      throw new Error(`Invalid nation configuration for ${nationCode}: priceSources must be a non-empty array`);
    }

    // Validate default price source exists
    const priceSources = nationConfig.priceSources.map((ps: any) => ps.code);
    if (!priceSources.includes(nationConfig.defaultPriceSource)) {
      throw new Error(`Invalid nation configuration for ${nationCode}: defaultPriceSource must exist in priceSources`);
    }
  }

  /**
   * Validate defaults configuration.
   * @param defaults - Defaults configuration
   * @param nations - Nations configuration
   */
  private static validateDefaults(defaults: any, nations: any): void {
    const requiredFields = ['nation', 'currency', 'timezone', 'marketCode', 'priceSource'];
    
    for (const field of requiredFields) {
      if (!defaults[field]) {
        throw new Error(`Invalid defaults configuration: ${field} is required`);
      }
    }

    // Validate default nation exists
    if (!nations[defaults.nation]) {
      throw new Error(`Invalid defaults configuration: nation ${defaults.nation} does not exist`);
    }
  }
}
