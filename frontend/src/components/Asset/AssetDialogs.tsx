/**
 * Asset Dialogs Component
 * Handles view, edit, and delete dialogs for assets
 */

import React from 'react';
import { Asset } from '../../types/asset.types';
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/format';
import { useAccount } from '../../hooks/useAccount';
import './AssetDialogs.styles.css';

export interface AssetDialogsProps {
  selectedAsset?: Asset | null;
  editingAsset?: Asset | null;
  deletingAsset?: Asset | null;
  showCreateForm?: boolean;
  onClose: () => void;
  onSubmit?: (assetData: any) => Promise<void>;
  onDeleteConfirm: (asset: Asset) => void;
  onEditAsset?: (asset: Asset) => void;
  portfolioId?: string;
  className?: string;
}

export const AssetDialogs: React.FC<AssetDialogsProps> = ({
  selectedAsset,
  editingAsset: _editingAsset,
  deletingAsset,
  showCreateForm: _showCreateForm = false,
  onClose,
  onSubmit: _onSubmit,
  onDeleteConfirm,
  onEditAsset,
  portfolioId: _portfolioId,
  className = '',
}) => {
  const { baseCurrency } = useAccount();
  // Handle view dialog close
  const handleViewClose = () => {
    onClose();
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deletingAsset) {
      onDeleteConfirm(deletingAsset);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    onClose();
  };

  // Unused functions - kept for future implementation
  // const _handleFormSubmit = async (assetData: any) => {
  //   if (_onSubmit) {
  //     await _onSubmit(assetData);
  //   }
  // };

  // const _handleEditClose = () => {
  //   onClose();
  // };

  return (
    <div className={`asset-dialogs ${className}`}>
      {/* View Asset Dialog */}
      {selectedAsset && (
        <div className="modal-overlay" onClick={handleViewClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="asset-dialog">
              <div className="asset-dialog__header">
                <h3>Asset Details</h3>
                <button
                  onClick={handleViewClose}
                  className="btn btn--secondary btn--icon"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>
              
              <div className="asset-dialog__content">
                <div className="asset-details">
                  <div className="asset-details__section">
                    <h4>Basic Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Name</label>
                        <span>{selectedAsset.name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Symbol</label>
                        <span>{selectedAsset.symbol}</span>
                      </div>
                      <div className="detail-item">
                        <label>Type</label>
                        <span className={`asset-type-badge asset-type-badge--${selectedAsset.type.toLowerCase()}`}>
                          {selectedAsset.type}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Description</label>
                        <span>{selectedAsset.description || 'No description'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="asset-details__section">
                    <h4>Financial Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Current Price</label>
                        <span className="detail-value--highlight">
                          {formatCurrency(selectedAsset.currentPrice || selectedAsset.currentValue || 0, baseCurrency)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Average Cost</label>
                        <span>{formatCurrency(selectedAsset.avgCost || 0, baseCurrency)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Quantity</label>
                        <span>{formatNumber(selectedAsset.quantity || selectedAsset.totalQuantity || 0, 2)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Total Value</label>
                        <span className="detail-value--highlight">
                          {formatCurrency(Number(selectedAsset.totalValue) || 0, baseCurrency)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Initial Value</label>
                        <span>{formatCurrency(selectedAsset.initialValue || 0, baseCurrency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="asset-details__section">
                    <h4>Profit & Loss Analysis</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Unrealized P&L</label>
                        <span className={`detail-value ${(selectedAsset.currentPrice || 0) >= (selectedAsset.avgCost || 0) ? 'positive' : 'negative'}`}>
                          {formatCurrency(
                            ((selectedAsset.currentPrice || 0) - (selectedAsset.avgCost || 0)) * (selectedAsset.quantity || selectedAsset.totalQuantity || 0),
                            baseCurrency
                          )}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>P&L Percentage</label>
                        <span className={`detail-value ${(selectedAsset.currentPrice || 0) >= (selectedAsset.avgCost || 0) ? 'positive' : 'negative'}`}>
                          {selectedAsset.avgCost && selectedAsset.avgCost > 0 
                            ? formatPercentage(((selectedAsset.currentPrice || 0) - selectedAsset.avgCost) / selectedAsset.avgCost * 100, 2)
                            : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Cost Basis</label>
                        <span>{formatCurrency((selectedAsset.avgCost || 0) * (selectedAsset.quantity || selectedAsset.totalQuantity || 0), baseCurrency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="asset-details__section">
                    <h4>Performance</h4>
                    <div className="performance-grid">
                      {selectedAsset.performance ? (
                        <>
                          <div className="performance-item">
                            <label>Daily</label>
                            <span className={`performance-value ${
                              (selectedAsset.performance.daily || 0) >= 0 ? 'positive' : 'negative'
                            }`}>
                              {formatPercentage(selectedAsset.performance.daily || 0, 2)}
                            </span>
                          </div>
                          <div className="performance-item">
                            <label>Weekly</label>
                            <span className={`performance-value ${
                              (selectedAsset.performance.weekly || 0) >= 0 ? 'positive' : 'negative'
                            }`}>
                              {formatPercentage(selectedAsset.performance.weekly || 0, 2)}
                            </span>
                          </div>
                          <div className="performance-item">
                            <label>Monthly</label>
                            <span className={`performance-value ${
                              (selectedAsset.performance.monthly || 0) >= 0 ? 'positive' : 'negative'
                            }`}>
                              {formatPercentage(selectedAsset.performance.monthly || 0, 2)}
                            </span>
                          </div>
                          <div className="performance-item">
                            <label>Yearly</label>
                            <span className={`performance-value ${
                              (selectedAsset.performance.yearly || 0) >= 0 ? 'positive' : 'negative'
                            }`}>
                              {formatPercentage(selectedAsset.performance.yearly || 0, 2)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="performance-item">
                          <span>No performance data available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="asset-details__section">
                    <h4>Metadata</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Created</label>
                        <span>{new Date(selectedAsset.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <label>Last Updated</label>
                        <span>{new Date(selectedAsset.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <label>Asset ID</label>
                        <span>{selectedAsset.id}</span>
                      </div>
                      <div className="detail-item">
                        <label>Asset Class</label>
                        <span>{selectedAsset.assetClass}</span>
                      </div>
                      <div className="detail-item">
                        <label>Currency</label>
                        <span>{selectedAsset.currency}</span>
                      </div>
                      <div className="detail-item">
                        <label>Status</label>
                        <span className={`status-badge ${selectedAsset.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                          {selectedAsset.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="asset-dialog__actions">
                <button
                  onClick={() => {
                    if (onEditAsset && selectedAsset) {
                      onEditAsset(selectedAsset);
                    }
                  }}
                  className="btn btn--secondary"
                  disabled={!onEditAsset}
                  title="Edit this asset"
                >
                  ✏️ Edit Asset
                </button>
                <button
                  onClick={() => {
                    if (onDeleteConfirm && selectedAsset) {
                      onDeleteConfirm(selectedAsset);
                    }
                  }}
                  className="btn btn--danger"
                  title="Delete this asset"
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={handleViewClose}
                  className="btn btn--primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingAsset && (
        <div className="modal-overlay" onClick={handleDeleteCancel}>
          <div className="modal-content modal-content--small" onClick={(e) => e.stopPropagation()}>
            <div className="asset-dialog">
              <div className="asset-dialog__header">
                <h3>Delete Asset</h3>
                <button
                  onClick={handleDeleteCancel}
                  className="btn btn--secondary btn--icon"
                  aria-label="Close dialog"
                >
                  ✕
                </button>
              </div>
              
              <div className="asset-dialog__content">
                <div className="delete-confirmation">
                  <div className="delete-confirmation__icon">⚠️</div>
                  <h4>Are you sure you want to delete this asset?</h4>
                  <p>
                    This action cannot be undone. The asset <strong>{deletingAsset.name}</strong> ({deletingAsset.symbol}) 
                    will be permanently removed from your portfolio.
                  </p>
                  <div className="delete-confirmation__details">
                    <div className="detail-item">
                      <label>Total Value</label>
                      <span>{formatCurrency(Number(deletingAsset.totalValue) || 0, baseCurrency)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Quantity</label>
                      <span>{formatNumber(deletingAsset.quantity || deletingAsset.totalQuantity || 0, 2)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Type</label>
                      <span>{deletingAsset.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="asset-dialog__actions">
                <button
                  onClick={handleDeleteCancel}
                  className="btn btn--secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn btn--danger"
                >
                  Delete Asset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDialogs;