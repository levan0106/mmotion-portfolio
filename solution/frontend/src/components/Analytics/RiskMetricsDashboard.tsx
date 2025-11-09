/**
 * Risk Metrics Dashboard component
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import {
  TrendingDown,
  Security,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { formatPercentage } from '../../utils/format';
import { useRiskMetricsWithError } from '../../hooks/useRiskMetrics';

interface RiskMetricsDashboardProps {
  portfolioId: string;
  baseCurrency?: string;
  title?: string;
  compact?: boolean;
}

const RiskMetricsDashboard: React.FC<RiskMetricsDashboardProps> = ({
  portfolioId,
  title = 'Risk Metrics Dashboard',
  compact = false,
}) => {
  const { t } = useTranslation();
  
  // Fetch risk metrics data using the hook
  const {
    riskMetrics: data,
    isLoading,
    error,
    hasData
  } = useRiskMetricsWithError({ portfolioId });

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <ResponsiveTypography variant="pageSubtitle" sx={{ ml: 2 }}>
          {t('riskMetrics.loading')}
        </ResponsiveTypography>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error">
        {t('riskMetrics.error.loadFailed')}: {error}
      </Alert>
    );
  }

  // No data state
  if (!hasData || !data) {
    return (
      <Box sx={{ p: compact ? 2 : 3, textAlign: 'center' }}>
        <ResponsiveTypography 
          variant="pageSubtitle" 
          color="text.secondary"
        >
          {t('riskMetrics.noData')}
        </ResponsiveTypography>
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
      <ResponsiveTypography 
        variant="cardTitle" 
        gutterBottom
      >
        {title}
      </ResponsiveTypography>
      {!compact && (
        <ResponsiveTypography 
          variant="formHelper" 
          color="text.secondary" 
          sx={{ mb: 3 }}
        >
          {t('riskMetrics.subtitle')}
        </ResponsiveTypography>
      )}
      
      <Grid container spacing={compact ? 1 : 3}>
        {/* VaR Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid #e3f2fd',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ py: compact ? 0.5 : 1, px:2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={compact ? 0.5 : 1}>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary"
                >
                  {t('riskMetrics.var95')}
                </ResponsiveTypography>
                {getRiskIcon(varLevel)}
              </Box>
              <ResponsiveTypography 
                variant="cardValue" 
                color="primary" 
                fontWeight="bold"
              >
                {formatPercentage(data.var95, 2)}
              </ResponsiveTypography>
              <Chip 
                label={varLevel.toUpperCase()} 
                color={getRiskColor(varLevel) as any}
                size="small"
                sx={{ 
                  mt: 1,
                  fontSize: compact ? '0.65rem' : '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sharpe Ratio */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #f3e5f5 100%)',
            border: '1px solid #e1bee7',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ py: compact ? 0.5 : 1, px:2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={compact ? 0.5 : 1}>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary"
                >
                  {t('riskMetrics.sharpeRatio')}
                </ResponsiveTypography>
                {getRiskIcon(sharpeLevel)}
              </Box>
              <ResponsiveTypography 
                variant="cardValue" 
                color="primary" 
                fontWeight="bold"
              >
                {(data.sharpeRatio || 0).toFixed(2)}
              </ResponsiveTypography>
              <Chip 
                label={sharpeLevel.toUpperCase()} 
                color={getRiskColor(sharpeLevel) as any}
                size="small"
                sx={{ 
                  mt: 1,
                  fontSize: compact ? '0.65rem' : '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Volatility */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #fff3e0 100%)',
            border: '1px solid #ffcc02',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ py: compact ? 0.5 : 1, px:2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={compact ? 0.5 : 1}>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary"
                >
                  {t('riskMetrics.volatility')}
                </ResponsiveTypography>
                {getRiskIcon(volatilityLevel)}
              </Box>
              <ResponsiveTypography 
                variant="cardValue" 
                color="primary" 
                fontWeight="bold"
              >
                {formatPercentage(data.volatility, 2)}
              </ResponsiveTypography>
              <Chip 
                label={volatilityLevel.toUpperCase()} 
                color={getRiskColor(volatilityLevel) as any}
                size="small"
                sx={{ 
                  mt: 1,
                  fontSize: compact ? '0.65rem' : '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Max Drawdown */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: 'linear-gradient(135deg, #ffffff 0%, #ffebee 100%)',
            border: '1px solid #ffcdd2',
            borderRadius: 2,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <CardContent sx={{ py: compact ? 0.5 : 1, px:2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={compact ? 0.5 : 1}>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary"
                >
                  {t('riskMetrics.maxDrawdown')}
                </ResponsiveTypography>
                {getRiskIcon(drawdownLevel)}
              </Box>
              <ResponsiveTypography 
                variant="cardValue" 
                color="primary" 
                fontWeight="bold"
              >
                {formatPercentage(data.maxDrawdown, 2)}
              </ResponsiveTypography>
              <Chip 
                label={drawdownLevel.toUpperCase()} 
                color={getRiskColor(drawdownLevel) as any}
                size="small"
                sx={{ 
                  mt: 1,
                  fontSize: compact ? '0.65rem' : '0.75rem'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Metrics */}
        {!compact && (
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 2 }}>
                <ResponsiveTypography 
                  variant="cardTitle" 
                  gutterBottom
                >
                  {t('riskMetrics.additionalMetrics')}
                </ResponsiveTypography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography 
                        variant="formHelper" 
                        color="text.secondary" 
                        gutterBottom
                      >
                        {t('riskMetrics.var99')}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="cardValue"
                      >
                        {formatPercentage(data.var99, 2)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography 
                        variant="formHelper" 
                        color="text.secondary" 
                        gutterBottom
                      >
                        {t('riskMetrics.beta')}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="cardValue"
                      >
                        {(data.beta || 0).toFixed(2)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography 
                        variant="formHelper" 
                        color="text.secondary" 
                        gutterBottom
                      >
                        {t('riskMetrics.calmarRatio')}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="cardValue"
                      >
                        {(data.calmarRatio || 0).toFixed(2)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={6} md={3}>
                    <Box>
                      <ResponsiveTypography 
                        variant="formHelper" 
                        color="text.secondary" 
                        gutterBottom
                      >
                        {t('riskMetrics.sortinoRatio')}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="cardValue"
                      >
                        {(data.sortinoRatio || 0).toFixed(2)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RiskMetricsDashboard;
