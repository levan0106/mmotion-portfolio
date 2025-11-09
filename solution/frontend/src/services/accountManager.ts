import { Account } from '../types';
import { apiService } from './api';

const MAIN_ACCOUNT_ID = '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5';
const DEFAULT_ACCOUNT: Account = {
  id: MAIN_ACCOUNT_ID,
  accountId: MAIN_ACCOUNT_ID,
  name: 'Test User',
  email: 'tung@example.com',
  baseCurrency: 'USD',
  isInvestor: true,
  isMainAccount: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

class AccountManager {
  private static instance: AccountManager;
  private accountCache: { [key: string]: Account } = {};
  private currentAccount: Account | null = null;
  private loading = false;
  private initialized = false;
  private listeners: Array<(account: Account | null) => void> = [];
  private loadingListeners: Array<(loading: boolean) => void> = [];
  private pendingRequests: { [key: string]: Promise<Account> } = {};

  private constructor() {}

  static getInstance(): AccountManager {
    if (!AccountManager.instance) {
      AccountManager.instance = new AccountManager();
    }
    return AccountManager.instance;
  }

  // Check if accountId is a valid UUID format
  private isValidUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  // Fetch account data from API with caching
  async fetchAccount(accountId: string): Promise<Account | null> {
    try {
      // Check if user is authenticated before making API calls
      const jwtToken = localStorage.getItem('jwt_token');
      if (!jwtToken) {
        return null;
      }

      // Check cache first
      if (this.accountCache[accountId]) {
        return this.accountCache[accountId];
      }

      // Check if there's already a pending request for this account
      if (this.pendingRequests[accountId] !== undefined) {
        return await this.pendingRequests[accountId];
      }
      this.setLoading(true);
      
      // Only call API for valid UUID format
      if (this.isValidUUID(accountId)) {
        
        // Create pending request to prevent duplicate calls
        const requestPromise = this.fetchAccountFromAPI(accountId);
        this.pendingRequests[accountId] = requestPromise;
        
        try {
          const accountData = await requestPromise;
          return accountData;
        } finally {
          // Clean up pending request
          delete this.pendingRequests[accountId];
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch account:', error);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  // Separate method for actual API call
  private async fetchAccountFromAPI(accountId: string): Promise<Account> {
    const accountData = await apiService.getAccount(accountId);
    
    // Cache the result
    this.accountCache[accountId] = accountData;
    return accountData;
  }

  // Initialize account (only once)
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Check if user is authenticated before trying to fetch accounts
    const jwtToken = localStorage.getItem('jwt_token');
    if (!jwtToken) {
      this.setCurrentAccount(null);
      this.initialized = true;
      return;
    }
    const savedAccountId = localStorage.getItem('currentAccountId');
    
    if (savedAccountId) {
      const account = await this.fetchAccount(savedAccountId);
      if (account) {
        this.setCurrentAccount(account);
      } else {
        await this.loadUserMainAccount();
      }
    } else {
      // No saved account, fetch user's main account
      await this.loadUserMainAccount();
    }
    
    this.initialized = true;
  }

  // Switch account
  async switchAccount(accountId: string): Promise<void> {
    localStorage.setItem('currentAccountId', accountId);
    const account = await this.fetchAccount(accountId);
    if (account) {
      this.setCurrentAccount(account);
    } else {
      this.setCurrentAccount(DEFAULT_ACCOUNT);
    }
  }

  // Get current account
  getCurrentAccount(): Account | null {
    return this.currentAccount;
  }

  // Get current account ID
  getCurrentAccountId(): string {
    return this.currentAccount?.accountId || '';
  }

  // Get base currency
  getBaseCurrency(): string {
    return this.currentAccount?.baseCurrency || 'VND';
  }

  // Get loading state
  getLoading(): boolean {
    return this.loading;
  }

  // Get initialized state
  getInitialized(): boolean {
    return this.initialized;
  }

  // Set current account and notify listeners
  private setCurrentAccount(account: Account | null): void {
    this.currentAccount = account;
    this.notifyListeners(account);
  }

  // Set loading state and notify listeners
  private setLoading(loading: boolean): void {
    this.loading = loading;
    this.notifyLoadingListeners(loading);
  }

  // Add account change listener
  addAccountListener(listener: (account: Account | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Add loading change listener
  addLoadingListener(listener: (loading: boolean) => void): () => void {
    this.loadingListeners.push(listener);
    return () => {
      this.loadingListeners = this.loadingListeners.filter(l => l !== listener);
    };
  }

  // Notify account listeners
  private notifyListeners(account: Account | null): void {
    this.listeners.forEach(listener => listener(account));
  }

  // Notify loading listeners
  private notifyLoadingListeners(loading: boolean): void {
    this.loadingListeners.forEach(listener => listener(loading));
  }

  // Load user's main account from API
  private async loadUserMainAccount(): Promise<void> {
    try {
      const accounts = await apiService.getAccounts();
      
      if (accounts && accounts.length > 0) {
        // Find main account (isMainAccount: true) or use first account
        const mainAccount = accounts.find((acc: Account) => acc.isMainAccount) || accounts[0];
        
        this.setCurrentAccount(mainAccount);
        localStorage.setItem('currentAccountId', mainAccount.accountId);
      } else {
        this.setCurrentAccount(DEFAULT_ACCOUNT);
      }
    } catch (error) {
      console.error('Failed to load user accounts:', error);
      this.setCurrentAccount(DEFAULT_ACCOUNT);
    }
  }

  // Force reload main account
  async reloadMainAccount(): Promise<void> {
    localStorage.removeItem('currentAccountId');
    // Clear all cached accounts
    this.accountCache = {};
    try {
      await this.loadUserMainAccount();
    } catch (error) {
      console.error('Error in loadUserMainAccount:', error);
    }
  }
}

export const accountManager = AccountManager.getInstance();
