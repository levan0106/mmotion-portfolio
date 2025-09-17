import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';

// Types
interface AssetPrice {
  id: string;
  assetId: string;
  currentPrice: number;
  priceType: string;
  priceSource: string;
  lastPriceUpdate: string;
}

interface PriceHistory {
  id: string;
  assetId: string;
  price: number;
  priceType: string;
  priceSource: string;
  changeReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface CreateAssetPriceDto {
  assetId: string;
  currentPrice: number;
  priceType: string;
  priceSource: string;
  changeReason?: string;
  metadata?: Record<string, any>;
}

interface UpdateAssetPriceDto {
  currentPrice?: number;
  priceType?: string;
  priceSource?: string;
  changeReason?: string;
  metadata?: Record<string, any>;
}

interface CreatePriceHistoryDto {
  assetId: string;
  price: number;
  priceType: string;
  priceSource: string;
  changeReason?: string;
  metadata?: Record<string, any>;
}

interface PriceHistoryQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
  priceType?: string;
  priceSource?: string;
}

interface PriceHistoryResponse {
  data: PriceHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PriceHistoryStats {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recordCount: number;
  firstRecordDate: string;
  lastRecordDate: string;
}

// API functions
const fetchAssetPrice = async (assetId: string): Promise<AssetPrice | null> => {
  const response = await fetch(`/api/v1/asset-prices/${assetId}`);
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch asset price: ${response.statusText}`);
  }
  
  return response.json();
};

const createAssetPrice = async (data: CreateAssetPriceDto): Promise<AssetPrice> => {
  const response = await fetch('/api/v1/asset-prices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create asset price: ${response.statusText}`);
  }
  
  return response.json();
};

const updateAssetPrice = async (assetId: string, data: UpdateAssetPriceDto): Promise<AssetPrice> => {
  const response = await fetch(`/api/v1/asset-prices/${assetId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update asset price: ${response.statusText}`);
  }
  
  return response.json();
};

const deleteAssetPrice = async (assetId: string): Promise<void> => {
  const response = await fetch(`/api/v1/asset-prices/${assetId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete asset price: ${response.statusText}`);
  }
};

const fetchPriceHistory = async (assetId: string, query: PriceHistoryQueryDto = {}): Promise<PriceHistoryResponse> => {
  const params = new URLSearchParams();
  
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.priceType) params.append('priceType', query.priceType);
  if (query.priceSource) params.append('priceSource', query.priceSource);

  const response = await apiService.api.get(`/api/v1/price-history/asset/${assetId}?${params.toString()}`);
  
  return response.data;
};

const createPriceHistory = async (data: CreatePriceHistoryDto): Promise<PriceHistory> => {
  const response = await apiService.api.post('/api/v1/price-history', data);
  return response.data;
};

const fetchPriceHistoryStats = async (assetId: string, startDate?: string, endDate?: string): Promise<PriceHistoryStats> => {
  const params = new URLSearchParams();
  
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await apiService.api.get(`/api/v1/price-history/asset/${assetId}/stats?${params.toString()}`);
  
  return response.data;
};

const fetchLatestPriceHistory = async (assetId: string, limit: number = 1): Promise<PriceHistory[]> => {
  const response = await apiService.api.get(`/api/v1/price-history/asset/${assetId}/latest?limit=${limit}`);
  
  return response.data;
};

