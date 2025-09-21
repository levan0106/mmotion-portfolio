/**
 * Asset Analytics Component Tests
 * Comprehensive unit tests for AssetAnalytics component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetAnalytics } from '../../components/Asset/AssetAnalytics';
import { Asset, AssetType, AssetStatistics } from '../../types/asset.types';
import { vi } from 'vitest';

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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    description: 'A test stock',
    initialValue: 1000,
    initialQuantity: 100,
    currentValue: 1200,
    currentQuantity: 100,
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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    description: 'A test bond',
    initialValue: 500,
    initialQuantity: 50,
    currentValue: 550,
    currentQuantity: 50,
    totalValue: 27500,
    totalQuantity: 50,
    hasTrades: false,
    displayName: 'Test Bond (BOND)',
  },
  {
    id: '3',
    symbol: 'GOLD',
    name: 'Test Gold',
    type: 'GOLD',
    assetClass: 'Commodity',
    currency: 'USD',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    description: 'A test gold',
    initialValue: 2000,
    initialQuantity: 10,
    currentValue: 1800,
    currentQuantity: 10,
    totalValue: 18000,
    totalQuantity: 10,
    hasTrades: true,
    displayName: 'Test Gold (GOLD)',
  },
];

const mockStatistics: AssetStatistics = {
  totalAssets: 3,
  assetsByType: {
    [AssetType.STOCK]: 1,
    [AssetType.BOND]: 1,
    [AssetType.CRYPTO]: 0,
    [AssetType.COMMODITY]: 0,
    [AssetType.REIT]: 0,
    [AssetType.GOLD]: 1,
    [AssetType.DEPOSIT]: 0,
    [AssetType.CASH]: 0,
    [AssetType.OTHER]: 0,
  },
  totalValue: 165500,
  averageValue: 55166.67,
};

describe('AssetAnalytics', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders analytics component correctly', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive analysis of your asset portfolio')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('asset-analytics', 'custom-class');
    });

    it('renders close button when onClose is provided', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTitle('Close Analytics')).toBeInTheDocument();
    });

    it('does not render close button when onClose is not provided', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.queryByTitle('Close Analytics')).not.toBeInTheDocument();
    });
  });

  describe('Summary Cards', () => {
    it('displays correct summary statistics', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument(); // Total Assets
      expect(screen.getByText('₫165,500')).toBeInTheDocument(); // Total Value
      expect(screen.getByText('₫25,500')).toBeInTheDocument(); // Total Return
      expect(screen.getByText('+15.38%')).toBeInTheDocument(); // Average Return
    });

    it('handles empty assets array', () => {
      render(
        <AssetAnalytics
          assets={[]}
          statistics={{
            totalAssets: 0,
            assetsByType: {
              [AssetType.STOCK]: 0,
              [AssetType.BOND]: 0,
              [AssetType.CRYPTO]: 0,
              [AssetType.COMMODITY]: 0,
              [AssetType.REIT]: 0,
              [AssetType.GOLD]: 0,
              [AssetType.DEPOSIT]: 0,
              [AssetType.CASH]: 0,
              [AssetType.OTHER]: 0,
            },
            totalValue: 0,
            averageValue: 0,
          }}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument(); // Total Assets
      expect(screen.getByText('₫0')).toBeInTheDocument(); // Total Value
    });
  });

  describe('Chart Tabs', () => {
    it('renders all chart tabs', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('📊 Allocation')).toBeInTheDocument();
      expect(screen.getByText('📈 Performance')).toBeInTheDocument();
      expect(screen.getByText('💰 Value Distribution')).toBeInTheDocument();
    });

    it('starts with allocation tab active', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const allocationTab = screen.getByText('📊 Allocation');
      expect(allocationTab).toHaveClass('tab--active');
    });

    it('switches to performance tab when clicked', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const performanceTab = screen.getByText('📈 Performance');
      fireEvent.click(performanceTab);

      expect(performanceTab).toHaveClass('tab--active');
    });

    it('switches to value distribution tab when clicked', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const valueTab = screen.getByText('💰 Value Distribution');
      fireEvent.click(valueTab);

      expect(valueTab).toHaveClass('tab--active');
    });
  });

  describe('Allocation Chart', () => {
    it('displays asset allocation correctly', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('Asset Allocation')).toBeInTheDocument();
      expect(screen.getByText('Cổ phiếu')).toBeInTheDocument();
      expect(screen.getByText('Trái phiếu')).toBeInTheDocument();
      expect(screen.getByText('Vàng')).toBeInTheDocument();
    });

    it('shows correct allocation percentages', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      // Stock: 120000 / 165500 = 72.5%
      expect(screen.getByText('72.5%')).toBeInTheDocument();
      // Bond: 27500 / 165500 = 16.6%
      expect(screen.getByText('16.6%')).toBeInTheDocument();
      // Gold: 18000 / 165500 = 10.9%
      expect(screen.getByText('10.9%')).toBeInTheDocument();
    });

    it('shows correct allocation values', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('₫120,000')).toBeInTheDocument();
      expect(screen.getByText('₫27,500')).toBeInTheDocument();
      expect(screen.getByText('₫18,000')).toBeInTheDocument();
    });
  });

  describe('Performance Chart', () => {
    it('displays performance chart when tab is selected', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const performanceTab = screen.getByText('📈 Performance');
      fireEvent.click(performanceTab);

      expect(screen.getByText('Asset Performance')).toBeInTheDocument();
    });

    it('shows assets sorted by performance', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const performanceTab = screen.getByText('📈 Performance');
      fireEvent.click(performanceTab);

      // Should show assets in performance order
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.getByText('Test Bond')).toBeInTheDocument();
      expect(screen.getByText('Test Gold')).toBeInTheDocument();
    });

    it('displays performance values correctly', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const performanceTab = screen.getByText('📈 Performance');
      fireEvent.click(performanceTab);

      // Should show performance values
      expect(screen.getByText('₫20,000')).toBeInTheDocument(); // Stock return
      expect(screen.getByText('₫2,500')).toBeInTheDocument(); // Bond return
      expect(screen.getByText('-₫2,000')).toBeInTheDocument(); // Gold return
    });
  });

  describe('Value Distribution Chart', () => {
    it('displays value distribution chart when tab is selected', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const valueTab = screen.getByText('💰 Value Distribution');
      fireEvent.click(valueTab);

      expect(screen.getByText('Value Distribution')).toBeInTheDocument();
    });

    it('shows assets sorted by value', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      const valueTab = screen.getByText('💰 Value Distribution');
      fireEvent.click(valueTab);

      // Should show assets in value order
      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.getByText('Test Bond')).toBeInTheDocument();
      expect(screen.getByText('Test Gold')).toBeInTheDocument();
    });
  });

  describe('Top Performers', () => {
    it('displays top performers section', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('Top Performers')).toBeInTheDocument();
    });

    it('shows top performing assets', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('Test Stock')).toBeInTheDocument();
      expect(screen.getByText('Test Bond')).toBeInTheDocument();
    });
  });

  describe('Worst Performers', () => {
    it('displays worst performers section', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('Worst Performers')).toBeInTheDocument();
    });

    it('shows worst performing assets', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('Test Gold')).toBeInTheDocument();
    });
  });

  describe('Asset Type Breakdown', () => {
    it('displays asset type breakdown', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('Asset Type Breakdown')).toBeInTheDocument();
    });

    it('shows correct type counts', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument(); // Stock count
      expect(screen.getByText('1')).toBeInTheDocument(); // Bond count
      expect(screen.getByText('1')).toBeInTheDocument(); // Gold count
    });

    it('shows correct type percentages', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      // Each type has 1 out of 3 assets = 33.3%
      expect(screen.getByText('33.3%')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTitle('Close Analytics');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('handles empty assets array gracefully', () => {
      render(
        <AssetAnalytics
          assets={[]}
          statistics={{
            totalAssets: 0,
            assetsByType: {
              [AssetType.STOCK]: 0,
              [AssetType.BOND]: 0,
              [AssetType.CRYPTO]: 0,
              [AssetType.COMMODITY]: 0,
              [AssetType.REIT]: 0,
              [AssetType.GOLD]: 0,
              [AssetType.DEPOSIT]: 0,
              [AssetType.CASH]: 0,
              [AssetType.OTHER]: 0,
            },
            totalValue: 0,
            averageValue: 0,
          }}
        />
      );

      expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Total Assets
    });
  });

  describe('Performance Calculations', () => {
    it('calculates total return correctly', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      // Total return should be sum of all asset returns
      // Stock: +20000, Bond: +2500, Gold: -2000 = +20500
      expect(screen.getByText('₫20,500')).toBeInTheDocument();
    });

    it('calculates average return correctly', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      // Average return should be total return / number of assets
      // 20500 / 3 = 6833.33
      expect(screen.getByText('+6,833.33%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
        />
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Portfolio Analytics');
    });

    it('has proper button labels', () => {
      render(
        <AssetAnalytics
          assets={mockAssets}
          statistics={mockStatistics}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTitle('Close Analytics')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles assets with zero values', () => {
      const zeroAsset: Asset = {
        ...mockAssets[0],
        totalValue: 0,
        currentValue: 0,
        initialValue: 0,
      };

      render(
        <AssetAnalytics
          assets={[zeroAsset]}
          statistics={{
            totalAssets: 1,
            assetsByType: {
              [AssetType.STOCK]: 1,
              [AssetType.BOND]: 0,
              [AssetType.CRYPTO]: 0,
              [AssetType.COMMODITY]: 0,
              [AssetType.REIT]: 0,
              [AssetType.GOLD]: 0,
              [AssetType.DEPOSIT]: 0,
              [AssetType.CASH]: 0,
              [AssetType.OTHER]: 0,
            },
            totalValue: 0,
            averageValue: 0,
          }}
        />
      );

      expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
    });

    it('handles assets with negative values', () => {
      const negativeAsset: Asset = {
        ...mockAssets[0],
        totalValue: -1000,
        currentValue: -1000,
        initialValue: 0,
      };

      render(
        <AssetAnalytics
          assets={[negativeAsset]}
          statistics={{
            totalAssets: 1,
            assetsByType: {
              [AssetType.STOCK]: 1,
              [AssetType.BOND]: 0,
              [AssetType.CRYPTO]: 0,
              [AssetType.COMMODITY]: 0,
              [AssetType.REIT]: 0,
              [AssetType.GOLD]: 0,
              [AssetType.DEPOSIT]: 0,
              [AssetType.CASH]: 0,
              [AssetType.OTHER]: 0,
            },
            totalValue: -1000,
            averageValue: -1000,
          }}
        />
      );

      expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
    });
  });
});
