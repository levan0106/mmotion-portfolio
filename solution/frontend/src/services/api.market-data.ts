/**
 * Market Data API Service
 * Handles fetching market data including funds, stocks, and other financial instruments
 */

import { apiService } from './api';

export interface FundData {
  symbol: string;
  name?: string;
  buyPrice: number;
  sellPrice: number;
  lastUpdated: Date | string;
  source: string;
  type: string;
  fundAssetType?: 'STOCK' | 'BOND' | 'BALANCED';
  nav?: number;
  changePercent?: number;
}

export interface StockData {
  symbol: string;
  name?: string;
  buyPrice: number;
  sellPrice: number;
  lastUpdated: Date | string;
  source: string;
  type: string;
  exchange?: 'HOSE' | 'HNX' | 'UPCOM' | 'ETF';
  changePercent?: number;
  volume?: number;
  marketCap?: number;
}

export interface MarketDataResponse<T> {
  success: boolean;
  data: T[];
  message: string;
}

class MarketDataService {
  /**
   * Get all fund prices
   */
  async getFunds(): Promise<FundData[]> {
    try {
      const response = await apiService.api.get<MarketDataResponse<FundData>>(
        '/api/v1/external-market-data/funds'
      );
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to fetch funds:', error);
      return [];
    }
  }

  /**
   * Get stock fund certificates (funds with STOCK asset type)
   */
  async getStockFunds(limit: number = 10): Promise<FundData[]> {
    const funds = await this.getFunds();
    // Filter funds that are stock-based
    return funds.filter((fund) => {
      // Priority 1: Use fundAssetType from API if available
      if (fund.fundAssetType === 'STOCK') return true;
      // Priority 2: Filter by naming patterns as fallback
      const name = fund.name?.toUpperCase() || '';
      return name.includes('CỔ PHIẾU') || name.includes('STOCK') || name.includes('EQUITY');
    }).sort((a, b) => {
      // Sort by changePercent descending (best performers first)
      const aChange = a.changePercent || 0;
      const bChange = b.changePercent || 0;
      return bChange - aChange;
    }).slice(0, limit);
  }

  /**
   * Get bond fund certificates (funds with BOND asset type)
   */
  async getBondFunds(limit: number = 10): Promise<FundData[]> {
    const funds = await this.getFunds();
    // Filter funds that are bond-based
    return funds.filter((fund) => {
      // Priority 1: Use fundAssetType from API if available
      if (fund.fundAssetType === 'BOND') return true;
      // Priority 2: Filter by naming patterns as fallback
      const name = fund.name?.toUpperCase() || '';
      return name.includes('TRÁI PHIẾU') || name.includes('BOND') || name.includes('DEBT');
    }).sort((a, b) => {
      // Sort by changePercent descending (best performers first)
      const aChange = a.changePercent || 0;
      const bChange = b.changePercent || 0;
      return bChange - aChange;
    }).slice(0, limit);
  }

  /**
   * Get all stock prices (without limit - fetches all from API)
   */
  async getStocks(limit?: number): Promise<StockData[]> {
    try {
      const response = await apiService.api.get<MarketDataResponse<StockData>>(
        '/api/v1/external-market-data/stocks'
      );
      const allStocks = response.data.success ? response.data.data : [];
      
      // If limit is provided, apply it, otherwise return all
      return limit ? allStocks.slice(0, limit) : allStocks;
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
      return [];
    }
  }

  /**
   * Get top N stocks by market capitalization
   * Fetches all stocks first, then sorts by marketCap and returns top N
   */
  async getTopStocks(limit: number = 5): Promise<StockData[]> {
    // Get ALL stocks without limit first
    const allStocks = await this.getStocks();
    
    // Ensure all stocks have marketCap calculated
    const stocksWithMarketCap = allStocks
      .filter((stock) => stock.buyPrice > 0 && stock.symbol)
    
    // Sort by market capitalization (descending), then take top N
    const sortedStocks = stocksWithMarketCap.sort((a, b) => {
      // Sort by changePercent descending (best performers first)
      const aChange = a.marketCap || 0;
      const bChange = b.marketCap || 0;
      return bChange - aChange;
    })
    
    return sortedStocks.slice(0, limit);
  }
}

export const marketDataService = new MarketDataService();

