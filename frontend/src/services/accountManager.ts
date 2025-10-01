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
  private currentAccount: Account = DEFAULT_ACCOUNT;
  private loading = false;
  private initialized = false;
  private listeners: Array<(account: Account) => void> = [];
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
  async fetchAccount(accountId: string): Promise<Account> {
    try {
      // Check cache first
      if (this.accountCache[accountId]) {
        console.log('🔍 AccountManager: Using cached account for:', accountId);
        return this.accountCache[accountId];
      }

      // Check if there's already a pending request for this account
      if (this.pendingRequests[accountId] !== undefined) {
        console.log('🔍 AccountManager: Waiting for pending request for:', accountId);
        return await this.pendingRequests[accountId];
      }

      console.log('🔍 AccountManager: Cache miss for account:', accountId);
      this.setLoading(true);
      
      // Only call API for valid UUID format
      if (this.isValidUUID(accountId)) {
        console.log('🔍 AccountManager: Fetching account from API:', accountId);
        
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
        console.log('🔍 AccountManager: Invalid UUID, using default account');
        return DEFAULT_ACCOUNT;
      }
    } catch (error) {
      console.error('Failed to fetch account:', error);
      return DEFAULT_ACCOUNT;
    } finally {
      this.setLoading(false);
    }
  }

  // Separate method for actual API call
  private async fetchAccountFromAPI(accountId: string): Promise<Account> {
    const response = await apiService.get(`/api/v1/accounts/${accountId}`);
    
    // API returns data directly, not in response.data
    let accountData;
    if (response && response.accountId) {
      accountData = response;
    } else if (response.data && response.data.accountId) {
      accountData = response.data;
    } else {
      accountData = DEFAULT_ACCOUNT;
    }
    
    // Cache the result
    this.accountCache[accountId] = accountData;
    console.log('🔍 AccountManager: Cached account for:', accountId);
    return accountData;
  }

  // Initialize account (only once)
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🔍 AccountManager: Already initialized');
      return;
    }

    console.log('🔍 AccountManager: Initializing account...');
    const savedAccountId = localStorage.getItem('currentAccountId');
    
    if (savedAccountId) {
      console.log('🔍 AccountManager: Found saved account ID:', savedAccountId);
      const account = await this.fetchAccount(savedAccountId);
      this.setCurrentAccount(account);
    } else {
      // No saved account, fetch main account from API
      console.log('🔍 AccountManager: No saved account, fetching main account');
      const account = await this.fetchAccount(MAIN_ACCOUNT_ID);
      this.setCurrentAccount(account);
      localStorage.setItem('currentAccountId', MAIN_ACCOUNT_ID);
    }
    
    this.initialized = true;
    console.log('🔍 AccountManager: Initialization complete');
  }

  // Switch account
  async switchAccount(accountId: string): Promise<void> {
    console.log('🔍 AccountManager: Switching to account:', accountId);
    localStorage.setItem('currentAccountId', accountId);
    const account = await this.fetchAccount(accountId);
    console.log('🔍 AccountManager: Fetched account:', account);
    this.setCurrentAccount(account);
    console.log('🔍 AccountManager: Current account after switch:', this.currentAccount);
  }

  // Get current account
  getCurrentAccount(): Account {
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
  private setCurrentAccount(account: Account): void {
    console.log('🔍 AccountManager: Setting current account:', account);
    this.currentAccount = account;
    this.notifyListeners(account);
  }

  // Set loading state and notify listeners
  private setLoading(loading: boolean): void {
    this.loading = loading;
    this.notifyLoadingListeners(loading);
  }

  // Add account change listener
  addAccountListener(listener: (account: Account) => void): () => void {
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
  private notifyListeners(account: Account): void {
    this.listeners.forEach(listener => listener(account));
  }

  // Notify loading listeners
  private notifyLoadingListeners(loading: boolean): void {
    this.loadingListeners.forEach(listener => listener(loading));
  }

  // Force reload main account
  async reloadMainAccount(): Promise<void> {
    localStorage.removeItem('currentAccountId');
    // Clear cache for main account
    delete this.accountCache[MAIN_ACCOUNT_ID];
    const account = await this.fetchAccount(MAIN_ACCOUNT_ID);
    this.setCurrentAccount(account);
    localStorage.setItem('currentAccountId', MAIN_ACCOUNT_ID);
  }
}

export const accountManager = AccountManager.getInstance();
