/**
 * Custom hook for calculating portfolio percentage change
 */

import { useQuery } from 'react-query';
import { useAccount } from '../contexts/AccountContext';
import apiService from '../services/api';
import { formatCurrency } from '@/utils/format';

interface PortfolioChangeData {
  change: string;
  isLoading: boolean;
  error: any;
}

export const usePortfolioChange = (portfolioId: string, period: string = '1M'): PortfolioChangeData => {
  const { accountId, loading: accountLoading } = useAccount();

  const {
    data: historyData,
    isLoading,
    error,
  } = useQuery(
    ['portfolio-change', portfolioId, period, accountId],
    () => apiService.getPortfolioAnalyticsHistory(portfolioId, period),
    {
      enabled: !!portfolioId && !!accountId && !accountLoading,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const calculateChange = (): string => {
    if (!historyData || historyData.length < 2) {
      return '+0.0%';
    }

    // Sort by date to ensure chronological order
    const sortedData = [...historyData].sort((a, b) => 
      new Date((a as any).date || a.navDate).getTime() - new Date((b as any).date || b.navDate).getTime()
    );

    const oldestValue = parseFloat((sortedData[0] as any).value?.toString() || sortedData[0].navValue?.toString() || (sortedData[0] as any).nav?.toString() || '0');
    const latestValue = parseFloat((sortedData[sortedData.length - 1] as any).value?.toString() || sortedData[sortedData.length - 1].navValue?.toString() || (sortedData[sortedData.length - 1] as any).nav?.toString() || '0');

    if (oldestValue === 0) {
      return '+0.0%';
    }

    const percentageChange = ((latestValue - oldestValue) / oldestValue) * 100;
    const sign = percentageChange >= 0 ? '+' : '';
    
    return `${sign}${percentageChange.toFixed(1)}%`;
  };

  return {
    change: calculateChange(),
    isLoading,
    error,
  };
};

export const usePortfolioChangeForAllPortfolios = (portfolios: any[], period: string = '1M') => {
  const { accountId, loading: accountLoading } = useAccount();

  // Calculate total change across all portfolios
  const {
    data: allHistoryData,
    isLoading,
    error,
  } = useQuery(
    ['portfolio-change-all', portfolios.map(p => p.id).join(','), period, accountId],
    async () => {
      if (!portfolios.length) {
        return [];
      }
      
      // Filter out portfolios without valid IDs
      const validPortfolios = portfolios.filter(portfolio => portfolio && (portfolio.id || portfolio.portfolioId));
      
      if (validPortfolios.length === 0) {
        return [];
      }
      
      const historyPromises = validPortfolios.map(async (portfolio) => {
        try {
          const portfolioId = portfolio.id || portfolio.portfolioId;
          const history = await apiService.getPortfolioAnalyticsHistory(portfolioId, period);
          return history;
        } catch (error: any) {
          return []; // Return empty array on error
        }
      });
      
      return Promise.all(historyPromises);
    },
    {
      enabled: portfolios.length > 0 && portfolios.some(p => p && (p.id || p.portfolioId)) && !!accountId && !accountLoading,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const calculateTotalChange = (): string => {
    if (!allHistoryData || allHistoryData.length === 0) {
      return '+0.0%';
    }

    let totalOldestValue = 0;
    let totalLatestValue = 0;

    allHistoryData.forEach((portfolioHistory) => {
      if (portfolioHistory && (portfolioHistory as any).data && (portfolioHistory as any).data.length >= 2) {
        const sortedData = [...(portfolioHistory as any).data].sort((a, b) => 
          new Date((a as any).date || a.navDate).getTime() - new Date((b as any).date || b.navDate).getTime()
        );

        const oldestValue = parseFloat((sortedData[0] as any).value?.toString() || sortedData[0].navValue?.toString() || (sortedData[0] as any).nav?.toString() || '0');
        const latestValue = parseFloat((sortedData[sortedData.length - 1] as any).value?.toString() || sortedData[sortedData.length - 1].navValue?.toString() || (sortedData[sortedData.length - 1] as any).nav?.toString() || '0');
// console.log('oldestValue', sortedData[0].date, oldestValue);
        totalOldestValue += oldestValue;
        totalLatestValue += latestValue;
      }
    });

    if (totalOldestValue === 0) {
      return '+0.0%';
    }

    const percentageChange = ((totalLatestValue - totalOldestValue) / totalOldestValue) * 100;
    const sign = percentageChange >= 0 ? '+' : '';
    
    return `${sign}${percentageChange.toFixed(1)}%`;
  };

  return {
    change: calculateTotalChange(),
    isLoading,
    error,
  };
};
