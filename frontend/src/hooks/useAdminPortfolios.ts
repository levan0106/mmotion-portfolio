import { useQuery } from 'react-query';
import { apiService } from '../services/api';

export interface AdminPortfolio {
  portfolioId: string;
  name: string;
  createdBy: {
    accountId: string;
    name: string;
    email: string;
  };
  user?: {
    userId: string;
    username: string;
    email: string;
  } | null;
  baseCurrency: string;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

export const useAdminPortfolios = () => {
  return useQuery<AdminPortfolio[], Error>(
    'adminPortfolios',
    () => apiService.getAllPortfoliosAdmin(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
};
