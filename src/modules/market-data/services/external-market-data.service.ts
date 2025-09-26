import { Injectable, Logger } from '@nestjs/common';
import { 
  FundPriceAPIClient, 
  GoldPriceAPIClient, 
  ExchangeRateAPIClient, 
  StockPriceAPIClient,
  CryptoPriceAPIClient
} from '../clients';
import { 
  FundData, 
  GoldData, 
  ExchangeRateData, 
  StockData,
  CryptoData,
  MarketDataResult,
  MarketDataSource,
  APIError
} from '../types/market-data.types';

// MarketDataResult is now imported from types

export interface PriceUpdateResult {
  symbol: string;
  price: number;
  type: 'FUND' | 'GOLD' | 'EXCHANGE_RATE' | 'STOCK';
  source: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class ExternalMarketDataService {
  private readonly logger = new Logger(ExternalMarketDataService.name);

  constructor(
    private readonly fundPriceAPIClient: FundPriceAPIClient,
    private readonly goldPriceAPIClient: GoldPriceAPIClient,
    private readonly exchangeRateAPIClient: ExchangeRateAPIClient,
    private readonly stockPriceAPIClient: StockPriceAPIClient,
    private readonly cryptoPriceAPIClient: CryptoPriceAPIClient,
  ) {}

  /**
   * Fetch all market data from external APIs
   */
  async fetchAllMarketData(): Promise<MarketDataResult> {
    const result: MarketDataResult = {
      success: true,
      funds: [],
      gold: [],
      exchangeRates: [],
      stocks: [],
      crypto: [],
      errors: [],
      summary: {
        totalSymbols: 0,
        fundCount: 0,
        goldCount: 0,
        exchangeRateCount: 0,
        stockCount: 0,
        etfCount: 0,
        cryptoCount: 0,
        lastUpdate: new Date(),
        sources: {
          [MarketDataSource.FMARKET]: 0,
          [MarketDataSource.DOJI]: 0,
          [MarketDataSource.VIETCOMBANK]: 0,
          [MarketDataSource.SSI]: 0,
          [MarketDataSource.COINGECKO]: 0,
          [MarketDataSource.MANUAL]: 0
        }
      }
    };

    this.logger.log('Starting to fetch all market data from external APIs...');

    // Fetch fund prices
    try {
      result.funds = await this.fundPriceAPIClient.getAllFundPrices();
      this.logger.log(`Successfully fetched ${result.funds.length} fund prices`);
    } catch (error) {
      result.errors.push({
        source: MarketDataSource.FMARKET,
        message: `Fund prices: ${error.message}`,
        timestamp: new Date(),
        details: error
      });
      this.logger.error('Failed to fetch fund prices:', error.message);
    }

    // Fetch gold prices
    try {
      result.gold = await this.goldPriceAPIClient.getAllGoldPrices();
      this.logger.log(`Successfully fetched ${result.gold.length} gold prices`);
    } catch (error) {
      result.errors.push({
        source: MarketDataSource.DOJI,
        message: `Gold prices: ${error.message}`,
        timestamp: new Date(),
        details: error
      });
      this.logger.error('Failed to fetch gold prices:', error.message);
    }

    // Fetch exchange rates
    try {
      result.exchangeRates = await this.exchangeRateAPIClient.getExchangeRates();
      this.logger.log(`Successfully fetched ${result.exchangeRates.length} exchange rates`);
    } catch (error) {
      result.errors.push({
        source: MarketDataSource.VIETCOMBANK,
        message: `Exchange rates: ${error.message}`,
        timestamp: new Date(),
        details: error
      });
      this.logger.error('Failed to fetch exchange rates:', error.message);
    }

    // Fetch stock prices
    try {
      result.stocks = await this.stockPriceAPIClient.getAllStockPrices();
      this.logger.log(`Successfully fetched ${result.stocks.length} stock prices`);
    } catch (error) {
      result.errors.push({
        source: MarketDataSource.SSI,
        message: `Stock prices: ${error.message}`,
        timestamp: new Date(),
        details: error
      });
      this.logger.error('Failed to fetch stock prices:', error.message);
    }

    // Fetch crypto prices
    try {
      result.crypto = await this.cryptoPriceAPIClient.getAllCryptoPrices();
      this.logger.log(`Successfully fetched ${result.crypto.length} crypto prices`);
    } catch (error) {
      result.errors.push({
        source: MarketDataSource.COINGECKO,
        message: `Crypto prices: ${error.message}`,
        timestamp: new Date(),
        details: error
      });
      this.logger.error('Failed to fetch crypto prices:', error.message);
    }

    // Update summary
    result.summary = {
      totalSymbols: result.funds.length + result.gold.length + 
                   result.exchangeRates.length + result.stocks.length + result.crypto.length,
      fundCount: result.funds.length,
      goldCount: result.gold.length,
      exchangeRateCount: result.exchangeRates.length,
      stockCount: result.stocks.length,
      etfCount: result.stocks.filter(stock => stock.type === 'ETF').length,
      cryptoCount: result.crypto.length,
      lastUpdate: new Date(),
      sources: {
        [MarketDataSource.FMARKET]: result.funds.length,
        [MarketDataSource.DOJI]: result.gold.length,
        [MarketDataSource.VIETCOMBANK]: result.exchangeRates.length,
        [MarketDataSource.SSI]: result.stocks.length,
        [MarketDataSource.COINGECKO]: result.crypto.length,
        [MarketDataSource.MANUAL]: 0
      }
    };

    // Determine overall success
    result.success = result.errors.length === 0;
    
    this.logger.log(`Market data fetch completed. Success: ${result.success}, Errors: ${result.errors.length}`);
    
    return result;
  }

  /**
   * Get price for a specific symbol
   */
  async getPriceBySymbol(symbol: string): Promise<PriceUpdateResult | null> {
    try {
      // Try fund prices first
      const fundPrice = await this.fundPriceAPIClient.getFundPrice(symbol);
      if (fundPrice) {
        return {
          symbol: fundPrice.symbol,
          price: fundPrice.buyPrice,
          type: 'FUND',
          source: 'fmarket.vn',
          success: true
        };
      }

      // Try gold prices
      const goldPrice = await this.goldPriceAPIClient.getGoldPriceBySymbol(symbol);
      if (goldPrice) {
        return {
          symbol: symbol,
          price: goldPrice.buyPrice, // Use buy price as default
          type: 'GOLD',
          source: 'doji.vn',
          success: true
        };
      }

      // Try exchange rates
      const exchangeRate = await this.exchangeRateAPIClient.getExchangeRateBySymbol(symbol);
      if (exchangeRate) {
        return {
          symbol: symbol,
          price: exchangeRate.buyPrice, // Use buy price as default
          type: 'EXCHANGE_RATE',
          source: 'tygiausd.org',
          success: true
        };
      }

      // Try stock prices
      const stockPrice = await this.stockPriceAPIClient.getStockPriceBySymbol(symbol);
      if (stockPrice) {
        return {
          symbol: stockPrice.symbol,
          price: stockPrice.buyPrice,
          type: 'STOCK',
          source: stockPrice.source,
          success: true
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get price for symbol ${symbol}:`, error.message);
      return {
        symbol,
        price: 0,
        type: 'STOCK', // Default type
        source: 'unknown',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test connectivity to all external APIs
   */
  async testAllConnections(): Promise<{
    funds: boolean;
    gold: boolean;
    exchangeRates: boolean;
    stocks: boolean;
  }> {
    this.logger.log('Testing connectivity to all external APIs...');

    const results = {
      funds: false,
      gold: false,
      exchangeRates: false,
      stocks: false
    };

    // Test fund API
    try {
      results.funds = await this.fundPriceAPIClient.testConnection();
    } catch (error) {
      this.logger.error('Fund API connection test failed:', error.message);
    }

    // Test gold API
    try {
      results.gold = await this.goldPriceAPIClient.testConnection();
    } catch (error) {
      this.logger.error('Gold API connection test failed:', error.message);
    }

    // Test exchange rate API
    try {
      results.exchangeRates = await this.exchangeRateAPIClient.testConnection();
    } catch (error) {
      this.logger.error('Exchange rate API connection test failed:', error.message);
    }

    // Test stock API
    try {
      results.stocks = await this.stockPriceAPIClient.testConnection();
    } catch (error) {
      this.logger.error('Stock API connection test failed:', error.message);
    }

    this.logger.log('API connectivity test results:', results);
    return results;
  }

  /**
   * Get market data summary
   */
  async getMarketDataSummary(): Promise<{
    totalSymbols: number;
    fundCount: number;
    goldCount: number;
    exchangeRateCount: number;
    stockCount: number;
    lastUpdate: Date;
  }> {
    try {
      const marketData = await this.fetchAllMarketData();
      
      return {
        totalSymbols: marketData.funds.length + marketData.gold.length + 
                     marketData.exchangeRates.length + marketData.stocks.length,
        fundCount: marketData.funds.length,
        goldCount: marketData.gold.length,
        exchangeRateCount: marketData.exchangeRates.length,
        stockCount: marketData.stocks.length,
        lastUpdate: marketData.summary.lastUpdate
      };
    } catch (error) {
      this.logger.error('Failed to get market data summary:', error.message);
      return {
        totalSymbols: 0,
        fundCount: 0,
        goldCount: 0,
        exchangeRateCount: 0,
        stockCount: 0,
        lastUpdate: new Date()
      };
    }
  }

  /**
   * Get specific market data by type
   */
  async getMarketDataByType(type: 'funds' | 'gold' | 'exchangeRates' | 'stocks' | 'crypto'): Promise<any[]> {
    switch (type) {
      case 'funds':
        return this.fundPriceAPIClient.getAllFundPrices();
      case 'gold':
        return this.goldPriceAPIClient.getAllGoldPrices();
      case 'exchangeRates':
        return this.exchangeRateAPIClient.getExchangeRates();
      case 'stocks':
        return this.stockPriceAPIClient.getAllStockPrices();
      case 'crypto':
        return this.cryptoPriceAPIClient.getAllCryptoPrices();
      default:
        throw new Error(`Unsupported market data type: ${type}`);
    }
  }
}
