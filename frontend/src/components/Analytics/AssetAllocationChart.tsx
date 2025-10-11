/**
 * Asset allocation pie chart component
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Box } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { AssetAllocationResponse } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { getAssetTypeColor } from '../../config/chartColors';

interface AssetAllocationChartProps {
  data: AssetAllocationResponse;
  baseCurrency: string;
  compact?: boolean;
}

// Use standard chart colors from config

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data,
  baseCurrency,
  compact = false,
}) => {
  // Transform data for the chart
  const chartData = Object.entries(data.allocation).map(([assetType, allocation]) => ({
    name: assetType.toUpperCase(),
    value: allocation.percentage,
    marketValue: allocation.value,
    color: getAssetTypeColor(assetType),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ 
          p: 2, 
          backgroundColor: 'white', 
          borderRadius: 1, 
          boxShadow: 3,
          border: '1px solid #e0e0e0'
        }}>
          <ResponsiveTypography variant="cardTitle">
            {data.name}
          </ResponsiveTypography>
          <ResponsiveTypography variant="tableCell" color="text.secondary">
            Allocation: {formatPercentage(data.value)}
          </ResponsiveTypography>
          <ResponsiveTypography variant="tableCell" color="text.secondary">
            Market Value: {formatCurrency(data.marketValue, baseCurrency)}
          </ResponsiveTypography>
        </Box>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: compact ? 0.5 : 0.8,
        alignItems: 'flex-start'
      }}>
        {payload.map((entry: any, index: number) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: compact ? 0.4 : 0.6,
            width: '100%'
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
            <ResponsiveTypography variant="formHelper" sx={{ 
              lineHeight: 1.2,
              fontWeight: 500
            }}>
              {entry.value}
            </ResponsiveTypography>
            <ResponsiveTypography variant="formHelper" sx={{ 
              lineHeight: 1.2,
              color: 'text.secondary',
              ml: 'auto'
            }}>
              {formatPercentage(entry.payload.value)}
            </ResponsiveTypography>
          </Box>
        ))}
      </Box>
    );
  };

  if (!data || Object.keys(data.allocation).length === 0) {
    return (
      <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <ResponsiveTypography variant={compact ? "formHelper" : "cardTitle"} color="text.secondary">
          No asset allocation data available
        </ResponsiveTypography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: compact ? 133 : 200,
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1
    }}>
      <Box sx={{ width: '100%', maxWidth: 300 }}>
        <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={compact ? 60 : 90}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ 
        width: compact ? 120 : 150, 
        ml: 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <CustomLegend payload={chartData.map((entry) => ({
          value: entry.name,
          color: entry.color,
          payload: { value: entry.value }
        }))} />
      </Box>
    </Box>
  );
};

export default AssetAllocationChart;
