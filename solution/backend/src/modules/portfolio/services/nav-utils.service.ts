import { Injectable } from '@nestjs/common';

/**
 * Utility service for NAV-related calculations and validations
 */
@Injectable()
export class NavUtilsService {
  /**
   * Check if NAV per unit is stale (older than 1 day)
   * @param lastNavDate - The last NAV date to check
   * @returns boolean - true if stale, false if fresh
   */
  isNavPerUnitStale(lastNavDate: Date): boolean {
    if (!lastNavDate) {
      return true; // Consider stale if no NAV date
    }
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    
    return lastNavDate <= oneDayAgo; // Use <= to include exactly 1 day ago
  }

  /**
   * Check if NAV per unit value is valid
   * @param navPerUnit - The NAV per unit value to check
   * @returns boolean - true if valid, false if invalid
   */
  isNavPerUnitValid(navPerUnit: number): boolean {
    return navPerUnit > 0;
  }

  /**
   * Check if NAV per unit should use DB value or calculate real-time
   * @param navPerUnit - Current NAV per unit value
   * @param lastNavDate - Last NAV date
   * @returns boolean - true if should use DB value, false if should calculate real-time
   */
  shouldUseDbNavPerUnit(navPerUnit: number, lastNavDate: Date): boolean {
    return this.isNavPerUnitValid(navPerUnit) && !this.isNavPerUnitStale(lastNavDate);
  }
}