const deleteOldPriceHistory = async (assetId: string | undefined, olderThanDays: number): Promise<number> => {
  const params = new URLSearchParams();
  
  if (assetId) params.append('assetId', assetId);
  params.append('olderThanDays', olderThanDays.toString());

  const response = await fetch(`/api/v1/price-history/cleanup?${params.toString()}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete old price history: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.deletedCount;
};

// Custom hooks
export const useAssetPrice = (assetId: string) => {
  return useQuery(['assetPrice', assetId], () => fetchAssetPrice(assetId), {
    enabled: !!assetId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateAssetPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation(createAssetPrice, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['assetPrice', data.assetId]);
      queryClient.invalidateQueries(['globalAssets']);
    },
  });
};

export const useUpdateAssetPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ assetId, data }: { assetId: string; data: UpdateAssetPriceDto }) => 
      updateAssetPrice(assetId, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['assetPrice', data.assetId]);
        queryClient.invalidateQueries(['globalAssets']);
      },
    }
  );
};

export const useDeleteAssetPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation(deleteAssetPrice, {
    onSuccess: (_, assetId) => {
      queryClient.invalidateQueries(['assetPrice', assetId]);
      queryClient.invalidateQueries(['globalAssets']);
    },
  });
};

export const usePriceHistory = (assetId: string, query: PriceHistoryQueryDto = {}) => {
  return useQuery(['priceHistory', assetId, query], () => fetchPriceHistory(assetId, query), {
    enabled: !!assetId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreatePriceHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation(createPriceHistory, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['priceHistory', data.assetId]);
      queryClient.invalidateQueries(['assetPrice', data.assetId]);
    },
  });
};

export const usePriceHistoryStats = (assetId: string, startDate?: string, endDate?: string) => {
  return useQuery(['priceHistoryStats', assetId, startDate, endDate], () => fetchPriceHistoryStats(assetId, startDate, endDate), {
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLatestPriceHistory = (assetId: string, limit: number = 1) => {
  return useQuery(['latestPriceHistory', assetId, limit], () => fetchLatestPriceHistory(assetId, limit), {
    enabled: !!assetId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useDeleteOldPriceHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ assetId, olderThanDays }: { assetId: string | undefined; olderThanDays: number }) =>
      deleteOldPriceHistory(assetId, olderThanDays),
    {
      onSuccess: (_, { assetId }) => {
        if (assetId) {
          queryClient.invalidateQueries(['priceHistory', assetId]);
        } else {
          queryClient.invalidateQueries(['priceHistory']);
        }
      },
    }
  );
};

// Utility hook for managing price state
export const useAssetPriceManagement = (_assetId: string) => {
  const [priceUpdateOpen, setPriceUpdateOpen] = useState(false);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);

  const handlePriceUpdate = useCallback(() => {
    setPriceUpdateOpen(true);
  }, []);

  const handlePriceHistory = useCallback(() => {
    setPriceHistoryOpen(true);
  }, []);

  const handlePriceUpdateClose = useCallback(() => {
    setPriceUpdateOpen(false);
  }, []);

  const handlePriceHistoryClose = useCallback(() => {
    setPriceHistoryOpen(false);
  }, []);

  return {
    priceUpdateOpen,
    priceHistoryOpen,
    handlePriceUpdate,
    handlePriceHistory,
    handlePriceUpdateClose,
    handlePriceHistoryClose,
  };
};

// Hook for price update with automatic history creation
export const usePriceUpdate = () => {
  const queryClient = useQueryClient();
  const createPriceHistoryMutation = useCreatePriceHistory();
  const updateAssetPriceMutation = useUpdateAssetPrice();

  const updatePrice = useCallback(async (
    assetId: string,
    price: number,
    priceType: string,
    priceSource: string,
    changeReason?: string
  ) => {
    try {
      // Update current price
      await updateAssetPriceMutation.mutateAsync({
        assetId,
        data: {
          currentPrice: price,
          priceType,
          priceSource,
          changeReason,
        },
      });

      // Create price history record
      await createPriceHistoryMutation.mutateAsync({
        assetId,
        price,
        priceType,
        priceSource,
        changeReason,
      });

      // Invalidate related queries
      queryClient.invalidateQueries(['assetPrice', assetId]);
      queryClient.invalidateQueries(['priceHistory', assetId]);
      queryClient.invalidateQueries(['globalAssets']);
    } catch (error) {
      console.error('Price update error:', error);
      throw error;
    }
  }, [updateAssetPriceMutation, createPriceHistoryMutation, queryClient]);

  return {
    updatePrice,
    isLoading: updateAssetPriceMutation.isLoading || createPriceHistoryMutation.isLoading,
    error: updateAssetPriceMutation.error || createPriceHistoryMutation.error,
  };
};
