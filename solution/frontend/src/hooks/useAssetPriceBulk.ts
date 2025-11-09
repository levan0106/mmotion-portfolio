import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export interface AssetWithHistoricalPrice {
  assetId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  historicalPrice?: number;
  hasHistoricalData: boolean;
  currency: string;
  type: string;
}

export interface BulkUpdateResult {
  successCount: number;
  failedCount: number;
  totalCount: number;
  results: Array<{
    assetId: string;
    symbol: string;
    success: boolean;
    message: string;
    oldPrice?: number;
    newPrice?: number;
  }>;
}

export interface AvailableDate {
  date: string;
  assetCount: number;
  isWeekend: boolean;
  isHoliday: boolean;
}

export const useAssetPriceBulk = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get assets with their historical prices for a specific date
   */
  const getAssetsWithHistoricalPrice = useCallback(async (
    targetDate: string,
    assetIds?: string[]
  ): Promise<AssetWithHistoricalPrice[]> => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('targetDate', targetDate);
      
      if (assetIds && assetIds.length > 0) {
        params.append('assetIds', assetIds.join(','));
      }

      const response = await apiService.api.get(`/api/v1/asset-prices/bulk/historical-prices?${params.toString()}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get assets with historical prices';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Bulk update asset prices from historical data
   */
  const bulkUpdatePricesByDate = useCallback(async (
    targetDate: string,
    assetIds: string[],
    reason?: string
  ): Promise<BulkUpdateResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.api.post('/api/v1/asset-prices/bulk/update-by-date', {
        targetDate,
        assetIds,
        reason: reason || 'Bulk update from historical data',
      });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to bulk update prices';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get available historical dates
   */
  const getAvailableHistoricalDates = useCallback(async (
    limit: number = 30
  ): Promise<AvailableDate[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.api.get(`/api/v1/asset-prices/bulk/available-dates?limit=${limit}`);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get available dates';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAssetsWithHistoricalPrice,
    bulkUpdatePricesByDate,
    getAvailableHistoricalDates,
  };
};
