import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';

// Types
interface MarketDataStats {
  totalAssets: number;
  successfulUpdates: number;
  failedUpdates: number;
  successRate: number;
  averageUpdateTime: number;
  lastUpdate: string;
  nextUpdate: string;
}

interface PriceUpdateResult {
  assetId: string;
  symbol: string;
  success: boolean;
  newPrice?: number;
  error?: string;
  timestamp: string;
}

interface MarketDataProvider {
  name: string;
  baseUrl: string;
  isActive: boolean;
  rateLimit: number;
  lastCheck: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface MarketDataConfig {
  updateInterval: number;
  batchSize: number;
  retryAttempts: number;
  timeout: number;
  providers: {
    name: string;
    enabled: boolean;
    priority: number;
    rateLimit: number;
  }[];
}

interface UpdateAllPricesResponse {
  success: boolean;
  totalAssets: number;
  successfulUpdates: number;
  failedUpdates: number;
  results: PriceUpdateResult[];
  duration: number;
}

interface UpdateByNationResponse {
  success: boolean;
  nation: string;
  totalAssets: number;
  successfulUpdates: number;
  failedUpdates: number;
  results: PriceUpdateResult[];
  duration: number;
}

interface UpdateByMarketResponse {
  success: boolean;
  marketCode: string;
  totalAssets: number;
  successfulUpdates: number;
  failedUpdates: number;
  results: PriceUpdateResult[];
  duration: number;
}

interface TestProviderResponse {
  success: boolean;
  provider: string;
  responseTime: number;
  error?: string;
}

// API functions
const fetchMarketDataStats = async (): Promise<MarketDataStats> => {
  const response = await apiService.api.get('/api/v1/market-data/statistics');
  return response.data;
};

const fetchMarketDataProviders = async (): Promise<MarketDataProvider[]> => {
  const response = await apiService.api.get('/api/v1/market-data/providers');
  return response.data;
};

const fetchRecentUpdates = async (_limit: number = 50): Promise<PriceUpdateResult[]> => {
  // Note: This endpoint doesn't exist in backend yet
  // For now, return empty array or implement alternative
  console.warn('Recent updates endpoint not implemented in backend yet');
  return [];
};

const updateAllPrices = async (): Promise<UpdateAllPricesResponse> => {
  const response = await apiService.api.post('/api/v1/market-data/update-all');
  return response.data;
};

const updatePricesByNation = async (nation: string): Promise<UpdateByNationResponse> => {
  const response = await apiService.api.post(`/api/v1/market-data/update-by-nation/${nation}`);
  return response.data;
};

const updatePricesByMarket = async (marketCode: string): Promise<UpdateByMarketResponse> => {
  const response = await apiService.api.post(`/api/v1/market-data/update-by-market/${marketCode}`);
  return response.data;
};

const testProvider = async (providerName: string): Promise<TestProviderResponse> => {
  const response = await apiService.api.post(`/api/v1/market-data/test-connection/${providerName}`);
  return {
    success: response.data.connected,
    provider: response.data.providerName,
    responseTime: 0, // Not provided by backend
    error: response.data.connected ? undefined : response.data.message,
  };
};

const fetchMarketDataConfig = async (): Promise<MarketDataConfig> => {
  const response = await apiService.api.get('/api/v1/market-data/config');
  return response.data;
};

const updateMarketDataConfig = async (config: MarketDataConfig): Promise<MarketDataConfig> => {
  await apiService.api.post('/api/v1/market-data/config', config);
  return config; // Backend returns { message: string }, not the config
};

const startScheduledUpdates = async (): Promise<void> => {
  // Note: This endpoint doesn't exist in backend yet
  console.warn('Scheduled updates endpoints not implemented in backend yet');
  throw new Error('Scheduled updates not implemented in backend yet');
};

const stopScheduledUpdates = async (): Promise<void> => {
  // Note: This endpoint doesn't exist in backend yet
  console.warn('Scheduled updates endpoints not implemented in backend yet');
  throw new Error('Scheduled updates not implemented in backend yet');
};

const getScheduledUpdatesStatus = async (): Promise<{ isRunning: boolean; nextUpdate: string }> => {
  // Note: This endpoint doesn't exist in backend yet
  console.warn('Scheduled updates status endpoint not implemented in backend yet');
  return { isRunning: false, nextUpdate: new Date().toISOString() };
};

// Custom hooks
export const useMarketDataStats = () => {
  return useQuery(['marketDataStats'], fetchMarketDataStats, {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useMarketDataProviders = () => {
  return useQuery(['marketDataProviders'], fetchMarketDataProviders, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecentUpdates = (limit: number = 50) => {
  return useQuery(['recentUpdates', limit], () => fetchRecentUpdates(limit), {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useUpdateAllPrices = () => {
  const queryClient = useQueryClient();
  
  return useMutation(updateAllPrices, {
    onSuccess: () => {
      queryClient.invalidateQueries(['marketDataStats']);
      queryClient.invalidateQueries(['recentUpdates']);
      queryClient.invalidateQueries(['globalAssets']);
      queryClient.invalidateQueries(['assetPrice']);
    },
  });
};

export const useUpdatePricesByNation = () => {
  const queryClient = useQueryClient();
  
  return useMutation(updatePricesByNation, {
    onSuccess: () => {
      queryClient.invalidateQueries(['marketDataStats']);
      queryClient.invalidateQueries(['recentUpdates']);
      queryClient.invalidateQueries(['globalAssets']);
      queryClient.invalidateQueries(['assetPrice']);
    },
  });
};

export const useUpdatePricesByMarket = () => {
  const queryClient = useQueryClient();
  
  return useMutation(updatePricesByMarket, {
    onSuccess: () => {
      queryClient.invalidateQueries(['marketDataStats']);
      queryClient.invalidateQueries(['recentUpdates']);
      queryClient.invalidateQueries(['globalAssets']);
      queryClient.invalidateQueries(['assetPrice']);
    },
  });
};

export const useTestProvider = () => {
  return useMutation(testProvider);
};

export const useMarketDataConfig = () => {
  return useQuery(['marketDataConfig'], fetchMarketDataConfig, {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateMarketDataConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation(updateMarketDataConfig, {
    onSuccess: () => {
      queryClient.invalidateQueries(['marketDataConfig']);
    },
  });
};

export const useScheduledUpdates = () => {
  const queryClient = useQueryClient();
  
  const startMutation = useMutation(startScheduledUpdates, {
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledUpdatesStatus']);
    },
  });

  const stopMutation = useMutation(stopScheduledUpdates, {
    onSuccess: () => {
      queryClient.invalidateQueries(['scheduledUpdatesStatus']);
    },
  });

  const statusQuery = useQuery(['scheduledUpdatesStatus'], getScheduledUpdatesStatus, {
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  return {
    start: startMutation.mutate,
    stop: stopMutation.mutate,
    isStarting: startMutation.isLoading,
    isStopping: stopMutation.isLoading,
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    error: startMutation.error || stopMutation.error || statusQuery.error,
  };
};

// Utility hook for managing market data state
export const useMarketDataManagement = () => {
  const [selectedNation, setSelectedNation] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [updateProgress, setUpdateProgress] = useState<{
    isUpdating: boolean;
    progress: number;
    currentAsset: string;
    totalAssets: number;
  }>({
    isUpdating: false,
    progress: 0,
    currentAsset: '',
    totalAssets: 0,
  });

  const handleNationChange = useCallback((nation: string) => {
    setSelectedNation(nation);
  }, []);

  const handleMarketChange = useCallback((market: string) => {
    setSelectedMarket(market);
  }, []);

  const handleUpdateProgress = useCallback((progress: {
    isUpdating: boolean;
    progress: number;
    currentAsset: string;
    totalAssets: number;
  }) => {
    setUpdateProgress(progress);
  }, []);

  const resetProgress = useCallback(() => {
    setUpdateProgress({
      isUpdating: false,
      progress: 0,
      currentAsset: '',
      totalAssets: 0,
    });
  }, []);

  return {
    selectedNation,
    selectedMarket,
    updateProgress,
    handleNationChange,
    handleMarketChange,
    handleUpdateProgress,
    resetProgress,
  };
};

// Hook for real-time market data updates
export const useRealTimeMarketData = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    // In a real implementation, this would establish a WebSocket connection
    // For now, we'll simulate with polling
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    lastUpdate,
    updateCount,
    connect,
    disconnect,
  };
};

// Hook for market data analytics
export const useMarketDataAnalytics = () => {
  const { data: stats } = useMarketDataStats();
  const { data: recentUpdates } = useRecentUpdates(100);

  const analytics = useMemo(() => {
    if (!stats || !recentUpdates) return null;

    const successRate = stats.successRate;
    const avgUpdateTime = stats.averageUpdateTime;
    const totalUpdates = stats.successfulUpdates + stats.failedUpdates;
    
    // Calculate hourly success rate
    const hourlyUpdates = recentUpdates.filter(update => {
      const updateTime = new Date(update.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return updateTime > oneHourAgo;
    });
    
    const hourlySuccessRate = hourlyUpdates.length > 0 
      ? (hourlyUpdates.filter(u => u.success).length / hourlyUpdates.length) * 100
      : 0;

    // Calculate error distribution
    const errorDistribution = recentUpdates
      .filter(update => !update.success)
      .reduce((acc, update) => {
        const error = update.error || 'Unknown error';
        acc[error] = (acc[error] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      successRate,
      avgUpdateTime,
      totalUpdates,
      hourlySuccessRate,
      errorDistribution,
      recentUpdateCount: recentUpdates.length,
    };
  }, [stats, recentUpdates]);

  return analytics;
};
