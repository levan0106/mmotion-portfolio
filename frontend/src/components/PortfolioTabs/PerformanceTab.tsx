/**
 * Performance Tab Component
 * Displays portfolio performance analytics including NAV, TWR, MWR, and risk metrics
 */

import React, { useState, useEffect } from 'react';
import { Box, Grid, CircularProgress } from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { usePortfolioAnalytics } from '../../hooks/usePortfolios';
import { apiService } from '../../services/api';
import NAVSummary from '../Analytics/NAVSummary';
import NAVHistoryChart from '../Analytics/NAVHistoryChart';
import BenchmarkComparison from '../Analytics/BenchmarkComparison';
import MWRBenchmarkComparison from '../Analytics/MWRBenchmarkComparison';
import { TradeAnalysisContainer } from '../Trading/TradeAnalysis';
import RiskMetricsDashboard from '../Analytics/RiskMetricsDashboard';

interface PerformanceTabProps {
  portfolioId: string;
  portfolio: any;
  isCompactMode: boolean;
  getUltraSpacing: (normal: number, ultra: number) => number;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({
  portfolioId,
  portfolio,
  isCompactMode,
  getUltraSpacing
}) => {
  // State for benchmark data
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [isBenchmarkLoading, setIsBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [mwrBenchmarkData, setMwrBenchmarkData] = useState<any>(null);
  const [isMwrBenchmarkLoading, setIsMwrBenchmarkLoading] = useState(false);
  const [mwrBenchmarkError, setMwrBenchmarkError] = useState<string | null>(null);
  const [benchmarkTimeframe, setBenchmarkTimeframe] = useState('1Y');
  const [benchmarkTwrPeriod, setBenchmarkTwrPeriod] = useState('YTD');
  const [benchmarkMwrPeriod, setBenchmarkMwrPeriod] = useState('YTD');

  // State for risk metrics
  const [riskMetricsData, setRiskMetricsData] = useState<any>(null);
  const [isRiskMetricsLoading, setIsRiskMetricsLoading] = useState(false);
  const [riskMetricsError, setRiskMetricsError] = useState<string | null>(null);

  // Analytics data from hook
  const {
    // performanceData,
    // allocationData,
    // isLoading: isAnalyticsLoading,
    // error: analyticsError,
  } = usePortfolioAnalytics(portfolioId);

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

  // Fetch benchmark comparison data
  useEffect(() => {
    const fetchBenchmarkData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsBenchmarkLoading(true);
        setBenchmarkError(null);
        
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

  // Fetch MWR benchmark comparison data
  useEffect(() => {
    const fetchMWRBenchmarkData = async () => {
      if (!portfolioId) return;
      
      try {
        setIsMwrBenchmarkLoading(true);
        setMwrBenchmarkError(null);
        
        const months = getTimeframeMonths(benchmarkTimeframe);
        const response = await apiService.getPortfolioMWRBenchmarkComparison(portfolioId, months, benchmarkMwrPeriod);
        setMwrBenchmarkData(response);
      } catch (error) {
        console.error('Error fetching MWR benchmark data:', error);
        setMwrBenchmarkError('Failed to load MWR benchmark data');
      } finally {
        setIsMwrBenchmarkLoading(false);
      }
    };

    fetchMWRBenchmarkData();
  }, [portfolioId, benchmarkTimeframe, benchmarkMwrPeriod]);

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

  // Handle benchmark timeframe change
  const handleBenchmarkTimeframeChange = (timeframe: string) => {
    setBenchmarkTimeframe(timeframe);
  };

  // Handle benchmark TWR period change
  const handleBenchmarkTwrPeriodChange = (twrPeriod: string) => {
    setBenchmarkTwrPeriod(twrPeriod);
  };

  const handleBenchmarkMwrPeriodChange = (mwrPeriod: string) => {
    setBenchmarkMwrPeriod(mwrPeriod);
  };

  return (
    <Box sx={{ 
      backgroundColor: 'background.paper',
      minHeight: '80vh',
      pt: 0,
      px: { xs: getUltraSpacing(1, 0.5), sm: getUltraSpacing(2, 1), md: getUltraSpacing(2, 1) }
    }}>
      {/* NAV Summary Section */}
      <Box sx={{ mb: { xs: getUltraSpacing(2, 1), sm: getUltraSpacing(3, 1.5), md: getUltraSpacing(4, 2) } }}>
        <NAVSummary
          navValue={portfolio.totalAllValue || portfolio.totalValue || 0}
          totalValue={portfolio.totalAssetValue || 0}
          baseCurrency={portfolio.baseCurrency}
          isFund={portfolio.isFund || false}
          totalOutstandingUnits={portfolio.totalOutstandingUnits || 1}
          navPerUnit={portfolio.navPerUnit || 0}
          isCompactMode={isCompactMode}
          getUltraSpacing={getUltraSpacing}
          portfolioId={portfolioId}
        />

        {/* NAV History Chart */}
        <Box sx={{ mb: { xs: getUltraSpacing(2, 1), sm: getUltraSpacing(2.5, 1), md: getUltraSpacing(3, 1) } }}>
          <NAVHistoryChart
            portfolioId={portfolioId}
            baseCurrency={portfolio.baseCurrency}
            compact={isCompactMode}
            getUltraSpacing={getUltraSpacing}
          />
        </Box>
        
        {/* Side-by-Side Performance Views */}
        <Grid container spacing={{ xs: getUltraSpacing(1, 0.5), sm: getUltraSpacing(2, 1), md: getUltraSpacing(2, 1) }}>
          {/* Fund Manager View - TWR */}
          <Grid item xs={12} sm={12} md={6} lg={6}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1, sm: 1.5 }, 
              mb: getUltraSpacing(1.5, 1),
              p: { xs: 1, sm: 1.5 },
              backgroundColor: 'primary.50',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'primary.200',
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Box sx={{ 
                p: { xs: 0.6, sm: 0.8 }, 
                backgroundColor: 'primary.main', 
                borderRadius: 1,
                color: 'white',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                alignSelf: { xs: 'flex-start', sm: 'center' }
              }}>
                🏢
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ResponsiveTypography 
                  variant="cardTitle" 
                  sx={{ 
                    color: 'primary.main', 
                    mb: 0.5
                  }}
                >
                  Fund Manager View
                </ResponsiveTypography>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary" 
                  sx={{ 
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  TWR - Pure investment management performance
                </ResponsiveTypography>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary" 
                  sx={{ 
                    display: { xs: 'block', sm: 'none' }
                  }}
                >
                  TWR Performance
                </ResponsiveTypography>
              </Box>
            </Box>
            
            {/* Chart */}
            {isBenchmarkLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : benchmarkError ? (
              <ResponsiveTypography color="error" variant="errorText">{benchmarkError}</ResponsiveTypography>
            ) : (
              <BenchmarkComparison 
                data={benchmarkData?.data || []} 
                baseCurrency={portfolio.baseCurrency}
                title="Portfolio Performance (TWR)"
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
          </Grid>

          {/* Individual Investor View - MWR */}
          <Grid item xs={12} sm={12} md={6} lg={6}>
            {/* Header */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 1, sm: 1.5 }, 
              mb: getUltraSpacing(1.5, 1),
              p: { xs: 1, sm: 1.5 },
              backgroundColor: 'success.50',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'success.200',
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Box sx={{ 
                p: { xs: 0.6, sm: 0.8 }, 
                backgroundColor: 'success.main', 
                borderRadius: 1,
                color: 'white',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                alignSelf: { xs: 'flex-start', sm: 'center' }
              }}>
                👤
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ResponsiveTypography 
                  variant="cardTitle" 
                  sx={{ 
                    color: 'success.main', 
                    mb: 0.5
                  }}
                >
                  Individual Investor View
                </ResponsiveTypography>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary" 
                  sx={{ 
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  MWR - Actual investor returns with cash flows
                </ResponsiveTypography>
                <ResponsiveTypography 
                  variant="formHelper" 
                  color="text.secondary" 
                  sx={{ 
                    display: { xs: 'block', sm: 'none' }
                  }}
                >
                  MWR Performance
                </ResponsiveTypography>
              </Box>
            </Box>
            
            {/* Chart */}
            {isMwrBenchmarkLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : mwrBenchmarkError ? (
              <ResponsiveTypography color="error" variant="errorText">{mwrBenchmarkError}</ResponsiveTypography>
            ) : (
              <MWRBenchmarkComparison 
                data={mwrBenchmarkData?.data || []} 
                title="Portfolio Performance (MWR)"
                benchmarkName={mwrBenchmarkData?.benchmarkName || 'VN Index'}
                mwrPeriod={mwrBenchmarkData?.mwrPeriod}
                onMWRPeriodChange={handleBenchmarkMwrPeriodChange}
                currentMWRPeriod={benchmarkMwrPeriod}
                onTimeframeChange={handleBenchmarkTimeframeChange}
                currentTimeframe={benchmarkTimeframe}
              />
            )}
          </Grid>
        </Grid>
      </Box>
      
      {/* Trading Analysis Section */}
      <Box sx={{ mb: { xs: getUltraSpacing(2, 1), sm: getUltraSpacing(3, 1.5), md: getUltraSpacing(4, 2) } }}>
        <TradeAnalysisContainer 
          portfolioId={portfolioId} 
          isCompactMode={isCompactMode}
        />
      </Box>
      
      {/* Risk Metrics Section */}
      <Box sx={{ mb: { xs: getUltraSpacing(2, 1), sm: getUltraSpacing(3, 1.5), md: getUltraSpacing(4, 2) } }}>
        {isRiskMetricsLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : riskMetricsError ? (
          <ResponsiveTypography color="error" variant="errorText">{riskMetricsError}</ResponsiveTypography>
        ) : (
          <RiskMetricsDashboard 
            data={riskMetricsData?.data || {}}
            baseCurrency={portfolio.baseCurrency}
            title="Risk Metrics Dashboard"
            compact={isCompactMode}
          />
        )}
      </Box>
    </Box>
  );
};

export default PerformanceTab;
