/**
 * useAsset Hook
 * Custom hook for managing single asset state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Asset, CreateAssetRequest, UpdateAssetRequest } from '../types/asset.types';
import { assetService } from '../services/asset.service';

export interface UseAssetOptions {
  assetId?: string;
  autoFetch?: boolean;
}

export interface UseAssetReturn {
  // Data
  asset: Asset | null;
  
  // State
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAsset: (id: string) => Promise<void>;
  createAsset: (data: CreateAssetRequest) => Promise<Asset>;
  updateAsset: (id: string, data: UpdateAssetRequest) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

export const useAsset = (options: UseAssetOptions = {}): UseAssetReturn => {
  const { assetId, autoFetch = true } = options;

  // State
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch single asset
  const fetchAsset = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const fetchedAsset = await assetService.getAssetById(id);
      setAsset(fetchedAsset);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch asset');
      setAsset(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create asset
  const createAsset = useCallback(async (data: CreateAssetRequest): Promise<Asset> => {
    try {
      setLoading(true);
      setError(null);

      const newAsset = await assetService.createAsset(data);
      setAsset(newAsset);
      return newAsset;
    } catch (err: any) {
      setError(err.message || 'Failed to create asset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update asset
  const updateAsset = useCallback(async (id: string, data: UpdateAssetRequest): Promise<Asset> => {
    try {
      setLoading(true);
      setError(null);

      const updatedAsset = await assetService.updateAsset(id, data);
      setAsset(updatedAsset);
      return updatedAsset;
    } catch (err: any) {
      setError(err.message || 'Failed to update asset');
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
      setAsset(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete asset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh current asset
  const refresh = useCallback(async () => {
    if (asset?.id) {
      await fetchAsset(asset.id);
    }
  }, [asset?.id, fetchAsset]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setAsset(null);
    setError(null);
    setLoading(false);
  }, []);

  // Auto fetch on mount if assetId is provided
  useEffect(() => {
    if (autoFetch && assetId) {
      fetchAsset(assetId);
    }
  }, [assetId, autoFetch, fetchAsset]);

  return {
    // Data
    asset,
    
    // State
    loading,
    error,
    
    // Actions
    fetchAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    refresh,
    
    // Utility
    clearError,
    reset,
  };
};
