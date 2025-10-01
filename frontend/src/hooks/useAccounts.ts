/**
 * Custom hook for fetching all accounts
 */

import { useState, useEffect } from 'react';
import { Account } from '../types';
import { apiService } from '../services/api';

// Global cache for accounts
let accountsCache: Account[] | null = null;
let accountsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      // Check cache first
      const now = Date.now();
      if (accountsCache && (now - accountsCacheTime) < CACHE_DURATION) {
        console.log('🔍 useAccounts: Using cached accounts');
        setAccounts(accountsCache);
        return;
      }

      setLoading(true);
      setError(null);
      console.log('🔍 useAccounts: Fetching accounts from API');
      const accountsData = await apiService.getAccounts();
      
      // Sort accounts: main account first, then by creation date
      const sortedAccounts = accountsData.sort((a: Account, b: Account) => {
        if (a.isMainAccount && !b.isMainAccount) return -1;
        if (!a.isMainAccount && b.isMainAccount) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // Update cache
      accountsCache = sortedAccounts;
      accountsCacheTime = now;
      
      setAccounts(sortedAccounts);
    } catch (err: any) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const refetch = () => {
    fetchAccounts();
  };

  return {
    accounts,
    loading,
    error,
    refetch,
  };
};

export default useAccounts;
