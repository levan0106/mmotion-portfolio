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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPercentageValue } from '../utils/format';
import { apiService } from '../services/api';
import InvestorReportWrapper from '../components/Reports/InvestorReportWrapper';
import { useAccount } from '../contexts/AccountContext';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import PermissionBadge from '../components/Common/PermissionBadge';
import { PortfolioPermissionType } from '../types';

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

  const getPerformanceColor = (value: number) => {
    if (value > 0) return theme.palette.success.main;
    if (value < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
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
              {t('investorView.title', 'Góc nhìn nhà đầu tư')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle">
              {t('investorView.subtitle', 'Tổng quan tất cả danh mục đầu tư của bạn')}
            </ResponsiveTypography>
          </Box>
        </Box>
      </Box>
      {portfolios.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ResponsiveTypography variant="cardTitle" color="text.secondary">
            {t('investorView.noPortfolios', 'Chưa có danh mục đầu tư nào')}
          </ResponsiveTypography>
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
                            sx={{ 
                              fontSize: '0.85rem', 
                              fontWeight: 500,
                              color: selectedPortfolio === portfolio.id ? 'primary.main' : 'text.primary'
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
                              {formatPercentageValue(portfolio.performance.ytdGrowth)}
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
                  <Grid item xs={12} sm={6} md={4} lg={3} key={portfolio.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        border: '1px solid',
                        borderColor: theme.palette.grey[300],
                        m: 0.5, // Add margin between full grid cards
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 8px rgba(0,0,0,0.15), 0 0 0 1px ${theme.palette.primary.main}`,
                          borderColor: theme.palette.primary.main,
                        }
                      }}
                      onClick={() => handlePortfolioClick(portfolio.id)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ mb: 1.5 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <ResponsiveTypography 
                              variant="subtitle1" 
                              gutterBottom={false}
                              sx={{ fontSize: '1rem', fontWeight: 600 }}
                            >
                              {portfolio.name}
                            </ResponsiveTypography>
                            {portfolio.userPermission && !currentAccount?.isInvestor && (
                              <PermissionBadge 
                                permission={portfolio.userPermission} 
                                size="small"
                                showIcon={true}
                              />
                            )}
                          </Box>
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
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, textAlign: 'center', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                              <ResponsiveTypography variant="cardValue" color="primary.main" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                {formatCurrency(portfolio.totalValue)}
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {t('investorView.totalValue', 'Tổng giá trị')}
                              </ResponsiveTypography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Paper sx={{ p: 1, textAlign: 'center', backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
                              <ResponsiveTypography variant="cardValue" color="success.main" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                {formatCurrency(portfolio.cashBalance)}
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {t('investorView.cash', 'Tiền mặt')}
                              </ResponsiveTypography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sx={{ mb: 1 }}>
                            <Paper sx={{ p: 1, textAlign: 'center', backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
                              <ResponsiveTypography variant="cardValue" color="info.main" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                {formatCurrency(portfolio.assetValue)}
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {t('investorView.investments', 'Tiền đầu tư')}
                              </ResponsiveTypography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} sx={{ mb: 1 }}>
                            <Paper sx={{ p: 1, textAlign: 'center', backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                              <ResponsiveTypography variant="cardValue" color="warning.main" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                                {formatCurrency(portfolio.depositsValue)}
                              </ResponsiveTypography>
                              <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
                                    {formatPercentageValue(portfolio.performance.dailyGrowth)}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                    {t('investorView.daily', 'Hôm nay')}
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
                                    {formatPercentageValue(portfolio.performance.monthlyGrowth)}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
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
                                    {formatPercentageValue(portfolio.performance.ytdGrowth)}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
                                    {t('investorView.ytd', 'Từ đầu năm')}
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
            <Box sx={{ mt: 3 }}>
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
                  <ResponsiveTypography variant="body1" fontWeight="600" color="primary.main">
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
