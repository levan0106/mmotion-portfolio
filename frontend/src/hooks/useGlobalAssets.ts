import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';

// Types
interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  assetPrice?: {
    currentPrice: number;
    priceType: string;
    priceSource: string;
    lastPriceUpdate: string;
  };
}

interface CreateGlobalAssetDto {
  symbol: string;
  name: string;
  type: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  description?: string;
}

interface UpdateGlobalAssetDto {
  name?: string;
  type?: string;
  marketCode?: string;
  currency?: string;
  timezone?: string;
  description?: string;
  isActive?: boolean;
}

interface GlobalAssetQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  type?: string;
  nation?: string;
  marketCode?: string;
  isActive?: boolean;
}

interface AutoSyncStatus {
  enabled: boolean;
  lastSync?: string;
  nextSync?: string;
  interval?: number; // in minutes
}

// Backend returns paginated response
type GlobalAssetResponse = {
  data: GlobalAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// API functions
const fetchGlobalAssets = async (query: GlobalAssetQueryDto = {}): Promise<GlobalAssetResponse> => {
  const params = new URLSearchParams();
  
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  if (query.search) params.append('search', query.search);
  if (query.type) params.append('type', query.type);
  if (query.nation) params.append('nation', query.nation);
  if (query.marketCode) params.append('marketCode', query.marketCode);
  if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());

  console.log('fetchGlobalAssets - query:', query);
  console.log('fetchGlobalAssets - params:', params.toString());
  
  const response = await apiService.api.get(`/api/v1/global-assets?${params.toString()}`);
  
  console.log('fetchGlobalAssets - response:', response);
  console.log('fetchGlobalAssets - response.data:', response.data);
  
  return response.data;
};

// Fetch all global assets (no pagination)
const fetchAllGlobalAssets = async (): Promise<GlobalAsset[]> => {
  const params = new URLSearchParams();
  params.append('limit', '1000'); // Set to max allowed limit
  params.append('isActive', 'true'); // Only get active assets
  
  const response = await apiService.api.get(`/api/v1/global-assets?${params.toString()}`);
  
  // Fetch prices for each asset
  const assetsWithPrices = await Promise.all(
    response.data.data.map(async (asset: GlobalAsset) => {
      try {
        const priceResponse = await apiService.api.get(`/api/v1/asset-prices/asset/${asset.id}`);
        return {
          ...asset,
          assetPrice: priceResponse.data,
        };
      } catch (error) {
        // If no price found, return asset without price
        return asset;
      }
    })
  );
  
  return assetsWithPrices;
};

const fetchGlobalAssetById = async (id: string): Promise<GlobalAsset> => {
  const response = await apiService.api.get(`/api/v1/global-assets/${id}`);
  return response.data;
};

const createGlobalAsset = async (data: CreateGlobalAssetDto): Promise<GlobalAsset> => {
  const response = await apiService.api.post('/api/v1/global-assets', data);
  return response.data;
};

const updateGlobalAsset = async (id: string, data: UpdateGlobalAssetDto): Promise<GlobalAsset> => {
  const response = await apiService.api.patch(`/api/v1/global-assets/${id}`, data);
  return response.data;
};

const deleteGlobalAsset = async (id: string): Promise<void> => {
  await apiService.api.delete(`/api/v1/global-assets/${id}`);
};

const fetchSupportedNations = async (): Promise<string[]> => {
  const response = await apiService.api.get('/api/v1/global-assets/nations/list');
  return response.data.nations.map((nation: any) => nation.code);
};

const fetchNationConfig = async (nation: string): Promise<any> => {
  const response = await apiService.api.get(`/api/v1/global-assets/nations/${nation}/config`);
  return response.data;
};

const validateSymbolFormat = async (symbol: string, nation: string, type: string): Promise<boolean> => {
  const response = await apiService.api.get(`/api/v1/global-assets/nations/${nation}/validate-symbol?symbol=${symbol}&type=${type}`);
  return response.data.valid;
};

// Custom hooks
export const useGlobalAssets = (query: GlobalAssetQueryDto = {}) => {
  const result = useQuery(['globalAssets', query], async () => {
    const response = await fetchGlobalAssets(query);
    
    // Fetch prices for each asset
    const assetsWithPrices = await Promise.all(
      response.data.map(async (asset) => {
        try {
          const priceResponse = await apiService.api.get(`/api/v1/asset-prices/asset/${asset.id}`);
          return {
            ...asset,
            assetPrice: priceResponse.data,
          };
        } catch (error) {
          // If no price found, return asset without price
          return asset;
        }
      })
    );
    
    return {
      ...response,
      data: assetsWithPrices,
    };
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    ...result,
    data: result.data?.data || [],
    total: result.data?.total || 0,
    page: result.data?.page || 1,
    limit: result.data?.limit || 10,
    totalPages: result.data?.totalPages || 1,
  };
};

// Hook to fetch all global assets (no pagination)
export const useAllGlobalAssets = () => {
  return useQuery(['allGlobalAssets'], fetchAllGlobalAssets, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGlobalAsset = (id: string) => {
  return useQuery(['globalAsset', id], () => fetchGlobalAssetById(id), {
    enabled: !!id,
  });
};

export const useCreateGlobalAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation(createGlobalAsset, {
    onSuccess: () => {
      queryClient.invalidateQueries(['globalAssets']);
    },
  });
};

export const useUpdateGlobalAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: string; data: UpdateGlobalAssetDto }) => 
      updateGlobalAsset(id, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['globalAssets']);
        queryClient.invalidateQueries(['globalAsset', data.id]);
      },
    }
  );
};

