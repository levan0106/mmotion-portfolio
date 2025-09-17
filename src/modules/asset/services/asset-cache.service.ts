import { Injectable } from '@nestjs/common';

/**
 * Asset Cache Service
 * Provides caching for computed asset values to improve performance
 */
@Injectable()
export class AssetCacheService {
  private readonly cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();

  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data
   * @param key - Cache key
   * @returns Cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached data
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Delete cached data
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key for asset computed fields
   * @param assetId - Asset ID
   * @returns Cache key
   */
  getAssetComputedFieldsKey(assetId: string): string {
    return `asset:computed:${assetId}`;
  }

  /**
   * Generate cache key for asset trades
   * @param assetId - Asset ID
   * @returns Cache key
   */
  getAssetTradesKey(assetId: string): string {
    return `asset:trades:${assetId}`;
  }

  /**
   * Invalidate cache for an asset
   * @param assetId - Asset ID
   */
  invalidateAsset(assetId: string): void {
    this.delete(this.getAssetComputedFieldsKey(assetId));
    this.delete(this.getAssetTradesKey(assetId));
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
