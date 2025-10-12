/**
 * Utility functions for formatting numbers, currency, dates, and other data
 */

import { format, parseISO } from 'date-fns';

// Currency symbol mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'VND': '₫',
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

// Currency formatting options
interface CurrencyOptions {
  compact?: boolean;
  precision?: number;
  showSymbol?: boolean;
}

/**
 * Format a number or string as currency (handles API string values)
 * @param amount - The amount to format (can be string or number)
 * @param currency - The currency code (default: 'VND')
 * @param options - Additional formatting options
 * @param locale - The locale for formatting (default: 'vi-VN')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: string | number | undefined | null,
  currency: string = 'VND',
  options: CurrencyOptions = {},
  locale: string = 'en-US'
): string => {
  locale = 'en-US';
  
  // Convert string to number if needed
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const { compact = false, precision = currency === 'VND' ? 0 : 2, showSymbol = true } = options;
  
  if (numAmount === undefined || numAmount === null || isNaN(numAmount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      notation: compact ? 'compact' : 'standard',
    }).format(0);
  }
  
  // Check if user wants full format (from localStorage)
  const showFull = localStorage.getItem('currency-show-full') === 'true';
  
  // Special formatting for VND with "tr" suffix for millions (only if not showing full)
  if (currency === 'VND' && Math.abs(numAmount) >= 1000000 && !showFull) {
    const trAmount = numAmount / 1000000;
    const formattedTr = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(trAmount);
    
    if (showSymbol) {
      return `${formattedTr}tr ₫`;
    }
    return `${formattedTr}tr`;
  }
  
  // Format the number
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    notation: compact ? 'compact' : 'standard',
  }).format(numAmount);
  
  // Add currency symbol if requested
  if (showSymbol) {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${formattedNumber} ${symbol}`;
  }
  
  return formattedNumber;
};

/**
 * Format a number or string with specified decimal places (handles API string values)
 * @param num - The number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export const formatNumber = (
  num: string | number | undefined | null,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  locale = 'en-US';
  
  // Convert string to number if needed
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (numValue === undefined || numValue === null || isNaN(numValue)) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(0);
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

/**
 * Format a number or string as percentage (handles API string values)
 * @param value - The value to format as percentage (can be string or number)
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: string | number | undefined | null,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  locale = 'en-US';

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === undefined || numValue === null || isNaN(numValue)) {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(0);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue / 100);
};

/**
 * Format a number as percentage (for values already in percentage form)
 * @param value - The value to format as percentage (already in percentage form, e.g., 22.5 for 22.5%)
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 */
export const formatPercentageValue = (
  value: string | number | undefined | null,
  decimals: number = 1,
  locale: string = 'en-US'
): string => {
  locale = 'en-US';

  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (numValue === undefined || numValue === null || isNaN(numValue)) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(0) + '%';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue) + '%';
};

/**
 * Format a number as percentage with thousand separators
 * @param value - The value to format as percentage (already in percentage form, e.g., 22.5 for 22.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted percentage string with thousand separators
 */
export const formatPercentageWithSeparators = (
  value: number | undefined | null,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  locale = 'en-US';

  if (value === undefined || value === null || isNaN(value)) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(0) + '%';
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value) + '%';
};

/**
 * Format a large number with K, M, B suffixes
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted number with suffix
 */
export const formatCompactNumber = (
  num: number | undefined | null,
  decimals: number = 1,
  locale: string = 'en-US'
): string => {
  locale = 'en-US';

  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }
  
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format a number with thousand separators
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted number with thousand separators
 */
export const formatNumberWithSeparators = (
  num: number | undefined | null,
  decimals: number = 0,
  locale: string = 'en-US'
): string => {
  locale = 'en-US';

  if (num === undefined || num === null || isNaN(num)) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(0);
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format a date to a readable string
 * @param date - The date to format
 * @param format - The format options (default: 'short')
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | undefined | null,
  format: 'short' | 'medium' | 'long' | 'full' = 'short',
  locale: string = 'en-US'
): string => {
  locale = 'en-US';
  
  if (!date) {
    return 'N/A';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }
  };
  
  return new Intl.DateTimeFormat(locale, options[format]).format(dateObj);
};

/**
 * Format a time duration in a readable format
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (milliseconds: number | undefined | null): string => {
  if (milliseconds === undefined || milliseconds === null || isNaN(milliseconds)) {
    return '0ms';
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format date values using date-fns
 * @param date - The date to format
 * @param formatString - The format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string
 */
export const formatDateFns = (date: string | Date, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format date and time
 * @param date - The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDateFns(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format large numbers (e.g., 1.2M, 3.4B)
 * @param value - The number to format
 * @param precision - Number of decimal places (default: 1)
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns Formatted large number string
 */
export const formatLargeNumber = (value: number | undefined | null, precision: number = 1, locale: string = 'en-US'): string => {
  locale = 'en-US';

  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: precision,
  }).format(value);
};

/**
 * Format file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number | undefined | null): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Format phone number
 * @param phone - Phone number string
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

/**
 * Format social security number
 * @param ssn - SSN string
 * @returns Formatted SSN string
 */
export const formatSSN = (ssn: string): string => {
  const cleaned = ssn.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{2})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return ssn;
};

/**
 * Format credit card number
 * @param cardNumber - Credit card number string
 * @returns Formatted credit card number string
 */
export const formatCreditCard = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return cardNumber;
};

/**
 * Truncate text
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text string
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 * @param text - Text to capitalize
 * @returns Capitalized text string
 */
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format name (capitalize each word)
 * @param name - Name to format
 * @returns Formatted name string
 */
export const formatName = (name: string): string => {
  return name
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};
