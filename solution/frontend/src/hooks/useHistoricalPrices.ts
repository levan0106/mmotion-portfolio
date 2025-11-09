/**
 * Historical Prices Hook
 * Custom hook for managing historical price data updates
 */

import { useCallback } from 'react';
import { useMutation, useQuery } from 'react-query';
import HistoricalPricesService, { 
  HistoricalPriceUpdateRequest, 
  HistoricalPriceUpdateResult
} from '../services/historicalPrices.service';

export interface UseHistoricalPricesOptions {
  symbols?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export interface UseHistoricalPricesReturn {
  // Query data
  historicalPrices: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  // Update mutation
  updateHistoricalPrices: (request: HistoricalPriceUpdateRequest) => Promise<HistoricalPriceUpdateResult>;
  isUpdating: boolean;
  updateError: Error | null;
  updateResult: HistoricalPriceUpdateResult | null;
  setUpdateError: (error: Error | null) => void;

  // Utility functions
  getAssetTypes: () => Array<{value: string, label: string}>;
  getCommonSymbols: () => Record<string, string[]>;
}

export const useHistoricalPrices = (options: UseHistoricalPricesOptions = {}): UseHistoricalPricesReturn => {
  const { symbols, startDate, endDate, enabled = true } = options;

  // Query for getting historical prices
  const {
    data: historicalPrices = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['historicalPrices', symbols, startDate, endDate],
    queryFn: () => HistoricalPricesService.getHistoricalPrices({ symbols, startDate, endDate }),
    enabled: enabled && (!!symbols || !!startDate || !!endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for updating historical prices
  const {
    mutateAsync: updateHistoricalPrices,
    isLoading: isUpdating,
    error: updateError,
    data: updateResult,
    reset: resetMutation
  } = useMutation({
    mutationFn: (request: HistoricalPriceUpdateRequest) => 
      HistoricalPricesService.updateHistoricalPrices(request),
    onSuccess: () => {
      // Refetch historical prices after successful update
      refetch();
    }
  });

  // Function to manually set update error
  const setUpdateError = useCallback((error: Error | null) => {
    if (error) {
      // You can't directly set mutation error, but you can reset and handle it
      console.error('Update error:', error);
    } else {
      resetMutation();
    }
  }, [resetMutation]);

  // Utility functions
  const getAssetTypes = useCallback(() => {
    return HistoricalPricesService.getAssetTypes();
  }, []);

  const getCommonSymbols = useCallback(() => {
    return HistoricalPricesService.getCommonSymbols();
  }, []);

  return {
    historicalPrices,
    isLoading,
    error: error as Error | null,
    refetch,
    updateHistoricalPrices,
    isUpdating,
    updateError: updateError as Error | null,
    updateResult: updateResult || null,
    setUpdateError,
    getAssetTypes,
    getCommonSymbols
  };
};

export default useHistoricalPrices;
