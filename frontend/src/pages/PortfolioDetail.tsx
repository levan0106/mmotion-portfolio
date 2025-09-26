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
  Close as CloseIcon,
} from '@mui/icons-material';
import { usePortfolio, usePortfolioAnalytics } from '../hooks/usePortfolios';
import { useCreateTrade, useTrades } from '../hooks/useTrading';
import { usePortfolioAllocationTimeline } from '../hooks/usePortfolioAnalytics';
import AssetAllocationChart from '../components/Analytics/AssetAllocationChart';
import UnrealizedPnLChart from '../components/Analytics/UnrealizedPnLChart';
import RiskReturnChart from '../components/Analytics/RiskReturnChart';
import AssetPerformanceChart from '../components/Analytics/AssetPerformanceChart';
import RiskMetricsDashboard from '../components/Analytics/RiskMetricsDashboard';
import DiversificationHeatmap from '../components/Analytics/DiversificationHeatmap';
import AssetAllocationTimeline from '../components/Analytics/AssetAllocationTimeline';
import BenchmarkComparison from '../components/Analytics/BenchmarkComparison';
import MWRBenchmarkComparison from '../components/Analytics/MWRBenchmarkComparison';
import AssetDetailSummary from '../components/Analytics/AssetDetailSummary';
import NAVSummary from '../components/Analytics/NAVSummary';
import NAVHistoryChart from '../components/Analytics/NAVHistoryChart';
import { TradeForm } from '../components/Trading/TradeForm';
import { TradeListContainer } from '../components/Trading/TradeList';
import { TradeAnalysisContainer } from '../components/Trading/TradeAnalysis';
import CashFlowLayout from '../components/CashFlow/CashFlowLayout';
import DepositManagementTab from '../components/Deposit/DepositManagementTab';
import NAVHoldingsManagement from '../components/NAVUnit/NAVHoldingsManagement';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber, 
  formatNumberWithSeparators 
} from '../utils/format';
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
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [riskReturnData, setRiskReturnData] = useState<any>(null);
  const [isRiskReturnLoading, setIsRiskReturnLoading] = useState(false);
  const [riskReturnError, setRiskReturnError] = useState<string | null>(null);
  const [riskReturnPeriod, setRiskReturnPeriod] = useState<string>('1Y');
  const [riskMetricsData, setRiskMetricsData] = useState<any>(null);
  const [isRiskMetricsLoading, setIsRiskMetricsLoading] = useState(false);
  const [riskMetricsError, setRiskMetricsError] = useState<string | null>(null);
  const [diversificationData, setDiversificationData] = useState<any>(null);
  const [isDiversificationLoading, setIsDiversificationLoading] = useState(false);
  const [diversificationError, setDiversificationError] = useState<string | null>(null);
  // Allocation timeline data using new hook - now uses real API with 12 month limit
  const [allocationTimelineGranularity, setAllocationTimelineGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const { 
    allocationData: allocationTimelineData, 
    loading: isAllocationTimelineLoading, 
    error: allocationTimelineError 
  } = usePortfolioAllocationTimeline(portfolioId!, 12, allocationTimelineGranularity);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [mwrBenchmarkData, setMwrBenchmarkData] = useState<any>(null);
  const [isMwrBenchmarkLoading, setIsMwrBenchmarkLoading] = useState(false);
  const [mwrBenchmarkError, setMwrBenchmarkError] = useState<string | null>(null);
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState('1Y');
  const [benchmarkTwrPeriod, setBenchmarkTwrPeriod] = useState('1M');
  const [benchmarkMwrPeriod, setBenchmarkMwrPeriod] = useState('1M');
  const [assetDetailData, setAssetDetailData] = useState<any>(null);
  const [isAssetDetailLoading, setIsAssetDetailLoading] = useState(false);
  const [assetDetailError, setAssetDetailError] = useState<string | null>(null);
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
    allocationData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = usePortfolioAnalytics(portfolioId!);
  // Fetch asset performance data (includes deposits)
  const [assetPerformanceData, setAssetPerformanceData] = useState<any[]>([]);
  const [assetPerformanceLoading, setAssetPerformanceLoading] = useState(false);
  const [assetPerformanceError, setAssetPerformanceError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetPerformanceData = async () => {
      if (!portfolioId) return;
      
      setAssetPerformanceLoading(true);
      setAssetPerformanceError(null);
      
      try {
        const response = await apiService.getPortfolioAnalyticsPerformance(portfolioId);
        setAssetPerformanceData(response.data || []);
      } catch (error) {
        console.error('Error fetching asset performance data:', error);
        setAssetPerformanceError('Failed to load asset performance data');
        setAssetPerformanceData([]);
      } finally {
        setAssetPerformanceLoading(false);
      }
    };

    fetchAssetPerformanceData();
  }, [portfolioId]);

  // Fetch risk-return data
  useEffect(() => {
    const fetchRiskReturnData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsRiskReturnLoading(true);
        setRiskReturnError(null);
        const response = await apiService.getPortfolioRiskReturn(portfolioId, riskReturnPeriod);
        setRiskReturnData(response);
      } catch (error) {
        console.error('Error fetching risk-return data:', error);
        setRiskReturnError('Failed to load risk-return data');
      } finally {
        setIsRiskReturnLoading(false);
      }
    };

    fetchRiskReturnData();
  }, [portfolioId, riskReturnPeriod]);


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

  // Allocation timeline data is now handled by usePortfolioAllocationTimeline hook


  // Fetch benchmark comparison data
  useEffect(() => {
    const fetchBenchmarkData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsBenchmarkLoading(true);
        setBenchmarkError(null);
        
        // Convert timeframe to months
        const months = getTimeframeMonths(benchmarkTimeframe);
        const response = await apiService.getPortfolioBenchmarkComparison(portfolioId, months, benchmarkTwrPeriod);
        setBenchmarkData(response);
      } catch (error) {
        console.error('Error fetching benchmark data:', error);
        setBenchmarkError('Failed to load benchmark data');
      } finally {
        setIsBenchmarkLoading(false);
      }
    };

    fetchBenchmarkData();
  }, [portfolioId, benchmarkTimeframe, benchmarkTwrPeriod]);

  // Fetch MWR benchmark comparison data
  useEffect(() => {
    const fetchMWRBenchmarkData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsMwrBenchmarkLoading(true);
        setMwrBenchmarkError(null);
        
        // Convert timeframe to months
        const months = getTimeframeMonths(benchmarkTimeframe);
        const response = await apiService.getPortfolioMWRBenchmarkComparison(portfolioId, months, benchmarkMwrPeriod);
        setMwrBenchmarkData(response);
      } catch (error) {
        console.error('Error fetching MWR benchmark data:', error);
        setMwrBenchmarkError('Failed to load MWR benchmark data');
      } finally {
        setIsMwrBenchmarkLoading(false);
      }
    };

    fetchMWRBenchmarkData();
  }, [portfolioId, benchmarkTimeframe, benchmarkMwrPeriod]);

  // Helper function to convert timeframe to months
  const getTimeframeMonths = (timeframe: string): number => {
    switch (timeframe) {
      case '1M': return 1;
      case '3M': return 3;
      case '6M': return 6;
      case '1Y': return 12;
      case '2Y': return 24;
      case '5Y': return 60;
      case 'ALL': return 24; // Max 24 months for API
      default: return 12;
    }
  };

  // Handle benchmark timeframe change
  const handleBenchmarkTimeframeChange = (timeframe: string) => {
    setBenchmarkTimeframe(timeframe);
  };

  // Handle benchmark TWR period change
  const handleBenchmarkTwrPeriodChange = (twrPeriod: string) => {
    setBenchmarkTwrPeriod(twrPeriod);
  };

  const handleBenchmarkMwrPeriodChange = (mwrPeriod: string) => {
    setBenchmarkMwrPeriod(mwrPeriod);
  };

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
        // Analytics data - call API directly
        apiService.getPortfolioRiskReturn(portfolioId),
        apiService.getPortfolioPerformance(portfolioId),
        apiService.getPortfolioRiskMetrics(portfolioId),
        apiService.getPortfolioDiversificationHeatmap(portfolioId),
        apiService.getPortfolioAllocationTimeline(portfolioId),
        apiService.getPortfolioCashFlowAnalysis(portfolioId),
        apiService.getPortfolioBenchmarkComparison(portfolioId),
        apiService.getPortfolioAssetDetailSummary(portfolioId),
      ]);
      
      // Reset all data states to trigger re-fetch
      setRiskReturnData(null);
        setAssetPerformanceData([]);
      setRiskMetricsData(null);
      setDiversificationData(null);
      // allocationTimelineData is now managed by usePortfolioAllocationTimeline hook
      setBenchmarkData(null);
      setAssetDetailData(null);
      
      console.log('All data refreshed successfully');
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


  // Debug logging
  React.useEffect(() => {
    console.log('Portfolio Detail Debug:', {
      portfolio,
      // navData,
      performanceData,
      allocationData,
      isAnalyticsLoading,
      analyticsError
    });
  }, [portfolio, performanceData, allocationData, isAnalyticsLoading, analyticsError]);


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
          top: 0, // Position at very top
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
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatCurrency(portfolio.totalInvestValue || 0, portfolio.baseCurrency)}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Current NAV (+cash)
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
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
                       fontWeight: 800, 
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
                       fontWeight: 800, 
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
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatNumberWithSeparators(totalTrades, 0)}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Total Volume
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
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
                       fontWeight: 800, 
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
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#ea580c' }}>
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
          top: 110, // Position below header
          zIndex: 1100, // Below header
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
            <Tab label="Performance" defaultChecked />
            <Tab label="Allocation" />
            <Tab label="Trading Management" />
            <Tab label="Deposit Management" />
            <Tab label="Cash Flow" />
            <Tab label="NAV Holdings" />
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
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0,
            px: getUltraSpacing(2, 1)
          }}>
            {/* NAV Summary Section */}
            <Box sx={{ mb: getUltraSpacing(4, 2) }}>
              <NAVSummary
                navValue={portfolio.totalAllValue || portfolio.totalValue || 0}
                totalValue={portfolio.totalAssetValue || 0}
                baseCurrency={portfolio.baseCurrency}
                isFund={portfolio.isFund || false}
                totalOutstandingUnits={portfolio.totalOutstandingUnits || 1}
                navPerUnit={portfolio.navPerUnit || 0}
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
                portfolioId={portfolioId}
              />

              {/* NAV History Chart */}
              <Box sx={{ mb: getUltraSpacing(3, 1) }}>
                <NAVHistoryChart
                  portfolioId={portfolioId!}
                  baseCurrency={portfolio.baseCurrency}
                  compact={isCompactMode}
                  getUltraSpacing={getUltraSpacing}
                />
              </Box>
              
              {/* Side-by-Side Performance Views */}
              <Grid container spacing={getUltraSpacing(2, 1)}>
                {/* Fund Manager View - TWR */}
                <Grid item xs={12} lg={6}>
                  {/* Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: getUltraSpacing(1.5, 1),
                    p: 1.5,
                    backgroundColor: 'primary.50',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'primary.200'
                  }}>
                    <Box sx={{ 
                      p: 0.8, 
                      backgroundColor: 'primary.main', 
                      borderRadius: 1,
                      color: 'white',
                      fontSize: '0.9rem'
                    }}>
                      🏢
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                        Fund Manager View
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        TWR - Pure investment management performance
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Chart */}
                  {isBenchmarkLoading ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : benchmarkError ? (
                    <Typography color="error" variant="body2">{benchmarkError}</Typography>
                  ) : (
                    <BenchmarkComparison 
                      data={benchmarkData?.data || []} 
                      baseCurrency={portfolio.baseCurrency}
                      title="Portfolio Performance (TWR)"
                      benchmarkName={benchmarkData?.benchmarkName || 'VN Index'}
                      isCompactMode={isCompactMode}
                      getUltraSpacing={getUltraSpacing}
                      portfolioId={portfolioId}
                      onTimeframeChange={handleBenchmarkTimeframeChange}
                      currentTimeframe={benchmarkTimeframe}
                      onTwrPeriodChange={handleBenchmarkTwrPeriodChange}
                      currentTwrPeriod={benchmarkTwrPeriod}
                    />
                  )}
                </Grid>

                {/* Individual Investor View - MWR */}
                <Grid item xs={12} lg={6}>
                  {/* Header */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    mb: getUltraSpacing(1.5, 1),
                    p: 1.5,
                    backgroundColor: 'success.50',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'success.200'
                  }}>
                    <Box sx={{ 
                      p: 0.8, 
                      backgroundColor: 'success.main', 
                      borderRadius: 1,
                      color: 'white',
                      fontSize: '0.9rem'
                    }}>
                      👤
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main', mb: 0.5 }}>
                        Individual Investor View
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        MWR - Actual investor returns with cash flows
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Chart */}
                  {isMwrBenchmarkLoading ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : mwrBenchmarkError ? (
                    <Typography color="error" variant="body2">{mwrBenchmarkError}</Typography>
                  ) : (
                    <MWRBenchmarkComparison 
                      data={mwrBenchmarkData?.data || []} 
                      title="Portfolio Performance (MWR)"
                      benchmarkName={mwrBenchmarkData?.benchmarkName || 'VN Index'}
                      mwrPeriod={mwrBenchmarkData?.mwrPeriod}
                      onMWRPeriodChange={handleBenchmarkMwrPeriodChange}
                      currentMWRPeriod={benchmarkMwrPeriod}
                      onTimeframeChange={handleBenchmarkTimeframeChange}
                      currentTimeframe={benchmarkTimeframe}
                    />
                  )}
                </Grid>
              </Grid>
            </Box>
            
            {/* Trading Analysis Section */}
            <Box sx={{ mb: getUltraSpacing(4, 2) }}>
              <TradeAnalysisContainer 
                portfolioId={portfolioId!} 
                isCompactMode={isCompactMode}
              />
            </Box>
            
            {/* Risk Metrics Section */}
            <Box sx={{ mb: getUltraSpacing(4, 2) }}>
              {isRiskMetricsLoading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : riskMetricsError ? (
                <Typography color="error" variant="body2">{riskMetricsError}</Typography>
              ) : (
                <RiskMetricsDashboard 
                  data={riskMetricsData?.data || {}}
                  baseCurrency={portfolio.baseCurrency}
                  title="Risk Metrics Dashboard"
                  compact={isCompactMode}
                />
              )}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0,
            px: getUltraSpacing(2, 1)
          }}>
            {/* Trading Management Section */}
            <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
              fontWeight: 600, 
              color: '#1a1a1a', 
              mb: getUltraSpacing(3, 1.5),
              fontSize: isCompactMode ? '0.9rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              💼 Trading Management (Quản lý giao dịch)
            </Typography>
            <Box sx={{ mb: getUltraSpacing(4, 2) }}>
              <TradeListContainer 
                portfolioId={portfolioId!} 
                onCreate={() => setShowCreateForm(true)}
                isCompactMode={isCompactMode}
              />
            </Box>
          </Box>
        </TabPanel>

        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0,
            px: getUltraSpacing(2, 1)
          }}>
              {/* Professional Portfolio Overview Section */}
              <Grid container spacing={getUltraSpacing(3, 1)} sx={{ mb: getUltraSpacing(4, 2) }}>
                  {/* Total Investment Value Card */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      color: '#212529',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid #e3f2fd',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        transition: 'all 0.3s ease-in-out'
                      }
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        right: -15, 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.1
                      }}>
                        <AccountBalance sx={{ fontSize: 35, color: '#1976d2' }} />
                      </Box>
                      <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: getUltraSpacing(2, 1) }}>
                          <Box sx={{ 
                            p: getUltraSpacing(1, 0.5), 
                            backgroundColor: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', 
                            borderRadius: 2,
                            mr: getUltraSpacing(1.5, 1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <AccountBalance sx={{ fontSize: isCompactMode ? 18 : 22, color: 'white' }} />
                          </Box>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            fontSize: isCompactMode ? '0.9rem' : '1.1rem', 
                            color: '#1a1a1a' 
                          }}>
                            Total Investment
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          mb: getUltraSpacing(1, 0.5), 
                          fontSize: isCompactMode ? '1.4rem' : '1.8rem', 
                          color: '#212529' 
                        }}>
                          {formatCurrency(portfolio.totalInvestValue || 0, portfolio.baseCurrency)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#6c757d', 
                          fontSize: isCompactMode ? '0.75rem' : '0.85rem' 
                        }}>
                          Assets + Deposits Value
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Unrealized P&L Card */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: (portfolio.unrealizedInvestPnL || 0) >= 0 
                        ? 'linear-gradient(135deg, #ffffff 0%, #f1f8e9 100%)'
                        : 'linear-gradient(135deg, #ffffff 0%, #ffebee 100%)',
                      color: '#212529',
                      position: 'relative',
                      overflow: 'hidden',
                      border: (portfolio.unrealizedInvestPnL || 0) >= 0 
                        ? '1px solid #c8e6c9'
                        : '1px solid #ffcdd2',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        transition: 'all 0.3s ease-in-out'
                      }
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        right: -15, 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: (portfolio.unrealizedInvestPnL || 0) >= 0 
                          ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                          : 'linear-gradient(135deg, #f44336 0%, #ff9800 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.1
                      }}>
                        {(portfolio.unrealizedInvestPnL || 0) >= 0 ? 
                          <TrendingUp sx={{ fontSize: 35, color: '#4caf50' }} /> : 
                          <TrendingDown sx={{ fontSize: 35, color: '#f44336' }} />
                        }
                      </Box>
                      <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: getUltraSpacing(2, 1) }}>
                          <Box sx={{ 
                            p: getUltraSpacing(1, 0.5), 
                            backgroundColor: (portfolio.unrealizedInvestPnL || 0) >= 0 
                              ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                              : 'linear-gradient(135deg, #f44336 0%, #ff9800 100%)', 
                            borderRadius: 2,
                            mr: getUltraSpacing(1.5, 1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {(portfolio.unrealizedInvestPnL || 0) >= 0 ? 
                              <TrendingUp sx={{ fontSize: isCompactMode ? 18 : 22, color: 'white' }} /> : 
                              <TrendingDown sx={{ fontSize: isCompactMode ? 18 : 22, color: 'white' }} />
                            }
                          </Box>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            fontSize: isCompactMode ? '0.9rem' : '1.1rem', 
                            color: '#1a1a1a' 
                          }}>
                            Unrealized P&L
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          mb: getUltraSpacing(1, 0.5), 
                          fontSize: isCompactMode ? '1.4rem' : '1.8rem',
                          color: (portfolio.unrealizedInvestPnL || 0) >= 0 ? '#28a745' : '#dc3545'
                        }}>
                          {formatCurrency(portfolio.unrealizedInvestPnL || 0, portfolio.baseCurrency)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#6c757d', 
                          fontSize: isCompactMode ? '0.75rem' : '0.85rem' 
                        }}>
                          Current Unrealized Profit/Loss
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Cash Balance Card */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f3e5f5 100%)',
                      color: '#212529',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid #e1bee7',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        transition: 'all 0.3s ease-in-out'
                      }
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        right: -15, 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.1
                      }}>
                        <AccountBalance sx={{ fontSize: 35, color: '#9c27b0' }} />
                      </Box>
                      <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: getUltraSpacing(2, 1) }}>
                          <Box sx={{ 
                            p: getUltraSpacing(1, 0.5), 
                            backgroundColor: 'linear-gradient(135deg, #9c27b0 0%, #e91e63 100%)', 
                            borderRadius: 2,
                            mr: getUltraSpacing(1.5, 1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <AccountBalance sx={{ fontSize: isCompactMode ? 18 : 22, color: 'white' }} />
                          </Box>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            fontSize: isCompactMode ? '0.9rem' : '1.1rem', 
                            color: '#1a1a1a' 
                          }}>
                            Cash Balance
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          mb: getUltraSpacing(1, 0.5), 
                          fontSize: isCompactMode ? '1.4rem' : '1.8rem', 
                          color: '#212529' 
                        }}>
                          {formatCurrency(portfolio.cashBalance, portfolio.baseCurrency)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#6c757d', 
                          fontSize: isCompactMode ? '0.75rem' : '0.85rem' 
                        }}>
                          Available Cash (Số dư tiền mặt)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Asset Classes Card */}
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 100%)',
                      color: '#212529',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid #c8e6c9',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        transition: 'all 0.3s ease-in-out'
                      }
                    }}>
                      <Box sx={{ 
                        position: 'absolute', 
                        top: -15, 
                        right: -15, 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.1
                      }}>
                        <TrendingUp sx={{ fontSize: 35, color: '#4caf50' }} />
                      </Box>
                      <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: getUltraSpacing(2, 1) }}>
                          <Box sx={{ 
                            p: getUltraSpacing(1, 0.5), 
                            backgroundColor: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)', 
                            borderRadius: 2,
                            mr: getUltraSpacing(1.5, 1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <TrendingUp sx={{ fontSize: isCompactMode ? 18 : 22, color: 'white' }} />
                          </Box>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            fontSize: isCompactMode ? '0.9rem' : '1.1rem', 
                            color: '#1a1a1a' 
                          }}>
                            Asset Classes
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          mb: getUltraSpacing(1, 0.5), 
                          fontSize: isCompactMode ? '1.4rem' : '1.8rem', 
                          color: '#212529' 
                        }}>
                          {formatNumberWithSeparators(Object.keys(allocationData?.allocation || {}).length, 0)}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: '#6c757d', 
                          fontSize: isCompactMode ? '0.75rem' : '0.85rem' 
                        }}>
                          Different Asset Types (Loại tài sản)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
              </Grid>

              {/* Asset Allocation Section */}
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: getUltraSpacing(3, 1),
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📊 Asset Type Allocation (Phân bổ loại tài sản)
              </Typography>
              <Grid container spacing={getUltraSpacing(2, 1)} sx={{ mb: getUltraSpacing(4, 2) }}>
                {/* Asset Allocation Pie Chart - Column 1 */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: getUltraSpacing(1.5, 0.5), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ 
                      mb: getUltraSpacing(1, 0.5),
                      fontSize: isCompactMode ? '0.7rem' : '0.8rem',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}>
                      Asset Allocation (Pie Chart)
                    </Typography>
                    {isAnalyticsLoading ? (
                      <Box display="flex" justifyContent="center" p={1}>
                        <CircularProgress size={20} />
                      </Box>
                    ) : analyticsError ? (
                      <Typography color="error" variant="body2">Failed to load allocation data</Typography>
                    ) : (
                        <AssetAllocationChart 
                          data={allocationData || { allocation: {}, totalValue: 0, totalAssetsValue: 0, totalDepositsValue: 0, assetCount: 0 }} 
                          baseCurrency={portfolio.baseCurrency} 
                          compact={isCompactMode}
                        />
                      )}
                  </Box>
                </Grid>

                {/* Unrealized P&L Chart - Column 2 */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: getUltraSpacing(1.5, 0.5), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {assetPerformanceLoading ? (
                      <Box display="flex" justifyContent="center" p={1}>
                        <CircularProgress size={20} />
                      </Box>
                    ) : assetPerformanceError ? (
                      <Typography color="error" variant="body2">Failed to load P&L data</Typography>
                    ) : (
                        <UnrealizedPnLChart 
                          data={assetPerformanceData || []} 
                          baseCurrency={portfolio.baseCurrency} 
                          compact={isCompactMode}
                        />
                      )}
                  </Box>
                </Grid>

                {/* Allocation Summary - Column 3 */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: getUltraSpacing(1.5, 0.5), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ 
                      mb: getUltraSpacing(1, 0.5),
                      fontSize: isCompactMode ? '0.7rem' : '0.8rem',
                      fontWeight: 600,
                      textAlign: 'center'
                    }}>
                      Allocation Summary
                    </Typography>
                    {allocationData && Object.keys(allocationData.allocation).length > 0 ? (
                      <Box>
                        {Object.entries(allocationData.allocation).map(([assetType, allocation]) => (
                          <Box key={assetType} sx={{ mb: getUltraSpacing(1, 0.5) }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}>
                                {assetType.toUpperCase()}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}>
                                {formatNumber(allocation.percentage, 1)}%
                              </Typography>
                            </Box>
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: '4px', 
                                backgroundColor: '#e0e0e0', 
                                borderRadius: '2px',
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
                            <Typography variant="caption" color="text.secondary" sx={{ 
                              mt: 0.2, 
                              display: 'block', 
                              fontSize: isCompactMode ? '0.55rem' : '0.65rem' 
                            }}>
                              {formatCurrency(allocation.value, portfolio.baseCurrency)}
                            </Typography>
                          </Box>
                        ))}
                        
                        {/* Total Portfolio Value */}
                        <Box sx={{ 
                          mt: getUltraSpacing(1, 0.5), 
                          pt: getUltraSpacing(1, 0.5), 
                          borderTop: '1px solid #e0e0e0',
                          textAlign: 'center'
                        }}>
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                            {/* Total Assets Value Column */}
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ 
                                fontSize: isCompactMode ? '0.6rem' : '0.7rem', 
                                display: 'block' 
                              }}>
                                Total Assets Value
                              </Typography>
                              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ 
                                fontSize: isCompactMode ? '0.8rem' : '0.9rem' 
                              }}>
                                {formatCurrency(allocationData?.totalAssetsValue || 0, portfolio.baseCurrency)}
                              </Typography>
                            </Box>
                            
                            {/* Total Deposits Value Column */}
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ 
                                fontSize: isCompactMode ? '0.6rem' : '0.7rem', 
                                display: 'block' 
                              }}>
                                Total Deposits Value
                              </Typography>
                              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ 
                                fontSize: isCompactMode ? '0.8rem' : '0.9rem' 
                              }}>
                                {formatCurrency(allocationData?.totalDepositsValue || 0, portfolio.baseCurrency)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        fontSize: isCompactMode ? '0.65rem' : '0.75rem' 
                      }}>
                        No allocation data available
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Asset Detail Summary Section */}
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: getUltraSpacing(3, 1),
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📋 Asset Detail Summary (Tổng quan tài sản)
              </Typography>
              <Box sx={{ 
                p: getUltraSpacing(2, 1), 
                backgroundColor: 'white', 
                borderRadius: 2, 
                boxShadow: 1,
                border: '1px solid #e0e0e0',
                mb: getUltraSpacing(4, 2)
              }}>
                {isAssetDetailLoading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : assetDetailError ? (
                  <Typography color="error" variant="body2">{assetDetailError}</Typography>
                ) : (
                  <AssetDetailSummary 
                    data={assetDetailData?.data || []} 
                    baseCurrency={portfolio.baseCurrency}
                    title="Individual Asset Holdings"
                    compact={isCompactMode}
                  />
                )}
              </Box>

              {/* Risk & Performance Analysis Section */}
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: getUltraSpacing(3, 1),
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📈 Risk & Performance Analysis (Rủi ro và hiệu suất)
              </Typography>
              <Grid container spacing={getUltraSpacing(2, 1)} sx={{ mb: getUltraSpacing(4, 2) }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(2, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {isRiskReturnLoading ? (
                      <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : riskReturnError ? (
                      <Typography color="error" variant="body2">{riskReturnError}</Typography>
                    ) : (
                      <RiskReturnChart 
                        data={riskReturnData?.data || []} 
                        baseCurrency={portfolio.baseCurrency}
                        title="Risk-Return Analysis"
                        compact={isCompactMode}
                        onPeriodChange={setRiskReturnPeriod}
                        selectedPeriod={riskReturnPeriod}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(2, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {assetPerformanceLoading ? (
                      <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : assetPerformanceError ? (
                      <Typography color="error" variant="body2">{assetPerformanceError}</Typography>
                    ) : (
                      <AssetPerformanceChart 
                        data={assetPerformanceData || []} 
                        baseCurrency={portfolio.baseCurrency}
                        title="Asset Performance Comparison"
                        compact={isCompactMode}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Diversification & Timeline Section */}
              <Typography variant="h5" gutterBottom sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: getUltraSpacing(3, 1),
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                🔄 Diversification & Timeline (Đa dạng hóa và lịch sử phân bổ)
              </Typography>
              <Grid container spacing={getUltraSpacing(2, 1)} sx={{ mb: getUltraSpacing(4, 2) }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(2, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%',
                    overflow: 'hidden'
                  }}>
                    {isDiversificationLoading ? (
                      <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : diversificationError ? (
                      <Typography color="error" variant="body2">{diversificationError}</Typography>
                    ) : (
                      <DiversificationHeatmap 
                        data={diversificationData?.data || []} 
                        title="Diversification Heatmap"
                        compact={isCompactMode}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(2, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
                  }}>
                    {isAllocationTimelineLoading ? (
                      <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : allocationTimelineError ? (
                      <Typography color="error" variant="body2">{allocationTimelineError}</Typography>
                    ) : (
                      <AssetAllocationTimeline 
                        data={allocationTimelineData || []} 
                        baseCurrency={portfolio.baseCurrency}
                        title="Allocation Timeline"
                        compact={isCompactMode}
                        granularity={allocationTimelineGranularity}
                        onGranularityChange={setAllocationTimelineGranularity}
                        showGranularitySelector={true}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0,
            px: getUltraSpacing(2, 1)
          }}>
            {/* Deposit Management Section */}
            <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
              fontWeight: 600, 
              color: '#1a1a1a', 
              mb: getUltraSpacing(3, 1.5),
              fontSize: isCompactMode ? '0.9rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              💰 Deposit Management (Quản lý tiền gửi)
            </Typography>
            <Box sx={{ mb: getUltraSpacing(4, 2) }}>
              <DepositManagementTab portfolioId={portfolioId!} />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0,
            px: getUltraSpacing(2, 1)
          }}>
            {/* Cash Flow Management Section */}
            <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
              fontWeight: 600, 
              color: '#1a1a1a', 
              mb: getUltraSpacing(3, 1.5),
              fontSize: isCompactMode ? '0.9rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              💸 Cash Flow Management (Quản lý dòng tiền)
            </Typography>
            <Box sx={{ mb: getUltraSpacing(4, 2) }}>
              <CashFlowLayout 
                portfolioId={portfolioId!} 
                onCashFlowUpdate={() => {
                  // Refresh portfolio data when cash flow is updated
                  refetchPortfolio();
                }}
              />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0,
            px: getUltraSpacing(2, 1)
          }}>
            {/* NAV Holdings Management Section */}
            <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
              fontWeight: 600, 
              color: '#1a1a1a', 
              mb: getUltraSpacing(3, 1.5),
              fontSize: isCompactMode ? '0.9rem' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              🏦 NAV Holdings Management (Quản lý đơn vị quỹ)
            </Typography>
            <Box sx={{ mb: getUltraSpacing(4, 2) }}>
              <NAVHoldingsManagement 
                portfolio={portfolio}
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
                onPortfolioUpdate={refetchPortfolio}
              />
            </Box>
          </Box>
        </TabPanel>

      </Box>
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
              p: 0,
              maxWidth: 900,
              width: '95%',
              maxHeight: '95%',
              overflow: 'hidden',
              boxShadow: 24,
              animation: 'modalSlideIn 0.3s ease-out',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Close Button */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'grey.50',
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Create New Trade
              </Typography>
              <IconButton
                onClick={() => setShowCreateForm(false)}
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'white',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Modal Content */}
            <Box sx={{ p: 2, overflow: 'auto', maxHeight: 'calc(95vh - 80px)' }}>
              <TradeForm
                onSubmit={handleCreateTrade}
                defaultPortfolioId={portfolioId!}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default PortfolioDetail;
