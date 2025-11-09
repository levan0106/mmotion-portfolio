/**
 * Asset Deletion Dialog Component Tests
 * Unit tests for AssetDeletionDialog component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AssetDeletionDialog } from '../../components/Asset/AssetDeletionDialog';
import { Asset } from '../../types/asset.types';

const mockAsset: Asset = {
  id: 'asset-1',
  symbol: 'AAPL',
  name: 'Apple Stock',
  type: 'STOCK',
  assetClass: 'Equity',
  currency: 'USD',
  isActive: true,
  description: 'Apple Inc. stock',
  initialValue: 1000000,
  initialQuantity: 100,
  currentValue: 1200000,
  currentQuantity: 100,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  totalValue: 1200000,
  totalQuantity: 100,
  hasTrades: false,
  displayName: 'Apple Stock (AAPL)',
};

describe('AssetDeletionDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
      />
    );

    expect(screen.getByRole('heading', { name: 'Delete Asset' })).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete "Apple Stock (AAPL)"?')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
      />
    );

    expect(screen.queryByRole('heading', { name: 'Delete Asset' })).not.toBeInTheDocument();
  });

  it('should not render when asset is null', () => {
    render(
      <AssetDeletionDialog
        asset={null}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
      />
    );

    expect(screen.queryByRole('heading', { name: 'Delete Asset' })).not.toBeInTheDocument();
  });

  it('should show warning when asset has trades', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={5}
      />
    );

    expect(screen.getByText(/Warning:/)).toBeInTheDocument();
    expect(screen.getByText(/This asset has 5 associated trade\(s\)/)).toBeInTheDocument();
  });

  it('should show info message when asset has no trades', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
      />
    );

    expect(screen.getByText(/This asset has no associated trades/)).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when delete button is clicked', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Delete Asset' });
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should show loading state', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
        loading={true}
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('should disable buttons when loading', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
        loading={true}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByRole('button', { name: /deleting/i });

    expect(cancelButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('should not call callbacks when loading', () => {
    render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
        loading={true}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    const deleteButton = screen.getByRole('button', { name: /deleting/i });

    fireEvent.click(cancelButton);
    fireEvent.click(deleteButton);

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should display correct asset information', () => {
    const customAsset: Asset = {
      ...mockAsset,
      name: 'Custom Asset',
      symbol: 'CUSTOM',
    };

    render(
      <AssetDeletionDialog
        asset={customAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={0}
      />
    );

    expect(screen.getByText('Are you sure you want to delete "Custom Asset (CUSTOM)"?')).toBeInTheDocument();
  });

  it('should handle different trade counts', () => {
    const { rerender } = render(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={1}
      />
    );

    expect(screen.getByText(/This asset has 1 associated trade/)).toBeInTheDocument();

    rerender(
      <AssetDeletionDialog
        asset={mockAsset}
        open={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tradeCount={10}
      />
    );

    expect(screen.getByText(/This asset has 10 associated trade\(s\)/)).toBeInTheDocument();
  });
});
