/**
 * Reusable Timeline Chart component
 * Supports Line, Bar, and Combo chart types with stacking options
 * Can be used for any time-series data visualization
 */

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Box, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { formatPercentageValue, formatDateFns as formatDate } from '../../utils/format';
import { getAssetTypeColor, RECHARTS_COLORS } from '../../config/chartColors';
import ResponsiveTypography from '../Common/ResponsiveTypography';

export interface TimelineDataPoint {
  date: string;
  [key: string]: string | number; // Dynamic series keys
}

export type ChartType = 'line' | 'bar' | 'combo';
export type BarType = 'stacked' | 'side-by-side';

export interface TimelineChartProps {
  data: TimelineDataPoint[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  height?: number;
  colors?: string[];
  showBarTypeToggle?: boolean;
  defaultChartType?: ChartType;
  defaultBarType?: BarType;
  yAxisDomain?: [number, number];
  yAxisFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string) => string;
  tooltipFormatter?: (value: number) => string;
  className?: string;
  sx?: any;
  // Additional customization options
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  lineStrokeWidth?: number;
  barRadius?: [number, number, number, number];
  barOpacity?: number;
}

const TimelineChart: React.FC<TimelineChartProps> = ({
  data,
  title = 'Timeline Chart',
  subtitle,
  compact = false,
  height = 267,
  colors = RECHARTS_COLORS,
  showBarTypeToggle = true,
  defaultChartType = 'line',
  defaultBarType = 'stacked',
  yAxisDomain = [0, 100],
  yAxisFormatter = (value) => formatPercentageValue(value, 1),
  xAxisFormatter = (value) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  tooltipFormatter = (value) => formatPercentageValue(value, 1),
  className,
  sx,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  lineStrokeWidth = 2,
  barRadius = [2, 2, 0, 0] as [number, number, number, number],
  barOpacity = 1,
}) => {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [barType, setBarType] = useState<BarType>(defaultBarType);

  // Get series names from all data points (exclude 'date' key)
  const seriesNames = data.length > 0 
    ? Array.from(new Set(data.flatMap(item => Object.keys(item).filter(key => key !== 'date'))))
    : [];

  const handleChartTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newChartType: ChartType | null,
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  const handleBarTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newBarType: BarType | null,
  ) => {
    if (newBarType !== null) {
      setBarType(newBarType);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Filter out duplicate entries for combo chart
      const uniqueEntries = chartType === 'combo' 
        ? payload.filter((entry: any, index: number, arr: any[]) => 
            arr.findIndex(e => e.dataKey === entry.dataKey) === index
          )
        : payload;

      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <ResponsiveTypography variant="chartSubtitle" gutterBottom>
            {formatDate(label)}
          </ResponsiveTypography>
          {uniqueEntries.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  borderRadius: '50%',
                  mr: 1,
                  flexShrink: 0
                }}
              />
              <ResponsiveTypography variant="chartTooltip" sx={{ flex: 1 }}>
                {entry.dataKey}: {tooltipFormatter(entry.value)}
              </ResponsiveTypography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;

    return (
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: compact ? 1 : 1.5, 
        justifyContent: 'center',
        mt: compact ? 1 : 2,
        px: compact ? 1 : 2
      }}>
        {payload.map((entry: any, index: number) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: compact ? 0.5 : 0.75,
            px: compact ? 0.75 : 1,
            py: compact ? 0.25 : 0.5,
            borderRadius: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <Box
              sx={{
                width: compact ? 8 : 10,
                height: compact ? 8 : 10,
                backgroundColor: entry.color,
                borderRadius: '50%',
                flexShrink: 0
              }}
            />
            <ResponsiveTypography variant="chartLegend">
              {entry.value}
            </ResponsiveTypography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    const commonAxisProps = {
      xAxis: (
        <XAxis
          dataKey="date"
          tickFormatter={xAxisFormatter}
          tick={{ fontSize: compact ? 10 : 12 }}
        />
      ),
      yAxis: (
        <YAxis
          tickFormatter={yAxisFormatter}
          tick={{ fontSize: compact ? 10 : 12 }}
          domain={yAxisDomain}
        />
      ),
      grid: showGrid ? <CartesianGrid strokeDasharray="3 3" /> : null,
      tooltip: showTooltip ? <Tooltip content={<CustomTooltip />} /> : null,
      legend: showLegend ? <Legend content={<CustomLegend />} /> : null,
    };

    if (chartType === 'line') {
      return (
        <LineChart {...commonProps}>
          {commonAxisProps.grid}
          {commonAxisProps.xAxis}
          {commonAxisProps.yAxis}
          {commonAxisProps.tooltip}
          {commonAxisProps.legend}
          {seriesNames.map((seriesName, index) => (
            <Line
              key={seriesName}
              type="monotone"
              dataKey={seriesName}
              stroke={getAssetTypeColor(seriesName) || colors[index % colors.length]}
              strokeWidth={lineStrokeWidth}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      );
    }

    if (chartType === 'bar') {
      return (
        <BarChart {...commonProps}>
          {commonAxisProps.grid}
          {commonAxisProps.xAxis}
          {commonAxisProps.yAxis}
          {commonAxisProps.tooltip}
          {commonAxisProps.legend}
          {seriesNames.map((seriesName, index) => (
            <Bar
              key={seriesName}
              dataKey={seriesName}
              fill={getAssetTypeColor(seriesName) || colors[index % colors.length]}
              fillOpacity={barOpacity}
              radius={barRadius}
              stackId={barType === 'stacked' ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      );
    }

    // Combo chart (Bar + Line)
    return (
      <ComposedChart {...commonProps}>
        {commonAxisProps.grid}
        {commonAxisProps.xAxis}
        {commonAxisProps.yAxis}
        {commonAxisProps.tooltip}
        {commonAxisProps.legend}
        {seriesNames.map((seriesName, index) => (
          <Bar
            key={`bar-${seriesName}`}
            dataKey={seriesName}
            fill={getAssetTypeColor(seriesName) || colors[index % colors.length]}
            fillOpacity={barOpacity * 0.6}
            radius={barRadius}
            stackId={barType === 'stacked' ? 'stack' : undefined}
            name={`${seriesName} (Bar)`}
            legendType="none"
          />
        ))}
        {seriesNames.map((seriesName, index) => (
          <Line
            key={`line-${seriesName}`}
            type="monotone"
            dataKey={seriesName}
            stroke={getAssetTypeColor(seriesName) || colors[index % colors.length]}
            strokeWidth={lineStrokeWidth + 1}
            dot={false}
            activeDot={{ r: 4 }}
            name={`${seriesName} (Line)`}
          />
        ))}
      </ComposedChart>
    );
  };

  return (
    <Box className={className} sx={sx}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <ResponsiveTypography variant="chartTitle" gutterBottom>
            {title}
          </ResponsiveTypography>
          {subtitle && (
            <ResponsiveTypography variant="chartSubtitle" color="text.secondary">
              {subtitle}
            </ResponsiveTypography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Bar Type Toggle - only show when bar or combo is selected */}
          {showBarTypeToggle && (chartType === 'bar' || chartType === 'combo') && (
            <ToggleButtonGroup
              value={barType}
              exclusive
              onChange={handleBarTypeChange}
              size="small"
              sx={{ 
                '& .MuiToggleButton-root': {
                  fontSize: '0.5rem',
                  px: compact ? 0.375 : 0.5,
                  py: compact ? 0.125 : 0.25,
                  minWidth: compact ? '35px' : '40px',
                  height: compact ? '20px' : '24px',
                }
              }}
            >
              <ToggleButton value="stacked">
                Stacked
              </ToggleButton>
              <ToggleButton value="side-by-side">
                Side-by-Side
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          
          {/* Chart Type Toggle */}
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                fontSize: '0.5rem',
                px: compact ? 0.5 : 0.75,
                py: compact ? 0.25 : 0.375,
                minWidth: compact ? '30px' : '35px',
                height: compact ? '20px' : '24px',
              }
            }}
          >
            <ToggleButton value="line">
              Line
            </ToggleButton>
            <ToggleButton value="bar">
              Bar
            </ToggleButton>
            <ToggleButton value="combo">
              Combo
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      <Box sx={{ height: compact ? height * 0.75 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default TimelineChart;
