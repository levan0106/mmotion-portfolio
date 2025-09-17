/**
 * Asset List Component Tests
 * Unit tests for AssetList component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AssetList } from '../../components/Asset/AssetList';
import { Asset } from '../../types/asset.types';
import { useAssets } from '../../hooks/useAssets';

// Mock the useAssets hook
vi.mock('../../hooks/useAssets');
const mockUseAssets = useAssets as any;

// Mock utility functions
vi.mock('../../utils/asset.utils', () => ({
  formatCurrency: vi.fn((value) => `$${value.toLocaleString()}`),
  formatPercentage: vi.fn((value) => `${value.toFixed(2)}%`),
  sortAssets: vi.fn((assets) => assets),
  filterAssetsBySearch: vi.fn((assets: Asset[], term: string) => 
    assets.filter(asset => asset.name.toLowerCase().includes(term.toLowerCase()))
  ),
  filterAssetsByType: vi.fn((assets: Asset[], type: string) => 
    assets.filter(asset => asset.type === type)
  ),
  filterAssetsByValueRange: vi.fn((assets: Asset[], min: number, max: number) => 
    assets.filter(asset => (asset.totalValue || 0) >= min && (asset.totalValue || 0) <= max)
  ),
  calculateAssetPerformance: vi.fn(() => ({
    valueChange: 200000,
    valueChangePercentage: 20,
    isGaining: true,
    isLosing: false,
  })),
}));

const mockAssets: Asset[] = [
  {
    id: 'asset-1',
    symbol: 'AAPL',
    name: 'Apple Stock',
    type: 'STOCK',
    assetClass: 'Equity',
    currency: 'VND',
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
  },
  {
    id: 'asset-2',
    symbol: 'GOLD',
    name: 'Gold Bar',
    type: 'GOLD',
    assetClass: 'Commodity',
    currency: 'VND',
    isActive: true,
    description: 'Physical gold bar',
    initialValue: 2000000,
    initialQuantity: 0.5,
    currentValue: 1800000,
    currentQuantity: 0.5,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'user-1',
    updatedBy: 'user-1',
    totalValue: 1800000,
    totalQuantity: 0.5,
    hasTrades: false,
    displayName: 'Gold Bar (GOLD)',
  },
];

const mockUseAssetsReturn = {
  assets: mockAssets,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
  filters: {},
  setFilters: vi.fn(),
  updateFilter: vi.fn(),
  clearFilters: vi.fn(),
  refresh: vi.fn(),
  forceRefresh: vi.fn(),
  loadMore: vi.fn(),
  goToPage: vi.fn(),
  setPageSize: vi.fn(),
  setSorting: vi.fn(),
  updateAsset: vi.fn(),
  createAsset: vi.fn(),
  deleteAsset: vi.fn(),
  sortBy: 'name',
  sortOrder: 'ASC',
  hasMore: false,
  isLoadingMore: false,
  isRefreshing: false,
  lastUpdated: '2024-01-01T00:00:00Z',
};

describe('AssetList', () => {
  beforeEach(() => {
    mockUseAssets.mockReturnValue(mockUseAssetsReturn);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render asset list with data', () => {
    render(<AssetList />);

    expect(screen.getByText('Assets (2)')).toBeInTheDocument();
    expect(screen.getByText('Apple Stock')).toBeInTheDocument();
    expect(screen.getByText('Gold Bar')).toBeInTheDocument();
  });

  it('should display asset symbols', () => {
    render(<AssetList />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getAllByText('GOLD')).toHaveLength(2); // One in name, one in type
  });

  it('should render loading state', () => {
    mockUseAssets.mockReturnValue({
      ...mockUseAssetsReturn,
      loading: true,
      assets: [],
    });

    render(<AssetList />);

    expect(screen.getByText('Loading assets...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseAssets.mockReturnValue({
      ...mockUseAssetsReturn,
      error: 'Failed to load assets',
    });

    render(<AssetList />);

    expect(screen.getByText('Error: Failed to load assets')).toBeInTheDocument();
  });

  it('should handle search input', () => {
    render(<AssetList />);

    const searchInput = screen.getByPlaceholderText('Search assets...');
    fireEvent.change(searchInput, { target: { value: 'Apple' } });

    expect(searchInput).toHaveValue('Apple');
  });

  it('should handle asset selection', () => {
    const mockOnAssetSelect = vi.fn();
    render(<AssetList onAssetSelect={mockOnAssetSelect} />);

    const assetRow = screen.getByText('Apple Stock').closest('tr');
    fireEvent.click(assetRow!);

    expect(mockOnAssetSelect).toHaveBeenCalledWith(mockAssets[0]);
  });

  it('should handle asset edit', () => {
    const mockOnAssetEdit = vi.fn();
    render(<AssetList onAssetEdit={mockOnAssetEdit} />);

    const editButtons = screen.getAllByTitle('Edit Asset');
    fireEvent.click(editButtons[0]);

    expect(mockOnAssetEdit).toHaveBeenCalledWith(mockAssets[0]);
  });

  it('should handle asset delete', () => {
    const mockOnAssetDelete = vi.fn();
    render(<AssetList onAssetDelete={mockOnAssetDelete} />);

    const deleteButtons = screen.getAllByTitle('Delete Asset');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnAssetDelete).toHaveBeenCalledWith(mockAssets[0]);
  });

  it('should display asset performance', () => {
    render(<AssetList />);

    expect(screen.getAllByText('$200,000')).toHaveLength(2);
    expect(screen.getAllByText('20.00%')).toHaveLength(2);
  });

  it('should display asset types', () => {
    render(<AssetList />);

    expect(screen.getAllByText('STOCK')).toHaveLength(1);
    expect(screen.getAllByText('GOLD')).toHaveLength(2); // One in name, one in type
  });

  it('should handle refresh', () => {
    render(<AssetList />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockUseAssetsReturn.refresh).toHaveBeenCalled();
  });
});