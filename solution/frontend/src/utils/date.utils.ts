/**
 * Date normalization utilities to handle timezone issues
 * Provides unified function to normalize dates for DatePicker components
 */


/**
 * Universal date normalization function
 * Automatically handles conversion between ISO strings and Date objects
 * 
 * @param input - Date string (ISO format), Date object, or null/undefined
 * @param options - Optional configuration
 * @returns 
 *   - If input is string/null: Returns Date object (for DatePicker value)
 *     Use { output: 'iso' } to force ISO string output
 *   - If input is Date: Returns ISO string (for form submission)
 * 
 * @example
 * // Parse ISO string to Date (for DatePicker value)
 * normalizeDate('2025-08-29T14:10:35.382Z') 
 * // Returns: Date object for Aug 29, 2025 00:00:00 local
 * 
 * // Parse ISO string to normalized ISO string (with current time)
 * normalizeDate('2025-08-29T14:10:35.382Z', { output: 'iso' })
 * // Returns: '2025-08-29T07:30:00.000Z' (normalized with current time)
 * 
 * // Format Date to ISO with current time (for form submission)
 * normalizeDate(new Date(2025, 7, 29)) 
 * // Returns: '2025-08-29T07:30:00.000Z' (assuming GMT+7, current time is 14:30)
 * 
 * // Format Date to ISO without time
 * normalizeDate(new Date(2025, 7, 29), { includeTime: false }) 
 * // Returns: '2025-08-29T00:00:00.000Z'
 */
export interface NormalizeDateOptions {
  /**
   * When converting to ISO string, determines if time should be included
   * - true: Uses current time (default)
   * - false: Uses 00:00:00 UTC (date only)
   */
  includeTime?: boolean;
  
  /**
   * Force output type when input is string
   * - undefined: Return Date object (default for string input)
   * - 'iso': Return ISO string (normalize string → Date → ISO string)
   */
  output?: 'iso-string' | 'iso';
}

export function normalizeDate(
  input: string | Date | null | undefined,
  options: NormalizeDateOptions = {}
): Date | string {
  const { includeTime = true, output } = options;

  // Case 1: Input is string, null, or undefined
  if (typeof input === 'string' || input === null || input === undefined) {
    const dateObject = parseDateToLocal(input);
    
    // If output is forced to 'iso', convert to ISO string
    if (output === 'iso' || output === 'iso-string') {
      return formatDateToISO(dateObject, includeTime);
    }
    
    // Default: return Date object (for DatePicker)
    return dateObject;
  }

  // Case 2: Input is Date object → Return ISO string (for form submission)
  if (input instanceof Date) {
    return formatDateToISO(input, includeTime);
  }

  // Fallback: return current date
  return new Date();
}

/**
 * Parse date string to local Date object (date only, no time component)
 * Internal helper function
 */
function parseDateToLocal(dateString: string | null | undefined): Date {
  if (!dateString) return new Date();
  
  // Extract date part (YYYY-MM-DD) directly from ISO string to avoid timezone issues
  // Handles formats like "2025-08-29T14:10:35.382Z" or "2025-08-29"
  const datePart = dateString.split('T')[0]; // Get "YYYY-MM-DD" part
  const [year, month, day] = datePart.split('-').map(Number);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    // Fallback: try parsing with Date constructor if format doesn't match
    const parsed = new Date(dateString);
    const date = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // Create date with local time at 00:00:00 using extracted year, month, day
  // month is 0-indexed in Date constructor, so subtract 1
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Format Date object to ISO string
 * Internal helper function
 */
function formatDateToISO(date: Date, includeTime: boolean): string {
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  // Get selected date components (year, month, day from DatePicker)
  const selectedYear = date.getFullYear();
  const selectedMonth = date.getMonth();
  const selectedDay = date.getDate();

  if (!includeTime) {
    // Return date-only ISO string (00:00:00 UTC)
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T00:00:00.000Z`;
  }

  // Get current time components (hours, minutes, seconds, milliseconds)
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  const currentMilliseconds = now.getMilliseconds();

  // Create new Date object with selected date + current time in local timezone
  const dateWithCurrentTime = new Date(
    selectedYear,
    selectedMonth,
    selectedDay,
    currentHours,
    currentMinutes,
    currentSeconds,
    currentMilliseconds
  );

  // Convert to ISO string (this will convert local time to UTC correctly)
  return dateWithCurrentTime.toISOString();
}
