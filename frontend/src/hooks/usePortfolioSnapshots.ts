// usePortfolioSnapshots Hook for CR-006 Portfolio Snapshot System

import { useState, useEffect, useCallback } from 'react';
import { PortfolioSnapshot } from '../types/snapshot.types';
import apiClient from '../services/api';

interface UsePortfolioSnapshotsOptions {
  portfolioId?: string;
  startDate?: string;
  endDate?: string;
  granularity?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  autoFetch?: boolean;
}

interface UsePortfolioSnapshotsReturn {
  portfolioSnapshots: PortfolioSnapshot[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  fetchPortfolioSnapshots: (options?: UsePortfolioSnapshotsOptions) => Promise<void>;
  refreshPortfolioSnapshots: () => Promise<void>;
  createPortfolioSnapshot: (data: any) => Promise<PortfolioSnapshot>;
  updatePortfolioSnapshot: (id: string, data: any) => Promise<PortfolioSnapshot>;
  deletePortfolioSnapshot: (id: string) => Promise<void>;
}

export const usePortfolioSnapshots = (options: UsePortfolioSnapshotsOptions = {}): UsePortfolioSnapshotsReturn => {
  const [portfolioSnapshots, setPortfolioSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const fetchPortfolioSnapshots = useCallback(async (fetchOptions?: UsePortfolioSnapshotsOptions) => {
    const queryOptions = { ...options, ...fetchOptions };
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (queryOptions.portfolioId) params.append('portfolioId', queryOptions.portfolioId);
      if (queryOptions.startDate) params.append('startDate', queryOptions.startDate);
      if (queryOptions.endDate) params.append('endDate', queryOptions.endDate);
      if (queryOptions.granularity) params.append('granularity', queryOptions.granularity);
      if (queryOptions.isActive !== undefined) params.append('isActive', queryOptions.isActive.toString());
      if (queryOptions.page) params.append('page', queryOptions.page.toString());
      if (queryOptions.limit) params.append('limit', queryOptions.limit.toString());
      if (queryOptions.orderBy) params.append('orderBy', queryOptions.orderBy);
      if (queryOptions.orderDirection) params.append('orderDirection', queryOptions.orderDirection);

      const response = await apiClient.api.get(`/api/v1/portfolio-snapshots?${params.toString()}`);
      
      if (response.data.success) {
        setPortfolioSnapshots(response.data.data);
        setPagination(null); // Not paginated response
      } else {
        throw new Error(response.data.message || 'Failed to fetch portfolio snapshots');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch portfolio snapshots';
      setError(errorMessage);
      console.error('Error fetching portfolio snapshots:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const fetchPortfolioSnapshotsPaginated = useCallback(async (fetchOptions?: UsePortfolioSnapshotsOptions) => {
    const queryOptions = { ...options, ...fetchOptions };
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (queryOptions.portfolioId) params.append('portfolioId', queryOptions.portfolioId);
      if (queryOptions.startDate) params.append('startDate', queryOptions.startDate);
      if (queryOptions.endDate) params.append('endDate', queryOptions.endDate);
      if (queryOptions.granularity) params.append('granularity', queryOptions.granularity);
      if (queryOptions.isActive !== undefined) params.append('isActive', queryOptions.isActive.toString());
      if (queryOptions.page) params.append('page', queryOptions.page.toString());
      if (queryOptions.limit) params.append('limit', queryOptions.limit.toString());
      if (queryOptions.orderBy) params.append('orderBy', queryOptions.orderBy);
      if (queryOptions.orderDirection) params.append('orderDirection', queryOptions.orderDirection);

      const response = await apiClient.api.get(`/api/v1/portfolio-snapshots/paginated?${params.toString()}`);
      
      if (response.data.success) {
        setPortfolioSnapshots(response.data.data);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.data.message || 'Failed to fetch portfolio snapshots');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch portfolio snapshots';
      setError(errorMessage);
      console.error('Error fetching portfolio snapshots:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const refreshPortfolioSnapshots = useCallback(async () => {
    await fetchPortfolioSnapshots();
  }, [fetchPortfolioSnapshots]);

  const createPortfolioSnapshot = useCallback(async (data: any): Promise<PortfolioSnapshot> => {
    try {
      const response = await apiClient.api.post('/api/v1/portfolio-snapshots', data);
      
      if (response.data.success) {
        // Refresh the list after creating
        await refreshPortfolioSnapshots();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create portfolio snapshot');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create portfolio snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refreshPortfolioSnapshots]);

  const updatePortfolioSnapshot = useCallback(async (id: string, data: any): Promise<PortfolioSnapshot> => {
    try {
      const response = await apiClient.api.put(`/api/v1/portfolio-snapshots/${id}`, data);
      
      if (response.data.success) {
        // Refresh the list after updating
        await refreshPortfolioSnapshots();
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update portfolio snapshot');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update portfolio snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refreshPortfolioSnapshots]);

  const deletePortfolioSnapshot = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await apiClient.api.delete(`/api/v1/portfolio-snapshots/${id}`);
      
      if (response.data.success) {
        // Refresh the list after deleting
        await refreshPortfolioSnapshots();
      } else {
        throw new Error(response.data.message || 'Failed to delete portfolio snapshot');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete portfolio snapshot';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refreshPortfolioSnapshots]);

  // Auto-fetch on mount and when options change
  useEffect(() => {
    if (options.autoFetch !== false) {
      if (options.page && options.limit) {
        fetchPortfolioSnapshotsPaginated();
      } else {
        fetchPortfolioSnapshots();
      }
    }
  }, [options.portfolioId, options.startDate, options.endDate, options.granularity, options.isActive, options.page, options.limit, options.orderBy, options.orderDirection, options.autoFetch]);

  return {
    portfolioSnapshots,
    loading,
    error,
    pagination,
    fetchPortfolioSnapshots,
    refreshPortfolioSnapshots,
    createPortfolioSnapshot,
    updatePortfolioSnapshot,
    deletePortfolioSnapshot,
  };
};

// Hook for portfolio snapshot timeline
export const usePortfolioSnapshotTimeline = (
  portfolioId: string,
  startDate: string,
  endDate: string,
  granularity?: string
) => {
  const [timelineData, setTimelineData] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!portfolioId || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (granularity) params.append('granularity', granularity);

      const response = await apiClient.api.get(`/api/v1/portfolio-snapshots/timeline/${portfolioId}?${params.toString()}`);
      
      if (response.data.success) {
        setTimelineData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch portfolio snapshot timeline');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch portfolio snapshot timeline';
      setError(errorMessage);
      console.error('Error fetching portfolio snapshot timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [portfolioId, startDate, endDate, granularity]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return {
    timelineData,
    loading,
    error,
    refetch: fetchTimeline,
  };
};

// Hook for aggregated portfolio snapshot timeline
export const usePortfolioSnapshotAggregatedTimeline = (
  portfolioId: string,
  startDate: string,
  endDate: string,
  granularity?: string
) => {
  const [aggregatedData, setAggregatedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAggregatedTimeline = useCallback(async () => {
    if (!portfolioId || !startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (granularity) params.append('granularity', granularity);

      const response = await apiClient.api.get(`/api/v1/portfolio-snapshots/timeline/${portfolioId}/aggregated?${params.toString()}`);
      
      if (response.data.success) {
        setAggregatedData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch aggregated portfolio snapshot timeline');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch aggregated portfolio snapshot timeline';
      setError(errorMessage);
      console.error('Error fetching aggregated portfolio snapshot timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [portfolioId, startDate, endDate, granularity]);

  useEffect(() => {
    fetchAggregatedTimeline();
  }, [fetchAggregatedTimeline]);

  return {
    aggregatedData,
    loading,
    error,
    refetch: fetchAggregatedTimeline,
  };
};

// Hook for latest portfolio snapshot
export const useLatestPortfolioSnapshot = (portfolioId: string, granularity?: string) => {
  const [latestSnapshot, setLatestSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    if (!portfolioId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (granularity) params.append('granularity', granularity);

      const response = await apiClient.api.get(`/api/v1/portfolio-snapshots/latest/${portfolioId}?${params.toString()}`);
      
      if (response.data.success) {
        setLatestSnapshot(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch latest portfolio snapshot');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch latest portfolio snapshot';
      setError(errorMessage);
      console.error('Error fetching latest portfolio snapshot:', err);
    } finally {
      setLoading(false);
    }
  }, [portfolioId, granularity]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  return {
    latestSnapshot,
    loading,
    error,
    refetch: fetchLatest,
  };
};
