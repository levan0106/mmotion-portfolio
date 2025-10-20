import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  FundData, 
  MarketDataResponse, 
  MarketDataType, 
  MarketDataSource 
} from '../types/market-data.types';
import { CircuitBreakerService } from '../../shared/services/circuit-breaker.service';
import { ApiTrackingBase } from '../base/api-tracking.base';
import { ApiResult } from '../interfaces/api-tracking.interface';

@Injectable()
export class FundPriceAPIClient extends ApiTrackingBase {
  private readonly baseUrl = 'https://api.fmarket.vn';
  private readonly timeout = 10000; // 10 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {
    super(FundPriceAPIClient.name);
  }

  /**
   * Get all fund prices from Fund API with circuit breaker protection
   */
  async getAllFundPrices(): Promise<ApiResult<FundData[]>> {
    const requestBody = {
      types: ['NEW_FUND', 'TRADING_FUND'],
      issuerIds: [],
      sortOrder: 'DESC',
      sortField: 'annualizedReturn36Months',
      page: 1,
      pageSize: 100,
      isIpo: false,
      fundAssetTypes: [],
      bondRemainPeriods: [],
      searchField: '',
      isBuyByReward: false,
      thirdAppIds: []
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Referer': 'https://fmarket.vn/',
      'Origin': 'https://fmarket.vn',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };

    const apiCall = {
      options: {
        provider: 'FMarket',
        endpoint: `${this.baseUrl}/res/products/filter`,
        method: 'POST',
        requestData: requestBody,
      },
      apiCall: () => this.fetchFundPrices(requestBody, headers),
      dataProcessor: (data: FundData[]) => ({
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
   * Private method to fetch fund prices
   */
  private async fetchFundPrices(requestBody: any, headers: any): Promise<FundData[]> {
    return this.circuitBreakerService.execute(
      'fund-price-api',
      async () => {
        this.logger.log('Fetching fund prices from FMarket API...');

        const requestBody = {
          types: ['NEW_FUND', 'TRADING_FUND'],
          issuerIds: [],
          sortOrder: 'DESC',
          sortField: 'annualizedReturn36Months',
          page: 1,
          pageSize: 100,
          isIpo: false,
          fundAssetTypes: [],
          bondRemainPeriods: [],
          searchField: '',
          isBuyByReward: false,
          thirdAppIds: []
        };

        const response: AxiosResponse<any> = await firstValueFrom(
          this.httpService.post(
            `${this.baseUrl}/res/products/filter`,
            requestBody,
            {
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': 'https://fmarket.vn/',
                'Origin': 'https://fmarket.vn',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
              },
              timeout: this.timeout
            }
          )
        );

        // Debug: Log response structure
        // this.logger.debug(`FMarket API response status: ${response.status}`);
        // this.logger.debug(`FMarket API response data keys: ${Object.keys(response.data || {})}`);
        // this.logger.debug(`FMarket API response preview: ${JSON.stringify(response.data).substring(0, 500)}`);

        // Check if response has success field
        if (response.data && typeof response.data === 'object') {
          if (response.data.success === false) {
            throw new Error(`FMarket API error: ${response.data.message || 'Unknown error'}`);
          }
          
          // If success is true or undefined, try to parse the data
          const funds = this.parseFundData(response.data);
          // this.logger.log(`Successfully fetched ${funds.length} fund prices from FMarket`);
          return funds;
        } else {
          throw new Error('FMarket API returned invalid response format');
        }
      },
      {
        failureThreshold: 3, // Open circuit after 3 failures
        timeout: 30000, // Wait 30 seconds before trying again
        successThreshold: 2, // Need 2 successes to close circuit
        monitoringPeriod: 300000 // 5 minutes monitoring window
      }
    ).catch(error => {
      this.logger.error('Failed to fetch fund prices from FMarket:', error.message);
      throw new Error(`FMarket API call failed: ${error.message}`);
    });
  }

  /**
   * Get specific fund price by symbol
   */
  async getFundPrice(symbol: string): Promise<FundData | null> {
    try {
      const allFundsResult = await this.getAllFundPrices();
      const allFunds = allFundsResult.data;
      return allFunds.find(fund => 
        fund.symbol === symbol ||
        fund.name.toLowerCase().includes(symbol.toLowerCase())
      ) || null;
    } catch (error) {
      this.logger.error(`Failed to get fund price for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Parse fund data from Fund API response
   */
  private parseFundData(response: any): FundData[] {
    try {
      const funds: FundData[] = [];

      // Debug: Log response structure
      // this.logger.debug(`Parsing fund data from response: ${JSON.stringify(response).substring(0, 200)}`);

      // Try different parsing strategies based on Power Query logic
      let fundData: any[] = [];

      // Strategy 1: Direct data access (response.data)
      if (response.data && typeof response.data === 'object') {
        const data = response.data;
        const dataKeys = Object.keys(data);
        
        // this.logger.debug(`Data keys: ${dataKeys.join(', ')}`);
        
        // Try to find array data in different keys
        for (const key of dataKeys) {
          const value = data[key];
          if (Array.isArray(value)) {
            fundData = value;
            // this.logger.debug(`Found fund data array in key: ${key}, length: ${value.length}`);
            break;
          } else if (value && typeof value === 'object') {
            // Check if it's a nested object with array
            const nestedKeys = Object.keys(value);
            for (const nestedKey of nestedKeys) {
              if (Array.isArray(value[nestedKey])) {
                fundData = value[nestedKey];
                // this.logger.debug(`Found fund data array in nested key: ${key}.${nestedKey}, length: ${value[nestedKey].length}`);
                break;
              }
            }
            if (fundData.length > 0) break;
          }
        }
      }

      // Strategy 2: Direct array access
      if (fundData.length === 0 && Array.isArray(response)) {
        fundData = response;
        // this.logger.debug(`Using direct array access, length: ${response.length}`);
      }

      // Strategy 3: Look for specific structure based on Power Query
      if (fundData.length === 0 && response.data) {
        const data = response.data;
        const dataKeys = Object.keys(data);
        
        // Power Query uses: Record.ToTable(data) then {3}[Value]
        // This means we need to find the 4th item (index 3) in the converted table
        if (dataKeys.length > 3) {
          const fourthKey = dataKeys[3];
          const fourthValue = data[fourthKey];
          
          // this.logger.debug(`Trying Power Query approach - 4th key: ${fourthKey}, value type: ${typeof fourthValue}`);
          
          if (Array.isArray(fourthValue)) {
            fundData = fourthValue;
            // this.logger.debug(`Found fund data using Power Query approach, length: ${fourthValue.length}`);
          } else if (fourthValue && typeof fourthValue === 'object' && fourthValue.Value) {
            fundData = Array.isArray(fourthValue.Value) ? fourthValue.Value : [fourthValue.Value];
            // this.logger.debug(`Found fund data using Power Query Value approach, length: ${fundData.length}`);
          }
        }
      }

      // Parse the found fund data
      if (fundData.length > 0) {
        fundData.forEach((item: any) => {
          if (item && typeof item === 'object') {
            const price = parseFloat(item.nav || item.price || item.currentPrice || 0);
            
            // Try to get lastUpdated from API data, fallback to current time
            let lastUpdated = new Date();
            if (item.lastUpdated || item.updatedAt || item.timestamp) {
              const apiTime = item.lastUpdated || item.updatedAt || item.timestamp;
              const parsedTime = new Date(apiTime);
              if (!isNaN(parsedTime.getTime())) {
                lastUpdated = parsedTime;
              }
            }
            
            const fund: FundData = {
              symbol: item.shortName || item.symbol || item.code || '',
              buyPrice: price,
              sellPrice: price,
              lastUpdated: lastUpdated,
              source: 'FMARKET',
              type: 'FUND',
              name: item.name || item.productName || ''
            };

            // Only add funds with valid data
            if (fund.name && fund.symbol && fund.buyPrice > 0) {
              funds.push(fund);
            }
          }
        });
      } else {
        this.logger.warn('No fund data found in response');
      }

      return funds;
    } catch (error) {
      this.logger.error('Failed to parse FMarket fund data:', error.message);
      return [];
    }
  }

  /**
   * Test API connectivity with circuit breaker protection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAllFundPrices();
      return true;
    } catch (error) {
      this.logger.error('FMarket API connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get circuit breaker statistics for fund price API
   */
  getCircuitBreakerStats() {
    return this.circuitBreakerService.getStats('fund-price-api');
  }

  /**
   * Reset circuit breaker for fund price API
   */
  resetCircuitBreaker(): void {
    this.circuitBreakerService.reset('fund-price-api');
  }
}
