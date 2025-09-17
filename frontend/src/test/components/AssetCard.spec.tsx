/**
 * Asset Card Component Tests
 * Comprehensive unit tests for AssetCard component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetCard } from '../../components/Asset/AssetCard';
import { Asset, AssetType } from '../../types/asset.types';
import { vi } from 'vitest';

// Mock asset data
const mockAsset: Asset = {
  id: '1',
  symbol: 'TEST',
  name: 'Test Stock',
  type: 'STOCK',
  assetClass: 'Equity',
  currency: 'USD',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  description: 'A test stock for unit testing',
  initialValue: 1000,
  initialQuantity: 100,
  currentValue: 1200,
  currentQuantity: 100,
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

const mockAssetWithLoss: Asset = {
  ...mockAsset,
  currentValue: 800,
  totalValue: 80000,
  initialValue: 100000,
};

describe('AssetCard', () => {
  describe('Rendering', () => {
    it('renders asset information correctly', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.getByText('TEST')).toBeInTheDocument();
      expect(screen.getByText('Cổ phiếu')).toBeInTheDocument();
      expect(screen.getByText('A test stock for unit testing')).toBeInTheDocument();
    });

    it('renders without code when not provided', () => {
      render(<AssetCard asset={mockAssetWithoutCode} />);
      
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.queryByText('TEST')).not.toBeInTheDocument();
    });

    it('renders without description when not provided', () => {
      render(<AssetCard asset={mockAssetWithoutDescription} />);
      
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.queryByText('A test stock for unit testing')).not.toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      render(<AssetCard asset={mockAsset} compact />);
      
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.queryByText('A test stock for unit testing')).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<AssetCard asset={mockAsset} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('asset-card', 'custom-class');
    });
  });

  describe('Value Display', () => {
    it('displays total value correctly', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('120.000 ₫')).toBeInTheDocument();
    });

    it('displays quantity correctly', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('shows initial value when different from current', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('Initial: 1.000 ₫')).toBeInTheDocument();
    });

    it('shows initial quantity when different from current', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Performance Display', () => {
    it('displays positive performance correctly', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('119.000 ₫')).toBeInTheDocument();
      expect(screen.getByText('11900.00%')).toBeInTheDocument();
    });

    it('displays negative performance correctly', () => {
      render(<AssetCard asset={mockAssetWithLoss} />);
      
      expect(screen.getByText('-20.000 ₫')).toBeInTheDocument();
      expect(screen.getByText('-20.00%')).toBeInTheDocument();
    });

    it('applies correct performance styling', () => {
      const { container } = render(<AssetCard asset={mockAsset} />);
      
      const performanceElement = container.querySelector('.performance--positive');
      expect(performanceElement).toBeInTheDocument();
    });
  });

  describe('Asset Type Display', () => {
    it('displays stock type correctly', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('Cổ phiếu')).toBeInTheDocument();
    });

    it('applies correct type styling', () => {
      const { container } = render(<AssetCard asset={mockAsset} />);
      
      const typeElement = container.querySelector('.asset-type--stock');
      expect(typeElement).toBeInTheDocument();
    });

    it('displays bond type correctly', () => {
      const bondAsset = { ...mockAsset, type: AssetType.BOND };
      render(<AssetCard asset={bondAsset} />);
      
      expect(screen.getByText('Trái phiếu')).toBeInTheDocument();
    });

    it('displays gold type correctly', () => {
      const goldAsset = { ...mockAsset, type: AssetType.GOLD };
      render(<AssetCard asset={goldAsset} />);
      
      expect(screen.getByText('Vàng')).toBeInTheDocument();
    });

    it('displays deposit type correctly', () => {
      const depositAsset = { ...mockAsset, type: AssetType.DEPOSIT };
      render(<AssetCard asset={depositAsset} />);
      
      expect(screen.getByText('Tiền gửi')).toBeInTheDocument();
    });

    it('displays cash type correctly', () => {
      const cashAsset = { ...mockAsset, type: AssetType.CASH };
      render(<AssetCard asset={cashAsset} />);
      
      expect(screen.getByText('Tiền mặt')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders action buttons when showActions is true', () => {
      render(<AssetCard asset={mockAsset} showActions />);
      
      expect(screen.getByText('✏️ Edit')).toBeInTheDocument();
      expect(screen.getByText('🗑️ Delete')).toBeInTheDocument();
    });

    it('hides action buttons when showActions is false', () => {
      render(<AssetCard asset={mockAsset} showActions={false} />);
      
      expect(screen.queryByText('✏️ Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('🗑️ Delete')).not.toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();
      render(<AssetCard asset={mockAsset} onEdit={onEdit} />);
      
      fireEvent.click(screen.getByText('✏️ Edit'));
      expect(onEdit).toHaveBeenCalledWith(mockAsset);
    });

    it('calls onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      render(<AssetCard asset={mockAsset} onDelete={onDelete} />);
      
      fireEvent.click(screen.getByText('🗑️ Delete'));
      expect(onDelete).toHaveBeenCalledWith(mockAsset);
    });

    it('calls onView when card is clicked', () => {
      const onView = vi.fn();
      render(<AssetCard asset={mockAsset} onView={onView} />);
      
      fireEvent.click(screen.getByText('Test Stock'));
      expect(onView).toHaveBeenCalledWith(mockAsset);
    });

    it('does not call onView when action button is clicked', () => {
      const onView = vi.fn();
      const onEdit = vi.fn();
      render(<AssetCard asset={mockAsset} onView={onView} onEdit={onEdit} />);
      
      fireEvent.click(screen.getByText('✏️ Edit'));
      expect(onView).not.toHaveBeenCalled();
      expect(onEdit).toHaveBeenCalledWith(mockAsset);
    });
  });

  describe('Status Indicators', () => {
    it('shows trades indicator when hasTrades is true', () => {
      render(<AssetCard asset={mockAsset} />);
      
      const indicators = screen.getAllByText('📈');
      expect(indicators).toHaveLength(2);
    });

    it('shows gaining indicator for positive performance', () => {
      render(<AssetCard asset={mockAsset} />);
      
      const indicators = screen.getAllByText('📈');
      expect(indicators).toHaveLength(2); // One for trades, one for gaining
    });

    it('shows losing indicator for negative performance', () => {
      render(<AssetCard asset={mockAssetWithLoss} />);
      
      expect(screen.getByText('📉')).toBeInTheDocument();
    });

    it('shows correct status for assets without trades', () => {
      render(<AssetCard asset={mockAssetWithoutTrades} />);
      
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('Additional Information', () => {
    it('displays creation and update dates', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
      expect(screen.getByText('1/2/2024')).toBeInTheDocument();
    });

    it('hides additional info in compact mode', () => {
      render(<AssetCard asset={mockAsset} compact />);
      
      expect(screen.queryByText('Created')).not.toBeInTheDocument();
      expect(screen.queryByText('Updated')).not.toBeInTheDocument();
      expect(screen.queryByText('Has Trades')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByTitle('Edit Asset')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Asset')).toBeInTheDocument();
    });

    it('has proper ARIA labels for indicators', () => {
      render(<AssetCard asset={mockAsset} />);
      
      expect(screen.getByTitle('Has trading activity')).toBeInTheDocument();
      expect(screen.getByTitle('Positive performance')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero values correctly', () => {
      const zeroAsset = { ...mockAsset, totalValue: 0, totalQuantity: 0 };
      render(<AssetCard asset={zeroAsset} />);
      
      expect(screen.getByText('0 VND')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles very large values correctly', () => {
      const largeAsset = { ...mockAsset, totalValue: 999999999999 };
      render(<AssetCard asset={largeAsset} />);
      
      expect(screen.getByText('999.999.999.999 ₫')).toBeInTheDocument();
    });

    it('handles very small values correctly', () => {
      const smallAsset = { ...mockAsset, totalValue: 0.01 };
      render(<AssetCard asset={smallAsset} />);
      
      expect(screen.getByText('0,01 ₫')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders without performance issues', () => {
      const startTime = performance.now();
      render(<AssetCard asset={mockAsset} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
    });

    it('handles rapid re-renders efficiently', () => {
      const { rerender } = render(<AssetCard asset={mockAsset} />);
      
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        rerender(<AssetCard asset={mockAsset} />);
      }
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 re-renders in less than 1s
    });
  });
});
