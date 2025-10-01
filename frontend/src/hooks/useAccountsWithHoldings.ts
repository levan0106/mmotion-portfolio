/**
 * Hook to fetch accounts that have holdings in a specific portfolio
 */

import { useState, useEffect } from 'react';
import { Account } from '../types';
import { apiService } from '../services/api';

export const useAccountsWithHoldings = (portfolioId: string | null) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioId) {
      setAccounts([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchAccountsWithHoldings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get fund investors (holdings) for this portfolio
        const holdings = await apiService.getFundInvestors(portfolioId);
        
        // Extract unique accounts from holdings
        const uniqueAccounts = holdings.reduce((acc: Account[], holding) => {
          const existingAccount = acc.find(account => account.accountId === holding.accountId);
          if (!existingAccount && holding.account) {
            acc.push(holding.account);
          }
          return acc;
        }, []);
        
        setAccounts(uniqueAccounts);
      } catch (err: any) {
        console.error('Error fetching accounts with holdings:', err);
        setError(err.response?.data?.message || 'Failed to fetch accounts with holdings');
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountsWithHoldings();
  }, [portfolioId]);

  return { accounts, loading, error };
};
