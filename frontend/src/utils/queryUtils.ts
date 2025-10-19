import { QueryClient } from 'react-query';

/**
 * Utility functions for React Query operations
 */

/**
 * Invalidate all queries related to a specific portfolio
 * @param queryClient - React Query client
 * @param portfolioId - Portfolio ID to invalidate queries for
 */
export const invalidatePortfolioQueries = async (queryClient: QueryClient, portfolioId: string) => {
  console.log('🔍 Searching for queries with portfolioId:', portfolioId);
  
  // Get all queries first to debug
  const allQueries = queryClient.getQueryCache().getAll();
  const portfolioQueries = allQueries.filter((query: any) => 
    query.queryKey.includes(portfolioId)
  );
  
  console.log('📋 Found portfolio queries:', portfolioQueries.map((q: any) => ({
    queryKey: q.queryKey,
    status: q.state.status,
    dataUpdatedAt: q.state.dataUpdatedAt
  })));
  
  // Invalidate the queries
  const result = await queryClient.invalidateQueries({
    predicate: (query: any) => {
      const shouldInvalidate = query.queryKey.includes(portfolioId);
      if (shouldInvalidate) {
        console.log('🔄 Invalidating query:', query.queryKey);
      }
      return shouldInvalidate;
    }
  });
  
  console.log('✅ Invalidation result:', result);
  return result;
};

/**
 * Invalidate all queries related to a specific account
 * @param queryClient - React Query client
 * @param accountId - Account ID to invalidate queries for
 */
export const invalidateAccountQueries = async (queryClient: QueryClient, accountId: string) => {
  await queryClient.invalidateQueries({
    predicate: (query: any) => {
      // Invalidate all queries that contain this accountId
      return query.queryKey.includes(accountId);
    }
  });
};

/**
 * Invalidate all queries with a specific pattern
 * @param queryClient - React Query client
 * @param pattern - Query key pattern to match
 */
export const invalidateQueriesByPattern = async (queryClient: QueryClient, pattern: string) => {
  await queryClient.invalidateQueries({
    predicate: (query: any) => {
      // Invalidate all queries that contain the pattern
      return query.queryKey.some((key: any) => 
        typeof key === 'string' && key.includes(pattern)
      );
    }
  });
};

/**
 * Invalidate all queries (nuclear option)
 * @param queryClient - React Query client
 */
export const invalidateAllQueries = async (queryClient: QueryClient) => {
  await queryClient.invalidateQueries();
};

/**
 * Refresh all queries related to a portfolio (alternative to invalidate)
 * @param queryClient - React Query client
 * @param portfolioId - Portfolio ID to refresh queries for
 */
export const refetchPortfolioQueries = async (queryClient: QueryClient, portfolioId: string) => {
  const queries = queryClient.getQueryCache().findAll({
    predicate: (query: any) => {
      return query.queryKey.includes(portfolioId);
    }
  });
  
  await Promise.all(queries.map(query => queryClient.refetchQueries(query.queryKey)));
};

/**
 * Force refresh all portfolio-related data (nuclear option)
 * @param queryClient - React Query client
 * @param portfolioId - Portfolio ID to refresh queries for
 */
export const forceRefreshPortfolioData = async (queryClient: QueryClient, portfolioId: string) => {
  console.log('🚀 Force refreshing all portfolio data for:', portfolioId);
  
  // Step 1: Remove all portfolio-related queries from cache
  const queriesToRemove = queryClient.getQueryCache().findAll({
    predicate: (query: any) => {
      return query.queryKey.includes(portfolioId);
    }
  });
  
  console.log('🗑️ Removing queries from cache:', queriesToRemove.map((q: any) => q.queryKey));
  queriesToRemove.forEach(query => {
    queryClient.removeQueries(query.queryKey);
  });
  
  // Step 2: Invalidate all queries (this will trigger refetch)
  await queryClient.invalidateQueries();
  
  console.log('✅ Force refresh completed');
};
