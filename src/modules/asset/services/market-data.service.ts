import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Market Data Service
 * Handles real-time market data integration and pricing updates
 */
@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);
  private readonly marketPrices = new Map<string, number>();
  private readonly priceUpdateInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Initialize with some sample prices
    this.initializeSamplePrices();
  }

  /**
   * Initialize sample market prices
   * In production, this would connect to real market data providers
   */
  private initializeSamplePrices() {
    // Sample prices for Vietnamese stocks
    this.marketPrices.set('VFF', 20000); // VinaCapital Fund
    this.marketPrices.set('VNM', 85000); // Vinamilk
    this.marketPrices.set('VCB', 95000); // Vietcombank
    this.marketPrices.set('GAS', 120000); // PetroVietnam Gas
    this.marketPrices.set('MSN', 75000); // Masan Group
    
    // Sample prices for bonds
    this.marketPrices.set('BOND001', 100000); // Government bond
    this.marketPrices.set('BOND002', 105000); // Corporate bond
    
    // Sample prices for commodities
    this.marketPrices.set('GOLD', 75000000); // Gold (VND per tael)
    this.marketPrices.set('SILVER', 950000); // Silver (VND per tael)
    
    this.logger.log('Initialized sample market prices');
  }

  /**
   * Get current market price for an asset
   * @param symbol - Asset symbol
   * @returns Current market price or 0 if not found
   */
  getCurrentPrice(symbol: string): number {
    return this.marketPrices.get(symbol.toUpperCase()) || 0;
  }

  /**
   * Update market price for an asset
   * @param symbol - Asset symbol
   * @param price - New price
   */
  updatePrice(symbol: string, price: number): void {
    this.marketPrices.set(symbol.toUpperCase(), price);
    this.logger.log(`Updated price for ${symbol}: ${price}`);
  }

  /**
   * Get all current market prices
   * @returns Map of symbol to price
   */
  getAllPrices(): Map<string, number> {
    return new Map(this.marketPrices);
  }

  /**
   * Simulate market price updates
   * In production, this would be replaced with real market data feeds
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateMarketPrices() {
    this.logger.log('Updating market prices...');
    
    // Simulate price changes (±5% random variation)
    for (const [symbol, currentPrice] of this.marketPrices.entries()) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5%
      const newPrice = Math.round(currentPrice * (1 + variation));
      this.marketPrices.set(symbol, newPrice);
    }
    
    this.logger.log('Market prices updated');
  }

  /**
   * Get price history for an asset (simplified)
   * In production, this would query a time-series database
   * @param symbol - Asset symbol
   * @param days - Number of days
   * @returns Array of price points
   */
  getPriceHistory(symbol: string, days: number = 30): Array<{ date: Date; price: number }> {
    const currentPrice = this.getCurrentPrice(symbol);
    const history = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate historical prices with some variation
      const variation = (Math.random() - 0.5) * 0.2; // ±10%
      const price = Math.round(currentPrice * (1 + variation));
      
      history.push({ date, price });
    }
    
    return history;
  }

  /**
   * Calculate price change percentage
   * @param symbol - Asset symbol
   * @param days - Number of days to compare
   * @returns Price change percentage
   */
  getPriceChange(symbol: string, days: number = 1): number {
    const currentPrice = this.getCurrentPrice(symbol);
    const history = this.getPriceHistory(symbol, days + 1);
    
    if (history.length < 2) return 0;
    
    const previousPrice = history[history.length - 2].price;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }
}
