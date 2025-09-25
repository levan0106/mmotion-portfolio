// Portfolio Analytics Hooks

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

// Hook for portfolio analytics allocation timeline (now uses real snapshot data with 12 month limit)
export const usePortfolioAllocationTimeline = (
  portfolioId: string,
  months: number = 12,
  granularity: string = 'DAILY'
) => {
  const [allocationData, setAllocationData] = useState<{ date: string; [key: string]: string | number }[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocationData = useCallback(async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use new API that enforces 12 month limit and always uses snapshot data
      const data = await apiService.getPortfolioAllocationTimeline(
        portfolioId,
        months,
        granularity
      );
      setAllocationData(data.data || []);
      setTotalValue(data.totalValue || 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch allocation timeline data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, months, granularity]);

  useEffect(() => {
    if (portfolioId) {
      fetchAllocationData();
    }
  }, [portfolioId, months, granularity, fetchAllocationData]);

  return {
    allocationData,
    totalValue,
    loading,
    error,
    refetch: fetchAllocationData,
  };
};

// Hook for portfolio performance analytics
// export const usePortfolioPerformance = (portfolioId: string, months: number = 12) => {
//   const [performanceData, setPerformanceData] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchPerformanceData = useCallback(async () => {
//     if (!portfolioId) return;
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       // const data = await apiService.getPortfolioPerformance(portfolioId);
//       // setPerformanceData(data);
//     } catch (error) {
//       setError(error instanceof Error ? error.message : 'Failed to fetch performance data');
//     } finally {
//       setLoading(false);
//     }
//   }, [portfolioId, months]);

//   useEffect(() => {
//     if (portfolioId) {
//       fetchPerformanceData();
//     }
//   }, [portfolioId, months]);

//   return {
//     performanceData,
//     loading,
//     error,
//     refetch: fetchPerformanceData,
//   };
// };

// Hook for portfolio risk metrics
export const usePortfolioRiskMetrics = (portfolioId: string) => {
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskMetrics = useCallback(async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getPortfolioRiskMetrics(portfolioId);
      setRiskMetrics(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch risk metrics');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolioId) {
      fetchRiskMetrics();
    }
  }, [portfolioId]);

  return {
    riskMetrics,
    loading,
    error,
    refetch: fetchRiskMetrics,
  };
};

// Hook for portfolio diversification heatmap
export const usePortfolioDiversification = (portfolioId: string) => {
  const [diversificationData, setDiversificationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiversificationData = useCallback(async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getPortfolioDiversificationHeatmap(portfolioId);
      setDiversificationData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch diversification data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId]);

  useEffect(() => {
    if (portfolioId) {
      fetchDiversificationData();
    }
  }, [portfolioId]);

  return {
    diversificationData,
    loading,
    error,
    refetch: fetchDiversificationData,
  };
};

// Hook for portfolio cash flow analysis
export const usePortfolioCashFlow = (portfolioId: string, months: number = 12) => {
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCashFlowData = useCallback(async () => {
    if (!portfolioId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getPortfolioCashFlowAnalysis(portfolioId);
      setCashFlowData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch cash flow data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, months]);

  useEffect(() => {
    if (portfolioId) {
      fetchCashFlowData();
    }
  }, [portfolioId, months]);

  return {
    cashFlowData,
    loading,
    error,
    refetch: fetchCashFlowData,
  };
};
