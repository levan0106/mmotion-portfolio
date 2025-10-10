/**
 * Portfolio detail page component
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CircularProgress,
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as AllocationIcon,
  SwapHoriz as TradingIcon,
  AccountBalance as DepositIcon,
  AttachMoney as CashFlowIcon,
  Inventory as HoldingsIcon,
} from '@mui/icons-material';
import { usePortfolio, usePortfolioAnalytics } from '../hooks/usePortfolios';
import { useCreateTrade, useTrades } from '../hooks/useTrading';
import { TradeForm } from '../components/Trading/TradeForm';
import { ModalWrapper } from '../components/Common/ModalWrapper';
import { 
  PerformanceTab,
  AllocationTab,
  TradingManagementTab,
  DepositManagementTab,
  CashFlowTab,
  NAVHoldingsTab
} from '../components/PortfolioTabs';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumberWithSeparators 
} from '../utils/format';
import { CreateTradeDto } from '../types';
import './PortfolioDetail.styles.css';

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
      id={`portfolio-tabpanel-${index}`}
      aria-labelledby={`portfolio-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PortfolioDetail: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 5) {
        setTabValue(tabIndex);
      }
    }
  }, [searchParams]);

  // Ultra compact mode - gấp đôi compact
  const getUltraSpacing = (normal: number, ultra: number) => 
    isCompactMode ? ultra : normal;

  const { portfolio, isLoading: isPortfolioLoading, error: portfolioError, refetch: refetchPortfolio } = usePortfolio(portfolioId!);
  const {
    // navData,
    performanceData,
  } = usePortfolioAnalytics(portfolioId!);
  
  const createTradeMutation = useCreateTrade();
  const tradesQuery = useTrades(portfolioId!);
  const trades = tradesQuery.data || [];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTrade = async (data: CreateTradeDto) => {
    try {
      await createTradeMutation.mutateAsync(data);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating trade:', error);
    }
  };

  const handleRefreshAll = async () => {
    if (!portfolioId) return;
    
    setIsRefreshingAll(true);
    try {
      // Refresh all data in parallel
      await Promise.all([
        // Portfolio data
        refetchPortfolio(),
        // Trades data
        tradesQuery.refetch(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Calculate trading summary
  const totalTrades = trades.length;
  const totalTradeVolume = trades.reduce((sum, trade) => sum + (Number(trade.quantity) * Number(trade.price) || 0), 0);
  const totalTradeFeesAndTaxes = trades.reduce((sum, trade) => sum + (Number(trade.fee) || 0) + (Number(trade.tax) || 0), 0);
  const totalTradeRealizedPL = trades.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0);

  const handleBack = () => {
    navigate('/portfolios');
  };

  if (isPortfolioLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (portfolioError || !portfolio) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Typography color="error">
            Failed to load portfolio. Please try again.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ scrollBehavior: 'smooth', py: 4, px: { xs: 2, sm: 3 } }}>

      {/* Sticky Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 30, // Position at very top
          zIndex: 1200, // Above everything
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 3,
          px: 3,
          mb: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h4" gutterBottom>
              {portfolio.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Portfolio Management & Trading
            </Typography>
          </Box>
          <Box 
            display="flex" 
            gap={2}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                width: { xs: '100%', sm: 'auto' },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                }
              }}
            >
              Back to Portfolios
            </Button>
            <Tooltip title="Refresh all portfolio data">
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshAll}
                disabled={isRefreshingAll}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  width: { xs: '100%', sm: 'auto' },
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  }
                }}
              >
                {isRefreshingAll ? 'Refreshing...' : 'Refresh All'}
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateForm(true)}
              sx={{ 
                borderRadius: 2, 
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                width: { xs: '100%', sm: 'auto' },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }
              }}
            >
              New Trade
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {/* Portfolio Value & NAV */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
            color: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #e0e7ff',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'rgba(102, 126, 234, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AccountBalance sx={{ fontSize: 32, opacity: 0.6, color: '#667eea' }} />
            </Box>
             <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
               <Box>
                 <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
                   Portfolio Value
                 </Typography>
                 <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.8rem', fontWeight: 300 }}>
                   Giá trị tài sản & NAV
                 </Typography>
               </Box>
               <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Investment Value
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatCurrency(portfolio.totalInvestValue || 0, portfolio.baseCurrency)}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Current NAV (+cash)
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatCurrency(portfolio.totalAllValue, portfolio.baseCurrency)}
                   </Typography>
                 </Box>
               </Box>
             </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: (performanceData?.totalReturn || 0) >= 0 
              ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            color: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            border: (performanceData?.totalReturn || 0) >= 0 
              ? '1px solid #bae6fd'
              : '1px solid #fecaca',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: (performanceData?.totalReturn || 0) >= 0 
                ? '0 4px 20px rgba(79, 172, 254, 0.15)'
                : '0 4px 20px rgba(250, 112, 154, 0.15)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: (performanceData?.totalReturn || 0) >= 0 
                ? 'rgba(79, 172, 254, 0.1)'
                : 'rgba(250, 112, 154, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {(performanceData?.totalReturn || 0) >= 0 ? 
                <TrendingUp sx={{ fontSize: 32, opacity: 0.6, color: '#0ea5e9' }} /> : 
                <TrendingDown sx={{ fontSize: 32, opacity: 0.6, color: '#f43f5e' }} />
              }
            </Box>
             <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
               <Box>
                 <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
                   Performance
                 </Typography>
                 <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.8rem', fontWeight: 300 }}>
                   Tổng & Lợi nhuận hàng năm
                 </Typography>
               </Box>
               <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Total Return
                   </Typography>
                   <Typography 
                     variant="h6" 
                     sx={{ 
                       fontWeight: 700, 
                       fontSize: '1.2rem', 
                       lineHeight: 1.2,
                       color: (performanceData?.totalReturn || 0) >= 0 ? '#059669' : '#dc2626'
                     }}
                   >
                     {performanceData ? formatPercentage(performanceData.totalReturn) : 'N/A'}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Annualized
                   </Typography>
                   <Typography 
                     variant="h6" 
                     sx={{ 
                       fontWeight: 700, 
                       fontSize: '1.2rem', 
                       lineHeight: 1.2,
                       color: (performanceData?.annualizedReturn || 0) >= 0 ? '#059669' : '#dc2626'
                     }}
                   >
                     {performanceData ? formatPercentage(performanceData.annualizedReturn) : 'N/A'}
                   </Typography>
                 </Box>
               </Box>
             </CardContent>
          </Card>
        </Grid>

        {/* Trading Activity */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            color: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #bbf7d0',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.15)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'rgba(34, 197, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp sx={{ fontSize: 32, opacity: 0.6, color: '#22c55e' }} />
            </Box>
             <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
               <Box>
                 <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
                   Trading Activity
                 </Typography>
                 <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.8rem', fontWeight: 300 }}>
                   Giao dịch & Khối lượng
                 </Typography>
               </Box>
               <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Total Trades
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatNumberWithSeparators(totalTrades, 0)}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Total Volume
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatCurrency(totalTradeVolume, portfolio?.baseCurrency || 'VND')}
                   </Typography>
                 </Box>
               </Box>
             </CardContent>
          </Card>
        </Grid>

        {/* P&L & Costs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{  
            background: totalTradeRealizedPL >= 0 
              ? 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            color: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            border: totalTradeRealizedPL >= 0 
              ? '1px solid #f3e8ff'
              : '1px solid #fecaca',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: totalTradeRealizedPL >= 0 
                ? '0 4px 20px rgba(240, 147, 251, 0.15)'
                : '0 4px 20px rgba(255, 154, 158, 0.15)',
              transition: 'all 0.3s ease-in-out'
            }
          }}>
            <Box sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20, 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: totalTradeRealizedPL >= 0 
                ? 'rgba(240, 147, 251, 0.1)'
                : 'rgba(255, 154, 158, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {totalTradeRealizedPL >= 0 ? 
                <TrendingUp sx={{ fontSize: 32, opacity: 0.6, color: '#a855f7' }} /> : 
                <TrendingDown sx={{ fontSize: 32, opacity: 0.6, color: '#f43f5e' }} />
              }
            </Box>
             <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 3 }}>
               <Box>
                 <Typography variant="h6" sx={{ color: '#1a1a1a', fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
                   P&L & Costs
                 </Typography>
                 <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.8rem', fontWeight: 300 }}>
                   Lợi nhuận & Chi phí
                 </Typography>
               </Box>
               <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Realized P&L
                   </Typography>
                   <Typography 
                     variant="h6" 
                     sx={{ 
                       fontWeight: 700, 
                       fontSize: '1.2rem', 
                       lineHeight: 1.2,
                       color: portfolio.realizedInvestPnL >= 0 ? '#059669' : '#dc2626'
                     }}
                   >
                     {formatCurrency(portfolio.realizedInvestPnL || 0, portfolio?.baseCurrency || 'VND')}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Fees & Taxes
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.2, color: '#ea580c' }}>
                     {formatCurrency(totalTradeFeesAndTaxes, portfolio?.baseCurrency || 'VND')}
                   </Typography>
                 </Box>
               </Box>
             </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sticky Tabs with Toggle */}
      <Box
        sx={{
          position: 'sticky',
          top: 120, // Position below header
          zIndex: 1200, // Below header
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          marginTop: 2, // Add margin from cards
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          {/* Tabs */}
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="portfolio tabs"
            sx={{
              minHeight: '48px',
              '& .MuiTab-root': {
                minHeight: '48px',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
              },
            }}
          >
            <Tab 
              icon={<TrendingUpIcon />} 
              iconPosition="start" 
              label="Performance" 
              defaultChecked 
            />
            <Tab 
              icon={<AllocationIcon />} 
              iconPosition="start" 
              label="Allocation" 
            />
            <Tab 
              icon={<TradingIcon />} 
              iconPosition="start" 
              label="Trading" 
            />
            <Tab 
              icon={<DepositIcon />} 
              iconPosition="start" 
              label="Deposit" 
            />
            <Tab 
              icon={<CashFlowIcon />} 
              iconPosition="start" 
              label="Cash Flow" 
            />
            <Tab 
              icon={<HoldingsIcon />} 
              iconPosition="start" 
              label="Holdings" 
            />
          </Tabs>
          
          {/* Compact Mode Toggle */}
          <Tooltip title={isCompactMode ? "Switch to Normal View" : "Switch to Compact View"}>
            <IconButton
              onClick={() => setIsCompactMode(!isCompactMode)}
              color="primary"
              size="small"
              sx={{
                p: 1,
                borderRadius: 1,
                backgroundColor: isCompactMode ? 'primary.main' : 'transparent',
                color: isCompactMode ? 'primary.contrastText' : 'primary.main',
                '&:hover': {
                  backgroundColor: isCompactMode ? 'primary.dark' : 'primary.light',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {isCompactMode ? <ViewListIcon /> : <ViewModuleIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tab Content Container */}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >

        <TabPanel value={tabValue} index={0}>
          <PerformanceTab
            portfolioId={portfolioId!}
            portfolio={portfolio}
            isCompactMode={isCompactMode}
            getUltraSpacing={getUltraSpacing}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AllocationTab
            portfolioId={portfolioId!}
            portfolio={portfolio}
            isCompactMode={isCompactMode}
            getUltraSpacing={getUltraSpacing}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TradingManagementTab
            portfolioId={portfolioId!}
            isCompactMode={isCompactMode}
            onCreateTrade={() => setShowCreateForm(true)}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <DepositManagementTab
            portfolioId={portfolioId!}
            isCompactMode={isCompactMode}
            getUltraSpacing={getUltraSpacing}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <CashFlowTab
            portfolioId={portfolioId!}
            isCompactMode={isCompactMode}
            getUltraSpacing={getUltraSpacing}
            onCashFlowUpdate={refetchPortfolio}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <NAVHoldingsTab
            portfolio={portfolio}
            isCompactMode={isCompactMode}
            getUltraSpacing={getUltraSpacing}
            onPortfolioUpdate={refetchPortfolio}
          />
        </TabPanel>

      </Box>
      {/* Create Trade Modal */}
      <ModalWrapper
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Create New Trade"
        icon={<TrendingUpIcon />}
        maxWidth="lg"
        loading={createTradeMutation.isLoading}
      >
        <TradeForm
          onSubmit={handleCreateTrade}
          defaultPortfolioId={portfolioId!}
        />
      </ModalWrapper>
    </Container>
  );
};

export default PortfolioDetail;
