import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  StockData, 
  MarketDataType, 
  MarketDataSource 
} from '../types/market-data.types';
import { CircuitBreakerService } from '../../shared/services/circuit-breaker.service';
import { ApiTrackingBase } from '../base/api-tracking.base';
import { ApiResult } from '../interfaces/api-tracking.interface';

export interface StockAPIResponse {
  data: StockData[];
  success: boolean;
  message?: string;
}

export type ExchangeType = 'HOSE' | 'HNX' | 'ETF';

@Injectable()
export class StockPriceAPIClient extends ApiTrackingBase {
  private readonly baseUrl =  'https://stock-price-ssi-proxy.lvttung0106.workers.dev/'; //'https://iboard-query.ssi.com.vn'; SSI blocked requests on aws ec2
  private readonly timeout = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {
    super(StockPriceAPIClient.name);
  }

  /**
   * Get all stock prices from a specific exchange with circuit breaker protection
   */
  async getStockPrices(endpoint: string, headers: any, exchange: ExchangeType = 'HOSE'): Promise<StockData[]> {
    return this.circuitBreakerService.execute(
      'stock-price-api',
      async () => {
        this.logger.log(`Fetching stock prices from SSI API for exchange: ${exchange}...`);

        const response: AxiosResponse<StockAPIResponse> = await firstValueFrom(
          this.httpService.get(endpoint, {
            headers: headers,
            timeout: this.timeout
          })
        );

        const stockPrices = this.parseStockData(response.data, exchange ==="ETF" ? "HOSE" : exchange);
        return stockPrices;
      },
      {
        failureThreshold: 3, // Open circuit after 3 failures
        timeout: 30000, // Wait 30 seconds before trying again
        successThreshold: 2, // Need 2 successes to close circuit
        monitoringPeriod: 300000 // 5 minutes monitoring window
      }
    ).catch(error => {
      this.logger.error(`Failed to fetch stock prices from SSI for exchange ${exchange}:`, error.message);
      throw new Error(`SSI API call failed: ${error.message}`);
    });
  }

  /**
   * Get all stock prices from all exchanges with tracking info
   */
  async getAllStockPrices(): Promise<ApiResult<StockData[]>> {
    const exchanges: ExchangeType[] = ['HOSE', 'HNX', 'ETF'];
    
    const apiCalls = exchanges.map(exchange => {
      let endpoint: string;
      switch (exchange) {
        case 'HOSE':
          endpoint = `${this.baseUrl}/stock/exchange/hose?boardId=MAIN`;
          break;
        case 'HNX':
          endpoint = `${this.baseUrl}/stock/exchange/hnx?boardId=MAIN`;
          break;
        case 'ETF':
          endpoint = `${this.baseUrl}/stock/type/e/hose`;
          break;
        default:
          endpoint = `${this.baseUrl}/stock/exchange/${exchange}`;
      }

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      };

      return {
        options: {
          provider: 'SSI',
          endpoint,
          method: 'GET',
        },
        apiCall: () => this.getStockPrices(endpoint, headers, exchange),
        dataProcessor: (data: StockData[]) => ({
          symbolsProcessed: data.length,
          successfulSymbols: data.filter(item => item && item.symbol && (item.buyPrice > 0 || item.sellPrice > 0)).length,
          failedSymbols: data.filter(item => !item || !item.symbol || (item.buyPrice <= 0 && item.sellPrice <= 0)).length,
        }),
      };
    });

    const result = await this.executeMultipleWithTracking(apiCalls);
    
    // Flatten all stock data
    const allStockData = result.data.flat();
    
    this.logger.log(`Successfully fetched ${allStockData.length} total stock prices from all exchanges`);
    
