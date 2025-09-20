// SnapshotContext for CR-006 Asset Snapshot System
// Provides shared snapshot data to avoid duplicate API calls

import React, { createContext, useContext, useMemo } from 'react';
import { useSnapshots, useSnapshotStatistics, useSnapshotAggregatedTimeline, useSnapshotTimeline } from '../hooks/useSnapshots';
import { SnapshotResponse, SnapshotStatistics, SnapshotAggregation, SnapshotGranularity } from '../types/snapshot.types';

interface SnapshotContextValue {
  // Basic snapshot data
  snapshots: SnapshotResponse[];
  loading: boolean;
  error: string | null;
  
  // Statistics
  statistics: SnapshotStatistics | null;
  statsLoading: boolean;
  statsError: string | null;
  
  // Timeline data
  timelineData: SnapshotResponse[];
  timelineLoading: boolean;
  timelineError: string | null;
  
  // Aggregated data
  aggregatedData: SnapshotAggregation[];
  aggregatedLoading: boolean;
  aggregatedError: string | null;
  
  // Actions
  refreshAll: () => void;
}

const SnapshotContext = createContext<SnapshotContextValue | undefined>(undefined);

interface SnapshotProviderProps {
  portfolioId: string;
  startDate: string;
  endDate: string;
  granularity: SnapshotGranularity;
  children: React.ReactNode;
}

export const SnapshotProvider: React.FC<SnapshotProviderProps> = ({
  portfolioId,
  startDate,
  endDate,
  granularity,
  children,
}) => {
  // Memoize parameters to prevent unnecessary re-renders
  const snapshotParams = useMemo(() => ({ portfolioId }), [portfolioId]);
  const timelineQuery = useMemo(() => ({
    portfolioId,
    startDate,
    endDate,
    granularity,
  }), [portfolioId, startDate, endDate, granularity]);
  
  // Get all data using hooks
  const {
    snapshots,
    loading,
    error,
    refreshSnapshots,
  } = useSnapshots(snapshotParams);
  
  const {
    statistics,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useSnapshotStatistics(portfolioId);
  
  const {
    timelineData,
    loading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline,
  } = useSnapshotTimeline(timelineQuery);
  
  const {
    aggregatedData,
    loading: aggregatedLoading,
    error: aggregatedError,
    refetch: refetchAggregated,
  } = useSnapshotAggregatedTimeline(portfolioId, startDate, endDate, granularity);
  
  // Refresh all data
  const refreshAll = () => {
    refreshSnapshots();
    refetchStats();
    refetchTimeline();
    refetchAggregated();
  };
  
  const value: SnapshotContextValue = {
    snapshots,
    loading,
    error,
    statistics,
    statsLoading,
    statsError,
    timelineData,
    timelineLoading,
    timelineError,
    aggregatedData,
    aggregatedLoading,
    aggregatedError,
    refreshAll,
  };
  
  return (
    <SnapshotContext.Provider value={value}>
      {children}
    </SnapshotContext.Provider>
  );
};

export const useSnapshotContext = () => {
  const context = useContext(SnapshotContext);
  if (context === undefined) {
    throw new Error('useSnapshotContext must be used within a SnapshotProvider');
  }
  return context;
};
