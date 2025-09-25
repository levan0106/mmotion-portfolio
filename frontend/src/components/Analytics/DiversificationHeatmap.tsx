/**
 * Diversification Heatmap component
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Tooltip as MuiTooltip,
} from '@mui/material';
import { formatPercentage } from '../../utils/format';

interface HeatmapData {
  asset1: string;
  asset2: string;
  correlation: number;
}

interface DiversificationHeatmapProps {
  data: HeatmapData[];
  title?: string;
}

const DiversificationHeatmap: React.FC<DiversificationHeatmapProps> = ({
  data,
  title = 'Diversification Heatmap',
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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No diversification data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Correlation matrix showing diversification between asset types
      </Typography>
      
      <Box sx={{ overflowX: 'auto', overflowY: 'hidden' }}>
        <Box sx={{ minWidth: 400, overflow: 'hidden' }}>
          {/* Header row */}
          <Grid container spacing={0.5} sx={{ mb: 1 }}>
            <Grid item xs={2}>
              <Box sx={{ height: 40 }} />
            </Grid>
            {assetTypes.map(asset => (
              <Grid item xs={2} key={asset}>
                <Box 
                  sx={{ 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
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
            <Grid container spacing={0.5} key={asset1} sx={{ mb: 0.5 }}>
              {/* Asset label */}
              <Grid item xs={2}>
                <Box 
                  sx={{ 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
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
                          height: 40,
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
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                      >
                        {!isDiagonal && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'white', 
                              fontWeight: 'bold',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                            }}
                          >
                            {formatPercentage(correlation)}
                          </Typography>
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
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          Correlation Level:
        </Typography>
        {[
          { label: 'High (≥0.8)', color: '#d32f2f' },
          { label: 'Medium-High (0.6-0.8)', color: '#f57c00' },
          { label: 'Medium (0.4-0.6)', color: '#fbc02d' },
          { label: 'Low (0.2-0.4)', color: '#689f38' },
          { label: 'Very Low (<0.2)', color: '#388e3c' },
        ].map((item, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                backgroundColor: item.color,
                borderRadius: 0.5,
                border: '1px solid rgba(0,0,0,0.1)'
              }} 
            />
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default DiversificationHeatmap;
