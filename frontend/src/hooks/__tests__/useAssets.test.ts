/**
 * useAssets Hook Tests
 * Test asset data mapping with hasTrades logic
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAssets } from '../useAssets';

// Mock fetch
global.fetch = vi.fn();

// Mock useAccount
vi.mock('../../hooks/useAccount', () => ({
  useAccount: () => ({
    accountId: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    baseCurrency: 'VND',
  }),
}));

describe('useAssets Hook - Asset Data Mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should map assets with trades correctly', async () => {
    const mockApiResponse = {
      data: [
        {
          id: '1',
          symbol: 'VFF',
          name: 'VFF Stock',
          type: 'STOCK',
          initialValue: '200000.00',
          initialQuantity: '10.0000',
          currentValue: '0.00',
          currentQuantity: '0.0000',
          totalValue: '0.00',
          totalQuantity: '0.0000',
          hasTrades: true,
          displayName: 'VFF Stock (VFF)',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useAssets());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.assets).toHaveLength(1);
    
    const asset = result.current.assets[0];
    expect(asset.hasTrades).toBe(true);
    // For assets with trades, use computed values
    expect(asset.totalValue).toBe('0.00'); // currentValue = 0
    expect(asset.totalQuantity).toBe('0.0000'); // currentQuantity = 0
    expect(asset.quantity).toBe('0.0000'); // currentQuantity = 0
  });

  it('should map assets without trades correctly', async () => {
    const mockApiResponse = {
      data: [
        {
          id: '2',
          symbol: 'SJC',
          name: 'Vàng miếng',
          type: 'GOLD',
          initialValue: '5000000.00',
          initialQuantity: '1.0000',
          currentValue: '0.00',
          currentQuantity: '0.0000',
          totalValue: '0.00',
          totalQuantity: '0.0000',
          hasTrades: false,
          displayName: 'Vàng miếng (SJC)',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useAssets());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.assets).toHaveLength(1);
    
    const asset = result.current.assets[0];
    expect(asset.hasTrades).toBe(false);
    // For assets without trades, use initial values as total values
    expect(asset.totalValue).toBe('5000000.00'); // initialValue
    expect(asset.totalQuantity).toBe('1.0000'); // initialQuantity
    expect(asset.quantity).toBe('1.0000'); // initialQuantity
  });

  it('should handle mixed assets correctly', async () => {
    const mockApiResponse = {
      data: [
        {
          id: '1',
          symbol: 'VFF',
          name: 'VFF Stock',
          type: 'STOCK',
          initialValue: '200000.00',
          initialQuantity: '10.0000',
          currentValue: '220000.00',
          currentQuantity: '10.0000',
          totalValue: '220000.00',
          totalQuantity: '10.0000',
          hasTrades: true,
          displayName: 'VFF Stock (VFF)',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          symbol: 'SJC',
          name: 'Vàng miếng',
          type: 'GOLD',
          initialValue: '5000000.00',
          initialQuantity: '1.0000',
          currentValue: '0.00',
          currentQuantity: '0.0000',
          totalValue: '0.00',
          totalQuantity: '0.0000',
          hasTrades: false,
          displayName: 'Vàng miếng (SJC)',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useAssets());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.assets).toHaveLength(2);
    
    // Asset with trades
    const assetWithTrades = result.current.assets.find(a => a.symbol === 'VFF');
    expect(assetWithTrades?.hasTrades).toBe(true);
    expect(assetWithTrades?.totalValue).toBe('220000.00'); // currentValue
    expect(assetWithTrades?.totalQuantity).toBe('10.0000'); // currentQuantity
    expect(assetWithTrades?.quantity).toBe('10.0000'); // currentQuantity
    
    // Asset without trades
    const assetWithoutTrades = result.current.assets.find(a => a.symbol === 'SJC');
    expect(assetWithoutTrades?.hasTrades).toBe(false);
    expect(assetWithoutTrades?.totalValue).toBe('5000000.00'); // initialValue
    expect(assetWithoutTrades?.totalQuantity).toBe('1.0000'); // initialQuantity
    expect(assetWithoutTrades?.quantity).toBe('1.0000'); // initialQuantity
  });
});
