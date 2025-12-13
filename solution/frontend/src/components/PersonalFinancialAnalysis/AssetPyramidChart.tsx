/**
 * Asset Pyramid Chart Component
 * Displays assets in a pyramid structure with 4 layers:
 * - Protection Layer (Base)
 * - Income Generation Layer
 * - Growth Layer
 * - Risk Layer (Top)
 */

import React, { useState } from 'react';
import { Box, useTheme, Paper, Tooltip, Fade } from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { SummaryMetrics } from '../../types/personalFinancialAnalysis.types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/format';
import { AssetLayer } from '../../types/personalFinancialAnalysis.types';

interface AssetPyramidChartProps {
  summaryMetrics: SummaryMetrics;
  baseCurrency?: string;
  height?: number;
}

const LAYER_COLORS = {
  [AssetLayer.PROTECTION]: '#4caf50',      // Green - Safe, stable
  [AssetLayer.INCOME_GENERATION]: '#2196f3', // Blue - Income generating
  [AssetLayer.GROWTH]: '#ff9800',          // Orange - Growth
  [AssetLayer.RISK]: '#f44336',            // Red - High risk, high return
};

// Layer order from top to bottom (stacked)
const LAYER_ORDER = [
  AssetLayer.RISK,              // Top - Lớp rủi ro
  AssetLayer.GROWTH,            // Lớp tăng trưởng
  AssetLayer.INCOME_GENERATION, // Lớp tạo thu nhập
  AssetLayer.PROTECTION,         // Bottom - Lớp bảo vệ (base, widest)
];

