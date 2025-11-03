/**
 * Professional Financial Dashboard component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
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
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  Add as AddIcon,
  Assessment,
  Timeline,
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
import { useLastUpdateTime } from '../hooks/useSystemStatus';
import { formatCurrency, formatPercentage, normalizeAmount } from '../utils/format';
import PortfolioCardWithPermissions from '../components/Portfolio/PortfolioCardWithPermissions';
import PortfolioPermissionModal from '../components/Portfolio/PortfolioPermissionModal';
import PortfolioForm from '../components/Portfolio/PortfolioForm';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { ResponsiveButton, ActionButton } from '../components/Common';
import DemoAccountSuggestionBanner from '../components/Common/DemoAccountSuggestionBanner';
import { apiService } from '../services/api';
import { Portfolio, UpdatePortfolioDto } from '../types';
import { useQuery } from 'react-query';

// Component for portfolio growth row in Quick Insights table
const PortfolioGrowthRow: React.FC<{ 
  portfolio: Portfolio; 
  displayCurrency: string;
  dailyReturnData?: {
    dailyPercent: number;
    totalNav: number; 
    dailyValue: number;
  };
  isLoadingDaily?: boolean;
}> = ({ portfolio, displayCurrency, dailyReturnData, isLoadingDaily }) => {
  // Ensure portfolio has valid ID
  if (!portfolio || !portfolio.portfolioId) {
    return null;
  }

  // YTD return: get from performance API (correct YTD from beginning of year)
  const { data: performanceData, isLoading: isLoadingYtd } = useQuery(
    ['portfolio-performance', portfolio.portfolioId],
    () => apiService.getPortfolioPerformance(portfolio.portfolioId),
    {
      enabled: !!portfolio.portfolioId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  );

  // Daily return: use data from portfolio-returns API if available
  const dailyPercent = dailyReturnData?.dailyPercent ?? 0;
  const dailyValue = dailyReturnData?.dailyValue ?? 0;
  const dailyChange = dailyPercent !== 0 
    ? `${dailyPercent >= 0 ? '+' : ''}${dailyPercent.toFixed(2)}%`
    : '+0.0%';
  const dailyGrowth = dailyPercent;

  // Use totalNav from API if available, otherwise fallback to portfolio.totalAllValue
  const displayNav = dailyReturnData?.totalNav ?? parseFloat(portfolio.totalAllValue?.toString() || '0');
  
  // YTD return: get from performance API (already in percentage number)
  // Convert to string format with sign for display
  // Ensure ytdReturnValue is a number
  const ytdReturnValue = performanceData?.ytdReturn != null 
    ? parseFloat(performanceData.ytdReturn.toString()) || 0
    : 0;
  const ytdChange = ytdReturnValue !== 0 
    ? `${ytdReturnValue >= 0 ? '+' : ''}${ytdReturnValue.toFixed(2)}%`
    : '+0.0%';
  const ytdGrowth = ytdReturnValue;

  return (
    <TableRow hover>
      <TableCell sx={{ 
        maxWidth: { xs: 120, sm: 120, md: 150, lg: 250 },
        py: { xs: 0.5, sm: 0.75, md: 1 },
        px: { xs: 0.75, sm: 1, md: 1.5 }
      }}>
        <ResponsiveTypography 
          variant="tableCell"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {portfolio.name}
        </ResponsiveTypography>
      </TableCell>
      <TableCell align="right" sx={{ 
        py: { xs: 0.5, sm: 0.75, md: 1 },
        px: { xs: 0.75, sm: 1, md: 1.5 }
      }}>
        <ResponsiveTypography variant="tableCell" sx={{ fontSize: '0.75rem', maxWidth: { xs:110, sm: '100%' } }}>
          {formatCurrency(displayNav, displayCurrency)}
        </ResponsiveTypography>
      </TableCell>
      <TableCell align="right" sx={{ 
        py: { xs: 0.5, sm: 0.75, md: 1 },
        px: { xs: 0.75, sm: 1, md: 1.5 }
      }}>
        {isLoadingDaily ? (
          <CircularProgress size={14} />
        ) : (
          <>
          <Chip
            label={dailyChange}
            size="small"
            color={dailyGrowth >= 0 ? 'success' : 'error'}
            sx={{ 
              fontSize: '0.7rem',
              height: 22,
              '& .MuiChip-label': { px: 1 }
            }}
          />
          <ResponsiveTypography variant="tableCell" sx={{ 
            fontSize: '0.7rem!important',
            color: dailyValue >= 0 ? 'success.main' : 'error.main'
            }}>
          {formatCurrency(dailyValue, displayCurrency)}
          </ResponsiveTypography>
          </>
        )}
      </TableCell>
      <TableCell align="right" sx={{ 
        py: { xs: 0.5, sm: 0.75, md: 1 },
        px: { xs: 0.75, sm: 1, md: 1.5 }
      }}>
        {isLoadingYtd ? (
          <CircularProgress size={14} />
        ) : (
          <Chip
            label={ytdChange}
            size="small"
            color={ytdGrowth >= 0 ? 'success' : 'error'}
            sx={{ 
              fontSize: '0.7rem',
              height: 22,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        )}
      </TableCell>
    </TableRow>
  );
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { accountId } = useAccount();
  const { portfolios, isLoading, error, refetch: refetchPortfolios } = usePortfolios(accountId);
  const { formattedLastUpdateTime, isLoading: isSystemStatusLoading, isAutoSyncEnabled } = useLastUpdateTime();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Ensure portfolios is always an array
  const safePortfolios = Array.isArray(portfolios) ? portfolios : [];
  const { change: totalChange, isLoading: isChangeLoading } = usePortfolioChangeForAllPortfolios(safePortfolios, '1M');
  
  // Fetch portfolio returns for all portfolios using the new API
  const validPortfolioIds = safePortfolios
    .filter(p => p && p.portfolioId)
    .map(p => p.portfolioId);
  
  const { data: portfolioReturnsData, isLoading: isLoadingPortfolioReturns, refetch: refetchPortfolioReturns } = useQuery(
    ['portfolio-returns', validPortfolioIds.join(',')],
    () => apiService.getPortfolioReturns(validPortfolioIds),
    {
      enabled: validPortfolioIds.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  );

  // Create a map for quick lookup of portfolio return data
  const portfolioReturnsMap = React.useMemo(() => {
    const map = new Map<string, { dailyPercent: number; totalNav: number; dailyValue: number }>();
    if (portfolioReturnsData?.portfolios) {
      portfolioReturnsData.portfolios.forEach((item) => {
        map.set(item.portfolioId, {
          dailyPercent: item.dailyPercent,
          totalNav: item.totalNav,
          dailyValue: item.dailyValue,
        });
      });
    }
    return map;
  }, [portfolioReturnsData]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedPortfolioForPermission, setSelectedPortfolioForPermission] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const { isReadOnly } = useAccount();

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
          {t('dashboard.loading')}
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
          {t('dashboard.failedToLoad')}
        </ResponsiveTypography>
        <ResponsiveTypography variant="formHelper">
          {t('dashboard.checkConnection')}
        </ResponsiveTypography>
      </Alert>
    );
  }

  // Calculate comprehensive financial metrics
  const totalPortfolios = safePortfolios.length;
  const totalValue = safePortfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio?.totalAllValue?.toString() || '0') || 0), 0);
  const totalUnrealizedPL = safePortfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio?.unrealizedAllPnL?.toString() || '0') || 0), 0);
  const totalRealizedPL = safePortfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio?.realizedAllPnL?.toString() || '0') || 0), 0);
  const totalCashBalance = safePortfolios.reduce((sum, portfolio) => sum + (parseFloat(portfolio?.cashBalance?.toString() || '0') || 0), 0);

  // Advanced performance metrics
  const totalPL = totalUnrealizedPL + totalRealizedPL;
  const totalReturnPercentage = totalValue > 0 ? (totalPL / (totalValue - totalPL)) * 100 : 0;
  const cashAllocationPercentage = totalValue > 0 ? (totalCashBalance / totalValue) * 100 : 0;
  const averagePortfolioValue = totalPortfolios > 0 ? totalValue / totalPortfolios : 0;
  
  // Determine the display currency for aggregated values (use first portfolio's currency or VND as default)
  const displayCurrency = safePortfolios.find(p => p?.baseCurrency)?.baseCurrency || 'VND';

  // Handler functions
  const handlePortfolioView = (portfolioId: string) => {
    navigate(`/portfolios/${portfolioId}`);
  };

  const handlePortfolioEdit = (portfolioId: string) => {
    const portfolio = safePortfolios.find(p => p?.portfolioId === portfolioId);
    if (portfolio) {
      setEditingPortfolio(portfolio);
      setEditModalOpen(true);
      setEditError(null);
    }
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditingPortfolio(null);
    setEditError(null);
  };

  const handleEditSubmit = async (data: UpdatePortfolioDto) => {
    if (!editingPortfolio || !accountId) return;
    
    setIsSubmittingEdit(true);
    setEditError(null);
    
    try {
      await apiService.updatePortfolio(editingPortfolio.portfolioId, accountId, data);
      await refetchPortfolios();
      handleEditModalClose();
    } catch (error: any) {
      setEditError(error?.response?.data?.message || error?.message || t('portfolio.form.updateFailed'));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleCreatePortfolio = () => {
    navigate('/portfolios/new');
  };

  const handlePortfolioCopied = (newPortfolio: any) => {
    // Navigate to the new portfolio detail page
    navigate(`/portfolios/${newPortfolio.portfolioId}`);
  };

  const handleManagePermissions = (portfolioId: string) => {
    setSelectedPortfolioForPermission(portfolioId);
    setPermissionModalOpen(true);
  };

  const handlePermissionModalClose = () => {
    setPermissionModalOpen(false);
    setSelectedPortfolioForPermission(null);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    try {
      // Refresh portfolios data
      await refetchPortfolios();
      // Refresh portfolio returns data
      if (validPortfolioIds.length > 0) {
        await refetchPortfolioReturns();
      }
      // Invalidate and refetch system status queries
      queryClient.invalidateQueries('autoSyncStatus');
      queryClient.invalidateQueries('latestPriceUpdate');
      // Invalidate portfolio change queries
      queryClient.invalidateQueries(['portfolio-change']);
      // Invalidate portfolio returns queries
      queryClient.invalidateQueries(['portfolio-returns']);
      // Invalidate portfolio performance queries
      queryClient.invalidateQueries(['portfolio-performance']);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Professional financial metrics cards
  const financialMetrics = [
    {
      title: t('dashboard.totalAssets'),
      value: formatCurrency(totalValue, displayCurrency),
      subtitle: `${totalPortfolios} ${t('dashboard.portfolio', { count: totalPortfolios })}`,
      icon: <AccountBalanceWallet />,
      color: 'primary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
      trend: totalValue > 0 ? 'positive' : 'neutral',
      change: isChangeLoading ? '...' : (totalChange || '+0.0%'),
    },
    {
      title: t('dashboard.totalPL'),
      value: formatCurrency(totalPL, displayCurrency),
      subtitle: totalPL >= 0 ? t('dashboard.profitable') : t('dashboard.loss'),
      icon: totalPL >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: totalPL >= 0 ? 'success' as const : 'error' as const,
      gradient: totalPL >= 0 
        ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.06)} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
      trend: totalPL >= 0 ? 'positive' : 'negative',
      change: formatPercentage(totalReturnPercentage),
    },
    {
      title: t('dashboard.cashPosition'),
      value: formatCurrency(totalCashBalance, displayCurrency),
      subtitle: `${formatPercentage(cashAllocationPercentage)} ${t('dashboard.ofTotal')}`,
      icon: <MonetizationOn />,
      color: 'info' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
      trend: 'neutral',
      change: t('dashboard.liquid'),
    },
    {
      title: t('dashboard.averagePortfolioValue'),
      value: formatCurrency(averagePortfolioValue, displayCurrency),
      subtitle: t('dashboard.perPortfolio'),
      icon: <Assessment />,
      color: 'secondary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
      trend: 'neutral',
      change: t('dashboard.balanced'),
      display: isMobile ? false : true,
    },
  ];

  const bestPortfolio = safePortfolios.length > 0 ? safePortfolios.reduce((best, current) => {
    if (!best) return current;
    const bestRatio = best?.unrealizedInvestPnL && best?.totalInvestValue ? (best.unrealizedInvestPnL / best.totalInvestValue) : 0;
    const currentRatio = current?.unrealizedInvestPnL && current?.totalInvestValue ? (current.unrealizedInvestPnL / current.totalInvestValue) : 0;
    return currentRatio > bestRatio ? current : best;
  }) : null;

  return (
    <Fade in timeout={800}>
      <Box>
        {/* Demo Account Suggestion Banner */}
        <DemoAccountSuggestionBanner />

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
                {t('dashboard.title')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" ellipsis={false}>
                {t('dashboard.subtitle')}
              </ResponsiveTypography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ResponsiveButton
                variant="outlined"
                icon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                startIcon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                onClick={handleRefresh}
                disabled={isRefreshing}
                mobileText={isRefreshing ? t('common.refreshing') : t('common.refresh')}
                desktopText={isRefreshing ? t('dashboard.refreshing') : t('dashboard.refreshData')}
                sx={{ borderRadius: 2 }}
              >
                {isRefreshing ? t('dashboard.refreshing') : t('dashboard.refreshData')}
              </ResponsiveButton>
            </Box>
          </Box>
          
          {/* Status Indicators */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<Security />}
              label={isAutoSyncEnabled ? t('dashboard.systemStatus') : t('dashboard.dataUpdateStatus.systemPaused')}
              color={isAutoSyncEnabled ? "success" : "warning"}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            <Chip
              icon={<Timeline />}
              label={`${t('dashboard.lastUpdated')}: ${isSystemStatusLoading ? t('dashboard.dataUpdateStatus.loading') : formattedLastUpdateTime}`}
              color="info"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
            { !isMobile && (<Chip
              key="activePortfolios"
              icon={<Assessment />}
              label={`${totalPortfolios} ${t('dashboard.portfolio', { count: totalPortfolios })} ${t('dashboard.active')}`}
              color="primary"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />)}
          </Box>
        </Box>

        {/* Professional Financial Metrics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {financialMetrics.filter(metric => metric.display !== false).map((metric, index) => (
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
                        fontWeight: 700
                      }}
                    >
                      {metric.value}
                    </ResponsiveTypography>
                    
                    <ResponsiveTypography 
                      variant="cardTitle" 
                      color="text.secondary"
                      sx={{ 
                        mb: 0.5,
                        fontWeight: 500
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
        {safePortfolios.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={12} md={6} lg={7}>
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
                      {t('dashboard.portfolioPerformance')}
                    </ResponsiveTypography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, background: alpha(theme.palette.success.main, 0.03) }}>
                        <ResponsiveTypography variant="formHelper" gutterBottom>
                          {t('dashboard.bestPerforming')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardTitle" sx={{ color: 'success.main' }}>
                          {bestPortfolio?.name || 'N/A'}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardValueMedium" sx={{ color: 'success.main' }}>
                          {formatCurrency(bestPortfolio?.unrealizedInvestPnL || 0, displayCurrency)}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 2, background: alpha(theme.palette.info.main, 0.03) }}>
                        <ResponsiveTypography variant="formHelper" gutterBottom>
                          {t('dashboard.bestPortfolioCash')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardTitle" sx={{ color: 'info.main' }}>
                          {bestPortfolio ? 
                            formatPercentage((bestPortfolio?.totalInvestValue && bestPortfolio?.totalInvestValue > 0) ? 
                            (normalizeAmount(bestPortfolio?.cashBalance || 0) / normalizeAmount(bestPortfolio?.totalInvestValue || 0)) * 100 : 
                            0)
                          : 'N/A'}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardValueMedium" sx={{ color: 'info.main' }}>
                          {bestPortfolio ? formatCurrency(normalizeAmount(bestPortfolio?.cashBalance || 0), displayCurrency) : 'N/A'}
                        </ResponsiveTypography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={12} md={6} lg={5}>
              <Card sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
                border: `0.5px solid ${alpha(theme.palette.divider, 0.08)}`,
                backdropFilter: 'blur(10px)',
                maxHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 1.5, md: 2 }, flexShrink: 0 }}>
                    <Assessment sx={{ mr: { xs: 1, sm: 1.5, md: 2 }, color: 'secondary.main' }} />
                    <ResponsiveTypography variant="chartTitle" sx={{ fontWeight: "500" }}>
                      {t('dashboard.quickInsights.title')}
                    </ResponsiveTypography>
                  </Box>
                  
                  {safePortfolios.length > 0 ? (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none', bgcolor: 'transparent', 
                    maxHeight: '450px', overflow: 'auto', flex: 1 }}>
                      <Table size="small" stickyHeader sx={{ 
                        '& .MuiTableCell-root': { 
                          py: { xs: 0.5, sm: 0.75, md: 1 },
                          px: { xs: 0.75, sm: 1, md: 1.5 },
                        } 
                      }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8), maxWidth: { xs:120, sm: '100%' }, px: { xs: 0.75, sm: 1, md: 1.5 } }}>
                              <ResponsiveTypography variant="tableHeader">
                                {t('dashboard.quickInsights.name', 'Danh mục')}
                              </ResponsiveTypography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8), maxWidth: { xs:110, sm: 110, md: 150, lg: 250 }, px: { xs: 0.75, sm: 1, md: 1.5 } }}>
                              <ResponsiveTypography variant="tableHeader">
                                {t('dashboard.quickInsights.totalValue', 'Giá trị')}
                              </ResponsiveTypography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8), px: { xs: 0.75, sm: 1, md: 1.5 } }}>
                              <ResponsiveTypography variant="tableHeader" >
                                {t('dashboard.quickInsights.dailyGrowth', 'Hôm nay')}
                              </ResponsiveTypography>
                            </TableCell>
                            <TableCell align="right" sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8), px: { xs: 0.75, sm: 1, md: 1.5 } }}>
                              <ResponsiveTypography variant="tableHeader" >
                                {t('dashboard.quickInsights.ytdGrowth', 'YTD')}
                              </ResponsiveTypography>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {safePortfolios.filter(p => p && p.portfolioId).map((portfolio) => {
                            const dailyReturnData = portfolioReturnsMap.get(portfolio.portfolioId);
                            return (
                              <PortfolioGrowthRow 
                                key={portfolio.portfolioId} 
                                portfolio={portfolio} 
                                displayCurrency={displayCurrency}
                                dailyReturnData={dailyReturnData}
                                isLoadingDaily={isLoadingPortfolioReturns}
                              />
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <ResponsiveTypography variant="formHelper" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      {t('dashboard.noPortfolios')}
                    </ResponsiveTypography>
                  )}
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
                {t('dashboard.investmentPortfolios')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle">
                {t('dashboard.managePortfolios')}
              </ResponsiveTypography>
            </Box>
            <ActionButton
              variant="contained"
              icon={<AddIcon />}
              onClick={handleCreatePortfolio}
              size="large"
              mobileText={t('common.create')}
              desktopText={t('dashboard.createNewPortfolio')}
              sx={{ 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                }
              }}
            >
              {t('dashboard.createNewPortfolio')}
            </ActionButton>
          </Box>
          
          {safePortfolios.length === 0 ? (
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
                {t('dashboard.noPortfoliosFound')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                {t('dashboard.startInvestment')}
              </ResponsiveTypography>
              <ActionButton
                variant="contained"
                icon={<AddIcon />}
                onClick={handleCreatePortfolio}
                size="large"
                mobileText={t('common.create')}
                desktopText={t('dashboard.createFirstPortfolio')}
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
                {t('dashboard.createFirstPortfolio')}
              </ActionButton>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {safePortfolios.filter(p => p && p.portfolioId).map((portfolio, index) => (
                <Grid item xs={12} sm={6} lg={4} xl={3} key={portfolio.portfolioId}>
                  <Slide direction="up" in timeout={800 + index * 100}>
                    <Box>
                      <PortfolioCardWithPermissions
                        portfolio={portfolio}
                        onView={handlePortfolioView}
                        onEdit={handlePortfolioEdit}
                        onPortfolioCopied={handlePortfolioCopied}
                        onManagePermissions={handleManagePermissions}
                        isReadOnly={isReadOnly}
                      />
                    </Box>
                  </Slide>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Portfolio Permission Modal */}
        {selectedPortfolioForPermission && (
          <PortfolioPermissionModal
            open={permissionModalOpen}
            onClose={handlePermissionModalClose}
            portfolioId={selectedPortfolioForPermission}
            portfolioName={safePortfolios.find(p => p?.portfolioId === selectedPortfolioForPermission)?.name || ''}
            creatorAccountId={safePortfolios.find(p => p?.portfolioId === selectedPortfolioForPermission)?.accountId || ''}
            onPermissionUpdated={() => {
              // Refresh portfolios when permissions are updated
              refetchPortfolios();
            }}
          />
        )}

        {/* Portfolio Edit Modal */}
        <PortfolioForm
          open={editModalOpen}
          onClose={handleEditModalClose}
          onSubmit={handleEditSubmit}
          initialData={editingPortfolio ? {
            name: editingPortfolio.name,
            baseCurrency: editingPortfolio.baseCurrency,
            fundingSource: editingPortfolio.fundingSource || '',
            accountId: editingPortfolio.accountId,
            visibility: editingPortfolio.visibility,
            description: editingPortfolio.description || '',
            templateName: editingPortfolio.templateName || '',
          } : undefined}
          isEditing={true}
          isLoading={isSubmittingEdit}
          error={editError || undefined}
        />
      </Box>
    </Fade>
  );
};

export default Dashboard;
