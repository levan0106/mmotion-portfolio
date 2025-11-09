/**
 * Custom hook for portfolio management
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useEffect } from 'react';
import { CreatePortfolioDto, UpdatePortfolioDto } from '../types';
import apiService from '../services/api';
import { portfolioPermissionApi } from '../services/api.portfolio-permission';
import { useAccount } from '../contexts/AccountContext';

export const usePortfolios = (accountId?: string) => {
  const queryClient = useQueryClient();
  const { loading: accountLoading, accountId: contextAccountId } = useAccount(); // Get both loading state and accountId from context
  
  // Use context accountId if provided, otherwise use passed accountId
  const currentAccountId = contextAccountId || accountId;
  // Invalidate all queries when account changes (only if account actually changed)
  useEffect(() => {
    if (currentAccountId) {
      // Use a more targeted invalidation to prevent unnecessary API calls
      queryClient.invalidateQueries(['portfolios', currentAccountId]);
      queryClient.invalidateQueries(['trades', currentAccountId]);
      queryClient.invalidateQueries(['portfolio-analytics', currentAccountId]);
    }
  }, [currentAccountId, queryClient]);

  // Fetch all accessible portfolios (owned + shared)
  const {
    data: portfolios,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['portfolios', currentAccountId],
    () => currentAccountId ? apiService.getPortfolios(currentAccountId) : Promise.resolve([]),
    {
      enabled: !!currentAccountId && !accountLoading, // Only run query if accountId is provided and account is not loading
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Create portfolio mutation
  const createPortfolioMutation = useMutation(
    (data: CreatePortfolioDto) => apiService.createPortfolio(data, currentAccountId!),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['portfolios', currentAccountId]);
        refetch(); // Force refetch
      },
    }
  );

  // Update portfolio mutation
  const updatePortfolioMutation = useMutation(
    ({ id, data }: { id: string; data: UpdatePortfolioDto }) =>
      apiService.updatePortfolio(id, currentAccountId!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['portfolios', currentAccountId]);
        refetch(); // Force refetch
      },
    }
  );

  // Delete portfolio mutation
  const deletePortfolioMutation = useMutation(
    (id: string) => apiService.deletePortfolio(id, currentAccountId!),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['portfolios', currentAccountId]);
        refetch(); // Force refetch
      },
    }
  );

  return {
    portfolios: portfolios || [],
    isLoading,
    error,
    refetch,
    createPortfolio: createPortfolioMutation.mutate,
    updatePortfolio: updatePortfolioMutation.mutate,
    deletePortfolio: deletePortfolioMutation.mutate,
    isCreating: createPortfolioMutation.isLoading,
    isUpdating: updatePortfolioMutation.isLoading,
    isDeleting: deletePortfolioMutation.isLoading,
  };
};

// Hook to get permission stats for a portfolio
export const usePortfolioPermissionStats = (portfolioId: string, isOwner: boolean = false) => {
  const { accountId } = useAccount();
  
  return useQuery(
    ['portfolio-permission-stats', portfolioId, accountId],
    () => accountId ? portfolioPermissionApi.getPortfolioPermissionStats(portfolioId, accountId) : Promise.resolve(null),
    {
      enabled: !!portfolioId && !!accountId && isOwner, // Only fetch if user is owner
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const usePortfolio = (portfolioId: string) => {
  const queryClient = useQueryClient();
  const { accountId, loading: accountLoading } = useAccount();

  // Invalidate portfolio queries when account changes
  useEffect(() => {
    if (accountId) {
      queryClient.invalidateQueries(['portfolio', portfolioId]);
    }
  }, [accountId, queryClient, portfolioId]);

  // Fetch single portfolio
  const {
    data: portfolio,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['portfolio', portfolioId, accountId],
    () => apiService.getPortfolio(portfolioId, accountId),
    {
      enabled: !!portfolioId && !!accountId && !accountLoading,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update portfolio mutation
  const updatePortfolioMutation = useMutation(
    (data: UpdatePortfolioDto) => apiService.updatePortfolio(portfolioId, accountId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['portfolio', portfolioId]);
        queryClient.invalidateQueries('portfolios');
      },
    }
  );

  return {
    portfolio,
    isLoading,
    error,
    refetch,
    updatePortfolio: updatePortfolioMutation.mutate,
    isUpdating: updatePortfolioMutation.isLoading,
  };
};

export const usePortfolioAnalytics = (portfolioId: string) => {
  const { accountId, loading: accountLoading } = useAccount();
  const queryClient = useQueryClient();
  
  // Invalidate analytics queries when account changes
  useEffect(() => {
    if (accountId) {
      queryClient.invalidateQueries(['portfolio-performance', portfolioId]);
      queryClient.invalidateQueries(['portfolio-allocation', portfolioId]);
      queryClient.invalidateQueries(['portfolio-positions', portfolioId]);
    }
  }, [accountId, queryClient, portfolioId]);
  
  // Fetch portfolio performance
  const {
    data: performanceData,
    isLoading: isPerformanceLoading,
    error: performanceError,
  } = useQuery(
    ['portfolio-performance', portfolioId, accountId],
    () => apiService.getPortfolioPerformance(portfolioId),
    {
      enabled: !!portfolioId && !!accountId && !accountLoading,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch portfolio allocation
  const {
    data: allocationData,
    isLoading: isAllocationLoading,
    error: allocationError,
  } = useQuery(
    ['portfolio-allocation', portfolioId, accountId],
    () => apiService.getPortfolioAllocation(portfolioId),
    {
      enabled: !!portfolioId && !!accountId && !accountLoading,
      staleTime: 30 * 1000, // 30 seconds - reduced for testing
      refetchInterval: false, // Disabled auto refresh
    }
  );

  // Fetch portfolio positions
  const {
    data: positionsData,
    isLoading: isPositionsLoading,
    error: positionsError,
  } = useQuery(
    ['portfolio-positions', portfolioId, accountId],
    () => apiService.getPortfolioPositions(portfolioId),
    {
      enabled: !!portfolioId && !!accountId && !accountLoading,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Debug logging
  React.useEffect(() => {
  }, [portfolioId, performanceData, allocationData, positionsData, isPerformanceLoading, isAllocationLoading, isPositionsLoading, performanceError, allocationError, positionsError]);

  return {
    performanceData,
    allocationData,
    positionsData,
    isLoading: isPerformanceLoading || isAllocationLoading || isPositionsLoading,
    error: performanceError || allocationError || positionsError,
    refetch: () => {
      queryClient.invalidateQueries(['portfolio-performance', portfolioId]);
      queryClient.invalidateQueries(['portfolio-allocation', portfolioId]);
      queryClient.invalidateQueries(['portfolio-positions', portfolioId]);
    },
  };
};

export const usePortfolioHistory = (portfolioId: string, period?: string) => {
  const { accountId } = useAccount();
  const { months, granularity } = convertPeriodToNavHistoryParams(period || '1M');

  const {
    data: navHistoryResponse,
    isLoading,
    error,
  } = useQuery(
    ['portfolio-history', portfolioId, period, accountId],
    () => apiService.getPortfolioNAVHistory(portfolioId, accountId || '', { months, granularity }),
    {
      enabled: !!portfolioId && !!accountId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    historyData: navHistoryResponse?.data || [],
    isLoading,
    error,
  };
};

/**
 * Convert period string to months and granularity for NAV history API
 */
const convertPeriodToNavHistoryParams = (period: string): { months: number; granularity: string } => {
  switch (period) {
    case '1D':
      return { months: 1, granularity: 'DAILY' };
    case '1W':
      return { months: 1, granularity: 'DAILY' };
    case '1M':
      return { months: 1, granularity: 'DAILY' };
    case '3M':
      return { months: 3, granularity: 'DAILY' };
    case '6M':
      return { months: 6, granularity: 'DAILY' };
    case '1Y':
      return { months: 12, granularity: 'DAILY' };
    default:
      return { months: 1, granularity: 'DAILY' };
  }
};

export const usePortfolioAssetPerformance = (portfolioId: string) => {
  const {
    data: performanceData,
    isLoading,
    error,
  } = useQuery(
    ['portfolio-asset-performance', portfolioId],
    () => apiService.getPortfolioAssetPerformance(portfolioId),
    {
      enabled: !!portfolioId,
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  return {
    performanceData: performanceData || null,
    isLoading,
    error,
  };
};