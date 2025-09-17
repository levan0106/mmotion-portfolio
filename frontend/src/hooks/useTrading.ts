/**
 * Trading hooks for Portfolio Management System
 */

import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Trade, CreateTradeDto, UpdateTradeDto, TradeAnalysis, TradePerformance } from '../types';
import { apiService } from '../services/api';

export const useTrades = (portfolioId: string, filters?: {
  assetId?: string;
  side?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<Trade[]>(
    ['trades', portfolioId, filters],
    () => apiService.getTrades(portfolioId, filters),
    {
      enabled: !!portfolioId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

export const useCreateTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (data: CreateTradeDto) => apiService.createTrade(data),
    {
      onSuccess: (_newTrade) => {
        // Invalidate and refetch trades
        queryClient.invalidateQueries('trades');
        queryClient.invalidateQueries('portfolios');
        toast.success('Trade created successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create trade');
      },
    }
  );
};

export const useUpdateTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: string; data: UpdateTradeDto }) => 
      apiService.updateTrade(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trades');
        queryClient.invalidateQueries('portfolios');
        toast.success('Trade updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update trade');
      },
    }
  );
};

export const useDeleteTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: string) => apiService.deleteTrade(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('trades');
        queryClient.invalidateQueries('portfolios');
        toast.success('Trade deleted successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete trade');
      },
    }
  );
};

export const useTradeDetails = (tradeId: string) => {
  return useQuery(
    ['tradeDetails', tradeId],
    () => apiService.getTradeDetails(tradeId),
    {
      enabled: !!tradeId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};

export const useTradeAnalysis = (portfolioId: string, filters?: {
  assetId?: string;
  startDate?: string;
  endDate?: string;
  timeframe?: string;
  metric?: string;
}) => {
  // Create a stable query key
  const queryKey = [
    'tradeAnalysis', 
    portfolioId, 
    filters?.timeframe || 'ALL',
    filters?.metric || 'pnl'
  ];

  return useQuery<TradeAnalysis>(
    queryKey,
    () => apiService.getTradeAnalysis(portfolioId, filters),
    {
      enabled: !!portfolioId,
      staleTime: 0, // Force refetch every time
      cacheTime: 0, // Don't cache
    }
  );
};

export const useTradingPerformance = (portfolioId: string, filters?: {
  assetId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<TradePerformance>(
    ['tradingPerformance', portfolioId, filters],
    () => apiService.getTradingPerformance(portfolioId, filters),
    {
      enabled: !!portfolioId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useCurrentPositions = (portfolioId: string, marketPrices?: Record<string, number>) => {
  return useQuery(
    ['positions', portfolioId, marketPrices],
    () => apiService.getCurrentPositions(portfolioId, marketPrices),
    {
      enabled: !!portfolioId,
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
};

export const usePositionByAsset = (portfolioId: string, assetId: string, marketPrice?: number) => {
  return useQuery(
    ['position', portfolioId, assetId, marketPrice],
    () => apiService.getPositionByAsset(portfolioId, assetId, marketPrice),
    {
      enabled: !!portfolioId && !!assetId,
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
};

// Risk management hooks
export const useSetRiskTargets = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ assetId, data }: { assetId: string; data: any }) => 
      apiService.setRiskTargets(assetId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('riskTargets');
        toast.success('Risk targets set successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to set risk targets');
      },
    }
  );
};

export const useUpdateRiskTargets = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ assetId, data }: { assetId: string; data: any }) => 
      apiService.updateRiskTargets(assetId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('riskTargets');
        toast.success('Risk targets updated successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update risk targets');
      },
    }
  );
};

export const useRemoveRiskTargets = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (assetId: string) => apiService.removeRiskTargets(assetId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('riskTargets');
        toast.success('Risk targets removed successfully!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to remove risk targets');
      },
    }
  );
};

export const usePortfolioRiskTargets = (portfolioId: string) => {
  return useQuery(
    ['portfolioRiskTargets', portfolioId],
    () => apiService.getPortfolioRiskTargets(portfolioId),
    {
      enabled: !!portfolioId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useMonitorRiskTargets = (portfolioId?: string, marketPrices?: Record<string, number>) => {
  return useQuery(
    ['riskMonitoring', portfolioId, marketPrices],
    () => apiService.monitorRiskTargets(portfolioId, marketPrices),
    {
      enabled: !!portfolioId,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Refetch every minute
    }
  );
};
