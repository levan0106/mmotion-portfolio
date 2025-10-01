import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account } from '../types';
import { accountManager } from '../services/accountManager';

interface AccountContextType {
  currentAccount: Account;
  loading: boolean;
  switchAccount: (accountId: string) => Promise<void>;
  getCurrentAccountId: () => string;
  reloadMainAccount: () => Promise<void>;
  accountId: string;
  baseCurrency: string;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

// Removed unused DEFAULT_ACCOUNT - now handled by accountManager

// Global flags to prevent multiple initializations
let isProviderInitialized = false;
let providerCount = 0;
let globalAccountState: Account | null = null;
let globalLoadingState = false;
let activeProvider: React.FC<{ children: ReactNode }> | null = null;

export const AccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState<Account>(globalAccountState || accountManager.getCurrentAccount());
  const [loading, setLoading] = useState(globalLoadingState || accountManager.getLoading());

  // Track provider instances and ensure only one active provider
  useEffect(() => {
    providerCount++;
    console.log('🔍 AccountProvider: Provider instance created, total:', providerCount);
    
    // If this is the first provider, mark it as active
    if (providerCount === 1) {
      activeProvider = AccountProvider;
      console.log('🔍 AccountProvider: Marked as active provider');
    } else {
      console.log('🔍 AccountProvider: Multiple providers detected, this may cause issues');
    }
    
    return () => {
      providerCount--;
      console.log('🔍 AccountProvider: Provider instance destroyed, total:', providerCount);
      
      // If this was the active provider, clear it
      if (activeProvider === AccountProvider) {
        activeProvider = null;
        console.log('🔍 AccountProvider: Active provider cleared');
      }
    };
  }, []);

  // Initialize account manager (only once globally and only for active provider)
  useEffect(() => {
    const initializeAccount = async () => {
      if (!isProviderInitialized && !accountManager.getInitialized() && activeProvider === AccountProvider) {
        isProviderInitialized = true;
        console.log('🔍 AccountProvider: Initializing AccountManager...');
        await accountManager.initialize();
        setCurrentAccount(accountManager.getCurrentAccount());
        setLoading(accountManager.getLoading());
      } else if (activeProvider !== AccountProvider) {
        console.log('🔍 AccountProvider: Not the active provider, skipping initialization');
      } else if (accountManager.getInitialized()) {
        console.log('🔍 AccountProvider: AccountManager already initialized, syncing state');
        setCurrentAccount(accountManager.getCurrentAccount());
        setLoading(accountManager.getLoading());
      }
    };

    initializeAccount();
  }, []);

  // Listen to account changes (only for active provider)
  useEffect(() => {
    if (activeProvider !== AccountProvider) {
      console.log('🔍 AccountProvider: Not the active provider, skipping listeners');
      return;
    }
    
    console.log('🔍 AccountProvider: Setting up listeners...');
    const unsubscribeAccount = accountManager.addAccountListener((account) => {
      console.log('🔍 AccountProvider: Account changed, updating state');
      globalAccountState = account;
      setCurrentAccount(account);
    });

    const unsubscribeLoading = accountManager.addLoadingListener((loading) => {
      console.log('🔍 AccountProvider: Loading changed, updating state');
      globalLoadingState = loading;
      setLoading(loading);
    });

    return () => {
      console.log('🔍 AccountProvider: Cleaning up listeners...');
      unsubscribeAccount();
      unsubscribeLoading();
    };
  }, []);

  const switchAccount = async (accountId: string) => {
    console.log('🔍 AccountProvider: switchAccount called with:', accountId);
    console.log('🔍 AccountProvider: Active provider:', activeProvider === AccountProvider);
    
    if (activeProvider !== AccountProvider) {
      console.log('🔍 AccountProvider: Not the active provider, skipping switchAccount');
      return;
    }
    
    console.log('🔍 AccountProvider: Calling accountManager.switchAccount');
    await accountManager.switchAccount(accountId);
    console.log('🔍 AccountProvider: switchAccount completed');
  };

  const getCurrentAccountId = (): string => {
    return accountManager.getCurrentAccountId();
  };

  // Force reload main account from API
  const reloadMainAccount = async () => {
    if (activeProvider !== AccountProvider) {
      console.log('🔍 AccountProvider: Not the active provider, skipping reloadMainAccount');
      return;
    }
    await accountManager.reloadMainAccount();
  };

  const value: AccountContextType = {
    currentAccount,
    switchAccount,
    getCurrentAccountId,
    reloadMainAccount,
    accountId: currentAccount?.accountId || '',
    baseCurrency: currentAccount?.baseCurrency || 'VND',
    loading,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
};
