/**
 * Historical Prices Service
 * Service for managing historical price data updates
 */

import { apiService } from './api';

export interface HistoricalPriceUpdateRequest {
  symbols: Array<{symbol: string, assetType: string}>;
  startDate: string;
  endDate: string;
  assetId?: string;
  forceUpdate?: boolean;
  cleanup?: 'none' | 'external_api' | 'all';
}

export interface HistoricalPriceUpdateResult {
  success: number;
  failed: number;
  errors: string[];
  totalRecords: number;
  processedSymbols: Array<{
    symbol: string;
    recordCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  }>;
}

export interface HistoricalPriceQueryParams {
  symbols?: string;
  startDate?: string;
  endDate?: string;
}

export class HistoricalPricesService {
  /**
   * Update historical prices for one or multiple symbols
   */
  static async updateHistoricalPrices(
    request: HistoricalPriceUpdateRequest
  ): Promise<HistoricalPriceUpdateResult> {
    try {
      return await apiService.updateHistoricalPrices(request);
    } catch (error) {
      console.error('Failed to update historical prices:', error);
      throw error;
    }
  }

  /**
   * Get historical prices for one or multiple symbols
   */
  static async getHistoricalPrices(
    params: HistoricalPriceQueryParams
  ): Promise<any[]> {
    try {
      return await apiService.getHistoricalPrices(params);
    } catch (error) {
      console.error('Failed to get historical prices:', error);
      throw error;
    }
  }

  /**
   * Get available asset types for historical price updates
   */
  static getAssetTypes(): Array<{value: string, label: string}> {
    return [
      { value: 'STOCK', label: 'Stock' },
      { value: 'ETF', label: 'ETF' },
      { value: 'FUND', label: 'Fund' },
      { value: 'GOLD', label: 'Gold' },
      { value: 'EXCHANGE_RATE', label: 'Exchange Rate' },
      { value: 'CRYPTO', label: 'Cryptocurrency' },
      { value: 'BOND', label: 'Bond' }
    ];
  }

  /**
   * Get common symbols for each asset type
   */
  static getCommonSymbols(): Record<string, string[]> {
    return {
      'STOCK': ['VFF', 'HPG', 'VCB', 'VIC', 'VHM', 'VRE', 'VNM', 'MSN', 'FPT', 'CTG'],
      'ETF': ['VESAF', 'VESAF', 'VESAF', 'VESAF'],
      'FUND': ['VESAF', 'VESAF', 'VESAF', 'VESAF'],
      'GOLD': ['DOJI', 'SJC', 'PNJ'],
      'EXCHANGE_RATE': ['USD', 'EUR', 'JPY', 'GBP'],
      'CRYPTO': ['BTC', 'ETH', 'BNB', 'ADA', 'SOL'],
      'BOND': ['GOVB', 'CORPB', 'MUNIB']
    };
  }
}

export default HistoricalPricesService;
