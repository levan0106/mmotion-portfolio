/**
 * Asset Service Tests
 * Unit tests for AssetService
 */

import { vi } from 'vitest';
import { AssetService } from '../../services/asset.service';
import { Asset, AssetType, CreateAssetRequest, UpdateAssetRequest, AssetFilters } from '../../types/asset.types';
import { apiService } from '../../services/api';

// Mock the apiService
vi.mock('../../services/api', () => ({
  apiService: {
    api: {
      request: vi.fn(),
    },
  },
}));

const mockRequest = vi.mocked(apiService.api.request);

describe('AssetService', () => {
  let assetService: AssetService;

  const mockAsset: Asset = {
    id: 'test-asset-id',
    symbol: 'TEST',
    name: 'Test Asset',
    type: 'STOCK',
    assetClass: 'Equity',
    currency: 'VND',
    isActive: true,
    description: 'Test asset description',
    initialValue: 1000000,
    initialQuantity: 100,
    currentValue: 1200000,
    currentQuantity: 100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'test-user-id',
    updatedBy: 'test-user-id',
    totalValue: 1200000,
    totalQuantity: 100,
    hasTrades: false,
    displayName: 'Test Asset (TEST)',
  };

  beforeEach(() => {
    assetService = new AssetService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createAsset', () => {
    it('should create a new asset successfully', async () => {
      const createData: CreateAssetRequest = {
        name: 'New Asset',
        symbol: 'NEW',
        type: AssetType.STOCK,
        description: 'New asset description',
        createdBy: 'test-user-id',
        updatedBy: 'test-user-id',
      };

      mockRequest.mockResolvedValueOnce({
        data: mockAsset,
      });

      const result = await assetService.createAsset(createData);

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/v1/assets',
        data: createData,
      });
      expect(result).toEqual(mockAsset);
    });
  });

  describe('getAssets', () => {
    it('should get assets with filters', async () => {
      const filters: AssetFilters = {
        type: AssetType.STOCK,
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [mockAsset],
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };

      mockRequest.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await assetService.getAssets(filters);

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/assets?type=STOCK&page=1&limit=10',
        data: undefined,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAssetById', () => {
    it('should get asset by ID', async () => {
      mockRequest.mockResolvedValueOnce({
        data: mockAsset,
      });

      const result = await assetService.getAssetById('test-asset-id');

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/assets/test-asset-id',
        data: undefined,
      });
      expect(result).toEqual(mockAsset);
    });
  });

  describe('updateAsset', () => {
    it('should update asset successfully', async () => {
      const updateData: UpdateAssetRequest = {
        name: 'Updated Asset',
        description: 'Updated description',
        updatedBy: 'test-user-id',
      };

      const updatedAsset = { ...mockAsset, ...updateData };

      mockRequest.mockResolvedValueOnce({
        data: updatedAsset,
      });

      const result = await assetService.updateAsset('test-asset-id', updateData);

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/api/v1/assets/test-asset-id',
        data: updateData,
      });
      expect(result).toEqual(updatedAsset);
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset successfully', async () => {
      mockRequest.mockResolvedValueOnce({
        data: undefined,
      });

      await assetService.deleteAsset('test-asset-id');

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/api/v1/assets/test-asset-id',
        data: undefined,
      });
    });
  });

  describe('searchAssets', () => {
    it('should search assets by term', async () => {
      const mockResponse = {
        data: [mockAsset],
      };

      mockRequest.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await assetService.searchAssets('test');

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/assets/search?q=test',
        data: undefined,
      });
      expect(result).toEqual([mockAsset]);
    });
  });

  describe('getTradeCount', () => {
    it('should get trade count for asset', async () => {
      const mockResponse = {
        count: 5,
      };

      mockRequest.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await assetService.getTradeCount('test-asset-id');

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/v1/assets/test-asset-id/trades/count',
        data: undefined,
      });
      expect(result).toBe(5);
    });
  });

  describe('forceDeleteAsset', () => {
    it('should force delete asset', async () => {
      mockRequest.mockResolvedValueOnce({
        data: undefined,
      });

      await assetService.forceDeleteAsset('test-asset-id');

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/api/v1/assets/test-asset-id/force',
        data: undefined,
      });
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockRequest.mockRejectedValueOnce(error);

      await expect(assetService.getAssets()).rejects.toThrow('API Error');
    });
  });
});