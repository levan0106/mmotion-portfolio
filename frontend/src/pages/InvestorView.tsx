import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  alpha,
  Paper,
  Divider,
  Button,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercentageValue, formatDate } from '../utils/format';
import { apiService } from '../services/api';
import InvestorReportWrapper from '../components/Reports/InvestorReportWrapper';
import { useAccount } from '../contexts/AccountContext';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import PermissionBadge from '../components/Common/PermissionBadge';
import { PortfolioPermissionType } from '../types';
import { AccountBalance, AccountBalanceWallet } from '@mui/icons-material';

interface PortfolioSummary {
  id: string;
  name: string;
  totalValue: number;
  cashBalance: number;
  assetValue: number;
  depositsValue: number;
  performance?: {
    dailyGrowth: number;
    monthlyGrowth: number;
    ytdGrowth: number;
  };
  lastUpdated: string;
  owner?: {
    accountId: string;
    name: string;
    email: string;
  };
  userPermission?: {
    permissionType: PortfolioPermissionType;
    isOwner: boolean;
    accessLevel: 'VIEW_ONLY' | 'FULL_ACCESS';
    canView: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canManagePermissions: boolean;
  };
}

const InvestorView: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentAccount } = useAccount();
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentAccount?.accountId) {
      fetchPortfolios();
    } else {
      setLoading(false);
    }
  }, [currentAccount]);

  // Auto scroll to selected portfolio
  useEffect(() => {
    if (selectedPortfolio && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selectedCard = container.querySelector(`[data-portfolio-id="${selectedPortfolio}"]`) as HTMLElement;
      
      if (selectedCard) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = selectedCard.getBoundingClientRect();
        
        // Calculate scroll position to center the selected card
        const scrollLeft = selectedCard.offsetLeft - (containerRect.width / 2) + (cardRect.width / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentAccount?.accountId) {
        setError(t('investorView.error.loadFailed', 'Không thể tải danh sách portfolio. Vui lòng thử lại sau.'));
        return;
      }
      
      // Fetch all accessible portfolios with investor data in one request
      const portfoliosWithReports = await apiService.getInvestorPortfolios(currentAccount.accountId);
      
      // Transform data to match interface
      const portfolioSummaries: PortfolioSummary[] = portfoliosWithReports.map(item => ({
        id: item.portfolio.id,
        name: item.portfolio.name,
        totalValue: item.portfolio.totalValue,
        cashBalance: item.portfolio.cashBalance,
        assetValue: item.portfolio.assetValue,
        depositsValue: item.portfolio.depositsValue,
        performance: item.performance,
        lastUpdated: item.portfolio.lastUpdated,
        owner: item.portfolio.owner,
        userPermission: item.userPermission,
      }));
      
      setPortfolios(portfolioSummaries);
      
      // Auto-select if only one portfolio
      if (portfolioSummaries.length === 1) {
        setSelectedPortfolio(portfolioSummaries[0].id);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      setError(t('investorView.error.loadFailed', 'Không thể tải danh sách portfolio. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioClick = (portfolioId: string) => {
    setSelectedPortfolio(portfolioId);
  };

  const handleBackToList = () => {
    setSelectedPortfolio(null);
  };

  const handlePortfolioNameClick = (portfolioId: string, event: React.MouseEvent) => {
    // Prevent the card click event from firing
    event.stopPropagation();
    
    // Find the portfolio to check permissions
    const portfolio = portfolios.find(p => p.id === portfolioId);
    
    // Check if user has permission to access portfolio detail
    if (!portfolio?.userPermission) {
      console.warn('No permission data available for portfolio:', portfolioId);
      return;
    }
    
    // Only allow navigation if user has owner or update permission
    if (portfolio.userPermission.isOwner || portfolio.userPermission.canUpdate) {
      navigate(`/portfolios/${portfolioId}`, { 
        state: { from: 'investor', fromInvestor: true } 
      });
    } else {
      console.warn('Insufficient permissions to access portfolio detail:', portfolioId);
      // Optionally show a toast or alert to user
      // You could add a toast notification here if you have a toast system
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return theme.palette.success.main;
    if (value < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          gap={2}
        >
          <CircularProgress size={60} thickness={4} />
          <ResponsiveTypography variant="body1" color="text.secondary">
            {t('investorView.loading', 'Đang tải danh sách portfolio...')}
          </ResponsiveTypography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentAccount?.accountId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          {t('investorView.error.loadFailed', 'Không thể tải danh sách portfolio. Vui lòng thử lại sau.')}
        </Alert>
      </Container>
    );
  } 
  return (
    <Box>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              {t('investorView.title', 'Góc nhìn nhà đầu tư')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {t('investorView.subtitle', 'Tổng quan tất cả danh mục đầu tư của bạn')}
            </ResponsiveTypography>
          </Box>
        </Box>
      </Box>
      {portfolios.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box sx={{ 
            p: 6,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            backdropFilter: 'blur(10px)',
            maxWidth: 500,
            mx: 'auto'
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
              {t('investorView.noPortfolios', 'Chưa có danh mục đầu tư nào')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }} 
            ellipsis={false} paragraph>
              {t('investorView.noPortfoliosDesc', 'Bạn chưa có quyền truy cập vào bất kỳ danh mục đầu tư nào. Hãy xem cổ phần của bạn hoặc liên hệ với quản trị viên để được cấp quyền.')}
            </ResponsiveTypography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AccountBalanceWallet />}
                onClick={() => navigate('/holdings')}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {t('investorView.viewHoldings', 'Xem cổ phần')}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => navigate('/portfolios')}
                sx={{
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                {t('investorView.managePortfolios', 'Quản lý danh mục')}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <>
          {/* Portfolio Cards - Only show when not selected or multiple portfolios */}
          {(!selectedPortfolio || portfolios.length > 1) && (
            <Box sx={{ mb: selectedPortfolio ? 3 : 0, p: 1 }}>
              {selectedPortfolio && portfolios.length > 1 ? (
              // Compact horizontal list when portfolio is selected and multiple portfolios
              <Box 
                ref={scrollContainerRef}
                sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  overflowX: 'auto', 
                  p: 1,
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-track': { backgroundColor: alpha(theme.palette.grey[300], 0.3) },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.grey[500], 0.5), borderRadius: 2 }
                }}
              >
                {portfolios.map((portfolio) => (
                  <Card
                    key={portfolio.id}
                    data-portfolio-id={portfolio.id}
                    sx={{
                      minWidth: 200,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      border: selectedPortfolio === portfolio.id ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                      borderColor: selectedPortfolio === portfolio.id ? theme.palette.primary.main : theme.palette.grey[300],
                      backgroundColor: selectedPortfolio === portfolio.id ? alpha(theme.palette.primary.main, 0.05) : 'inherit',
                      m: 0.5, // Add margin between compact cards
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px ${theme.palette.primary.main}`,
                        borderColor: theme.palette.primary.main,
                      }
                    }}
                    onClick={() => handlePortfolioClick(portfolio.id)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                          <ResponsiveTypography 
                            variant="body2" 
                            onClick={(e) => handlePortfolioNameClick(portfolio.id, e)}
                            sx={{ 
                              fontSize: '0.85rem', 
                              fontWeight: 500,
                              color: selectedPortfolio === portfolio.id ? 'primary.main' : 'text.primary',
                              cursor: (portfolio.userPermission?.isOwner || portfolio.userPermission?.canUpdate) ? 'pointer' : 'default',
                              '&:hover': {
                                textDecoration: (portfolio.userPermission?.isOwner || portfolio.userPermission?.canUpdate) ? 'underline' : 'none'
                              }
                            }}
                          >
                            {portfolio.name}
                          </ResponsiveTypography>
                          {portfolio.userPermission && !currentAccount?.isInvestor && (
                            <PermissionBadge 
                              permission={portfolio.userPermission} 
                              size="small"
                              showIcon={true}
                              showLabel={false}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                                            
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {t('investorView.totalValue', 'Tổng')}
                          </ResponsiveTypography>
                          <ResponsiveTypography variant="body2" color="primary.main" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {formatCurrency(portfolio.totalValue)}
                          </ResponsiveTypography>
                        </Box>
                        {portfolio.performance && (
                          <Box sx={{ textAlign: 'right' }}>
                            <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {t('investorView.ytd', 'YTD')}
                            </ResponsiveTypography>
                            <ResponsiveTypography 
                              variant="body2" 
                              color={getPerformanceColor(portfolio.performance.ytdGrowth)}
                              sx={{ fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              {formatPercentageValue(portfolio.performance.ytdGrowth, 2)}
                            </ResponsiveTypography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            
            ) : (
              // Full grid when no portfolio is selected
              <Grid container spacing={2} sx={{ p: 1 }}>
                {portfolios.map((portfolio) => (
                  <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={portfolio.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        border: '1px solid',
                        borderColor: theme.palette.grey[300],
                        backgroundColor: theme.palette.background.paper,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)',
                        m: 0.5, // Add margin between full grid cards
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(59, 130, 246, 0.3)',
                          borderColor: theme.palette.primary.main,
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                        }
                      }}
                      onClick={() => handlePortfolioClick(portfolio.id)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ mb: 1.5 }}>
                          {/* Portfolio Name and Permission Badge */}
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <ResponsiveTypography 
                              variant="subtitle1" 
                              gutterBottom={false}
                              onClick={(e) => handlePortfolioNameClick(portfolio.id, e)}
                              sx={{ 
                                fontSize: '1rem', 
                                fontWeight: 600,
                                cursor: (portfolio.userPermission?.isOwner || portfolio.userPermission?.canUpdate) ? 'pointer' : 'default',
                                '&:hover': {
                                  textDecoration: (portfolio.userPermission?.isOwner || portfolio.userPermission?.canUpdate) ? 'underline' : 'none',
                                  color: (portfolio.userPermission?.isOwner || portfolio.userPermission?.canUpdate) ? 'primary.main' : 'inherit'
                                }
                              }}
                            >
                              {portfolio.name}
                            </ResponsiveTypography>
                            
                            {/* Permission Badge */}
                            {portfolio.userPermission && !currentAccount?.isInvestor && (
                              <PermissionBadge 
                                permission={portfolio.userPermission} 
                                size="small"
                                showIcon={true}
                              />
                            )}
                          </Box>

                          {/* Owner Information */}
                          {portfolio.owner && (
                            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {t('investorView.owner', 'Chủ sở hữu')}:
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                {portfolio.owner.name}
                              </ResponsiveTypography>
                            </Box>
                          )}

                          {/* Action Chip */}
                          <Chip 
                            label={t('investorView.clickToView', 'Nhấn để xem chi tiết')}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Summary Cards */}
                        <Grid container spacing={1.5} sx={{ mb: 1 }}>
                          <Grid item xs={6}>
                            <Paper sx={{ 
                              p: 1, 
                              textAlign: 'center', 
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(59, 130, 246, 0.06) 100%)',
                              border: '1px solid rgba(59, 130, 246, 0.1)',
                              borderRadius: 2,
                              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(59, 130, 246, 0.15)',
                              }
                            }}>
                              <ResponsiveTypography variant="cardValue" color="primary.main" 
                              sx={{ fontSize: '0.9rem', fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(portfolio.totalValue)}
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="labelXSmall"
                              sx={{ fontWeight: 500, 
                                color: 'text.primary'
                               }}>
                                {t('investorView.totalValue', 'Tổng giá trị')}
                              </ResponsiveTypography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ 
                              p: 1, 
                              textAlign: 'center', 
                              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03) 0%, rgba(34, 197, 94, 0.06) 100%)',
                              border: '1px solid rgba(34, 197, 94, 0.1)',
                              borderRadius: 2,
                              boxShadow: '0 2px 4px rgba(34, 197, 94, 0.1)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(34, 197, 94, 0.15)',
                              }
                            }}>
                              <ResponsiveTypography variant="cardValue" color="success.main" sx={{ fontSize: '0.9rem', fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(portfolio.cashBalance)}
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="labelXSmall"
                              sx={{ fontWeight: 500, 
                                color: 'text.primary'
                               }}>
                                {t('investorView.cash', 'Tiền mặt')}
                              </ResponsiveTypography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sx={{ mt: 1 }}>
                            <Paper sx={{ 
                              p: 1, 
                              textAlign: 'center', 
                              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, rgba(6, 182, 212, 0.06) 100%)',
                              border: '1px solid rgba(6, 182, 212, 0.1)',
                              borderRadius: 2,
                              boxShadow: '0 2px 4px rgba(6, 182, 212, 0.1)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(6, 182, 212, 0.15)',
                              }
                            }}>
                              <ResponsiveTypography variant="cardValue" color="info.main" sx={{ fontSize: '0.9rem', fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(portfolio.assetValue)}
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="labelXSmall"
                              sx={{ fontWeight: 500, 
                                color: 'text.primary'
                               }}>
                                {t('investorView.investments', 'Tiền đầu tư')}
                              </ResponsiveTypography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sx={{ mt: 1 }}>
                            <Paper sx={{ 
                              p: 1, 
                              textAlign: 'center', 
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(245, 158, 11, 0.06) 100%)',
                              border: '1px solid rgba(245, 158, 11, 0.1)',
                              borderRadius: 2,
                              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(245, 158, 11, 0.15)',
                              }
                            }}>
                              <ResponsiveTypography variant="cardValue" color="warning.main" sx={{ fontSize: '0.9rem', fontWeight: 700, mb: 0.5 }}>
                                {formatCurrency(portfolio.depositsValue)}
                              </ResponsiveTypography>
                                <ResponsiveTypography variant="labelXSmall"
                              sx={{ fontWeight: 500, 
                                color: 'text.primary'
                               }}>
                                {t('investorView.deposits', 'Tiền gửi')}
                              </ResponsiveTypography>
                            </Paper>
                          </Grid>
                        </Grid>

                        {/* Performance Metrics */}
                        {portfolio.performance && (
                          <Box sx={{ mt: 1.5 }}>
                            <ResponsiveTypography variant="caption" gutterBottom sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {t('investorView.performance', 'Hiệu suất')}
                            </ResponsiveTypography>
                            <Grid container spacing={0.5}>
                              <Grid item xs={4}>
                                <Box textAlign="center">
                                  <ResponsiveTypography 
                                    variant="caption" 
                                    color={getPerformanceColor(portfolio.performance.dailyGrowth)}
                                    fontWeight="bold"
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    {formatPercentageValue(portfolio.performance.dailyGrowth, 2)}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem!important', display: 'block' }}>
                                    {portfolio.lastUpdated && formatDate(portfolio.lastUpdated) !== formatDate(new Date()) 
                                    ? formatDate(portfolio.lastUpdated, 'dd/MM/yyyy') 
                                    : t('investorView.daily', 'Hôm nay')
                                    }
                                  </ResponsiveTypography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box textAlign="center">
                                  <ResponsiveTypography 
                                    variant="caption" 
                                    color={getPerformanceColor(portfolio.performance.monthlyGrowth)}
                                    fontWeight="bold"
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    {formatPercentageValue(portfolio.performance.monthlyGrowth, 2)}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem!important', display: 'block' }}>
                                    {t('investorView.monthly', 'Tháng này')}
                                  </ResponsiveTypography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box textAlign="center">
                                  <ResponsiveTypography 
                                    variant="caption" 
                                    color={getPerformanceColor(portfolio.performance.ytdGrowth)}
                                    fontWeight="bold"
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    {formatPercentageValue(portfolio.performance.ytdGrowth, 2)}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography variant="caption" color="text.secondary" 
                                  sx={{ fontSize: '0.75rem!important', display: 'block' }}
                                  ellipsis={false}>
                                    {t('investorView.ytd', 'Từ đầu năm (TWR)')}
                                  </ResponsiveTypography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        )}

                        {/* <ResponsiveTypography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontSize: '0.5rem' }}>
                          {t('investorView.lastUpdated', 'Cập nhật lần cuối')}: {formatDate(portfolio.lastUpdated, 'short')}
                        </ResponsiveTypography> */}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
          )}

          {/* Detailed Report Section - Compact Navigation */}
          {selectedPortfolio && (
            <Box sx={{ mt: 0 }}>
              {/* Compact Navigation Bar */}
              <Box sx={{ 
                mb: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 0 },
                p: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: theme.palette.primary.main,
                      animation: 'pulse 2s infinite'
                    }} 
                  />
                  <ResponsiveTypography 
                    variant="body1" 
                    fontWeight="600" 
                    color="primary.main"
                    onClick={(e) => handlePortfolioNameClick(selectedPortfolio!, e)}
                    sx={{
                      cursor: (() => {
                        const portfolio = portfolios.find(p => p.id === selectedPortfolio);
                        return (portfolio?.userPermission?.isOwner || portfolio?.userPermission?.canUpdate) ? 'pointer' : 'default';
                      })(),
                      '&:hover': {
                        textDecoration: (() => {
                          const portfolio = portfolios.find(p => p.id === selectedPortfolio);
                          return (portfolio?.userPermission?.isOwner || portfolio?.userPermission?.canUpdate) ? 'underline' : 'none';
                        })()
                      }
                    }}
                  >
                    {portfolios.find(p => p.id === selectedPortfolio)?.name}
                  </ResponsiveTypography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  alignItems: 'center'
                }}>
                  {/* Navigation buttons */}
                  {portfolios.length > 1 && (
                    <>
                      <Chip
                        label={`← ${t('investorView.previous', 'Trước')}`}
                        onClick={() => {
                          const currentIndex = portfolios.findIndex(p => p.id === selectedPortfolio);
                          const prevIndex = currentIndex > 0 ? currentIndex - 1 : portfolios.length - 1;
                          setSelectedPortfolio(portfolios[prevIndex].id);
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      />
                      <Chip
                        label={`${t('investorView.next', 'Tiếp')} →`}
                        onClick={() => {
                          const currentIndex = portfolios.findIndex(p => p.id === selectedPortfolio);
                          const nextIndex = currentIndex < portfolios.length - 1 ? currentIndex + 1 : 0;
                          setSelectedPortfolio(portfolios[nextIndex].id);
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.1)
                          }
                        }}
                      />
                    </>
                  )}
                  <Chip
                    label={t('investorView.close', 'Đóng')}
                    onClick={handleBackToList}
                    color="primary"
                    size="small"
                    sx={{ 
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>
              
              <InvestorReportWrapper 
                portfolioId={selectedPortfolio}
                accountId={currentAccount?.accountId || ''}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default InvestorView;
