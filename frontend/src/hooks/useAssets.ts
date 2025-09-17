/**
 * Custom hook for managing assets
 */

import { useState, useEffect, useCallback } from 'react';
import { Asset, AssetFilters, UpdateAssetRequest } from '../types/asset.types';
import { assetService } from '../services/asset.service';
import { apiService } from '../services/api';
import { useAccount } from './useAccount';
import { calculatePerformanceWithMarketData, calculatePerformanceWithTrades } from '../utils/performance.utils';

export interface UseAssetsOptions {
  initialFilters?: AssetFilters;
  autoFetch?: boolean;
}

export interface UseAssetsReturn {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setFilters: (filters: AssetFilters) => void;
  updateFilter: (key: keyof AssetFilters, value: any) => void;
  clearFilters: () => void;
  refresh: () => void;
  forceRefresh: () => Promise<void>;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  updateAsset: (id: string, data: UpdateAssetRequest) => Promise<Asset>;
  createAsset: (data: any) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
}

// No mock data - using real API

export const useAssets = (options: UseAssetsOptions = {}): UseAssetsReturn => {
  const { initialFilters = {}, autoFetch = true } = options;
  const { accountId } = useAccount();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<AssetFilters>({
    createdBy: accountId, // Use current user ID by default
    search: '',
    type: undefined,
    minValue: undefined,
    maxValue: undefined,
    limit: 25,
    page: 1,
    sortBy: 'name',
    sortOrder: 'ASC',
    ...initialFilters,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  // Real API call
  const fetchAssets = useCallback(async (currentFilters: AssetFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      // Use userId endpoint if createdBy is provided
      const baseUrl = currentFilters.createdBy 
        ? `/api/v1/assets/user/${currentFilters.createdBy}`
        : '/api/v1/assets';
      const url = `${baseUrl}?${queryParams.toString()}`;
      
      try {
        const response = await apiService.api.get(url);
        const data = response.data;
      
        // Map backend data to frontend format
        const mapAsset = (asset: any): Asset => {
        // Calculate real performance data
        const performanceData = {
          initialValue: asset.initialValue || 0,
          currentValue: asset.currentValue || 0,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
        };
        
        // Calculate performance based on available data
        let performance;
        if (asset.trades && asset.trades.length > 0) {
          // Use trade-based performance calculation
          performance = calculatePerformanceWithTrades(performanceData, asset.trades);
        } else {
          // Use market data simulation
          performance = calculatePerformanceWithMarketData(performanceData, asset.symbol);
        }
        
        const mappedAsset = {
          ...asset,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt,
          // Preserve computed fields from backend
          initialValue: asset.initialValue,
          initialQuantity: asset.initialQuantity,
          currentValue: asset.currentValue,
          currentQuantity: asset.currentQuantity,
          // Preserve backend computed fields
          hasTrades: asset.hasTrades,
          displayName: asset.displayName,
          // For assets without trades, use initial values as total values
          totalValue: asset.hasTrades 
            ? (asset.totalValue || asset.currentValue || 0)
            : (asset.initialValue || 0),
          totalQuantity: asset.hasTrades 
            ? (asset.totalQuantity || asset.currentQuantity || 0)
            : (asset.initialQuantity || 0),
          // Add additional computed properties for frontend
          currentPrice: asset.currentPrice || 0, // Use backend currentPrice
          avgCost: asset.avgCost || 0, // Use backend avgCost
          quantity: asset.hasTrades 
            ? (asset.currentQuantity || 0)
            : (asset.initialQuantity || 0), // Use initialQuantity when no trades
          performance: performance, // Real calculated performance
        };
        return mappedAsset;
      };
      
      
      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        const mappedAssets = data.map(mapAsset);
        setAssets(mappedAssets);
        setPagination({
          page: 1,
          limit: mappedAssets.length,
          total: mappedAssets.length,
          totalPages: 1,
        });
      } else {
        const mappedAssets = (data.data || []).map(mapAsset);
        setAssets(mappedAssets);
        setPagination({
          page: data.page || 1,
          limit: data.limit || 25,
          total: data.total || 0,
          totalPages: data.totalPages || 0,
        });
      }
      } catch (apiError) {
        console.error('Error fetching assets from API:', apiError);
        throw apiError;
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      // No fallback - show empty state
      setAssets([]);
      setPagination({
        page: 1,
        limit: 25,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Set filters and trigger fetch
  const setFilters = useCallback((newFilters: AssetFilters) => {
    setFiltersState(newFilters);
    if (autoFetch) {
      fetchAssets(newFilters);
    }
  }, [autoFetch]);

  // Update a single filter
  const updateFilter = useCallback((key: keyof AssetFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  }, [filters, setFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      createdBy: accountId, // Keep current user ID when clearing filters
      portfolioId: undefined,
      search: '',
      type: undefined,
      minValue: undefined,
      maxValue: undefined,
      limit: 25,
      page: 1,
      sortBy: 'name',
      sortOrder: 'ASC' as const,
    };
    setFilters(clearedFilters);
  }, [setFilters, accountId]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchAssets(filters);
  }, [filters, fetchAssets]);

  // Force refresh from server (useful after delete operations)
  const forceRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchAssets(filters);
    } catch (err) {
      console.error('forceRefresh error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh assets';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, fetchAssets]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    updateFilter('page', page);
  }, [updateFilter]);

  // Set page size
  const setPageSize = useCallback((size: number) => {
    updateFilter('limit', size);
    updateFilter('page', 1); // Reset to first page
  }, [updateFilter]);

  // Set sorting
  const setSorting = useCallback((sortBy: string, sortOrder: 'ASC' | 'DESC') => {
    updateFilter('sortBy', sortBy);
    updateFilter('sortOrder', sortOrder);
  }, [updateFilter]);

  // Update asset
  const updateAsset = useCallback(async (id: string, data: UpdateAssetRequest): Promise<Asset> => {
    try {
      console.log('useAssets updateAsset called with:', { id, data });
      setLoading(true);
      setError(null);
      
      // Map frontend data to backend format
      const backendData: any = {
        ...data,
      };
      
      // Symbol field is already mapped correctly
      // No need to map code to symbol as UpdateAssetRequest doesn't have code field
      
      console.log('Mapped backend data:', backendData);
      console.log('Calling assetService.updateAsset...');
      const updatedAsset = await assetService.updateAsset(id, backendData);
      console.log('assetService.updateAsset result:', updatedAsset);
      
      // Calculate performance for updated asset
      const performanceData = {
        initialValue: (updatedAsset as any).initialValue || 0,
        currentValue: (updatedAsset as any).currentValue || 0,
        createdAt: updatedAsset.createdAt,
        updatedAt: updatedAsset.updatedAt,
      };
      
      let performance;
      if ((updatedAsset as any).trades && (updatedAsset as any).trades.length > 0) {
        performance = calculatePerformanceWithTrades(performanceData, (updatedAsset as any).trades);
      } else {
        performance = calculatePerformanceWithMarketData(performanceData, updatedAsset.symbol);
      }
      
      // Map backend response to frontend format
      const frontendAsset: Asset = {
        ...updatedAsset,
        // For assets without trades, use initial values as total values
        totalValue: (updatedAsset as any).hasTrades 
          ? ((updatedAsset as any).totalValue || (updatedAsset as any).currentValue || 0)
          : ((updatedAsset as any).initialValue || 0),
        totalQuantity: (updatedAsset as any).hasTrades 
          ? ((updatedAsset as any).totalQuantity || (updatedAsset as any).currentQuantity || 0)
          : ((updatedAsset as any).initialQuantity || 0),
        quantity: (updatedAsset as any).hasTrades 
          ? ((updatedAsset as any).currentQuantity || 0)
          : ((updatedAsset as any).initialQuantity || 0),
        performance: performance,
      } as unknown as Asset;
      
      // Update the asset in the local state
      setAssets(prevAssets => {
        console.log('Previous assets:', prevAssets);
        console.log('Asset to update ID:', id);
        console.log('Frontend asset data:', frontendAsset);
        
        const newAssets = prevAssets.map(asset => {
          if (asset.id === id) {
            const updatedAsset = { ...asset, ...frontendAsset };
            console.log('Updated asset:', updatedAsset);
            return updatedAsset;
          }
          return asset;
        });
        
        console.log('New assets state:', newAssets);
        return newAssets;
      });
      
      return frontendAsset;
    } catch (err) {
      console.error('Error in updateAsset:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update asset';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create asset
  const createAsset = useCallback(async (data: any): Promise<Asset> => {
    try {
      setLoading(true);
      setError(null);
      
      const newAsset = await assetService.createAsset(data);
      
      // Calculate performance for new asset
      const performanceData = {
        initialValue: (newAsset as any).initialValue || 0,
        currentValue: (newAsset as any).currentValue || 0,
        createdAt: newAsset.createdAt,
        updatedAt: newAsset.updatedAt,
      };
      
      let performance;
      if ((newAsset as any).trades && (newAsset as any).trades.length > 0) {
        performance = calculatePerformanceWithTrades(performanceData, (newAsset as any).trades);
      } else {
        performance = calculatePerformanceWithMarketData(performanceData, newAsset.symbol);
      }
      
      // Add performance to new asset
      const assetWithPerformance: Asset = {
        ...newAsset,
        // For assets without trades, use initial values as total values
        totalValue: (newAsset as any).hasTrades 
          ? ((newAsset as any).totalValue || (newAsset as any).currentValue || 0)
          : ((newAsset as any).initialValue || 0),
        totalQuantity: (newAsset as any).hasTrades 
          ? ((newAsset as any).totalQuantity || (newAsset as any).currentQuantity || 0)
          : ((newAsset as any).initialQuantity || 0),
        quantity: (newAsset as any).hasTrades 
          ? ((newAsset as any).currentQuantity || 0)
          : ((newAsset as any).initialQuantity || 0),
        performance: performance,
      } as unknown as Asset;
      
      // Add the new asset to the local state
      setAssets(prevAssets => [assetWithPerformance, ...prevAssets]);
      
      return assetWithPerformance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create asset';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete asset
  const deleteAsset = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await assetService.deleteAsset(id);
      
      // Remove the asset from the local state
      setAssets(prevAssets => prevAssets.filter(asset => asset.id !== id));
      
      // Update pagination total count
      setPagination(prevPagination => ({
        ...prevPagination,
        total: Math.max(0, prevPagination.total - 1)
      }));
      
      // Optionally refresh from server to ensure data consistency
      // This provides a more robust refresh but adds a network call
      // Uncomment the line below if you want server-side refresh after delete
      // await fetchAssets(filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete asset';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [filters, fetchAssets]);

  // Update filters when accountId changes
  useEffect(() => {
    if (accountId && filters.createdBy !== accountId) {
      setFiltersState(prev => ({
        ...prev,
        createdBy: accountId,
      }));
    }
  }, [accountId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAssets(filters);
    }
  }, [autoFetch, fetchAssets, filters]);

  // Refresh performance data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (assets.length > 0) {
        // Recalculate performance for all assets
        const updatedAssets = assets.map(asset => {
          const performanceData = {
            initialValue: (asset as any).initialValue || 0,
            currentValue: (asset as any).currentValue || 0,
            createdAt: asset.createdAt,
            updatedAt: asset.updatedAt,
          };
          
          let performance;
          if ((asset as any).trades && (asset as any).trades.length > 0) {
            performance = calculatePerformanceWithTrades(performanceData, (asset as any).trades);
          } else {
            performance = calculatePerformanceWithMarketData(performanceData, asset.symbol);
          }
          
          return {
            ...asset,
            // For assets without trades, use initial values as total values
            totalValue: (asset as any).hasTrades 
              ? ((asset as any).totalValue || (asset as any).currentValue || 0)
              : ((asset as any).initialValue || 0),
            totalQuantity: (asset as any).hasTrades 
              ? ((asset as any).totalQuantity || (asset as any).currentQuantity || 0)
              : ((asset as any).initialQuantity || 0),
            quantity: (asset as any).hasTrades 
              ? ((asset as any).currentQuantity || 0)
              : ((asset as any).initialQuantity || 0),
            performance: performance,
          } as Asset;
        });
        
        setAssets(updatedAssets);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [assets]);

  return {
    assets,
    loading,
    error,
    pagination,
    setFilters,
    updateFilter,
    clearFilters,
    refresh,
    forceRefresh,
    goToPage,
    setPageSize,
    setSorting,
    updateAsset,
    createAsset,
    deleteAsset,
  };
};