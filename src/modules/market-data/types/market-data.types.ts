/**
 * Common types and interfaces for market data
 */

export interface BaseMarketData {
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  lastUpdated: Date;
  source: string;
  type: string;
  name?: string;
}

export enum MarketDataType {
  FUND = 'FUND',
  GOLD = 'GOLD',
  EXCHANGE_RATE = 'EXCHANGE_RATE',
  STOCK = 'STOCK',
  ETF = 'ETF',
  BOND = 'BOND',
  CRYPTO = 'CRYPTO'
}

export enum MarketDataSource {
  FMARKET = 'FMARKET',
  DOJI = 'DOJI',
  VIETCOMBANK = 'VIETCOMBANK',
  SSI = 'SSI',
  COINGECKO = 'COINGECKO',
  MANUAL = 'MANUAL'
}

export interface FundData extends BaseMarketData {
  // Inherits all fields from BaseMarketData
}

export interface GoldData extends BaseMarketData {
  region?: string;
}

export interface ExchangeRateData extends BaseMarketData {
  currency: string;
  transferPrice: number;
}

export interface StockData extends BaseMarketData {
  exchange: 'HOSE' | 'HNX' | 'UPCOM' | 'ETF';
  board?: string;
}

export interface CryptoData extends BaseMarketData {
  name: string;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  changePercent24h?: number;
  rank?: number;
}

export type MarketData = FundData | GoldData | ExchangeRateData | StockData | CryptoData;

export interface MarketDataResponse<T extends MarketData> {
  success: boolean;
  data: T[];
  message: string;
  source: MarketDataSource;
  lastUpdated: Date;
  count: number;
}

export interface MarketDataSummary {
  totalSymbols: number;
  fundCount: number;
  goldCount: number;
  exchangeRateCount: number;
  stockCount: number;
  etfCount: number;
  cryptoCount: number;
  lastUpdate: Date;
  sources: {
    [key in MarketDataSource]: number;
  };
}

export interface APIError {
  source: MarketDataSource;
  message: string;
  timestamp: Date;
  details?: any;
}

export interface MarketDataResult {
  success: boolean;
  message?: string;
  funds: FundData[];
  gold: GoldData[];
  exchangeRates: ExchangeRateData[];
  stocks: StockData[];
  crypto: CryptoData[];
  errors: APIError[];
  summary: MarketDataSummary;
}
