/**
 * Asset Performance Component
 * Displays real-time performance metrics for assets
 */

import React from 'react';
import { formatPerformance, getPerformanceColorClass } from '../../utils/performance.utils';
import './AssetPerformance.styles.css';

export interface AssetPerformanceProps {
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

export const AssetPerformance: React.FC<AssetPerformanceProps> = ({
  performance,
  className = '',
  showLabels = true,
  compact = false,
}) => {
  const performanceItems = [
    { key: 'daily', label: 'Hôm nay', value: performance.daily },
    { key: 'weekly', label: 'Tuần', value: performance.weekly },
    { key: 'monthly', label: 'Tháng', value: performance.monthly },
    { key: 'yearly', label: 'Năm', value: performance.yearly },
  ];

  if (compact) {
    return (
      <div className={`asset-performance asset-performance--compact ${className}`}>
        {performanceItems.map(({ key, label, value }) => (
          <div key={key} className="performance-metric performance-metric--compact">
            {showLabels && (
              <span className="performance-label">{label}:</span>
            )}
            <span className={`performance-value performance-value--compact ${getPerformanceColorClass(value)}`}>
              {formatPerformance(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`asset-performance asset-performance--grid ${className}`}>
      {performanceItems.map(({ key, label, value }) => (
        <div key={key} className="performance-metric">
          <div className="performance-label">{label}</div>
          <div className={`performance-value ${getPerformanceColorClass(value)}`}>
            {formatPerformance(value)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssetPerformance;
