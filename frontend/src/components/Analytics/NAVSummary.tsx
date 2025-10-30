import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import { applyBorderStyle, applyBorderHover } from '../../utils/borderUtils';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import {
  TrendingUp,
  InfoOutlined,
  AccountBalance
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';

interface GrowthData {
  dailyGrowth: number;
  dailyGrowthValue: number;
  ytdGrowth: number;
  ytdGrowthValue: number;
  isDailyGrowing: boolean;
  isYtdGrowing: boolean;
  navPerUnitDailyGrowth: number;
  navPerUnitYtdGrowth: number;
  navPerUnitDailyGrowthValue: number;
  navPerUnitYtdGrowthValue: number;
  isNavPerUnitDailyGrowing: boolean;
  isNavPerUnitYtdGrowing: boolean;
}

interface NAVHistoryData {
  date: string;
  navValue: number;
  totalValue: number;
  cashBalance: number;
  assetValue: number;
  totalReturn: number;
  portfolioPnL: number;
  portfolioDailyReturn: number;
  portfolioWeeklyReturn: number;
  portfolioMonthlyReturn: number;
  portfolioYtdReturn: number;
  isFund: boolean;
  totalOutstandingUnits: number;
  navPerUnit: number;
  growth: GrowthData;
}

interface NAVSummaryProps {
  navValue: number;
  totalValue: number;
  baseCurrency: string;
  isFund?: boolean;
  totalOutstandingUnits?: number;
  navPerUnit?: number;
  isCompactMode?: boolean;
  getUltraSpacing?: (normal: number, compact: number) => number;
  portfolioId?: string;
}

const NAVSummary: React.FC<NAVSummaryProps> = ({
  navValue,
  baseCurrency,
  isFund = false,
  totalOutstandingUnits = 1,
  navPerUnit: propNavPerUnit,
  isCompactMode = false,
  getUltraSpacing = (normal) => normal,
  portfolioId
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  // State for NAV history data
  const [, setNavHistoryData] = useState<NAVHistoryData[]>([]);
  const [portfolioInfo, setPortfolioInfo] = useState<{
    isFund: boolean;
    totalOutstandingUnits: number;
    name: string;
    baseCurrency: string;
  } | null>(null);
  const [summaryData, setSummaryData] = useState<{
    navValue: number;
    navPerUnit: number;
    growth: GrowthData;
  } | null>(null);

  // Calculate NAV per unit
  const navPerUnit = propNavPerUnit || (totalOutstandingUnits > 0 ? navValue / totalOutstandingUnits : navValue);
  
  // Calculate growth/decline indicators
  const isGrowing = navValue > 0;
  const growthIndicator = isGrowing ? t('navSummary.growth') : t('navSummary.decline');
  const growthColor = isGrowing ? 'success' : 'error';
  // const GrowthIcon = isGrowing ? TrendingUp : TrendingDown;

  // Fetch NAV history data
  useEffect(() => {
    const fetchNAVHistory = async () => {
      if (!portfolioId || !accountId) return;

      try {
        const result = await apiService.getPortfolioNAVHistory(portfolioId, accountId, { months: 1, granularity: 'DAILY' });
        setNavHistoryData(result.data || []);
        setPortfolioInfo(result.portfolio || null);
        setSummaryData(result.summary || null);
      } catch (error) {
        console.error('Error fetching NAV history:', error);
      }
    };

    fetchNAVHistory();
  }, [portfolioId, accountId]);

  // Use data from API (no calculations needed)
  const actualIsFund = portfolioInfo?.isFund || isFund;
  const growthData = summaryData?.growth;
  const actualTotalOutstandingUnits = portfolioInfo?.totalOutstandingUnits || 0;
  
  // Extract growth metrics from API data
  const navPerUnitPeriodGrowth = growthData?.dailyGrowth || 0;
  const navPerUnitPeriodGrowthValue = growthData?.dailyGrowthValue || 0;
  const navPerUnitTotalGrowth = growthData?.ytdGrowth || 0;
  const navPerUnitTotalGrowthValue = growthData?.ytdGrowthValue || 0;
  const isNavPerUnitPeriodGrowing = growthData?.isDailyGrowing || false;
  const isNavPerUnitTotalGrowing = growthData?.isYtdGrowing || false;
  
  // For funds, use NAV per unit specific growth metrics
  const fundNavPerUnitPeriodGrowth = growthData?.navPerUnitDailyGrowth || 0;
  const fundNavPerUnitPeriodGrowthValue = (growthData?.navPerUnitDailyGrowthValue || 0) * (actualTotalOutstandingUnits || 0) || 0;
  const fundNavPerUnitTotalGrowth = growthData?.navPerUnitYtdGrowth || 0;
  const fundNavPerUnitTotalGrowthValue = (growthData?.navPerUnitYtdGrowthValue || 0) * (actualTotalOutstandingUnits || 0) || 0;
  const isFundNavPerUnitPeriodGrowing = growthData?.isNavPerUnitDailyGrowing || false;
  const isFundNavPerUnitTotalGrowing = growthData?.isNavPerUnitYtdGrowing || false;

  return (
    <Card sx={{ 
      mb: getUltraSpacing(3, 1),
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      ...applyBorderHover('card', {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-2px)'
        }
      })
    }}>
      <CardContent sx={{ p: { xs: 0.5, sm: 1, md: getUltraSpacing(1, 1.5) } }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: getUltraSpacing(3, 1.5),
          pb: getUltraSpacing(2, 1),
          borderBottom: '2px solid #f1f3f4'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isCompactMode ? 1 : 1.5 }}>
            <Box sx={{
              p: { xs: 0.5, sm: isCompactMode ? 1 : 1.5 },
              backgroundColor: 'primary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AccountBalance sx={{ fontSize: isCompactMode ? 18 : 20, color: 'white' }} />
            </Box>
            <Box>
              <ResponsiveTypography variant="pageTitle" sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                mb: isCompactMode ? 0.25 : 0.5
              }}>
                {t('navSummary.title')}
              </ResponsiveTypography>
              {!isCompactMode && (
                <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
                  {t('navSummary.subtitle')}
                </ResponsiveTypography>
              )}
            </Box>
          </Box>
          
        </Box>

        {/* NAV Information Grid */}
        <Grid container spacing={getUltraSpacing(2, 1)}>
          {/* NAV Total */}
          <Grid item xs={12} sm={actualIsFund ? 6 : 12} md={actualIsFund ? 4 : 6}>
            <Box sx={{
              p: getUltraSpacing(2.5, 1.5),
              backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              ...applyBorderStyle('section', {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: isCompactMode ? '3px' : '4px',
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                }
              })
            }}>
              <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: isCompactMode ? 0.5 : 1,
                color: '#6c757d'
              }}>
                {t('navSummary.navTotal')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValueLarge" sx={{ 
                fontWeight: 800,
                color: 'primary.main',
                mt: isCompactMode ? 0.5 : 1,
                mb: isCompactMode ? 0.25 : 0.5
              }}>
                {formatCurrency(navValue, baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                fontWeight: 500,
                backgroundColor: growthColor === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                color: growthColor === 'success' ? '#4caf50' : '#f44336',
                px: isCompactMode ? 1 : 1.5,
                py: isCompactMode ? 0.25 : 0.5,
                borderRadius: 1,
                display: 'inline-block'
              }}>
                {growthIndicator}
              </ResponsiveTypography>
            </Box>
          </Grid>

          {/* NAV Growth (for regular portfolios) */}
          {!actualIsFund && (
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: getUltraSpacing(2, 1.5),
                backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                ...applyBorderStyle('section', {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: isCompactMode ? '3px' : '4px',
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                  }
                })
              }}>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: isCompactMode ? 0.5 : 1,
                  color: '#6c757d',
                  mb: isCompactMode ? 0.75 : 1,
                  display: 'block'
                }}>
                  {t('navSummary.navGrowth')}
                </ResponsiveTypography>

                {/* Horizontal Layout for Growth Metrics */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: isCompactMode ? 0.75 : 2
                }}>
                  {/* Period Growth */}
                  <Box sx={{ 
                    flex: 1,
                    textAlign: 'center',
                    p: 0.5,
                    backgroundColor: isNavPerUnitPeriodGrowing 
                      ? 'rgba(76, 175, 80, 0.05)' 
                      : navPerUnitPeriodGrowth < 0 
                        ? 'rgba(244, 67, 54, 0.05)'
                        : 'rgba(158, 158, 158, 0.05)',
                    borderRadius: 1
                  }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {t('navSummary.recent')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ 
                      fontWeight: 700,
                      color: isNavPerUnitPeriodGrowing ? '#4caf50' : navPerUnitPeriodGrowth < 0 ? '#f44336' : '#9e9e9e',
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {navPerUnitPeriodGrowth > 0 ? '+' : ''}{navPerUnitPeriodGrowth.toFixed(2)}%
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      color: isNavPerUnitPeriodGrowing ? '#4caf50' : navPerUnitPeriodGrowth < 0 ? '#f44336' : '#9e9e9e'
                    }}>
                      {formatCurrency(navPerUnitPeriodGrowthValue, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>

                  {/* Divider */}
                  <Box sx={{ 
                    width: '1px', 
                    height: isCompactMode ? 30 : 35,
                    backgroundColor: '#e0e0e0'
                  }} />

                  {/* Total Growth */}
                  <Box sx={{ 
                    flex: 1,
                    textAlign: 'center',
                    p: 0.5,
                    backgroundColor: isNavPerUnitTotalGrowing 
                      ? 'rgba(76, 175, 80, 0.05)' 
                      : navPerUnitTotalGrowth < 0 
                        ? 'rgba(244, 67, 54, 0.05)'
                        : 'rgba(158, 158, 158, 0.05)',
                    borderRadius: 1
                  }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {t('navSummary.fromStart')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ 
                      fontWeight: 700,
                      color: isNavPerUnitTotalGrowing ? '#4caf50' : navPerUnitTotalGrowth < 0 ? '#f44336' : '#9e9e9e',
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {navPerUnitTotalGrowth > 0 ? '+' : ''}{navPerUnitTotalGrowth.toFixed(2)}%
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      color: isNavPerUnitTotalGrowing ? '#4caf50' : navPerUnitTotalGrowth < 0 ? '#f44336' : '#9e9e9e'
                    }}>
                      {formatCurrency(navPerUnitTotalGrowthValue, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Box>
                
                {/* Growth Icon */}
                <Box sx={{ 
                  position: 'absolute',
                  top: isCompactMode ? 8 : 12,
                  right: isCompactMode ? 8 : 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isCompactMode ? 24 : 32,
                  height: isCompactMode ? 24 : 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }}>
                  <TrendingUp sx={{ 
                    fontSize: isCompactMode ? 14 : 16, 
                    color: '#1976d2' 
                  }} />
                </Box>
              </Box>
            </Grid>
          )}

          {/* NAV per Unit (only for funds) */}
          {actualIsFund && (
            <Grid item xs={12} sm={6} md={4}>
            <Box sx={{
              p: getUltraSpacing(2.5, 1.5),
              backgroundColor: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              ...applyBorderStyle('card', {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: isCompactMode ? '3px' : '4px',
                  background: 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
                }
              })
            }}>
              <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: isCompactMode ? 0.5 : 1,
                color: '#6c757d'
              }}>
                {t('navSummary.navPerUnit')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValueLarge" sx={{ 
                fontWeight: 800,
                color: '#ff9800',
                mt: isCompactMode ? 0.5 : 1,
                mb: isCompactMode ? 0.25 : 0.5
              }}>
                {formatCurrency(summaryData?.navPerUnit || navPerUnit, baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                fontWeight: 500,
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                color: '#ff9800',
                px: isCompactMode ? 1 : 1.5,
                py: isCompactMode ? 0.25 : 0.5,
                borderRadius: 1,
                display: 'inline-block'
              }}>
                {t('navSummary.investorBenefit')}
              </ResponsiveTypography>
              
              {/* Info Tooltip for NAV/Unit */}
              <Tooltip 
                title={t('navSummary.navPerUnitTooltip')}
                arrow
                placement="top"
              >
                <IconButton 
                  size="small" 
                  sx={{ 
                    position: 'absolute',
                    top: isCompactMode ? 4 : 8,
                    right: isCompactMode ? 4 : 8,
                    p: 0.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)'
                    }
                  }}
                >
                  <InfoOutlined sx={{ fontSize: isCompactMode ? 12 : 14, color: '#ff9800' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          )}

          {/* NAV/Unit Growth (only for funds with real data) */}
          {actualIsFund && summaryData && (
            <Grid item xs={12} md={4}>
              <Box sx={{
                p: getUltraSpacing(2, 1.5),
                backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                ...applyBorderStyle('section', {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: isCompactMode ? '3px' : '4px',
                    background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                  }
                })
              }}>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: isCompactMode ? 0.5 : 1,
                  color: '#6c757d',
                  mb: isCompactMode ? 0.75 : 1,
                  display: 'block'
                }}>
                  {t('navSummary.navPerUnitGrowth')}
                </ResponsiveTypography>

                {/* Horizontal Layout for Growth Metrics */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: isCompactMode ? 0.75 : 2
                }}>
                  {/* Period Growth (2 points) */}
                  <Box sx={{ 
                    flex: 1,
                    textAlign: 'center',
                    p: 0.5, // 4px padding for consistent height
                    backgroundColor: isFundNavPerUnitPeriodGrowing 
                      ? 'rgba(76, 175, 80, 0.05)' 
                      : fundNavPerUnitPeriodGrowth < 0 
                        ? 'rgba(244, 67, 54, 0.05)'
                        : 'rgba(158, 158, 158, 0.05)',
                    borderRadius: 1
                  }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {t('navSummary.recent')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ 
                      fontWeight: 700,
                      color: isFundNavPerUnitPeriodGrowing ? '#4caf50' : fundNavPerUnitPeriodGrowth < 0 ? '#f44336' : '#9e9e9e',
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {fundNavPerUnitPeriodGrowth > 0 ? '+' : ''}{fundNavPerUnitPeriodGrowth.toFixed(2)}%
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      color: isFundNavPerUnitPeriodGrowing ? '#4caf50' : fundNavPerUnitPeriodGrowth < 0 ? '#f44336' : '#9e9e9e'
                    }}>
                      {formatCurrency(fundNavPerUnitPeriodGrowthValue, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>

                  {/* Divider */}
                  <Box sx={{ 
                    width: '1px', 
                    height: isCompactMode ? 30 : 35,
                    backgroundColor: '#e0e0e0'
                  }} />

                  {/* Total Growth (from beginning) */}
                  <Box sx={{ 
                    flex: 1,
                    textAlign: 'center',
                    p: 0.5, // 4px padding for consistent height
                    backgroundColor: isFundNavPerUnitTotalGrowing 
                      ? 'rgba(76, 175, 80, 0.05)' 
                      : fundNavPerUnitTotalGrowth < 0 
                        ? 'rgba(244, 67, 54, 0.05)'
                        : 'rgba(158, 158, 158, 0.05)',
                    borderRadius: 1
                  }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {t('navSummary.fromStart')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" sx={{ 
                      fontWeight: 700,
                      color: isFundNavPerUnitTotalGrowing ? '#4caf50' : fundNavPerUnitTotalGrowth < 0 ? '#f44336' : '#9e9e9e',
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {fundNavPerUnitTotalGrowth > 0 ? '+' : ''}{fundNavPerUnitTotalGrowth.toFixed(2)}%
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
                      fontWeight: 500,
                      color: isFundNavPerUnitTotalGrowing ? '#4caf50' : fundNavPerUnitTotalGrowth < 0 ? '#f44336' : '#9e9e9e'
                    }}>
                      {formatCurrency(fundNavPerUnitTotalGrowthValue, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Box>
                
                {/* Growth Icon */}
                {/* <Box sx={{ 
                  position: 'absolute',
                  top: isCompactMode ? 8 : 12,
                  right: isCompactMode ? 8 : 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isCompactMode ? 24 : 32,
                  height: isCompactMode ? 24 : 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(25, 118, 210, 0.1)'
                }}>
                  <TrendingUp sx={{ 
                    fontSize: isCompactMode ? 14 : 16, 
                    color: '#1976d2' 
                  }} />
                </Box> */}
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Additional Information */}
        <Box sx={{ 
          mt: getUltraSpacing(2, 1.5),
          p: getUltraSpacing(2, 1.5),
          //backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          position: 'relative',
          overflow: 'hidden',
          
        }}>
          <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ 
            display: 'block',
            textAlign: 'center',
            fontWeight: 500,
            lineHeight: isCompactMode ? 1.4 : 1.6
          }}>
            {t('navSummary.infoNote')}
          </ResponsiveTypography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NAVSummary;
