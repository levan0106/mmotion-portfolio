/**
 * Trading page for managing trades and positions
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  // Fab,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { 
  Add as AddIcon,
  AccountBalance,
  Assessment,
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  Sell as SellIcon,
  MonetizationOn as MonetizationOnIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { TradeForm } from '../components/Trading/TradeForm';
import { TradeListContainer } from '../components/Trading/TradeList';
import { TradeAnalysisContainer } from '../components/Trading/TradeAnalysis';
import { useCreateTrade, useTrades } from '../hooks/useTrading';
import { CreateTradeDto, TradeFormData } from '../types';
import { formatCurrency } from '../utils/format';
import { ResponsiveButton } from '../components/Common';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Trading: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const createTradeMutation = useCreateTrade();
  const tradesQuery = useTrades(portfolioId!);
  const trades = tradesQuery.data || [];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToPortfolio = () => {
    navigate(`/portfolios/${portfolioId}`);
  };

  const handleCreateTrade = async (data: CreateTradeDto) => {
    try {
      await createTradeMutation.mutateAsync(data);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating trade:', error);
    }
  };

  const handleCreateTradeFromForm = async (data: TradeFormData) => {
    // Convert TradeFormData to CreateTradeDto
    const createTradeData: CreateTradeDto = {
      ...data,
      tradeDate: data.tradeDate, // Already a string in TradeFormData
    };
    await handleCreateTrade(createTradeData);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
  };

  const handleCreateTradeFromHistory = () => {
    setTabValue(2); // Switch to Create Trade tab
  };

  const handleAssetCreated = async () => {
    // Refresh trades query to get updated asset data with prices
    await tradesQuery.refetch();
  };

  // Calculate summary statistics
  const totalTrades = trades?.length || 0;
  const buyTrades = trades?.filter((trade: any) => trade.side === 'BUY').length || 0;
  const sellTrades = trades?.filter((trade: any) => trade.side === 'SELL').length || 0;
  const totalVolume = trades?.reduce((sum: number, trade: any) => sum + (Number(trade.totalValue) || 0), 0) || 0;
  const totalFees = trades?.reduce((sum: number, trade: any) => sum + (Number(trade.fee) || 0), 0) || 0;
  const totalTaxes = trades?.reduce((sum: number, trade: any) => sum + (Number(trade.tax) || 0), 0) || 0;
  const totalFeesAndTaxes = totalFees + totalTaxes;
  const realizedPL = trades?.reduce((sum: number, trade: any) => sum + (Number(trade.realizedPl) || 0), 0) || 0;

  const summaryCards = [
    {
      title: 'Total Trades',
      value: totalTrades.toString(),
      icon: <ShowChartIcon sx={{ fontSize: 32 }} />,
      color: 'primary',
    },
    {
      title: 'Buy Orders',
      value: buyTrades.toString(),
      icon: <ShoppingCartIcon sx={{ fontSize: 32 }} />,
      color: 'success',
    },
    {
      title: 'Sell Orders',
      value: sellTrades.toString(),
      icon: <SellIcon sx={{ fontSize: 32 }} />,
      color: 'error',
    },
    {
      title: 'Total Volume',
      value: formatCurrency(totalVolume),
      icon: <MonetizationOnIcon sx={{ fontSize: 32 }} />,
      color: 'info',
    },
  ];

  if (!portfolioId) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Portfolio not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Trading Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your trades, analyze performance, and track positions
            </Typography>
          </Box>
          <ResponsiveButton
            variant="outlined"
            icon={<ArrowBackIcon />}
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToPortfolio}
            mobileText="Back"
            desktopText="Back to Portfolio"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
            }}
          >
            Back to Portfolio
          </ResponsiveButton>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
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

      {/* Trading Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Trading Performance
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="h4" color="text.primary" fontWeight="bold">
                      {formatCurrency(totalFeesAndTaxes)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Total Fees & Taxes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ 
                    bgcolor: realizedPL >= 0 ? 'success.50' : 'error.50', 
                    borderRadius: 2 
                  }}>
                    <Typography 
                      variant="h4" 
                      color={realizedPL >= 0 ? 'success.main' : 'error.main'} 
                      fontWeight="bold"
                    >
                      {formatCurrency(realizedPL)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Realized P&L
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ bgcolor: 'info.50', borderRadius: 2 }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {formatCurrency(totalVolume)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Total Volume
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ bgcolor: 'primary.50', borderRadius: 2 }}>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {totalTrades}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Total Trades
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', boxShadow: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="trading tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: 48,
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              },
            }}
          >
            <Tab 
              label="Trade History" 
              icon={<AccountBalance />}
              iconPosition="start"
            />
            <Tab 
              label="Analysis" 
              icon={<Assessment />}
              iconPosition="start"
            />
            <Tab 
              label="Create Trade" 
              icon={<AddIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TradeListContainer portfolioId={portfolioId} onCreate={handleCreateTradeFromHistory} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TradeAnalysisContainer portfolioId={portfolioId} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <TradeForm
              onSubmit={handleCreateTradeFromForm}
              isLoading={createTradeMutation.isLoading}
              error={createTradeMutation.error?.message}
              mode="create"
              defaultPortfolioId={portfolioId}
              onAssetCreated={handleAssetCreated}
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* Floating Action Button for Quick Create */}
      {/* <Fab
        color="primary"
        aria-label="add trade"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: 3,
          '&:hover': {
            boxShadow: 6,
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
        }}
        onClick={() => setShowCreateForm(true)}
      >
        <AddIcon />
      </Fab> */}

      {/* Create Trade Modal */}
      <TradeForm
        open={showCreateForm}
        onClose={handleCloseForm}
        onSubmit={handleCreateTradeFromForm}
        defaultPortfolioId={portfolioId}
        isLoading={createTradeMutation.isLoading}
        error={createTradeMutation.error?.message}
        onAssetCreated={handleAssetCreated}
        mode="create"
        isModal={true}
        showSubmitButton={false}
      />
    </Box>
  );
};

export default Trading;
