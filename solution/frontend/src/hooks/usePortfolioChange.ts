/**
 * Custom hook for calculating portfolio percentage change
 * Uses NAV history from portfolio snapshots instead of mock data
 */

import { useQuery } from 'react-query';
import { useAccount } from '../contexts/AccountContext';
import apiService from '../services/api';

interface PortfolioChangeData {
  change: string;
  isLoading: boolean;
  error: any;
}

/**
 * Convert period string to months and granularity for NAV history API
 */
const convertPeriodToNavHistoryParams = (period: string): { months: number; granularity: string } => {
  switch (period) {
    case '1D':
      return { months: 1, granularity: 'DAILY' };
    case '1W':
      return { months: 1, granularity: 'DAILY' };
    case '1M':
      return { months: 1, granularity: 'DAILY' };
    case '3M':
      return { months: 3, granularity: 'DAILY' };
    case '6M':
      return { months: 6, granularity: 'DAILY' };
    case '1Y':
      return { months: 12, granularity: 'DAILY' };
    default:
      return { months: 1, granularity: 'DAILY' };
  }
};

export const usePortfolioChange = (portfolioId: string, period: string = '1M'): PortfolioChangeData => {
  const { accountId, loading: accountLoading } = useAccount();
  const { months, granularity } = convertPeriodToNavHistoryParams(period);

  const {
    data: navHistoryResponse,
    isLoading,
    error,
  } = useQuery(
    ['portfolio-change', portfolioId, period, accountId],
    () => apiService.getPortfolioNAVHistory(portfolioId, accountId || '', { months, granularity }),
    {
      enabled: !!portfolioId && !!accountId && !accountLoading,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const calculateChange = (): string => {
    if (!navHistoryResponse || !navHistoryResponse.data || !Array.isArray(navHistoryResponse.data)) {
      return '+0.0%';
    }

    const dataArray = navHistoryResponse.data;

    if (dataArray.length < 2) {
      return '+0.0%';
    }

    // Sort by date to ensure chronological order
    const sortedData = [...dataArray].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Get the latest data point
    const latestData = sortedData[sortedData.length - 1];

    // For 1D period, use daily return directly
    if (period === '1D' && latestData.portfolioDailyReturn != null) {
      const dailyReturn = parseFloat(latestData.portfolioDailyReturn.toString());
      const sign = dailyReturn >= 0 ? '+' : '';
      return `${sign}${dailyReturn.toFixed(1)}%`;
    }

    // For other periods, calculate from oldest and latest NAV values
    const oldestValue = parseFloat(sortedData[0].navValue?.toString() || '0');
    const latestValue = parseFloat(latestData.navValue?.toString() || '0');

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
  const { months, granularity } = convertPeriodToNavHistoryParams(period);

  // Calculate total change across all portfolios
  const {
    data: allHistoryData,
    isLoading,
    error,
  } = useQuery(
    ['portfolio-change-all', portfolios.map(p => p?.portfolioId || p?.id || '').filter(Boolean).join(','), period, accountId],
    async () => {
      if (!portfolios || !Array.isArray(portfolios) || portfolios.length === 0) {
        return [];
      }
      
      // Filter out portfolios without valid IDs
      const validPortfolios = portfolios.filter(portfolio => portfolio && (portfolio.portfolioId || portfolio.id));
      
      if (validPortfolios.length === 0 || !accountId) {
        return [];
      }
      
      const historyPromises = validPortfolios.map(async (portfolio) => {
        try {
          const portfolioId = portfolio.portfolioId || portfolio.id;
          if (!portfolioId) {
            return null; // Skip if no ID
          }
          const navHistory = await apiService.getPortfolioNAVHistory(portfolioId, accountId, { months, granularity });
          return navHistory;
        } catch (error: any) {
          console.warn(`Failed to fetch NAV history for portfolio ${portfolio.portfolioId || portfolio.id}:`, error);
          return null; // Return null on error
        }
      });
      
      return Promise.all(historyPromises);
    },
    {
      enabled: !!portfolios && Array.isArray(portfolios) && portfolios.length > 0 && portfolios.some(p => p && (p.portfolioId || p.id)) && !!accountId && !accountLoading,
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

    allHistoryData.forEach((navHistoryResponse) => {
      if (navHistoryResponse && navHistoryResponse.data && Array.isArray(navHistoryResponse.data) && navHistoryResponse.data.length >= 2) {
        const sortedData = [...navHistoryResponse.data].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const oldestValue = parseFloat(sortedData[0].navValue?.toString() || '0');
        const latestValue = parseFloat(sortedData[sortedData.length - 1].navValue?.toString() || '0');

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
