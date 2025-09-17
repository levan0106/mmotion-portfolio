/**
 * Custom hook for account management
 */

import { useState, useEffect } from 'react';
import { Account } from '../types';

// For now, we'll use a hardcoded account ID for demo purposes
// In a real application, this would come from authentication
const DEFAULT_ACCOUNT_ID = '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5';
const DEFAULT_ACCOUNT: Account = {
  id: DEFAULT_ACCOUNT_ID,
  accountId: DEFAULT_ACCOUNT_ID,
  name: 'John Doe',
  email: 'john.doe@example.com',
  baseCurrency: 'VND', // Default currency for Vietnamese users
  createdAt: '2024-01-15T08:00:00.000Z',
  updatedAt: '2024-12-19T10:30:00.000Z',
};

// Mock accounts with different currencies for testing
const MOCK_ACCOUNTS: Record<string, Account> = {
  '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5': {
    id: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    accountId: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    name: 'John Doe (VND)',
    email: 'john.doe@example.com',
    baseCurrency: 'VND',
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-12-19T10:30:00.000Z',
  },
  'usd-account-123': {
    id: 'usd-account-123',
    accountId: 'usd-account-123',
    name: 'Jane Smith (USD)',
    email: 'jane.smith@example.com',
    baseCurrency: 'USD',
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-12-19T10:30:00.000Z',
  },
  'eur-account-456': {
    id: 'eur-account-456',
    accountId: 'eur-account-456',
    name: 'Pierre Dubois (EUR)',
    email: 'pierre.dubois@example.com',
    baseCurrency: 'EUR',
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-12-19T10:30:00.000Z',
  },
};

export const useAccount = () => {
  const [currentAccount, setCurrentAccount] = useState<Account>(DEFAULT_ACCOUNT);

  // In a real app, you would fetch the account from localStorage or API
  useEffect(() => {
    // Try to get account from localStorage
    const savedAccountId = localStorage.getItem('currentAccountId');
    
    // Check if savedAccountId is a valid UUID format
    const isValidUUID = savedAccountId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(savedAccountId);
    
    if (isValidUUID && savedAccountId !== currentAccount.accountId) {
      // In a real app, you would fetch the account details from API
      // For now, we'll use mock accounts for testing different currencies
      const mockAccount = MOCK_ACCOUNTS[savedAccountId] || DEFAULT_ACCOUNT;
      setCurrentAccount(mockAccount);
    } else if (savedAccountId && !isValidUUID) {
      // Clear invalid account ID and use default
      console.warn('Invalid account ID in localStorage, using default:', savedAccountId);
      localStorage.removeItem('currentAccountId');
      setCurrentAccount(DEFAULT_ACCOUNT);
    }
  }, [currentAccount.accountId]);

  const switchAccount = (accountId: string) => {
    localStorage.setItem('currentAccountId', accountId);
    const mockAccount = MOCK_ACCOUNTS[accountId] || DEFAULT_ACCOUNT;
    setCurrentAccount(mockAccount);
  };

  const getCurrentAccountId = (): string => {
    return currentAccount.accountId;
  };

  return {
    currentAccount,
    switchAccount,
    getCurrentAccountId,
    accountId: currentAccount.accountId, // Shorthand for easy access
    baseCurrency: currentAccount.baseCurrency, // Shorthand for easy access
  };
};

export default useAccount;
