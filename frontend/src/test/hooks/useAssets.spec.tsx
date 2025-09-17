/**
 * useAssets Hook Tests
 * Unit tests for useAssets custom hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAssets } from '../../hooks/useAssets';
import { assetService } from '../../services/asset.service';
import { vi } from 'vitest';

// Mock the asset service
vi.mock('../../services/asset.service');
const mockAssetService = assetService as jest.Mocked<typeof assetService>;

// Mock fetch globally
global.fetch = vi.fn();

const mockAssets = [
  {
    id: 'asset-1',
    name: 'Test Asset 1',
    code: 'TEST1',
    type: 'STOCK' as const,
    totalValue: 100000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
  },
  {
    id: 'asset-2',
    name: 'Test Asset 2',
    code: 'TEST2',
    type: 'BOND' as const,
    totalValue: 200000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
  },
];

describe('useAssets Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockAssets }),
    });
  });

  it('should delete asset and update local state', async () => {
    // Mock successful delete
    mockAssetService.deleteAsset.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAssets({ 
      initialFilters: { limit: 25, page: 1 },
      autoFetch: true 
    }));

    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify initial state
    expect(result.current.assets).toHaveLength(2);
    expect(result.current.pagination.total).toBe(2);

    // Delete an asset
    await act(async () => {
      await result.current.deleteAsset('asset-1');
    });

    // Verify asset was removed from local state
    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0].id).toBe('asset-2');
    
    // Verify pagination was updated
    expect(result.current.pagination.total).toBe(1);
    
    // Verify deleteAsset was called
    expect(mockAssetService.deleteAsset).toHaveBeenCalledWith('asset-1');
  });

  it('should have forceRefresh function available', () => {
    const { result } = renderHook(() => useAssets({ 
      initialFilters: { limit: 25, page: 1 },
      autoFetch: false 
    }));

    expect(result.current.forceRefresh).toBeDefined();
    expect(typeof result.current.forceRefresh).toBe('function');
  });

  it('should handle delete error gracefully', async () => {
    // Mock delete error
    mockAssetService.deleteAsset.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useAssets({ 
      initialFilters: { limit: 25, page: 1 },
      autoFetch: true 
    }));

    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Attempt to delete an asset
    await act(async () => {
      try {
        await result.current.deleteAsset('asset-1');
      } catch (error) {
        // Expected to throw
      }
    });

    // Verify error state
    expect(result.current.error).toBe('Delete failed');
    
    // Verify assets were not modified
    expect(result.current.assets).toHaveLength(2);
  });
});