export const useDeleteGlobalAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation(deleteGlobalAsset, {
    onSuccess: () => {
      queryClient.invalidateQueries(['globalAssets']);
    },
  });
};

// Price management hooks
export const useUpdateAssetPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ assetId, price, priceType, priceSource, changeReason }: {
      assetId: string;
      price: number;
      priceType: string;
      priceSource: string;
      changeReason?: string;
    }) => {
      try {
        console.log('useUpdateAssetPrice - trying to get existing price for assetId:', assetId);
        // Try to get existing asset price
        const existingPriceResponse = await apiService.api.get(`/api/v1/asset-prices/asset/${assetId}`);
        const existingPrice = existingPriceResponse.data;
        console.log('useUpdateAssetPrice - found existing price:', existingPrice);
        
        // Update existing asset price by asset ID (this will automatically create price history)
        const updateResponse = await apiService.api.put(`/api/v1/asset-prices/asset/${assetId}`, {
          currentPrice: price,
          priceType,
          priceSource,
          changeReason,
          metadata: {
            changeReason,
            source: 'manual_update',
          },
        });
          return updateResponse.data;
      } catch (error: any) {
        // If price doesn't exist (404), create new one
        if (error.response?.status === 404) {
          const createResponse = await apiService.api.post('/api/v1/asset-prices', {
            assetId,
            currentPrice: price,
            priceType,
            priceSource,
            changeReason,
            metadata: {
              changeReason,
              source: 'manual_update',
            },
          });
          return createResponse.data;
        }
        // Re-throw other errors
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['globalAssets']);
        queryClient.invalidateQueries(['assetPrices']);
        queryClient.invalidateQueries(['priceHistory']);
        // Force refetch
        queryClient.refetchQueries(['globalAssets']);
        queryClient.refetchQueries(['priceHistory']);
      },
    }
  );
};

export const useUpdateAssetPriceFromMarket = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async (assetId: string) => {
      const response = await apiService.api.post(`/api/v1/market-data/update/${assetId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['globalAssets']);
        queryClient.invalidateQueries(['assetPrices']);
      },
    }
  );
};

export const useSupportedNations = () => {
  return useQuery(['supportedNations'], fetchSupportedNations, {
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useNationConfig = (nation: string) => {
  return useQuery(['nationConfig', nation], () => fetchNationConfig(nation), {
    enabled: !!nation,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useValidateSymbol = () => {
  return useMutation(
    ({ symbol, nation, type }: { symbol: string; nation: string; type: string }) =>
      validateSymbolFormat(symbol, nation, type)
  );
};

// Utility hook for managing asset state
export const useGlobalAssetManagement = () => {
  const [selectedAsset, setSelectedAsset] = useState<GlobalAsset | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const handleCreateAsset = useCallback(() => {
    setFormMode('create');
    setSelectedAsset(null);
    setFormOpen(true);
  }, []);

  const handleEditAsset = useCallback((asset: GlobalAsset) => {
    setFormMode('edit');
    setSelectedAsset(asset);
    setFormOpen(true);
  }, []);

  const handleViewAsset = useCallback((asset: GlobalAsset) => {
    setSelectedAsset(asset);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setSelectedAsset(null);
  }, []);

  return {
    selectedAsset,
    formOpen,
    formMode,
    handleCreateAsset,
    handleEditAsset,
    handleViewAsset,
    handleFormClose,
  };
};

// Auto Sync Hook
export const useAutoSync = () => {
  const queryClient = useQueryClient();

  // Get auto sync status
  const getAutoSyncStatus = useCallback(async (): Promise<AutoSyncStatus> => {
    try {
      const response = await apiService.api.get('/api/v1/global-assets/auto-sync/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get auto sync status:', error);
      throw error;
    }
  }, []);

  // Toggle auto sync
  const toggleAutoSync = useCallback(async (enabled: boolean): Promise<void> => {
    try {
      await apiService.api.post('/api/v1/global-assets/auto-sync/toggle', { enabled });
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries(['globalAssets']);
      queryClient.invalidateQueries(['assetPrices']);
    } catch (error) {
      console.error('Failed to toggle auto sync:', error);
      throw error;
    }
  }, [queryClient]);

  // Manual sync trigger
  const triggerManualSync = useCallback(async (): Promise<void> => {
    try {
      await apiService.api.post('/api/v1/global-assets/auto-sync/trigger');
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries(['globalAssets']);
      queryClient.invalidateQueries(['assetPrices']);
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
      throw error;
    }
  }, [queryClient]);

  return {
    getAutoSyncStatus,
    toggleAutoSync,
    triggerManualSync,
  };
};

export default useGlobalAssets;
