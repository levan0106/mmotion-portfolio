import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BaseMarketData, MarketDataType, MarketDataSource } from '../types/market-data.types';
import { CircuitBreakerService } from '../../shared/services/circuit-breaker.service';
import { ApiTrackingBase } from '../base/api-tracking.base';
import { ApiResult } from '../interfaces/api-tracking.interface';

export interface CryptoData extends BaseMarketData {
  name: string;
  symbol: string;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  changePercent24h?: number;
  rank?: number;
}

@Injectable()
export class CryptoPriceAPIClient extends ApiTrackingBase {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';
  private readonly timeout = 10000;

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {
    super(CryptoPriceAPIClient.name);
  }

  /**
   * Get all crypto prices with circuit breaker protection
   */
  async getAllCryptoPrices(): Promise<ApiResult<CryptoData[]>> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://www.coingecko.com/',
      'Origin': 'https://www.coingecko.com',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };

    const apiCall = {
      options: {
        provider: 'CoinGecko',
        endpoint: `${this.baseUrl}/coins/markets`,
        method: 'GET',
      },
      apiCall: () => this.fetchCryptoPrices(headers),
      dataProcessor: (data: CryptoData[]) => ({
        symbolsProcessed: data.length,
        successfulSymbols: data.filter(item => item && item.symbol && (item.buyPrice > 0 || item.sellPrice > 0)).length,
        failedSymbols: data.filter(item => !item || !item.symbol || (item.buyPrice <= 0 && item.sellPrice <= 0)).length,
      }),
    };

    const result = await this.executeWithTracking(
      apiCall.options,
      apiCall.apiCall,
      apiCall.dataProcessor
    );

    return {
      data: result.statusCode === 200 ? await apiCall.apiCall() : [],
      apiCalls: [result],
      totalSymbols: result.symbolsProcessed,
      successfulSymbols: result.successfulSymbols,
      failedSymbols: result.failedSymbols,
    };
  }

  /**
   * Private method to fetch crypto prices
   */
  private async fetchCryptoPrices(headers: any): Promise<CryptoData[]> {
    return this.circuitBreakerService.execute(
      'crypto-price-api',
      async () => {
        this.logger.log('Fetching crypto prices from CoinGecko API...');
        
        const response = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/coins/markets`, {
            params: {
              vs_currency: 'vnd',
              order: 'market_cap_desc',
              per_page: 100,
              page: 1,
              sparkline: false,
              price_change_percentage: '24h'
            },
            headers,
            timeout: this.timeout
          })
        );

        const cryptoPrices = this.parseCryptoData(response.data);
        this.logger.log(`Successfully fetched ${cryptoPrices.length} crypto prices from CoinGecko`);
        
        return cryptoPrices;
      },
      {
        failureThreshold: 3,
        timeout: 30000,
        successThreshold: 2,
        monitoringPeriod: 300000
      }
    ).catch(error => {
      this.logger.error('Failed to fetch crypto prices from CoinGecko:', error.message);
      throw new Error(`CoinGecko API call failed: ${error.message}`);
    });
  }

  /**
   * Get specific crypto price by symbol
   */
  async getCryptoPriceBySymbol(symbol: string): Promise<CryptoData | null> {
    try {
      const allPricesResult = await this.getAllCryptoPrices();
      const allPrices = allPricesResult.data;
      
      // Try exact match first
      let crypto = allPrices.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
      
      if (!crypto) {
        // Try common symbol mappings
        const symbolMappings: { [key: string]: string } = {
          'btc': 'bitcoin',
          'eth': 'ethereum',
          'bnb': 'binancecoin',
          'ada': 'cardano',
          'sol': 'solana',
          'xrp': 'ripple',
          'dot': 'polkadot',
          'doge': 'dogecoin',
          'avax': 'avalanche-2',
          'matic': 'matic-network',
          'link': 'chainlink',
          'ltc': 'litecoin',
          'atom': 'cosmos',
          'near': 'near',
          'ftm': 'fantom',
          'algo': 'algorand',
          'vet': 'vechain',
          'icp': 'internet-computer',
          'sand': 'the-sandbox',
          'mana': 'decentraland'
        };

        const mappedSymbol = symbolMappings[symbol.toLowerCase()];
        if (mappedSymbol) {
          crypto = allPrices.find(c => c.name.toLowerCase().includes(mappedSymbol.toLowerCase()));
        }
      }

      return crypto || null;

    } catch (error) {
      this.logger.error(`Failed to get crypto price for symbol ${symbol}:`, error.message);
      return null;
    }
  }


  /**
   * Parse crypto data from CoinGecko API response
   */
  private parseCryptoData(response: any[]): CryptoData[] {
    try {
      const cryptos: CryptoData[] = [];

      if (Array.isArray(response)) {
        response.forEach((item: any) => {
          if (item && typeof item === 'object') {
            const price = parseFloat(item.current_price || 0);
            const change24h = parseFloat(item.price_change_24h || 0);
            const changePercent24h = parseFloat(item.price_change_percentage_24h || 0);
            
            // Try to get lastUpdated from API data, fallback to current time
            let lastUpdated = new Date();
            if (item.last_updated || item.updated_at || item.timestamp) {
              const apiTime = item.last_updated || item.updated_at || item.timestamp;
              const parsedTime = new Date(apiTime);
              if (!isNaN(parsedTime.getTime())) {
                lastUpdated = parsedTime;
              }
            }
            
            const crypto: CryptoData = {
              symbol: item.symbol?.toUpperCase() || '',
              buyPrice: price,
              sellPrice: price,
              lastUpdated: lastUpdated,
              source: 'COINGECKO',
              type: 'CRYPTO',
              name: item.name || '',
              marketCap: parseFloat(item.market_cap || 0),
              volume24h: parseFloat(item.total_volume || 0),
              change24h: change24h,
              changePercent24h: changePercent24h,
              rank: parseInt(item.market_cap_rank || '0')
            };

            // Only add cryptos with valid data
            if (crypto.symbol && crypto.buyPrice > 0) {
              cryptos.push(crypto);
            }
          }
        });
      }

      // Sort by rank and return only TOP 20
      const top20Crypto = cryptos
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 20);
      
      return top20Crypto;

    } catch (error) {
      this.logger.error('Failed to parse CoinGecko crypto data:', error.message);
      return [];
    }
  }

  /**
   * Test API connectivity with circuit breaker protection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAllCryptoPrices();
      return true;
    } catch (error) {
      this.logger.error('CoinGecko API connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get circuit breaker statistics for crypto price API
   */
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getStats('crypto-price-api');
  }

  /**
   * Reset circuit breaker for crypto price API
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerService.reset('crypto-price-api');
  }
}
