import React from 'react';
import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { 
  borderStyles, 
  createBorder, 
  applyBorderStyle, 
  borderCombinations 
} from '../../utils/borderUtils';
import BorderBox from './BorderBox';

/**
 * Example component demonstrating border system usage
 */
export const BorderExamples: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Border System Examples
      </Typography>
      
      <Grid container spacing={3}>
        {/* Predefined Border Styles */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Predefined Border Styles
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(borderStyles).map(([name, style]) => (
              <Grid item xs={12} sm={6} md={4} key={name}>
                <Card sx={applyBorderStyle(name as keyof typeof borderStyles)}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {name.charAt(0).toUpperCase() + name.slice(1)} Border
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {('border' in style ? style.border : 'No border')} | {('borderRadius' in style ? style.borderRadius : 'No radius')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Border with Hover Effects */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Border with Hover Effects
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(borderCombinations).map(([name, style]) => (
              <Grid item xs={12} sm={6} md={4} key={name}>
                <Card sx={style}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hover to see effect
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Custom Border Examples */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Custom Border Examples
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={createBorder({ width: 'thick', color: 'primary', radius: 'lg' })}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Thick Primary Border
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Custom thick border with primary color
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={createBorder({ width: 'normal', color: 'success', radius: 'md' })}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Success Border
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Custom border with success color
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={createBorder({ width: 'thin', color: 'warning', radius: 'sm' })}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Warning Border
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Custom border with warning color
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        {/* BorderBox Component Examples */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            BorderBox Component Examples
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <BorderBox borderStyle="card" borderSize="md" borderColor="light">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Card BorderBox
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Using BorderBox component with card style
                  </Typography>
                </Box>
              </BorderBox>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <BorderBox borderStyle="section" borderSize="lg" borderColor="primary">
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Section BorderBox
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Using BorderBox component with section style
                  </Typography>
                </Box>
              </BorderBox>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <BorderBox 
                customBorder={{
                  border: '2px dashed #1976d2',
                  borderRadius: '12px'
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Custom BorderBox
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Using BorderBox with custom border
                  </Typography>
                </Box>
              </BorderBox>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BorderExamples;
