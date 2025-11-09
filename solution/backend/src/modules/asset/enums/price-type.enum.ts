/**
 * Price type enumeration for asset pricing.
 */
export enum PriceType {
  /** Manual price set by user */
  MANUAL = 'MANUAL',
  
  /** Price from external data source */
  EXTERNAL = 'EXTERNAL'
}

/**
 * Price source enumeration for asset pricing.
 */
export enum PriceSource {
  /** User manually entered price */
  USER_INPUT = 'USER_INPUT',
  
  /** External API (e.g., Yahoo Finance, Alpha Vantage, CAFEF, FMarket) */
  EXTERNAL_API = 'EXTERNAL_API'
}