    return {
      data: allStockData,
      apiCalls: result.apiCalls,
      totalSymbols: result.totalSymbols,
      successfulSymbols: result.successfulSymbols,
      failedSymbols: result.failedSymbols,
    };
  }

  /**
   * Get specific stock price by symbol
   */
  // async getStockPrice(symbol: string, exchange?: ExchangeType): Promise<StockData | null> {
  //   try {
  //     if (exchange) {
  //       const prices = await this.getStockPrices(exchange);
  //       return prices.find(stock => stock.symbol === symbol) || null;
  //     } else {
  //       const allPricesResult = await this.getAllStockPrices();
  //       return allPricesResult.data.find(stock => stock.symbol === symbol) || null;
  //     }
  //   } catch (error) {
  //     this.logger.error(`Failed to get stock price for ${symbol}:`, error.message);
  //     return null;
  //   }
  // }

  /**
   * Get stock prices by exchange
   */
  // async getStockPricesByExchange(exchange: ExchangeType): Promise<StockData[]> {
  //   return this.getStockPrices(exchange);
  // }

  /**
   * Parse stock data from SSI API response
   */
  private parseStockData(response: any, exchange: ExchangeType): StockData[] {
    try {
      const stocks: StockData[] = [];

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((item: any) => {
          if (item && typeof item === 'object') {
            // Try different price fields
            const price = parseFloat(
              item.expectedMatchedPrice || 
              item.price || 
              item.lastPrice || 
              item.closePrice || 
              item.currentPrice ||
              item.matchedPrice ||
              item.priorClosePrice ||  // Try priorClosePrice as fallback
              item.refPrice ||
              item.openPrice ||
              0
            );
            
            // Parse volume from various possible fields
            const volume = parseFloat(
              item.volume ||
              item.tradingVolume ||
              item.totalVolume ||
              item.khoiLuongKhopLenh ||
              item.klKhopLenh ||
              item.totalMatchVolume ||
              item.matchVolume ||
              item.quantity ||
              0
            );

            // Parse trading value (Giá trị khớp lệnh)
            const tradingValue = parseFloat(
              item.tradingValue ||
              item.totalValue ||
              item.giaTriKhopLenh ||
              item.gtKhopLenh ||
              item.matchValue ||
              0
            );

            // Parse change percent from various possible fields
            const changePercent = parseFloat(
              item.changePercent ||
              item.priceChangePercent ||
              item.percentChange ||
              item.thayDoi ||
              (item.change && item.price ? (item.change / item.price) * 100 : undefined) ||
              undefined
            );

            // Try to get lastUpdated from API data, fallback to current time
            let lastUpdated = new Date();
            if (item.lastUpdated || item.updatedAt || item.timestamp || item.lastTradeTime || item.tradingDate) {
              const apiTime = item.lastUpdated || item.updatedAt || item.timestamp || item.lastTradeTime || item.tradingDate;
              const parsedTime = new Date(apiTime);
              if (!isNaN(parsedTime.getTime())) {
                lastUpdated = parsedTime;
              }
            }

            // Calculate market capitalization
            // Priority 1: Use trading value (if available) as a better proxy for market activity
            // Priority 2: Use price * volume if both are available
            // Priority 3: Use price * estimated average volume (fallback approximation)
            let estimatedMarketCap = 0;
            if (tradingValue > 0) {
              // Trading value is a better indicator of market activity
              // Multiply by a factor to estimate market cap (this is a rough approximation)
              estimatedMarketCap = tradingValue * 100; // Rough multiplier for market cap estimation
            } else if (price > 0 && volume > 0) {
              // Use price * volume as approximation
              estimatedMarketCap = price * volume;
            } else if (price > 0) {
              // Fallback: use price with a default multiplier for estimation
              // This is a very rough estimate, but better than nothing
              estimatedMarketCap = price * 1000000; // Default multiplier for estimation
            }
            
            const stock: StockData = {
              symbol: item.stockSymbol || item.symbol || item.isin || '',
              buyPrice: price,
              sellPrice: price,
              lastUpdated: lastUpdated,
              source: MarketDataSource.SSI,
              type: MarketDataType.STOCK,
              exchange: exchange,
              volume: volume > 0 ? volume : undefined,
              changePercent: changePercent !== undefined && !isNaN(changePercent) ? changePercent : undefined,
              // Always include marketCap if we have a price (even if estimated)
              marketCap: price > 0 ? (estimatedMarketCap > 0 ? estimatedMarketCap : price * 1000000) : undefined,
              name: item.name || item.stockName || item.companyName
            };

            // Only add stocks with valid data
            if (stock.symbol && stock.buyPrice > 0) {
              stocks.push(stock);
            }
          }
        });
      }

      return stocks;
    } catch (error) {
      this.logger.error('Failed to parse SSI stock data:', error.message);
      return [];
    }
  }

  /**
   * Get stock price by symbol mapping
   */
  async getStockPriceBySymbol(symbol: string): Promise<StockData | null> {
    try {
      const allPricesResult = await this.getAllStockPrices();
      const allPrices = allPricesResult.data;
      
      // Try exact match first
      let stock = allPrices.find(s => s.symbol === symbol);
      
      if (!stock) {
        // Try case-insensitive match
        stock = allPrices.find(s => s.symbol.toLowerCase() === symbol.toLowerCase());
      }

      if (!stock) {
        // Try partial match
        stock = allPrices.find(s => s.symbol.toLowerCase().includes(symbol.toLowerCase()));
      }

      return stock || null;
    } catch (error) {
      this.logger.error(`Failed to get stock price by symbol ${symbol}:`, error.message);
      return null;
    }
  }

  // /**
  //  * Test API connectivity
  //  */
  // async testConnection(exchange: ExchangeType = 'HOSE'): Promise<boolean> {
  //   try {
  //     await this.getStockPrices(exchange);
  //     return true;
  //   } catch (error) {
  //     this.logger.error(`SSI API connection test failed for exchange ${exchange}:`, error.message);
  //     return false;
  //   }
  // }

  /**
   * Test all exchanges connectivity
   */
  // async testAllConnections(): Promise<{ [key in ExchangeType]: boolean }> {
  //   const results: { [key in ExchangeType]: boolean } = {
  //     HOSE: false,
  //     HNX: false,
  //     ETF: false
  //   };

  //   const exchanges: ExchangeType[] = ['HOSE', 'HNX', 'ETF'];
    
  //   for (const exchange of exchanges) {
  //     try {
  //       results[exchange] = await this.testConnection(exchange);
  //     } catch (error) {
  //       this.logger.error(`Connection test failed for ${exchange}:`, error.message);
  //       results[exchange] = false;
  //     }
  //   }

  //   return results;
  // }

  /**
   * Get circuit breaker statistics for stock price API
   */
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getStats('stock-price-api');
  }

  /**
   * Reset circuit breaker for stock price API
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerService.reset('stock-price-api');
  }
}
