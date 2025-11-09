/**
 * Nation configuration interfaces for Global Assets System.
 * These interfaces define the structure of nation configuration data.
 */

export interface MarketCode {
  code: string;
  name: string;
  displayName: string;
  isDefault: boolean;
}

export interface AssetTypeConfig {
  enabled: boolean;
  defaultMarketCode: string;
  symbolPattern: string;
  description: string;
}

export interface PriceSource {
  code: string;
  name: string;
  displayName: string;
  isDefault: boolean;
  enabled: boolean;
}

export interface TradingSession {
  name: string;
  start: string;
  end: string;
  days: string[];
}

export interface TradingHours {
  timezone: string;
  sessions: TradingSession[];
}

export interface NationConfig {
  name: string;
  displayName: string;
  currency: string;
  timezone: string;
  marketCodes: MarketCode[];
  defaultMarketCode: string;
  assetTypes: Record<string, AssetTypeConfig>;
  priceSources: PriceSource[];
  defaultPriceSource: string;
  tradingHours: TradingHours;
}

export interface NationConfigDefaults {
  nation: string;
  currency: string;
  timezone: string;
  marketCode: string;
  priceSource: string;
}

export interface NationConfigMetadata {
  version: string;
  lastUpdated: string;
  description: string;
  author: string;
}

export interface NationConfiguration {
  nations: Record<string, NationConfig>;
  defaults: NationConfigDefaults;
  metadata: NationConfigMetadata;
}

/**
 * Utility type for nation codes.
 */
export type NationCode = keyof NationConfiguration['nations'];

/**
 * Utility type for asset types.
 */
export type AssetType = keyof NationConfig['assetTypes'];

/**
 * Utility type for market codes.
 */
export type MarketCodeType = string;

/**
 * Utility type for price sources.
 */
export type PriceSourceType = string;

/**
 * Utility type for currencies.
 */
export type CurrencyType = string;

/**
 * Utility type for timezones.
 */
export type TimezoneType = string;
