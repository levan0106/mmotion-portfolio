import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account } from '../types';
import { accountManager } from '../services/accountManager';
import { authService, User } from '../services/authService';

interface AccountContextType {
  currentAccount: Account | null;
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  switchAccount: (accountId: string) => Promise<void>;
  getCurrentAccountId: () => string;
  reloadMainAccount: () => Promise<void>;
  logout: () => void;
  updateAuthState: () => Promise<void>;
  accountId: string;
  baseCurrency: string;
  isDemoAccount: boolean;
  isReadOnly: boolean;
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
  const [currentAccount, setCurrentAccount] = useState<Account | null>(globalAccountState || accountManager.getCurrentAccount());
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(globalLoadingState || accountManager.getLoading());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  // Track provider instances and ensure only one active provider
  useEffect(() => {
    providerCount++;
    // If this is the first provider, mark it as active
    if (providerCount === 1) {
      activeProvider = AccountProvider;
    } else {
    }
    
    return () => {
      providerCount--;
      // If this was the active provider, clear it
      if (activeProvider === AccountProvider) {
        activeProvider = null;
      }
    };
  }, []);

  // Initialize account manager (only when authenticated and only for active provider)
  useEffect(() => {
    const initializeAccount = async () => {
      // Only initialize if user is authenticated
      if (!isAuthenticated) {
        return;
      }

      if (!isProviderInitialized && !accountManager.getInitialized() && activeProvider === AccountProvider) {
        isProviderInitialized = true;
        await accountManager.initialize();
        setCurrentAccount(accountManager.getCurrentAccount());
        setLoading(accountManager.getLoading());
      } else if (activeProvider !== AccountProvider) {
      } else if (accountManager.getInitialized()) {
        setCurrentAccount(accountManager.getCurrentAccount());
        setLoading(accountManager.getLoading());
      }
    };

    initializeAccount();
  }, [isAuthenticated]); // Add isAuthenticated as dependency

  // Listen to account changes (only for active provider)
  useEffect(() => {
    if (activeProvider !== AccountProvider) {
      return;
    }
    const unsubscribeAccount = accountManager.addAccountListener((account) => {
      globalAccountState = account;
      setCurrentAccount(account);
    });

    const unsubscribeLoading = accountManager.addLoadingListener((loading) => {
      globalLoadingState = loading;
      setLoading(loading);
    });

    return () => {
      unsubscribeAccount();
      unsubscribeLoading();
    };
  }, []);

  // Listen to authentication state changes
  useEffect(() => {
    const checkAuthState = () => {
      const authState = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      // Only update if state actually changed to avoid loops
      setIsAuthenticated(prevState => {
        if (prevState !== authState) {
          return authState;
        }
        return prevState;
      });
      
      setCurrentUser(prevUser => {
        if (JSON.stringify(prevUser) !== JSON.stringify(user)) {
          return user;
        }
        return prevUser;
      });
    };

    // Check auth state on mount
    checkAuthState();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isAuthenticated' || e.key === 'user_session') {
        checkAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const switchAccount = async (accountId: string) => {
    if (activeProvider !== AccountProvider) {
      return;
    }
    await accountManager.switchAccount(accountId);
  };

  const getCurrentAccountId = (): string => {
    return accountManager.getCurrentAccountId();
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    // Force redirect to login page after logout
    window.location.href = '/login';
  };

  // Method to update authentication state after login
  const updateAuthState = async () => {
    const authState = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    setIsAuthenticated(authState);
    setCurrentUser(user);
    
    // If user just logged in, reload their main account
    if (authState && user && activeProvider === AccountProvider) {
      try {
        await reloadMainAccount();
      } catch (error) {
        console.error('Error in reloadMainAccount:', error);
      }
    }
  };

  // Force reload main account from API
  const reloadMainAccount = async () => {
    if (activeProvider !== AccountProvider) {
      return;
    }
    try {
      await accountManager.reloadMainAccount();
    } catch (error) {
      console.error('Error in accountManager.reloadMainAccount():', error);
    }
  };

  // Check if current account is demo account (read-only)
  const isDemoAccount = currentAccount?.isDemoAccount === true;
  const isReadOnly = isDemoAccount; // Demo account is read-only

  const value: AccountContextType = {
    currentAccount,
    currentUser,
    isAuthenticated,
    switchAccount,
    getCurrentAccountId,
    reloadMainAccount,
    logout,
    updateAuthState,
    accountId: currentAccount?.accountId || '',
    baseCurrency: currentAccount?.baseCurrency || 'VND',
    loading,
    isDemoAccount,
    isReadOnly,
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
