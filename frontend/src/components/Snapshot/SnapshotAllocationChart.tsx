// SnapshotAllocationChart Component for CR-006 Asset Snapshot System

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { SnapshotResponse, SnapshotAggregation } from '../../types/snapshot.types';
import { formatPercentage } from '../../utils/format';
import './SnapshotAllocationChart.styles.css';

interface SnapshotAllocationChartProps {
  data: SnapshotResponse[] | SnapshotAggregation[];
  type?: 'pie' | 'bar' | 'line';
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  groupBy?: 'asset' | 'date' | 'granularity';
  maxItems?: number;
}

export const SnapshotAllocationChart: React.FC<SnapshotAllocationChartProps> = ({
  data,
  type = 'pie',
  height = 400,
  showLegend = true,
  showTooltip = true,
  groupBy = 'asset',
  maxItems = 10,
}) => {
  // const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ];

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    switch (groupBy) {
      case 'asset':
        const assetMap = new Map<string, { name: string; value: number; count: number }>();
        
        data.forEach((item) => {
          const assetSymbol = 'assetSymbol' in item ? item.assetSymbol : 'Unknown';
          const currentValue = 'currentValue' in item ? item.currentValue : 0;
          // const allocation = 'allocationPercentage' in item ? item.allocationPercentage : 0;
          
          if (assetMap.has(assetSymbol)) {
            const existing = assetMap.get(assetSymbol)!;
            existing.value += currentValue;
            existing.count += 1;
          } else {
            assetMap.set(assetSymbol, {
              name: assetSymbol,
              value: currentValue,
              count: 1
            });
          }
        });

        return Array.from(assetMap.values())
          .sort((a, b) => b.value - a.value)
          .slice(0, maxItems);

      case 'date':
        return data
          .map((item) => ({
            name: new Date(item.snapshotDate).toLocaleDateString(),
            value: 'totalValue' in item ? item.totalValue : 0,
            date: item.snapshotDate,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      case 'granularity':
        const granularityMap = new Map<string, { name: string; value: number; count: number }>();
        
        data.forEach((item) => {
          const granularity = item.granularity || 'Unknown';
          const currentValue = 'currentValue' in item ? item.currentValue : 0;
          
          if (granularityMap.has(granularity)) {
            const existing = granularityMap.get(granularity)!;
            existing.value += currentValue;
            existing.count += 1;
          } else {
            granularityMap.set(granularity, {
              name: granularity,
              value: currentValue,
              count: 1
            });
          }
        });

        return Array.from(granularityMap.values())
          .sort((a, b) => b.value - a.value);

      default:
        return [];
    }
  }, [data, groupBy, maxItems]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // const formatPercentage = (value: number) => {
  //   return `${value.toFixed(2)}%`;
  // };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString();
  // };

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      height,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${formatPercentage(percent * 100)}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Value']}
              />
            )}
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            {showTooltip && (
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Value']}
              />
            )}
            {showLegend && <Legend />}
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            {showTooltip && (
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Value']}
              />
            )}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      default:
        return null;
    }
  };

  const totalValue = processedData.reduce((sum, item) => sum + (item.value as number), 0);

  return (
    <div className="snapshot-allocation-chart">
      <div className="chart-header">
        <h3>Asset Allocation Analysis</h3>
        <div className="chart-controls">
          <select
            value={groupBy}
            onChange={() => {}} // This would be controlled by parent
            className="group-select"
          >
            <option value="asset">By Asset</option>
            <option value="date">By Date</option>
            <option value="granularity">By Granularity</option>
          </select>
          <select
            value={type}
            onChange={() => {}} // This would be controlled by parent
            className="type-select"
          >
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
          </select>
        </div>
      </div>
      
      <div className="chart-summary">
        <div className="summary-item">
          <span className="label">Total Value:</span>
          <span className="value">{formatCurrency(totalValue)}</span>
        </div>
        <div className="summary-item">
          <span className="label">Items:</span>
          <span className="value">{processedData.length}</span>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart() || <div>No chart data</div>}
        </ResponsiveContainer>
      </div>

      {processedData.length === 0 && (
        <div className="chart-empty">
          <p>No data available for the selected criteria</p>
        </div>
      )}
    </div>
  );
};
