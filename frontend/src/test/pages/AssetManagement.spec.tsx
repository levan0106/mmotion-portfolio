/**
 * Asset Management Page Tests
 * Comprehensive unit tests for AssetManagementPage component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetManagementPage } from '../../pages/AssetManagement';
import { Asset } from '../../types/asset.types';
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
      <button onClick={() => onSubmit?.({ id: '1', name: 'New Asset' })}>
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

describe('AssetManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
  });

  describe('Rendering', () => {
    it('renders page title and description', () => {
      render(<AssetManagementPage />);

      expect(screen.getByText('Asset Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your portfolio assets')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <AssetManagementPage className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('asset-management', 'custom-class');
    });

    it('renders with portfolioId prop', () => {
      render(<AssetManagementPage portfolioId="portfolio-1" />);

      expect(screen.getByText('Asset Management')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('displays correct statistics', () => {
      render(<AssetManagementPage />);

      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets
      expect(screen.getByText('₫147,500')).toBeInTheDocument(); // Total Value
      expect(screen.getByText('₫73,750')).toBeInTheDocument(); // Average Value
      expect(screen.getByText('2')).toBeInTheDocument(); // Asset Types
    });

    it('calculates statistics correctly with empty assets', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: [],
      });

      render(<AssetManagementPage />);

      expect(screen.getByText('0')).toBeInTheDocument(); // Total Assets
      expect(screen.getByText('₫0')).toBeInTheDocument(); // Total Value
      expect(screen.getByText('₫0')).toBeInTheDocument(); // Average Value
      expect(screen.getByText('0')).toBeInTheDocument(); // Asset Types
    });
  });

  describe('View Mode Toggle', () => {
    it('starts in list view mode', () => {
      render(<AssetManagementPage />);

      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
      expect(screen.queryByTestId('asset-card')).not.toBeInTheDocument();
    });

    it('switches to grid view mode when toggle button is clicked', () => {
      render(<AssetManagementPage />);

      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);

      expect(screen.getByTestId('asset-card')).toBeInTheDocument();
      expect(screen.queryByTestId('asset-list')).not.toBeInTheDocument();
    });

    it('switches back to list view mode when toggle button is clicked again', () => {
      render(<AssetManagementPage />);

      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);

      const listButton = screen.getByText('📋 List');
      fireEvent.click(listButton);

      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
      expect(screen.queryByTestId('asset-card')).not.toBeInTheDocument();
    });
  });

  describe('Analytics Toggle', () => {
    it('hides analytics by default', () => {
      render(<AssetManagementPage />);

      expect(screen.queryByTestId('asset-analytics')).not.toBeInTheDocument();
    });

    it('shows analytics when toggle button is clicked', () => {
      render(<AssetManagementPage />);

      const analyticsButton = screen.getByText('📊 Analytics');
      fireEvent.click(analyticsButton);

      expect(screen.getByTestId('asset-analytics')).toBeInTheDocument();
    });

    it('hides analytics when toggle button is clicked again', () => {
      render(<AssetManagementPage />);

      const analyticsButton = screen.getByText('📊 Analytics');
      fireEvent.click(analyticsButton);
      fireEvent.click(analyticsButton);

      expect(screen.queryByTestId('asset-analytics')).not.toBeInTheDocument();
    });
  });

  describe('Create Form Toggle', () => {
    it('hides create form by default', () => {
      render(<AssetManagementPage />);

      expect(screen.queryByTestId('asset-form')).not.toBeInTheDocument();
    });

    it('shows create form when add button is clicked', () => {
      render(<AssetManagementPage />);

      const addButton = screen.getByText('➕ Add Asset');
      fireEvent.click(addButton);

      expect(screen.getByTestId('asset-form')).toBeInTheDocument();
    });
  });

  describe('Asset Interactions', () => {
    it('handles asset selection', () => {
      render(<AssetManagementPage />);

      const selectButton = screen.getByText('Select Asset');
      fireEvent.click(selectButton);

      // Asset selection should not show any dialog by default
      expect(screen.queryByTestId('asset-dialogs')).not.toBeInTheDocument();
    });

    it('handles asset edit', () => {
      render(<AssetManagementPage />);

      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);

      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();
    });

    it('handles asset delete', () => {
      render(<AssetManagementPage />);

      const deleteButton = screen.getByText('Delete Asset');
      fireEvent.click(deleteButton);

      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();
    });
  });

  describe('Filter Interactions', () => {
    it('handles filter changes', () => {
      render(<AssetManagementPage />);

      const filterButton = screen.getByText('Change Filters');
      fireEvent.click(filterButton);

      // Filter change should trigger the useAssets hook
      expect(mockUseAssets.setFilters).toHaveBeenCalled();
    });

    it('handles clear filters', () => {
      render(<AssetManagementPage />);

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      expect(mockUseAssets.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Dialog Interactions', () => {
    it('closes dialogs when close button is clicked', () => {
      render(<AssetManagementPage />);

      // Open a dialog first
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);

      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();

      // Close the dialog
      const closeButton = screen.getByText('Close Dialog');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('asset-dialogs')).not.toBeInTheDocument();
    });

    it('handles form submission', () => {
      render(<AssetManagementPage />);

      // Open create form
      const addButton = screen.getByText('➕ Add Asset');
      fireEvent.click(addButton);

      // Submit form
      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });

    it('handles delete confirmation', () => {
      render(<AssetManagementPage />);

      // Open delete dialog
      const deleteButton = screen.getByText('Delete Asset');
      fireEvent.click(deleteButton);

      // Confirm delete
      const confirmButton = screen.getByText('Confirm Delete');
      fireEvent.click(confirmButton);

      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when loading and no assets', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        loading: true,
        assets: [],
      });

      render(<AssetManagementPage />);

      expect(screen.getByText('Loading assets...')).toBeInTheDocument();
    });

    it('does not show loading state when assets are present', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        loading: true,
        assets: mockAssets,
      });

      render(<AssetManagementPage />);

      expect(screen.queryByText('Loading assets...')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error state when error occurs', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        error: 'Failed to load assets',
      });

      render(<AssetManagementPage />);

      expect(screen.getByText('Error Loading Assets')).toBeInTheDocument();
      expect(screen.getByText('Failed to load assets')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('handles retry button click', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        error: 'Failed to load assets',
      });

      render(<AssetManagementPage />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockUseAssets.refresh).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no assets match filters', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: [],
      });

      render(<AssetManagementPage />);

      // Switch to grid view to see empty state
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);

      expect(screen.getByText('No Assets Found')).toBeInTheDocument();
      expect(screen.getByText('No assets match your current filters. Try adjusting your search criteria.')).toBeInTheDocument();
    });

    it('handles clear filters from empty state', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        assets: [],
      });

      render(<AssetManagementPage />);

      // Switch to grid view to see empty state
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      expect(mockUseAssets.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('shows pagination when total is greater than 0', () => {
      render(<AssetManagementPage />);

      expect(screen.getByText('Showing 1 to 2 of 2 assets')).toBeInTheDocument();
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('handles page navigation', () => {
      render(<AssetManagementPage />);

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockUseAssets.goToPage).toHaveBeenCalledWith(2);
    });

    it('handles page size change', () => {
      render(<AssetManagementPage />);

      const pageSizeSelect = screen.getByDisplayValue('25');
      fireEvent.change(pageSizeSelect, { target: { value: '50' } });

      expect(mockUseAssets.setPageSize).toHaveBeenCalledWith(50);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<AssetManagementPage />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Asset Management');
    });

    it('has proper button labels', () => {
      render(<AssetManagementPage />);

      expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
      expect(screen.getByText('➕ Add Asset')).toBeInTheDocument();
      expect(screen.getByText('📋 List')).toBeInTheDocument();
      expect(screen.getByText('🔲 Grid')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders without performance issues', () => {
      const startTime = performance.now();
      render(<AssetManagementPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('handles rapid state changes efficiently', () => {
      const { rerender } = render(<AssetManagementPage />);

      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        rerender(<AssetManagementPage />);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should handle 50 re-renders in less than 500ms
    });
  });
});
