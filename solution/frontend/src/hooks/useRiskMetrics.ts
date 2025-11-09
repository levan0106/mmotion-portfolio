import { useQuery } from 'react-query';
import { apiService } from '../services/api';

export interface RiskMetricsData {
  var95: number;
  var99: number;
  sharpeRatio: number;
  beta: number;
  volatility: number;
  maxDrawdown: number;
  calmarRatio: number;
  sortinoRatio: number;
  cvar95?: number;
  // Additional metrics for comprehensive dashboard
  volatility1M?: number;
  volatility3M?: number;
  sharpeRatio1M?: number;
  sharpeRatio3M?: number;
  maxDrawdown1M?: number;
  maxDrawdown3M?: number;
}

export interface RiskMetricsResponse {
  portfolioId: string;
  totalValue: number;
  data: RiskMetricsData;
  calculatedAt: string;
  period: string;
  additionalPeriods: string[];
}

export interface UseRiskMetricsOptions {
  portfolioId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch risk metrics data for a portfolio
 */
export const useRiskMetrics = ({ portfolioId, enabled = true }: UseRiskMetricsOptions) => {
  return useQuery<RiskMetricsResponse, Error>({
    queryKey: ['risk-metrics', portfolioId],
    queryFn: async () => {
      return await apiService.getPortfolioRiskMetrics(portfolioId);
    },
    enabled: enabled && !!portfolioId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook to fetch risk metrics with error handling
 */
export const useRiskMetricsWithError = (options: UseRiskMetricsOptions) => {
  const { data, isLoading, error, refetch } = useRiskMetrics(options);

  return {
    riskMetrics: data?.data,
    totalValue: data?.totalValue,
    calculatedAt: data?.calculatedAt,
    period: data?.period,
    additionalPeriods: data?.additionalPeriods,
    isLoading,
    error: error?.message || null,
    refetch,
    hasData: !!data?.data,
  };
};
