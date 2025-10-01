import { useEffect } from 'react';
import { Account } from '../types';
import { setCachedAccount, setCachedUserCurrency } from '../utils/currency';

/**
 * Hook to manage currency cache
 */
export const useCurrencyCache = (account: Account | null, userCurrency?: string | null) => {
  useEffect(() => {
    setCachedAccount(account);
  }, [account]);

  useEffect(() => {
    setCachedUserCurrency(userCurrency || null);
  }, [userCurrency]);
};
