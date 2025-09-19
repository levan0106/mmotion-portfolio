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
import BenchmarkComparison from '../components/Analytics/BenchmarkComparison';
import AssetDetailSummary from '../components/Analytics/AssetDetailSummary';
import { TradeForm } from '../components/Trading/TradeForm';
import { TradeListContainer } from '../components/Trading/TradeList';
import { TradeAnalysisContainer } from '../components/Trading/TradeAnalysis';
import CashFlowLayout from '../components/CashFlow/CashFlowLayout';
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
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
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
      setAssetPerformanceData(null);
      setRiskMetricsData(null);
      setDiversificationData(null);
      setAllocationTimelineData(null);
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
  const totalVolume = trades.reduce((sum, trade) => sum + (Number(trade.quantity) * Number(trade.price) || 0), 0);
  const totalFeesAndTaxes = trades.reduce((sum, trade) => sum + (Number(trade.fee) || 0) + (Number(trade.tax) || 0), 0);
  const realizedPL = trades.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0);


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
                     Assets Value
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatCurrency(portfolio.totalValue, portfolio.baseCurrency)}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Current NAV (+cash)
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {navData ? formatCurrency(navData.navValue, portfolio.baseCurrency) : 'N/A'}
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
                     {totalTrades}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Total Volume
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#1a1a1a' }}>
                     {formatCurrency(totalVolume, portfolio?.baseCurrency || 'VND')}
                   </Typography>
                 </Box>
               </Box>
             </CardContent>
          </Card>
        </Grid>

        {/* P&L & Costs */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{  
            background: realizedPL >= 0 
              ? 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            color: '#1a1a1a',
            position: 'relative',
            overflow: 'hidden',
            border: realizedPL >= 0 
              ? '1px solid #f3e8ff'
              : '1px solid #fecaca',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: realizedPL >= 0 
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
              background: realizedPL >= 0 
                ? 'rgba(240, 147, 251, 0.1)'
                : 'rgba(255, 154, 158, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {realizedPL >= 0 ? 
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
                       color: realizedPL >= 0 ? '#059669' : '#dc2626'
                     }}
                   >
                     {formatCurrency(realizedPL, portfolio?.baseCurrency || 'VND')}
                   </Typography>
                 </Box>
                 <Box sx={{ flex: 1 }}>
                   <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.85rem', mb: 0.8, fontWeight: 300 }}>
                     Fees & Taxes
                   </Typography>
                   <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, color: '#ea580c' }}>
                     {formatCurrency(totalFeesAndTaxes, portfolio?.baseCurrency || 'VND')}
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
            pt: 3, // Add padding top
          }}>
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
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 3, // Add padding top
          }}>
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
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 3, // Add padding top
          }}>

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
                      Total Portfolio Value (Tổng giá trị tài sản)
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
                      Unrealized P&L (Lợi nhuận chưa thực hiện)
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
                      {Object.keys(allocationData?.allocation || {}).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Asset Classes (Loại tài sản)
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
                    Asset Type Allocation (Phân bổ loại tài sản)
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
                      Asset Type Allocation Summary 
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
                            Total Asset Value (Tổng giá trị tài sản)
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
                Asset Detail Summary (Tổng quan tài sản)
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
                Risk & Performance Analysis (Rủi ro và hiệu suất)
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
                Risk Metrics (Chỉ số rủi ro)
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
                Diversification & Timeline (Đa dạng hóa và lịch sử phân bổ)
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


            {/* Benchmark Comparison Section */}
            <Box sx={{ mb: getUltraSpacing(4, 1) }}>
              <Typography variant={isCompactMode ? "h6" : "h5"} gutterBottom sx={{ 
                fontWeight: 600, 
                color: '#1a1a1a', 
                mb: getUltraSpacing(3, 1),
                fontSize: isCompactMode ? '0.9rem' : undefined
              }}>
                Benchmark Comparison (So sánh với benchmark)
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

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ 
            backgroundColor: 'background.paper',
            minHeight: '80vh',
            pt: 3, // Add padding top
          }}>
            <CashFlowLayout 
              portfolioId={portfolioId!} 
              onCashFlowUpdate={() => {
                // Refresh portfolio data when cash flow is updated
                refetchPortfolio();
              }}
            />
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
