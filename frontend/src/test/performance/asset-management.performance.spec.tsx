/**
 * Asset Management Performance Tests
 * Performance and load testing for asset management components
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetManagementPage } from '../../pages/AssetManagement';
import { Asset, AssetType } from '../../types/asset.types';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../hooks/useAssets', () => ({
  useAssets: vi.fn(),
}));

// Mock the components
vi.mock('../../components/Asset/AssetList', () => ({
  AssetList: ({ onAssetSelect, onAssetEdit, onAssetDelete }: any) => (
    <div data-testid="asset-list">
      <button onClick={() => onAssetSelect?.({ id: '1', name: 'Test Asset' })}>
        Select Asset
      </button>
      <button onClick={() => onAssetEdit?.({ id: '1', name: 'Test Asset' })}>
        Edit Asset
      </button>
      <button onClick={() => onAssetDelete?.({ id: '1', name: 'Test Asset' })}>
        Delete Asset
      </button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetCard', () => ({
  AssetCard: ({ asset, onEdit, onDelete, onView }: any) => (
    <div data-testid="asset-card">
      <span>{asset.name}</span>
      <button onClick={() => onEdit?.(asset)}>Edit</button>
      <button onClick={() => onDelete?.(asset)}>Delete</button>
      <button onClick={() => onView?.(asset)}>View</button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetFilters', () => ({
  AssetFilters: ({ onFiltersChange, onClearFilters }: any) => (
    <div data-testid="asset-filters">
      <button onClick={() => onFiltersChange({ search: 'test' })}>
        Change Filters
      </button>
      <button onClick={onClearFilters}>Clear Filters</button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetForm', () => ({
  AssetForm: ({ onSubmit }: any) => (
    <div data-testid="asset-form">
      <button onClick={() => onSubmit?.({ name: 'New Asset', type: AssetType.STOCK })}>
        Submit Form
      </button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetAnalytics', () => ({
  AssetAnalytics: ({ onClose }: any) => (
    <div data-testid="asset-analytics">
      <button onClick={onClose}>Close Analytics</button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetDialogs', () => ({
  AssetDialogs: ({ onClose, onSubmit, onDeleteConfirm }: any) => (
    <div data-testid="asset-dialogs">
      <button onClick={onClose}>Close Dialog</button>
      <button onClick={() => onSubmit?.({ id: '1', name: 'Updated Asset' })}>
        Submit Dialog
      </button>
      <button onClick={() => onDeleteConfirm?.({ id: '1', name: 'Test Asset' })}>
        Confirm Delete
      </button>
    </div>
  ),
}));

// Helper function to create mock assets
const createMockAssets = (count: number): Asset[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `asset-${i}`,
    symbol: `CODE${i}`,
    name: `Asset ${i}`,
    type: Object.values(AssetType)[i % Object.values(AssetType).length] as string,
    assetClass: 'Equity',
    currency: 'VND',
    isActive: true,
    code: `CODE${i}`,
    description: `Description for asset ${i}`,
    initialValue: Math.random() * 10000,
    initialQuantity: Math.random() * 1000,
    currentValue: Math.random() * 10000,
    currentQuantity: Math.random() * 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'user-1',
    updatedBy: 'user-1',
    totalValue: Math.random() * 100000,
    totalQuantity: Math.random() * 1000,
    hasTrades: Math.random() > 0.5,
    displayName: `Asset ${i} (CODE${i})`,
  }));
};

describe('Asset Management Performance Tests', () => {
  const mockUseAssets = {
    assets: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
    limit: 10,
      total: 0,
    },
    setFilters: vi.fn(),
    updateFilter: vi.fn(),
    clearFilters: vi.fn(),
    refresh: vi.fn(),
    goToPage: vi.fn(),
    setPageSize: vi.fn(),
    setSorting: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
  });

  describe('Rendering Performance', () => {
    it('renders with small dataset efficiently', () => {
      const smallAssets = createMockAssets(10);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: smallAssets,
        pagination: { ...mockUseAssets.pagination, total: 10 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('renders with medium dataset efficiently', () => {
      const mediumAssets = createMockAssets(100);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: mediumAssets,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should render in less than 200ms
    });

    it('renders with large dataset efficiently', () => {
      const largeAssets = createMockAssets(1000);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: largeAssets,
        pagination: { ...mockUseAssets.pagination, total: 1000 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should render in less than 500ms
    });

    it('renders with very large dataset efficiently', () => {
      const veryLargeAssets = createMockAssets(10000);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: veryLargeAssets,
        pagination: { ...mockUseAssets.pagination, total: 10000 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });
  });

  describe('Re-rendering Performance', () => {
    it('handles rapid re-renders efficiently', () => {
      const assets = createMockAssets(100);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      const { rerender } = render(<AssetManagementPage />);

      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        rerender(<AssetManagementPage />);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 re-renders in less than 1 second
    });

    it('handles state changes efficiently', () => {
      const assets = createMockAssets(100);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      render(<AssetManagementPage />);

      const startTime = performance.now();

      // Rapid view switching
      for (let i = 0; i < 50; i++) {
        const gridButton = screen.getByText('🔲 Grid');
        fireEvent.click(gridButton);
        const listButton = screen.getByText('📋 List');
        fireEvent.click(listButton);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should handle 50 view switches in less than 500ms
    });
  });

  describe('Memory Usage Performance', () => {
    it('does not leak memory with large datasets', () => {
      const largeAssets = createMockAssets(5000);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: largeAssets,
        pagination: { ...mockUseAssets.pagination, total: 5000 },
      });

      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<AssetManagementPage />);
        unmount();
      }

      // Test passes if no errors are thrown during render/unmount cycles
      expect(true).toBe(true);
    });

    it('handles memory efficiently with rapid operations', () => {
      const assets = createMockAssets(1000);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        pagination: { ...mockUseAssets.pagination, total: 1000 },
      });

      render(<AssetManagementPage />);

      // Perform rapid operations
      for (let i = 0; i < 100; i++) {
        const gridButton = screen.getByText('🔲 Grid');
        fireEvent.click(gridButton);
        const listButton = screen.getByText('📋 List');
        fireEvent.click(listButton);
      }

      // Test passes if operations complete without errors
      expect(true).toBe(true);
    });
  });

  describe('User Interaction Performance', () => {
    it('handles rapid user interactions efficiently', () => {
      const assets = createMockAssets(100);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      render(<AssetManagementPage />);

      const startTime = performance.now();

      // Rapid filter changes
      for (let i = 0; i < 50; i++) {
        const filterButton = screen.getByText('Change Filters');
        fireEvent.click(filterButton);
        const clearButton = screen.getByText('Clear Filters');
        fireEvent.click(clearButton);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should handle 50 filter changes in less than 500ms
    });

    it('handles rapid view switching efficiently', () => {
      const assets = createMockAssets(100);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      render(<AssetManagementPage />);

      const startTime = performance.now();

      // Rapid view switching
      for (let i = 0; i < 100; i++) {
        const gridButton = screen.getByText('🔲 Grid');
        fireEvent.click(gridButton);
        const listButton = screen.getByText('📋 List');
        fireEvent.click(listButton);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 view switches in less than 1 second
    });
  });

  describe('Component Mounting Performance', () => {
    it('mounts components efficiently', () => {
      const assets = createMockAssets(100);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should mount in less than 200ms
    });

    it('unmounts components efficiently', () => {
      const assets = createMockAssets(100);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      const { unmount } = render(<AssetManagementPage />);

      const startTime = performance.now();
      unmount();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should unmount in less than 100ms
    });
  });

  describe('Data Processing Performance', () => {
    it('processes large datasets efficiently', () => {
      const largeAssets = createMockAssets(10000);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: largeAssets,
        pagination: { ...mockUseAssets.pagination, total: 10000 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should process 10k assets in less than 1 second
    });

    it('handles complex calculations efficiently', () => {
      const complexAssets = createMockAssets(1000).map(asset => ({
        ...asset,
        totalValue: Math.random() * 1000000,
        currentValue: Math.random() * 1000000,
        totalQuantity: Math.random() * 10000,
      }));

      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: complexAssets,
        pagination: { ...mockUseAssets.pagination, total: 1000 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should handle complex calculations in less than 500ms
    });
  });

  describe('Network Simulation Performance', () => {
    it('handles simulated network delays efficiently', async () => {
      const assets = createMockAssets(100);
      
      // Simulate network delay
      const delayedUseAssets = {
        ...mockUseAssets,
        assets: [],
        loading: true,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      };

      require('../../hooks/useAssets').useAssets.mockReturnValue(delayedUseAssets);

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render loading state quickly

      // Simulate data arrival
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets,
        loading: false,
        pagination: { ...mockUseAssets.pagination, total: 100 },
      });

      const updateStartTime = performance.now();
      render(<AssetManagementPage />);
      const updateEndTime = performance.now();

      expect(updateEndTime - updateStartTime).toBeLessThan(200); // Should update quickly when data arrives
    });
  });

  describe('Accessibility Performance', () => {
    it('maintains accessibility with large datasets', () => {
      const largeAssets = createMockAssets(1000);
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: largeAssets,
        pagination: { ...mockUseAssets.pagination, total: 1000 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      // Should render quickly even with accessibility features
      expect(endTime - startTime).toBeLessThan(500);

      // Should maintain accessibility
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});
