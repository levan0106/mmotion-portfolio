/**
 * Professional Financial Dashboard component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
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
import { usePortfolioChangeForAllPortfolios } from '../hooks/usePortfolioChange';
import { useAccount } from '../contexts/AccountContext';
import { formatCurrency, formatPercentage } from '../utils/format';
import PortfolioCard from '../components/Portfolio/PortfolioCard';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { ResponsiveButton } from '../components/Common';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { accountId } = useAccount();
  const { portfolios, isLoading, error } = usePortfolios(accountId);

  const { change: totalChange, isLoading: isChangeLoading } = usePortfolioChangeForAllPortfolios(portfolios || [], '1M');

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
        <ResponsiveTypography variant="pageSubtitle" sx={{ mt: 2 }}>
          Loading Financial Dashboard...
        </ResponsiveTypography>
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
        <ResponsiveTypography variant="cardTitle" gutterBottom>
          Failed to load dashboard data
        </ResponsiveTypography>
        <ResponsiveTypography variant="formHelper">
          Please check your connection and try again.
        </ResponsiveTypography>
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
      change: isChangeLoading ? '...' : (totalChange || '+0.0%'),
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
              <ResponsiveTypography 
                variant="pageHeader"
                sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Financial Dashboard
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" ellipsis={false}>
                Comprehensive portfolio management and investment analytics
              </ResponsiveTypography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ResponsiveButton
                variant="outlined"
                icon={<Refresh />}
                startIcon={<Refresh />}
                mobileText="Refresh"
                desktopText="Refresh Data"
                sx={{ borderRadius: 2 }}
              >
                Refresh Data
              </ResponsiveButton>
              <ResponsiveButton
                variant="contained"
                icon={<AddIcon />}
                startIcon={<AddIcon />}
                onClick={handleCreatePortfolio}
                mobileText="New"
                desktopText="New Portfolio"
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }
                }}
              >
                New Portfolio
              </ResponsiveButton>
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
                    
                    <ResponsiveTypography 
                      variant="cardValueLarge" 
                      sx={{ 
                        color: 'text.primary',
                        mb: 0.5,
                        fontWeight: 800
                      }}
                    >
                      {metric.value}
                    </ResponsiveTypography>
                    
                    <ResponsiveTypography 
                      variant="cardTitle" 
                      color="text.secondary"
                      sx={{ 
                        mb: 0.5
                      }}
                    >
                      {metric.title}
                    </ResponsiveTypography>
                    
                    <ResponsiveTypography 
                      variant="cardLabel" 
                      color="text.secondary"
                      sx={{ 
                        opacity: 0.8
                      }}
                    > 
                      {metric.subtitle}
                    </ResponsiveTypography>
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
                    <ResponsiveTypography variant="chartTitle" sx={{ fontWeight: "500" }}>
                      Portfolio Performance Analytics
                    </ResponsiveTypography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, background: alpha(theme.palette.success.main, 0.03) }}>
                        <ResponsiveTypography variant="formHelper" gutterBottom>
                          Best Performing Portfolio
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardTitle" sx={{ color: 'success.main' }}>
                          {portfolios.length > 0 ? portfolios.reduce((best, current) => 
                            (current.unrealizedInvestPnL || 0) > (best.unrealizedInvestPnL || 0) ? current : best
                          ).name : 'N/A'}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardValueMedium" sx={{ color: 'success.main' }}>
                          {formatCurrency(
                            Math.max(...portfolios.map(p => Number(p.unrealizedInvestPnL) || 0)), 
                            displayCurrency
                          )}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, background: alpha(theme.palette.info.main, 0.03) }}>
                        <ResponsiveTypography variant="formHelper" gutterBottom>
                          Best Portfolio Cash
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardTitle" sx={{ color: 'info.main' }}>
                          {portfolios.length > 0 ? (() => {
                            const bestPortfolio = portfolios.reduce((best, current) => 
                              (current.unrealizedInvestPnL || 0) > (best.unrealizedInvestPnL || 0) ? current : best
                            );
                            const bestPortfolioCash = Number(bestPortfolio.cashBalance) || 0;
                            const bestPortfolioTotalValue = Number(bestPortfolio.totalInvestValue) || 0;
                            const bestPortfolioCashPercentage = bestPortfolioTotalValue > 0 ? (bestPortfolioCash / bestPortfolioTotalValue) * 100 : 0;
                            return formatPercentage(bestPortfolioCashPercentage);
                          })() : 'N/A'}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardValueMedium" sx={{ color: 'info.main' }}>
                          {portfolios.length > 0 ? (() => {
                            const bestPortfolio = portfolios.reduce((best, current) => 
                              (current.unrealizedInvestPnL || 0) > (best.unrealizedInvestPnL || 0) ? current : best
                            );
                            return formatCurrency(Number(bestPortfolio.cashBalance) || 0, displayCurrency);
                          })() : 'N/A'}
                        </ResponsiveTypography>
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
                    <ResponsiveTypography variant="chartTitle" sx={{ fontWeight: "500" }}>
                      Quick Insights
                    </ResponsiveTypography>
                  </Box>
                  
                  <Box sx={{ space: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <ResponsiveTypography variant="tableCell">
                        Average Portfolio Value:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValueMedium">
                        {formatCurrency(averagePortfolioValue, displayCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <ResponsiveTypography variant="tableCell">
                        Total Return:
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="cardValueMedium" 
                        sx={{ 
                          color: totalReturnPercentage >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {formatPercentage(totalReturnPercentage)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                      <ResponsiveTypography variant="tableCell">
                        Active Portfolios:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValueMedium">
                        {totalPortfolios}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
                      <ResponsiveTypography variant="tableCell">
                        System Health:
                      </ResponsiveTypography>
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
              <ResponsiveTypography variant="pageTitle" component="h2" sx={{ mb: 1 }}>
                Investment Portfolios
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle">
                Manage and monitor your investment portfolios
              </ResponsiveTypography>
            </Box>
            <ResponsiveButton
              variant="contained"
              icon={<AddIcon />}
              startIcon={<AddIcon />}
              onClick={handleCreatePortfolio}
              size="large"
              mobileText="Create"
              desktopText="Create New Portfolio"
              sx={{ 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                }
              }}
            >
              Create New Portfolio
            </ResponsiveButton>
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
              <ResponsiveTypography variant="pageTitle" sx={{ mb: 2, color: 'text.primary' }}>
                No Portfolios Found
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                Start your investment journey by creating your first portfolio to track and manage your assets
              </ResponsiveTypography>
              <ResponsiveButton
                variant="contained"
                icon={<AddIcon />}
                startIcon={<AddIcon />}
                onClick={handleCreatePortfolio}
                size="large"
                mobileText="Create"
                desktopText="Create Your First Portfolio"
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
              </ResponsiveButton>
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
