// SnapshotTimelineView Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import { useSnapshotTimeline, useSnapshotAggregatedTimeline } from '../../hooks/useSnapshots';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { formatPercentage, formatNumber, formatDateTime } from '../../utils/format';
import './SnapshotTimelineView.styles.css';

interface SnapshotTimelineViewProps {
  portfolioId: string;
  startDate: string;
  endDate: string;
  granularity?: SnapshotGranularity;
  showDetails?: boolean;
  showFilters?: boolean;
  maxItems?: number;
}

export const SnapshotTimelineView: React.FC<SnapshotTimelineViewProps> = ({
  portfolioId,
  startDate,
  endDate,
  granularity = SnapshotGranularity.DAILY,
  showDetails = true,
  showFilters = true,
  maxItems = 50,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'calendar' | 'portfolio'>('calendar');

  // Get detailed timeline data
  const timelineQuery = useMemo(() => ({
    portfolioId,
    startDate,
    endDate,
    granularity,
  }), [portfolioId, startDate, endDate, granularity]);

  const {
    timelineData,
    loading: timelineLoading,
    error: timelineError,
  } = useSnapshotTimeline(timelineQuery);

  // Get aggregated timeline data
  const {
    // aggregatedData,
    loading: aggregatedLoading,
    error: aggregatedError,
  } = useSnapshotAggregatedTimeline(portfolioId, startDate, endDate, granularity);

  const processedData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return [];

    // Group by date
    const groupedData = timelineData.reduce((acc, snapshot) => {
      const date = snapshot.snapshotDate;
      if (!acc[date]) {
        acc[date] = {
          date,
          snapshots: [],
          totalValue: 0,
          totalPl: 0,
          assetCount: 0,
        };
      }
      acc[date].snapshots.push(snapshot);
      acc[date].totalValue += snapshot.currentValue;
      acc[date].totalPl += snapshot.totalPl;
      acc[date].assetCount += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, maxItems);
  }, [timelineData, maxItems]);

  const uniqueAssets = useMemo(() => {
    if (!timelineData) return [];
    const assets = new Set(timelineData.map(s => s.assetSymbol));
    return Array.from(assets).sort();
  }, [timelineData]);

  const filteredData = useMemo(() => {
    let filtered = processedData;

    if (selectedDate) {
      filtered = filtered.filter(item => item.date === selectedDate);
    }

    if (selectedAsset) {
      filtered = filtered.map(item => ({
        ...item,
        snapshots: item.snapshots.filter((s: any) => s.assetSymbol === selectedAsset),
      })).filter(item => item.snapshots.length > 0);
    }

    return filtered;
  }, [processedData, selectedDate, selectedAsset]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Remove local formatPercentage function, use imported one

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Remove local formatDateTime function, use imported one

  const getGranularityColor = (granularity: SnapshotGranularity) => {
    switch (granularity) {
      case SnapshotGranularity.DAILY:
        return '#1976d2';
      case SnapshotGranularity.WEEKLY:
        return '#7b1fa2';
      case SnapshotGranularity.MONTHLY:
        return '#388e3c';
      default:
        return '#6c757d';
    }
  };

  const getGranularityIcon = (granularity: SnapshotGranularity) => {
    switch (granularity) {
      case SnapshotGranularity.DAILY:
        return '📅';
      case SnapshotGranularity.WEEKLY:
        return '📊';
      case SnapshotGranularity.MONTHLY:
        return '📈';
      default:
        return '📋';
    }
  };

  if (timelineLoading || aggregatedLoading) {
    return (
      <div className="timeline-loading">
        <div className="loading-spinner" />
        <p>Loading timeline data...</p>
      </div>
    );
  }

  if (timelineError || aggregatedError) {
    return (
      <div className="timeline-error">
        <p>Error loading timeline: {timelineError || aggregatedError}</p>
      </div>
    );
  }

  const renderTimelineView = () => {
    return (
      <div className="timeline-container">
        {filteredData.map((dayData) => (
          <div key={dayData.date} className="timeline-day">
            <div className="timeline-day-header">
              <div className="day-date">
                <span className="date">{formatDate(dayData.date)}</span>
                <span 
                  className="granularity-badge"
                  style={{ backgroundColor: getGranularityColor(granularity) }}
                >
                  {getGranularityIcon(granularity)} {granularity}
                </span>
              </div>
              <div className="day-summary">
                <div className="summary-item">
                  <span className="label">Total Value:</span>
                  <span className="value">{formatCurrency(dayData.totalValue)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Total P&L:</span>
                  <span className={`value ${dayData.totalPl >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(dayData.totalPl)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Assets:</span>
                  <span className="value">{dayData.assetCount}</span>
                </div>
              </div>
            </div>

            {showDetails && (
              <div className="timeline-day-details">
                <div className="snapshots-grid">
                  {dayData.snapshots.map((snapshot: any) => (
                    <div key={snapshot.id} className="snapshot-card">
                      <div className="snapshot-header">
                        <div className="asset-info">
                          <span className="asset-symbol">{snapshot.assetSymbol}</span>
                          <span className="asset-id">{snapshot.assetId.slice(0, 8)}...</span>
                        </div>
                        <div className="snapshot-status">
                          <span className={`status ${snapshot.isActive ? 'active' : 'inactive'}`}>
                            {snapshot.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="snapshot-metrics">
                        <div className="metric-row">
                          <span className="label">Quantity:</span>
                          <span className="value">{formatNumber(snapshot.quantity, 0)}</span>
                        </div>
                        <div className="metric-row">
                          <span className="label">Price:</span>
                          <span className="value">{formatCurrency(snapshot.currentPrice)}</span>
                        </div>
                        <div className="metric-row">
                          <span className="label">Value:</span>
                          <span className="value">{formatCurrency(snapshot.currentValue)}</span>
                        </div>
                        <div className="metric-row">
                          <span className="label">P&L:</span>
                          <span className={`value ${snapshot.totalPl >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(snapshot.totalPl)}
                          </span>
                        </div>
                        <div className="metric-row">
                          <span className="label">Return:</span>
                          <span className={`value ${snapshot.returnPercentage >= 0 ? 'positive' : 'negative'}`}>
                            {formatPercentage(snapshot.returnPercentage)}
                          </span>
                        </div>
                        <div className="metric-row">
                          <span className="label">Allocation:</span>
                          <span className="value">{formatPercentage(snapshot.allocationPercentage)}</span>
                        </div>
                      </div>

                      {snapshot.notes && (
                        <div className="snapshot-notes">
                          <span className="notes-label">Notes:</span>
                          <span className="notes-content">{snapshot.notes}</span>
                        </div>
                      )}

                      <div className="snapshot-footer">
                        <span className="created-by">
                          Created by: {snapshot.createdBy || 'System'}
                        </span>
                        <span className="created-at">
                          {formatDateTime(snapshot.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="grid-container">
        <div className="grid-header">
          <div className="grid-cell">Date</div>
          <div className="grid-cell">Asset</div>
          <div className="grid-cell">Quantity</div>
          <div className="grid-cell">Price</div>
          <div className="grid-cell">Value</div>
          <div className="grid-cell">P&L</div>
          <div className="grid-cell">Return %</div>
          <div className="grid-cell">Allocation %</div>
        </div>
        
        {filteredData.map((dayData) =>
          dayData.snapshots.map((snapshot: any) => (
            <div key={snapshot.id} className="grid-row">
              <div className="grid-cell">{formatDate(snapshot.snapshotDate)}</div>
              <div className="grid-cell">
                <span className="asset-symbol">{snapshot.assetSymbol}</span>
              </div>
              <div className="grid-cell">{formatNumber(snapshot.quantity, 0)}</div>
              <div className="grid-cell">{formatCurrency(snapshot.currentPrice)}</div>
              <div className="grid-cell">{formatCurrency(snapshot.currentValue)}</div>
              <div className={`grid-cell ${snapshot.totalPl >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(snapshot.totalPl)}
              </div>
              <div className={`grid-cell ${snapshot.returnPercentage >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(snapshot.returnPercentage)}
              </div>
              <div className="grid-cell">{formatPercentage(snapshot.allocationPercentage)}</div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="calendar-container">
        <div className="calendar-grid">
          {filteredData.map((dayData) => (
            <div key={dayData.date} className="calendar-day">
              <div className="calendar-day-header">
                <span className="day-date">{formatDate(dayData.date)}</span>
                <span className="day-count">{dayData.assetCount} assets</span>
              </div>
              <div className="calendar-day-content">
                <div className="day-value">{formatCurrency(dayData.totalValue)}</div>
                <div className={`day-pl ${dayData.totalPl >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(dayData.totalPl)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPortfolioView = () => {
    return (
      <div className="portfolio-container">
        {filteredData.map((dayData) => (
          <div key={dayData.date} className="portfolio-day">
            <div className="portfolio-day-header">
              <div className="day-info">
                <span className="day-date">{formatDate(dayData.date)}</span>
                <span 
                  className="granularity-badge"
                  style={{ backgroundColor: getGranularityColor(granularity) }}
                >
                  {getGranularityIcon(granularity)} {granularity}
                </span>
              </div>
              <div className="portfolio-summary">
                <div className="summary-item">
                  <span className="label">Value:</span>
                  <span className="value">{formatCurrency(dayData.totalValue)}</span>
                </div>
                <div className="summary-item">
                  <span className="label">P&L:</span>
                  <span className={`value ${dayData.totalPl >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(dayData.totalPl)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Assets:</span>
                  <span className="value">{dayData.assetCount}</span>
                </div>
              </div>
            </div>

            {showDetails && (
              <div className="portfolio-day-details">
                <div className="portfolio-metrics">
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-label">Cash</div>
                      <div className="metric-value">
                        {formatCurrency(dayData.totalValue * 0.1)}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Invested</div>
                      <div className="metric-value">
                        {formatCurrency(dayData.totalValue * 0.9)}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Daily</div>
                      <div className="metric-value">
                        {formatPercentage(2.5)}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">Volatility</div>
                      <div className="metric-value">
                        {formatPercentage(15.2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="asset-allocation">
                  <h4>Allocation</h4>
                  <div className="allocation-chart">
                    <div className="allocation-item">
                      <span className="allocation-type">Stocks</span>
                      <div className="allocation-bar">
                        <div className="allocation-fill" style={{ width: '60%' }}></div>
                      </div>
                      <span className="allocation-percentage">60%</span>
                    </div>
                    <div className="allocation-item">
                      <span className="allocation-type">Crypto</span>
                      <div className="allocation-bar">
                        <div className="allocation-fill" style={{ width: '25%' }}></div>
                      </div>
                      <span className="allocation-percentage">25%</span>
                    </div>
                    <div className="allocation-item">
                      <span className="allocation-type">Cash</span>
                      <div className="allocation-bar">
                        <div className="allocation-fill" style={{ width: '15%' }}></div>
                      </div>
                      <span className="allocation-percentage">15%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="snapshot-timeline-view">
      <div className="timeline-header">
        <h2>Portfolio Timeline</h2>
        <div className="timeline-controls">
          {showFilters && (
            <>
              <div className="filter-group">
                <label htmlFor="dateFilter">Filter by Date:</label>
                <select
                  id="dateFilter"
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                >
                  <option value="">All Dates</option>
                  {processedData.map((day) => (
                    <option key={day.date} value={day.date}>
                      {formatDate(day.date)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="assetFilter">Filter by Asset:</label>
                <select
                  id="assetFilter"
                  value={selectedAsset || ''}
                  onChange={(e) => setSelectedAsset(e.target.value || null)}
                >
                  <option value="">All Assets</option>
                  {uniqueAssets.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="view-controls">
            <label>View Mode:</label>
            <div className="view-buttons">
              <button
                className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setViewMode('timeline')}
              >
                Timeline
              </button>
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button
                className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
              <button
                className={`view-btn ${viewMode === 'portfolio' ? 'active' : ''}`}
                onClick={() => setViewMode('portfolio')}
              >
                Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="timeline-content">
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'calendar' && renderCalendarView()}
        {viewMode === 'portfolio' && renderPortfolioView()}
      </div>

      {filteredData.length === 0 && (
        <div className="timeline-empty">
          <p>No snapshot data available for the selected criteria</p>
        </div>
      )}
    </div>
  );
};
