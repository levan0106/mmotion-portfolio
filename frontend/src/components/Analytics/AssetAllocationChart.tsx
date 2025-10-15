/**
 * Asset allocation pie chart component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          border: '1px solid #e0e0e0',
          minWidth: 200,
          maxWidth: 300,
          position: 'relative'
        }}>
          <ResponsiveTypography variant="cardTitle" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>
            {data.name}
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 0.5 }}>
            {t('portfolio.allocation')}:
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardValueMedium" sx={{ fontWeight: 600, mb: 0.5 }}>
          {formatPercentage(data.value)}
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 0.5 }}>
            {t('portfolio.marketValue')}:
          </ResponsiveTypography>
          <ResponsiveTypography variant="cardValueMedium" sx={{ fontWeight: 600, mb: 0.5 }}>
            {formatCurrency(data.marketValue, baseCurrency)}
          </ResponsiveTypography>
        </Box>
      );
    }
    return null;
  };

  // Custom label function to display labels outside pie slices
  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
    if (percent < 0.03) return null; // Don't show labels for slices smaller than 3%
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20; // Position labels outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#333" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={compact ? 10 : 12}
        fontWeight="600"
        style={{ 
          pointerEvents: 'none'
        }}
      >
        {`${name} ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Custom label line function for better visual connection
  const renderLabelLine = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
    if (percent < 0.03) {
      // Return invisible line for small slices
      return (
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy}
          stroke="transparent"
          strokeWidth={0}
        />
      );
    }
    
    const RADIAN = Math.PI / 180;
    const x1 = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const y1 = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const x2 = cx + (outerRadius + 20) * Math.cos(-midAngle * RADIAN);
    const y2 = cy + (outerRadius + 20) * Math.sin(-midAngle * RADIAN);

    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#666"
        strokeWidth={1}
        strokeDasharray="2,2"
        style={{ pointerEvents: 'none' }}
      />
    );
  };

  if (!data || Object.keys(data.allocation).length === 0) {
    return (
      <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <ResponsiveTypography variant="formHelper" color="text.secondary">
          {t('portfolio.noAllocationData')}
        </ResponsiveTypography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: compact ? 250 : 300,
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      px: { xs: 0, sm: 1 },
      mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
    }}>
      <ResponsiveContainer width="100%" height={compact ? 250 : 300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={renderLabelLine}
            label={renderCustomLabel}
            outerRadius={compact ? 80 : 100}
            fill="#8884d8"
            dataKey="value"
            stroke="#fff"
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default AssetAllocationChart;
