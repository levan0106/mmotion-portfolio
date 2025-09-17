/**
 * Asset Dialogs Component Tests
 * Comprehensive unit tests for AssetDialogs component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetDialogs } from '../../components/Asset/AssetDialogs';
import { Asset, AssetType } from '../../types/asset.types';
import { vi } from 'vitest';

// Mock the AssetForm component
vi.mock('../../components/Asset/AssetForm', () => ({
  AssetForm: ({ onSubmit, isSubmitting, mode }: any) => (
    <div data-testid="asset-form">
      <span>Mode: {mode}</span>
      <span>Submitting: {isSubmitting ? 'true' : 'false'}</span>
      <button onClick={() => onSubmit?.({ name: 'Test Asset', type: AssetType.STOCK })}>
        Submit Form
      </button>
    </div>
  ),
}));

// Mock data
const mockAsset: Asset = {
  id: '1',
  symbol: 'TEST',
  name: 'Test Stock',
  type: 'STOCK',
  assetClass: 'Equity',
  currency: 'USD',
  isActive: true,
  description: 'A test stock for unit testing',
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
};

const mockAssetWithoutCode: Asset = {
  ...mockAsset,
  symbol: '',
  displayName: 'Test Stock',
};

const mockAssetWithoutDescription: Asset = {
  ...mockAsset,
  description: undefined,
};

const mockAssetWithoutTrades: Asset = {
  ...mockAsset,
  hasTrades: false,
};

describe('AssetDialogs', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnDeleteConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when no dialogs are open', () => {
      const { container } = render(
        <AssetDialogs
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('asset-dialogs', 'custom-class');
    });
  });

  describe('View Asset Dialog', () => {
    it('renders view dialog when selectedAsset is provided', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Asset Details')).toBeInTheDocument();
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.getByText('TEST')).toBeInTheDocument();
      expect(screen.getByText('A test stock for unit testing')).toBeInTheDocument();
    });

    it('renders without code when not provided', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAssetWithoutCode}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.queryByText('TEST')).not.toBeInTheDocument();
    });

    it('renders without description when not provided', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAssetWithoutDescription}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.queryByText('A test stock for unit testing')).not.toBeInTheDocument();
    });

    it('displays asset information correctly', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('₫120,000')).toBeInTheDocument(); // Total Value
      expect(screen.getByText('100')).toBeInTheDocument(); // Total Quantity
      expect(screen.getByText('₫1,000')).toBeInTheDocument(); // Initial Value
      expect(screen.getByText('₫1,200')).toBeInTheDocument(); // Current Value
    });

    it('displays performance information correctly', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('₫20,000')).toBeInTheDocument(); // Value Change
      expect(screen.getByText('+20.00%')).toBeInTheDocument(); // Percentage Change
    });

    it('displays metadata correctly', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Metadata')).toBeInTheDocument();
      expect(screen.getByText('1/1/2024, 12:00:00 AM')).toBeInTheDocument(); // Created
      expect(screen.getByText('1/2/2024, 12:00:00 AM')).toBeInTheDocument(); // Updated
      expect(screen.getByText('Yes')).toBeInTheDocument(); // Has Trades
    });

    it('closes dialog when close button is clicked', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const closeButton = screen.getByTitle('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes dialog when backdrop is clicked', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const backdrop = screen.getByRole('generic', { hidden: true });
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Edit Asset Dialog', () => {
    it('renders edit dialog when editingAsset is provided', () => {
      render(
        <AssetDialogs
          editingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Edit Asset')).toBeInTheDocument();
      expect(screen.getByTestId('asset-form')).toBeInTheDocument();
      expect(screen.getByText('Mode: edit')).toBeInTheDocument();
    });

    it('passes correct props to AssetForm', () => {
      render(
        <AssetDialogs
          editingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Mode: edit')).toBeInTheDocument();
      expect(screen.getByText('Submitting: false')).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      render(
        <AssetDialogs
          editingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'Test Asset',
            type: AssetType.STOCK,
          })
        );
      });
    });
  });

  describe('Create Asset Dialog', () => {
    it('renders create dialog when showCreateForm is true', () => {
      render(
        <AssetDialogs
          showCreateForm={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Create New Asset')).toBeInTheDocument();
      expect(screen.getByTestId('asset-form')).toBeInTheDocument();
      expect(screen.getByText('Mode: create')).toBeInTheDocument();
    });

    it('passes portfolioId to AssetForm', () => {
      render(
        <AssetDialogs
          showCreateForm={true}
          portfolioId="portfolio-123"
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Mode: create')).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      render(
        <AssetDialogs
          showCreateForm={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Asset',
            type: AssetType.STOCK,
          })
        );
      });
    });
  });

  describe('Delete Confirmation Dialog', () => {
    it('renders delete dialog when deletingAsset is provided', () => {
      render(
        <AssetDialogs
          deletingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Delete Asset')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this asset?')).toBeInTheDocument();
    });

    it('displays asset summary correctly', () => {
      render(
        <AssetDialogs
          deletingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.getByText('(TEST)')).toBeInTheDocument();
      expect(screen.getByText('Total Value: ₫120,000')).toBeInTheDocument();
    });

    it('shows warning when asset has trades', () => {
      render(
        <AssetDialogs
          deletingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Warning: This asset has trading activity. Deleting it may affect your portfolio calculations.')).toBeInTheDocument();
    });

    it('does not show warning when asset has no trades', () => {
      render(
        <AssetDialogs
          deletingAsset={mockAssetWithoutTrades}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.queryByText('Warning: This asset has trading activity. Deleting it may affect your portfolio calculations.')).not.toBeInTheDocument();
    });

    it('handles delete confirmation', async () => {
      render(
        <AssetDialogs
          deletingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const deleteButton = screen.getByText('Delete Asset');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDeleteConfirm).toHaveBeenCalledWith(mockAsset);
      });
    });

    it('handles cancel button', () => {
      render(
        <AssetDialogs
          deletingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes dialog when Escape key is pressed', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('does not close dialog when other keys are pressed', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Dialogs', () => {
    it('renders only the first dialog when multiple are provided', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          editingAsset={mockAsset}
          deletingAsset={mockAsset}
          showCreateForm={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      // Should only show the view dialog (first in priority)
      expect(screen.getByText('Asset Details')).toBeInTheDocument();
      expect(screen.queryByText('Edit Asset')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete Asset')).not.toBeInTheDocument();
      expect(screen.queryByText('Create New Asset')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state during form submission', async () => {
      render(
        <AssetDialogs
          editingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Submitting: true')).toBeInTheDocument();
    });

    it('shows loading state during delete confirmation', async () => {
      render(
        <AssetDialogs
          deletingAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const deleteButton = screen.getByText('Delete Asset');
      fireEvent.click(deleteButton);

      // Should show loading state
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByTitle('Close')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(
        <AssetDialogs
          selectedAsset={mockAsset}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Asset Details');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined portfolioId gracefully', () => {
      render(
        <AssetDialogs
          showCreateForm={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      expect(screen.getByText('Create New Asset')).toBeInTheDocument();
    });

    it('handles empty form submission gracefully', async () => {
      render(
        <AssetDialogs
          showCreateForm={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onDeleteConfirm={mockOnDeleteConfirm}
        />
      );

      const submitButton = screen.getByText('Submit Form');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });
});
