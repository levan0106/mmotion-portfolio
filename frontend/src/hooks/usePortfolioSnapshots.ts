import { useState, useEffect, useCallback } from 'react';
import { snapshotService } from '../services/snapshot.service';
import { SnapshotResponse } from '../types/snapshot.types';

interface UsePortfolioSnapshotsOptions {
  portfolioId?: string;
  autoFetch?: boolean;
  page?: number;
  limit?: number;
}

interface UsePortfolioSnapshotsReturn {
  portfolioSnapshots: SnapshotResponse[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  refreshPortfolioSnapshots: () => Promise<void>;
  clearError: () => void;
}

export const usePortfolioSnapshots = (options: UsePortfolioSnapshotsOptions = {}): UsePortfolioSnapshotsReturn => {
  const { portfolioId, autoFetch = true, page = 1, limit = 25 } = options;
  
  const [state, setState] = useState<{
    portfolioSnapshots: SnapshotResponse[];
    loading: boolean;
    error: string | null;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    } | null;
  }>({
    portfolioSnapshots: [],
    loading: false,
    error: null,
    pagination: null,
  });

  const { portfolioSnapshots, loading, error, pagination } = state;

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const fetchPortfolioSnapshots = useCallback(async () => {
    if (!portfolioId) return;
    
    console.log('🔄 usePortfolioSnapshots: Fetching with page=', page, 'limit=', limit);
    setLoading(true);
    setError(null);
    
    try {
      const response = await snapshotService.getPortfolioSnapshotsPaginated(portfolioId, { page, limit });
      const totalPages = Math.ceil(response.count / limit);
      setState(prev => ({
        ...prev,
        portfolioSnapshots: response.data || [],
        pagination: {
          page: response.page || page,
          limit: response.limit || limit,
          total: response.count || 0,
          totalPages,
          hasNext: (response.page || page) < totalPages,
          hasPrev: (response.page || page) > 1,
        },
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch portfolio snapshots');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, page, limit]);

  const refreshPortfolioSnapshots = useCallback(async () => {
    await fetchPortfolioSnapshots();
  }, []); // Removed fetchPortfolioSnapshots dependency to avoid loop

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch when portfolioId, page, or limit changes
  useEffect(() => {
    console.log('🔄 usePortfolioSnapshots useEffect: autoFetch=', autoFetch, 'portfolioId=', portfolioId, 'page=', page, 'limit=', limit);
    if (autoFetch && portfolioId) {
      fetchPortfolioSnapshots();
    }
  }, [autoFetch, portfolioId, page, limit]); // Removed fetchPortfolioSnapshots to avoid loop

  return {
    portfolioSnapshots,
    loading,
    error,
    pagination,
    refreshPortfolioSnapshots,
    clearError,
  };
};