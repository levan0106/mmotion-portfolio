/**
 * Asset Hooks Tests
 * Unit tests for asset management hooks
 */

import { renderHook, act } from '@testing-library/react';
import { useAssets } from '../../hooks/useAssets';
import { useAsset } from '../../hooks/useAsset';
import { useAssetForm } from '../../hooks/useAssetForm';
import { Asset, AssetType, CreateAssetRequest, UpdateAssetRequest } from '../../types/asset.types';
import { assetService } from '../../services/asset.service';
import { vi } from 'vitest';

// Mock the asset service
vi.mock('../../services/asset.service');
const mockAssetService = assetService as jest.Mocked<typeof assetService>;

const mockAsset: Asset = {
  id: 'test-asset-id',
  symbol: 'TEST',
  name: 'Test Asset',
  type: 'STOCK',
  assetClass: 'Equity',
  currency: 'USD',
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

describe('useAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    expect(result.current.assets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 10,
      total: 0,
    });
  });

  it('should fetch assets on mount when autoFetch is true', async () => {
    const mockResponse = {
      data: [mockAsset],
      total: 1,
      page: 1,
      limit: 10,
    };

    mockAssetService.getAssets.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAssets());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.assets).toEqual([mockAsset]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    mockAssetService.getAssets.mockRejectedValueOnce(new Error('Fetch failed'));

    const { result } = renderHook(() => useAssets());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.assets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Fetch failed');
  });

  it('should update filters and refetch', async () => {
    const mockResponse = {
      data: [mockAsset],
      total: 1,
      page: 1,
      limit: 10,
    };

    mockAssetService.getAssets.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    await act(async () => {
      result.current.setFilters({ type: AssetType.STOCK });
    });

    expect(mockAssetService.getAssets).toHaveBeenCalledWith({ type: AssetType.STOCK });
  });

  it('should update single filter', async () => {
    const mockResponse = {
      data: [mockAsset],
      total: 1,
      page: 1,
      limit: 10,
    };

    mockAssetService.getAssets.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    await act(async () => {
      result.current.updateFilter('type', AssetType.BOND);
    });

    expect(mockAssetService.getAssets).toHaveBeenCalledWith({ type: AssetType.BOND });
  });

  it('should clear filters', async () => {
    const mockResponse = {
      data: [mockAsset],
      total: 1,
      page: 1,
      limit: 10,
    };

    mockAssetService.getAssets.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    await act(async () => {
      result.current.clearFilters();
    });

    expect(mockAssetService.getAssets).toHaveBeenCalledWith({});
  });

  it('should refresh data', async () => {
    const mockResponse = {
      data: [mockAsset],
      total: 1,
      page: 1,
      limit: 10,
    };

    mockAssetService.getAssets.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAssets({ autoFetch: false }));

    await act(async () => {
      result.current.refresh();
    });

    expect(mockAssetService.getAssets).toHaveBeenCalled();
  });
});

describe('useAsset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAsset({ autoFetch: false }));

    expect(result.current.asset).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch asset on mount when assetId is provided', async () => {
    mockAssetService.getAssetById.mockResolvedValueOnce(mockAsset);

    const { result } = renderHook(() => useAsset({ assetId: 'test-asset-id' }));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.asset).toEqual(mockAsset);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create asset', async () => {
    const createData: CreateAssetRequest = {
      name: 'New Asset',
      symbol: 'NEW',
      type: AssetType.STOCK,
      initialValue: 1000000,
      initialQuantity: 100,
      createdBy: 'test-user-id',
      updatedBy: 'test-user-id',
    };

    mockAssetService.createAsset.mockResolvedValueOnce(mockAsset);

    const { result } = renderHook(() => useAsset({ autoFetch: false }));

    await act(async () => {
      const createdAsset = await result.current.createAsset(createData);
      expect(createdAsset).toEqual(mockAsset);
    });

    expect(result.current.asset).toEqual(mockAsset);
    expect(mockAssetService.createAsset).toHaveBeenCalledWith(createData);
  });

  it('should update asset', async () => {
    const updateData: UpdateAssetRequest = {
      name: 'Updated Asset',
      updatedBy: 'test-user-id',
    };

    const updatedAsset = { ...mockAsset, name: 'Updated Asset' };
    mockAssetService.updateAsset.mockResolvedValueOnce(updatedAsset);

    const { result } = renderHook(() => useAsset({ autoFetch: false }));

    await act(async () => {
      const resultAsset = await result.current.updateAsset('test-asset-id', updateData);
      expect(resultAsset).toEqual(updatedAsset);
    });

    expect(result.current.asset).toEqual(updatedAsset);
    expect(mockAssetService.updateAsset).toHaveBeenCalledWith('test-asset-id', updateData);
  });

  it('should delete asset', async () => {
    mockAssetService.deleteAsset.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAsset({ autoFetch: false }));

    await act(async () => {
      await result.current.deleteAsset('test-asset-id');
    });

    expect(result.current.asset).toBeNull();
    expect(mockAssetService.deleteAsset).toHaveBeenCalledWith('test-asset-id');
  });

  it('should handle errors', async () => {
    mockAssetService.getAssetById.mockRejectedValueOnce(new Error('Asset not found'));

    const { result } = renderHook(() => useAsset({ assetId: 'invalid-id' }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.asset).toBeNull();
    expect(result.current.error).toBe('Asset not found');
  });
});

