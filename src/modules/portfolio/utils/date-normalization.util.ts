/**
 * Date normalization utilities to handle timezone issues
 */

/**
 * Normalize a date to YYYY-MM-DD string format to avoid timezone issues
 * @param date - Date object or string
 * @returns YYYY-MM-DD string
 */
export function normalizeDateToString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
}

/**
 * Compare two dates as strings to avoid timezone issues
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if date1 <= date2
 */
export function compareDates(date1: Date | string, date2: Date | string): boolean {
  const date1Str = normalizeDateToString(date1);
  const date2Str = normalizeDateToString(date2);
  return date1Str <= date2Str;
}

/**
 * Check if a date is within a date range (inclusive)
 * @param date - Date to check
 * @param startDate - Start date of range
 * @param endDate - End date of range
 * @returns true if date is within range
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  const dateStr = normalizeDateToString(date);
  const startStr = normalizeDateToString(startDate);
  const endStr = normalizeDateToString(endDate);
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Get date range condition for SQL queries
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Object with date range conditions
 */
export function getDateRangeCondition(startDate?: Date | string, endDate?: Date | string) {
  const conditions: any = {};
  
  if (startDate) {
    conditions.startDate = normalizeDateToString(startDate);
  }
  
  if (endDate) {
    conditions.endDate = normalizeDateToString(endDate);
  }
  
  return conditions;
}

/**
 * Get SQL condition for date comparison (timezone independent)
 * @param dateField - Database field name (e.g., 'snapshotDate', 'tradeDate')
 * @param date - Date to compare
 * @param operator - Comparison operator ('=', '<=', '>=', '<', '>')
 * @returns SQL condition string and parameters
 */
export function getDateCondition(dateField: string, date: Date | string, operator: string = '=') {
  const dateStr = normalizeDateToString(date);
  return {
    condition: `DATE(${dateField}) ${operator} :date`,
    params: { date: dateStr }
  };
}

/**
 * Get SQL condition for date range (timezone independent)
 * @param dateField - Database field name
 * @param startDate - Start date
 * @param endDate - End date
 * @returns SQL condition string and parameters
 */
export function getDateRangeConditionSQL(dateField: string, startDate?: Date | string, endDate?: Date | string) {
  const conditions: string[] = [];
  const params: any = {};
  
  if (startDate) {
    conditions.push(`DATE(${dateField}) >= :startDate`);
    params.startDate = normalizeDateToString(startDate);
  }
  
  if (endDate) {
    conditions.push(`DATE(${dateField}) <= :endDate`);
    params.endDate = normalizeDateToString(endDate);
  }
  
  return {
    condition: conditions.join(' AND '),
    params
  };
}
