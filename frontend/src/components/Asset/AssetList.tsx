/**
 * Asset List Component
 * Displays a list of assets with filtering, sorting, and pagination
 */

import React, { useState, useMemo } from 'react';
import { Asset, AssetFilters } from '../../types/asset.types';
import { useAssets } from '../../hooks/useAssets';
import { useAssetTypes } from '../../hooks/useAssetTypes';
import { useAccount } from '../../contexts/AccountContext';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber
} from '../../utils/format';
import { 
  sortAssets, 
  calculateAssetPerformance 
} from '../../utils/asset.utils';
import './AssetList.styles.css';

export interface AssetListProps {
  portfolioId?: string;
  initialFilters?: AssetFilters;
  assets?: Asset[];
  loading?: boolean;
  error?: string | null;
  onAssetSelect?: (asset: Asset) => void;
  onAssetEdit?: (asset: Asset) => void;
  onAssetDelete?: (asset: Asset) => void;
  showActions?: boolean;
  className?: string;
}

export const AssetList: React.FC<AssetListProps> = ({
  portfolioId, // Keep for future use
  initialFilters = {},
  assets: propAssets = [],
  loading: propLoading = false,
  error: propError = null,
  onAssetSelect,
  onAssetEdit,
  onAssetDelete,
  showActions = true,
  className = '',
}) => {
  const { baseCurrency } = useAccount();
  
  // Use assets from props or fallback to hook
  const {
    assets: hookAssets,
    loading: hookLoading,
    error: hookError,
    refresh,
  } = useAssets({ 
    initialFilters: { 
      ...initialFilters, 
      ...(portfolioId && { portfolioId }) 
    }, 
    autoFetch: false
  });
  
  // Use props if provided, otherwise use hook
  const assets = propAssets.length > 0 ? propAssets : hookAssets;
  const loading = propLoading || hookLoading;
  const error = propError || hookError;

  // Use asset types hook
  const { assetTypes } = useAssetTypes();

  // Local state for UI
  // Local state for sorting only
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Process assets with local sorting only
  const processedAssets = useMemo(() => {
    return sortAssets(assets, sortBy, sortOrder);
  }, [assets, sortBy, sortOrder]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    // Note: Sorting is handled locally, not via API
  };

  // Pagination functions removed - handled by parent component

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
          <h2>Assets ({assets.length})</h2>
          <button 
            onClick={handleRefresh} 
            className="btn btn--secondary btn--icon"
            disabled={loading}
          >
            <span className="icon">↻</span>
            Refresh
          </button>
        </div>

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

      {/* Pagination removed - handled by parent component */}
    </div>
  );
};

export default AssetList;