describe('useAssetForm', () => {
  it('should initialize with default form data', () => {
    const { result } = renderHook(() => useAssetForm());

    expect(result.current.data).toEqual({
      name: '',
      code: '',
      type: AssetType.STOCK,
      description: '',
      initialValue: 0,
      initialQuantity: 0,
      currentValue: undefined,
      currentQuantity: undefined,
    });
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('should initialize with provided data', () => {
    const initialData = {
      name: 'Test Asset',
      type: AssetType.BOND,
      initialValue: 1000000,
    };

    const { result } = renderHook(() => useAssetForm({ initialData }));

    expect(result.current.data.name).toBe('Test Asset');
    expect(result.current.data.type).toBe(AssetType.BOND);
    expect(result.current.data.initialValue).toBe(1000000);
  });

  it('should update field value', () => {
    const { result } = renderHook(() => useAssetForm());

    act(() => {
      result.current.setField('name', 'New Asset Name');
    });

    expect(result.current.data.name).toBe('New Asset Name');
    expect(result.current.isDirty).toBe(true);
  });

  it('should update multiple fields', () => {
    const { result } = renderHook(() => useAssetForm());

    act(() => {
      result.current.setFields({
        name: 'New Asset',
        type: AssetType.GOLD,
        initialValue: 2000000,
      });
    });

    expect(result.current.data.name).toBe('New Asset');
    expect(result.current.data.type).toBe(AssetType.GOLD);
    expect(result.current.data.initialValue).toBe(2000000);
    expect(result.current.isDirty).toBe(true);
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() => useAssetForm());

    act(() => {
      result.current.validateField('name');
    });

    expect(result.current.errors.name).toBe('name is required');
    expect(result.current.isValid).toBe(false);
  });

  it('should validate field length', () => {
    const { result } = renderHook(() => useAssetForm());

    act(() => {
      result.current.setField('name', 'a'.repeat(300)); // Exceeds max length
      result.current.validateField('name');
    });

    expect(result.current.errors.name).toBe('name must not exceed 255 characters');
  });

  it('should validate number ranges', () => {
    const { result } = renderHook(() => useAssetForm());

    act(() => {
      result.current.setField('initialValue', -100); // Below minimum
      result.current.validateField('initialValue');
    });

    expect(result.current.errors.initialValue).toBe('initialValue must be at least 0');
  });

  it('should clear error when field is updated', () => {
    const { result } = renderHook(() => useAssetForm());

    // First, create an error
    act(() => {
      result.current.validateField('name');
    });

    expect(result.current.errors.name).toBeDefined();

    // Then update the field
    act(() => {
      result.current.setField('name', 'Valid Name');
    });

    expect(result.current.errors.name).toBeUndefined();
  });

  it('should reset form', () => {
    const { result } = renderHook(() => useAssetForm());

    // Modify form
    act(() => {
      result.current.setField('name', 'Modified Name');
      result.current.setError('name', 'Some error');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.errors.name).toBe('Some error');

    // Reset form
    act(() => {
      result.current.reset();
    });

    expect(result.current.data.name).toBe('');
    expect(result.current.errors).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it('should handle form submission', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAssetForm({ onSubmit: mockOnSubmit }));

    // Set valid data
    act(() => {
      result.current.setFields({
        name: 'Valid Asset',
        initialValue: 1000000,
        initialQuantity: 100,
      });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Valid Asset',
      code: '',
      type: AssetType.STOCK,
      description: '',
      initialValue: 1000000,
      initialQuantity: 100,
      currentValue: undefined,
      currentQuantity: undefined,
    });
  });
});
