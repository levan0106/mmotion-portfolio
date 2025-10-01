import { Portfolio, Account } from '../types';

// Cache for account and user currency
let cachedAccount: Account | null = null;
let cachedUserCurrency: string | null = null;

/**
 * Set cached account for currency resolution
 */
export const setCachedAccount = (account: Account | null) => {
  cachedAccount = account;
};

/**
 * Set cached user currency for currency resolution
 */
export const setCachedUserCurrency = (userCurrency: string | null) => {
  cachedUserCurrency = userCurrency;
};

/**
 * Get cached account
 */
export const getCachedAccount = (): Account | null => {
  return cachedAccount;
};

/**
 * Get cached user currency
 */
export const getCachedUserCurrency = (): string | null => {
  return cachedUserCurrency;
};

/**
 * Get base currency with priority order:
 * 1. Portfolio base currency
 * 2. Account base currency (from cache)
 * 3. User base currency (from cache)
 * 4. Default VND
 */
export const getBaseCurrency = (
  portfolio?: Portfolio | null,
  defaultCurrency: string = 'VND'
): string => {
  // Priority 1: Portfolio base currency
  if (portfolio?.baseCurrency) {
    return portfolio.baseCurrency;
  }
  
  // Priority 2: Account base currency (from cache)
  if (cachedAccount?.baseCurrency) {
    return cachedAccount.baseCurrency;
  }
  
  // Priority 3: User base currency (from cache)
  if (cachedUserCurrency) {
    return cachedUserCurrency;
  }
  
  // Priority 4: Default currency
  return defaultCurrency;
};

/**
 * Get currency symbol for display
 */
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'VND': '₫',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'KRW': '₩',
    'SGD': 'S$',
    'THB': '฿',
    'IDR': 'Rp',
    'MYR': 'RM',
    'PHP': '₱',
    'INR': '₹',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'NZD': 'NZ$',
  };
  
  return symbols[currency] || currency;
};

/**
 * Format currency amount with symbol
 */
export const formatCurrencyAmount = (
  amount: number,
  currency: string,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
    locale?: string;
  }
): string => {
  const {
    showSymbol = true,
    decimals = 2,
    locale = 'en-US'
  } = options || {};
  
  const symbol = showSymbol ? getCurrencySymbol(currency) : '';
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  
  return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
};

/**
 * Get currency priority info for debugging
 */
export const getCurrencyPriorityInfo = (
  portfolio?: Portfolio | null,
  defaultCurrency: string = 'VND'
): {
  currency: string;
  source: 'portfolio' | 'account' | 'user' | 'default';
  priority: number;
} => {
  if (portfolio?.baseCurrency) {
    return {
      currency: portfolio.baseCurrency,
      source: 'portfolio',
      priority: 1
    };
  }
  
  if (cachedAccount?.baseCurrency) {
    return {
      currency: cachedAccount.baseCurrency,
      source: 'account',
      priority: 2
    };
  }
  
  if (cachedUserCurrency) {
    return {
      currency: cachedUserCurrency,
      source: 'user',
      priority: 3
    };
  }
  
  return {
    currency: defaultCurrency,
    source: 'default',
    priority: 4
  };
};
