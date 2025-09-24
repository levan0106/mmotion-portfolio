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
import AssetDetailSummary from '../components/Analytics/AssetDetailSummary';
import { TradeForm } from '../components/Trading/TradeForm';
import { TradeListContainer } from '../components/Trading/TradeList';
import { TradeAnalysisContainer } from '../components/Trading/TradeAnalysis';
import CashFlowLayout from '../components/CashFlow/CashFlowLayout';
import DepositManagementTab from '../components/Deposit/DepositManagementTab';
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

// Helper component for consistent section structure
interface SectionWrapperProps {
  title: string;
  children: React.ReactNode;
  isCompactMode: boolean;
  getUltraSpacing: (normal: number, ultra: number) => number;
}

function SectionWrapper({ title, children, isCompactMode, getUltraSpacing }: SectionWrapperProps) {
  return (
    <Grid item xs={12}>
      <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
        fontWeight: 600, 
        color: '#1a1a1a', 
        mb: getUltraSpacing(2, 0.5),
        fontSize: isCompactMode ? '0.9rem' : undefined
      }}>
        {title}
      </Typography>
      <Box sx={{ 
        p: getUltraSpacing(2, 1), 
        backgroundColor: 'white', 
        borderRadius: 2, 
        boxShadow: 1,
        border: '1px solid #e0e0e0'
      }}>
        {children}
      </Box>
    </Grid>
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
  const [riskMetricsData, setRiskMetricsData] = useState<any>(null);
  const [isRiskMetricsLoading, setIsRiskMetricsLoading] = useState(false);
  const [riskMetricsError, setRiskMetricsError] = useState<string | null>(null);
  const [diversificationData, setDiversificationData] = useState<any>(null);
  const [isDiversificationLoading, setIsDiversificationLoading] = useState(false);
  const [diversificationError, setDiversificationError] = useState<string | null>(null);
  // Allocation timeline data using new hook - now uses real API with 12 month limit
  const [allocationTimelineGranularity, setAllocationTimelineGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const { 
    allocationData: allocationTimelineData, 
    loading: isAllocationTimelineLoading, 
    error: allocationTimelineError 
  } = usePortfolioAllocationTimeline(portfolioId!, 12, allocationTimelineGranularity);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState('1Y');
  const [benchmarkTwrPeriod, setBenchmarkTwrPeriod] = useState('1M');
  const [assetDetailData, setAssetDetailData] = useState<any>(null);
  const [isAssetDetailLoading, setIsAssetDetailLoading] = useState(false);
  const [assetDetailError, setAssetDetailError] = useState<string | null>(null);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Ultra compact mode - gấp đôi compact
  const getUltraSpacing = (normal: number, ultra: number) => 
    isCompactMode ? ultra : normal;

  const { portfolio, isLoading: isPortfolioLoading, error: portfolioError, refetch: refetchPortfolio } = usePortfolio(portfolioId!);
  const {
    navData,
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
        apiService.getPortfolioAssetPerformance(portfolioId),
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
            <Tab label="Trading Analysis" defaultChecked />
            <Tab label="Asset Allocation" />
            <Tab label="Trading Management" />
            <Tab label="Deposit Management" />
            <Tab label="Cash Flow" />
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
            pt: 0, // Reduced padding top by half
          }}>
            <Grid container spacing={getUltraSpacing(3, 1)}>
              {/* Portfolio Performance Section - Renamed from Benchmark Comparison */}
              <SectionWrapper 
                title="Portfolio Performance (Hiệu suất danh mục)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
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
                    title="Portfolio Performance"
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
              </SectionWrapper>
              {/* Trading Analysis Section */}
              <SectionWrapper 
                title="Trading Analysis (Phân tích giao dịch)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
                <TradeAnalysisContainer 
                  portfolioId={portfolioId!} 
                  isCompactMode={isCompactMode}
                />
              </SectionWrapper>
              
              {/* Risk Metrics Section */}
              <SectionWrapper 
                title="Risk Metrics (Chỉ số rủi ro)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
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
                  />
                )}
              </SectionWrapper>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0, // No padding top for consistency
          }}>
            <Grid container spacing={getUltraSpacing(3, 1)}>
              {/* Trading Management Section */}
              <SectionWrapper 
                title="Trading Management (Quản lý giao dịch)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
                <TradeListContainer 
                  portfolioId={portfolioId!} 
                  onCreate={() => setShowCreateForm(true)}
                  isCompactMode={isCompactMode}
                />
              </SectionWrapper>
            </Grid>
          </Box>
        </TabPanel>

        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0, // No padding top for consistency
          }}>
            <Grid container spacing={getUltraSpacing(3, 1)}>
              {/* Portfolio Overview Section */}
              <SectionWrapper 
                title="Portfolio Overview (Tổng quan danh mục)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
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
                        {formatCurrency(portfolio.totalInvestValue || 0, portfolio.baseCurrency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Total Investment Value (Assets + Deposits)
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
                        {formatCurrency(portfolio.unrealizedInvestPnL || 0, portfolio.baseCurrency)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Unrealized P&L (Assets + Deposits)
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
                        Cash Balance (Số dư tiền mặt)
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
                        {formatNumberWithSeparators(Object.keys(allocationData?.allocation || {}).length, 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Asset Classes (Loại tài sản)
                    </Typography>
                      </Box>
                  </Grid>
              </Grid>
              </SectionWrapper>

              {/* Asset Allocation Section */}
              <SectionWrapper 
                title="Asset Type Allocation (Phân bổ loại tài sản)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
              <Grid container spacing={getUltraSpacing(2, 1)}>
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
                      fontSize: '0.8rem',
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
                      fontSize: '0.8rem',
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
                              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.75rem' }}>
                                {assetType.toUpperCase()}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '0.75rem' }}>
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
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2, display: 'block', fontSize: '0.65rem' }}>
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
                              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontSize: '0.7rem', display: 'block' }}>
                                Total Assets Value
                              </Typography>
                              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                                {formatCurrency(allocationData?.totalAssetsValue || 0, portfolio.baseCurrency)}
                              </Typography>
                            </Box>
                            
                            {/* Total Deposits Value Column */}
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontSize: '0.7rem', display: 'block' }}>
                                Total Deposits Value
                              </Typography>
                              <Typography variant="h6" color="primary" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                                {formatCurrency(allocationData?.totalDepositsValue || 0, portfolio.baseCurrency)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        No allocation data available
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
              </SectionWrapper>

              {/* Asset Detail Summary Section */}
              <SectionWrapper 
                title="Asset Detail Summary (Tổng quan tài sản)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
              <Box sx={{ 
                p: getUltraSpacing(2, 1), 
                backgroundColor: 'white', 
                borderRadius: 2, 
                boxShadow: 1,
                border: '1px solid #e0e0e0'
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
                  />
                )}
              </Box>
              </SectionWrapper>

              {/* Risk & Performance Analysis Section */}
              <SectionWrapper 
                title="Risk & Performance Analysis (Rủi ro và hiệu suất)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
              <Grid container spacing={getUltraSpacing(2, 1)}>
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
              </SectionWrapper>

              {/* Diversification & Timeline Section */}
              <SectionWrapper 
                title="Diversification & Timeline (Đa dạng hóa và lịch sử phân bổ)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
              <Grid container spacing={getUltraSpacing(2, 1)}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: getUltraSpacing(2, 1), 
                    backgroundColor: 'white', 
                    borderRadius: 2, 
                    boxShadow: 1,
                    border: '1px solid #e0e0e0',
                    height: '100%'
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
              </SectionWrapper>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0, // No padding top for consistency
          }}>
            <Grid container spacing={getUltraSpacing(3, 1)}>
              {/* Deposit Management Section */}
              <SectionWrapper 
                title="Deposit Management (Quản lý tiền gửi)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
                <DepositManagementTab portfolioId={portfolioId!} />
              </SectionWrapper>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 0, // No padding top for consistency
          }}>
            <Grid container spacing={getUltraSpacing(3, 1)}>
              {/* Cash Flow Management Section */}
              <SectionWrapper 
                title="Cash Flow Management (Quản lý dòng tiền)"
                isCompactMode={isCompactMode}
                getUltraSpacing={getUltraSpacing}
              >
                <CashFlowLayout 
                  portfolioId={portfolioId!} 
                  onCashFlowUpdate={() => {
                    // Refresh portfolio data when cash flow is updated
                    refetchPortfolio();
                  }}
                />
              </SectionWrapper>
            </Grid>
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
