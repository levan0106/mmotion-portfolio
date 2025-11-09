import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { InvestorHolding } from '../types';

interface UseInvestorHoldingsResult {
  holdings: InvestorHolding[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useInvestorHoldings = (accountId: string | null): UseInvestorHoldingsResult => {
  const [holdings, setHoldings] = useState<InvestorHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = async () => {
    if (!accountId) {
      setHoldings([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiService.getInvestorHoldings(accountId);
      setHoldings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch investor holdings');
      setHoldings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldings();
  }, [accountId]);

  return {
    holdings,
    isLoading,
    error,
    refetch: fetchHoldings,
  };
};
