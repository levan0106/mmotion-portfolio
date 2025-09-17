/**
 * Price type enumeration for asset pricing.
 */
export enum PriceType {
  /** Manual price set by user */
  MANUAL = 'MANUAL',
  
  /** Price from market data API */
  MARKET_DATA = 'MARKET_DATA',
  
  /** Price from external data source */
  EXTERNAL = 'EXTERNAL',
  
  /** Price calculated from other sources */
  CALCULATED = 'CALCULATED'
}

/**
 * Price source enumeration for asset pricing.
 */
export enum PriceSource {
  /** User manually entered price */
  USER = 'USER',
  
  /** Market data service */
  MARKET_DATA_SERVICE = 'MARKET_DATA_SERVICE',
  
  /** External API (e.g., Yahoo Finance, Alpha Vantage) */
  EXTERNAL_API = 'EXTERNAL_API',
  
  /** Calculated from other prices */
  CALCULATED = 'CALCULATED'
}
