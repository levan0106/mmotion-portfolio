/**
 * Dashboard page component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Add as AddIcon,
} from '@mui/icons-material';
import { usePortfolios } from '../hooks/usePortfolios';
import { useAccount } from '../hooks/useAccount';
import { formatCurrency, formatPercentage } from '../utils/format';
import PortfolioCard from '../components/Portfolio/PortfolioCard';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { accountId } = useAccount();
  const { portfolios, isLoading, error } = usePortfolios(accountId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load dashboard data. Please try again.
      </Alert>
    );
  }

  // Calculate summary statistics
  const totalPortfolios = portfolios.length;
  const totalValue = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.totalInvestValue?.toString()) || 0), 0);
  const totalUnrealizedPL = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.unrealizedInvestPnL?.toString()) || 0), 0);
  const totalRealizedPL = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.realizedInvestPnL?.toString()) || 0), 0);
  const totalCashBalance = portfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio.cashBalance?.toString()) || 0), 0);

  // Calculate performance metrics
  const totalPL = totalUnrealizedPL + totalRealizedPL;
  const totalReturnPercentage = totalValue > 0 ? (totalPL / (totalValue - totalPL)) * 100 : 0;
  
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

  const summaryCards = [
    {
      title: 'Total Portfolios',
      value: totalPortfolios.toString(),
      icon: <AccountBalance />,
      color: 'primary',
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue, displayCurrency),
      icon: <AttachMoney />,
      color: 'success',
    },
    {
      title: 'Total P&L',
      value: formatCurrency(totalPL, displayCurrency),
      icon: totalPL >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: totalPL >= 0 ? 'success' : 'error',
    },
    {
      title: 'Total Return',
      value: formatPercentage(totalReturnPercentage),
      icon: totalReturnPercentage >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: totalReturnPercentage >= 0 ? 'success' : 'error',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Overview of your investment portfolios and performance
      </Typography>

      {/* Overview Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Summary Cards - 2/3 width */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {summaryCards.map((card, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flex={1}>
                      <Box>
                        <Typography color="text.secondary" gutterBottom variant="body2">
                          {card.title}
                        </Typography>
                        <Typography variant="h5" component="div">
                          {card.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          color: `${card.color}.main`,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {card.icon}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Portfolio Insights - 1/3 width */}
        {portfolios.length > 0 && (
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom>
                Portfolio Insights
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid" borderColor="divider">
                  <Typography variant="body2" color="text.secondary">
                    Average Portfolio Value:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(totalValue / portfolios.length, displayCurrency)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid" borderColor="divider">
                  <Typography variant="body2" color="text.secondary">
                    Cash Allocation:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatPercentage((totalCashBalance / totalValue) * 100)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1.5} borderBottom="1px solid" borderColor="divider">
                  <Typography variant="body2" color="text.secondary">
                    Best Performer:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    {portfolios.length > 0 ? portfolios.reduce((best, current) => 
                      (current.unrealizedInvestPnL || 0) > (best.unrealizedInvestPnL || 0) ? current : best
                    ).name : 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1.5}>
                  <Typography variant="body2" color="text.secondary">
                    Total Cash Balance:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(totalCashBalance, displayCurrency)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Portfolios Section */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2">
            Your Portfolios
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePortfolio}
            sx={{ borderRadius: 2 }}
          >
            Create Portfolio
          </Button>
        </Box>
        
        {portfolios.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No portfolios found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create your first portfolio to start tracking your investments
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePortfolio}
              size="large"
              sx={{ borderRadius: 2 }}
            >
              Create Your First Portfolio
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {portfolios.map((portfolio) => (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={portfolio.portfolioId}>
                <PortfolioCard
                  portfolio={portfolio}
                  onView={handlePortfolioView}
                  onEdit={handlePortfolioEdit}
                  onPortfolioCopied={handlePortfolioCopied}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
