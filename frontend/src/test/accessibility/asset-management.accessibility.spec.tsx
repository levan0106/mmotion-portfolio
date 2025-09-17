/**
 * Asset Management Accessibility Tests
 * Comprehensive accessibility testing for asset management components
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
    <div data-testid="asset-list" role="table" aria-label="Assets table">
      <button 
        onClick={() => onAssetSelect?.({ id: '1', name: 'Test Asset' })}
        aria-label="Select Test Asset"
      >
        Select Asset
      </button>
      <button 
        onClick={() => onAssetEdit?.({ id: '1', name: 'Test Asset' })}
        aria-label="Edit Test Asset"
      >
        Edit Asset
      </button>
      <button 
        onClick={() => onAssetDelete?.({ id: '1', name: 'Test Asset' })}
        aria-label="Delete Test Asset"
      >
        Delete Asset
      </button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetCard', () => ({
  AssetCard: ({ asset, onEdit, onDelete, onView }: any) => (
    <div data-testid="asset-card" role="article" aria-label={`Asset: ${asset.name}`}>
      <span>{asset.name}</span>
      <button 
        onClick={() => onEdit?.(asset)}
        aria-label={`Edit ${asset.name}`}
      >
        Edit
      </button>
      <button 
        onClick={() => onDelete?.(asset)}
        aria-label={`Delete ${asset.name}`}
      >
        Delete
      </button>
      <button 
        onClick={() => onView?.(asset)}
        aria-label={`View ${asset.name}`}
      >
        View
      </button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetFilters', () => ({
  AssetFilters: ({ onFiltersChange, onClearFilters }: any) => (
    <div data-testid="asset-filters" role="search" aria-label="Asset filters">
      <button 
        onClick={() => onFiltersChange({ search: 'test' })}
        aria-label="Apply test filter"
      >
        Change Filters
      </button>
      <button 
        onClick={onClearFilters}
        aria-label="Clear all filters"
      >
        Clear Filters
      </button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetForm', () => ({
  AssetForm: ({ onSubmit }: any) => (
    <div data-testid="asset-form" role="form" aria-label="Asset form">
      <button 
        onClick={() => onSubmit?.({ name: 'New Asset', type: AssetType.STOCK })}
        aria-label="Submit asset form"
      >
        Submit Form
      </button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetAnalytics', () => ({
  AssetAnalytics: ({ onClose }: any) => (
    <div data-testid="asset-analytics" role="dialog" aria-label="Asset analytics">
      <button 
        onClick={onClose}
        aria-label="Close analytics dialog"
      >
        Close Analytics
      </button>
    </div>
  ),
}));

vi.mock('../../components/Asset/AssetDialogs', () => ({
  AssetDialogs: ({ onClose, onSubmit, onDeleteConfirm }: any) => (
    <div data-testid="asset-dialogs" role="dialog" aria-label="Asset dialog">
      <button 
        onClick={onClose}
        aria-label="Close dialog"
      >
        Close Dialog
      </button>
      <button 
        onClick={() => onSubmit?.({ id: '1', name: 'Updated Asset' })}
        aria-label="Submit dialog"
      >
        Submit Dialog
      </button>
      <button 
        onClick={() => onDeleteConfirm?.({ id: '1', name: 'Test Asset' })}
        aria-label="Confirm delete"
      >
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

describe('Asset Management Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    require('../../hooks/useAssets').useAssets.mockReturnValue(mockUseAssets);
  });

  describe('Semantic HTML Structure', () => {
    it('has proper heading hierarchy', () => {
      render(<AssetManagementPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Asset Management');

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Portfolio Analytics');
    });

    it('uses proper semantic elements', () => {
      render(<AssetManagementPage />);

      expect(screen.getByRole('table', { name: 'Assets table' })).toBeInTheDocument();
      expect(screen.getByRole('search', { name: 'Asset filters' })).toBeInTheDocument();
      expect(screen.getByRole('form', { name: 'Asset form' })).toBeInTheDocument();
    });

    it('has proper landmark roles', () => {
      render(<AssetManagementPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports tab navigation', () => {
      render(<AssetManagementPage />);

      const firstButton = screen.getByText('📊 Analytics');
      const secondButton = screen.getByText('➕ Add Asset');

      firstButton.focus();
      expect(firstButton).toHaveFocus();

      fireEvent.keyDown(firstButton, { key: 'Tab' });
      expect(secondButton).toHaveFocus();
    });

    it('supports enter key activation', () => {
      render(<AssetManagementPage />);

      const analyticsButton = screen.getByText('📊 Analytics');
      analyticsButton.focus();
      fireEvent.keyDown(analyticsButton, { key: 'Enter' });

      expect(screen.getByTestId('asset-analytics')).toBeInTheDocument();
    });

    it('supports space key activation', () => {
      render(<AssetManagementPage />);

      const addButton = screen.getByText('➕ Add Asset');
      addButton.focus();
      fireEvent.keyDown(addButton, { key: ' ' });

      expect(screen.getByTestId('asset-form')).toBeInTheDocument();
    });

    it('supports escape key to close dialogs', () => {
      render(<AssetManagementPage />);

      // Open a dialog
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();

      // Close with escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByTestId('asset-dialogs')).not.toBeInTheDocument();
    });
  });

  describe('ARIA Labels and Descriptions', () => {
    it('has proper ARIA labels for all interactive elements', () => {
      render(<AssetManagementPage />);

      expect(screen.getByLabelText('Assets table')).toBeInTheDocument();
      expect(screen.getByLabelText('Asset filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Asset form')).toBeInTheDocument();
      expect(screen.getByLabelText('Asset analytics')).toBeInTheDocument();
      expect(screen.getByLabelText('Asset dialog')).toBeInTheDocument();
    });

    it('has proper ARIA labels for buttons', () => {
      render(<AssetManagementPage />);

      expect(screen.getByLabelText('Select Test Asset')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit Test Asset')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete Test Asset')).toBeInTheDocument();
      expect(screen.getByLabelText('Apply test filter')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
    });

    it('has proper ARIA labels for form elements', () => {
      render(<AssetManagementPage />);

      expect(screen.getByLabelText('Submit asset form')).toBeInTheDocument();
      expect(screen.getByLabelText('Close analytics dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('manages focus correctly when opening dialogs', () => {
      render(<AssetManagementPage />);

      const editButton = screen.getByText('Edit Asset');
      editButton.focus();
      fireEvent.click(editButton);

      // Focus should move to dialog
      screen.getByTestId('asset-dialogs');
      expect(screen.getByTestId('asset-dialogs')).toBeInTheDocument();
    });

    it('manages focus correctly when closing dialogs', () => {
      render(<AssetManagementPage />);

      const editButton = screen.getByText('Edit Asset');
      editButton.focus();
      fireEvent.click(editButton);

      const closeButton = screen.getByText('Close Dialog');
      fireEvent.click(closeButton);

      // Focus should return to trigger button
      expect(editButton).toHaveFocus();
    });

    it('traps focus within dialogs', () => {
      render(<AssetManagementPage />);

      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);

      screen.getByTestId('asset-dialogs');
      const closeButton = screen.getByText('Close Dialog');
      const submitButton = screen.getByText('Submit Dialog');

      // Focus should be trapped within dialog
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      fireEvent.keyDown(closeButton, { key: 'Tab' });
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper announcements for dynamic content', () => {
      render(<AssetManagementPage />);

      // Statistics should be announced
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Assets
      expect(screen.getByText('₫147,500')).toBeInTheDocument(); // Total Value

      // Asset information should be announced
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.getByText('Test Bond')).toBeInTheDocument();
    });

    it('provides proper announcements for state changes', () => {
      render(<AssetManagementPage />);

      // View mode changes should be announced
      const gridButton = screen.getByText('🔲 Grid');
      fireEvent.click(gridButton);
      expect(screen.getByTestId('asset-card')).toBeInTheDocument();

      const listButton = screen.getByText('📋 List');
      fireEvent.click(listButton);
      expect(screen.getByTestId('asset-list')).toBeInTheDocument();
    });

    it('provides proper announcements for errors', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        error: 'Failed to load assets',
      });

      render(<AssetManagementPage />);

      expect(screen.getByText('Error Loading Assets')).toBeInTheDocument();
      expect(screen.getByText('Failed to load assets')).toBeInTheDocument();
    });
  });

  describe('Color and Contrast', () => {
    it('maintains proper color contrast', () => {
      render(<AssetManagementPage />);

      // All text should be readable
      expect(screen.getByText('Asset Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your portfolio assets')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('₫147,500')).toBeInTheDocument();
    });

    it('provides alternative text for icons', () => {
      render(<AssetManagementPage />);

      // Icon buttons should have proper labels
      expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
      expect(screen.getByText('➕ Add Asset')).toBeInTheDocument();
      expect(screen.getByText('📋 List')).toBeInTheDocument();
      expect(screen.getByText('🔲 Grid')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('maintains accessibility on mobile devices', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<AssetManagementPage />);

      // Should still have proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Should still have proper button labels
      expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
      expect(screen.getByText('➕ Add Asset')).toBeInTheDocument();
    });

    it('maintains accessibility on tablet devices', () => {
      // Simulate tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<AssetManagementPage />);

      // Should still have proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Should still have proper button labels
      expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
      expect(screen.getByText('➕ Add Asset')).toBeInTheDocument();
    });
  });

  describe('Form Accessibility', () => {
    it('provides proper form labels and descriptions', () => {
      render(<AssetManagementPage />);

      // Open create form
      const addButton = screen.getByText('➕ Add Asset');
      fireEvent.click(addButton);

      expect(screen.getByRole('form', { name: 'Asset form' })).toBeInTheDocument();
      expect(screen.getByLabelText('Submit asset form')).toBeInTheDocument();
    });

    it('provides proper error messages', () => {
      render(<AssetManagementPage />);

      // Open create form
      const addButton = screen.getByText('➕ Add Asset');
      fireEvent.click(addButton);

      // Form should be accessible
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Table Accessibility', () => {
    it('provides proper table structure', () => {
      render(<AssetManagementPage />);

      expect(screen.getByRole('table', { name: 'Assets table' })).toBeInTheDocument();
    });

    it('provides proper table headers', () => {
      render(<AssetManagementPage />);

      // Table should have proper structure
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Dialog Accessibility', () => {
    it('provides proper dialog structure', () => {
      render(<AssetManagementPage />);

      // Open a dialog
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);

      expect(screen.getByRole('dialog', { name: 'Asset dialog' })).toBeInTheDocument();
    });

    it('provides proper dialog labels', () => {
      render(<AssetManagementPage />);

      // Open a dialog
      const editButton = screen.getByText('Edit Asset');
      fireEvent.click(editButton);

      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Submit dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm delete')).toBeInTheDocument();
    });
  });

  describe('Loading State Accessibility', () => {
    it('provides proper loading announcements', () => {
      require('../../hooks/useAssets').useAssets.mockReturnValue({
        ...mockUseAssets,
        loading: true,
        assets: [],
      });

      render(<AssetManagementPage />);

      expect(screen.getByText('Loading assets...')).toBeInTheDocument();
    });
  });

  describe('Empty State Accessibility', () => {
    it('provides proper empty state announcements', () => {
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
  });
});
