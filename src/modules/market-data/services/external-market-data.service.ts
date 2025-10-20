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
import { ApiCallDetailService, CreateApiCallDetailDto, UpdateApiCallDetailDto } from '../../asset/services/api-call-detail.service';
import { ApiCallStatus } from '../../asset/entities/api-call-detail.entity';
import { ApiResult } from '../interfaces/api-tracking.interface';
import { ApiTrackingHelper } from '../utils/api-tracking.helper';

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
    private readonly apiCallDetailService: ApiCallDetailService,
    private readonly apiTrackingHelper: ApiTrackingHelper,
  ) {}

  /**
   * Fetch all market data from external APIs with detailed tracking
   */
  async fetchAllMarketData(executionId?: string): Promise<MarketDataResult> {
    const result: MarketDataResult = {
      success: true,
      funds: [],
      gold: [],
      exchangeRates: [],
      stocks: [],
      crypto: [],
      errors: [],
      summary: this.createEmptySummary()
    };

    this.logger.log('Starting to fetch all market data from external APIs...');

    // Define API fetch tasks
    const fetchTasks = [
      {
        name: 'funds',
        source: MarketDataSource.FMARKET,
        fetchFn: () => this.fundPriceAPIClient.getAllFundPrices(),
        resultKey: 'funds' as keyof MarketDataResult
      },
      {
        name: 'gold',
        source: MarketDataSource.DOJI,
        fetchFn: () => this.goldPriceAPIClient.getAllGoldPrices(),
        resultKey: 'gold' as keyof MarketDataResult
      },
      {
        name: 'exchangeRates',
        source: MarketDataSource.VIETCOMBANK,
        fetchFn: () => this.exchangeRateAPIClient.getExchangeRates(),
        resultKey: 'exchangeRates' as keyof MarketDataResult
      },
      {
        name: 'stocks',
        source: MarketDataSource.SSI,
        fetchFn: () => this.stockPriceAPIClient.getAllStockPrices(),
        resultKey: 'stocks' as keyof MarketDataResult
      },
      {
        name: 'crypto',
        source: MarketDataSource.COINGECKO,
        fetchFn: () => this.cryptoPriceAPIClient.getAllCryptoPrices(),
        resultKey: 'crypto' as keyof MarketDataResult
      }
    ];

    // Execute all fetch tasks
    for (const task of fetchTasks) {
      await this.executeFetchTask(task, result, executionId);
    }

    // Update summary
    this.updateSummary(result);

    // Determine overall success
    result.success = result.errors.length === 0;
    
    this.logger.log(`Market data fetch completed. Success: ${result.success}, Errors: ${result.errors.length}`);
    
    return result;
  }

  /**
   * Create empty summary object
   */
  private createEmptySummary() {
    return {
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
    };
  }

  /**
   * Execute a single fetch task with error handling and tracking
   */
  private async executeFetchTask(
    task: {
      name: string;
      source: MarketDataSource;
      fetchFn: () => Promise<ApiResult<any[]>>;
      resultKey: keyof MarketDataResult;
    },
    result: MarketDataResult,
    executionId?: string
  ): Promise<void> {
    try {
      const apiResult = await task.fetchFn();
      (result[task.resultKey] as any[]) = apiResult.data;

      // Record API call details using helper
      if (executionId) {
        await this.apiTrackingHelper.recordApiCallDetails(executionId, apiResult.apiCalls);
      }

      this.logger.log(`Successfully fetched ${apiResult.data.length} ${task.name}`);
    } catch (error) {
      result.errors.push({
        source: task.source,
        message: `${task.name}: ${error.message}`,
        timestamp: new Date(),
        details: error
      });
      this.logger.error(`Failed to fetch ${task.name}:`, error.message);
    }
  }

  /**
   * Update result summary with current data
   */
  private updateSummary(result: MarketDataResult): void {
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
  }

  /**
   * Get price for a specific symbol - NO CIRCUIT BREAKER HERE
   * Let individual clients handle their own circuit breakers
   */
  async getPriceBySymbol(symbol: string): Promise<PriceUpdateResult | null> {
    const priceCheckers = [
      {
        name: 'fund',
        checker: () => this.fundPriceAPIClient.getFundPrice(symbol),
        mapper: (data: any) => ({
          symbol: data.symbol,
          price: data.buyPrice,
          type: 'FUND' as const,
          source: 'fmarket.vn',
          success: true
        })
      },
      {
        name: 'gold',
        checker: () => this.goldPriceAPIClient.getGoldPriceBySymbol(symbol),
        mapper: (data: any) => ({
          symbol: symbol,
          price: data.buyPrice,
          type: 'GOLD' as const,
          source: 'doji.vn',
          success: true
        })
      },
      {
        name: 'exchangeRate',
        checker: () => this.exchangeRateAPIClient.getExchangeRateBySymbol(symbol),
        mapper: (data: any) => ({
          symbol: symbol,
          price: data.buyPrice,
          type: 'EXCHANGE_RATE' as const,
          source: 'tygiausd.org',
          success: true
        })
      },
      {
        name: 'stock',
        checker: () => this.stockPriceAPIClient.getStockPriceBySymbol(symbol),
        mapper: (data: any) => ({
          symbol: data.symbol,
          price: data.buyPrice,
          type: 'STOCK' as const,
          source: data.source,
          success: true
        })
      }
    ];

    try {
      for (const checker of priceCheckers) {
        const result = await checker.checker();
        if (result) {
          return checker.mapper(result);
        }
      }
      return null;
    } catch (error) {
      this.logger.error(`Failed to get price for symbol ${symbol}:`, error.message);
      return {
        symbol,
        price: 0,
        type: 'STOCK',
        source: 'unknown',
        success: false,
        error: error.message
      };
    }
  }


  /**
   * Test connectivity to all external APIs
   */
  // async testAllConnections(): Promise<{
  //   funds: boolean;
  //   gold: boolean;
  //   exchangeRates: boolean;
  //   stocks: boolean;
  //   crypto: boolean;
  // }> {
  //   this.logger.log('Testing connectivity to all external APIs...');

  //   const results = {
  //     funds: false,
  //     gold: false,
  //     exchangeRates: false,
  //     stocks: false,
  //     crypto: false
  //   };

  //   try {
  //     // Test all connections in parallel
  //     const [fundsTest, goldTest, exchangeRatesTest, stocksTest, cryptoTest] = await Promise.allSettled([
  //       this.fundPriceAPIClient.testConnection(),
  //       this.goldPriceAPIClient.testConnection(),
  //       this.exchangeRateAPIClient.testConnection(),
  //       this.stockPriceAPIClient.testAllConnections(),
  //       this.cryptoPriceAPIClient.testConnection()
  //     ]);

  //     results.funds = fundsTest.status === 'fulfilled' && fundsTest.value;
  //     results.gold = goldTest.status === 'fulfilled' && goldTest.value;
  //     results.exchangeRates = exchangeRatesTest.status === 'fulfilled' && exchangeRatesTest.value;
  //     results.stocks = stocksTest.status === 'fulfilled' && (stocksTest.value.HOSE || stocksTest.value.HNX || stocksTest.value.ETF);
  //     results.crypto = cryptoTest.status === 'fulfilled' && cryptoTest.value;

  //   } catch (error) {
  //     this.logger.error('Connection test failed:', error.message);
  //   }

  //   this.logger.log('API connectivity test results:', results);
  //   return results;
  // }

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
    const apiClients = {
      funds: () => this.fundPriceAPIClient.getAllFundPrices(),
      gold: () => this.goldPriceAPIClient.getAllGoldPrices(),
      exchangeRates: () => this.exchangeRateAPIClient.getExchangeRates(),
      stocks: () => this.stockPriceAPIClient.getAllStockPrices(),
      crypto: () => this.cryptoPriceAPIClient.getAllCryptoPrices()
    };

    const fetchFn = apiClients[type];
    if (!fetchFn) {
      throw new Error(`Unsupported market data type: ${type}`);
    }

    const result = await fetchFn();
    return result.data;
  }
}
