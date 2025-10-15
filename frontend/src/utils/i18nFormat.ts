/**
 * Enhanced formatting utilities with i18n support
 */

import { formatCurrency as baseFormatCurrency, formatNumber as baseFormatNumber, formatPercentage as baseFormatPercentage } from './format';

/**
 * Get locale based on current language
 */
export const getLocaleFromLanguage = (language: string): string => {
  switch (language) {
    case 'vi':
      return 'vi-VN';
    case 'en':
      return 'en-US';
    case 'ja':
      return 'ja-JP';
    case 'ko':
      return 'ko-KR';
    case 'zh':
      return 'zh-CN';
    case 'fr':
      return 'fr-FR';
    case 'de':
      return 'de-DE';
    case 'es':
      return 'es-ES';
    case 'it':
      return 'it-IT';
    case 'pt':
      return 'pt-BR';
    case 'ru':
      return 'ru-RU';
    case 'ar':
      return 'ar-SA';
    case 'th':
      return 'th-TH';
    case 'id':
      return 'id-ID';
    case 'ms':
      return 'ms-MY';
    case 'tl':
      return 'tl-PH';
    default:
      return 'en-US';
  }
};

/**
 * Enhanced currency formatting with i18n support
 */
export const formatCurrencyI18n = (
  amount: string | number | undefined | null,
  currency: string = 'VND',
  options: {
    compact?: boolean;
    precision?: number;
    showSymbol?: boolean;
  } = {},
  language: string = 'vi'
): string => {
  const locale = getLocaleFromLanguage(language);
  return baseFormatCurrency(amount, currency, options, locale);
};

/**
 * Enhanced number formatting with i18n support
 */
export const formatNumberI18n = (
  num: string | number | undefined | null,
  decimals: number = 2,
  language: string = 'vi'
): string => {
  const locale = getLocaleFromLanguage(language);
  return baseFormatNumber(num, decimals, locale);
};

/**
 * Enhanced percentage formatting with i18n support
 */
export const formatPercentageI18n = (
  value: string | number | undefined | null,
  decimals: number = 2,
  language: string = 'vi'
): string => {
  const locale = getLocaleFromLanguage(language);
  return baseFormatPercentage(value, decimals, locale);
};

/**
 * Get currency symbol based on language
 */
export const getCurrencySymbolI18n = (currency: string, language: string = 'vi'): string => {
  const symbols: Record<string, Record<string, string>> = {
    'VND': {
      'en': '₫',
      'vi': '₫',
    },
    'USD': {
      'en': '$',
      'vi': 'US$',
    },
    'EUR': {
      'en': '€',
      'vi': '€',
    },
    'GBP': {
      'en': '£',
      'vi': '£',
    },
    'JPY': {
      'en': '¥',
      'vi': '¥',
    },
  };

  return symbols[currency]?.[language] || currency;
};

/**
 * Format date with i18n support
 */
export const formatDateI18n = (
  date: Date | string | undefined | null,
  format: 'short' | 'medium' | 'long' | 'full' = 'short',
  language: string = 'vi'
): string => {
  if (!date) {
    return 'N/A';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  const locale = getLocaleFromLanguage(language);
  
  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }
  };
  
  return new Intl.DateTimeFormat(locale, options[format]).format(dateObj);
};

/**
 * Format relative time with i18n support
 */
export const formatRelativeTimeI18n = (
  date: string | Date,
  language: string = 'vi'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const translations = {
      en: {
        justNow: 'Just now',
        minutesAgo: 'minutes ago',
        hoursAgo: 'hours ago',
        daysAgo: 'days ago',
        monthsAgo: 'months ago',
        yearsAgo: 'years ago',
      },
      vi: {
        justNow: 'Vừa xong',
        minutesAgo: 'phút trước',
        hoursAgo: 'giờ trước',
        daysAgo: 'ngày trước',
        monthsAgo: 'tháng trước',
        yearsAgo: 'năm trước',
      },
    };

    const t = translations[language as keyof typeof translations] || translations.en;

    if (diffInSeconds < 60) return t.justNow;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${t.minutesAgo}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${t.hoursAgo}`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ${t.daysAgo}`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} ${t.monthsAgo}`;
    return `${Math.floor(diffInSeconds / 31536000)} ${t.yearsAgo}`;
  } catch (error) {
    return 'Invalid Date';
  }
};
