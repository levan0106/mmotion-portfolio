import React from 'react';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { AssetAllocation } from '../../types/financialFreedom.types';
import { formatPercentageValue } from '../../utils/format';
import { useTranslation } from 'react-i18next';

interface AllocationChartProps {
  allocation: AssetAllocation;
  title?: string;
  height?: number;
  assetTypes?: Array<{ id?: string; code?: string; name: string; nameEn?: string; color?: string }>; // Optional metadata for dynamic asset types (id or code is used as key for allocation lookup)
}

// Default colors for backward compatibility (using singular form to match asset type codes)
const DEFAULT_COLORS: Record<string, string> = {
  stock: '#1976d2',
  bond: '#2e7d32',
  gold: '#ed6c02',
  other: '#9c27b0',
  cash: '#757575',
};

// Color palette for dynamic asset types
const COLOR_PALETTE = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
];

export const AllocationChart: React.FC<AllocationChartProps> = ({
  allocation,
  title,
  height = 300,
  assetTypes,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Build data array dynamically
  const data = React.useMemo(() => {
    if (assetTypes && assetTypes.length > 0) {
      // Use provided asset types metadata - include all asset types even with 0% allocation
      return assetTypes
        .map(assetType => {
          const code = assetType.id || assetType.code || '';
          return {
            name: i18n.language === 'en' && assetType.nameEn ? assetType.nameEn : assetType.name,
            value: allocation[code] || 0,
            color: assetType.color || DEFAULT_COLORS[code] || COLOR_PALETTE[assetTypes.indexOf(assetType) % COLOR_PALETTE.length],
          };
        });
    } else {
      // Fallback to default asset types (backward compatibility) - include all even with 0% allocation
      return [
        { name: t('financialFreedom.allocation.stocks'), value: allocation.stock || 0, color: DEFAULT_COLORS.stock },
        { name: t('financialFreedom.allocation.bonds'), value: allocation.bond || 0, color: DEFAULT_COLORS.bond },
        { name: t('financialFreedom.allocation.gold'), value: allocation.gold || 0, color: DEFAULT_COLORS.gold },
        { name: t('financialFreedom.allocation.other'), value: allocation.other || 0, color: DEFAULT_COLORS.other },
        { name: t('financialFreedom.allocation.cash'), value: allocation.cash || 0, color: DEFAULT_COLORS.cash },
      ];
    }
  }, [allocation, assetTypes, t, i18n.language]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {data.name}
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" color="text.secondary">
            {formatPercentageValue(data.value)}
          </ResponsiveTypography>
        </Paper>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if less than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isMobile ? 12 : 14}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box>
      {title && (
        <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
          {title}
        </ResponsiveTypography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={isMobile ? 80 : 100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            
            iconType="circle"
            wrapperStyle={{ paddingTop: '16px' }}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                {value}: {formatPercentageValue(entry.payload.value)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

