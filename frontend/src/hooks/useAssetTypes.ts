/**
 * Hook for managing asset types
 * Fetches asset types from backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/asset.service';

export interface AssetType {
  value: string;
  label: string;
  description: string;
}

export interface UseAssetTypesReturn {
  assetTypes: AssetType[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAssetTypes = (): UseAssetTypesReturn => {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssetTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const types = await assetService.getAssetTypes();
      setAssetTypes(types);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch asset types';
      setError(errorMessage);
      console.error('Error fetching asset types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchAssetTypes();
  }, [fetchAssetTypes]);

  useEffect(() => {
    fetchAssetTypes();
  }, [fetchAssetTypes]);

  return {
    assetTypes,
    loading,
    error,
    refresh,
  };
};
