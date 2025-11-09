/**
 * SnapshotGranularity Enum
 * 
 * Defines the granularity levels for asset allocation snapshots.
 * Each granularity level determines how frequently snapshots are taken
 * and how data is aggregated for timeline queries.
 */
export enum SnapshotGranularity {
  /**
   * Daily snapshots
   * - Taken every day at market close
   * - Highest granularity, most detailed data
   * - Used for short-term analysis and daily tracking
   */
  DAILY = 'DAILY',

  /**
   * Weekly snapshots
   * - Taken every week (typically Friday)
   * - Medium granularity, balanced detail and performance
   * - Used for weekly analysis and medium-term tracking
   */
  WEEKLY = 'WEEKLY',

  /**
   * Monthly snapshots
   * - Taken every month (typically last trading day)
   * - Lowest granularity, best performance
   * - Used for long-term analysis and monthly reporting
   */
  MONTHLY = 'MONTHLY',
}

/**
 * SnapshotGranularity Configuration
 * 
 * Provides metadata and configuration for each granularity level.
 */
export const SNAPSHOT_GRANULARITY_CONFIG = {
  [SnapshotGranularity.DAILY]: {
    label: 'Daily',
    description: 'Daily snapshots for detailed tracking',
    frequency: '1 day',
    retentionDays: 365, // 1 year
    aggregationLevel: 'day',
    displayFormat: 'YYYY-MM-DD',
    sortOrder: 1,
  },
  [SnapshotGranularity.WEEKLY]: {
    label: 'Weekly',
    description: 'Weekly snapshots for balanced analysis',
    frequency: '1 week',
    retentionDays: 1095, // 3 years
    aggregationLevel: 'week',
    displayFormat: 'YYYY-[W]WW',
    sortOrder: 2,
  },
  [SnapshotGranularity.MONTHLY]: {
    label: 'Monthly',
    description: 'Monthly snapshots for long-term analysis',
    frequency: '1 month',
    retentionDays: 1825, // 5 years
    aggregationLevel: 'month',
    displayFormat: 'YYYY-MM',
    sortOrder: 3,
  },
} as const;

/**
 * Get granularity configuration
 */
export function getGranularityConfig(granularity: SnapshotGranularity) {
  return SNAPSHOT_GRANULARITY_CONFIG[granularity];
}

/**
 * Get all granularity levels sorted by sort order
 */
export function getAllGranularities(): SnapshotGranularity[] {
  return Object.values(SnapshotGranularity).sort(
    (a, b) => SNAPSHOT_GRANULARITY_CONFIG[a].sortOrder - SNAPSHOT_GRANULARITY_CONFIG[b].sortOrder
  );
}

/**
 * Get granularity by label
 */
export function getGranularityByLabel(label: string): SnapshotGranularity | null {
  const entry = Object.entries(SNAPSHOT_GRANULARITY_CONFIG).find(
    ([_, config]) => config.label.toLowerCase() === label.toLowerCase()
  );
  return entry ? (entry[0] as SnapshotGranularity) : null;
}

/**
 * Check if granularity is valid
 */
export function isValidGranularity(granularity: string): granularity is SnapshotGranularity {
  return Object.values(SnapshotGranularity).includes(granularity as SnapshotGranularity);
}

/**
 * Get next snapshot date based on granularity
 */
export function getNextSnapshotDate(
  currentDate: Date,
  granularity: SnapshotGranularity
): Date {
  const nextDate = new Date(currentDate);
  
  switch (granularity) {
    case SnapshotGranularity.DAILY:
      nextDate.setDate(currentDate.getDate() + 1);
      break;
    case SnapshotGranularity.WEEKLY:
      nextDate.setDate(currentDate.getDate() + 7);
      break;
    case SnapshotGranularity.MONTHLY:
      nextDate.setMonth(currentDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
}

/**
 * Get previous snapshot date based on granularity
 */
export function getPreviousSnapshotDate(
  currentDate: Date,
  granularity: SnapshotGranularity
): Date {
  const previousDate = new Date(currentDate);
  
  switch (granularity) {
    case SnapshotGranularity.DAILY:
      previousDate.setDate(currentDate.getDate() - 1);
      break;
    case SnapshotGranularity.WEEKLY:
      previousDate.setDate(currentDate.getDate() - 7);
      break;
    case SnapshotGranularity.MONTHLY:
      previousDate.setMonth(currentDate.getMonth() - 1);
      break;
  }
  
  return previousDate;
}

/**
 * Format snapshot date based on granularity
 */
export function formatSnapshotDate(
  date: Date,
  granularity: SnapshotGranularity
): string {
  const config = getGranularityConfig(granularity);
  
  switch (granularity) {
    case SnapshotGranularity.DAILY:
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    case SnapshotGranularity.WEEKLY:
      const year = date.getFullYear();
      const week = getWeekNumber(date);
      return `${year}-W${week.toString().padStart(2, '0')}`;
    case SnapshotGranularity.MONTHLY:
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * Get week number of the year
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