export const AssetPyramidChart: React.FC<AssetPyramidChartProps> = ({
  summaryMetrics,
  baseCurrency = 'VND',
  height = 400,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hoveredLayer, setHoveredLayer] = useState<AssetLayer | null>(null);

  const layerData = [
    {
      layer: AssetLayer.PROTECTION,
      value: summaryMetrics.totalProtectionLayer,
      label: t('personalFinancialAnalysis.assetLayers.protection'),
      color: LAYER_COLORS[AssetLayer.PROTECTION],
      percentage: summaryMetrics.totalAssets > 0
        ? (summaryMetrics.totalProtectionLayer / summaryMetrics.totalAssets) * 100
        : 0,
    },
    {
      layer: AssetLayer.INCOME_GENERATION,
      value: summaryMetrics.totalIncomeGenerationLayer,
      label: t('personalFinancialAnalysis.assetLayers.incomeGeneration'),
      color: LAYER_COLORS[AssetLayer.INCOME_GENERATION],
      percentage: summaryMetrics.totalAssets > 0
        ? (summaryMetrics.totalIncomeGenerationLayer / summaryMetrics.totalAssets) * 100
        : 0,
    },
    {
      layer: AssetLayer.GROWTH,
      value: summaryMetrics.totalGrowthLayer,
      label: t('personalFinancialAnalysis.assetLayers.growth'),
      color: LAYER_COLORS[AssetLayer.GROWTH],
      percentage: summaryMetrics.totalAssets > 0
        ? (summaryMetrics.totalGrowthLayer / summaryMetrics.totalAssets) * 100
        : 0,
    },
    {
      layer: AssetLayer.RISK,
      value: summaryMetrics.totalRiskLayer,
      label: t('personalFinancialAnalysis.assetLayers.risk'),
      color: LAYER_COLORS[AssetLayer.RISK],
      percentage: summaryMetrics.totalAssets > 0
        ? (summaryMetrics.totalRiskLayer / summaryMetrics.totalAssets) * 100
        : 0,
    },
  ].filter((item) => item.value > 0); // Only show layers with assets

  if (layerData.length === 0) {
    return (
      <Box
        sx={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
        }}
      >
        <ResponsiveTypography variant="body2">
          {t('personalFinancialAnalysis.charts.noData')}
        </ResponsiveTypography>
      </Box>
    );
  }

  // Calculate pyramid widths (base is widest, top is narrowest)
  // Layer order: RISK (top, narrowest) -> GROWTH -> INCOME_GENERATION -> PROTECTION (bottom, widest)
  const maxWidth = 100; // Percentage
  const layerWidths = LAYER_ORDER.map((_, index) => {
    const layerCount = LAYER_ORDER.length;
    // index 0 (RISK) = narrowest (25%), index 3 (PROTECTION) = widest (100%)
    return maxWidth * ((index + 1) / layerCount);
  });

  // Calculate summary data for tooltip
  const summaryData = {
    totalAssets: summaryMetrics.totalAssets,
    totalLayers: layerData.length,
    layers: layerData.map((data) => ({
      label: data.label,
      value: data.value,
      percentage: data.percentage,
      color: data.color,
    })),
  };

  const SummaryTooltip = (
    <Paper
      elevation={4}
      sx={{
        p: 2,
        backgroundColor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
        minWidth: 280,
        boxShadow: theme.shadows[8],
      }}
    >
      <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('personalFinancialAnalysis.charts.assetPyramid.title')}
      </ResponsiveTypography>
      <Box sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <ResponsiveTypography variant="caption" color="text.secondary">
            {t('personalFinancialAnalysis.assets.total')}:
          </ResponsiveTypography>
          <ResponsiveTypography variant="caption" sx={{ fontWeight: 600 }}>
            {formatCurrency(summaryData.totalAssets, baseCurrency)}
          </ResponsiveTypography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ResponsiveTypography variant="caption" color="text.secondary">
            {t('personalFinancialAnalysis.assets.count')}:
          </ResponsiveTypography>
          <ResponsiveTypography variant="caption" sx={{ fontWeight: 600 }}>
            {summaryData.totalLayers} {t('personalFinancialAnalysis.charts.layers')}
          </ResponsiveTypography>
        </Box>
      </Box>
      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1.5 }}>
        <ResponsiveTypography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {t('personalFinancialAnalysis.charts.breakdown')}:
        </ResponsiveTypography>
        {summaryData.layers.map((layer) => (
          <Box
            key={layer.label}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.75,
              pl: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: layer.color,
                  mr: 1,
                  flexShrink: 0,
                }}
              />
              <ResponsiveTypography variant="caption" sx={{ flex: 1 }}>
                {layer.label}
              </ResponsiveTypography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <ResponsiveTypography variant="caption" sx={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                {formatCurrency(layer.value, baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="caption" sx={{ fontWeight: 600, color: layer.color, minWidth: 50, textAlign: 'right' }}>
                {layer.percentage.toFixed(1)}%
              </ResponsiveTypography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );

  return (
    <Tooltip
      title={SummaryTooltip}
      arrow
      placement="top"
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 200 }}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: 'transparent',
            padding: 0,
            maxWidth: 'none',
          },
        },
        arrow: {
          sx: {
            color: theme.palette.background.paper,
            '&::before': {
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            },
          },
        },
      }}
    >
      <Box
        sx={{
          height,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        {LAYER_ORDER.map((layer, index) => {
        const data = layerData.find((d) => d.layer === layer);
        if (!data || data.value === 0) return null;

        const width = layerWidths[index];
        const heightPercent = summaryMetrics.totalAssets > 0
          ? (data.value / summaryMetrics.totalAssets) * 100
          : 0;
        const actualHeight = (height * heightPercent) / 100;

        return (
          <Box
            key={layer}
            onMouseEnter={() => setHoveredLayer(layer)}
            onMouseLeave={() => setHoveredLayer(null)}
            sx={{
              width: `${width}%`,
              height: actualHeight,
              backgroundColor: data.color,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              border: `2px solid ${theme.palette.background.paper}`,
              borderTop: index === 0 ? `2px solid ${theme.palette.background.paper}` : 'none',
              borderBottom: index < LAYER_ORDER.length - 1 ? `2px solid ${theme.palette.background.paper}` : 'none',
              transition: 'all 0.3s ease',
              opacity: hoveredLayer && hoveredLayer !== layer ? 0.6 : 1,
              transform: hoveredLayer === layer ? 'scale(1.02)' : 'scale(1)',
              zIndex: hoveredLayer === layer ? 10 : 1,
              boxShadow: hoveredLayer === layer ? theme.shadows[4] : 'none',
            }}
          >
              <ResponsiveTypography
                variant="caption"
                sx={{
                  color: 'white',
                  fontWeight: 500,
                  textAlign: 'center',
                  px: 1,
                  mt: 0.5,
                  fontSize: '0.7rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                {data.percentage.toFixed(1)}%
              </ResponsiveTypography>
            </Box>
        );
      })}

      {/* Legend */}
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
        }}
      >
        {layerData.map((data) => (
          <Box
            key={data.layer}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: data.color,
                borderRadius: '2px',
              }}
            />
            <ResponsiveTypography variant="caption" color="text.secondary">
              {data.label}
            </ResponsiveTypography>
          </Box>
        ))}
      </Box>
      </Box>
    </Tooltip>
  );
};

