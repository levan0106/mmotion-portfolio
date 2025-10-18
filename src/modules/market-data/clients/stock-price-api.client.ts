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

export interface StockAPIResponse {
  data: StockData[];
  success: boolean;
  message?: string;
}

export type ExchangeType = 'HOSE' | 'HNX' | 'ETF';

@Injectable()
export class StockPriceAPIClient {
  private readonly logger = new Logger(StockPriceAPIClient.name);
  private readonly baseUrl =  'https://stock-price-ssi-proxy.lvttung0106.workers.dev/'; //'https://iboard-query.ssi.com.vn'; SSI blocked requests on aws ec2
  private readonly timeout = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {}

  /**
   * Get all stock prices from a specific exchange with circuit breaker protection
   */
  async getStockPrices(exchange: ExchangeType = 'HOSE'): Promise<StockData[]> {
    return this.circuitBreakerService.execute(
      'stock-price-api',
      async () => {
        this.logger.log(`Fetching stock prices from SSI API for exchange: ${exchange}...`);

        let url: string;
        switch (exchange) {
          case 'HOSE':
            url = `${this.baseUrl}/stock/exchange/hose?boardId=MAIN`;
            break;
          case 'HNX':
            url = `${this.baseUrl}/stock/exchange/hnx?boardId=MAIN`;
            break;
          case 'ETF':
            url = `${this.baseUrl}/stock/type/e/hose`;
            break;
          default:
            throw new Error(`Unsupported exchange: ${exchange}`);
        }

        const response: AxiosResponse<StockAPIResponse> = await firstValueFrom(
          this.httpService.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Referer': 'https://iboard.ssi.com.vn/',
              'Origin': 'https://iboard.ssi.com.vn',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin'
            },
            timeout: this.timeout
          })
        );

        const stockPrices = this.parseStockData(response.data, exchange ==="ETF" ? "HOSE" : exchange);
        // this.logger.log(`Successfully fetched ${stockPrices.length} stock prices from SSI for ${exchange}`);
        
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
   * Get all stock prices from all exchanges
   */
  async getAllStockPrices(): Promise<StockData[]> {
    try {
      const allPrices: StockData[] = [];
      
      // Fetch from all exchanges
      const exchanges: ExchangeType[] = ['HOSE', 'HNX', 'ETF'];
      
      for (const exchange of exchanges) {
        try {
          const prices = await this.getStockPrices(exchange);
          allPrices.push(...prices);
        } catch (error) {
          this.logger.warn(`Failed to fetch prices for exchange ${exchange}:`, error.message);
          // Continue with other exchanges
        }
      }

      // this.logger.log(`Successfully fetched ${allPrices.length} total stock prices from all exchanges`);
      return allPrices;

    } catch (error) {
      this.logger.error('Failed to fetch all stock prices:', error.message);
      throw new Error(`Failed to fetch all stock prices: ${error.message}`);
    }
  }

  /**
   * Get specific stock price by symbol
   */
  async getStockPrice(symbol: string, exchange?: ExchangeType): Promise<StockData | null> {
    try {
      if (exchange) {
        const prices = await this.getStockPrices(exchange);
        return prices.find(stock => stock.symbol === symbol) || null;
      } else {
        const allPrices = await this.getAllStockPrices();
        return allPrices.find(stock => stock.symbol === symbol) || null;
      }
    } catch (error) {
      this.logger.error(`Failed to get stock price for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get stock prices by exchange
   */
  async getStockPricesByExchange(exchange: ExchangeType): Promise<StockData[]> {
    return this.getStockPrices(exchange);
  }

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
            
              // Try to get lastUpdated from API data, fallback to current time
              let lastUpdated = new Date();
              if (item.lastUpdated || item.updatedAt || item.timestamp || item.lastTradeTime || item.tradingDate) {
                const apiTime = item.lastUpdated || item.updatedAt || item.timestamp || item.lastTradeTime || item.tradingDate;
                const parsedTime = new Date(apiTime);
                if (!isNaN(parsedTime.getTime())) {
                  lastUpdated = parsedTime;
                }
              }
              
              const stock: StockData = {
                symbol: item.stockSymbol || item.symbol || item.isin || '',
                buyPrice: price,
                sellPrice: price,
                lastUpdated: lastUpdated,
                source: MarketDataSource.SSI,
                type: MarketDataType.STOCK,
                exchange: exchange
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
      const allPrices = await this.getAllStockPrices();
      
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

  /**
   * Test API connectivity
   */
  async testConnection(exchange: ExchangeType = 'HOSE'): Promise<boolean> {
    try {
      await this.getStockPrices(exchange);
      return true;
    } catch (error) {
      this.logger.error(`SSI API connection test failed for exchange ${exchange}:`, error.message);
      return false;
    }
  }

  /**
   * Test all exchanges connectivity
   */
  async testAllConnections(): Promise<{ [key in ExchangeType]: boolean }> {
    const results: { [key in ExchangeType]: boolean } = {
      HOSE: false,
      HNX: false,
      ETF: false
    };

    const exchanges: ExchangeType[] = ['HOSE', 'HNX', 'ETF'];
    
    for (const exchange of exchanges) {
      try {
        results[exchange] = await this.testConnection(exchange);
      } catch (error) {
        this.logger.error(`Connection test failed for ${exchange}:`, error.message);
        results[exchange] = false;
      }
    }

    return results;
  }

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
