/**
 * Diversification Heatmap component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Tooltip as MuiTooltip,
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { formatPercentage } from '../../utils/format';

interface HeatmapData {
  asset1: string;
  asset2: string;
  correlation: number;
}

interface DiversificationHeatmapProps {
  data: HeatmapData[];
  title?: string;
  compact?: boolean;
}

const DiversificationHeatmap: React.FC<DiversificationHeatmapProps> = ({
  data,
  title = 'Diversification Heatmap',
  compact = false,
}) => {
  const { t } = useTranslation();
  // Get unique asset types
  const assetTypes = Array.from(new Set(data.flatMap(d => [d.asset1, d.asset2])));
  
  // Create correlation matrix
  const createCorrelationMatrix = () => {
    const matrix: { [key: string]: { [key: string]: number } } = {};
    
    // Initialize matrix with 1s on diagonal
    assetTypes.forEach(asset => {
      matrix[asset] = {};
      assetTypes.forEach(otherAsset => {
        if (asset === otherAsset) {
          matrix[asset][otherAsset] = 1;
        } else {
          matrix[asset][otherAsset] = 0;
        }
      });
    });
    
    // Fill in correlation data
    data.forEach(item => {
      matrix[item.asset1][item.asset2] = item.correlation;
      matrix[item.asset2][item.asset1] = item.correlation; // Symmetric
    });
    
    return matrix;
  };

  const correlationMatrix = createCorrelationMatrix();

  // Flexible layout settings
  const labelWidth = { xs: 50, sm: 60, md: 70 };
  const cellSpacing = compact ? 1 : 2;
  const minCellWidth = assetTypes.length > 6 ? 40 : assetTypes.length > 4 ? 50 : 60;
  const fontSize = assetTypes.length > 6 ? '0.6rem!important' : assetTypes.length > 4 ? '0.65rem!important' : (compact ? '0.65rem!important' : '0.75rem!important');
  
  // Calculate minimum width for scroll container
  const labelMinWidth = 70; // Use max value for calculation
  const minContainerWidth = labelMinWidth + (assetTypes.length * minCellWidth) + (assetTypes.length * cellSpacing);

  const getCorrelationColor = (correlation: number) => {
    const absCorr = Math.abs(correlation);
    if (absCorr >= 0.8) return '#d32f2f'; // High correlation (red)
    if (absCorr >= 0.6) return '#f57c00'; // Medium-high correlation (orange)
    if (absCorr >= 0.4) return '#fbc02d'; // Medium correlation (yellow)
    if (absCorr >= 0.2) return '#689f38'; // Low correlation (light green)
    return '#388e3c'; // Very low correlation (green)
  };

  const getCorrelationIntensity = (correlation: number) => {
    // Return opacity value between 0.3 and 1.0 based on absolute correlation
    const absCorr = Math.abs(correlation);
    return Math.max(0.4, 0.4 + (absCorr * 0.6)); // Minimum 0.3, maximum 1.0
  };

  if (assetTypes.length === 0) {
    return (
      <Box sx={{ p: compact ? 1 : 3, textAlign: 'center' }}>
        <ResponsiveTypography variant={compact ? "tableCell" : "cardTitle"} color="text.secondary">
          {t('portfolio.noDiversificationData')}
        </ResponsiveTypography>
      </Box>
    );
  }

  return (
    <Box>
      {!compact && (
        <>
          <ResponsiveTypography variant="chartTitle">
            {title}
          </ResponsiveTypography>
          <ResponsiveTypography variant="chartSubtitle" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {t('portfolio.correlationMatrix')}
          </ResponsiveTypography>
        </>
      )}
      
      <Box sx={{ 
        overflowX: 'auto', 
        overflowY: 'hidden',
        px: { xs: 0, sm: 1 },
        mx: { xs: -3, sm: 0 }, // Negative margin on mobile to extend to edges
        '&::-webkit-scrollbar': {
          height: 8,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: 4,
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 4,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.3)',
          },
        },
      }}>
        <Box sx={{ 
          width: '100%',
          minWidth: minContainerWidth,
          overflow: 'hidden'
        }}>
          {/* Header row */}
          <Box sx={{ 
            display: 'flex', 
            mb: compact ? 0.5 : 1, 
            gap: cellSpacing,
            alignItems: 'stretch',
            width: '100%'
          }}>
            <Box sx={{ 
              width: labelWidth,
              minWidth: { xs: 50, sm: 60, md: 70 },
              height: compact ? 30 : 40,
              flexShrink: 0
            }} />
            {assetTypes.map(asset => (
              <Box 
                key={asset}
                sx={{ 
                  flex: 1,
                  minWidth: minCellWidth,
                  height: compact ? 30 : 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: fontSize,
                  fontWeight: 'bold',
                  color: 'text.secondary'
                }}
              >
                {asset.toUpperCase()}
              </Box>
            ))}
          </Box>

          {/* Correlation matrix */}
          {assetTypes.map(asset1 => (
            <Box 
              key={asset1} 
              sx={{ 
                display: 'flex', 
                mb: compact ? 0.25 : 0.5, 
                gap: cellSpacing,
                alignItems: 'stretch',
                width: '100%'
              }}
            >
              {/* Asset label */}
              <Box 
                sx={{ 
                  width: labelWidth,
                  minWidth: { xs: 50, sm: 60, md: 70 },
                  height: compact ? 30 : 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: fontSize,
                  fontWeight: 'bold',
                  color: 'text.secondary',
                  flexShrink: 0
                }}
              >
                {asset1.toUpperCase()}
              </Box>
              
              {/* Correlation cells */}
              {assetTypes.map(asset2 => {
                const correlation = correlationMatrix[asset1][asset2];
                const isDiagonal = asset1 === asset2;
                
                return (
                  <MuiTooltip 
                    key={`${asset1}-${asset2}`}
                    title={`${asset1} vs ${asset2}: ${formatPercentage(correlation)}`}
                    arrow
                  >
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: minCellWidth,
                        height: compact ? 30 : 40,
                        backgroundColor: isDiagonal ? '#e0e0e0' : getCorrelationColor(correlation),
                        opacity: isDiagonal ? 0.3 : getCorrelationIntensity(correlation),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          opacity: 1,
                          transform: 'scale(1.02)',
                          zIndex: 1,
                        },
                        borderRadius: compact ? 0.5 : 1,
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxSizing: 'border-box'
                      }}
                    >
                      {!isDiagonal && (
                        <ResponsiveTypography 
                          variant="formHelper" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 'bold',
                            //textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            fontSize: assetTypes.length > 6 ? '0.6rem!important' : '0.75rem!important',
                            lineHeight: 1,
                            textAlign: 'center'
                          }}
                        >
                          {formatPercentage(correlation)}
                        </ResponsiveTypography>
                      )}
                    </Box>
                  </MuiTooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Legend */}
      {!compact && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <ResponsiveTypography variant="chartLegend" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('portfolio.correlationLevel')}:
          </ResponsiveTypography>
        {[
          { label: t('portfolio.correlationHigh'), color: '#d32f2f' },
          { label: t('portfolio.correlationMediumHigh'), color: '#f57c00' },
          { label: t('portfolio.correlationMedium'), color: '#fbc02d' },
          { label: t('portfolio.correlationLow'), color: '#689f38' },
          { label: t('portfolio.correlationVeryLow'), color: '#388e3c' },
        ].map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: item.color,
                borderRadius: 0.25,
                border: '1px solid rgba(0,0,0,0.1)'
              }} 
            />
            <ResponsiveTypography variant="chartLegend" color="text.secondary" sx={{ fontSize: compact ? '0.6rem!important' : '0.75rem!important' }}>
              {item.label}
            </ResponsiveTypography>
          </Box>
        ))}
        </Box>
      )}
    </Box>
  );
};

export default DiversificationHeatmap;
