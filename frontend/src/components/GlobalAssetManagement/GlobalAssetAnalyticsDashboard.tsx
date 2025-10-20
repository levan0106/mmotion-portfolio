import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';

interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  assetPrice?: {
    currentPrice: number;
    priceType: string;
    priceSource: string;
    lastPriceUpdate: string;
  };
}

interface GlobalAssetAnalyticsDashboardProps {
  assets: GlobalAsset[];
}

const GlobalAssetAnalyticsDashboard: React.FC<GlobalAssetAnalyticsDashboardProps> = ({ assets }) => {
  const getAssetTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      STOCK: '#1976d2',
      BOND: '#388e3c',
      CRYPTO: '#f57c00',
      COMMODITY: '#7b1fa2',
      CURRENCY: '#d32f2f',
      ETF: '#0288d1',
      MUTUAL_FUND: '#5d4037',
    };
    return colors[type] || '#666';
  };

  const getNationDisplayName = (code: string) => {
    const names: Record<string, string> = {
      VN: 'Vietnam',
      US: 'United States'
    };
    return names[code] || code;
  };

  return (
    <Box>
      {/* Analytics Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          mb: 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Asset Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive insights into your asset portfolio
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {assets.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Total Assets
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Portfolio Size
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {assets.filter(asset => asset.isActive).length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Active Assets
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Currently Trading
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 2, 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {new Set(assets.map(asset => asset.nation)).size}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Nations
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Global Coverage
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asset Distribution by Type */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          mb: 3,
          color: 'text.primary'
        }}>
          Asset Distribution by Type
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(
            assets.reduce((acc, asset) => {
              acc[asset.type] = (acc[asset.type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([type, count]) => (
            <Grid item xs={12} sm={6} md={3} key={type}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: getAssetTypeColor(type) 
                      }} />
                      <Typography variant="body1" fontWeight="600">
                        {type}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700,
                      color: getAssetTypeColor(type)
                    }}>
                      {count}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {((count / assets.length) * 100).toFixed(1)}% of portfolio
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Asset Distribution by Nation */}
      <Box>
        <Typography variant="h5" sx={{ 
          fontWeight: 600, 
          mb: 3,
          color: 'text.primary'
        }}>
          Global Coverage by Nation
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(
            assets.reduce((acc, asset) => {
              acc[asset.nation] = (acc[asset.nation] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([nation, count]) => (
            <Grid item xs={12} sm={6} md={3} key={nation}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body1" fontWeight="600" sx={{ mb: 0.5 }}>
                        {getNationDisplayName(nation)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {nation}
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700,
                      color: '#667eea'
                    }}>
                      {count}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {((count / assets.length) * 100).toFixed(1)}% of portfolio
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default GlobalAssetAnalyticsDashboard;
