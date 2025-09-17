/**
 * Portfolio detail page component
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CircularProgress,
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  ViewModule,
  ViewList,
} from '@mui/icons-material';
import { usePortfolio, usePortfolioAnalytics } from '../hooks/usePortfolios';
import { useCreateTrade, useTrades } from '../hooks/useTrading';
import AssetAllocationChart from '../components/Analytics/AssetAllocationChart';
import PerformanceChart from '../components/Analytics/PerformanceChart';
import RiskReturnChart from '../components/Analytics/RiskReturnChart';
import AssetPerformanceChart from '../components/Analytics/AssetPerformanceChart';
import RiskMetricsDashboard from '../components/Analytics/RiskMetricsDashboard';
import DiversificationHeatmap from '../components/Analytics/DiversificationHeatmap';
import AssetAllocationTimeline from '../components/Analytics/AssetAllocationTimeline';
import CashFlowAnalysis from '../components/Analytics/CashFlowAnalysis';
import BenchmarkComparison from '../components/Analytics/BenchmarkComparison';
import AssetDetailSummary from '../components/Analytics/AssetDetailSummary';
import { TradeForm } from '../components/Trading/TradeForm';
import { TradeListContainer } from '../components/Trading/TradeList';
import { TradeAnalysisContainer } from '../components/Trading/TradeAnalysis';
import { formatCurrency, formatPercentage } from '../utils/format';
import { CreateTradeDto } from '../types';
import { apiService } from '../services/api';
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
  const [tabValue, setTabValue] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [riskReturnData, setRiskReturnData] = useState<any>(null);
  const [isRiskReturnLoading, setIsRiskReturnLoading] = useState(false);
  const [riskReturnError, setRiskReturnError] = useState<string | null>(null);
  const [assetPerformanceData, setAssetPerformanceData] = useState<any>(null);
  const [isAssetPerformanceLoading, setIsAssetPerformanceLoading] = useState(false);
  const [assetPerformanceError, setAssetPerformanceError] = useState<string | null>(null);
  const [riskMetricsData, setRiskMetricsData] = useState<any>(null);
  const [isRiskMetricsLoading, setIsRiskMetricsLoading] = useState(false);
  const [riskMetricsError, setRiskMetricsError] = useState<string | null>(null);
  const [diversificationData, setDiversificationData] = useState<any>(null);
  const [isDiversificationLoading, setIsDiversificationLoading] = useState(false);
  const [diversificationError, setDiversificationError] = useState<string | null>(null);
  const [allocationTimelineData, setAllocationTimelineData] = useState<any>(null);
  const [isAllocationTimelineLoading, setIsAllocationTimelineLoading] = useState(false);
  const [allocationTimelineError, setAllocationTimelineError] = useState<string | null>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [isCashFlowLoading, setIsCashFlowLoading] = useState(false);
  const [cashFlowError, setCashFlowError] = useState<string | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [assetDetailData, setAssetDetailData] = useState<any>(null);
  const [isAssetDetailLoading, setIsAssetDetailLoading] = useState(false);
  const [assetDetailError, setAssetDetailError] = useState<string | null>(null);
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Ultra compact mode - gấp đôi compact
  const getUltraSpacing = (normal: number, ultra: number) => 
    isCompactMode ? ultra : normal;

  const { portfolio, isLoading: isPortfolioLoading, error: portfolioError } = usePortfolio(portfolioId!);
  const {
    navData,
    performanceData,
    allocationData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = usePortfolioAnalytics(portfolioId!);

  // Fetch risk-return data
  useEffect(() => {
    const fetchRiskReturnData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsRiskReturnLoading(true);
        setRiskReturnError(null);
        const response = await apiService.getPortfolioRiskReturn(portfolioId);
        setRiskReturnData(response);
      } catch (error) {
        console.error('Error fetching risk-return data:', error);
        setRiskReturnError('Failed to load risk-return data');
      } finally {
        setIsRiskReturnLoading(false);
      }
    };

    fetchRiskReturnData();
  }, [portfolioId]);

  // Fetch asset performance data
  useEffect(() => {
    const fetchAssetPerformanceData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsAssetPerformanceLoading(true);
        setAssetPerformanceError(null);
        const response = await apiService.getPortfolioAssetPerformance(portfolioId);
        setAssetPerformanceData(response);
      } catch (error) {
        console.error('Error fetching asset performance data:', error);
        setAssetPerformanceError('Failed to load asset performance data');
      } finally {
        setIsAssetPerformanceLoading(false);
      }
    };

    fetchAssetPerformanceData();
  }, [portfolioId]);

  // Fetch risk metrics data
  useEffect(() => {
    const fetchRiskMetricsData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsRiskMetricsLoading(true);
        setRiskMetricsError(null);
        const response = await apiService.getPortfolioRiskMetrics(portfolioId);
        setRiskMetricsData(response);
      } catch (error) {
        console.error('Error fetching risk metrics data:', error);
        setRiskMetricsError('Failed to load risk metrics data');
      } finally {
        setIsRiskMetricsLoading(false);
      }
    };

    fetchRiskMetricsData();
  }, [portfolioId]);

  // Fetch diversification heatmap data
  useEffect(() => {
    const fetchDiversificationData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsDiversificationLoading(true);
        setDiversificationError(null);
        const response = await apiService.getPortfolioDiversificationHeatmap(portfolioId);
        setDiversificationData(response);
      } catch (error) {
        console.error('Error fetching diversification data:', error);
        setDiversificationError('Failed to load diversification data');
      } finally {
        setIsDiversificationLoading(false);
      }
    };

    fetchDiversificationData();
  }, [portfolioId]);

  // Fetch allocation timeline data
  useEffect(() => {
    const fetchAllocationTimelineData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsAllocationTimelineLoading(true);
        setAllocationTimelineError(null);
        const response = await apiService.getPortfolioAllocationTimeline(portfolioId);
        setAllocationTimelineData(response);
      } catch (error) {
        console.error('Error fetching allocation timeline data:', error);
        setAllocationTimelineError('Failed to load allocation timeline data');
      } finally {
        setIsAllocationTimelineLoading(false);
      }
    };

    fetchAllocationTimelineData();
  }, [portfolioId]);

  // Fetch cash flow analysis data
  useEffect(() => {
    const fetchCashFlowData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsCashFlowLoading(true);
        setCashFlowError(null);
        const response = await apiService.getPortfolioCashFlowAnalysis(portfolioId);
        setCashFlowData(response);
      } catch (error) {
        console.error('Error fetching cash flow data:', error);
        setCashFlowError('Failed to load cash flow data');
      } finally {
        setIsCashFlowLoading(false);
      }
    };

    fetchCashFlowData();
  }, [portfolioId]);

  // Fetch benchmark comparison data
  useEffect(() => {
    const fetchBenchmarkData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsBenchmarkLoading(true);
        setBenchmarkError(null);
        const response = await apiService.getPortfolioBenchmarkComparison(portfolioId);
        setBenchmarkData(response);
      } catch (error) {
        console.error('Error fetching benchmark data:', error);
        setBenchmarkError('Failed to load benchmark data');
      } finally {
        setIsBenchmarkLoading(false);
      }
    };

    fetchBenchmarkData();
  }, [portfolioId]);

  // Fetch asset detail summary data
  useEffect(() => {
    const fetchAssetDetailData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsAssetDetailLoading(true);
        setAssetDetailError(null);
        const response = await apiService.getPortfolioAssetDetailSummary(portfolioId);
        setAssetDetailData(response);
      } catch (error) {
        console.error('Error fetching asset detail data:', error);
        setAssetDetailError('Failed to load asset detail data');
      } finally {
        setIsAssetDetailLoading(false);
      }
    };

    fetchAssetDetailData();
  }, [portfolioId]);
  
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

  // Calculate trading summary
  const totalTrades = trades.length;
  const totalVolume = trades.reduce((sum, trade) => sum + (Number(trade.quantity) * Number(trade.price) || 0), 0);
  const totalFeesAndTaxes = trades.reduce((sum, trade) => sum + (Number(trade.fee) || 0) + (Number(trade.tax) || 0), 0);
  const realizedPL = trades.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0);

  const summaryCards = [
    {
      title: 'Total Trades',
      value: totalTrades,
      color: 'primary',
      icon: <TrendingUp />,
    },
    {
      title: 'Total Volume',
      value: formatCurrency(totalVolume, portfolio?.baseCurrency || 'VND'),
      color: 'info',
      icon: <AccountBalance />,
    },
    {
      title: 'Fees & Taxes',
      value: formatCurrency(totalFeesAndTaxes, portfolio?.baseCurrency || 'VND'),
      color: 'warning',
      icon: <TrendingDown />,
    },
    {
      title: 'Realized P&L',
      value: formatCurrency(realizedPL, portfolio?.baseCurrency || 'VND'),
      color: realizedPL >= 0 ? 'success' : 'error',
      icon: <TrendingUp />,
    },
  ];

  // Debug logging
  React.useEffect(() => {
    console.log('Portfolio Detail Debug:', {
      portfolio,
      navData,
      performanceData,
      allocationData,
      isAnalyticsLoading,
      analyticsError
    });
  }, [portfolio, navData, performanceData, allocationData, isAnalyticsLoading, analyticsError]);


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
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {portfolio.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Portfolio Management & Trading
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Back to Portfolios
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateForm(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              New Trade
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Portfolio Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 120, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Current NAV
              </Typography>
              <Typography variant="h5" component="div">
                {navData ? formatCurrency(navData.navValue, portfolio.baseCurrency) : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 120, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Return
              </Typography>
              <Typography variant="h5" component="div" color={(performanceData?.totalReturn || 0) >= 0 ? 'success.main' : 'error.main'}>
                {performanceData ? formatPercentage(performanceData.totalReturn) : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 120, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Annualized Return
              </Typography>
              <Typography variant="h5" component="div" color={(performanceData?.annualizedReturn || 0) >= 0 ? 'success.main' : 'error.main'}>
                {performanceData ? formatPercentage(performanceData.annualizedReturn) : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 120, boxShadow: 2 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Base Currency
              </Typography>
              <Typography variant="h5" component="div">
                {portfolio.baseCurrency}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trading Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: 120, boxShadow: 2 }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="portfolio tabs">
            <Tab label="Trading Management" />
              <Tab label="Trading Analysis" defaultChecked />
            <Tab label="Asset Allocation" />
          </Tabs>
            
            {/* Global Compact Mode Toggle */}
            <Tooltip title={isCompactMode ? "Switch to Normal View" : "Switch to Compact View"}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isCompactMode}
                    onChange={(e) => setIsCompactMode(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isCompactMode ? <ViewList fontSize="small" /> : <ViewModule fontSize="small" />}
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {isCompactMode ? 'Compact' : 'Normal'}
                    </Typography>
                  </Box>
                }
                sx={{ m: 0 }}
              />
            </Tooltip>
          </Box>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: getUltraSpacing(3, 1) }}>
            <Grid container spacing={getUltraSpacing(3, 1)}>
            <Grid item xs={12}>
              <TradeListContainer 
                portfolioId={portfolioId!} 
                onCreate={() => setShowCreateForm(true)}
                  isCompactMode={isCompactMode}
              />
            </Grid>
          </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: getUltraSpacing(3, 1) }}>
            <Grid container spacing={getUltraSpacing(3, 1)}>
              <Grid item xs={12}>
                <PerformanceChart 
                  portfolioId={portfolioId!} 
                  baseCurrency={portfolio.baseCurrency}
                  title="Portfolio Performance"
                />
              </Grid>
            <Grid item xs={12}>
                <TradeAnalysisContainer 
                  portfolioId={portfolioId!} 
                  isCompactMode={isCompactMode}
                />
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: getUltraSpacing(3, 1), backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

            {/* Portfolio Overview Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Portfolio Overview
              </Typography>
              <Grid container spacing={getUltraSpacing(3, 1)}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    textAlign: 'center',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {formatCurrency(portfolio.totalValue, portfolio.baseCurrency)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Total Value
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    textAlign: 'center',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatCurrency(portfolio.unrealizedPl, portfolio.baseCurrency)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Unrealized P&L
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    textAlign: 'center',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {formatCurrency(portfolio.cashBalance, portfolio.baseCurrency)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Cash Balance
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    textAlign: 'center',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {Object.keys(allocationData?.allocation || {}).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Asset Classes
                  </Typography>
                    </Box>
                </Grid>
            </Grid>
            </Box>

            {/* Asset Allocation Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                    Asset Allocation
                  </Typography>
              <Grid container spacing={getUltraSpacing(3, 1)}>
                {/* Asset Allocation Chart - Left Side */}
                <Grid item xs={12} md={8}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                  {isAnalyticsLoading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                      <CircularProgress />
                    </Box>
                  ) : analyticsError ? (
                    <Typography color="error">Failed to load allocation data</Typography>
                  ) : (
                      <AssetAllocationChart 
                        data={allocationData || { allocation: {}, totalValue: 0, assetCount: 0 }} 
                        baseCurrency={portfolio.baseCurrency} 
                      />
                    )}
                  </Box>
                </Grid>

                {/* Allocation Summary - Right Side */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Allocation Summary
                    </Typography>
                    {allocationData && Object.keys(allocationData.allocation).length > 0 ? (
                      <Box>
                        {Object.entries(allocationData.allocation).map(([assetType, allocation]) => (
                          <Box key={assetType} sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {assetType.toUpperCase()}
                              </Typography>
                              <Typography variant="body1" fontWeight="bold" color="primary">
                                {allocation.percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: '8px', 
                                backgroundColor: '#e0e0e0', 
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${allocation.percentage}%`,
                                  height: '100%',
                                  backgroundColor: '#1976d2',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {formatCurrency(allocation.value, portfolio.baseCurrency)}
                            </Typography>
                          </Box>
                        ))}
                        
                        {/* Total Portfolio Value */}
                        <Box sx={{ 
                          mt: 3, 
                          pt: 3, 
                          borderTop: '1px solid #e0e0e0',
                          textAlign: 'center'
                        }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Total Portfolio Value
                          </Typography>
                          <Typography variant="h5" color="primary" fontWeight="bold">
                            {formatCurrency(portfolio.totalValue, portfolio.baseCurrency)}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No allocation data available
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Asset Detail Summary Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Asset Detail Summary
              </Typography>
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                boxShadow: 1,
                border: '1px solid #e0e0e0'
              }}>
                {isAssetDetailLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : assetDetailError ? (
                  <Typography color="error">{assetDetailError}</Typography>
                ) : (
                  <AssetDetailSummary 
                    data={assetDetailData?.data || []} 
                    baseCurrency={portfolio.baseCurrency}
                    title="Individual Asset Holdings"
                  />
                )}
              </Box>
            </Box>

            {/* Risk & Performance Analysis Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Risk & Performance Analysis
              </Typography>
              <Grid container spacing={getUltraSpacing(3, 1)}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {isRiskReturnLoading ? (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    ) : riskReturnError ? (
                      <Typography color="error">{riskReturnError}</Typography>
                    ) : (
                      <RiskReturnChart 
                        data={riskReturnData?.data || []} 
                        baseCurrency={portfolio.baseCurrency}
                        title="Risk-Return Analysis"
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {isAssetPerformanceLoading ? (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    ) : assetPerformanceError ? (
                      <Typography color="error">{assetPerformanceError}</Typography>
                    ) : (
                      <AssetPerformanceChart 
                        data={assetPerformanceData?.data || []} 
                        baseCurrency={portfolio.baseCurrency}
                        title="Asset Performance Comparison"
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Risk Metrics Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Risk Metrics
              </Typography>
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                boxShadow: 1,
                border: '1px solid #e0e0e0'
              }}>
                {isRiskMetricsLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : riskMetricsError ? (
                  <Typography color="error">{riskMetricsError}</Typography>
                ) : (
                  <RiskMetricsDashboard 
                    data={riskMetricsData?.data || {}} 
                    baseCurrency={portfolio.baseCurrency}
                    title="Risk Metrics Dashboard"
                  />
                )}
              </Box>
            </Box>

            {/* Diversification & Timeline Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Diversification & Timeline
              </Typography>
              <Grid container spacing={getUltraSpacing(3, 1)}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {isDiversificationLoading ? (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    ) : diversificationError ? (
                      <Typography color="error">{diversificationError}</Typography>
                    ) : (
                      <DiversificationHeatmap 
                        data={diversificationData?.data || []} 
                        title="Diversification Heatmap"
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(3, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {isAllocationTimelineLoading ? (
                      <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                      </Box>
                    ) : allocationTimelineError ? (
                      <Typography color="error">{allocationTimelineError}</Typography>
                    ) : (
                      <AssetAllocationTimeline 
                        data={allocationTimelineData?.data || []} 
                        baseCurrency={portfolio.baseCurrency}
                        title="Allocation Timeline"
                      />
                    )}
                  </Box>
            </Grid>
          </Grid>
            </Box>

            {/* Cash Flow Analysis Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Cash Flow Analysis
              </Typography>
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                boxShadow: 1,
                border: '1px solid #e0e0e0'
              }}>
                {isCashFlowLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : cashFlowError ? (
                  <Typography color="error">{cashFlowError}</Typography>
                ) : (
                  <CashFlowAnalysis 
                    data={cashFlowData?.data || []} 
                    baseCurrency={portfolio.baseCurrency}
                    title="Cash Flow Analysis"
                  />
                )}
              </Box>
            </Box>

            {/* Benchmark Comparison Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Benchmark Comparison
              </Typography>
              <Box sx={{ 
                p: 3, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                boxShadow: 1,
                border: '1px solid #e0e0e0'
              }}>
                {isBenchmarkLoading ? (
                  <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : benchmarkError ? (
                  <Typography color="error">{benchmarkError}</Typography>
                ) : (
                  <BenchmarkComparison 
                    data={benchmarkData?.data || []} 
                    baseCurrency={portfolio.baseCurrency}
                    title="Benchmark Comparison"
                    benchmarkName={benchmarkData?.benchmarkName || 'S&P 500'}
                  />
                )}
              </Box>
            </Box>

          </Box>
        </TabPanel>
      </Paper>

      {/* Create Trade Modal */}
      {showCreateForm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowCreateForm(false)}
        >
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 3,
              p: 4,
              maxWidth: 900,
              width: '95%',
              maxHeight: '95%',
              overflow: 'auto',
              boxShadow: 24,
              animation: 'modalSlideIn 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <TradeForm
              onSubmit={handleCreateTrade}
              defaultPortfolioId={portfolioId!}
            />
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default PortfolioDetail;
