/**
 * Asset Filters Component
 * Provides filtering options for asset management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AssetType, AssetFilters as AssetFiltersType } from '../../types/asset.types';
import { AssetTypeLabels } from '../../types/asset.types';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../hooks/useAccount';
import './AssetFilters.styles.css';

export interface AssetFiltersProps {
  filters: AssetFiltersType;
  onFiltersChange: (filters: AssetFiltersType) => void;
  onClearFilters: () => void;
  className?: string;
  showAdvanced?: boolean;
  onToggleAdvanced?: (show: boolean) => void;
}

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  className = '',
  showAdvanced = false,
  onToggleAdvanced,
}) => {
  // Get account and portfolios
  const { accountId } = useAccount();
  const { portfolios, isLoading: portfoliosLoading } = usePortfolios(accountId);

  // Local state for form inputs
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedType, setSelectedType] = useState<AssetType | 'ALL'>(filters.type || 'ALL');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | 'ALL'>(filters.portfolioId || 'ALL');
  const [sortBy, setSortBy] = useState(filters.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(filters.sortOrder || 'ASC');
  const [valueRange, setValueRange] = useState({
    min: filters.minValue?.toString() || '',
    max: filters.maxValue?.toString() || '',
  });
  const [limit, setLimit] = useState(filters.limit || 10);
  const [hasTrades, setHasTrades] = useState<boolean | undefined>(filters.hasTrades);

  // Update local state when filters prop changes
  useEffect(() => {
    setSearchTerm(filters.search || '');
    setSelectedType(filters.type || 'ALL');
    setSelectedPortfolio(filters.portfolioId || 'ALL');
    setSortBy(filters.sortBy || 'name');
    setSortOrder(filters.sortOrder || 'ASC');
    setValueRange({
      min: filters.minValue?.toString() || '',
      max: filters.maxValue?.toString() || '',
    });
    setLimit(filters.limit || 10);
    setHasTrades(filters.hasTrades);
  }, [filters]);

  // Handle search input with immediate update
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });
  }, [filters, onFiltersChange]);


  // Handle type filter
  const handleTypeChange = useCallback((type: AssetType | 'ALL') => {
    setSelectedType(type);
    onFiltersChange({
      ...filters,
      type: type === 'ALL' ? undefined : type,
    });
  }, [filters, onFiltersChange]);

  // Handle portfolio filter
  const handlePortfolioChange = useCallback((portfolioId: string | 'ALL') => {
    setSelectedPortfolio(portfolioId);
    onFiltersChange({
      ...filters,
      portfolioId: portfolioId === 'ALL' ? undefined : portfolioId,
    });
  }, [filters, onFiltersChange]);

  // Handle has trades filter
  const handleHasTradesChange = useCallback((value: boolean | undefined) => {
    console.log('handleHasTradesChange called with:', value);
    console.log('Current hasTrades state:', hasTrades);
    setHasTrades(value);
    const newFilters = {
      ...filters,
      hasTrades: value,
    };
    console.log('Calling onFiltersChange with:', newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange, hasTrades]);


  // Handle value range changes
  const handleValueRangeChange = useCallback((field: 'min' | 'max', value: string) => {
    const newValueRange = { ...valueRange, [field]: value };
    setValueRange(newValueRange);
    
    const minValue = newValueRange.min ? parseFloat(newValueRange.min) : undefined;
    const maxValue = newValueRange.max ? parseFloat(newValueRange.max) : undefined;
    
    onFiltersChange({
      ...filters,
      minValue,
      maxValue,
    });
  }, [filters, onFiltersChange, valueRange]);

  // Handle limit change
  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    onFiltersChange({
      ...filters,
      limit: newLimit,
    });
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedPortfolio('ALL');
    setHasTrades(undefined);
    setSortBy('name');
    setSortOrder('ASC');
    setValueRange({ min: '', max: '' });
    setLimit(10);
    onClearFilters();
  }, [onClearFilters]);

  // Toggle advanced filters
  const handleToggleAdvanced = useCallback(() => {
    onToggleAdvanced?.(!showAdvanced);
  }, [showAdvanced, onToggleAdvanced]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedType !== 'ALL' || selectedPortfolio !== 'ALL' || hasTrades !== undefined || valueRange.min || valueRange.max;

  return (
    <div className={`asset-filters ${className}`}>
      {/* Basic Filters */}
      <div className="asset-filters__basic">
        <div className="asset-filters__search">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input input--search"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="btn btn--icon btn--clear"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="asset-filters__type">
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value as AssetType | 'ALL')}
            className="select"
          >
            <option value="ALL">All Types</option>
            {Object.entries(AssetTypeLabels).map(([type, label]) => (
              <option key={type} value={type}>
                {label as string}
              </option>
            ))}
          </select>
        </div>

        <div className="asset-filters__portfolio">
          <select
            value={selectedPortfolio}
            onChange={(e) => handlePortfolioChange(e.target.value)}
            className="select"
            disabled={portfoliosLoading}
          >
            <option value="ALL">All Portfolios</option>
            {portfolios?.map((portfolio) => (
              <option key={portfolio.portfolioId} value={portfolio.portfolioId}>
                {portfolio.name}
              </option>
            ))}
          </select>
        </div>

        <div className="asset-filters__has-trades">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasTrades === true}
              onChange={(e) => handleHasTradesChange(e.target.checked ? true : undefined)}
              className="checkbox"
            />
            <span className="checkbox-text">Has Trades</span>
          </label>
        </div>

        <div className="asset-filters__sort">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'ASC' | 'DESC');
              onFiltersChange({
                ...filters,
                sortBy: field,
                sortOrder: order as 'ASC' | 'DESC',
              });
            }}
            className="select"
          >
            <option value="name-ASC">Name A-Z</option>
            <option value="name-DESC">Name Z-A</option>
            <option value="totalValue-ASC">Value Low-High</option>
            <option value="totalValue-DESC">Value High-Low</option>
            <option value="totalQuantity-ASC">Quantity Low-High</option>
            <option value="totalQuantity-DESC">Quantity High-Low</option>
            <option value="updatedAt-ASC">Oldest First</option>
            <option value="updatedAt-DESC">Newest First</option>
          </select>
        </div>

        <div className="asset-filters__limit">
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="select select--small"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div className="asset-filters__actions">
          <button
            onClick={handleToggleAdvanced}
            className="btn btn--secondary"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="btn btn--outline"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="asset-filters__advanced">
          <div className="asset-filters__advanced-header">
            <h4>Advanced Filters</h4>
          </div>

          <div className="asset-filters__advanced-content">
            <div className="filter-group">
              <label>Value Range</label>
              <div className="value-range">
                <input
                  type="number"
                  placeholder="Min value"
                  value={valueRange.min}
                  onChange={(e) => handleValueRangeChange('min', e.target.value)}
                  className="input input--small"
                  min="0"
                  step="0.01"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max value"
                  value={valueRange.max}
                  onChange={(e) => handleValueRangeChange('max', e.target.value)}
                  className="input input--small"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Sort Options</label>
              <div className="sort-options">
                <div className="sort-field">
                  <label>Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      onFiltersChange({
                        ...filters,
                        sortBy: e.target.value,
                      });
                    }}
                    className="select select--small"
                  >
                    <option value="name">Name</option>
                    <option value="type">Type</option>
                    <option value="totalValue">Total Value</option>
                    <option value="totalQuantity">Total Quantity</option>
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                  </select>
                </div>
                <div className="sort-order">
                  <label>Order:</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value as 'ASC' | 'DESC');
                      onFiltersChange({
                        ...filters,
                        sortOrder: e.target.value as 'ASC' | 'DESC',
                      });
                    }}
                    className="select select--small"
                  >
                    <option value="ASC">Ascending</option>
                    <option value="DESC">Descending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <label>Results per page</label>
              <select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="select select--small"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="asset-filters__summary">
          <div className="active-filters">
            <span className="active-filters__label">Active filters:</span>
            <div className="active-filters__tags">
              {searchTerm && (
                <span className="filter-tag">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => handleSearchChange('')}
                    className="filter-tag__remove"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedType !== 'ALL' && (
                <span className="filter-tag">
                  Type: {AssetTypeLabels[selectedType]}
                  <button
                    onClick={() => handleTypeChange('ALL')}
                    className="filter-tag__remove"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedPortfolio !== 'ALL' && (
                <span className="filter-tag">
                  Portfolio: {portfolios?.find(p => p.id === selectedPortfolio)?.name || selectedPortfolio}
                  <button
                    onClick={() => handlePortfolioChange('ALL')}
                    className="filter-tag__remove"
                  >
                    ✕
                  </button>
                </span>
              )}
              {hasTrades !== undefined && (
                <span className="filter-tag">
                  Has Trades: {hasTrades ? 'Yes' : 'No'}
                  <button
                    onClick={() => handleHasTradesChange(undefined)}
                    className="filter-tag__remove"
                  >
                    ✕
                  </button>
                </span>
              )}
              {valueRange.min && (
                <span className="filter-tag">
                  Min: {valueRange.min}
                  <button
                    onClick={() => handleValueRangeChange('min', '')}
                    className="filter-tag__remove"
                  >
                    ✕
                  </button>
                </span>
              )}
              {valueRange.max && (
                <span className="filter-tag">
                  Max: {valueRange.max}
                  <button
                    onClick={() => handleValueRangeChange('max', '')}
                    className="filter-tag__remove"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetFilters;
