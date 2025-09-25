import { renderHook, act } from '@testing-library/react';
import { useAssetPriceBulk } from './useAssetPriceBulk';
import { apiService } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  apiService: {
    api: {
      get: jest.fn(),
      post: jest.fn(),
    },
  },
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe('useAssetPriceBulk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAssetPriceBulk());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.getAssetsWithHistoricalPrice).toBe('function');
    expect(typeof result.current.bulkUpdatePricesByDate).toBe('function');
    expect(typeof result.current.getAvailableHistoricalDates).toBe('function');
  });

  describe('getAssetsWithHistoricalPrice', () => {
    it('should fetch assets with historical prices successfully', async () => {
      const mockAssets = [
        {
          assetId: 'asset-1',
          symbol: 'HPG',
          name: 'Hoa Phat Group',
          currentPrice: 150000,
          historicalPrice: 148000,
          hasHistoricalData: true,
          currency: 'VND',
          type: 'STOCK',
        },
      ];

      mockApiService.api.get.mockResolvedValue({ data: mockAssets });

      const { result } = renderHook(() => useAssetPriceBulk());

      let response;
      await act(async () => {
        response = await result.current.getAssetsWithHistoricalPrice('2024-01-15');
      });

      expect(response).toEqual(mockAssets);
      expect(mockApiService.api.get).toHaveBeenCalledWith(
        '/api/v1/asset-prices/bulk/historical-prices?targetDate=2024-01-15'
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to fetch assets';
      mockApiService.api.get.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAssetPriceBulk());

      await act(async () => {
        try {
          await result.current.getAssetsWithHistoricalPrice('2024-01-15');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('should include asset IDs in request when provided', async () => {
      const mockAssets = [];
      mockApiService.api.get.mockResolvedValue({ data: mockAssets });

      const { result } = renderHook(() => useAssetPriceBulk());

      await act(async () => {
        await result.current.getAssetsWithHistoricalPrice('2024-01-15', ['asset-1', 'asset-2']);
      });

      expect(mockApiService.api.get).toHaveBeenCalledWith(
        '/api/v1/asset-prices/bulk/historical-prices?targetDate=2024-01-15&assetIds=asset-1%2Casset-2'
      );
    });
  });

  describe('bulkUpdatePricesByDate', () => {
    it('should update prices successfully', async () => {
      const mockResult = {
        successCount: 2,
        failedCount: 0,
        totalCount: 2,
        results: [
          {
            assetId: 'asset-1',
            symbol: 'HPG',
            success: true,
            message: 'Updated from 150000 to 148000',
            oldPrice: 150000,
            newPrice: 148000,
          },
        ],
      };

      mockApiService.api.post.mockResolvedValue({ data: mockResult });

      const { result } = renderHook(() => useAssetPriceBulk());

      let response;
      await act(async () => {
        response = await result.current.bulkUpdatePricesByDate(
          '2024-01-15',
          ['asset-1', 'asset-2'],
          'Test update'
        );
      });

      expect(response).toEqual(mockResult);
      expect(mockApiService.api.post).toHaveBeenCalledWith('/api/v1/asset-prices/bulk/update-by-date', {
        targetDate: '2024-01-15',
        assetIds: ['asset-1', 'asset-2'],
        reason: 'Test update',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should use default reason when not provided', async () => {
      const mockResult = {
        successCount: 1,
        failedCount: 0,
        totalCount: 1,
        results: [],
      };

      mockApiService.api.post.mockResolvedValue({ data: mockResult });

      const { result } = renderHook(() => useAssetPriceBulk());

      await act(async () => {
        await result.current.bulkUpdatePricesByDate('2024-01-15', ['asset-1']);
      });

      expect(mockApiService.api.post).toHaveBeenCalledWith('/api/v1/asset-prices/bulk/update-by-date', {
        targetDate: '2024-01-15',
        assetIds: ['asset-1'],
        reason: 'Bulk update from historical data',
      });
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to update prices';
      mockApiService.api.post.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAssetPriceBulk());

      await act(async () => {
        try {
          await result.current.bulkUpdatePricesByDate('2024-01-15', ['asset-1']);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('getAvailableHistoricalDates', () => {
    it('should fetch available dates successfully', async () => {
      const mockDates = [
        {
          date: '2024-01-15',
          assetCount: 25,
          isWeekend: false,
          isHoliday: false,
        },
      ];

      mockApiService.api.get.mockResolvedValue({ data: mockDates });

      const { result } = renderHook(() => useAssetPriceBulk());

      let response;
      await act(async () => {
        response = await result.current.getAvailableHistoricalDates(30);
      });

      expect(response).toEqual(mockDates);
      expect(mockApiService.api.get).toHaveBeenCalledWith('/api/v1/asset-prices/bulk/available-dates?limit=30');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should use default limit when not provided', async () => {
      const mockDates: any[] = [];
      mockApiService.api.get.mockResolvedValue({ data: mockDates });

      const { result } = renderHook(() => useAssetPriceBulk());

      await act(async () => {
        await result.current.getAvailableHistoricalDates();
      });

      expect(mockApiService.api.get).toHaveBeenCalledWith('/api/v1/asset-prices/bulk/available-dates?limit=30');
    });
  });
});
