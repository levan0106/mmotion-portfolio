/**
 * Asset Management Page
 * Main page for managing assets with comprehensive functionality
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Asset, AssetType, AssetFilters } from '../types/asset.types';
import { useAssets } from '../hooks/useAssets';
import { AssetList } from '../components/Asset/AssetList';
import { AssetCard } from '../components/Asset/AssetCard';
import { AssetFilters as AssetFiltersComponent } from '../components/Asset/AssetFilters';
import { AssetAnalytics } from '../components/Asset/AssetAnalytics';
import { AssetDetailsModal } from '../components/Asset/AssetDetailsModal';
import { AssetDeleteWarningDialog } from '../components/Asset/AssetDeleteWarningDialog';
import { AssetFormModal } from '../components/Asset/AssetFormModal';
import { assetService } from '../services/asset.service';
import { apiService } from '../services/api';
import { formatCurrency } from '../utils/format';
import { useAccount } from '../contexts/AccountContext';
import './AssetManagement.styles.css';

export interface AssetManagementPageProps {
  portfolioId?: string;
  className?: string;
}

export const AssetManagementPage: React.FC<AssetManagementPageProps> = ({
  portfolioId,
  className = '',
}) => {
  const { baseCurrency, accountId } = useAccount();
  const [searchParams] = useSearchParams();
  
  // Get portfolioId from URL query parameters - should always be UUID
  const urlPortfolioId = searchParams.get('portfolioId');
  const resolvedPortfolioId = urlPortfolioId || portfolioId || null;
  // View state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Selected asset state
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isForceDeleting, setIsForceDeleting] = useState(false);
  const [assetToForceDelete, setAssetToForceDelete] = useState<Asset | null>(null);
  const [tradeCount, setTradeCount] = useState(0);
  const [portfolioInfo, setPortfolioInfo] = useState<Array<{ id: string; name: string }>>([]);

  // Error state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters state
  const initialFilters = useMemo(() => ({
    portfolioId: resolvedPortfolioId || undefined,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC' as const,
  }), [resolvedPortfolioId]);
  
  const [filters, setFilters] = useState<AssetFilters>(initialFilters);

  // Use assets hook
  const {
    assets,
    loading: assetsLoading,
    error,
    pagination,
    setFilters: setApiFilters,
    clearFilters,
    refresh,
    forceRefresh,
    goToPage,
    setPageSize,
    updateAsset,
    createAsset,
  } = useAssets({ 
    initialFilters, 
    autoFetch: true 
  });

  // Combined loading state
  const loading = assetsLoading;


  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: AssetFilters) => {
    setFilters(newFilters);
    setApiFilters(newFilters);
  }, [setApiFilters]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    clearFilters();
  }, [initialFilters, clearFilters]);

  // Handle view mode toggle
  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  }, []);

  // Handle filters toggle
  const handleFiltersToggle = useCallback((show: boolean) => {
    setShowFilters(show);
  }, []);

  // Handle analytics toggle
  const handleAnalyticsToggle = useCallback(() => {
    setShowAnalytics(prev => !prev);
  }, []);

  // Handle create form toggle
  const handleCreateFormToggle = useCallback(() => {
    setShowCreateForm(prev => !prev);
  }, []);

  // Handle asset selection
  const handleAssetSelect = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
  }, []);

  // Handle asset edit
  const handleAssetEdit = useCallback((asset: Asset) => {
    console.log('handleAssetEdit called with asset:', asset);
    setEditingAsset(asset);
  }, []);

  // Handle asset delete - will be defined after handleAssetDeleteConfirm


  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setSelectedAsset(null);
    setEditingAsset(null);
    setShowCreateForm(false);
    setFormError(null);
  }, []);

  // Check if symbol already exists for current user
  const checkSymbolExists = useCallback(async (symbol: string, excludeId?: string): Promise<boolean> => {
    try {
      // First check in current assets array
      const existingAssets = assets.filter(asset => 
        asset.symbol?.toLowerCase() === symbol.toLowerCase() && 
        asset.id !== excludeId
      );
      
      if (existingAssets.length > 0) {
        return true;
      }
      
      // If not found in current assets, check via API
      // This ensures we catch symbols that might not be loaded in current view
      try {
        const response = await apiService.api.get(`/api/v1/assets?symbol=${encodeURIComponent(symbol)}&createdBy=${accountId}`);
        const apiAssets = response.data.data || response.data; // Handle different response formats
        return Array.isArray(apiAssets) && apiAssets.length > 0;
      } catch (error) {
        // If API call fails, assume symbol doesn't exist
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking symbol:', error);
      return false;
    }
  }, [assets, accountId]);

  // Handle asset form submit
  const handleAssetFormSubmit = useCallback(async (assetData: any) => {
    setIsSubmitting(true);
    setFormError(null);
    
    try {

      // Validate symbol uniqueness for create mode
      if (!editingAsset && assetData.symbol) {
        const symbolExists = await checkSymbolExists(assetData.symbol);
        if (symbolExists) {
          setFormError('Mã tài sản này đã tồn tại. Vui lòng chọn mã khác.');
          setIsSubmitting(false);
          return;
        }
      }
      
      if (editingAsset) {
        // Update existing asset - only send fields that can be updated
        // Exclude computed fields as they are calculated automatically
        const updateData: any = {
          name: assetData.name,
          symbol: assetData.symbol,
          type: assetData.type,
          description: assetData.description,
          updatedBy: assetData.updatedBy || accountId,
        };
        
        // Remove undefined values, but keep empty strings for description
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
          // Keep empty strings for description field to allow clearing it
          if (key === 'description' && updateData[key] === '') {
            // Keep the empty string for description
          } else if (updateData[key] === '') {
            delete updateData[key];
          }
        });
        
        await updateAsset(editingAsset.id, updateData);
      } else {
        // Create new asset - exclude computed fields
        const createData: any = {
          name: assetData.name,
          symbol: assetData.symbol,
          type: assetData.type,
          description: assetData.description,
          createdBy: assetData.createdBy || accountId,
          updatedBy: assetData.updatedBy || accountId,
        };
        
        // Remove undefined values
        Object.keys(createData).forEach(key => {
          if (createData[key] === undefined || createData[key] === '') {
            delete createData[key];
          }
        });
        
        await createAsset(createData);
      }
      
      // Close dialog
      handleDialogClose();
    } catch (error) {
      console.error('Error saving asset:', error);
      
      // Parse error message for better user experience
      let errorMessage = 'Có lỗi xảy ra khi lưu tài sản';
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          errorMessage = 'Mã tài sản này đã tồn tại. Vui lòng chọn mã khác.';
        } else if (error.message.includes('required')) {
          errorMessage = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
        } else if (error.message.includes('invalid')) {
          errorMessage = 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingAsset, updateAsset, createAsset, handleDialogClose, accountId]);


  // Handle asset delete
  const handleAssetDelete = useCallback(async (asset: Asset) => {
    try {
      // Get portfolio and trade info using accountId
      const portfolioInfo = await assetService.getAssetPortfolioInfo(asset.id, accountId);

      // Set asset and trade count for modal
      setAssetToForceDelete(asset);
      setTradeCount(portfolioInfo.tradingCount);
      setPortfolioInfo(portfolioInfo.portfolios);
      setShowDeleteWarning(true);
    } catch (error) {
      console.error('Error getting portfolio info:', error);
      alert(`Error getting portfolio information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [accountId]);

  // Handle delete confirmation (for both cases)
  const handleForceDeleteConfirm = useCallback(async () => {
    if (!assetToForceDelete) return;

    setIsForceDeleting(true);
    try {
      if (tradeCount > 0) {
        // Asset has trades, use force delete
        await assetService.forceDeleteAsset(assetToForceDelete.id);
      } else {
        // Asset has no trades, use normal delete
        await assetService.deleteAsset(assetToForceDelete.id, accountId);
      }

      // Small delay to ensure API call completes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force refresh from server to ensure data consistency
      await forceRefresh();

      // Additional refresh to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      await forceRefresh();

      // Close dialogs after refresh is complete
      setShowDeleteWarning(false);
      setAssetToForceDelete(null);
      handleDialogClose();
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert(`Error deleting asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsForceDeleting(false);
    }
  }, [assetToForceDelete, tradeCount, forceRefresh, handleDialogClose]);

  // Handle force delete cancellation
  const handleForceDeleteCancel = useCallback(() => {
    setShowDeleteWarning(false);
    setAssetToForceDelete(null);
    setTradeCount(0);
  }, []);

  // Memoized statistics
  const statistics = useMemo(() => {
    const totalAssets = assets.length;
    const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.totalValue) || 0), 0);
    const averageValue = totalAssets > 0 ? totalValue / totalAssets : 0;
    
    const assetsByType = assets.reduce((acc, asset) => {
      (acc as any)[asset.type] = ((acc as any)[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<AssetType, number>);

    return {
      totalAssets,
      totalValue,
      averageValue,
      assetsByType,
    };
  }, [assets]);

  // Render loading state
  if (loading && assets.length === 0) {
    return (
      <div className={`asset-management ${className}`}>
        <div className="asset-management__loading">
          <div className="spinner" />
          <p>Loading assets...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`asset-management ${className}`}>
        <div className="asset-management__error">
          <h2>Error Loading Assets</h2>
          <p>{error}</p>
          <button onClick={refresh} className="btn btn--primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`asset-management asset-management--compact ${className}`}>
      {/* Header */}
      <div className="asset-management__header">
        <div className="asset-management__title">
          <h1>Asset Management</h1>
          <p>Manage your portfolio assets</p>
        </div>

        <div className="asset-management__actions">
          <button
            onClick={handleAnalyticsToggle}
            className={`btn btn--outline ${showAnalytics ? 'btn--active' : ''}`}
          >
            Analytics
          </button>
          <button
            onClick={handleCreateFormToggle}
            className="btn btn--primary"
          >
            Add Asset
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="asset-management__stats">
        <div className="stat-card">
          <div className="stat-card__value">{statistics.totalAssets}</div>
          <div className="stat-card__label">Total Assets</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{formatCurrency(statistics.totalValue, baseCurrency)}</div>
          <div className="stat-card__label">Total Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{formatCurrency(statistics.averageValue, baseCurrency)}</div>
          <div className="stat-card__label">Average Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{Object.keys(statistics.assetsByType).length}</div>
          <div className="stat-card__label">Asset Types</div>
        </div>
      </div>

      {/* Analytics */}
      {showAnalytics && (
        <div className="asset-management__analytics">
          <AssetAnalytics
            assets={assets}
            statistics={statistics}
            onClose={handleAnalyticsToggle}
          />
        </div>
      )}

      {/* Filters */}
      <AssetFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        showAdvanced={showFilters}
        onToggleAdvanced={handleFiltersToggle}
        className="asset-management__filters"
      />

      {/* Controls */}
      <div className="asset-management__controls">
        <div className="asset-management__view-controls">
          <button
            onClick={handleViewModeToggle}
            className={`btn btn--outline ${viewMode === 'list' ? 'btn--active' : ''}`}
          >
            List
          </button>
          <button
            onClick={handleViewModeToggle}
            className={`btn btn--outline ${viewMode === 'grid' ? 'btn--active' : ''}`}
          >
            Grid
          </button>
        </div>

        <div className="asset-management__pagination-info">
          <div className="pagination-summary">
            <span className="pagination-summary__text">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              <strong>{pagination.total}</strong> assets
            </span>
            <span className="pagination-summary__page">
              Page {pagination.page} of {Math.ceil(pagination.total / Number(pagination.limit))}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="asset-management__content">
        {viewMode === 'list' ? (
          <AssetList
            portfolioId={portfolioId}
            initialFilters={filters}
            assets={assets}
            loading={loading}
            error={error}
            onAssetSelect={handleAssetSelect}
            onAssetEdit={handleAssetEdit}
            onAssetDelete={handleAssetDelete}
            showActions={true}
            className="asset-management__list"
          />
        ) : (
          <div className="asset-management__grid">
            {assets.length === 0 ? (
              <div className="asset-management__empty">
                <div className="empty-state">
                  <div className="empty-state__icon">📊</div>
                  <h3>No Assets Found</h3>
                  <p>No assets match your current filters. Try adjusting your search criteria.</p>
                  <button onClick={handleClearFilters} className="btn btn--primary">
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="asset-grid">
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleAssetEdit}
                    onDelete={handleAssetDelete}
                    onView={handleAssetSelect}
                    showActions={true}
                    className="asset-grid__item"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="asset-management__pagination">
          <div className="pagination-controls">
            <button
              onClick={() => goToPage(Number(pagination.page) - 1)}
              disabled={Number(pagination.page) <= 1}
              className="btn btn--outline"
            >
              Previous
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.ceil(pagination.total / Number(pagination.limit)) }, (_, i) => i + 1)
                .filter(page => {
                  const current = Number(pagination.page);
                  return page === 1 || page === current || page === current - 1 || page === current + 1 || page === Math.ceil(pagination.total / Number(pagination.limit));
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && <span style={{ padding: '0 8px', color: '#666' }}>...</span>}
                    <button
                      onClick={() => goToPage(Number(page))}
                      className={`btn ${page === Number(pagination.page) ? 'btn--primary' : 'btn--outline'}`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
            </div>

            <button
              onClick={() => goToPage(Number(pagination.page) + 1)}
              disabled={Number(pagination.page) >= Math.ceil(pagination.total / Number(pagination.limit))}
              className="btn btn--outline"
            >
              Next
            </button>
          </div>

          <div className="pagination-size">
            <label>Show:</label>
            <select
              value={pagination.limit}
              onChange={(e) => setPageSize(Number(e.target.value))}
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

      {/* View Asset Modal */}
      <AssetDetailsModal
        open={!!selectedAsset}
        onClose={handleDialogClose}
        asset={selectedAsset || null}
        onEdit={handleAssetEdit}
        onDelete={handleAssetDelete}
        loading={false}
      />

      {/* Create/Edit Form Modal */}
      <AssetFormModal
        open={!!(showCreateForm || editingAsset)}
        onClose={handleDialogClose}
        onSubmit={handleAssetFormSubmit}
        onCancel={handleDialogClose}
        loading={isSubmitting}
        error={formError}
        editingAsset={editingAsset}
        accountId={accountId}
      />

      {/* Delete Warning Dialog */}
      <AssetDeleteWarningDialog
        open={showDeleteWarning}
        assetName={assetToForceDelete?.name || ''}
        tradeCount={tradeCount}
        portfolios={portfolioInfo}
        onConfirm={handleForceDeleteConfirm}
        onCancel={handleForceDeleteCancel}
        isDeleting={isForceDeleting}
      />
    </div>
  );
};

export default AssetManagementPage;
