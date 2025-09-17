/**
 * Asset List Component
 * Displays a list of assets with filtering, sorting, and pagination
 */

import React, { useState, useMemo } from 'react';
import { Asset, AssetFilters, AssetType } from '../../types/asset.types';
import { useAssets } from '../../hooks/useAssets';
import { useAssetTypes } from '../../hooks/useAssetTypes';
import { useAccount } from '../../hooks/useAccount';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber
} from '../../utils/format';
import { 
  sortAssets, 
  filterAssetsBySearch, 
  filterAssetsByType,
  filterAssetsByValueRange,
  calculateAssetPerformance 
} from '../../utils/asset.utils';
import './AssetList.styles.css';

export interface AssetListProps {
  portfolioId?: string;
  initialFilters?: AssetFilters;
  onAssetSelect?: (asset: Asset) => void;
  onAssetEdit?: (asset: Asset) => void;
  onAssetDelete?: (asset: Asset) => void;
  showActions?: boolean;
  className?: string;
}

export const AssetList: React.FC<AssetListProps> = ({
  portfolioId,
  initialFilters = {},
  onAssetSelect,
  onAssetEdit,
  onAssetDelete,
  showActions = true,
  className = '',
}) => {
  const { baseCurrency } = useAccount();
  // Initialize filters with portfolioId if provided
  const filters = useMemo(() => ({
    ...initialFilters,
    ...(portfolioId && { portfolioId }),
  }), [portfolioId, initialFilters]);

  // Use assets hook
  const {
    assets,
    loading,
    error,
    pagination,
    clearFilters,
    refresh,
    goToPage,
    setPageSize,
    setSorting,
  } = useAssets({ initialFilters: filters || {}, autoFetch: true });

  // Use asset types hook
  const { assetTypes } = useAssetTypes();

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [showFilters, setShowFilters] = useState(false);
  const [valueRange, setValueRange] = useState({ min: '', max: '' });

  // Process assets with local filtering and sorting
  const processedAssets = useMemo(() => {
    let filtered = assets;

    // Apply search filter
    if (searchTerm) {
      filtered = filterAssetsBySearch(filtered, searchTerm);
    }

    // Apply type filter
    if (selectedType !== 'ALL') {
      filtered = filterAssetsByType(filtered, selectedType as AssetType);
    }

    // Apply value range filter
    if (valueRange.min || valueRange.max) {
      const minValue = valueRange.min ? parseFloat(valueRange.min) : 0;
      const maxValue = valueRange.max ? parseFloat(valueRange.max) : Infinity;
      filtered = filterAssetsByValueRange(filtered, minValue, maxValue);
    }

    // Apply sorting
    return sortAssets(filtered, sortBy, sortOrder);
  }, [assets, searchTerm, selectedType, valueRange, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Handle type filter
  const handleTypeFilter = (type: string | 'ALL') => {
    setSelectedType(type);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    setSorting(field, sortOrder);
  };

  // Handle value range filter
  const handleValueRangeChange = (field: 'min' | 'max', value: string) => {
    setValueRange(prev => ({ ...prev, [field]: value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setValueRange({ min: '', max: '' });
    clearFilters();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

  // Handle refresh
  const handleRefresh = () => {
    refresh();
  };

  // Render loading state
  if (loading && assets.length === 0) {
    return (
      <div className={`asset-list ${className}`}>
        <div className="asset-list__loading">
          <div className="spinner" />
          <p>Loading assets...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`asset-list ${className}`}>
        <div className="asset-list__error">
          <p>Error: {error}</p>
          <button onClick={handleRefresh} className="btn btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`asset-list ${className}`}>
      {/* Header */}
      <div className="asset-list__header">
        <div className="asset-list__title">
          <h2>Assets ({pagination.total})</h2>
          <button 
            onClick={handleRefresh} 
            className="btn btn--secondary btn--icon"
            disabled={loading}
          >
            <span className="icon">↻</span>
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="asset-list__controls">
          <div className="asset-list__search">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="input"
            />
          </div>

          <div className="asset-list__filters">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn--secondary"
            >
              Filters {showFilters ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="asset-list__advanced-filters">
            <div className="filter-group">
              <label>Type:</label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeFilter(e.target.value as string | 'ALL')}
                className="select"
              >
                <option value="ALL">All Types</option>
                {assetTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Value Range:</label>
              <div className="value-range">
                <input
                  type="number"
                  placeholder="Min"
                  value={valueRange.min}
                  onChange={(e) => handleValueRangeChange('min', e.target.value)}
                  className="input input--small"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={valueRange.max}
                  onChange={(e) => handleValueRangeChange('max', e.target.value)}
                  className="input input--small"
                />
              </div>
            </div>

            <button onClick={handleClearFilters} className="btn btn--outline">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="asset-list__table-container">
        <table className="asset-list__table">
          <thead>
            <tr>
              <th 
                className="sortable"
                onClick={() => handleSort('name')}
              >
                Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('type')}
              >
                Type {sortBy === 'type' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('totalValue')}
              >
                Value {sortBy === 'totalValue' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('totalQuantity')}
              >
                Quantity {sortBy === 'totalQuantity' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th 
                className="sortable"
                onClick={() => handleSort('currentPrice')}
              >
                Market Price {sortBy === 'currentPrice' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Performance</th>
              <th 
                className="sortable"
                onClick={() => handleSort('updatedAt')}
              >
                Updated {sortBy === 'updatedAt' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {processedAssets.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className="asset-list__empty">
                  No assets found
                </td>
              </tr>
            ) : (
              processedAssets.map((asset) => {
                const performance = calculateAssetPerformance(asset);
                return (
                  <tr 
                    key={asset.id}
                    className="asset-list__row"
                    onClick={() => onAssetSelect?.(asset)}
                  >
                    <td className="asset-list__cell asset-list__cell--name">
                      <div className="asset-name">
                        <div className="asset-name__primary">{asset.name}</div>
                        {asset.symbol && (
                          <div className="asset-name__secondary">{asset.symbol}</div>
                        )}
                      </div>
                    </td>
                    <td className="asset-list__cell">
                      <span className={`asset-type asset-type--${asset.type.toLowerCase()}`}>
                        {assetTypes.find(t => t.value === asset.type)?.label || asset.type}
                      </span>
                    </td>
                    <td className="asset-list__cell asset-list__cell--value">
                      <div className="value-display">
                        <div className="value-display__primary">
                          {formatCurrency(Number(asset.totalValue) || 0)}
                        </div>
                        {asset.currentValue && asset.currentValue !== asset.initialValue && (
                          <div className="value-display__secondary">
                            Initial: {formatCurrency(asset.initialValue || 0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="asset-list__cell">
                      <div className="quantity-display">
                        <div className="quantity-display__primary">
                          {formatNumber(Number(asset.totalQuantity) || 0, 2)}
                        </div>
                        {asset.currentQuantity && asset.currentQuantity !== asset.initialQuantity && (
                          <div className="quantity-display__secondary">
                            Initial: {formatNumber(asset.initialQuantity || 0, 2)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="asset-list__cell">
                      <div className="price-display">
                        <div className="price-display__primary price-display__primary--current">
                          {formatCurrency(Number(asset.currentPrice) || 0)}
                        </div>
                        {asset.avgCost !== undefined && asset.avgCost > 0 && asset.avgCost !== asset.currentPrice && (
                          <div className="price-display__secondary">
                            Avg: {formatCurrency(Number(asset.avgCost) || 0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="asset-list__cell">
                      <div className={`performance ${performance.isGaining ? 'performance--positive' : performance.isLosing ? 'performance--negative' : ''}`}>
                        <div className="performance__value">
                          {formatCurrency(performance.valueChange, baseCurrency)}
                        </div>
                        <div className="performance__percentage">
                          {formatPercentage(performance.valueChangePercentage, 2)}
                        </div>
                      </div>
                    </td>
                    <td className="asset-list__cell">
                      {new Date(asset.updatedAt).toLocaleDateString()}
                    </td>
                    {showActions && (
                      <td className="asset-list__cell asset-list__cell--actions">
                        <div className="action-buttons">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssetEdit?.(asset);
                            }}
                            className="btn btn--small btn--secondary"
                            title="Edit Asset"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssetDelete?.(asset);
                            }}
                            className="btn btn--small btn--danger"
                            title="Delete Asset"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="asset-list__pagination">
          <div className="pagination-info">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} assets
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn btn--secondary"
            >
              Previous
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.page;
                  return page === 1 || page === current || page === current - 1 || page === current + 1 || page === Math.ceil(pagination.total / pagination.limit);
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && <span>...</span>}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`btn ${page === pagination.page ? 'btn--primary' : 'btn--secondary'}`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
            </div>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="btn btn--secondary"
            >
              Next
            </button>
          </div>

          <div className="pagination-size">
            <label>Show:</label>
            <select
              value={pagination.limit}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="select select--small"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;
