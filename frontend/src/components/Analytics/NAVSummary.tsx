import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  InfoOutlined,
  AccountBalance
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';

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
  // State for NAV history data
  const [navHistoryData, setNavHistoryData] = useState<NAVHistoryData[]>([]);

  // Calculate NAV per unit
  const navPerUnit = propNavPerUnit || (totalOutstandingUnits > 0 ? navValue / totalOutstandingUnits : navValue);
  
  // Calculate growth/decline indicators
  const isGrowing = navValue > 0;
  const growthIndicator = isGrowing ? 'Tăng trưởng' : 'Suy giảm';
  const growthColor = isGrowing ? 'success' : 'error';
  const GrowthIcon = isGrowing ? TrendingUp : TrendingDown;

  // Fetch NAV history data
  useEffect(() => {
    const fetchNAVHistory = async () => {
      if (!portfolioId || !isFund) return;

      try {
        const response = await fetch(
          `/api/v1/portfolios/${portfolioId}/nav/history?months=1&granularity=DAILY`
        );

        if (response.ok) {
          const result = await response.json();
          setNavHistoryData(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching NAV history:', error);
      }
    };

    fetchNAVHistory();
  }, [portfolioId, isFund]);

  // Calculate NAV/Unit growth from real data
  const calculateNAVPerUnitGrowth = () => {
    if (navHistoryData.length < 2) return { 
      periodGrowth: 0, 
      periodGrowthValue: 0, 
      totalGrowth: 0, 
      totalGrowthValue: 0, 
      isPeriodGrowing: false,
      isTotalGrowing: false
    };

    // Get the most recent NAV data
    const currentData = navHistoryData[navHistoryData.length - 1];

    // Use backend-calculated return fields for accurate growth calculations
    // portfolioDailyReturn: Daily return percentage (for period growth)
    // portfolioYtdReturn: Year-to-date return percentage (for total growth)
    const periodGrowth = currentData.portfolioDailyReturn || 0;
    const periodGrowthValue = currentData.navValue * (periodGrowth / 100);
    const isPeriodGrowing = periodGrowth > 0;

    // Use YTD return for total growth (from beginning of year)
    const totalGrowth = currentData.portfolioYtdReturn || 0;
    const totalGrowthValue = currentData.navValue * (totalGrowth / 100);
    const isTotalGrowing = totalGrowth > 0;

    return { 
      periodGrowth, 
      periodGrowthValue, 
      totalGrowth, 
      totalGrowthValue, 
      isPeriodGrowing,
      isTotalGrowing
    };
  };

  const { 
    periodGrowth: navPerUnitPeriodGrowth, 
    periodGrowthValue: navPerUnitPeriodGrowthValue, 
    totalGrowth: navPerUnitTotalGrowth, 
    totalGrowthValue: navPerUnitTotalGrowthValue, 
    isPeriodGrowing: isNavPerUnitPeriodGrowing,
    isTotalGrowing: isNavPerUnitTotalGrowing
  } = calculateNAVPerUnitGrowth();

  return (
    <Card sx={{ 
      mb: getUltraSpacing(3, 1),
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      border: '1px solid #e9ecef',
      borderRadius: 3,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
        transform: 'translateY(-2px)'
      }
    }}>
      <CardContent sx={{ p: getUltraSpacing(3, 1.5) }}>
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
              p: isCompactMode ? 1 : 1.5,
              backgroundColor: 'primary.main',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AccountBalance sx={{ fontSize: isCompactMode ? 24 : 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                color: 'text.primary',
                fontSize: isCompactMode ? '1rem' : '1.4rem',
                mb: isCompactMode ? 0.25 : 0.5
              }}>
                NAV Summary
              </Typography>
              {!isCompactMode && (
                <Typography variant="body2" color="text.secondary" sx={{
                  fontSize: '0.85rem'
                }}>
                  Net Asset Value Overview
                </Typography>
              )}
            </Box>
          </Box>
          
          <Chip
            icon={<GrowthIcon />}
            label={growthIndicator}
            color={growthColor}
            size={isCompactMode ? "small" : "medium"}
            sx={{ 
              fontWeight: 600,
              fontSize: isCompactMode ? '0.7rem' : '0.8rem',
              px: isCompactMode ? 1.5 : 2,
              py: isCompactMode ? 0.5 : 1,
              height: 'auto'
            }}
          />
        </Box>

        {/* NAV Information Grid */}
        <Grid container spacing={getUltraSpacing(2, 1)}>
          {/* NAV Total */}
          <Grid item xs={12} md={isFund ? 4 : 12}>
            <Box sx={{
              p: getUltraSpacing(2.5, 1.5),
              backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRadius: 2.5,
              border: '2px solid #e3f2fd',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: isCompactMode ? '3px' : '4px',
                background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
              }
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.7rem' : '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: isCompactMode ? 0.5 : 1,
                color: '#6c757d'
              }}>
                NAV Tổng
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 800,
                color: 'primary.main',
                fontSize: isCompactMode ? '1.1rem' : '1.8rem',
                mt: isCompactMode ? 0.5 : 1,
                mb: isCompactMode ? 0.25 : 0.5
              }}>
                {formatCurrency(navValue, baseCurrency)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.65rem' : '0.8rem',
                fontWeight: 500,
                backgroundColor: growthColor === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                color: growthColor === 'success' ? '#4caf50' : '#f44336',
                px: isCompactMode ? 1 : 1.5,
                py: isCompactMode ? 0.25 : 0.5,
                borderRadius: 1,
                display: 'inline-block'
              }}>
                {growthIndicator}
              </Typography>
            </Box>
          </Grid>

          {/* NAV per Unit (only for funds) */}
          {isFund && (
            <Grid item xs={12} md={4}>
            <Box sx={{
              p: getUltraSpacing(2.5, 1.5),
              backgroundColor: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
              borderRadius: 2.5,
              border: '2px solid #ffcc02',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: isCompactMode ? '3px' : '4px',
                background: 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
              }
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.7rem' : '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: isCompactMode ? 0.5 : 1,
                color: '#6c757d'
              }}>
                NAV/Unit
              </Typography>
              <Typography variant="h4" sx={{ 
                fontWeight: 800,
                color: '#ff9800',
                fontSize: isCompactMode ? '1.1rem' : '1.8rem',
                mt: isCompactMode ? 0.5 : 1,
                mb: isCompactMode ? 0.25 : 0.5
              }}>
                {formatCurrency(navPerUnit, baseCurrency)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                fontSize: isCompactMode ? '0.65rem' : '0.8rem',
                fontWeight: 500,
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                color: '#ff9800',
                px: isCompactMode ? 1 : 1.5,
                py: isCompactMode ? 0.25 : 0.5,
                borderRadius: 1,
                display: 'inline-block'
              }}>
                Lợi ích mỗi NĐT
              </Typography>
              
              {/* Info Tooltip for NAV/Unit */}
              <Tooltip 
                title="NAV/Unit = NAV Tổng ÷ Số đơn vị quỹ đang lưu hành. Thể hiện lợi ích của mỗi nhà đầu tư."
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
                  <InfoOutlined sx={{ fontSize: isCompactMode ? 14 : 16, color: '#ff9800' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          )}

          {/* NAV/Unit Growth (only for funds with real data) */}
          {isFund && navHistoryData.length >= 2 && (
            <Grid item xs={12} md={4}>
              <Box sx={{
                p: getUltraSpacing(2, 1.5),
                backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                borderRadius: 2.5,
                border: '2px solid #e3f2fd',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: isCompactMode ? '3px' : '4px',
                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                }
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ 
                  fontSize: isCompactMode ? '0.7rem' : '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: isCompactMode ? 0.5 : 1,
                  color: '#6c757d',
                  mb: isCompactMode ? 0.75 : 1,
                  display: 'block'
                }}>
                  Tăng trưởng NAV/Unit
                </Typography>

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
                    backgroundColor: isNavPerUnitPeriodGrowing 
                      ? 'rgba(76, 175, 80, 0.05)' 
                      : navPerUnitPeriodGrowth < 0 
                        ? 'rgba(244, 67, 54, 0.05)'
                        : 'rgba(158, 158, 158, 0.05)',
                    borderRadius: 1
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: isCompactMode ? '0.65rem' : '0.7rem',
                      fontWeight: 500,
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      Gần nhất
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      color: isNavPerUnitPeriodGrowing ? '#4caf50' : navPerUnitPeriodGrowth < 0 ? '#f44336' : '#9e9e9e',
                      fontSize: isCompactMode ? '0.85rem' : '1rem',
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {navPerUnitPeriodGrowth > 0 ? '+' : ''}{navPerUnitPeriodGrowth.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      fontSize: isCompactMode ? '0.6rem' : '0.7rem',
                      fontWeight: 500,
                      color: isNavPerUnitPeriodGrowing ? '#4caf50' : navPerUnitPeriodGrowth < 0 ? '#f44336' : '#9e9e9e'
                    }}>
                      {formatCurrency(navPerUnitPeriodGrowthValue, baseCurrency)}
                    </Typography>
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
                    backgroundColor: isNavPerUnitTotalGrowing 
                      ? 'rgba(76, 175, 80, 0.05)' 
                      : navPerUnitTotalGrowth < 0 
                        ? 'rgba(244, 67, 54, 0.05)'
                        : 'rgba(158, 158, 158, 0.05)',
                    borderRadius: 1
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontSize: isCompactMode ? '0.65rem' : '0.7rem',
                      fontWeight: 500,
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      Từ đầu
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      color: isNavPerUnitTotalGrowing ? '#4caf50' : navPerUnitTotalGrowth < 0 ? '#f44336' : '#9e9e9e',
                      fontSize: isCompactMode ? '0.85rem' : '1rem',
                      mb: isCompactMode ? 0.25 : 0.5
                    }}>
                      {navPerUnitTotalGrowth > 0 ? '+' : ''}{navPerUnitTotalGrowth.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      fontSize: isCompactMode ? '0.6rem' : '0.7rem',
                      fontWeight: 500,
                      color: isNavPerUnitTotalGrowing ? '#4caf50' : navPerUnitTotalGrowth < 0 ? '#f44336' : '#9e9e9e'
                    }}>
                      {formatCurrency(navPerUnitTotalGrowthValue, baseCurrency)}
                    </Typography>
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
                    fontSize: isCompactMode ? 16 : 20, 
                    color: '#1976d2' 
                  }} />
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Additional Information */}
        <Box sx={{ 
          mt: getUltraSpacing(2, 1.5),
          p: getUltraSpacing(2, 1.5),
          backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: 2,
          border: '1px solid #dee2e6',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isCompactMode ? '1px' : '2px',
            background: 'linear-gradient(90deg, #6c757d 0%, #adb5bd 100%)'
          }
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: isCompactMode ? '0.7rem' : '0.85rem',
            display: 'block',
            textAlign: 'center',
            fontWeight: 500,
            lineHeight: isCompactMode ? 1.4 : 1.6
          }}>
            💡 <strong>NAV Tổng</strong> = Tiền mặt + Giá trị tài sản | <strong>NAV/Unit</strong> = NAV Tổng ÷ Số đơn vị quỹ
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NAVSummary;
