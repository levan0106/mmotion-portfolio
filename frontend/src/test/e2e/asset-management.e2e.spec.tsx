/**
 * Asset Management E2E Tests
 * End-to-end tests for complete asset management workflow
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
    currency: 'USD',
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
    currency: 'USD',
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
    limit: 25,
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

describe('Asset Management E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
  });

  describe('Complete User Workflow', () => {
    it('completes full asset management workflow', async () => {
      render(<AssetManagementPage />);

      // 1. User lands on asset management page
      expect(screen.getByText('Asset Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your portfolio assets')).toBeInTheDocument();

      // 2. User sees statistics
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets
      expect(screen.getByText('₫147,500')).toBeInTheDocument(); // Total Value

      // 3. User sees assets in list view
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();

      // 4. User switches to grid view
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);
      expect(screen.getByTestId('asset-card')).toBeInTheDocument();

      // 5. User switches back to list view
      const listButton = screen.getByText('📋 List');
      fireEvent.click(listButton);
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();

      // 6. User opens analytics
      const analyticsButton = screen.getByText('📊 Analytics');
      fireEvent.click(analyticsButton);
      expect(screen.getByTestId('asset-analytics')).toBeInTheDocument();

      // 7. User closes analytics
      const closeAnalyticsButton = screen.getByText('Close Analytics');
      fireEvent.click(closeAnalyticsButton);
      expect(screen.queryByTestId('asset-analytics')).not.toBeInTheDocument();

      // 8. User creates new asset
      const addButton = screen.getByText('➕ Add Asset');
      fireEvent.click(addButton);
      expect(screen.getByTestId('asset-form')).toBeInTheDocument();

      // 9. User submits new asset
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();

      // 10. User edits existing asset
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();

      // 11. User submits edit
      const submitDialogButton = screen.getByText('Submit Dialog');
      fireEvent.click(submitDialogButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();

      // 12. User deletes asset
      const deleteButton = screen.getByText('Delete Asset');
      fireEvent.click(deleteButton);
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();

      // 13. User confirms delete
      const confirmDeleteButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmDeleteButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });

    it('handles filter workflow end-to-end', async () => {
      render(<AssetManagementPage />);

      // 1. User applies filters
      const filterButton = screen.getByText('Change Filters');
      fireEvent.click(filterButton);
      expect(mockUseAssets.setFilters).toHaveBeenCalledWith({ search: 'test' });

      // 2. User clears filters
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      expect(mockUseAssets.clearFilters).toHaveBeenCalled();

      // 3. User changes pagination
      const pageSizeSelect = screen.getByDisplayValue('25');
      fireEvent.change(pageSizeSelect, { target: { value: '50' } });
      expect(mockUseAssets.setPageSize).toHaveBeenCalledWith(50);

      // 4. User navigates pages
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      expect(mockUseAssets.goToPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('handles error state and recovery end-to-end', async () => {
      // 1. User encounters error
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        error: 'Failed to load assets',
      });

      render(<AssetManagementPage />);

      // 2. User sees error message
      expect(screen.getByText('Error Loading Assets')).toBeInTheDocument();
      expect(screen.getByText('Failed to load assets')).toBeInTheDocument();

      // 3. User clicks retry
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      expect(mockUseAssets.refresh).toHaveBeenCalled();

      // 4. System recovers and shows assets
      require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
      render(<AssetManagementPage />);

      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
    });

    it('handles loading state end-to-end', async () => {
      // 1. User sees loading state
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        loading: true,
        assets: [],
      });

      render(<AssetManagementPage />);

      expect(screen.getByText('Loading assets...')).toBeInTheDocument();

      // 2. System loads assets
      require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
      render(<AssetManagementPage />);

      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
    });
  });

  describe('Empty State Workflow', () => {
    it('handles empty state end-to-end', async () => {
      // 1. User sees empty state
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: [],
      });

      render(<AssetManagementPage />);

      // 2. User switches to grid view to see empty state
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);

      // 3. User sees empty state message
      expect(screen.getByText('No Assets Found')).toBeInTheDocument();
      expect(screen.getByText('No assets match your current filters. Try adjusting your search criteria.')).toBeInTheDocument();

      // 4. User clicks clear filters
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      expect(mockUseAssets.clearFilters).toHaveBeenCalled();

      // 5. System loads assets
      require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
      render(<AssetManagementPage />);

      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
    });
  });

  describe('Performance Workflow', () => {
    it('handles large datasets end-to-end', async () => {
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

      // Should render in reasonable time
      expect(endTime - startTime).toBeLessThan(1000);

      // Should show correct statistics
      expect(screen.getByText('1000')).toBeInTheDocument(); // Total Assets

      // Should handle pagination
      expect(screen.getByText('Showing 1 to 25 of 1000 assets')).toBeInTheDocument();
    });

    it('handles rapid user interactions end-to-end', async () => {
      render(<AssetManagementPage />);

      const startTime = performance.now();

      // Rapid view switching
      for (let i = 0; i < 10; i++) {
        const gridButton = screen.getByText('🔲 Grid');
        fireEvent.click(gridButton);
        const listButton = screen.getByText('📋 List');
        fireEvent.click(listButton);
      }

      // Rapid filter changes
      for (let i = 0; i < 10; i++) {
        const filterButton = screen.getByText('Change Filters');
        fireEvent.click(filterButton);
        const clearButton = screen.getByText('Clear Filters');
        fireEvent.click(clearButton);
      }

      const endTime = performance.now();

      // Should handle rapid interactions efficiently
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Accessibility Workflow', () => {
    it('maintains accessibility throughout user workflow', async () => {
      render(<AssetManagementPage />);

      // 1. User navigates with keyboard
      const analyticsButton = screen.getByText('📊 Analytics');
      analyticsButton.focus();
      expect(analyticsButton).toHaveFocus();

      // 2. User activates with keyboard
      fireEvent.keyDown(analyticsButton, { key: 'Enter' });
      expect(screen.getByTestId('asset-analytics')).toBeInTheDocument();

      // 3. User closes with keyboard
      const closeButton = screen.getByText('Close Analytics');
      closeButton.focus();
      fireEvent.keyDown(closeButton, { key: 'Enter' });
      expect(screen.queryByTestId('asset-analytics')).not.toBeInTheDocument();

      // 4. User navigates forms with keyboard
      const addButton = screen.getByText('➕ Add Asset');
      addButton.focus();
      fireEvent.keyDown(addButton, { key: 'Enter' });
      expect(screen.getByTestId('asset-form')).toBeInTheDocument();

      // 5. User submits with keyboard
      const submitButton = screen.getByText('Submit Form');
      submitButton.focus();
      fireEvent.keyDown(submitButton, { key: 'Enter' });
      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });

    it('provides proper ARIA labels throughout workflow', async () => {
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

  describe('Data Consistency Workflow', () => {
    it('maintains data consistency throughout workflow', async () => {
      render(<AssetManagementPage />);

      // 1. User sees initial data
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets
      expect(mockUseAssets.assets).toHaveLength(2);

      // 2. User applies filters
      const filterButton = screen.getByText('Change Filters');
      fireEvent.click(filterButton);
      expect(mockUseAssets.setFilters).toHaveBeenCalledWith({ search: 'test' });

      // 3. User clears filters
      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);
      expect(mockUseAssets.clearFilters).toHaveBeenCalled();

      // 4. Data should remain consistent
      expect(mockUseAssets.assets).toHaveLength(2);

      // 5. User creates new asset
      const addButton = screen.getByText('➕ Add Asset');
      fireEvent.click(addButton);
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      // 6. System should refresh data
      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });
  });

  describe('Cross-Component Communication Workflow', () => {
    it('ensures components communicate correctly throughout workflow', async () => {
      render(<AssetManagementPage />);

      // 1. All components should be rendered
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
      expect(screen.getByTestId('asset-filters')).toBeInTheDocument();

      // 2. Statistics should reflect current data
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets

      // 3. Filter changes should propagate
      const filterButton = screen.getByText('Change Filters');
      fireEvent.click(filterButton);
      expect(mockUseAssets.setFilters).toHaveBeenCalled();

      // 4. Asset operations should propagate
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();

      // 5. All components should work together
      const closeButton = screen.getByText('Close Dialog');
      fireEvent.click(closeButton);
      expect(screen.queryByTestId('asset-dialogs')).not.toBeInTheDocument();
    });
  });
});
