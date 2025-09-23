// SnapshotPerformanceChart Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { SnapshotResponse, SnapshotAggregation } from '../../types/snapshot.types';
import { formatPercentage } from '../../utils/format';
import './SnapshotPerformanceChart.styles.css';

interface SnapshotPerformanceChartProps {
  data: SnapshotResponse[] | SnapshotAggregation[];
  type?: 'line' | 'area' | 'composed';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showReferenceLine?: boolean;
  showCumulativeReturn?: boolean;
  showDailyReturn?: boolean;
  showTotalValue?: boolean;
  showReturnPercentage?: boolean;
}

export const SnapshotPerformanceChart: React.FC<SnapshotPerformanceChartProps> = ({
  data,
  type = 'line',
  height = 400,
  showLegend = true,
  showGrid = true,
  showReferenceLine = true,
  showCumulativeReturn = true,
  showDailyReturn = true,
  showTotalValue = true,
  showReturnPercentage = true,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'value' | 'return' | 'both'>('both');

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((item) => ({
        date: item.snapshotDate,
        totalValue: 'totalValue' in item ? item.totalValue : 0,
        returnPercentage: 'returnPercentage' in item ? item.returnPercentage : 0,
        dailyReturn: 'dailyReturn' in item ? item.dailyReturn : 0,
        cumulativeReturn: 'cumulativeReturn' in item ? item.cumulativeReturn : 0,
        totalPl: 'totalPl' in item ? item.totalPl : 0,
        assetCount: 'assetCount' in item ? item.assetCount : 1,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

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

  const calculatePerformanceMetrics = () => {
    if (processedData.length === 0) return null;

    const firstValue = processedData[0].totalValue as number;
    const lastValue = processedData[processedData.length - 1].totalValue as number;
    const totalReturn = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    const maxValue = Math.max(...processedData.map(d => d.totalValue as number));
    const minValue = Math.min(...processedData.map(d => d.totalValue as number));
    const maxDrawdown = firstValue > 0 ? ((maxValue - minValue) / maxValue) * 100 : 0;

    return {
      totalReturn,
      maxValue,
      minValue,
      maxDrawdown,
      volatility: processedData.length > 1 ? 
        Math.sqrt(processedData.reduce((sum, d, i) => {
          if (i === 0) return 0;
          const dailyReturn = ((d.totalValue as number) - (processedData[i-1].totalValue as number)) / (processedData[i-1].totalValue as number);
          return sum + Math.pow(dailyReturn, 2);
        }, 0) / (processedData.length - 1)) * 100 : 0
    };
  };

  const performanceMetrics = calculatePerformanceMetrics();

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      height,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={formatPercentage}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name.includes('Return') || name.includes('Percentage') ? formatPercentage(value) : formatCurrency(value), 
                name === 'totalValue' ? 'Total Value' :
                name === 'returnPercentage' ? 'Return %' :
                name === 'dailyReturn' ? 'Daily Return %' :
                name === 'cumulativeReturn' ? 'Cumulative Return %' : name
              ]}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            {showReferenceLine && (
              <ReferenceLine yAxisId="left" y={processedData[0]?.totalValue as number} stroke="#666" strokeDasharray="5 5" />
            )}
            {showTotalValue && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalValue"
                stroke="#007bff"
                strokeWidth={3}
                dot={{ fill: '#007bff', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
                name="Total Value"
              />
            )}
            {showReturnPercentage && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="returnPercentage"
                stroke="#28a745"
                strokeWidth={2}
                dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Return %"
              />
            )}
            {showCumulativeReturn && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeReturn"
                stroke="#ffc107"
                strokeWidth={2}
                dot={{ fill: '#ffc107', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Cumulative Return %"
              />
            )}
            {showDailyReturn && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="dailyReturn"
                stroke="#dc3545"
                strokeWidth={1}
                dot={{ fill: '#dc3545', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5 }}
                name="Daily Return %"
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'totalValue' ? 'Total Value' : name
              ]}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            {showReferenceLine && (
              <ReferenceLine y={processedData[0]?.totalValue as number} stroke="#666" strokeDasharray="5 5" />
            )}
            {showTotalValue && (
              <Area
                type="monotone"
                dataKey="totalValue"
                stroke="#007bff"
                fill="#007bff"
                fillOpacity={0.3}
                name="Total Value"
              />
            )}
          </AreaChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={formatPercentage}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name.includes('Return') || name.includes('Percentage') ? formatPercentage(value) : formatCurrency(value), 
                name === 'totalValue' ? 'Total Value' :
                name === 'returnPercentage' ? 'Return %' :
                name === 'dailyReturn' ? 'Daily Return %' : name
              ]}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            {showReferenceLine && (
              <ReferenceLine yAxisId="left" y={processedData[0]?.totalValue as number} stroke="#666" strokeDasharray="5 5" />
            )}
            {showTotalValue && (
              <Bar
                yAxisId="left"
                dataKey="totalValue"
                fill="#007bff"
                fillOpacity={0.7}
                name="Total Value"
              />
            )}
            {showReturnPercentage && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="returnPercentage"
                stroke="#28a745"
                strokeWidth={2}
                dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Return %"
              />
            )}
            {showDailyReturn && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="dailyReturn"
                stroke="#dc3545"
                strokeWidth={1}
                dot={{ fill: '#dc3545', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5 }}
                name="Daily Return %"
              />
            )}
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="snapshot-performance-chart">
      <div className="chart-header">
        <h3>Portfolio Performance Analysis</h3>
        <div className="chart-controls">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'value' | 'return' | 'both')}
            className="metric-select"
          >
            <option value="value">Total Value</option>
            <option value="return">Return %</option>
            <option value="both">Both</option>
          </select>
          <select
            value={type}
            onChange={() => {}} // This would be controlled by parent
            className="type-select"
          >
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="composed">Composed Chart</option>
          </select>
        </div>
      </div>

      {performanceMetrics && (
        <div className="performance-metrics">
          <div className="metric-item">
            <span className="label">Total Return:</span>
            <span className={`value ${performanceMetrics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
              {formatPercentage(performanceMetrics.totalReturn)}
            </span>
          </div>
          <div className="metric-item">
            <span className="label">Max Value:</span>
            <span className="value">{formatCurrency(performanceMetrics.maxValue)}</span>
          </div>
          <div className="metric-item">
            <span className="label">Min Value:</span>
            <span className="value">{formatCurrency(performanceMetrics.minValue)}</span>
          </div>
          <div className="metric-item">
            <span className="label">Max Drawdown:</span>
            <span className="value negative">{formatPercentage(performanceMetrics.maxDrawdown)}</span>
          </div>
          <div className="metric-item">
            <span className="label">Volatility:</span>
            <span className="value">{formatPercentage(performanceMetrics.volatility)}</span>
          </div>
        </div>
      )}

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart() || <div>No chart data</div>}
        </ResponsiveContainer>
      </div>

      {processedData.length === 0 && (
        <div className="chart-empty">
          <p>No performance data available</p>
        </div>
      )}
    </div>
  );
};
