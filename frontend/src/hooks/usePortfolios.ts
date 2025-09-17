/**
 * Custom hook for portfolio management
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { CreatePortfolioDto, UpdatePortfolioDto } from '../types';
import apiService from '../services/api';

export const usePortfolios = (accountId?: string) => {
  const queryClient = useQueryClient();

  // Fetch all portfolios
  const {
    data: portfolios,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['portfolios', accountId],
    () => accountId ? apiService.getPortfolios(accountId) : Promise.resolve([]),
    {
      enabled: !!accountId, // Only run query if accountId is provided
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Create portfolio mutation
  const createPortfolioMutation = useMutation(
    (data: CreatePortfolioDto) => apiService.createPortfolio(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['portfolios', accountId]);
      },
    }
  );

  // Update portfolio mutation
  const updatePortfolioMutation = useMutation(
    ({ id, data }: { id: string; data: UpdatePortfolioDto }) =>
      apiService.updatePortfolio(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['portfolios', accountId]);
      },
    }
  );

  // Delete portfolio mutation
  const deletePortfolioMutation = useMutation(
    (id: string) => apiService.deletePortfolio(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['portfolios', accountId]);
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

export const usePortfolio = (portfolioId: string) => {
  const queryClient = useQueryClient();

  // Fetch single portfolio
  const {
    data: portfolio,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['portfolio', portfolioId],
    () => apiService.getPortfolio(portfolioId),
    {
      enabled: !!portfolioId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update portfolio mutation
  const updatePortfolioMutation = useMutation(
    (data: UpdatePortfolioDto) => apiService.updatePortfolio(portfolioId, data),
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
  // Fetch portfolio NAV
  const {
    data: navData,
    isLoading: isNavLoading,
    error: navError,
  } = useQuery(
    ['portfolio-nav', portfolioId],
    () => apiService.getPortfolioNav(portfolioId),
    {
      enabled: !!portfolioId,
      staleTime: 1 * 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );

  // Fetch portfolio performance
  const {
    data: performanceData,
    isLoading: isPerformanceLoading,
    error: performanceError,
  } = useQuery(
    ['portfolio-performance', portfolioId],
    () => apiService.getPortfolioPerformance(portfolioId),
    {
      enabled: !!portfolioId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch portfolio allocation
  const {
    data: allocationData,
    isLoading: isAllocationLoading,
    error: allocationError,
  } = useQuery(
    ['portfolio-allocation', portfolioId],
    () => apiService.getPortfolioAllocation(portfolioId),
    {
      enabled: !!portfolioId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch portfolio positions
  const {
    data: positionsData,
    isLoading: isPositionsLoading,
    error: positionsError,
  } = useQuery(
    ['portfolio-positions', portfolioId],
    () => apiService.getPortfolioPositions(portfolioId),
    {
      enabled: !!portfolioId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Debug logging
  React.useEffect(() => {
    console.log('usePortfolioAnalytics Debug:', {
      portfolioId,
      navData,
      performanceData,
      allocationData,
      positionsData,
      isNavLoading,
      isPerformanceLoading,
      isAllocationLoading,
      isPositionsLoading,
      navError,
      performanceError,
      allocationError,
      positionsError
    });
  }, [portfolioId, navData, performanceData, allocationData, positionsData, isNavLoading, isPerformanceLoading, isAllocationLoading, isPositionsLoading, navError, performanceError, allocationError, positionsError]);

  return {
    navData,
    performanceData,
    allocationData,
    positionsData,
    isLoading: isNavLoading || isPerformanceLoading || isAllocationLoading || isPositionsLoading,
    error: navError || performanceError || allocationError || positionsError,
  };
};

export const usePortfolioHistory = (portfolioId: string, period?: string) => {
  const {
    data: historyData,
    isLoading,
    error,
  } = useQuery(
    ['portfolio-history', portfolioId, period],
    () => apiService.getPortfolioAnalyticsHistory(portfolioId, period),
    {
      enabled: !!portfolioId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    historyData: historyData || [],
    isLoading,
    error,
  };
};
