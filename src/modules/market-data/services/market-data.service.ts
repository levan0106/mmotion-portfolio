import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { format } from 'date-fns';
import { ExternalMarketDataService } from './external-market-data.service';
import { MarketDataResult } from '../types/market-data.types';

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
  private config: MarketDataConfig = {
    symbols: ['VFF', 'VESAF', 'DOJI', '9999', 'HPG', 'VCB', 'VIC', 'VHM', 'SSISCA'],
  };

  private readonly baseUrl = 'https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx';

  constructor(
    private readonly externalMarketDataService: ExternalMarketDataService,
    private readonly httpService: HttpService
  ) {
    this.logger.log('Market Data Service initialized with external API integration');
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



  // ==================== CAFEF API METHODS ====================

  /**
   * Fetch market data from CAFEF API for any symbol
   * @param symbol - Market symbol (e.g., VNIndex, HNXIndex, etc.)
   * @param startDate - Start date in MM/DD/YYYY format
   * @param endDate - End date in MM/DD/YYYY format
   * @param pageIndex - Page index (default: 1)
   * @param pageSize - Page size (default: 20)
   * @returns Promise<MarketDataPoint[]>
   */
  async getMarketDataHistory(
    symbol: string,
    startDate: string,
    endDate: string,
    pageIndex: number = 1,
    pageSize: number = 20
  ): Promise<MarketDataPoint[]> {
    try {
      this.logger.log(`Fetching ${symbol} data from ${startDate} to ${endDate}`);

      const url = `${this.baseUrl}?Symbol=${symbol}&StartDate=${startDate}&EndDate=${endDate}&PageIndex=${pageIndex}&PageSize=${pageSize}`;

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
        throw new Error(`${symbol} API error: ${response.data.Message || 'Unknown error'}`);
      }

      const marketData = response.data.Data.Data.map(item => this.transformMarketData(item));

      this.logger.log(`Successfully fetched ${marketData.length} ${symbol} data points`);
      return marketData;
    } catch (error) {
      this.logger.error(`Error fetching ${symbol} data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get market data for a specific date range
   * @param symbol - Market symbol
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<MarketDataPoint[]>
   */
  async getMarketDataForDateRange(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<MarketDataPoint[]> {
    const startDateStr = this.formatDateForMarketAPI(startDate);
    const endDateStr = this.formatDateForMarketAPI(endDate);

    return this.getMarketDataHistory(symbol, startDateStr, endDateStr, 1, 100);
  }

  /**
   * Get market data for the last N months
   * @param symbol - Market symbol
   * @param months - Number of months to look back
   * @returns Promise<MarketDataPoint[]>
   */
  async getMarketDataForLastMonths(symbol: string, months: number): Promise<MarketDataPoint[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - months);

    return this.getMarketDataForDateRange(symbol, startDate, endDate);
  }

  /**
   * Calculate market returns for benchmark comparison
   * @param symbol - Market symbol
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Array<{date: string, return: number}>>
   */
  async getMarketDataReturns(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{date: string, return: number}>> {
    try {
      const marketData = await this.getMarketDataForDateRange(symbol, startDate, endDate);

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
   * Get VNIndex returns for benchmark comparison (convenience method)
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Array<{date: string, return: number}>>
   */
  async getDataReturnsHistoryForBenchmark(
    symbol: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{date: string, return: number}>> {
    return this.getMarketDataReturns(symbol, startDate, endDate);
  }

  /**
   * Transform market API data to our format
   * @param item - Raw data from market API
   * @returns MarketDataPoint
   */
  private transformMarketData(item: any): MarketDataPoint {
    // Parse change string (e.g., "1.35(0.08 %)")
    const changeMatch = item.ThayDoi.match(/(-?\d+\.?\d*)\s*\((-?\d+\.?\d*)\s*%\)/);
    const change = changeMatch ? parseFloat(changeMatch[1]) : 0;
    const changePercent = changeMatch ? parseFloat(changeMatch[2]) : 0;

    return {
      date: this.parseVietnameseDate(item.Ngay),
      closePrice: item.GiaDongCua,
      change: change,
      changePercent: changePercent,
      volume: item.KhoiLuongKhopLenh || 0,
      value: item.GiaTriKhopLenh || 0
    };
  }

  /**
   * Parse Vietnamese date format (DD/MM/YYYY) to ISO format
   * @param dateStr - Date string in DD/MM/YYYY format
   * @returns ISO date string
   */
  private parseVietnameseDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date for market API (MM/DD/YYYY)
   * @param date - Date object
   * @returns Formatted date string
   */
  private formatDateForMarketAPI(date: Date): string {
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
}