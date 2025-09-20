// SnapshotChart Component for CR-006 Asset Snapshot System

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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SnapshotResponse, SnapshotAggregation } from '../../types/snapshot.types';
import './SnapshotChart.styles.css';

interface SnapshotChartProps {
  data: SnapshotResponse[] | SnapshotAggregation[];
  type: 'line' | 'area' | 'bar' | 'pie';
  title: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
}

export const SnapshotChart: React.FC<SnapshotChartProps> = ({
  data,
  type,
  title,
  height = 400,
  showLegend = true,
  showGrid = true,
  // dataKey = 'value',
  xAxisKey = 'date',
  yAxisKey = 'value',
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'],
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // const formatPercentage = (value: number) => {
  //   return `${value.toFixed(2)}%`;
  // };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
              dataKey={xAxisKey} 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={yAxisKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xAxisKey} 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={yAxisKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xAxisKey} 
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Value']}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
            />
            {showLegend && <Legend />}
            <Bar dataKey={yAxisKey} fill={colors[0]} />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yAxisKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="snapshot-chart">
      <div className="chart-header">
        <h3>{title}</h3>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart() || <div>No chart data</div>}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
