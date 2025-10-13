/**
 * Diversification Heatmap component
 */

import React from 'react';
import {
  Box,
  Grid,
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
          No diversification data available
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
          <ResponsiveTypography variant="chartSubtitle" color="text.secondary">
            Correlation matrix showing diversification between asset types
          </ResponsiveTypography>
        </>
      )}
      
      <Box sx={{ 
        overflowX: 'auto', 
        overflowY: 'hidden',
        px: { xs: 0, sm: 1 },
        mx: { xs: -3, sm: 0 } // Negative margin on mobile to extend to edges
      }}>
        <Box sx={{ minWidth: compact ? 300 : 400, overflow: 'hidden' }}>
          {/* Header row */}
          <Grid container spacing={compact ? 0.25 : 0.5} sx={{ mb: compact ? 0.5 : 1 }}>
            <Grid item xs={2}>
              <Box sx={{ height: compact ? 30 : 40 }} />
            </Grid>
            {assetTypes.map(asset => (
              <Grid item xs={2} key={asset}>
                <Box 
                  sx={{ 
                    height: compact ? 30 : 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: compact ? '0.65rem' : '0.75rem',
                    fontWeight: 'bold',
                    color: 'text.secondary'
                  }}
                >
                  {asset.toUpperCase()}
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Correlation matrix */}
          {assetTypes.map(asset1 => (
            <Grid container spacing={compact ? 0.25 : 0.5} key={asset1} sx={{ mb: compact ? 0.25 : 0.5 }}>
              {/* Asset label */}
              <Grid item xs={2}>
                <Box 
                  sx={{ 
                    height: compact ? 30 : 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: compact ? '0.65rem' : '0.75rem',
                    fontWeight: 'bold',
                    color: 'text.secondary'
                  }}
                >
                  {asset1.toUpperCase()}
                </Box>
              </Grid>
              
              {/* Correlation cells */}
              {assetTypes.map(asset2 => {
                const correlation = correlationMatrix[asset1][asset2];
                const isDiagonal = asset1 === asset2;
                
                return (
                  <Grid item xs={2} key={`${asset1}-${asset2}`}>
                    <MuiTooltip 
                      title={`${asset1} vs ${asset2}: ${formatPercentage(correlation)}`}
                      arrow
                    >
                      <Box
                        sx={{
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
                        }}
                      >
                        {!isDiagonal && (
                          <ResponsiveTypography 
                            variant="formHelper" 
                            sx={{ 
                              color: 'white', 
                              fontWeight: 'bold',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                            }}
                          >
                            {formatPercentage(correlation)}
                          </ResponsiveTypography>
                        )}
                      </Box>
                    </MuiTooltip>
                  </Grid>
                );
              })}
            </Grid>
          ))}
        </Box>
      </Box>

      {/* Legend */}
      {!compact && (
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <ResponsiveTypography variant="chartLegend" color="text.secondary" sx={{ fontWeight: 600 }}>
            Correlation Level:
          </ResponsiveTypography>
        {[
          { label: 'High (≥0.8)', color: '#d32f2f' },
          { label: 'Medium-High (0.6-0.8)', color: '#f57c00' },
          { label: 'Medium (0.4-0.6)', color: '#fbc02d' },
          { label: 'Low (0.2-0.4)', color: '#689f38' },
          { label: 'Very Low (<0.2)', color: '#388e3c' },
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
