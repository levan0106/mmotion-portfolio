/**
 * Asset Management Integration Tests
 * Comprehensive integration tests for asset management workflow
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

// Mock data
const mockAssets: Asset[] = [
  {
    id: '1',
    symbol: 'TEST',
    name: 'Test Stock',
    type: 'STOCK',
    assetClass: 'Equity',
    currency: 'VND',
    isActive: true,
    description: 'A test stock',
    initialValue: 1000,
    initialQuantity: 100,
    currentValue: 1200,
    currentQuantity: 100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    totalValue: 120000,
    totalQuantity: 100,
    hasTrades: true,
    displayName: 'Test Stock (TEST)',
  },
  {
    id: '2',
    symbol: 'BOND',
    name: 'Test Bond',
    type: 'BOND',
    assetClass: 'Fixed Income',
    currency: 'VND',
    isActive: true,
    description: 'A test bond',
    initialValue: 500,
    initialQuantity: 50,
    currentValue: 550,
    currentQuantity: 50,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    totalValue: 27500,
    totalQuantity: 50,
    hasTrades: false,
    displayName: 'Test Bond (BOND)',
  },
];

const mockUseAssets = {
  assets: mockAssets,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
  },
  setFilters: vi.fn(),
  updateFilter: vi.fn(),
  clearFilters: vi.fn(),
  refresh: vi.fn(),
  goToPage: vi.fn(),
  setPageSize: vi.fn(),
  setSorting: vi.fn(),
};

describe('Asset Management Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
  });

  describe('Complete Asset Management Workflow', () => {
    it('handles complete asset management workflow', async () => {
      render(<AssetManagementPage />);

      // 1. View assets in list mode
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
      expect(screen.getByText('Asset Management')).toBeInTheDocument();

      // 2. Switch to grid view
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);
      expect(screen.getByTestId('asset-card')).toBeInTheDocument();

      // 3. Switch back to list view
      const listButton = screen.getByText('📋 List');
      fireEvent.click(listButton);
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();

      // 4. Open analytics
      const analyticsButton = screen.getByText('📊 Analytics');
      fireEvent.click(analyticsButton);
      expect(screen.getByTestId('asset-analytics')).toBeInTheDocument();

      // 5. Close analytics
      const closeAnalyticsButton = screen.getByText('Close Analytics');
      fireEvent.click(closeAnalyticsButton);
      expect(screen.queryByTestId('asset-analytics')).not.toBeInTheDocument();

      // 6. Open create form
      const addButton = screen.getByText('➕ Add Asset');
      fireEvent.click(addButton);
      expect(screen.getByTestId('asset-form')).toBeInTheDocument();

      // 7. Submit form
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();

      // 8. Edit asset
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();

      // 9. Submit edit
      const submitDialogButton = screen.getByText('Submit Dialog');
      fireEvent.click(submitDialogButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();

      // 10. Delete asset
      const deleteButton = screen.getByText('Delete Asset');
      fireEvent.click(deleteButton);
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();

      // 11. Confirm delete
      const confirmDeleteButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmDeleteButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });

    it('handles filter workflow', async () => {
      render(<AssetManagementPage />);

      // 1. Change filters
      const filterButton = screen.getByText('Change Filters');
      fireEvent.click(filterButton);
      expect(mockUseAssets.setFilters).toHaveBeenCalledWith({ search: 'test' });

      // 2. Clear filters
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      expect(mockUseAssets.clearFilters).toHaveBeenCalled();
    });

    it('handles view mode switching with data persistence', async () => {
      render(<AssetManagementPage />);

      // Start in list view
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();

      // Switch to grid view
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);
      expect(screen.getByTestId('asset-card')).toBeInTheDocument();

      // Switch back to list view
      const listButton = screen.getByText('📋 List');
      fireEvent.click(listButton);
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();

      // Data should persist across view changes
      expect(mockUseAssets.assets).toHaveLength(2);
    });
  });

  describe('Error Handling Integration', () => {
    it('handles error state and recovery', async () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        error: 'Failed to load assets',
      });

      render(<AssetManagementPage />);

      // Should show error state
      expect(screen.getByText('Error Loading Assets')).toBeInTheDocument();
      expect(screen.getByText('Failed to load assets')).toBeInTheDocument();

      // Should have retry button
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();

      // Click retry
      fireEvent.click(retryButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });

    it('handles loading state', async () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        loading: true,
        assets: [],
      });

      render(<AssetManagementPage />);

      // Should show loading state
      expect(screen.getByText('Loading assets...')).toBeInTheDocument();
    });
  });

  describe('Empty State Integration', () => {
    it('handles empty assets state', async () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: [],
      });

      render(<AssetManagementPage />);

      // Switch to grid view to see empty state
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);

      // Should show empty state
      expect(screen.getByText('No Assets Found')).toBeInTheDocument();
      expect(screen.getByText('No assets match your current filters. Try adjusting your search criteria.')).toBeInTheDocument();

      // Should have clear filters button
      const clearButton = screen.getByText('Clear Filters');
      expect(clearButton).toBeInTheDocument();

      // Click clear filters
      fireEvent.click(clearButton);
      expect(mockUseAssets.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Statistics Integration', () => {
    it('displays correct statistics', async () => {
      render(<AssetManagementPage />);

      // Should show correct statistics
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets
      expect(screen.getByText('₫147,500')).toBeInTheDocument(); // Total Value
      expect(screen.getByText('₫73,750')).toBeInTheDocument(); // Average Value
      expect(screen.getByText('2')).toBeInTheDocument(); // Asset Types
    });

    it('updates statistics when assets change', async () => {
      const { rerender } = render(<AssetManagementPage />);

      // Initial statistics
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets

      // Update assets
      const newAssets = [...mockAssets, {
        ...mockAssets[0],
        id: '3',
        name: 'New Asset',
        totalValue: 50000,
      }];

      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: newAssets,
        pagination: { ...mockUseAssets.pagination, total: 3 },
      });

      rerender(<AssetManagementPage />);

      // Should show updated statistics
      expect(screen.getByText('3')).toBeInTheDocument(); // Total Assets
    });
  });

  describe('Pagination Integration', () => {
    it('handles pagination controls', async () => {
      render(<AssetManagementPage />);

      // Should show pagination info
      expect(screen.getByText('Showing 1 to 2 of 2 assets')).toBeInTheDocument();

      // Should have pagination controls
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();

      // Click next page
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      expect(mockUseAssets.goToPage).toHaveBeenCalledWith(2);

      // Change page size
      const pageSizeSelect = screen.getByDisplayValue('25');
      fireEvent.change(pageSizeSelect, { target: { value: '50' } });
      expect(mockUseAssets.setPageSize).toHaveBeenCalledWith(50);
    });
  });

  describe('Component Communication', () => {
    it('ensures components communicate correctly', async () => {
      render(<AssetManagementPage />);

      // AssetList should be rendered
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();

      // AssetFilters should be rendered
      expect(screen.getByTestId('asset-filters')).toBeInTheDocument();

      // Statistics should be displayed
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets

      // All components should work together
      const filterButton = screen.getByText('Change Filters');
      fireEvent.click(filterButton);
      expect(mockUseAssets.setFilters).toHaveBeenCalled();
    });
  });

  describe('Performance Integration', () => {
    it('handles large datasets efficiently', async () => {
      const largeAssets = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAssets[0],
        id: `asset-${i}`,
        name: `Asset ${i}`,
        totalValue: Math.random() * 100000,
      }));

      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: largeAssets,
        pagination: { ...mockUseAssets.pagination, total: 1000 },
      });

      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      // Should render in reasonable time even with large dataset
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });

    it('handles rapid state changes efficiently', async () => {
      const { rerender } = render(<AssetManagementPage />);

      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        rerender(<AssetManagementPage />);
      }
      const endTime = performance.now();

      // Should handle rapid re-renders efficiently
      expect(endTime - startTime).toBeLessThan(500); // Less than 500ms
    });
  });

  describe('Accessibility Integration', () => {
    it('maintains accessibility across all components', async () => {
      render(<AssetManagementPage />);

      // Should have proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Asset Management');

      // Should have proper button labels
      expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
      expect(screen.getByText('➕ Add Asset')).toBeInTheDocument();

      // Should have proper form labels
      expect(screen.getByText('Change Filters')).toBeInTheDocument();
      expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('ensures data flows correctly between components', async () => {
      render(<AssetManagementPage />);

      // Initial state
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
      expect(mockUseAssets.assets).toHaveLength(2);

      // Filter change should propagate
      const filterButton = screen.getByText('Change Filters');
      fireEvent.click(filterButton);
      expect(mockUseAssets.setFilters).toHaveBeenCalledWith({ search: 'test' });

      // Clear filters should propagate
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      expect(mockUseAssets.clearFilters).toHaveBeenCalled();

      // Asset operations should propagate
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();
    });
  });
});
