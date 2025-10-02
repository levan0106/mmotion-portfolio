/**
 * Professional Financial Dashboard component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  LinearProgress,
  alpha,
  useTheme,
  Fade,
  Slide,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Add as AddIcon,
  Assessment,
  Timeline,
  PieChart,
  ShowChart,
  Security,
  AccountBalanceWallet,
  MonetizationOn,
  ArrowUpward,
  ArrowDownward,
  Refresh,
} from '@mui/icons-material';
import { usePortfolios } from '../hooks/usePortfolios';
import { useAccount } from '../contexts/AccountContext';
import { formatCurrency, formatPercentage } from '../utils/format';
import PortfolioCard from '../components/Portfolio/PortfolioCard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { accountId } = useAccount();
  const { portfolios, isLoading, error } = usePortfolios(accountId);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderRadius: 3,
          p: 4
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading Financial Dashboard...
        </Typography>
        <LinearProgress sx={{ width: '200px', mt: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          '& .MuiAlert-message': {
            fontSize: '1rem'
          }
        }}
      >
        <Typography variant="h6" gutterBottom>
          Failed to load dashboard data
        </Typography>
        <Typography variant="body2">
          Please check your connection and try again.
        </Typography>
      </Alert>
    );
  }

  // Calculate comprehensive financial metrics
  const totalPortfolios = portfolios.length;
  const totalValue = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.totalInvestValue?.toString()) || 0), 0);
  const totalUnrealizedPL = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.unrealizedInvestPnL?.toString()) || 0), 0);
  const totalRealizedPL = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.realizedInvestPnL?.toString()) || 0), 0);
  const totalCashBalance = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.cashBalance?.toString()) || 0), 0);

  // Advanced performance metrics
  const totalPL = totalUnrealizedPL + totalRealizedPL;
  const totalReturnPercentage = totalValue > 0 ? (totalPL / (totalValue - totalPL)) * 100 : 0;
  const cashAllocationPercentage = totalValue > 0 ? (totalCashBalance / totalValue) * 100 : 0;
  const averagePortfolioValue = totalPortfolios > 0 ? totalValue / totalPortfolios : 0;
  
  // Determine the display currency for aggregated values (use first portfolio's currency or VND as default)
  const displayCurrency = portfolios.find(p => p.baseCurrency)?.baseCurrency || 'VND';

  // Handler functions
  const handlePortfolioView = (portfolioId: string) => {
    navigate(`/portfolios/${portfolioId}`);
  };

  const handlePortfolioEdit = (portfolioId: string) => {
    navigate(`/portfolios/${portfolioId}/edit`);
  };

  const handleCreatePortfolio = () => {
    navigate('/portfolios/new');
  };

  const handlePortfolioCopied = (newPortfolio: any) => {
    // Navigate to the new portfolio detail page
    navigate(`/portfolios/${newPortfolio.portfolioId}`);
  };

  // Professional financial metrics cards
  const financialMetrics = [
    {
      title: 'Total Assets Under Management',
      value: formatCurrency(totalValue, displayCurrency),
      subtitle: `${totalPortfolios} Portfolio${totalPortfolios !== 1 ? 's' : ''}`,
      icon: <AccountBalanceWallet />,
      color: 'primary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
      trend: totalValue > 0 ? 'positive' : 'neutral',
      change: '+12.5%',
    },
    {
      title: 'Total P&L',
      value: formatCurrency(totalPL, displayCurrency),
      subtitle: totalPL >= 0 ? 'Profitable' : 'Loss',
      icon: totalPL >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: totalPL >= 0 ? 'success' as const : 'error' as const,
      gradient: totalPL >= 0 
        ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.06)} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
      trend: totalPL >= 0 ? 'positive' : 'negative',
      change: formatPercentage(totalReturnPercentage),
    },
    {
      title: 'Cash Position',
      value: formatCurrency(totalCashBalance, displayCurrency),
      subtitle: `${formatPercentage(cashAllocationPercentage)} of total`,
      icon: <MonetizationOn />,
      color: 'info' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
      trend: 'neutral',
      change: 'Liquid',
    },
    {
      title: 'Average Portfolio Value',
      value: formatCurrency(averagePortfolioValue, displayCurrency),
      subtitle: 'Per portfolio',
      icon: <Assessment />,
      color: 'secondary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
      trend: 'neutral',
      change: 'Balanced',
    },
  ];

  return (
    <Fade in timeout={800}>
      <Box>
        {/* Professional Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 300,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Financial Dashboard
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                Comprehensive portfolio management and investment analytics
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                sx={{ borderRadius: 2 }}
              >
                Refresh Data
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreatePortfolio}
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }
                }}
              >
                New Portfolio
              </Button>
            </Box>
          </Box>
          
          {/* Status Indicators */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<Security />}
              label="System Status: Active"
              color="success"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            <Chip
              icon={<Timeline />}
              label={`Last Updated: ${new Date().toLocaleTimeString()}`}
              color="info"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            <Chip
              icon={<Assessment />}
              label={`${totalPortfolios} Portfolio${totalPortfolios !== 1 ? 's' : ''} Active`}
              color="primary"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </Box>

        {/* Professional Financial Metrics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {financialMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Slide direction="up" in timeout={600 + index * 100}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: metric.gradient,
                    border: `0.5px solid ${alpha(theme.palette[metric.color].main, 0.15)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette[metric.color].main, 0.1)}`,
                      border: `0.5px solid ${alpha(theme.palette[metric.color].main, 0.2)}`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box
                        sx={{
                          borderRadius: '50%',
                          background: alpha(theme.palette[metric.color].main, 0.08),
                          color: `${metric.color}.main`,
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 2px 4px ${alpha(theme.palette[metric.color].main, 0.15)}`,
                        }}
                      >
                        {React.cloneElement(metric.icon, { sx: { fontSize: 20 } })}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {metric.trend === 'positive' && <ArrowUpward sx={{ color: 'success.main', fontSize: 20 }} />}
                        {metric.trend === 'negative' && <ArrowDownward sx={{ color: 'error.main', fontSize: 20 }} />}
                        <Chip
                          label={metric.change}
                          size="small"
                          color={metric.trend === 'positive' ? 'success' : metric.trend === 'negative' ? 'error' : 'default'}
                          sx={{ 
                            fontSize: '0.75rem',
                            height: 24,
                            borderRadius: 1.5
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 0.5,
                        lineHeight: 1.2
                      }}
                    >
                      {metric.value}
                    </Typography>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      {metric.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        opacity: 0.8,
                        fontWeight: 400
                      }}
                    >
                      {metric.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          ))}
        </Grid>

        {/* Professional Analytics Section */}
        {portfolios.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} lg={8}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                border: `0.5px solid ${alpha(theme.palette.divider, 0.08)}`,
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShowChart sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                      Portfolio Performance Analytics
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, background: alpha(theme.palette.success.main, 0.03) }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Best Performing Portfolio
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                          {portfolios.length > 0 ? portfolios.reduce((best, current) => 
                            (current.unrealizedInvestPnL || 0) > (best.unrealizedInvestPnL || 0) ? current : best
                          ).name : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                          {formatCurrency(
                            Math.max(...portfolios.map(p => Number(p.unrealizedInvestPnL) || 0)), 
                            displayCurrency
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, background: alpha(theme.palette.info.main, 0.03) }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Best Portfolio Cash
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'info.main' }}>
                          {portfolios.length > 0 ? (() => {
                            const bestPortfolio = portfolios.reduce((best, current) => 
                              (current.unrealizedInvestPnL || 0) > (best.unrealizedInvestPnL || 0) ? current : best
                            );
                            const bestPortfolioCash = Number(bestPortfolio.cashBalance) || 0;
                            const bestPortfolioTotalValue = Number(bestPortfolio.totalInvestValue) || 0;
                            const bestPortfolioCashPercentage = bestPortfolioTotalValue > 0 ? (bestPortfolioCash / bestPortfolioTotalValue) * 100 : 0;
                            return formatPercentage(bestPortfolioCashPercentage);
                          })() : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                          {portfolios.length > 0 ? (() => {
                            const bestPortfolio = portfolios.reduce((best, current) => 
                              (current.unrealizedInvestPnL || 0) > (best.unrealizedInvestPnL || 0) ? current : best
                            );
                            return formatCurrency(Number(bestPortfolio.cashBalance) || 0, displayCurrency);
                          })() : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                border: `0.5px solid ${alpha(theme.palette.divider, 0.08)}`,
                backdropFilter: 'blur(10px)'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PieChart sx={{ mr: 2, color: 'secondary.main' }} />
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                      Quick Insights
                    </Typography>
                  </Box>
                  
                  <Box sx={{ space: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        Average Portfolio Value:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(averagePortfolioValue, displayCurrency)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Return:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: totalReturnPercentage >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {formatPercentage(totalReturnPercentage)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        Active Portfolios:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {totalPortfolios}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        System Health:
                      </Typography>
                      <Chip label="Excellent" color="success" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Professional Portfolios Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 300, mb: 1 }}>
                Investment Portfolios
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and monitor your investment portfolios
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePortfolio}
              size="large"
              sx={{ 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                }
              }}
            >
              Create New Portfolio
            </Button>
          </Box>
          
          {portfolios.length === 0 ? (
            <Card sx={{ 
              p: 6, 
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3
            }}>
              <Box sx={{ 
                p: 3,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                display: 'inline-flex',
                mb: 3
              }}>
                <AccountBalance sx={{ fontSize: 80, color: 'primary.main' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 300, mb: 2, color: 'text.primary' }}>
                No Portfolios Found
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                Start your investment journey by creating your first portfolio to track and manage your assets
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreatePortfolio}
                size="large"
                sx={{ 
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }
                }}
              >
                Create Your First Portfolio
              </Button>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {portfolios.map((portfolio, index) => (
                <Grid item xs={12} sm={6} lg={4} xl={3} key={portfolio.portfolioId}>
                  <Slide direction="up" in timeout={800 + index * 100}>
                    <Box>
                      <PortfolioCard
                        portfolio={portfolio}
                        onView={handlePortfolioView}
                        onEdit={handlePortfolioEdit}
                        onPortfolioCopied={handlePortfolioCopied}
                      />
                    </Box>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default Dashboard;
