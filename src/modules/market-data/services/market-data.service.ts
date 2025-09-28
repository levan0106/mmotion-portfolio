import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { format } from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ExternalMarketDataService } from './external-market-data.service';
import { MarketDataResult } from '../types/market-data.types';
import { AssetPriceHistory } from '../../asset/entities/asset-price-history.entity';
import { GlobalAsset } from '../../asset/entities/global-asset.entity';
import { PriceType, PriceSource } from '../../asset/enums/price-type.enum';

export interface MarketPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export interface MarketDataConfig {
  symbols: string[];
}

export interface MarketDataPoint {
  date: string;
  closePrice: number;
  change: number;
  changePercent: number;
  volume: number;
  value: number;
  source: string;
  metadata?: any;
}

export interface MarketDataApiResponse {
  Data: {
    TotalCount: number;
    Data: Array<{
      Ngay: string; // Date in DD/MM/YYYY format
      GiaDieuChinh: number; // Adjusted Price
      GiaDongCua: number; // Closing Price
      ThayDoi: string; // Change (e.g., "1.35(0.08 %)")
      KhoiLuongKhopLenh: number;
      GiaTriKhopLenh: number;
      KLThoaThuan: number;
      GtThoaThuan: number;
      GiaMoCua: number;
      GiaCaoNhat: number;
      GiaThapNhat: number;
    }>;
  };
  Message: string | null;
  Success: boolean;
}

/**
 * Market Data Service - Pure Cache
 * No timers, just manages in-memory market data cache
 * Updated by AutoSyncService only
 */
