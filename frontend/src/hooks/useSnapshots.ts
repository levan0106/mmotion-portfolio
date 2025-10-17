// Snapshot Hook for CR-006 Asset Snapshot System

import { useState, useEffect, useCallback } from 'react';
import { snapshotService } from '../services/snapshot.service';
import { useAccount } from '../contexts/AccountContext';
import {
  SnapshotResponse,
  CreateSnapshotRequest,
  UpdateSnapshotRequest,
  SnapshotQueryParams,
  SnapshotStatistics,
  SnapshotAggregation,
  SnapshotTimelineQuery,
} from '../types/snapshot.types';

export interface UseSnapshotsState {
  snapshots: SnapshotResponse[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

export interface UseSnapshotsActions {
  fetchSnapshots: (params?: SnapshotQueryParams) => Promise<void>;
  fetchSnapshotsPaginated: (params?: SnapshotQueryParams) => Promise<void>;
  createSnapshot: (data: CreateSnapshotRequest) => Promise<SnapshotResponse>;
  updateSnapshot: (id: string, data: UpdateSnapshotRequest) => Promise<SnapshotResponse>;
  deleteSnapshot: (id: string) => Promise<void>;
  recalculateSnapshot: (id: string) => Promise<SnapshotResponse>;
  bulkRecalculateSnapshots: (portfolioId: string, accountId: string, snapshotDate?: string) => Promise<void>;
  createBulkPortfolioSnapshots: (portfolioIds: string[], options?: { startDate?: string; endDate?: string; granularity?: string; createdBy?: string }) => Promise<any>;
  refreshSnapshots: () => Promise<void>;
  clearError: () => void;
}

export const useSnapshots = (initialParams?: SnapshotQueryParams) => {
  const { accountId } = useAccount();
  const [state, setState] = useState<UseSnapshotsState>({
    snapshots: [],
    loading: false,
    error: null,
    pagination: null,
  });

  const [params, setParams] = useState<SnapshotQueryParams | undefined>(initialParams);

  // Update params when initialParams change
  useEffect(() => {
    setParams(initialParams);
  }, [initialParams]);

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const fetchSnapshots = useCallback(async (queryParams?: SnapshotQueryParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentParams = queryParams || params;
      const snapshots = await snapshotService.getSnapshots(currentParams, accountId);
      setState(prev => ({
        ...prev,
        snapshots,
        pagination: null,
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch snapshots');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSnapshotsPaginated = useCallback(async (queryParams?: SnapshotQueryParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const currentParams = queryParams || params;
      const response = await snapshotService.getSnapshotsPaginated(currentParams, accountId);
      setState(prev => ({
        ...prev,
        snapshots: response.data,
        pagination: {
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        },
      }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch snapshots');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSnapshot = useCallback(async (data: CreateSnapshotRequest): Promise<SnapshotResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const snapshot = await snapshotService.createSnapshot(data);
      setState(prev => ({
        ...prev,
        snapshots: [snapshot, ...prev.snapshots],
      }));
      return snapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSnapshot = useCallback(async (id: string, data: UpdateSnapshotRequest): Promise<SnapshotResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const snapshot = await snapshotService.updateSnapshot(id, data);
      setState(prev => ({
        ...prev,
        snapshots: prev.snapshots.map(s => s.id === id ? snapshot : s),
      }));
      return snapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSnapshot = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await snapshotService.deleteSnapshot(id);
      setState(prev => ({
        ...prev,
        snapshots: prev.snapshots.filter(s => s.id !== id),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const recalculateSnapshot = useCallback(async (id: string): Promise<SnapshotResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const snapshot = await snapshotService.recalculateSnapshot(id);
      setState(prev => ({
        ...prev,
        snapshots: prev.snapshots.map(s => s.id === id ? snapshot : s),
      }));
      return snapshot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to recalculate snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkRecalculateSnapshots = useCallback(async (portfolioId: string, accountId: string, snapshotDate?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await snapshotService.bulkRecalculateSnapshots(portfolioId, accountId, snapshotDate);
      // Refresh snapshots after bulk recalculate
      await fetchSnapshots(params);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk recalculate snapshots';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBulkPortfolioSnapshots = useCallback(async (portfolioIds: string[], options?: { startDate?: string; endDate?: string; granularity?: string; createdBy?: string }): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await snapshotService.createBulkPortfolioSnapshots(portfolioIds, options);
      // Refresh snapshots after bulk create
      await fetchSnapshots(params);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bulk portfolio snapshots';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchSnapshots, params]);

  const refreshSnapshots = useCallback(async () => {
    await fetchSnapshots(params);
  }, [params, fetchSnapshots]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load snapshots on mount
  useEffect(() => {
    if (params) {
      fetchSnapshots(params);
    }
  }, [params]);

  const actions: UseSnapshotsActions = {
    fetchSnapshots,
    fetchSnapshotsPaginated,
    createSnapshot,
    updateSnapshot,
    deleteSnapshot,
    recalculateSnapshot,
    bulkRecalculateSnapshots,
    createBulkPortfolioSnapshots,
    refreshSnapshots,
    clearError,
  };

  return {
    ...state,
    ...actions,
    params,
    setParams,
  };
};

// Hook for snapshot statistics
export const useSnapshotStatistics = (portfolioId: string) => {
  const [statistics, setStatistics] = useState<SnapshotStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const stats = await snapshotService.getSnapshotStatistics(portfolioId);
      setStatistics(stats);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolioId) {
      fetchStatistics();
    }
  }, [portfolioId]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
};

// Hook for timeline data
export const useSnapshotTimeline = (query: SnapshotTimelineQuery) => {
  const [timelineData, setTimelineData] = useState<SnapshotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimelineData = useCallback(async () => {
    if (!query.portfolioId || !query.startDate || !query.endDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await snapshotService.getTimelineData(query);
      setTimelineData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch timeline data');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query.portfolioId && query.startDate && query.endDate) {
      fetchTimelineData();
    }
  }, [query.portfolioId, query.startDate, query.endDate, query.granularity]);

  return {
    timelineData,
    loading,
    error,
    refetch: fetchTimelineData,
  };
};

// Hook for aggregated timeline data
export const useSnapshotAggregatedTimeline = (
  portfolioId: string,
  startDate: string,
  endDate: string,
  granularity?: string
) => {
  const [aggregatedData, setAggregatedData] = useState<SnapshotAggregation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAggregatedData = useCallback(async () => {
    if (!portfolioId || !startDate || !endDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await snapshotService.getAggregatedTimelineData(
        portfolioId,
        startDate,
        endDate,
        granularity
      );
      setAggregatedData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch aggregated data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, startDate, endDate, granularity]);

  useEffect(() => {
    if (portfolioId && startDate && endDate) {
      fetchAggregatedData();
    }
  }, [portfolioId, startDate, endDate, granularity]);

  return {
    aggregatedData,
    loading,
    error,
    refetch: fetchAggregatedData,
  };
};
