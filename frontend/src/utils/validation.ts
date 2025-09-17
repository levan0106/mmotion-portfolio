/**
 * Validation utility functions
 * Following UTILS_GUIDE.md patterns for validation
 */

/**
 * Validate UUID format
 * @param uuid - UUID string to validate
 * @returns true if valid UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate currency code
 * @param currency - Currency code to validate
 * @returns true if valid currency code
 */
export const isValidCurrency = (currency: string): boolean => {
  if (!currency || typeof currency !== 'string') {
    return false;
  }
  
  const validCurrencies = ['USD', 'VND', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'SGD', 'THB', 'IDR', 'MYR', 'PHP', 'INR', 'AUD', 'CAD', 'CHF', 'NZD'];
  return validCurrencies.includes(currency.toUpperCase());
};

/**
 * Validate date
 * @param date - Date to validate
 * @returns true if valid date
 */
export const isValidDate = (date: any): boolean => {
  if (!date) {
    return false;
  }
  
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Validate positive number
 * @param num - Number to validate
 * @returns true if positive number
 */
export const isPositiveNumber = (num: any): boolean => {
  if (num === null || num === undefined) {
    return false;
  }
  
  const parsed = parseFloat(num);
  return !isNaN(parsed) && parsed > 0;
};

/**
 * Validate non-negative number
 * @param num - Number to validate
 * @returns true if non-negative number
 */
export const isNonNegativeNumber = (num: any): boolean => {
  if (num === null || num === undefined) {
    return false;
  }
  
  const parsed = parseFloat(num);
  return !isNaN(parsed) && parsed >= 0;
};

/**
 * Validate required field
 * @param value - Value to validate
 * @returns true if value is not empty
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  return true;
};

/**
 * Validate string length
 * @param str - String to validate
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @returns true if string length is within range
 */
export const isValidStringLength = (str: string, minLength: number = 0, maxLength: number = Infinity): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  return str.length >= minLength && str.length <= maxLength;
};

/**
 * Validate percentage value
 * @param value - Percentage value to validate
 * @returns true if valid percentage (0-100)
 */
export const isValidPercentage = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  const parsed = parseFloat(value);
  return !isNaN(parsed) && parsed >= 0 && parsed <= 100;
};

/**
 * Validate trade type
 * @param type - Trade type to validate
 * @returns true if valid trade type
 */
export const isValidTradeType = (type: string): boolean => {
  if (!type || typeof type !== 'string') {
    return false;
  }
  
  const validTypes = ['BUY', 'SELL'];
  return validTypes.includes(type.toUpperCase());
};

/**
 * Validate asset type
 * @param type - Asset type to validate
 * @returns true if valid asset type
 */
export const isValidAssetType = (type: string): boolean => {
  if (!type || typeof type !== 'string') {
    return false;
  }
  
  const validTypes = ['STOCK', 'BOND', 'GOLD', 'DEPOSIT', 'CASH'];
  return validTypes.includes(type.toUpperCase());
};
