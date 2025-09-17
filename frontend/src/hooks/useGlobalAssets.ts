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

// Backend returns array directly, not wrapped in an object
type GlobalAssetResponse = GlobalAsset[];

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
    const assets = await fetchGlobalAssets(query);
    
    // Fetch prices for each asset
    const assetsWithPrices = await Promise.all(
      assets.map(async (asset) => {
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
  }, {
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  return {
    ...result,
    data: result.data || [],
    total: result.data?.length || 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  };
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

export default useGlobalAssets;
