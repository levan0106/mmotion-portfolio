/**
 * Allocation Tab Component
 * Displays portfolio allocation analytics including asset allocation, performance, and risk analysis
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Grid, CircularProgress, Card, CardContent } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { applyBorderStyle, applyBorderHover } from '../../utils/borderUtils';
import { 
  AccountBalance, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { usePortfolioAnalytics, usePortfolioAssetPerformance } from '../../hooks/usePortfolios';
import { usePortfolioAllocationTimeline } from '../../hooks/usePortfolioAnalytics';
import { apiService } from '../../services/api';
import AssetAllocationChart from '../Analytics/AssetAllocationChart';
import UnrealizedPnLChart from '../Analytics/UnrealizedPnLChart';
import RiskReturnChart from '../Analytics/RiskReturnChart';
import DiversificationHeatmap from '../Analytics/DiversificationHeatmap';
import AssetAllocationTimeline from '../Analytics/AssetAllocationTimeline';
import AssetDetailSummary from '../Analytics/AssetDetailSummary';
import { formatCurrency, formatNumber, formatNumberWithSeparators } from '../../utils/format';
import { getAssetTypeColor } from '../../config/chartColors';

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
  const { t } = useTranslation();
  // State for analytics data
  const [riskReturnData, setRiskReturnData] = useState<any>(null);
  const [isRiskReturnLoading, setIsRiskReturnLoading] = useState(false);
  const [riskReturnError, setRiskReturnError] = useState<string | null>(null);
  const [riskReturnPeriod, setRiskReturnPeriod] = useState<string>('1M');
  
  const [diversificationData, setDiversificationData] = useState<any>(null);
  const [isDiversificationLoading, setIsDiversificationLoading] = useState(false);
  const [diversificationError, setDiversificationError] = useState<string | null>(null);
  
  const [assetDetailData, setAssetDetailData] = useState<any>(null);
  const [isAssetDetailLoading, setIsAssetDetailLoading] = useState(false);
  const [assetDetailError, setAssetDetailError] = useState<string | null>(null);
  

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

  // Asset performance data with real unrealized P&L
  const {
    performanceData,
    isLoading: isPerformanceLoading,
    error: performanceError,
  } = usePortfolioAssetPerformance(portfolioId);


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
      px: { xs: 0.5, sm: getUltraSpacing(2, 1) }
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
            ...applyBorderHover((portfolio.totalInvestValue || 0) >= 0 ? 'card' : 'alert', {
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease-in-out'
              }
            })
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
              opacity: 0.05
            }}>
              <AccountBalance sx={{ fontSize: 35, color: '#1976d2' }} />
            </Box>
            <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: getUltraSpacing(2, 1) }}>
                <ResponsiveTypography variant="cardTitle" sx={{ textAlign: 'center' }}>
                  {t('portfolio.totalInvestment')}
                </ResponsiveTypography>
              </Box>
              <ResponsiveTypography variant="cardValue" sx={{ mb: getUltraSpacing(1, 0.5) }}>
                {formatCurrency(portfolio.totalInvestValue || 0, portfolio.baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardLabel">
                {t('portfolio.assetsDepositsValue')}
              </ResponsiveTypography>
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
            ...applyBorderHover('card', {
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease-in-out'
              }
            })
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
              opacity: 0.05
            }}>
              {(portfolio.unrealizedInvestPnL || 0) >= 0 ? 
                <TrendingUp sx={{ fontSize: 35, color: '#4caf50' }} /> : 
                <TrendingDown sx={{ fontSize: 35, color: '#f44336' }} />
              }
            </Box>
            <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: getUltraSpacing(2, 1) }}>
                <ResponsiveTypography variant="cardTitle" sx={{ textAlign: 'center' }}>
                  {t('portfolio.unrealizedPL')}
                </ResponsiveTypography>
              </Box>
              <ResponsiveTypography variant="cardValue" sx={{ 
                mb: getUltraSpacing(1, 0.5),
                color: (portfolio.unrealizedInvestPnL || 0) >= 0 ? '#28a745' : '#dc3545'
              }}>
                {formatCurrency(portfolio.unrealizedInvestPnL || 0, portfolio.baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardLabel">
                {t('portfolio.currentUnrealizedPL')}
              </ResponsiveTypography>
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
            ...applyBorderHover('card', {
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease-in-out'
              }
            })
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
              opacity: 0.05
            }}>
              <AccountBalance sx={{ fontSize: 35, color: '#9c27b0' }} />
            </Box>
            <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: getUltraSpacing(2, 1) }}>
                
                <ResponsiveTypography variant="cardTitle" sx={{ textAlign: 'center' }}>
                  {t('portfolio.cashBalance')}
                </ResponsiveTypography>
              </Box>
              <ResponsiveTypography variant="cardValue" sx={{ mb: getUltraSpacing(1, 0.5) }}>
                {formatCurrency(portfolio.cashBalance, portfolio.baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardLabel">
                {t('portfolio.availableCash')}
              </ResponsiveTypography>
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
            ...applyBorderHover('card', {
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transition: 'all 0.3s ease-in-out'
              }
            })
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
              opacity: 0.05
            }}>
              <TrendingUp sx={{ fontSize: 35, color: '#4caf50' }} />
            </Box>
            <CardContent sx={{ p: getUltraSpacing(3, 1.5), position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: getUltraSpacing(2, 1) }}>
                
                <ResponsiveTypography variant="cardTitle" sx={{ textAlign: 'center' }}>
                  {t('portfolio.assetClasses')}
                </ResponsiveTypography>
              </Box>
              <ResponsiveTypography variant="cardValue" sx={{ mb: getUltraSpacing(1, 0.5) }}>
                {formatNumberWithSeparators(Object.keys(allocationData?.allocation || {}).length, 0)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardLabel">
                {t('portfolio.differentAssetTypes')}
              </ResponsiveTypography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Asset Allocation Section */}
      <ResponsiveTypography variant="pageTitle" sx={{ 
        mb: getUltraSpacing(3, 1),
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <PieChartIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        {t('portfolio.assetTypeAllocation')}
      </ResponsiveTypography>
      <Grid container spacing={getUltraSpacing(2, 1)} sx={{ 
        mb: getUltraSpacing(4, 2),
        '& .MuiGrid-item': {
          display: 'flex',
          flexDirection: 'column'
        }
      }}>
        {/* Asset Allocation Pie Chart - Column 1 */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            p: { xs: 0.5, sm: getUltraSpacing(1.5, 0.5) }, 
            backgroundColor: 'white', 
            boxShadow: 0,
            height: '100%', // Fill grid item height
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // Center the pie chart
            ...applyBorderStyle('chart')
          }}>
            <ResponsiveTypography variant="chartTitle" sx={{ 
              mb: getUltraSpacing(1, 0.5),
              textAlign: 'center'
            }}>
              {t('portfolio.assetAllocationPie')}
            </ResponsiveTypography>
            {isAnalyticsLoading ? (
              <Box display="flex" justifyContent="center" p={1}>
                <CircularProgress size={20} />
              </Box>
            ) : analyticsError ? (
              <ResponsiveTypography variant="errorText">{t('portfolio.failedToLoadAllocation')}</ResponsiveTypography>
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
            p: { xs: 0, sm: getUltraSpacing(1.5, 0.5) }, 
            backgroundColor: 'white', 
            boxShadow: 0,
            height: '100%', // Fill grid item height
            display: 'flex',
            flexDirection: 'column',
            ...applyBorderStyle('chart')
          }}>
            {isPerformanceLoading ? (
              <Box display="flex" justifyContent="center" p={1}>
                <CircularProgress size={20} />
              </Box>
            ) : performanceError ? (
              <ResponsiveTypography variant="errorText">{t('portfolio.failedToLoadPL')}</ResponsiveTypography>
            ) : (
              <UnrealizedPnLChart 
                data={performanceData?.data ? performanceData.data.map((item: any) => ({
                  assetType: item.assetType,
                  value: item.value,
                  performance: item.performance,
                  unrealizedPl: item.unrealizedPl, // Use actual unrealized P&L from API
                  positionCount: item.positionCount,
                  color: item.color
                })) : []} 
                baseCurrency={portfolio.baseCurrency} 
                compact={isCompactMode}
                colorScheme="default"
              />
            )}
          </Box>
        </Grid>

        {/* Allocation Summary - Column 3 */}
        <Grid item xs={12} md={4}>
          <Box sx={{ 
            p: { xs: 0.5, sm: getUltraSpacing(1.5, 0.5) }, 
            backgroundColor: 'white', 
            boxShadow: 0,
            height: '100%', // Fill grid item height
            minHeight: 250, // Minimum height, auto expand based on data
            display: 'flex',
            flexDirection: 'column',
            ...applyBorderStyle('chart')
          }}>
            <ResponsiveTypography variant="chartTitle" sx={{ 
              mb: getUltraSpacing(1, 0.5),
              textAlign: 'center'
            }}>
              {t('portfolio.allocationSummary')}
            </ResponsiveTypography>
            {allocationData && Object.keys(allocationData.allocation).length > 0 ? (
              <Box>
                        {Object.entries(allocationData.allocation).map(([assetType, allocation]: [string, any]) => (
                  <Box key={assetType} sx={{ mb: getUltraSpacing(1, 0.5) }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                        {assetType.toUpperCase()}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatNumber(allocation.percentage, 1)}%
                      </ResponsiveTypography>
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
                          backgroundColor: getAssetTypeColor(assetType),
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </Box>
                    <ResponsiveTypography variant="formHelper" sx={{ 
                      mt: 0.2, 
                      display: 'block'
                    }}>
                      {formatCurrency(allocation.value, portfolio.baseCurrency)}
                    </ResponsiveTypography>
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
                      <ResponsiveTypography variant="formHelper" sx={{ 
                        display: 'block',
                        mb: 0.5
                      }}>
                        {t('portfolio.totalAssetsValue')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" sx={{ 
                        color: 'primary.main',
                        fontWeight: 700
                      }}>
                        {formatCurrency(allocationData?.totalAssetsValue || 0, portfolio.baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    
                    {/* Total Deposits Value Column */}
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                      <ResponsiveTypography variant="formHelper" sx={{ 
                        display: 'block',
                        mb: 0.5
                      }}>
                        {t('portfolio.totalDepositsValue')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" sx={{ 
                        color: 'primary.main',
                        fontWeight: 700
                      }}>
                        {formatCurrency(allocationData?.totalDepositsValue || 0, portfolio.baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <ResponsiveTypography variant="formHelper" sx={{ textAlign: 'center', mt: 2 }}>
                {t('portfolio.noAllocationData')}
              </ResponsiveTypography>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Asset Detail Summary Section */}
      <ResponsiveTypography variant="pageTitle" sx={{ 
        mb: getUltraSpacing(3, 1),
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <AssignmentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        {t('portfolio.assetDetailSummary')}
      </ResponsiveTypography>
      <Box sx={{ 
        p: { xs: 0.5, sm: getUltraSpacing(2, 1) }, 
        backgroundColor: 'white', 
        //boxShadow: 1,
        mb: getUltraSpacing(4, 2),
        ...applyBorderStyle('section')
      }}>
        {isAssetDetailLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : assetDetailError ? (
          <ResponsiveTypography variant="errorText">{assetDetailError}</ResponsiveTypography>
        ) : (
          <AssetDetailSummary 
            data={assetDetailData?.data || []} 
            baseCurrency={portfolio.baseCurrency}
            title={t('portfolio.individualAssetHoldings')}
            compact={isCompactMode}
          />
        )}
      </Box>

      {/* Risk & Performance Analysis Section */}
      <ResponsiveTypography variant="pageTitle" sx={{ 
        mb: getUltraSpacing(3, 1),
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <AnalyticsIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        {t('portfolio.riskPerformanceAnalysis')}
      </ResponsiveTypography>
      <Grid container spacing={getUltraSpacing(2, 1)} sx={{ mb: getUltraSpacing(4, 2) }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: { xs: 0.5, sm: getUltraSpacing(2, 1) }, 
            backgroundColor: 'white', 
            boxShadow: 0,
            height: '100%',
            ...applyBorderStyle('chart')
          }}>
            {isRiskReturnLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : riskReturnError ? (
              <ResponsiveTypography variant="errorText">{riskReturnError}</ResponsiveTypography>
            ) : (
              <RiskReturnChart 
                data={(riskReturnData?.data || []).map((item: any) => ({
                  ...item,
                  color: getAssetTypeColor(item.assetType)
                }))} 
                baseCurrency={portfolio.baseCurrency}
                title={t('portfolio.riskReturnAnalysis')}
                compact={isCompactMode}
                onPeriodChange={setRiskReturnPeriod}
                selectedPeriod={riskReturnPeriod}
              />
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: { xs: 0.5, sm: getUltraSpacing(2, 1) }, 
            backgroundColor: 'white', 
            boxShadow: 0,
            height: '100%',
            overflow: 'hidden',
            ...applyBorderStyle('chart')
          }}>
            {isDiversificationLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : diversificationError ? (
              <ResponsiveTypography variant="errorText">{diversificationError}</ResponsiveTypography>
            ) : (
              <DiversificationHeatmap 
                data={diversificationData?.data || []} 
                title={t('portfolio.diversificationHeatmap')}
                compact={isCompactMode}
              />
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Allocation Timeline Section */}
      <ResponsiveTypography variant="pageTitle" sx={{ 
        mb: getUltraSpacing(3, 1),
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <TimelineIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        {t('portfolio.allocationTimeline')}
      </ResponsiveTypography>
      <Box sx={{ 
        p: { xs: 0.5, sm: getUltraSpacing(2, 1) }, 
        backgroundColor: 'white', 
        boxShadow: 0,
        mb: getUltraSpacing(4, 2),
        ...applyBorderStyle('chart')
      }}>
        {isAllocationTimelineLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : allocationTimelineError ? (
          <ResponsiveTypography variant="errorText">{allocationTimelineError}</ResponsiveTypography>
        ) : (
          <AssetAllocationTimeline 
            data={allocationTimelineData || []} 
            baseCurrency={portfolio.baseCurrency}
            title={t('portfolio.allocationTimeline')}
            compact={isCompactMode}
            granularity={allocationTimelineGranularity}
            onGranularityChange={setAllocationTimelineGranularity}
            showGranularitySelector={true}
          />
        )}
      </Box>
    </Box>
  );
};

export default AllocationTab;
