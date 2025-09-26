import { Injectable, Logger } from '@nestjs/common';
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
  volatility: number; // 0-1, affects price fluctuation
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
  private basePrices = new Map<string, number>();
  private config: MarketDataConfig = {
    symbols: ['VFF', 'VESAF', 'DOJI', '9999', 'HPG', 'VCB', 'VIC', 'VHM', 'SSISCA'],
    volatility: 0.02, // 2% volatility
  };

  constructor(
    private readonly externalMarketDataService: ExternalMarketDataService
  ) {
    this.initializeBasePrices();
    this.logger.log('Market Data Service initialized with external API integration');
  }

  /**
   * Initialize base prices for all symbols
   */
  private initializeBasePrices(): void {
    const basePriceMap = {
      'VFF': 34000,      // 34K VND
      'VESAF': 38000,     // 38K VND
      'DOJI': 130000000,   // 130M VND
      '9999': 124000000,  // 124M VND
      'HPG': 25000,       // 25K VND
      'VCB': 85000,       // 85K VND
      'VIC': 45000,       // 45K VND
      'VHM': 120000,      // 120K VND
      'SSISCA': 40000,    // 40K VND
    };

    for (const [symbol, price] of Object.entries(basePriceMap)) {
      this.basePrices.set(symbol, price);
      this.marketPrices.set(symbol, {
        symbol,
        price,
        change: 0,
        changePercent: 0,
        lastUpdated: new Date(),
      });
    }
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
        this.logger.warn('External API fetch failed, falling back to mock data');
        this.logger.warn('External API errors:', externalData.errors);
        this.updatePricesFromMockData();
      }
    } catch (error) {
      this.logger.error('Failed to fetch external data, using mock data:', error.message);
      this.updatePricesFromMockData();
    }
    
    this.logger.log(`Updated ${this.marketPrices.size} market prices`);

    this.logger.debug(`Updated market prices for ${this.marketPrices.size} symbols`);
  }

  /**
   * Update prices from external API data
   */
  private async updatePricesFromExternalData(externalData: MarketDataResult): Promise<void> {
    // Update fund prices
    for (const fund of externalData.funds) {
      this.marketPrices.set(fund.symbol, {
        symbol: fund.symbol,
        price: fund.buyPrice,
        change: 0, // TODO: Will be calculated based on previous price
        changePercent: 0, // TODO: Will be calculated based on previous price
        lastUpdated: new Date()
      });
    }

    // Update gold prices
    for (const gold of externalData.gold) {
      this.marketPrices.set(gold.type, {
        symbol: gold.type,
        price: gold.buyPrice,
        change: 0,
        changePercent: 0,
        lastUpdated: new Date()
      });
    }

    // Update exchange rates
    for (const rate of externalData.exchangeRates) {
      this.marketPrices.set(rate.currency, {
        symbol: rate.currency,
        price: rate.buyPrice,
        change: 0,
        changePercent: 0,
        lastUpdated: new Date()
      });
    }

    // Update stock prices
    for (const stock of externalData.stocks) {
      this.marketPrices.set(stock.symbol, {
        symbol: stock.symbol,
        price: stock.buyPrice,
        change: 0,
        changePercent: 0,
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Update prices from mock data (fallback)
   */
  private updatePricesFromMockData(): void {
    for (const [symbol, basePrice] of this.basePrices) {
      const currentData = this.marketPrices.get(symbol);
      if (!currentData) continue;

      // Generate random price change based on volatility
      const randomChange = (Math.random() - 0.5) * 2; // -1 to 1
      const volatilityFactor = this.config.volatility * randomChange;
      const newPrice = basePrice * (1 + volatilityFactor);

      // Calculate change from previous price
      const change = newPrice - currentData.price;
      const changePercent = currentData.price > 0 ? (change / currentData.price) * 100 : 0;

      // Update market data
      this.marketPrices.set(symbol, {
        symbol,
        price: Math.max(newPrice, basePrice * 0.5), // Prevent price from going below 50% of base
        change,
        changePercent,
        lastUpdated: new Date(),
      });
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
   * Simulate market data for a specific symbol
   * Useful for testing or manual price updates
   */
  async simulatePriceUpdate(symbol: string, newPrice: number): Promise<void> {
    const currentData = this.marketPrices.get(symbol);
    if (!currentData) {
      this.logger.warn(`Symbol ${symbol} not found for price update`);
      return;
    }

    const change = newPrice - currentData.price;
    const changePercent = currentData.price > 0 ? (change / currentData.price) * 100 : 0;

    this.marketPrices.set(symbol, {
      symbol,
      price: newPrice,
      change,
      changePercent,
      lastUpdated: new Date(),
    });

    this.logger.log(`Simulated price update for ${symbol}: ${newPrice} (${changePercent.toFixed(2)}%)`);
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

  /**
   * Reset all prices to base prices
   */
  resetToBasePrices(): void {
    this.initializeBasePrices();
    this.logger.log('Market prices reset to base prices');
  }

  /**
   * Get price history for a symbol (mock implementation)
   * In real implementation, this would fetch from database or external API
   */
  async getPriceHistory(symbol: string, period: '1D' | '1W' | '1M' | '3M' | '1Y'): Promise<Array<{ timestamp: Date; price: number }>> {
    const basePrice = this.basePrices.get(symbol) || 0;
    const currentPrice = this.marketPrices.get(symbol)?.price || basePrice;
    const points = this.getPeriodPoints(period);
    
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < points; i++) {
      const timestamp = new Date(now.getTime() - (points - i - 1) * this.getPeriodInterval(period));
      const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120% of base price
      const price = basePrice * randomFactor;
      
      history.push({ timestamp, price });
    }
    
    // Ensure last point is current price
    if (history.length > 0) {
      history[history.length - 1] = { timestamp: now, price: currentPrice };
    }
    
    return history;
  }

  private getPeriodPoints(period: string): number {
    const pointsMap = {
      '1D': 24,   // 24 hours
      '1W': 7,    // 7 days
      '1M': 30,   // 30 days
      '3M': 90,   // 90 days
      '1Y': 365,  // 365 days
    };
    return pointsMap[period] || 30;
  }

  private getPeriodInterval(period: string): number {
    const intervalMap = {
      '1D': 60 * 60 * 1000,      // 1 hour
      '1W': 24 * 60 * 60 * 1000, // 1 day
      '1M': 24 * 60 * 60 * 1000, // 1 day
      '3M': 24 * 60 * 60 * 1000, // 1 day
      '1Y': 24 * 60 * 60 * 1000, // 1 day
    };
    return intervalMap[period] || 24 * 60 * 60 * 1000;
  }
}