@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private marketPrices = new Map<string, MarketPrice>();
  private coinGeckoIdCache = new Map<string, string>(); // Cache for CoinGecko IDs
  private config: MarketDataConfig = {
    symbols: ['VFF', 'VESAF', 'DOJI', '9999', 'HPG', 'VCB', 'VIC', 'VHM', 'SSISCA'],
  };

  private readonly stockHistoricalDataUrl = 'https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx';
  private readonly fundHistoricalDataUrl = 'https://api.fmarket.vn/res/product/get-nav-history';
  private readonly fundListUrl = 'https://api.fmarket.vn/res/products/filter';
  private readonly goldHistoricalDataUrl = 'https://cafef.vn/du-lieu';
  private readonly exchangeRateHistoricalDataUrl = 'https://api.vietcombank.com.vn/exchange-rate';
  private readonly cryptoHistoricalDataUrl = 'https://api.coingecko.com/api/v3';

  constructor(
    private readonly externalMarketDataService: ExternalMarketDataService,
    private readonly httpService: HttpService,
    @InjectRepository(AssetPriceHistory)
    private readonly assetPriceHistoryRepository: Repository<AssetPriceHistory>,
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>
  ) {
    this.logger.log('Market Data Service initialized with external API integration and database storage');
  }


  /**
   * Update all market prices - called by AutoSyncService
   * This replaces the old timer-based update
   */
  async updateAllPrices(): Promise<void> {
    this.logger.log('Updating all market prices...');
    
    try {
      // Try to fetch real-time data from external APIs
      const externalData = await this.externalMarketDataService.fetchAllMarketData();
      
      if (externalData.success && externalData.errors.length === 0) {
        this.logger.log('Successfully fetched real-time data from external APIs');
        await this.updatePricesFromExternalData(externalData);
      } else {
        this.logger.warn('External API fetch failed, no fallback available');
        this.logger.warn('External API errors:', externalData.errors);
        throw new Error('Failed to fetch market data from external APIs');
      }
    } catch (error) {
      this.logger.error('Failed to fetch external data:', error.message);
      throw error;
    }
    
    this.logger.log(`Updated ${this.marketPrices.size} market prices`);

    this.logger.debug(`Updated market prices for ${this.marketPrices.size} symbols`);
  }

  /**
   * Update prices from external API data
   */
  private async updatePricesFromExternalData(externalData: MarketDataResult): Promise<void> {
    // Update fund prices
    this.updatePricesFromDataArray(externalData.funds, 'symbol', 'buyPrice');
    
    // Update gold prices
    this.updatePricesFromDataArray(externalData.gold, 'type', 'buyPrice');
    
    // Update exchange rates
    this.updatePricesFromDataArray(externalData.exchangeRates, 'currency', 'buyPrice');
    
    // Update stock prices
    this.updatePricesFromDataArray(externalData.stocks, 'symbol', 'buyPrice');
  }

  /**
   * Helper method to update prices from an array of data objects
   * @param dataArray - Array of data objects
   * @param symbolKey - Key for symbol in data object
   * @param priceKey - Key for price in data object
   */
  private updatePricesFromDataArray<T extends Record<string, any>>(
    dataArray: T[],
    symbolKey: keyof T,
    priceKey: keyof T
  ): void {
    for (const item of dataArray) {
      const symbol = item[symbolKey] as string;
      const price = item[priceKey] as number;
      const previousPrice = this.marketPrices.get(symbol)?.price;
      this.marketPrices.set(symbol, this.createMarketPrice(symbol, price, previousPrice));
    }
  }


  /**
   * Get current market price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    const marketPrice = this.marketPrices.get(symbol);
    if (!marketPrice) {
      this.logger.warn(`Symbol ${symbol} not found in market data`);
      return 0;
    }
    return marketPrice.price;
  }

  /**
   * Get current market data for a symbol
   */
  async getMarketData(symbol: string): Promise<MarketPrice | null> {
    return this.marketPrices.get(symbol) || null;
  }

  /**
   * Get market data for multiple symbols
   */
  async getMarketDataBatch(symbols: string[]): Promise<Map<string, MarketPrice>> {
    const result = new Map<string, MarketPrice>();
    for (const symbol of symbols) {
      const data = this.marketPrices.get(symbol);
      if (data) {
        result.set(symbol, data);
      }
    }
    return result;
  }

  /**
   * Get all market data
   */
  async getAllMarketData(): Promise<MarketPrice[]> {
    return Array.from(this.marketPrices.values());
  }


  /**
   * Get market data configuration
   */
  getConfig(): MarketDataConfig {
    return { ...this.config };
  }

  /**
   * Update market data configuration
   */
  updateConfig(newConfig: Partial<MarketDataConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.log('Market data configuration updated');
  }



  // ==================== PROVIDER-SPECIFIC HISTORICAL DATA METHODS ====================

  /**
   * Get stock/ETF historical data from CAFEF API
   */
  private async getStockHistoricalDataFromCAFEF(
    symbol: string,
    startDate: string,
    endDate: string,
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<MarketDataPoint[]> {

    const multiplyBy = 1000; //due to CAFEF API returns price in VND

    try {
      this.logger.log(`Fetching stock data from CAFEF for ${symbol}`);
      
      const url = `${this.stockHistoricalDataUrl}?Symbol=${symbol}&StartDate=${startDate}&EndDate=${endDate}&PageIndex=${pageIndex}&PageSize=${pageSize}`;

      const response = await firstValueFrom(
        this.httpService.get<MarketDataApiResponse>(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Referer': 'https://cafef.vn/',
          },
        })
      );

      if (!response.data.Success) {
        throw new Error(`${symbol} CAFEF API error: ${response.data.Message || 'Unknown error'}`);
      }

      if (!response.data.Data || !response.data.Data.Data) {
        this.logger.warn(`No data returned from CAFEF API for ${symbol}`);
        return [];
      }

      const marketData = response.data.Data.Data.map(item => this.transformMarketData(item, multiplyBy));
      this.logger.log(`Successfully fetched ${marketData.length} stock data points from CAFEF for ${symbol}`);
      
      // Debug logging for data points
      marketData.forEach((point, index) => {
        this.logger.log(`Data point ${index + 1}: date=${point.date}, price=${point.closePrice}, change=${point.change}`);
      });
      
      // Debug logging for raw API data
      response.data.Data.Data.forEach((item, index) => {
        this.logger.log(`Raw data ${index + 1}: GiaDongCua=${item.GiaDongCua}, GiaDieuChinh=${item.GiaDieuChinh}, Ngay=${item.Ngay}`);
      });
      
      return marketData;
    } catch (error) {
      this.logger.error(`Error fetching stock data from CAFEF for ${symbol}: ${error.message}`);
      return []; // Return empty array instead of throwing error
    }
  }

  /**
   * Get fund historical data from FMarket API
   */
  private async getHistoricalDataFromFMarket(
    symbol: string,
    startDate: string,
    endDate: string,
    pageIndex: number = 1,
    pageSize: number = 20,
    assetType: string = 'FUND'
  ): Promise<MarketDataPoint[]> {
    try {
      this.logger.log(`Fetching fund data from FMarket for ${symbol}`);
      
      // Step 1: Find fund ID by symbol
      const fundId = await this.findFundIdBySymbol(symbol);
      if (!fundId) {
        this.logger.warn(`Fund ID not found for symbol ${symbol}`);
        return [];
      }
      
      this.logger.log(`Using fund ID ${fundId} for symbol ${symbol}`);
      
      const url = this.fundHistoricalDataUrl;
      const headers = {
        'Content-Type': 'application/json',
      };

      // Convert date format from YYYY-MM-DD to yyyyMMdd for FMarket API
      const formatDateForFMarket = (dateStr: string) => {
        this.logger.debug(`Formatting date: ${dateStr}`);
        try {
          const date = new Date(dateStr); // tạo Date object

          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');

          const result = `${yyyy}${mm}${dd}`;
          this.logger.debug(`Formatted date: ${result}`);
          return result;
        } catch (error) {
          this.logger.warn(`Invalid date format: ${dateStr}`);
          return dateStr; // Return original if can't format
        }
        
      };

      const body = {
        isAllData: false,
        productId: fundId, // Use fund ID from lookup
        fromDate: formatDateForFMarket(startDate),
        toDate: formatDateForFMarket(endDate),
        pageIndex: 1,
        pageSize: 100,
        assetType: 'FUND'
      };

      this.logger.debug(`FMarket API Request for FUND: ${JSON.stringify(body)}`);

      const response = await firstValueFrom(
        this.httpService.post(url, body, {
          headers,
          timeout: 10000,
        })
      );

      // Check if API call was successful
      if (response.data.status !== 200 || response.data.code !== 200) {
        this.logger.warn(`FMarket API error for FUND ${symbol}: ${response.data.message || 'Unknown error'}`);
        this.logger.warn(`FMarket API response: ${JSON.stringify(response.data)}`);
        return [];
      }

      // Check if response.data is directly an array (correct structure)
      const fmarketData = response.data.data || [];
      this.logger.log(`Got ${fmarketData.length} records from FMarket for FUND ${symbol}`);
      
      // Convert FMarket data to MarketDataPoint format
      return fmarketData.map((item: any) => ({
        symbol: symbol,
        date: item.navDate, // Use navDate field from FMarket response
        closePrice: parseFloat(item.nav) || 0,
        change: parseFloat(item.change) || 0,
        source: 'FMARKET_API',
        metadata: {
          productId: item.productId,
          nav: item.nav,
          assetType: assetType,
          originalData: item
        }
      }));

    } catch (error) {
      this.logger.error(`Error fetching fund data from FMarket for ${symbol}: ${error.message}`);
      return []; // Return empty array instead of throwing error
    }
  }

  // Cache for fund list to avoid repeated API calls
  private fundListCache: { data: any[], timestamp: number } | null = null;
  private readonly FUND_LIST_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get fund list from FMarket API with caching
   */
  private async getFundListFromFMarket(): Promise<any[]> {
    try {
      // Check cache first
      if (this.fundListCache && 
          (Date.now() - this.fundListCache.timestamp) < this.FUND_LIST_CACHE_TTL) {
        this.logger.log(`Using cached fund list (${this.fundListCache.data.length} funds)`);
        return this.fundListCache.data;
      }

      this.logger.log('Fetching fund list from FMarket (cache miss or expired)');
      
      const url = this.fundListUrl;
      const headers = {
        'Content-Type': 'application/json',
      };

      const bodies = [{
        types: ["NEW_FUND", "TRADING_FUND"],
        page: 1,
        pageSize: 1000,
        sortOrder: "DESC",
        sortField: "navTo12Months",
        isIpo: false,
        fundAssetTypes: ["STOCK","BOND","BALANCED"]
      },{
        types: ["NEW_FUND", "TRADING_FUND"],
        page: 1,
        pageSize: 1000,
        sortOrder: "DESC",
        sortField: "navTo12Months",
        isIpo: false,
        isMMFFund: true
      }];

      // Try body first
      let response;
      let fundList: any[] = [];
      for (const body of bodies) {
          this.logger.log(`Trying body ${body.isMMFFund ? 'with' : 'without'} isMMFFund`);
          response = await this.httpService.post(url, body, { headers }).toPromise();
          fundList.push(...this.parseFundListResponse(response));
          
          if (fundList.length > 0) {
            this.logger.log(`Body ${body.isMMFFund ? 'with' : 'without'} isMMFFund successful: Found ${fundList.length} funds`);
          } else {
            throw new Error(`No funds found in body ${body.isMMFFund ? 'with' : 'without'} isMMFFund response`);
          }        
      }

      // Cache the result
      this.fundListCache = {
        data: fundList,
        timestamp: Date.now()
      };

      this.logger.log(`Cached ${fundList.length} funds from FMarket`);
      return fundList;
      
    } catch (error) {
      this.logger.error(`Error fetching fund list from FMarket: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse fund list response from FMarket API
   */
  private parseFundListResponse(response: any): any[] {
    // Check if response.data.data.rows is an array (nested structure) - CORRECT STRUCTURE
    if (response.data && response.data.data && response.data.data.rows && Array.isArray(response.data.data.rows)) {
      this.logger.log(`Found ${response.data.data.rows.length} funds from FMarket`);
      return response.data.data.rows;
    } 
    // Check if response.data.rows is an array (alternative structure)
    else if (response.data && response.data.rows && Array.isArray(response.data.rows)) {
      this.logger.log(`Found ${response.data.rows.length} funds from FMarket`);
      return response.data.rows;
    } 
    // Check if response.data is directly an array
    else if (response.data && Array.isArray(response.data)) {
      this.logger.log(`Found ${response.data.length} funds from FMarket`);
      return response.data;
    } 
    // Check if response.data.data is an array
    else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      this.logger.log(`Found ${response.data.data.length} funds from FMarket`);
      return response.data.data;
    } else {
      this.logger.warn(`Invalid response format from FMarket fund list API. Response: ${JSON.stringify(response.data)}`);
      return [];
    }
  }

  /**
   * Find fund ID by symbol from FMarket fund list
   */
  private async findFundIdBySymbol(symbol: string): Promise<string | null> {
    try {
      const fundList = await this.getFundListFromFMarket();
      
      if (fundList.length === 0) {
        this.logger.warn('No funds found in FMarket list');
        return null;
      }

      // Search for fund by shortName (symbol)
      const fund = fundList.find(f => 
        f.shortName && f.shortName.toUpperCase() === symbol.toUpperCase()
      );

      if (fund) {
        this.logger.log(`Found fund ID ${fund.id} for symbol ${symbol}`);
        return fund.id;
      }
      
      // Fallback: try using symbol directly as fund ID
      this.logger.log(`Trying symbol ${symbol} directly as fund ID`);
      return symbol;
    } catch (error) {
      this.logger.error(`Error finding fund ID for symbol ${symbol}: ${error.message}`);
      // Fallback: try using symbol directly as fund ID
      this.logger.log(`Fallback: trying symbol ${symbol} directly as fund ID`);
      return symbol;
    }
  }

  /**
   * Get gold historical data from Doji API
   */
  private async getGoldHistoricalDataFromCAFEF(
    symbol: string,
    startDate: string,
    endDate: string,
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<MarketDataPoint[]> {
    try {
      this.logger.log(`Fetching gold data from CAFEF for ${symbol}`);
      
      const url = `${this.goldHistoricalDataUrl}/Ajax/AjaxGoldPriceRing.ashx?time=1y&zone=11`;
      const url2 = `${this.goldHistoricalDataUrl}/Ajax/ajaxgoldpricehistory.ashx?index=1y`;

      const response1 = await firstValueFrom(
        this.httpService.get(url)
      );

      const response2 = await firstValueFrom(
        this.httpService.get(url2)
      );


       // Parse response based on symbol type
       let goldData: any[] = [];
       
        if (symbol.includes('SJC')) {
          // SJC uses response2 with goldPriceWorldHistories array
          if (response2.data && response2.data.Data && response2.data.Data.goldPriceWorldHistories 
           && Array.isArray(response2.data.Data.goldPriceWorldHistories)) {
            goldData = response2.data.Data.goldPriceWorldHistories.map((item: any) => ({
              ...item,
              date: item.createdAt?.split('T')[0],
              price: parseFloat(item.buyPrice) * 100000 // multiply by 100000 for SJC
            }));
          } else {
            this.logger.warn(`No SJC data found in CAFEF response2`);
            return [];
          }
        } else {
          // Other gold symbols use response1 with goldPriceWorlds (single object)
          if (response1.data && response1.data.Data && response1.data.Data.goldPriceWorldHistories 
           && Array.isArray(response1.data.Data.goldPriceWorldHistories)) {
            goldData = response1.data.Data.goldPriceWorldHistories.map((item: any) => ({
              ...item,
              date: item.lastUpdated?.split(' ')[0], // Use lastUpdated instead of lastUpdate
              price: parseFloat(item.buyPrice) * 1000 // multiply by 1000 for DOJI
            }));
          } else {
            this.logger.warn(`No ${symbol} data found in CAFEF response1`);
            return [];
          }
        }

        // filter goldData by date between startDate and endDate
        goldData = goldData.filter((item: any) => {
          return new Date(item.date) >= new Date(startDate) && new Date(item.date) <= new Date(endDate) && item.date !== 'Invalid Date';
        });

       // Convert CAFEF data to MarketDataPoint format
       return goldData.map((item: any) => {

         return {
           symbol: symbol,
           date: item.date,
           closePrice: item.price,
           value: item.price, // Use price as value for gold
           change:  0,
           changePercent: 0,
           volume: 0, // Gold doesn't have volume
           source: 'CAFEF_API',
           metadata: {
             originalData: item,
             assetType: 'GOLD'
           }
         };
       });
    } catch (error) {
      this.logger.error(`Error fetching gold data from CAFEF for ${symbol}: ${error.message}`);
      return []; // Return empty array instead of throwing error
    }
  }

  /**
   * Get exchange rate historical data from Vietcombank API
   */
  private async getExchangeRateHistoricalDataFromVietcombank(
    symbol: string,
    startDate: string,
    endDate: string,
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<MarketDataPoint[]> {
    try {
      this.logger.log(`Fetching exchange rate data from Vietcombank for ${symbol}`);
      
      // TODO: Implement Vietcombank API integration
      // This would call the exchange-rate-api.client.ts
      this.logger.warn(`Vietcombank historical data not yet implemented for ${symbol}`);
      
      // Placeholder implementation
      return [];
    } catch (error) {
      this.logger.error(`Error fetching exchange rate data from Vietcombank for ${symbol}: ${error.message}`);
      return []; // Return empty array instead of throwing error
    }
  }

  /**
   * Get crypto historical data from CoinGecko API
   */
  private async getCryptoHistoricalDataFromCoinGecko(
    symbol: string,
    startDate: string,
    endDate: string,
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<MarketDataPoint[]> {
    try {
      this.logger.log(`Fetching crypto data from CoinGecko for ${symbol}`);
      
      // Convert dates to Unix timestamps
      const fromTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
      const toTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
      
      // Map common crypto symbols to CoinGecko IDs
      const coinGeckoId = await this.getCoinGeckoId(symbol);
      
      const url = `${this.cryptoHistoricalDataUrl}/coins/${coinGeckoId}/market_chart/range`;
      const params = {
        vs_currency: 'vnd',
        from: fromTimestamp.toString(),
        to: toTimestamp.toString(),
      };

      this.logger.log(`CoinGecko API Request: ${url}?${new URLSearchParams(params).toString()}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params,
          timeout: 15000,
        })
      );

      if (!response.data || !response.data.prices) {
        this.logger.warn(`No price data received from CoinGecko for ${symbol}`);
        return [];
      }

      const priceData = response.data.prices || [];
      const marketCapData = response.data.market_caps || [];
      const volumeData = response.data.total_volumes || [];

      this.logger.log(`Got ${priceData.length} price records from CoinGecko for ${symbol}`);
      
      // Debug: Log sample data format
      if (priceData.length > 0) {
        this.logger.debug(`Sample price data format: ${JSON.stringify(priceData[0])}`);
        this.logger.debug(`Sample market cap data format: ${JSON.stringify(marketCapData[0] || 'N/A')}`);
        this.logger.debug(`Sample volume data format: ${JSON.stringify(volumeData[0] || 'N/A')}`);
      }

      // Convert CoinGecko data to MarketDataPoint format
      const marketDataPoints: MarketDataPoint[] = [];
      
      // Group data by date to avoid multiple records per day
      const dailyDataMap = new Map<string, any>();
      
      for (let i = 0; i < priceData.length; i++) {
        const priceEntry = priceData[i];
        if (!Array.isArray(priceEntry) || priceEntry.length < 2) {
          this.logger.warn(`Invalid price data format at index ${i}: ${JSON.stringify(priceEntry)}`);
          continue;
        }
        
        const [timestamp, price] = priceEntry;
        
        // Validate timestamp and price
        if (typeof timestamp !== 'number' || typeof price !== 'number' || 
            isNaN(timestamp) || isNaN(price) || price <= 0) {
          this.logger.warn(`Invalid timestamp or price at index ${i}: timestamp=${timestamp}, price=${price}`);
          continue;
        }
        
        const marketCap = marketCapData[i] && Array.isArray(marketCapData[i]) ? marketCapData[i][1] : 0;
        const volume = volumeData[i] && Array.isArray(volumeData[i]) ? volumeData[i][1] : 0;
        
        // Convert timestamp to proper date - CoinGecko returns milliseconds
        let dateString: string;
        try {
          // Check if timestamp is in milliseconds (13 digits) or seconds (10 digits)
          const timestampStr = timestamp.toString();
          let date: Date;
          
          this.logger.debug(`Processing timestamp ${timestamp} (${timestampStr.length} digits) for ${symbol}`);
          
          if (timestampStr.length === 13) {
            // Already in milliseconds
            date = new Date(timestamp);
            this.logger.debug(`Using timestamp as milliseconds: ${timestamp}`);
          } else if (timestampStr.length === 10) {
            // In seconds, convert to milliseconds
            date = new Date(timestamp * 1000);
            this.logger.debug(`Converting seconds to milliseconds: ${timestamp} -> ${timestamp * 1000}`);
          } else {
            this.logger.warn(`Invalid timestamp format for ${symbol}: ${timestamp} (${timestampStr.length} digits)`);
            continue;
          }
          
          if (isNaN(date.getTime())) {
            this.logger.warn(`Invalid date created from timestamp ${timestamp} for ${symbol}`);
            continue;
          }
          
          dateString = date.toISOString();
          this.logger.debug(`Converted timestamp ${timestamp} to date: ${dateString}`);
        } catch (error) {
          this.logger.warn(`Error converting timestamp ${timestamp} for ${symbol}: ${error.message}`);
          continue;
        }

        // Group by date (YYYY-MM-DD) to keep only the latest record per day
        const dateKey = dateString.split('T')[0]; // Get YYYY-MM-DD part
        
        // Keep the latest record for each day (highest timestamp)
        if (!dailyDataMap.has(dateKey) || timestamp > dailyDataMap.get(dateKey).originalTimestamp) {
          dailyDataMap.set(dateKey, {
            date: dateString, // Keep original API date - localtime processing will be handled in savePriceHistoryToDB
            closePrice: price,
            volume: volume,
            value: marketCap,
            originalTimestamp: timestamp,
            marketCap: marketCap,
            totalVolume: volume
          });
        }
      }

      // Convert grouped data to MarketDataPoint format
      const sortedDates = Array.from(dailyDataMap.keys()).sort();
      let previousPrice = 0;
      
      for (const dateKey of sortedDates) {
        const dayData = dailyDataMap.get(dateKey);
        
        // Calculate change from previous day
        let change = 0;
        let changePercent = 0;
        
        if (previousPrice > 0) {
          change = dayData.closePrice - previousPrice;
          changePercent = (change / previousPrice) * 100;
        }
        
        previousPrice = dayData.closePrice;
        
        const newDate = dayData.date.split('T')[0]; // get YYYY-MM-DD from ISO string

        marketDataPoints.push({
          date: newDate, // Original API date - localtime processing handled in savePriceHistoryToDB
          closePrice: dayData.closePrice,
          change: change,
          changePercent: changePercent,
          volume: dayData.volume,
          value: dayData.value, // Use market cap as value for crypto
          source: 'COINGECKO_API',
          metadata: {
            symbol: symbol,
            coinGeckoId: coinGeckoId,
            marketCap: dayData.marketCap,
            totalVolume: dayData.totalVolume,
            originalTimestamp: dayData.originalTimestamp,
            assetType: 'CRYPTO'
          }
        });
      }
      
      this.logger.log(`Grouped ${priceData.length} hourly records into ${marketDataPoints.length} daily records for ${symbol}`);

      // Apply pagination
      const startIndex = (pageIndex - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = marketDataPoints.slice(startIndex, endIndex);

      this.logger.log(`Returning ${paginatedData.length} paginated records for ${symbol}`);
      return paginatedData;

    } catch (error) {
      this.logger.error(`Error fetching crypto data from CoinGecko for ${symbol}: ${error.message}`);
      return []; // Return empty array instead of throwing error
    }
  }

  /**
   * Map crypto symbols to CoinGecko IDs with automatic lookup and caching
   */
  private async getCoinGeckoId(symbol: string): Promise<string> {
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'XRP': 'ripple',
      'DOT': 'polkadot',
      'DOGE': 'dogecoin',
      'AVAX': 'avalanche-2',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'ATOM': 'cosmos',
      'FTM': 'fantom',
      'NEAR': 'near',
      'ALGO': 'algorand',
      'VET': 'vechain',
      'ICP': 'internet-computer',
      'FIL': 'filecoin',
      'TRX': 'tron',
      'ETC': 'ethereum-classic',
      'XLM': 'stellar',
      'MANA': 'decentraland',
      'SAND': 'the-sandbox',
      'AXS': 'axie-infinity',
      'CHZ': 'chiliz',
      'ENJ': 'enjincoin',
    };

    const upperSymbol = symbol.toUpperCase();
    
    // Check cache first
    if (this.coinGeckoIdCache.has(upperSymbol)) {
      const cachedId = this.coinGeckoIdCache.get(upperSymbol);
      this.logger.debug(`Using cached CoinGecko ID for ${symbol}: ${cachedId}`);
      return cachedId;
    }
    
    // Return mapped ID if exists
    if (symbolMap[upperSymbol]) {
      const mappedId = symbolMap[upperSymbol];
      this.coinGeckoIdCache.set(upperSymbol, mappedId); // Cache it
      return mappedId;
    }

    // Try to find automatically from CoinGecko API
    try {
      this.logger.log(`Looking up CoinGecko ID for symbol: ${symbol}`);
      
      const searchUrl = `${this.cryptoHistoricalDataUrl}/search`;
      const response = await firstValueFrom(
        this.httpService.get(searchUrl, {
          params: { query: symbol },
          timeout: 10000,
        })
      );

      if (response.data && response.data.coins && response.data.coins.length > 0) {
        const coin = response.data.coins[0];
        const coinId = coin.id;
        this.logger.log(`Found CoinGecko ID for ${symbol}: ${coinId}`);
        
        // Cache the result
        this.coinGeckoIdCache.set(upperSymbol, coinId);
        return coinId;
      }

      this.logger.warn(`No CoinGecko ID found for symbol: ${symbol}`);
      const fallbackId = symbol.toLowerCase();
      this.coinGeckoIdCache.set(upperSymbol, fallbackId); // Cache fallback too
      return fallbackId;

    } catch (error) {
      this.logger.error(`Failed to lookup CoinGecko ID for ${symbol}: ${error.message}`);
      const fallbackId = symbol.toLowerCase();
      this.coinGeckoIdCache.set(upperSymbol, fallbackId); // Cache fallback too
      return fallbackId;
    }
  }

  // ==================== CAFEF API METHODS ====================

  /**
   * Fetch historical market data from appropriate API based on asset type
   * @param symbol - Market symbol (e.g., VNIndex, HNXIndex, etc.)
   * @param assetType - Type of asset (FUND, GOLD, STOCK, etc.)
   * @param startDate - Start date in MM/DD/YYYY format
   * @param endDate - End date in MM/DD/YYYY format
   * @param pageIndex - Page index (default: 1)
   * @param pageSize - Page size (default: 20)
   * @returns Promise<MarketDataPoint[]>
   */
  async getHistoricalMarketDataFromAPI(
    symbol: string,
    assetType: string,
    startDate: string,
    endDate: string,
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<MarketDataPoint[]> {
    try {
      this.logger.log(`Fetching ${symbol} (${assetType}) data from ${startDate} to ${endDate}`);

      // Route to appropriate provider based on asset type
      switch (assetType.toUpperCase()) {
        case 'STOCK':
        case 'ETF':
          // Thử CAFEF trước, nếu không có dữ liệu thì fallback sang FMarket
          try {
            const cafefData = await this.getStockHistoricalDataFromCAFEF(symbol, startDate, endDate, pageIndex, pageSize);
            if (cafefData && cafefData.length > 0) {
              this.logger.log(`Got ${cafefData.length} records from CAFEF for ${symbol}`);
              return cafefData;
            }
          } catch (error) {
            this.logger.warn(`CAFEF failed for ${symbol}, trying FMarket: ${error.message}`);
          }
          
          // Fallback to FMarket for STOCK
          this.logger.log(`Trying FMarket API for STOCK ${symbol}`);
          const stockData = await this.getHistoricalDataFromFMarket(symbol, startDate, endDate, pageIndex, pageSize, assetType);
          if (stockData && stockData.length > 0) {
            this.logger.log(`Got ${stockData.length} records from FMarket for ${symbol}`);
            return stockData;
          }
          this.logger.warn(`FMarket failed for ${symbol}`);
          return [];
        
        case 'BOND':
          // BOND thường không có trên CAFEF, sử dụng FMarket trực tiếp
          this.logger.log(`Using FMarket API for BOND ${symbol}`);
          const bondData = await this.getHistoricalDataFromFMarket(symbol, startDate, endDate, pageIndex, pageSize, assetType);
          if (bondData && bondData.length > 0) {
            this.logger.log(`Got ${bondData.length} records from FMarket for ${symbol}`);
            return bondData;
          }
          this.logger.warn(`FMarket failed for ${symbol}`);
          return [];
        
        case 'FUND':
          const fundData = await this.getHistoricalDataFromFMarket(symbol, startDate, endDate, pageIndex, pageSize, assetType);
          if (fundData && fundData.length > 0) {
            this.logger.log(`Got ${fundData.length} records from FMarket for ${symbol}`);
            return fundData;
          }
          this.logger.warn(`FMarket failed for ${symbol}`);
          return [];
        
        case 'GOLD':
          const goldData = await this.getGoldHistoricalDataFromCAFEF(symbol, startDate, endDate, pageIndex, pageSize);
          if (goldData && goldData.length > 0) {
            this.logger.log(`Got ${goldData.length} records from CAFEF for ${symbol}`);
            return goldData;
          }
          this.logger.warn(`Gold CAFEF failed for ${symbol}`);
          return [];
        
        case 'EXCHANGE_RATE':
          return this.getExchangeRateHistoricalDataFromVietcombank(symbol, startDate, endDate, pageIndex, pageSize);
        
        case 'CRYPTO':
          const cryptoData = await this.getCryptoHistoricalDataFromCoinGecko(symbol, startDate, endDate, pageIndex, pageSize);
          if (cryptoData && cryptoData.length > 0) {
            this.logger.log(`Got ${cryptoData.length} records from CoinGecko for ${symbol}`);
            return cryptoData;
          }
          return [];
        
        default:
          this.logger.warn(`Unknown asset type: ${assetType}, returning empty array`);
          return [];
      }
    } catch (error) {
      this.logger.error(`Error fetching ${symbol} (${assetType}) data: ${error.message}`, error.stack);
      return []; // Return empty array instead of throwing error
    }
  }

  /**
   * Get historical market data for a specific date range from API
   * @param symbol - Market symbol
   * @param assetType - Type of asset (FUND, GOLD, STOCK, etc.)
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<MarketDataPoint[]>
   */
  async getHistoricalMarketDataForDateRangeFromAPI(
    symbol: string,
    assetType: string,
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataPoint[]> {
    const startDateStr = this.formatDateForMarketAPI(startDate);
    const endDateStr = this.formatDateForMarketAPI(endDate);

    return this.getHistoricalMarketDataFromAPI(symbol, assetType, startDateStr, endDateStr, 1, 1000);
  }

  /**
   * Get historical market data for the last N months from API
   * @param symbol - Market symbol
   * @param assetType - Type of asset (FUND, GOLD, STOCK, etc.)
   * @param months - Number of months to look back
   * @returns Promise<MarketDataPoint[]>
   */
  async getHistoricalMarketDataForLastMonthsFromAPI(symbol: string, assetType: string, months: number): Promise<MarketDataPoint[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    return this.getHistoricalMarketDataForDateRangeFromAPI(symbol, assetType, startDate, endDate);
  }

  /**
   * Calculate market returns for benchmark comparison from API data
   * @param symbol - Market symbol
   * @param assetType - Type of asset (FUND, GOLD, STOCK, etc.)
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Array<{date: string, return: number}>>
   */
  async getMarketDataReturnsFromAPI(
    symbol: string,
    assetType: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{date: string, return: number}>> {
    try {
      const marketData = await this.getHistoricalMarketDataForDateRangeFromAPI(symbol, assetType, startDate, endDate);

      if (marketData.length < 2) {
        this.logger.warn(`Insufficient ${symbol} data for return calculation`);
        return [];
      }

      // Sort by date
      const sortedData = marketData.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const returns = [];
      const basePrice = sortedData[0].closePrice;

      for (let i = 0; i < sortedData.length; i++) {
        const currentPrice = sortedData[i].closePrice;
        const returnPercent = this.calculateReturnPercentage(currentPrice, basePrice);

        returns.push({
          date: sortedData[i].date,
          return: Number(returnPercent.toFixed(4))
        });
      }

      this.logger.log(`Calculated ${symbol} returns for ${returns.length} dates`);
      return returns;
    } catch (error) {
      this.logger.error(`Error calculating ${symbol} returns: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get market returns for benchmark comparison from API (convenience method)
   * @param symbol - Market symbol
   * @param assetType - Type of asset (FUND, GOLD, STOCK, etc.)
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Array<{date: string, return: number}>>
   */
  async getMarketDataReturnsHistoryForBenchmarkFromAPI(
    symbol: string = 'VN30INDEX',
    assetType: string = 'STOCK',
    startDate: Date,
    endDate: Date
  ): Promise<Array<{date: string, return: number}>> {
    return this.getMarketDataReturnsFromAPI(symbol, assetType, startDate, endDate); // use default values if not provided
  }

  /**
   * Transform market API data to our format
   * @param item - Raw data from market API
   * @param multiplyBy - Multiplication factor
   * @returns MarketDataPoint
   */
  private transformMarketData(item: any, multiplyBy: number = 1): MarketDataPoint {
    // Parse change string (e.g., "1.35(0.08 %)")
    const changeMatch = item.ThayDoi ? item.ThayDoi.match(/(-?\d+\.?\d*)\s*\((-?\d+\.?\d*)\s*%\)/) : null;
    const change = changeMatch ? parseFloat(changeMatch[1]) : 0;
    const changePercent = changeMatch ? parseFloat(changeMatch[2]) : 0;

    // Use GiaDieuChinh if GiaDongCua is 0 (no trading day)
    let closePrice = item.GiaDieuChinh || item.GiaDongCua || 0;
    
    // Apply multiplication factor based on asset type
    closePrice = closePrice * multiplyBy;

    return {
      date: this.parseVietnameseDate(item.Ngay),
      closePrice: closePrice,
      change: change,
      changePercent: changePercent,
      volume: item.KhoiLuongKhopLenh || 0,
      value: item.GiaTriKhopLenh || 0,
      source: 'CAFEF_API',
      metadata: {
        originalData: item
      }
    };
  }

  /**
   * Parse Vietnamese date format (DD/MM/YYYY) to ISO format
   * @param dateStr - Date string in DD/MM/YYYY format
   * @returns ISO date string
   */
  private parseVietnameseDate(dateStr: string): string {
    if (!dateStr) {
      return new Date().toISOString().split('T')[0];
    }
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      return new Date().toISOString().split('T')[0];
    }
    const [day, month, year] = parts;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date for market API (MM/DD/YYYY)
   * @param date - Date object
   * @returns Formatted date string
   */
  private formatDateForMarketAPI(date: Date): string {
    if (!date) {
      return format(new Date(), 'MM/dd/yyyy');
    }
    return format(date, 'MM/dd/yyyy');
  }

  /**
   * Calculate price change and percentage
   * @param oldPrice - Previous price
   * @param newPrice - New price
   * @returns Object with change and changePercent
   */
  private calculatePriceChange(oldPrice: number, newPrice: number): { change: number; changePercent: number } {
    const change = newPrice - oldPrice;
    const changePercent = oldPrice > 0 ? (change / oldPrice) * 100 : 0;
    return { change, changePercent };
  }

  /**
   * Create MarketPrice object with calculated changes
   * @param symbol - Market symbol
   * @param price - Current price
   * @param previousPrice - Previous price for change calculation
   * @returns MarketPrice object
   */
  private createMarketPrice(symbol: string, price: number, previousPrice?: number): MarketPrice {
    const { change, changePercent } = previousPrice 
      ? this.calculatePriceChange(previousPrice, price)
      : { change: 0, changePercent: 0 };

    return {
      symbol,
      price,
      change,
      changePercent,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate return percentage from base price
   * @param currentPrice - Current price
   * @param basePrice - Base price for comparison
   * @returns Return percentage
   */
  private calculateReturnPercentage(currentPrice: number, basePrice: number): number {
    return basePrice > 0 ? ((currentPrice - basePrice) / basePrice) * 100 : 0;
  }

  // ==================== DATABASE HISTORICAL PRICE METHODS ====================

  /**
   * Get historical prices from database for a specific symbol
   * @param symbol - Market symbol
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<MarketDataPoint[]>
   */
  async getHistoricalMarketDataFromDB(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataPoint[]> {
    // TODO: Implement database query
    // This would query AssetPriceHistory table for the symbol and date range
    this.logger.log(`Getting historical data from DB for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Placeholder implementation
    return [];
  }

  /**
   * Get historical prices from database for multiple symbols
   * @param symbols - Array of market symbols
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Map<string, MarketDataPoint[]>>
   */
  async getBulkHistoricalMarketDataFromDB(
    symbols: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, MarketDataPoint[]>> {
    const results = new Map<string, MarketDataPoint[]>();
    
    this.logger.log(`Getting historical data from DB for ${symbols.length} symbols from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // TODO: Implement database query for multiple symbols
    // This would query AssetPriceHistory table for all symbols and date range
    
    return results;
  }

  /**
   * Get market returns from database for benchmark comparison
   * @param symbol - Market symbol
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Array<{date: string, return: number}>>
   */
  async getMarketDataReturnsFromDB(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{date: string, return: number}>> {
    // TODO: Implement database query for returns calculation
    this.logger.log(`Getting market returns from DB for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return [];
  }

  // ==================== BULK HISTORICAL PRICE METHODS ====================

  /**
   * Fetch historical prices for multiple symbols within a date range from API
   * @param symbols - Array of market symbols with asset types
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Map<string, MarketDataPoint[]>>
   */
  async getBulkHistoricalMarketDataFromAPI(
    symbols: Array<{symbol: string, assetType: string}>,
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, MarketDataPoint[]>> {
    try {
      console.log('=== getBulkHistoricalMarketDataFromAPI CALLED ===');
      console.log('Symbols:', symbols);
      console.log('StartDate:', startDate);
      console.log('EndDate:', endDate);
      
      const results = new Map<string, MarketDataPoint[]>();
      const errors: string[] = [];

      this.logger.log(`Fetching historical data for ${symbols.length} symbols from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Process symbols in parallel with concurrency limit
      const concurrencyLimit = 5;
      console.log('=== CALLING chunkArray ===');
      const chunks = this.chunkArray(symbols, concurrencyLimit);
      console.log('=== chunkArray RESULT ===');
      console.log('Chunks:', chunks);
      console.log('Chunks length:', chunks.length);

      for (const chunk of chunks) {
        const promises = chunk.map(async (symbolData) => {
          try {
            this.logger.log(`Starting fetch for ${symbolData.symbol} (${symbolData.assetType})`);
            const data = await this.getHistoricalMarketDataForDateRangeFromAPI(
              symbolData.symbol, 
              symbolData.assetType, 
              startDate, 
              endDate
            );
            this.logger.log(`Received data for ${symbolData.symbol}: ${data ? data.length : 'undefined'} items`);
            results.set(symbolData.symbol, data || []);
            this.logger.log(`Successfully fetched ${(data || []).length} data points for ${symbolData.symbol} (${symbolData.assetType})`);
          } catch (error) {
            const errorMsg = `Failed to fetch data for ${symbolData.symbol} (${symbolData.assetType}): ${error.message}`;
            errors.push(errorMsg);
            this.logger.error(errorMsg);
            results.set(symbolData.symbol, []); // Set empty array for failed symbols
          }
        });

        await Promise.all(promises);
      }

      this.logger.log(`Bulk fetch completed. Success: ${results.size - errors.length}, Errors: ${errors.length}`);
      return results;
    } catch (error) {
      this.logger.error(`Error in getBulkHistoricalMarketDataFromAPI: ${error.message}`, error.stack);
      return new Map<string, MarketDataPoint[]>();
    }
  }

  /**
   * Fetch historical prices from API and store in database
   * @param symbols - Array of market symbols with asset types
   * @param startDate - Start date
   * @param endDate - End date
   * @param assetId - Optional asset ID to associate with prices
   * @param forceUpdate - If true, skip duplicate check and always insert new data
   * @param cleanup - If true, delete all existing data before update
   * @returns Promise<BulkPriceResult>
   */
  async fetchHistoricalPricesFromAPIAndStoreInDB(
    symbols: Array<{symbol: string, assetType: string}>,
    startDate: Date,
    endDate: Date,
    assetId?: string,
    forceUpdate: boolean = false,
    cleanup: 'none' | 'external_api' | 'all' = 'external_api'
  ): Promise<BulkPriceResult> {
    console.log('=== SERVICE CALLED ===');
    console.log('Symbols:', symbols);
    console.log('StartDate:', startDate);
    console.log('EndDate:', endDate);
    console.log('AssetId:', assetId);
    console.log('ForceUpdate:', forceUpdate);
    console.log('Cleanup:', cleanup);
    
    const result: BulkPriceResult = {
      success: 0,
      failed: 0,
      errors: [],
      totalRecords: 0,
      processedSymbols: []
    };

    if (!symbols || symbols.length === 0) {
      this.logger.warn('No symbols provided for historical price fetch');
      return {
        success: 0,
        failed: 1,
        errors: ['No symbols provided'],
        totalRecords: 0,
        processedSymbols: []
      };
    }

    this.logger.log(`Starting bulk historical price fetch for ${symbols.length} symbols`);
    this.logger.log(`Cleanup: ${cleanup}, ForceUpdate: ${forceUpdate}`);

    try {
      // Cleanup: Delete existing data based on cleanup type for specific assets
      if (cleanup !== 'none') {
        this.logger.log(`Cleanup mode: ${cleanup}`);
        
        // Get asset IDs for the symbols being processed
        const assetIds = await this.getAssetIdsForSymbols(symbols);
        this.logger.log(`Found ${assetIds.length} asset IDs for cleanup: ${assetIds.join(', ')}`);
        
        await this.cleanupHistoricalPriceData(cleanup, assetIds);
      }

      // Fetch all historical data from API
      console.log('=== CALLING getBulkHistoricalMarketDataFromAPI ===');
      const historicalData = await this.getBulkHistoricalMarketDataFromAPI(symbols, startDate, endDate);
      console.log('=== getBulkHistoricalMarketDataFromAPI RESULT ===');
      console.log('HistoricalData:', historicalData);
      console.log('HistoricalData size:', historicalData.size);

      // Process each symbol's data
      for (const [symbol, dataPoints] of historicalData) {
        if (!dataPoints || dataPoints.length === 0) {
          result.failed++;
          result.errors.push(`No data found for symbol: ${symbol}`);
          continue;
        }

        try {
          // Find assetId for the symbol
          let targetAssetId = assetId;
          if (!targetAssetId) {
            // Try to find existing GlobalAsset by symbol
            const existingAsset = await this.findGlobalAssetBySymbol(symbol);
            if (existingAsset) {
              targetAssetId = existingAsset.id;
              this.logger.log(`Found existing asset for ${symbol} with ID: ${targetAssetId}`);
            } else {
              // Throw error if asset not found - don't create new one
              throw new Error(`GlobalAsset not found for symbol: ${symbol}. Please create the asset first.`);
            }
          }
          
          this.logger.log(`Storing data for ${symbol} with assetId: ${targetAssetId}`);
          await this.savePriceHistoryToDB(symbol, dataPoints, targetAssetId, forceUpdate);

          result.success++;
          result.totalRecords += dataPoints.length;
          result.processedSymbols.push({
            symbol,
            recordCount: dataPoints.length,
            dateRange: {
              start: dataPoints[0]?.date,
              end: dataPoints[dataPoints.length - 1]?.date
            }
          });

          this.logger.log(`Successfully processed ${dataPoints.length} records for ${symbol}`);
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to store data for ${symbol}: ${error.message}`);
          this.logger.error(`Error storing data for ${symbol}:`, error.message);
        }
      }

      this.logger.log(`Bulk historical price fetch completed. Success: ${result.success}, Failed: ${result.failed}, Total Records: ${result.totalRecords}`);
      return result;
    } catch (error) {
      this.logger.error('Bulk historical price fetch failed:', error.message);
      return {
        success: 0,
        failed: 1,
        errors: [`Bulk fetch failed: ${error.message}`],
        totalRecords: 0,
        processedSymbols: []
      };
    }
  }

  /**
   * Save price history data to database
   * @param symbol - Market symbol
   * @param dataPoints - Array of market data points
   * @param assetId - Asset ID to associate with prices
   * @param forceUpdate - If true, skip duplicate check and always insert new data
   */
  private async savePriceHistoryToDB(
    symbol: string,
    dataPoints: MarketDataPoint[],
    assetId: string,
    forceUpdate: boolean = false
  ): Promise<void> {
    if (!dataPoints || dataPoints.length === 0) {
      this.logger.warn(`No data points to save for ${symbol}`);
      return;
    }
    
    this.logger.log(`Saving ${dataPoints.length} price records for ${symbol} to asset ${assetId}`);
    
    try {
      // Convert MarketDataPoint to AssetPriceHistory format
      const validDataPoints = dataPoints.filter(dataPoint => dataPoint != null && dataPoint.closePrice > 0);
      const filteredCount = dataPoints.length - validDataPoints.length;
      
      if (filteredCount > 0) {
        this.logger.warn(`Filtered out ${filteredCount} invalid price records for ${symbol} (price <= 0)`);
      }
      
      const priceHistoryRecords = validDataPoints.map(dataPoint => {
          const record = new AssetPriceHistory();
          record.assetId = assetId;
          record.price = dataPoint.closePrice;
          record.priceType = PriceType.EXTERNAL;
          record.priceSource = PriceSource.EXTERNAL_API;
          record.changeReason = `Historical price data for ${symbol}`;
          record.metadata = {
            symbol: symbol,
            date: dataPoint.date,
            marketDate: dataPoint.date, // Store market date separately
            change: dataPoint.change,
            changePercent: dataPoint.changePercent,
            volume: dataPoint.volume,
            value: dataPoint.value,
            source: 'Market Data Service',
            fetchedAt: new Date().toISOString() // Record when this data was fetched
          };
          // Store the market date from API + current UTC time
          // This ensures created_at reflects the market date but with accurate UTC timestamp
          const now = new Date();
          const marketDateStr = dataPoint.date; // Could be ISO string or date string
          const timeStr = now.toISOString().split('T')[1]; // e.g., "05:43:48.450Z"
          
          // Handle both ISO string format and date-only format
          let createdAt: Date;
          this.logger.debug(`Processing marketDateStr: ${marketDateStr} for ${symbol}`);
          
          if (marketDateStr.includes('T')) {
            // Already a full ISO string, use it directly
            createdAt = new Date(marketDateStr);
            this.logger.debug(`Using full ISO string: ${marketDateStr}`);
          } else {
            // Date-only string, concatenate with current time
            createdAt = new Date(marketDateStr + 'T' + timeStr);
            this.logger.debug(`Concatenating date and time: ${marketDateStr} + T + ${timeStr}`);
          }
          
          // Validate the date before using it
          if (isNaN(createdAt.getTime())) {
            this.logger.warn(`Invalid date created from marketDateStr: ${marketDateStr} for ${symbol}`);
            // Fallback to current date
            createdAt = new Date();
          }
          
          record.createdAt = createdAt;
          return record;
        });

      let recordsToInsert: AssetPriceHistory[];
      let duplicatesSkipped = 0;

      if (forceUpdate) {
        // Force update: always insert new records (keep history)
        this.logger.log(`Force update enabled for ${symbol} - always inserting new records to keep history`);
        recordsToInsert = priceHistoryRecords;
      } else {
        // Normal mode: check for duplicates and skip if already exist
        const existingRecords = await this.checkExistingPriceHistory(assetId, dataPoints);
        
        // Filter out duplicates (skip if already exist for same date and price source)
        recordsToInsert = priceHistoryRecords.filter(record => {
          const recordDate = record.createdAt.toISOString().split('T')[0];
          return !existingRecords.some(existing => 
            existing.assetId === record.assetId && 
            existing.createdAt.toISOString().split('T')[0] === recordDate &&
            existing.priceSource === record.priceSource
          );
        });

        duplicatesSkipped = priceHistoryRecords.length - recordsToInsert.length;

        if (recordsToInsert.length === 0) {
          this.logger.log(`No new records to insert for ${symbol} - all records already exist for this price source`);
          return;
        }
      }

      // Batch insert records
      await this.batchInsertPriceHistory(recordsToInsert);
      
      if (forceUpdate) {
        this.logger.log(`Successfully force updated ${recordsToInsert.length} price records for ${symbol} (keeping history)`);
      } else {
        this.logger.log(`Successfully saved ${recordsToInsert.length} new price records for ${symbol} (${duplicatesSkipped} duplicates skipped)`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to save price history for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Check for existing price history records to avoid duplicates
   * @param assetId - Asset ID
   * @param dataPoints - Array of market data points
   * @returns Promise<AssetPriceHistory[]>
   */
  private async checkExistingPriceHistory(
    assetId: string,
    dataPoints: MarketDataPoint[]
  ): Promise<AssetPriceHistory[]> {
    if (!dataPoints || dataPoints.length === 0) return [];

    const startDate = new Date(Math.min(...dataPoints.map(dp => new Date(dp.date).getTime())));
    const endDate = new Date(Math.max(...dataPoints.map(dp => new Date(dp.date).getTime())));

    // Use same date range logic as delete method for consistency
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.assetPriceHistoryRepository.find({
      where: {
        assetId: assetId,
        createdAt: Between(startOfDay, endOfDay),
        priceSource: PriceSource.EXTERNAL_API
      },
      select: ['assetId', 'createdAt']
    });
  }

  /**
   * Delete existing price history records for force update
   * @param assetId - Asset ID
   * @param dataPoints - Array of market data points
   * @returns Promise<number> - Number of deleted records
   */
  private async deleteExistingPriceHistoryByDateRange(
    assetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Ensure we have valid dates
      if (!startDate || !endDate) {
        this.logger.warn(`Invalid dates provided for deletion: startDate=${startDate}, endDate=${endDate}`);
        return 0;
      }

      // Create proper date range for deletion
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      this.logger.debug(`Deleting existing records for asset ${assetId} from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      const result = await this.assetPriceHistoryRepository
        .createQueryBuilder()
        .delete()
        .where('asset_id = :assetId', { assetId })
        .andWhere('created_at >= :startDate', { startDate: startOfDay })
        .andWhere('created_at <= :endDate', { endDate: endOfDay })
        .andWhere('price_source = :priceSource', { priceSource: PriceSource.EXTERNAL_API })
        .execute();

      const deletedCount = result?.affected || 0;
      this.logger.debug(`Deleted ${deletedCount} existing records for asset ${assetId}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete existing price history for asset ${assetId}:`, error.message);
      throw error;
    }
  }

  /**
   * Batch insert price history records with transaction management
   * @param records - Array of AssetPriceHistory records
   */
  private async batchInsertPriceHistory(records: AssetPriceHistory[]): Promise<void> {
    if (!records || records.length === 0) return;

    try {
      // Use transaction for data integrity
      await this.assetPriceHistoryRepository.manager.transaction(async (transactionalEntityManager) => {
        // Batch insert in chunks to avoid memory issues
        const chunkSize = 1000;
        const chunks = this.chunkArray(records, chunkSize);

        for (const chunk of chunks) {
          await transactionalEntityManager.save(AssetPriceHistory, chunk);
          this.logger.debug(`Inserted chunk of ${chunk.length} records`);
        }
      });

      this.logger.log(`Successfully batch inserted ${records.length} price history records`);
    } catch (error) {
      this.logger.error(`Failed to batch insert price history records:`, error.message);
      throw error;
    }
  }

  /**
   * Get historical price data from database
   * @param assetId - Asset ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<AssetPriceHistory[]>
   */
  async getHistoricalPriceDataFromDB(
    assetId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AssetPriceHistory[]> {
    try {
      this.logger.log(`Getting historical price data from DB for asset ${assetId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const records = await this.assetPriceHistoryRepository.find({
        where: {
          assetId: assetId,
          createdAt: Between(startDate, endDate),
          priceSource: PriceSource.EXTERNAL_API
        },
        order: {
          createdAt: 'ASC'
        }
      });

      this.logger.log(`Found ${records.length} historical price records for asset ${assetId}`);
      return records;
    } catch (error) {
      this.logger.error(`Failed to get historical price data from DB for asset ${assetId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get historical price data for multiple assets from database
   * @param assetIds - Array of asset IDs
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Map<string, AssetPriceHistory[]>>
   */
  async getBulkHistoricalPriceDataFromDB(
    assetIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<Map<string, AssetPriceHistory[]>> {
    const results = new Map<string, AssetPriceHistory[]>();

    try {
      this.logger.log(`Getting bulk historical price data from DB for ${assetIds.length} assets from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const records = await this.assetPriceHistoryRepository.find({
        where: {
          assetId: In(assetIds),
          createdAt: Between(startDate, endDate),
          priceSource: PriceSource.EXTERNAL_API
        },
        order: {
          assetId: 'ASC',
          createdAt: 'ASC'
        }
      });

      // Group records by assetId
      for (const record of records) {
        if (!results.has(record.assetId)) {
          results.set(record.assetId, []);
        }
        results.get(record.assetId)!.push(record);
      }

      this.logger.log(`Found historical price data for ${results.size} assets`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to get bulk historical price data from DB:`, error.message);
      throw error;
    }
  }

  /**
   * Get all historical prices from database
   * @param startDate - Start date (optional)
   * @param endDate - End date (optional)
   * @returns Promise<AssetPriceHistory[]>
   */
  async getAllHistoricalPricesFromDB(
    startDate?: Date,
    endDate?: Date
  ): Promise<AssetPriceHistory[]> {
    try {
      this.logger.log(`Getting all historical price data from DB${startDate ? ` from ${startDate.toISOString()}` : ''}${endDate ? ` to ${endDate.toISOString()}` : ''}`);

      const whereConditions: any = {
        priceSource: PriceSource.EXTERNAL_API
      };

      if (startDate && endDate) {
        whereConditions.createdAt = Between(startDate, endDate);
      } else if (startDate) {
        whereConditions.createdAt = MoreThanOrEqual(startDate);
      } else if (endDate) {
        whereConditions.createdAt = LessThanOrEqual(endDate);
      }

      const records = await this.assetPriceHistoryRepository.find({
        where: whereConditions,
        order: {
          assetId: 'ASC',
          createdAt: 'ASC'
        }
      });

      this.logger.log(`Found ${records.length} historical price records`);
      return records;
    } catch (error) {
      this.logger.error(`Failed to get all historical price data from DB:`, error.message);
      throw error;
    }
  }

  /**
   * Cleanup historical price data for specific assets
   * @param cleanupType - Type of cleanup: 'none', 'external_api', 'all'
   * @param assetIds - Array of asset IDs to cleanup (optional, if not provided cleans all)
   * @returns Promise<number> - Number of deleted records
   */
  async cleanupHistoricalPriceData(
    cleanupType: 'none' | 'external_api' | 'all' = 'external_api',
    assetIds?: string[]
  ): Promise<number> {
    try {
      if (cleanupType === 'none') {
        this.logger.log('No cleanup requested - keeping all existing data');
        return 0;
      }

      this.logger.log(`Cleaning up historical price data: ${cleanupType}${assetIds ? ` for ${assetIds.length} assets` : ' for all assets'}`);
      
      let queryBuilder = this.assetPriceHistoryRepository
        .createQueryBuilder()
        .delete();

      // Add asset filter if specific assets provided
      if (assetIds && assetIds.length > 0) {
        queryBuilder = queryBuilder.where('asset_id IN (:...assetIds)', { assetIds });

        if (cleanupType === 'external_api') {
          // Only delete External API records
          queryBuilder = queryBuilder.andWhere('price_source = :priceSource', { priceSource: PriceSource.EXTERNAL_API });
          
        } else if (cleanupType === 'all') {
          // Delete all records regardless of source so no need to add asset filter
          this.logger.log(`Deleting ALL historical price data${assetIds ? ` for specified assets` : ''}`);
        }
      }else{
        this.logger.log('No cleanup requested because assetIds is not provided - keeping all existing data');
        return 0;
      }

      const result = await queryBuilder.execute();
      const deletedCount = result?.affected || 0;
      this.logger.log(`Deleted ${deletedCount} historical price records (${cleanupType}${assetIds ? ` for ${assetIds.length} assets` : ''})`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup historical price data:`, error.message);
      throw error;
    }
  }

  /**
   * Delete old price history records (cleanup method)
   * @param assetId - Asset ID
   * @param olderThan - Delete records older than this date
   * @returns Promise<number> - Number of deleted records
   */
  async cleanupOldPriceHistory(
    assetId: string,
    olderThan: Date
  ): Promise<number> {
    try {
      this.logger.log(`Cleaning up old price history for asset ${assetId} older than ${olderThan.toISOString()}`);

      const result = await this.assetPriceHistoryRepository
        .createQueryBuilder()
        .delete()
        .where('asset_id = :assetId', { assetId })
        .andWhere('created_at < :olderThan', { olderThan })
        .andWhere('price_source = :priceSource', { priceSource: PriceSource.EXTERNAL_API })
        .execute();

      const deletedCount = result.affected || 0;
      this.logger.log(`Deleted ${deletedCount} old price history records for asset ${assetId}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup old price history for asset ${assetId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get historical prices for date range from API (public API)
   * @param symbols - Array of market symbols with asset types
   * @param startDate - Start date
   * @param endDate - End date
   * @param forceUpdate - If true, skip duplicate check and always insert new data
   * @returns Promise<BulkPriceResult>
   */
  async getHistoricalPricesForDateRangeFromAPI(
    symbols: Array<{symbol: string, assetType: string}>,
    startDate: Date,
    endDate: Date,
    forceUpdate: boolean = false
  ): Promise<BulkPriceResult> {
    try {
      if (!symbols || symbols.length === 0) {
        return {
          success: 0,
          failed: 1,
          errors: ['No symbols provided'],
          totalRecords: 0,
          processedSymbols: []
        };
      }
      
      return this.fetchHistoricalPricesFromAPIAndStoreInDB(symbols, startDate, endDate, undefined, forceUpdate);
    } catch (error) {
      this.logger.error(`Error in getHistoricalPricesForDateRangeFromAPI: ${error.message}`, error.stack);
      return {
        success: 0,
        failed: 1,
        errors: [`API fetch failed: ${error.message}`],
        totalRecords: 0,
        processedSymbols: []
      };
    }
  }

  /**
   * Utility method to chunk array into smaller arrays
   * @param array - Array to chunk
   * @param size - Chunk size
   * @returns Array of chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    if (!array || array.length === 0) return [];
    
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Find GlobalAsset by symbol
   * @param symbol - Asset symbol
   * @returns Promise<GlobalAsset | null>
   */
  private async findGlobalAssetBySymbol(symbol: string): Promise<GlobalAsset | null> {
    try {
      this.logger.log(`Looking for GlobalAsset with symbol: ${symbol}`);
      
      const globalAsset = await this.globalAssetRepository.findOne({
        where: { symbol: symbol }
      });
      
      if (globalAsset) {
        this.logger.log(`Found GlobalAsset: ${globalAsset.symbol} (ID: ${globalAsset.id})`);
      } else {
        this.logger.warn(`GlobalAsset not found for symbol: ${symbol}`);
      }
      
      return globalAsset;
    } catch (error) {
      this.logger.error(`Error finding GlobalAsset for symbol ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get asset IDs for a list of symbols
   * @param symbols - Array of symbol objects
   * @returns Promise<string[]> - Array of asset IDs
   */
  private async getAssetIdsForSymbols(symbols: Array<{symbol: string, assetType: string}>): Promise<string[]> {
    try {
      this.logger.log(`Getting asset IDs for ${symbols.length} symbols`);
      const assetIds: string[] = [];
      
      for (const symbolData of symbols) {
        const asset = await this.findGlobalAssetBySymbol(symbolData.symbol);
        if (asset) {
          assetIds.push(asset.id);
        } else {
          this.logger.warn(`Skipping cleanup for symbol ${symbolData.symbol} - asset not found`);
        }
      }
      
      this.logger.log(`Found ${assetIds.length} asset IDs: ${assetIds.join(', ')}`);
      return assetIds;
    } catch (error) {
      this.logger.error(`Error getting asset IDs for symbols:`, error.message);
      return [];
    }
  }

}

// ==================== INTERFACES ====================

export interface BulkPriceResult {
  success: number;
  failed: number;
  errors: string[];
  totalRecords: number;
  processedSymbols: ProcessedSymbol[];
}

export interface ProcessedSymbol {
  symbol: string;
  recordCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}