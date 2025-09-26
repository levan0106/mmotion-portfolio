/**
 * Test pagination functionality in useAssets hook
 */

import { renderHook, act } from '@testing-library/react';
import { useAssets } from '../useAssets';
import { AssetType } from '../../types/asset.types';

// Mock the dependencies
jest.mock('../services/asset.service');
jest.mock('../services/api');
jest.mock('./useAccount');

const mockApiService = {
  api: {
    get: jest.fn(),
  },
};

const mockAssetService = {
  updateAsset: jest.fn(),
  createAsset: jest.fn(),
  deleteAsset: jest.fn(),
};

const mockUseAccount = {
  accountId: 'test-user-id',
};

// Mock the modules
jest.mock('../services/api', () => ({
  apiService: mockApiService,
}));

jest.mock('../services/asset.service', () => ({
  assetService: mockAssetService,
}));

jest.mock('./useAccount', () => ({
  useAccount: () => mockUseAccount,
}));

describe('useAssets Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    mockApiService.api.get.mockResolvedValue({
      data: {
        assets: [
          { id: '1', name: 'Asset 1', symbol: 'A1', type: 'STOCK' },
          { id: '2', name: 'Asset 2', symbol: 'A2', type: 'STOCK' },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 2,
        },
      },
    });
  });

  it('should update page size correctly', async () => {
    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Change page size from 25 to 10
    await act(async () => {
      result.current.setPageSize(10);
    });

    // Verify that the API was called with correct parameters
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('limit=10')
    );
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('page=1')
    );
  });

  it('should reset to page 1 when changing page size', async () => {
    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Go to page 2 first
    await act(async () => {
      result.current.goToPage(2);
    });

    // Change page size - should reset to page 1
    await act(async () => {
      result.current.setPageSize(10);
    });

    // Verify that page was reset to 1
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('page=1')
    );
  });

  it('should update sorting correctly', async () => {
    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Change sorting
    await act(async () => {
      result.current.setSorting('name', 'DESC');
    });

    // Verify that the API was called with correct parameters
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=name')
    );
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('sortOrder=DESC')
    );
  });

  it('should handle multiple filter updates correctly', async () => {
    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Update multiple filters at once
    await act(async () => {
      result.current.setFilters({
        createdBy: 'test-user-id',
        search: 'test',
        type: AssetType.STOCK,
        limit: 10,
        page: 1,
        sortBy: 'name',
        sortOrder: 'ASC',
      });
    });

    // Verify that the API was called with all parameters
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('limit=10')
    );
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('page=1')
    );
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('search=test')
    );
    expect(mockApiService.api.get).toHaveBeenCalledWith(
      expect.stringContaining('type=STOCK')
    );
  });
});
