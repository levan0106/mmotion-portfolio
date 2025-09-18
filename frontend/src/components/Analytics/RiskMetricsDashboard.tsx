/**
 * Risk Metrics Dashboard component
 */

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  TrendingDown,
  Security,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { formatPercentage } from '../../utils/format';

interface RiskMetrics {
  var95: number;
  var99: number;
  sharpeRatio: number;
  beta: number;
  volatility: number;
  maxDrawdown: number;
  calmarRatio: number;
  sortinoRatio: number;
}

interface RiskMetricsDashboardProps {
  data: RiskMetrics;
  baseCurrency?: string;
  title?: string;
}

const RiskMetricsDashboard: React.FC<RiskMetricsDashboardProps> = ({
  data,
  title = 'Risk Metrics Dashboard',
}) => {
  // Add null checks and default values
  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No risk metrics data available
        </Typography>
      </Box>
    );
  }

  const getRiskLevel = (value: number, type: 'var' | 'volatility' | 'drawdown' | 'ratio') => {
    switch (type) {
      case 'var':
        return value > 0.1 ? 'high' : value > 0.05 ? 'medium' : 'low';
      case 'volatility':
        return value > 0.3 ? 'high' : value > 0.15 ? 'medium' : 'low';
      case 'drawdown':
        return value > 0.2 ? 'high' : value > 0.1 ? 'medium' : 'low';
      case 'ratio':
        return value > 1.5 ? 'excellent' : value > 1.0 ? 'good' : value > 0.5 ? 'fair' : 'poor';
      default:
        return 'medium';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'excellent':
      case 'low':
        return 'success';
      case 'good':
        return 'info';
      case 'fair':
      case 'medium':
        return 'warning';
      case 'poor':
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'excellent':
      case 'good':
      case 'low':
        return <CheckCircle color="success" />;
      case 'fair':
      case 'medium':
        return <Warning color="warning" />;
      case 'poor':
      case 'high':
        return <TrendingDown color="error" />;
      default:
        return <Security />;
    }
  };

  const varLevel = getRiskLevel(data.var95 || 0, 'var');
  const volatilityLevel = getRiskLevel(data.volatility || 0, 'volatility');
  const drawdownLevel = getRiskLevel(data.maxDrawdown || 0, 'drawdown');
  const sharpeLevel = getRiskLevel(data.sharpeRatio || 0, 'ratio');

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive risk analysis and portfolio health metrics
      </Typography>
      
      <Grid container spacing={3}>
        {/* VaR Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Value at Risk (95%)
                </Typography>
                {getRiskIcon(varLevel)}
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatPercentage(data.var95)}
              </Typography>
              <Chip 
                label={varLevel.toUpperCase()} 
                color={getRiskColor(varLevel) as any}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sharpe Ratio */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sharpe Ratio
                </Typography>
                {getRiskIcon(sharpeLevel)}
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {(data.sharpeRatio || 0).toFixed(2)}
              </Typography>
              <Chip 
                label={sharpeLevel.toUpperCase()} 
                color={getRiskColor(sharpeLevel) as any}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Volatility */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Volatility
                </Typography>
                {getRiskIcon(volatilityLevel)}
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatPercentage(data.volatility)}
              </Typography>
              <Chip 
                label={volatilityLevel.toUpperCase()} 
                color={getRiskColor(volatilityLevel) as any}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Max Drawdown */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Max Drawdown
                </Typography>
                {getRiskIcon(drawdownLevel)}
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {formatPercentage(data.maxDrawdown)}
              </Typography>
              <Chip 
                label={drawdownLevel.toUpperCase()} 
                color={getRiskColor(drawdownLevel) as any}
                size="small"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Additional Risk Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      VaR (99%)
                    </Typography>
                    <Typography variant="h6">
                      {formatPercentage(data.var99)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Beta
                    </Typography>
                    <Typography variant="h6">
                      {(data.beta || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Calmar Ratio
                    </Typography>
                    <Typography variant="h6">
                      {(data.calmarRatio || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sortino Ratio
                    </Typography>
                    <Typography variant="h6">
                      {(data.sortinoRatio || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiskMetricsDashboard;
