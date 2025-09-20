// SnapshotPlChart Component for CR-006 Asset Snapshot System

import React from 'react';
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
} from 'recharts';
import { SnapshotResponse, SnapshotAggregation } from '../../types/snapshot.types';
import { formatPercentage } from '../../utils/format';
import './SnapshotPlChart.styles.css';

interface SnapshotPlChartProps {
  data: SnapshotResponse[] | SnapshotAggregation[];
  type?: 'line' | 'area' | 'composed';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showRealizedPl?: boolean;
  showUnrealizedPl?: boolean;
  showTotalPl?: boolean;
}

export const SnapshotPlChart: React.FC<SnapshotPlChartProps> = ({
  data,
  type = 'line',
  height = 400,
  showLegend = true,
  showGrid = true,
  showRealizedPl = true,
  showUnrealizedPl = true,
  showTotalPl = true,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Remove local formatPercentage function, use imported one

  const renderChart = () => {
    const commonProps = {
      data,
      height,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="snapshotDate" 
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
                name === 'realizedPl' ? 'Realized P&L' :
                name === 'unrealizedPl' ? 'Unrealized P&L' :
                name === 'totalPl' ? 'Total P&L' : name
              ]}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            {showRealizedPl && (
              <Line
                type="monotone"
                dataKey="realizedPl"
                stroke="#28a745"
                strokeWidth={2}
                dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Realized P&L"
              />
            )}
            {showUnrealizedPl && (
              <Line
                type="monotone"
                dataKey="unrealizedPl"
                stroke="#ffc107"
                strokeWidth={2}
                dot={{ fill: '#ffc107', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Unrealized P&L"
              />
            )}
            {showTotalPl && (
              <Line
                type="monotone"
                dataKey="totalPl"
                stroke="#007bff"
                strokeWidth={3}
                dot={{ fill: '#007bff', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
                name="Total P&L"
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="snapshotDate" 
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
                name === 'realizedPl' ? 'Realized P&L' :
                name === 'unrealizedPl' ? 'Unrealized P&L' :
                name === 'totalPl' ? 'Total P&L' : name
              ]}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            {showRealizedPl && (
              <Area
                type="monotone"
                dataKey="realizedPl"
                stackId="1"
                stroke="#28a745"
                fill="#28a745"
                fillOpacity={0.3}
                name="Realized P&L"
              />
            )}
            {showUnrealizedPl && (
              <Area
                type="monotone"
                dataKey="unrealizedPl"
                stackId="1"
                stroke="#ffc107"
                fill="#ffc107"
                fillOpacity={0.3}
                name="Unrealized P&L"
              />
            )}
            {showTotalPl && (
              <Area
                type="monotone"
                dataKey="totalPl"
                stackId="2"
                stroke="#007bff"
                fill="#007bff"
                fillOpacity={0.2}
                name="Total P&L"
              />
            )}
          </AreaChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey="snapshotDate" 
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
                name.includes('Return') ? formatPercentage(value) : formatCurrency(value), 
                name === 'realizedPl' ? 'Realized P&L' :
                name === 'unrealizedPl' ? 'Unrealized P&L' :
                name === 'totalPl' ? 'Total P&L' :
                name === 'returnPercentage' ? 'Return %' : name
              ]}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            {showRealizedPl && (
              <Bar
                yAxisId="left"
                dataKey="realizedPl"
                fill="#28a745"
                fillOpacity={0.7}
                name="Realized P&L"
              />
            )}
            {showUnrealizedPl && (
              <Bar
                yAxisId="left"
                dataKey="unrealizedPl"
                fill="#ffc107"
                fillOpacity={0.7}
                name="Unrealized P&L"
              />
            )}
            {showTotalPl && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalPl"
                stroke="#007bff"
                strokeWidth={3}
                dot={{ fill: '#007bff', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
                name="Total P&L"
              />
            )}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="returnPercentage"
              stroke="#dc3545"
              strokeWidth={2}
              dot={{ fill: '#dc3545', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              name="Return %"
            />
          </ComposedChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="snapshot-pl-chart">
      <div className="chart-header">
        <h3>P&L Analysis</h3>
        <div className="chart-controls">
          <label>
            <input
              type="checkbox"
              checked={showRealizedPl}
              onChange={() => {}} // This would be controlled by parent
            />
            Realized P&L
          </label>
          <label>
            <input
              type="checkbox"
              checked={showUnrealizedPl}
              onChange={() => {}} // This would be controlled by parent
            />
            Unrealized P&L
          </label>
          <label>
            <input
              type="checkbox"
              checked={showTotalPl}
              onChange={() => {}} // This would be controlled by parent
            />
            Total P&L
          </label>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart() || <div>No chart data</div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
