/**
 * Allocation Tab Component
 * Displays portfolio allocation analytics including asset allocation, performance, and risk analysis
 */

import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, CircularProgress, Card, CardContent } from '@mui/material';
import { AccountBalance, TrendingUp, TrendingDown } from '@mui/icons-material';
import { usePortfolioAnalytics } from '../../hooks/usePortfolios';
import { usePortfolioAllocationTimeline } from '../../hooks/usePortfolioAnalytics';
import { apiService } from '../../services/api';
import AssetAllocationChart from '../Analytics/AssetAllocationChart';
import UnrealizedPnLChart from '../Analytics/UnrealizedPnLChart';
import RiskReturnChart from '../Analytics/RiskReturnChart';
import AssetPerformanceChart from '../Analytics/AssetPerformanceChart';
import DiversificationHeatmap from '../Analytics/DiversificationHeatmap';
import AssetAllocationTimeline from '../Analytics/AssetAllocationTimeline';
import AssetDetailSummary from '../Analytics/AssetDetailSummary';
import { formatCurrency, formatNumber, formatNumberWithSeparators } from '../../utils/format';

interface AllocationTabProps {
  portfolioId: string;
  portfolio: any;
  isCompactMode: boolean;
  getUltraSpacing: (normal: number, ultra: number) => number;
}

const AllocationTab: React.FC<AllocationTabProps> = ({
  portfolioId,
  portfolio,
  isCompactMode,
  getUltraSpacing
}) => {
  // State for analytics data
  const [riskReturnData, setRiskReturnData] = useState<any>(null);
  const [isRiskReturnLoading, setIsRiskReturnLoading] = useState(false);
  const [riskReturnError, setRiskReturnError] = useState<string | null>(null);
  const [riskReturnPeriod, setRiskReturnPeriod] = useState<string>('1Y');
  
  const [diversificationData, setDiversificationData] = useState<any>(null);
  const [isDiversificationLoading, setIsDiversificationLoading] = useState(false);
  const [diversificationError, setDiversificationError] = useState<string | null>(null);
  
  const [assetDetailData, setAssetDetailData] = useState<any>(null);
  const [isAssetDetailLoading, setIsAssetDetailLoading] = useState(false);
  const [assetDetailError, setAssetDetailError] = useState<string | null>(null);
  
  const [assetPerformanceData, setAssetPerformanceData] = useState<any[]>([]);
  const [assetPerformanceLoading, setAssetPerformanceLoading] = useState(false);
  const [assetPerformanceError, setAssetPerformanceError] = useState<string | null>(null);

  // Allocation timeline data using new hook
  const [allocationTimelineGranularity, setAllocationTimelineGranularity] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const { 
    allocationData: allocationTimelineData, 
    loading: isAllocationTimelineLoading, 
    error: allocationTimelineError 
  } = usePortfolioAllocationTimeline(portfolioId, 12, allocationTimelineGranularity);

  // Analytics data from hook
  const {
    allocationData,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
  } = usePortfolioAnalytics(portfolioId);

  // Fetch asset performance data
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

  return (
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
                        {Object.entries(allocationData.allocation).map(([assetType, allocation]: [string, any]) => (
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
  );
};

export default AllocationTab;
