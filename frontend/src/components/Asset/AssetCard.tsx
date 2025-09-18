/**
 * Asset Card Component
 * Displays individual asset information in a card format
 */

import React from 'react';
import { Asset } from '../../types/asset.types';
import { 
  formatCurrency, 
  formatPercentage,
  formatNumber
} from '../../utils/format';
import { AssetTypeLabels } from '../../types/asset.types';
import { useAccount } from '../../hooks/useAccount';
import { AssetPerformance } from './AssetPerformance';
import './AssetCard.styles.css';

export interface AssetCardProps {
  asset: Asset;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  compact = false,
  className = '',
}) => {
  const { baseCurrency } = useAccount();
  const performance = {
    valueChange: (Number(asset.totalValue) || 0) - (Number(asset.initialValue) || 0),
    valueChangePercentage: asset.initialValue ? (((Number(asset.totalValue) || 0) - (Number(asset.initialValue) || 0)) / (Number(asset.initialValue) || 1)) * 100 : 0,
    isGaining: (Number(asset.totalValue) || 0) > (Number(asset.initialValue) || 0),
    isLosing: (Number(asset.totalValue) || 0) < (Number(asset.initialValue) || 0),
  };

  const handleCardClick = () => {
    onView?.(asset);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(asset);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(asset);
  };

  return (
    <div 
      className={`asset-card ${compact ? 'asset-card--compact' : ''} ${className}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="asset-card__header">
        <div className="asset-card__title">
          <h3 className="asset-card__name">{asset.name}</h3>
          {asset.symbol && (
            <span className="asset-card__code">{asset.symbol}</span>
          )}
        </div>
        
        <div className="asset-card__type">
          <span className={`asset-type asset-type--${asset.type.toLowerCase()}`}>
            {AssetTypeLabels[asset.type as keyof typeof AssetTypeLabels] || asset.type}
          </span>
        </div>
      </div>

      {/* Description */}
      {asset.description && !compact && (
        <div className="asset-card__description">
          <p>{asset.description}</p>
        </div>
      )}

      {/* Content */}
      <div className="asset-card__content">
        {/* Value Information */}
        <div className="asset-card__value">
          <div className="value-item">
            <label>Total Value</label>
            <span className="value-item__primary">
              {formatCurrency(Number(asset.totalValue) || 0, baseCurrency)}
            </span>
            {asset.currentValue && asset.currentValue !== asset.initialValue && (
              <span className="value-item__secondary">
                Initial: {formatCurrency(asset.initialValue || 0, baseCurrency)}
              </span>
            )}
          </div>

          <div className="value-item">
            <label>Current Price</label>
            <span className="value-item__primary">
              {formatCurrency(asset.currentPrice || 0, baseCurrency)}
            </span>
            {asset.currentPrice && (
              <span className="value-item__secondary">
                Market Price
              </span>
            )}
          </div>

          <div className="value-item">
            <label>Quantity</label>
            <span className="value-item__primary">
              {formatNumber(Number(asset.totalQuantity) || 0, 2)}
            </span>
            {asset.currentQuantity && asset.currentQuantity !== asset.initialQuantity && (
              <span className="value-item__secondary">
                Initial: {formatNumber(asset.initialQuantity || 0, 2)}
              </span>
            )}
          </div>
        </div>

        {/* Performance */}
        <div className="asset-card__performance">
          <div className="performance-item">
            <label>Performance</label>
            <div className={`performance ${performance.isGaining ? 'performance--positive' : performance.isLosing ? 'performance--negative' : ''}`}>
              <span className="performance__value">
                {formatCurrency(performance.valueChange, baseCurrency)}
              </span>
              <span className="performance__percentage">
                {formatPercentage(performance.valueChangePercentage, 2)}
              </span>
            </div>
          </div>
          
          {/* Real-time Performance Metrics */}
          {asset.performance && (
            <div className="performance-metrics">
              <AssetPerformance 
                performance={asset.performance} 
                compact={true}
                showLabels={true}
                className="mt-2"
              />
            </div>
          )}
        </div>

        {/* Additional Info */}
        {!compact && (
          <div className="asset-card__info">
            <div className="info-item">
              <label>Created</label>
              <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Updated</label>
              <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <label>Has Trades</label>
              <span className={asset.hasTrades ? 'status status--active' : 'status status--inactive'}>
                {asset.hasTrades ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="asset-card__actions">
          <button
            onClick={handleEditClick}
            className="btn btn--small btn--secondary"
            title="Edit Asset"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDeleteClick}
            className="btn btn--small btn--danger"
            title="Delete Asset"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Status Indicators */}
      <div className="asset-card__indicators">
        {asset.hasTrades && (
          <span className="indicator indicator--trades" title="Has trading activity">
            📈
          </span>
        )}
        {performance.isGaining && (
          <span className="indicator indicator--gaining" title="Positive performance">
            📈
          </span>
        )}
        {performance.isLosing && (
          <span className="indicator indicator--losing" title="Negative performance">
            📉
          </span>
        )}
      </div>
    </div>
  );
};

export default AssetCard;
