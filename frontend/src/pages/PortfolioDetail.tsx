/**
 * Portfolio detail page component
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CircularProgress,
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Fab,
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
  Person as InvestorIcon,
  Business as FundManagerIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { usePortfolio, usePortfolioAnalytics } from '../hooks/usePortfolios';
import { useCreateTrade, useTrades } from '../hooks/useTrading';
import { useAccount } from '../contexts/AccountContext';
import { useQueryClient } from 'react-query';
import { invalidatePortfolioQueries, forceRefreshPortfolioData } from '../utils/queryUtils';
import { TradeForm } from '../components/Trading/TradeForm';
import { 
  PerformanceTab,
  AllocationTab,
  TradingManagementTab,
  DepositManagementTab,
  CashFlowTab,
  NAVHoldingsTab
} from '../components/PortfolioTabs';
import InvestorReportWrapper from '../components/Reports/InvestorReportWrapper';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumberWithSeparators 
} from '../utils/format';
import { CreateTradeDto } from '../types';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { ResponsiveButton } from '../components/Common';
import PermissionBadge from '../components/Common/PermissionBadge';
import PortfolioPermissionModal from '../components/Portfolio/PortfolioPermissionModal';
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
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PortfolioDetail: React.FC = () => {
  const { t } = useTranslation();
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [viewMode, setViewMode] = useState<'investor' | 'fund-manager'>('fund-manager');
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const { accountId } = useAccount();
  const queryClient = useQueryClient();
  

  // Reset tab value when switching view modes (only for fund-manager)
  useEffect(() => {
    if (viewMode === 'fund-manager') {
      setTabValue(0); // Always start with first tab when switching to fund-manager
    }
  }, [viewMode]);

  // Scroll to top when component mounts or portfolioId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [portfolioId]);

  // Handle tab parameter from URL (only for fund-manager view)
  useEffect(() => {
    if (viewMode === 'fund-manager') {
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        // Support both numeric index and tab name
        let tabIndex: number;
        
        if (isNaN(Number(tabParam))) {
          // Tab name provided
          const tabNameMap: { [key: string]: number } = {
            'performance': 0,
            'allocation': 1,
            'trading': 2,
            'deposit': 3,
            'cash-flow': 4,
            'holdings': 5
          };
          tabIndex = tabNameMap[tabParam] ?? 0;
        } else {
          // Numeric index provided
          tabIndex = parseInt(tabParam, 10);
        }
        
        // Validate tab index (0-5 for fund-manager)
        if (tabIndex >= 0 && tabIndex <= 5) {
          setTabValue(tabIndex);
          // Scroll to top when tab is set from URL
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  }, [searchParams, viewMode]);

  // Ultra compact mode - gấp đôi compact
  const getUltraSpacing = (normal: number, ultra: number) => 
    isCompactMode ? ultra : normal;

  const { portfolio, isLoading: isPortfolioLoading, error: portfolioError, refetch: refetchPortfolio } = usePortfolio(portfolioId!);
  const {
    // navData,
    performanceData,
  } = usePortfolioAnalytics(portfolioId!);
  
  // Check if current user is the owner
  const isOwner = portfolio && accountId ? portfolio.accountId === accountId : false;
  
  const createTradeMutation = useCreateTrade();
  const tradesQuery = useTrades(portfolioId!);
  const trades = tradesQuery.data || [];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Only handle tab changes for fund-manager view
    if (viewMode === 'fund-manager') {
      // Validate tab index (0-5 for fund-manager)
      const validTabIndex = Math.min(Math.max(newValue, 0), 5);
      setTabValue(validTabIndex);
      // Scroll to top when changing tabs
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      console.log('🔄 Starting refresh for portfolio:', portfolioId);
      
      // Debug: Log all current queries
      const allQueries = queryClient.getQueryCache().getAll();
      console.log('📊 All queries before refresh:', allQueries.map(q => ({
        queryKey: q.queryKey,
        state: q.state.status,
        dataUpdatedAt: q.state.dataUpdatedAt
      })));
      
      // Method 1: Use utility function
      await invalidatePortfolioQueries(queryClient, portfolioId);
      
      // Method 2: Force refresh (nuclear option)
      await forceRefreshPortfolioData(queryClient, portfolioId);
      
      // Method 3: Also manually invalidate specific patterns as backup
      await Promise.all([
        queryClient.invalidateQueries(['portfolio', portfolioId]),
        queryClient.invalidateQueries(['portfolio-performance', portfolioId]),
        queryClient.invalidateQueries(['portfolio-allocation', portfolioId]),
        queryClient.invalidateQueries(['portfolio-positions', portfolioId]),
        queryClient.invalidateQueries(['trades', portfolioId]),
        queryClient.invalidateQueries(['portfolio-permission-stats', portfolioId]),
        queryClient.invalidateQueries(['investor-report', portfolioId]),
        queryClient.invalidateQueries(['cash-flow', portfolioId]),
      ]);
      
      console.log('✅ Refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Calculate trading summary
  const totalTrades = trades.length;
  const totalTradeValue = trades.reduce((sum, trade) => sum + (Number(trade.quantity) * Number(trade.price) || 0), 0);
  const totalTradeFeesAndTaxes = trades.reduce((sum, trade) => sum + (Number(trade.fee) || 0) + (Number(trade.tax) || 0), 0);
  const totalTradeRealizedPL = trades.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0);

  const handleBack = () => {
    navigate('/portfolios');
  };

  if (isPortfolioLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress size={60} thickness={4} />
        <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
          {t('portfolio.loading', 'Đang tải dữ liệu...')}
        </ResponsiveTypography>
      </Box>
    );
  }

  if (portfolioError || !portfolio) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <ResponsiveTypography variant="errorText">
          {t('portfolio.failedToLoad')}
        </ResponsiveTypography>
      </Box>
    );
  }

  return (
    <Box 
      className="portfolio-detail"
      sx={{ 
        scrollBehavior: 'smooth',
        position: 'relative', // Ensure proper positioning context
        minHeight: '100vh', // Ensure full height
        // Mobile sticky fixes
        overflow: 'visible', // Ensure no overflow issues
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}>

      {/* Sticky Header */}
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: { xs: 1, sm: 1.5, md: 2 },
          px: { xs: 1, sm: 1.5, md: 2 },
          mb: { xs: 1.5, sm: 2, md: 3 },
          boxShadow: { 
            xs: '0 2px 8px rgba(0,0,0,0.08)', 
            sm: '0 4px 12px rgba(0,0,0,0.1)' 
          },
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1.5, sm: 2, md: 0 },
            width: '100%',
          }}
        >
          <Box sx={{ 
            textAlign: { xs: 'center', sm: 'left' },
            width: { xs: '100%', sm: 'auto' },
            flex: { sm: 1 }
          }}>
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <ResponsiveTypography variant="pageTitle" gutterBottom={false}>
                {portfolio.name}
              </ResponsiveTypography>
              {portfolio.userPermission && (
                <PermissionBadge 
                  permission={portfolio.userPermission} 
                  size="small"
                  showIcon={true}
                />
              )}
            </Box>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {t('portfolio.managementTrading')}
            </ResponsiveTypography>
          </Box>
          <Box 
            display="flex" 
            gap={{ xs: 1.5, sm: 2 }}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' },
              flexShrink: 0,
            }}
          >
            <ResponsiveButton
              variant="outlined"
              icon={<ArrowBackIcon />}
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              mobileText={t('common.back')}
              desktopText={t('portfolio.backToPortfolios')}
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                borderRadius: 2, 
                px: { xs: 2, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: 'auto', sm: '120px' },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                }
              }}
            >
              <ResponsiveTypography variant="buttonText">
                {t('portfolio.backToPortfolios')}
              </ResponsiveTypography>
            </ResponsiveButton>
            <Tooltip title={t('portfolio.refreshAllData')}>
              <span>
                <ResponsiveButton
                  variant="outlined"
                  icon={<RefreshIcon />}
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshAll}
                  disabled={isRefreshingAll}
                  forceIconOnly={true}
                  sx={{ 
                    display: { xs: 'none', sm: 'flex' },
                    borderRadius: 2, 
                    px: { xs: 2, sm: 3 },
                    py: { xs: 0.75, sm: 1 },
                    width: 'auto',
                    minWidth: 'auto',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  <ResponsiveTypography variant="buttonText">
                    {isRefreshingAll ? t('portfolio.refreshing') : t('portfolio.refreshAll')}
                  </ResponsiveTypography>
                </ResponsiveButton>
              </span>
            </Tooltip>
            {isOwner && (
              <Tooltip title="Manage Portfolio Permissions">
                <IconButton
                  onClick={() => setPermissionModalOpen(true)}
                  color="primary"
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    p: 1.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                    },
                  }}
                >
                  <SecurityIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Portfolio Summary Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ 
        mb: { xs: 2, sm: 4 },
        maxWidth: '100%',
        margin: 0,
        '& .MuiGrid-item': {
          paddingLeft: { xs: '8px', sm: '12px', md: '16px' },
          paddingTop: { xs: '8px', sm: '12px', md: '16px' }
        }
      }}>
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
             <CardContent sx={{ 
               height: '100%', 
               display: 'flex', 
               flexDirection: 'column', 
               justifyContent: 'space-between', 
               p: { xs: 1.5, sm: 2.5, md: 3 } 
             }}>
               <Box>
                 <ResponsiveTypography variant="cardTitle" sx={{ mb: { xs: 0.3, sm: 0.5 } }}>
                   {t('portfolio.portfolioValue')}
                 </ResponsiveTypography>
                 <ResponsiveTypography variant="cardSubtitle">
                   {t('portfolio.assetValueNav')}
                 </ResponsiveTypography>
               </Box>
               <Box sx={{ 
                 display: 'flex', 
                 flexDirection: { xs: 'row', sm: 'row' },
                 gap: { xs: 1, sm: 2 }, 
                 mt: 2 
               }}>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }} ellipsis>
                     {t('portfolio.capitalValue')}
                   </ResponsiveTypography>
                   <ResponsiveTypography variant="cardValue" ellipsis>
                     {formatCurrency(portfolio.totalCapitalValue || 0, portfolio.baseCurrency)}
                   </ResponsiveTypography>
                 </Box>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }} ellipsis>
                     {t('portfolio.currentNav')}
                   </ResponsiveTypography>
                   <ResponsiveTypography variant="cardValue" ellipsis>
                     {formatCurrency(portfolio.totalAllValue, portfolio.baseCurrency)}
                   </ResponsiveTypography>
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
             <CardContent sx={{ 
               height: '100%', 
               display: 'flex', 
               flexDirection: 'column', 
               justifyContent: 'space-between', 
               p: { xs: 1.5, sm: 2.5, md: 3 } 
             }}>
               <Box>
                 <ResponsiveTypography variant="cardTitle" sx={{ mb: { xs: 0.3, sm: 0.5 } }}>
                   {t('portfolio.performance')}
                 </ResponsiveTypography>
                 <ResponsiveTypography variant="cardSubtitle">
                   {t('portfolio.totalAnnualReturns')}
                 </ResponsiveTypography>
               </Box>
               <Box sx={{ 
                 display: 'flex', 
                 flexDirection: { xs: 'row', sm: 'row' },
                 gap: { xs: 1, sm: 2 }, 
                 mt: 2 
               }}>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }}>
                     {t('portfolio.totalReturn')}
                   </ResponsiveTypography>
                   <ResponsiveTypography 
                     variant="cardValue"
                     sx={{ 
                       color: (performanceData?.totalReturn || 0) >= 0 ? '#059669' : '#dc2626'
                     }}
                   >
                     {performanceData ? formatPercentage(performanceData.totalReturn) : t('common.noData')}
                   </ResponsiveTypography>
                 </Box>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }}>
                     {t('portfolio.ytdReturn')}
                   </ResponsiveTypography>
                   <ResponsiveTypography 
                     variant="cardValue"
                     sx={{ 
                       color: (performanceData?.ytdReturn || 0) >= 0 ? '#059669' : '#dc2626'
                     }}
                   >
                     {performanceData ? formatPercentage(performanceData.ytdReturn) : t('common.noData')}
                   </ResponsiveTypography>
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
             <CardContent sx={{ 
               height: '100%', 
               display: 'flex', 
               flexDirection: 'column', 
               justifyContent: 'space-between', 
               p: { xs: 1.5, sm: 2.5, md: 3 } 
             }}>
               <Box>
                 <ResponsiveTypography variant="cardTitle" sx={{ mb: { xs: 0.3, sm: 0.5 } }}>
                   {t('portfolio.tradingActivity')}
                 </ResponsiveTypography>
                 <ResponsiveTypography variant="cardSubtitle">
                   {t('portfolio.tradingVolume')}
                 </ResponsiveTypography>
               </Box>
               <Box sx={{ 
                 display: 'flex', 
                 flexDirection: { xs: 'row', sm: 'row' },
                 gap: { xs: 1, sm: 2 }, 
                 mt: 2 
               }}>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }}>
                     {t('portfolio.totalTrades')}
                   </ResponsiveTypography>
                   <ResponsiveTypography variant="cardValue">
                     {formatNumberWithSeparators(totalTrades, 0)}
                   </ResponsiveTypography>
                 </Box>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }}>
                     {t('portfolio.totalTradedValue')}
                   </ResponsiveTypography>
                   <ResponsiveTypography variant="cardValue">
                     {formatCurrency(totalTradeValue, portfolio?.baseCurrency || 'VND')}
                   </ResponsiveTypography>
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
             <CardContent sx={{ 
               height: '100%', 
               display: 'flex', 
               flexDirection: 'column', 
               justifyContent: 'space-between', 
               p: { xs: 1.5, sm: 2.5, md: 3 } 
             }}>
               <Box>
                 <ResponsiveTypography variant="cardTitle" sx={{ mb: { xs: 0.3, sm: 0.5 } }}>
                   {t('portfolio.plCosts')}
                 </ResponsiveTypography>
                 <ResponsiveTypography variant="cardSubtitle">
                   {t('portfolio.profitCosts')}
                 </ResponsiveTypography>
               </Box>
               <Box sx={{ 
                 display: 'flex', 
                 flexDirection: { xs: 'row', sm: 'row' },
                 gap: { xs: 1, sm: 2 }, 
                 mt: 2 
               }}>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }}>
                     {t('portfolio.realizedPL')}
                   </ResponsiveTypography>
                   <ResponsiveTypography 
                     variant="cardValue"
                     sx={{ 
                       color: portfolio.realizedInvestPnL >= 0 ? '#059669' : '#dc2626'
                     }}
                   >
                     {formatCurrency(portfolio.realizedInvestPnL || 0, portfolio?.baseCurrency || 'VND')}
                   </ResponsiveTypography>
                 </Box>
                 <Box sx={{ flex: 1, minWidth: 0 }}>
                   <ResponsiveTypography variant="cardLabel" sx={{ mb: { xs: 0.5, sm: 0.8 } }}>
                     {t('portfolio.feesTaxes')}
                   </ResponsiveTypography>
                   <ResponsiveTypography 
                     variant="cardValue"
                     sx={{ 
                       color: '#ea580c'
                     }}
                   >
                     {formatCurrency(totalTradeFeesAndTaxes, portfolio?.baseCurrency || 'VND')}
                   </ResponsiveTypography>
                 </Box>
               </Box>
             </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Mode Switcher */}
      <Box
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1,
          px: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1
        }}>
          <ResponsiveButton
            variant={viewMode === 'investor' ? 'contained' : 'outlined'}
            icon={<InvestorIcon />}
            startIcon={<InvestorIcon />}
            onClick={() => setViewMode('investor')}
            mobileText={t('portfolio.investorView')}
            desktopText={t('portfolio.investorView')}
            sx={{ 
              borderRadius: 2,
              px: 2,
              py: 1,
              mt: 0.5,
              minWidth: { xs: 'auto', sm: '140px' },
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              }
            }}
          >
            {t('portfolio.investorView')}
          </ResponsiveButton>
          <ResponsiveButton
            variant={viewMode === 'fund-manager' ? 'contained' : 'outlined'}
            icon={<FundManagerIcon />}
            startIcon={<FundManagerIcon />}
            onClick={() => setViewMode('fund-manager')}
            mobileText={t('portfolio.fundManagerView')}
            desktopText={t('portfolio.fundManagerView')}
            sx={{ 
              borderRadius: 2,
              px: 2,
              py: 1,
              mt: 0.5,
              minWidth: { xs: 'auto', sm: '140px' },
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              }
            }}
          >
            {t('portfolio.fundManagerView')}
          </ResponsiveButton>
        </Box>
      </Box>

      {/* Sticky Tabs with Toggle - Only show for Fund Manager View */}
      {viewMode === 'fund-manager' && (
        <Box
          className="sticky-element"
          sx={{
            position: 'sticky',
            top: { xs: -15, sm: -15, md: -20 },
            zIndex: 1200,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            // Mobile-specific fixes
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)', // Force hardware acceleration
            willChange: 'transform', // Optimize for mobile
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            px: { xs: 1, sm: 2 },
            flexDirection: 'row',
            gap: { xs: 1, sm: 2 },
            flexWrap: 'nowrap'
          }}>
            {/* Tabs */}
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="portfolio tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: '40px',
                width: { xs: 'calc(100% - 50px)', sm: 'auto' },
                overflow: 'auto',
                flex: 1,
                '& .MuiTabs-flexContainer': {
                  gap: { xs: 0.5, sm: 1 },
                },
                '& .MuiTab-root': {
                  minHeight: '40px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' },
                  minWidth: { xs: '80px', sm: '100px', md: '120px' },
                  px: { xs: 0.75, sm: 1.5, md: 2 },
                  py: { xs: 0.5, sm: 1 },
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  '& .MuiTab-iconWrapper': {
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                    marginRight: { xs: 0.25, sm: 0.5 },
                  },
                },
                '& .MuiTabs-scrollButtons': {
                  display: { xs: 'flex', sm: 'flex' },
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  },
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              {/* Fund Manager View - Show all management tabs */}
              <Tab 
                icon={<TrendingUpIcon />} 
                iconPosition="start" 
                label={t('portfolio.performance')} 
              />
              <Tab 
                icon={<AllocationIcon />} 
                iconPosition="start" 
                label={t('portfolio.allocation')} 
              />
              <Tab 
                icon={<TradingIcon />} 
                iconPosition="start" 
                label={t('portfolio.trading')} 
              />
              <Tab 
                icon={<DepositIcon />} 
                iconPosition="start" 
                label={t('portfolio.deposit')} 
              />
              <Tab 
                icon={<CashFlowIcon />} 
                iconPosition="start" 
                label={t('portfolio.cashFlow')} 
              />
              <Tab 
                icon={<HoldingsIcon />} 
                iconPosition="start" 
                label={t('navigation.holdings')} 
              />
            </Tabs>
            
            {/* Compact Mode Toggle */}
            <Tooltip title={isCompactMode ? t('portfolio.switchToNormal') : t('portfolio.switchToCompact')}>
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
      )}

      {/* Content Container */}
      {viewMode === 'investor' ? (
        // Investor View - Show report directly without tabs
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
          <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            <InvestorReportWrapper
              portfolioId={portfolioId!}
              accountId={portfolio.accountId}
            />
          </Box>
        </Box>
      ) : (
        // Fund Manager View - Show tabs content
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
      )}
      {/* Create Trade Modal */}
      <TradeForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateTrade}
        defaultPortfolioId={portfolioId!}
        isLoading={createTradeMutation.isLoading}
        error={createTradeMutation.error?.message}
        mode="create"
        isModal={true}
        showSubmitButton={false}
      />

      {/* Portfolio Permission Modal */}
      <PortfolioPermissionModal
        open={permissionModalOpen}
        onClose={() => setPermissionModalOpen(false)}
        portfolioId={portfolioId!}
        portfolioName={portfolio.name}
        onPermissionUpdated={() => {
          // TODO: Refresh portfolio data or permission stats
          console.log('Permissions updated');
        }}
      />

      {/* Floating Action Button for Quick Create Trade */}
      <Tooltip 
        title={t('portfolio.createNewTrade')} 
        placement="left" 
        arrow
        sx={{ zIndex: 1301 }}
      >
        <Fab
          color="primary"
          aria-label="add trade"
          onClick={() => setShowCreateForm(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
            zIndex: 1300,
            display: 'flex',
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            minWidth: { xs: 48, sm: 56 },
            minHeight: { xs: 48, sm: 56 },
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default PortfolioDetail;
