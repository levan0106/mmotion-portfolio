import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { UnrealizedPnLChart } from './UnrealizedPnLChart';
import { PNL_COLOR_SCHEMES, type PnLColorScheme } from '../../config/chartColors';

// Sample data for demo
const sampleData = [
  {
    assetType: 'STOCK',
    performance: 0.15,
    value: 100000,
    unrealizedPl: 15000,
    positionCount: 5,
  },
  {
    assetType: 'BOND',
    performance: 0.05,
    value: 50000,
    unrealizedPl: 2500,
    positionCount: 3,
  },
  {
    assetType: 'GOLD',
    performance: -0.08,
    value: 30000,
    unrealizedPl: -2400,
    positionCount: 2,
  },
  {
    assetType: 'CRYPTO',
    performance: -0.12,
    value: 20000,
    unrealizedPl: -2400,
    positionCount: 4,
  },
  {
    assetType: 'DEPOSITS',
    performance: 0.02,
    value: 80000,
    unrealizedPl: 1600,
    positionCount: 1,
  },
];

const UnrealizedPnLChartDemo: React.FC = () => {
  const [colorScheme, setColorScheme] = useState<PnLColorScheme>('default');

  const handleColorSchemeChange = (event: any) => {
    setColorScheme(event.target.value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Unrealized P&L Chart - Color Schemes Demo
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Color Scheme</InputLabel>
          <Select
            value={colorScheme}
            label="Color Scheme"
            onChange={handleColorSchemeChange}
          >
            {Object.keys(PNL_COLOR_SCHEMES).map((scheme) => (
              <MenuItem key={scheme} value={scheme}>
                {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chart with {colorScheme} color scheme
              </Typography>
              <UnrealizedPnLChart
                data={sampleData}
                baseCurrency="VND"
                compact={false}
                colorScheme={colorScheme}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Color Preview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Positive P&L:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: PNL_COLOR_SCHEMES[colorScheme].positive,
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="body2">
                      {PNL_COLOR_SCHEMES[colorScheme].positive}
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Negative P&L:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: PNL_COLOR_SCHEMES[colorScheme].negative,
                        borderRadius: 1,
                      }}
                    />
                    <Typography variant="body2">
                      {PNL_COLOR_SCHEMES[colorScheme].negative}
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Light Backgrounds:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: PNL_COLOR_SCHEMES[colorScheme].positiveLight,
                          borderRadius: 1,
                          border: '1px solid #ccc',
                        }}
                      />
                      <Typography variant="caption">
                        Positive: {PNL_COLOR_SCHEMES[colorScheme].positiveLight}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          backgroundColor: PNL_COLOR_SCHEMES[colorScheme].negativeLight,
                          borderRadius: 1,
                          border: '1px solid #ccc',
                        }}
                      />
                      <Typography variant="caption">
                        Negative: {PNL_COLOR_SCHEMES[colorScheme].negativeLight}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UnrealizedPnLChartDemo;
