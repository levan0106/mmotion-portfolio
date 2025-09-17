/**
 * Asset Analytics Component
 * Displays analytics and charts for assets
 */

import React from 'react';
import { Asset, AssetType } from '../../types/asset.types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { useAccount } from '../../hooks/useAccount';
import './AssetAnalytics.styles.css';

export interface AssetAnalyticsProps {
  assets: Asset[];
  statistics: {
    totalAssets: number;
    totalValue: number;
    averageValue: number;
    assetsByType: Record<AssetType, number>;
  };
  onClose?: () => void;
  className?: string;
}

export const AssetAnalytics: React.FC<AssetAnalyticsProps> = ({
  assets,
  statistics,
  onClose,
  className = '',
}) => {
  const { baseCurrency } = useAccount();
  // Calculate performance metrics
  const performanceMetrics = React.useMemo(() => {
    const totalDailyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.daily) || 0), 0);
    const totalWeeklyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.weekly) || 0), 0);
    const totalMonthlyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.monthly) || 0), 0);
    const totalYearlyReturn = assets.reduce((sum, asset) => sum + (Number(asset.performance?.yearly) || 0), 0);

    return {
      averageDailyReturn: assets.length > 0 ? totalDailyReturn / assets.length : 0,
      averageWeeklyReturn: assets.length > 0 ? totalWeeklyReturn / assets.length : 0,
      averageMonthlyReturn: assets.length > 0 ? totalMonthlyReturn / assets.length : 0,
      averageYearlyReturn: assets.length > 0 ? totalYearlyReturn / assets.length : 0,
    };
  }, [assets]);

  // Calculate value distribution
  const valueDistribution = React.useMemo(() => {
    const ranges = [
      { label: 'Under ₫10K', min: 0, max: 10000, count: 0 },
      { label: '₫10K - ₫50K', min: 10000, max: 50000, count: 0 },
      { label: '₫50K - ₫100K', min: 50000, max: 100000, count: 0 },
      { label: '₫100K - ₫500K', min: 100000, max: 500000, count: 0 },
      { label: 'Over ₫500K', min: 500000, max: Infinity, count: 0 },
    ];

    assets.forEach(asset => {
      const value = Number(asset.totalValue) || 0;
      const range = ranges.find(r => value >= r.min && value < r.max);
      if (range) {
        range.count++;
      }
    });

    return ranges;
  }, [assets]);

  // Calculate top performers
  const topPerformers = React.useMemo(() => {
    return [...assets]
      .filter(asset => asset.performance?.yearly !== undefined)
      .sort((a, b) => (b.performance?.yearly || 0) - (a.performance?.yearly || 0))
      .slice(0, 5);
  }, [assets]);

  return (
    <div className={`asset-analytics ${className}`}>
      <div className="asset-analytics__header">
        <h3>Asset Analytics</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn--secondary btn--icon"
            aria-label="Close analytics"
          >
            ✕
          </button>
        )}
      </div>

      <div className="asset-analytics__content">
        {/* Performance Overview */}
        <div className="analytics-section">
          <h4>Performance Overview</h4>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-card__value">
                {performanceMetrics.averageDailyReturn.toFixed(2)}%
              </div>
              <div className="metric-card__label">Avg Daily Return</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">
                {performanceMetrics.averageWeeklyReturn.toFixed(2)}%
              </div>
              <div className="metric-card__label">Avg Weekly Return</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">
                {performanceMetrics.averageMonthlyReturn.toFixed(2)}%
              </div>
              <div className="metric-card__label">Avg Monthly Return</div>
            </div>
            <div className="metric-card">
              <div className="metric-card__value">
                {performanceMetrics.averageYearlyReturn.toFixed(2)}%
              </div>
              <div className="metric-card__label">Avg Yearly Return</div>
            </div>
          </div>
        </div>

        {/* Asset Type Distribution */}
        <div className="analytics-section">
          <h4>Asset Type Distribution</h4>
          <div className="distribution-chart">
            {Object.entries(statistics.assetsByType).map(([type, count]) => {
              const percentage = statistics.totalAssets > 0 ? (count / statistics.totalAssets) * 100 : 0;
              return (
                <div key={type} className="distribution-item">
                  <div className="distribution-item__label">
                    <span className="distribution-item__type">{type}</span>
                    <span className="distribution-item__count">{count}</span>
                  </div>
                  <div className="distribution-item__bar">
                    <div
                      className="distribution-item__fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="distribution-item__percentage">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value Distribution */}
        <div className="analytics-section">
          <h4>Value Distribution</h4>
          <div className="distribution-chart">
            {valueDistribution.map((range, index) => {
              const percentage = statistics.totalAssets > 0 ? (range.count / statistics.totalAssets) * 100 : 0;
              return (
                <div key={index} className="distribution-item">
                  <div className="distribution-item__label">
                    <span className="distribution-item__type">{range.label}</span>
                    <span className="distribution-item__count">{range.count}</span>
                  </div>
                  <div className="distribution-item__bar">
                    <div
                      className="distribution-item__fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="distribution-item__percentage">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className="analytics-section">
          <h4>Top Performers (Yearly)</h4>
          <div className="performers-list">
            {topPerformers.map((asset, index) => (
              <div key={asset.id} className="performer-item">
                <div className="performer-item__rank">#{index + 1}</div>
                <div className="performer-item__info">
                  <div className="performer-item__name">{asset.name}</div>
                  <div className="performer-item__code">{asset.symbol}</div>
                </div>
                <div className="performer-item__performance">
                  <div className={`performer-item__return ${
                    (asset.performance?.yearly || 0) >= 0 ? 'positive' : 'negative'
                  }`}>
                    {formatPercentage(asset.performance?.yearly || 0, 2)}
                  </div>
                  <div className="performer-item__value">{formatCurrency(Number(asset.totalValue) || 0, baseCurrency)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetAnalytics;