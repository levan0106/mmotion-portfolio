// Export all API clients with generic names
export { FundPriceAPIClient } from './fund-price-api.client';
export { GoldPriceAPIClient } from './gold-price-api.client';
export { ExchangeRateAPIClient } from './exchange-rate-api.client';
export { StockPriceAPIClient, StockAPIResponse, ExchangeType } from './stock-price-api.client';
export { CryptoPriceAPIClient } from './crypto-price-api.client';

// Re-export for backward compatibility (if needed)
export { FundPriceAPIClient as FMarketAPIClient } from './fund-price-api.client';
export { GoldPriceAPIClient as DojiAPIClient } from './gold-price-api.client';
export { ExchangeRateAPIClient as TygiaAPIClient } from './exchange-rate-api.client';
export { StockPriceAPIClient as SSIAPIClient } from './stock-price-api.client';
export { CryptoPriceAPIClient as CoinGeckoAPIClient } from './crypto-price-api.client';
