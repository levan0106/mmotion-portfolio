/**
 * Asset Pyramid Chart Component
 * Displays assets in a pyramid structure with 4 layers:
 * - Protection Layer (Base)
 * - Income Generation Layer
 * - Growth Layer
 * - Risk Layer (Top)
 */

import React, { useState, useRef } from 'react';
import { Box, useTheme, Paper } from '@mui/material';
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
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate equal height for all layers
  // Each layer will have the same height, but width varies based on value relative to max layer value
  // Height is always calculated based on 4 layers total, even if not all layers have data
  // Reserve space for legend (approximately 60px)
  const legendHeight = 60;
  const availableHeight = height - legendHeight;
  const totalLayers = 4; // Always use 4 layers for height calculation
  const equalLayerHeight = availableHeight / totalLayers;
  
  // Find the maximum value among all layers to use as reference for width calculation
  const maxLayerValue = Math.max(...layerData.map((data) => data.value), 0);

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

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (hoveredLayer) {
      setMousePosition({
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredLayer(null);
    setMousePosition(null);
  };

  const handleLayerMouseEnter = (layer: AssetLayer, event: React.MouseEvent<HTMLDivElement>) => {
    setHoveredLayer(layer);
    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  return (
    <Box>
      <Box
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        sx={{
          height: availableHeight,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          cursor: 'pointer',
          width: '100%',
        }}
      >
          {(() => {
          // Filter and sort layers by LAYER_ORDER to maintain correct order
          const sortedLayers = LAYER_ORDER.filter(layer => {
            const data = layerData.find((d) => d.layer === layer);
            return data && data.value > 0;
          });

          return sortedLayers.map((layer) => {
          const data = layerData.find((d) => d.layer === layer);
          if (!data || data.value === 0) return null;

          // Width is based on value relative to the maximum layer value
          // The layer with the maximum value will have 100% width
          const widthPercent = maxLayerValue > 0 
            ? (data.value / maxLayerValue) * 100 
            : 0;
          const actualWidth = `${widthPercent}%`;
          
          // Height is equal for all layers (always based on 4 layers total)
          const actualHeight = equalLayerHeight;
          
          // Calculate Y position based on LAYER_ORDER index (to maintain correct position even if some layers are missing)
          const layerOrderIndex = LAYER_ORDER.indexOf(layer);
          const yPosition = layerOrderIndex * equalLayerHeight;

          return (
            <Box
              key={layer}
              onMouseEnter={(e) => handleLayerMouseEnter(layer, e)}
              onMouseMove={(e) => {
                if (hoveredLayer === layer) {
                  setMousePosition({
                    x: e.clientX,
                    y: e.clientY,
                  });
                }
              }}
              onMouseLeave={() => {
                setHoveredLayer(null);
                setMousePosition(null);
              }}
              sx={{
                width: actualWidth,
                height: actualHeight,
                backgroundColor: data.color,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                top: yPosition,
                left: '50%',
                transform: hoveredLayer === layer 
                  ? 'translateX(-50%) scale(1.02)' 
                  : 'translateX(-50%) scale(1)',
                border: `2px solid ${theme.palette.background.paper}`,
                borderRadius: 1,
                transition: 'all 0.3s ease',
                opacity: hoveredLayer && hoveredLayer !== layer ? 0.6 : 1,
                zIndex: hoveredLayer === layer ? 10 : totalLayers - layerOrderIndex,
                boxShadow: hoveredLayer === layer ? theme.shadows[4] : 'none',
              }}
            >
                {/* Background for text readability when layer is small */}
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  {/* <ResponsiveTypography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontWeight: 500,
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {data.label}
                  </ResponsiveTypography> */}
                  <ResponsiveTypography
                    variant="caption"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      textAlign: 'center',
                      fontSize: '0.65rem',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {data.percentage.toFixed(1)}%
                  </ResponsiveTypography>
                </Box>
              </Box>
          );
          });
          })()}
      </Box>

      {/* Custom Tooltip that follows mouse cursor */}
      {hoveredLayer !== null && mousePosition && (
        <Box
          sx={{
            position: 'fixed',
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y - 10}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 1500,
            pointerEvents: 'none',
            mb: 1,
          }}
        >
          {SummaryTooltip}
        </Box>
      )}

      {/* Legend - Moved to bottom */}
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
  );
};

