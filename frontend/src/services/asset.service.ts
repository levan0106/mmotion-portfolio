/**
 * Asset Service for Frontend
 * Handles API communication for asset management
 * Uses centralized ApiService for consistency
 */

import { apiService } from './api';
import {
  Asset,
  CreateAssetRequest,
  UpdateAssetRequest,
  AssetFilters,
  PaginatedResponse,
  AssetStatistics,
  AssetAllocation,
  RiskMetrics,
  AssetSummary,
  AssetPerformanceComparison,
  ApiResponse,
  ApiError,
} from '../types/asset.types';

export class AssetService {
  constructor() {
    // Use centralized ApiService instead of direct fetch calls
  }

  /**
   * Helper method to make API calls using centralized ApiService
   */
  private async makeRequest<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, data?: any): Promise<T> {
    try {
      const response = await apiService.api.request({
        method,
        url,
        data,
      });
      return response.data;
    } catch (error) {
      throw this.handleServiceError(error);
    }
  }

  /**
   * Create a new asset
   */
  async createAsset(data: CreateAssetRequest, accountId: string): Promise<Asset> {
    return this.makeRequest<Asset>('POST', `/api/v1/assets?accountId=${accountId}`, data);
  }

  /**
   * Bulk create assets from global assets
   */
  async bulkCreateAssets(globalAssetIds: string[], accountId: string): Promise<{
    created: Asset[];
    failed: Array<{ globalAssetId: string; error: string }>;
    summary: { total: number; created: number; failed: number };
  }> {
    // Bulk create assets from global assets
    return this.makeRequest('POST', `/api/v1/assets/bulk-create?accountId=${accountId}`, {
      globalAssetIds,
    });
  }

  /**
   * Get all assets with filtering and pagination
   */
  async getAssets(filters: AssetFilters = {}, accountId: string): Promise<PaginatedResponse<Asset>> {
    const queryParams = new URLSearchParams();
    
    // Add accountId first
    queryParams.append('accountId', accountId);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/api/v1/assets?${queryParams.toString()}`;
    return this.makeRequest<PaginatedResponse<Asset>>('GET', url);
  }

  /**
   * Get asset by ID
   */
  async getAssetById(id: string): Promise<Asset> {
    return this.makeRequest<Asset>('GET', `/api/v1/assets/${id}`);
  }

  /**
   * Update asset by ID
   */
  async updateAsset(id: string, data: UpdateAssetRequest, accountId: string): Promise<Asset> {
    const result = await this.makeRequest<Asset>('PUT', `/api/v1/assets/${id}?accountId=${accountId}`, data);
    return result;
  }

  /**
   * Delete asset by ID
   */
  async deleteAsset(id: string, accountId: string): Promise<void> {
    await this.makeRequest<void>('DELETE', `/api/v1/assets/${id}?accountId=${accountId}`);
  }

  /**
   * Get assets by portfolio ID
   */
  async getAssetsByPortfolio(
    portfolioId: string,
    filters: Omit<AssetFilters, 'portfolioId'> = {}
  ): Promise<PaginatedResponse<Asset>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/api/v1/assets/portfolio/${portfolioId}?${queryParams.toString()}`;
    return this.makeRequest<PaginatedResponse<Asset>>('GET', url);
  }

  /**
   * Search assets
   */
  async searchAssets(searchTerm: string, portfolioId?: string): Promise<Asset[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', searchTerm);
    
    if (portfolioId) {
      queryParams.append('portfolioId', portfolioId);
    }

    const url = `/api/v1/assets/search?${queryParams.toString()}`;
    const result = await this.makeRequest<ApiResponse<Asset[]>>('GET', url);
    return result.data;
  }

  /**
   * Get asset statistics by portfolio
   */
  async getAssetStatistics(portfolioId: string): Promise<AssetStatistics> {
    const result = await this.makeRequest<ApiResponse<AssetStatistics>>('GET', `/api/v1/assets/portfolio/${portfolioId}/statistics`);
    return result.data;
  }

  /**
   * Get asset analytics summary
   */
  async getAssetAnalytics(portfolioId: string): Promise<AssetSummary> {
    const result = await this.makeRequest<ApiResponse<AssetSummary>>('GET', `/api/v1/assets/portfolio/${portfolioId}/analytics`);
    return result.data;
  }

  /**
   * Get asset performance comparison
   */
  async getAssetPerformance(
    portfolioId: string,
    period: '1M' | '3M' | '6M' | '1Y' | 'ALL' = 'ALL'
  ): Promise<AssetPerformanceComparison> {
    const queryParams = new URLSearchParams();
    queryParams.append('period', period);

    const url = `/api/v1/assets/portfolio/${portfolioId}/performance?${queryParams.toString()}`;
    const result = await this.makeRequest<ApiResponse<AssetPerformanceComparison>>('GET', url);
    return result.data;
  }

  /**
   * Get asset allocation by type
   */
  async getAssetAllocation(portfolioId: string): Promise<AssetAllocation> {
    const result = await this.makeRequest<ApiResponse<AssetAllocation>>('GET', `/api/v1/assets/portfolio/${portfolioId}/allocation`);
    return result.data;
  }

  /**
   * Get available asset types from backend
   */
  async getAssetTypes(): Promise<Array<{
    value: string;
    label: string;
    description: string;
  }>> {
    const result = await this.makeRequest<{ types: Array<{ value: string; label: string; description: string; }> }>('GET', '/api/v1/assets/types');
    return result.types;
  }

  /**
   * Get asset risk metrics
   */
  async getAssetRiskMetrics(portfolioId: string): Promise<RiskMetrics> {
    const result = await this.makeRequest<ApiResponse<RiskMetrics>>('GET', `/api/v1/assets/portfolio/${portfolioId}/risk`);
    return result.data;
  }

  /**
   * Get recent assets
   */
  async getRecentAssets(limit?: number, portfolioId?: string): Promise<Asset[]> {
    const queryParams = new URLSearchParams();
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    if (portfolioId) {
      queryParams.append('portfolioId', portfolioId);
    }

    const url = `/api/v1/assets/recent?${queryParams.toString()}`;
    const result = await this.makeRequest<ApiResponse<Asset[]>>('GET', url);
    return result.data;
  }

  /**
   * Get assets by value range
   */
  async getAssetsByValueRange(
    minValue: number,
    maxValue: number,
    portfolioId?: string
  ): Promise<Asset[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('minValue', minValue.toString());
    queryParams.append('maxValue', maxValue.toString());
    
    if (portfolioId) {
      queryParams.append('portfolioId', portfolioId);
    }

    const url = `/api/v1/assets/value-range?${queryParams.toString()}`;
    const result = await this.makeRequest<ApiResponse<Asset[]>>('GET', url);
    return result.data;
  }

  /**
   * Check if asset exists
   */
  async checkAssetExists(id: string): Promise<boolean> {
    const result = await this.makeRequest<ApiResponse<{ exists: boolean }>>('GET', `/api/v1/assets/${id}/exists`);
    return result.data.exists;
  }

  /**
   * Get asset count by portfolio
   */
  async getAssetCount(portfolioId: string): Promise<number> {
    const result = await this.makeRequest<ApiResponse<{ count: number }>>('GET', `/api/v1/assets/portfolio/${portfolioId}/count`);
    return result.data.count;
  }

  /**
   * Get trade count for an asset
   */
  async getTradeCount(assetId: string): Promise<{ count: number; canDelete: boolean }> {
    const result = await this.makeRequest<{ count: number; canDelete: boolean }>('GET', `/api/v1/assets/${assetId}/trades/count`);
    return result;
  }

  /**
   * Get portfolios and trading info for an asset using the new API endpoint
   */
  async getAssetPortfolioInfo(assetId: string, accountId: string): Promise<{
    portfolios: Array<{ id: string; name: string }>;
    tradingCount: number;
  }> {
    try {
      // Use the new API endpoint that returns portfolio and trade info
      const result = await this.makeRequest<{
        count: number;
        canDelete: boolean;
        portfolios: Array<{ id: string; name: string }>;
        trades: Array<any>;
      }>('GET', `/api/v1/assets/${assetId}/trades/count?accountId=${accountId}`);
      
      return {
        portfolios: result.portfolios || [],
        tradingCount: result.count || 0,
      };
    } catch (error) {
      console.error('Error getting asset portfolio info:', error);
      return {
        portfolios: [],
        tradingCount: 0,
      };
    }
  }

  /**
   * Delete all trades for an asset
   */
  async deleteAllTrades(assetId: string): Promise<number> {
    const result = await this.makeRequest<{ deletedCount: number }>('DELETE', `/api/v1/assets/${assetId}/trades`);
    return result.deletedCount;
  }

  /**
   * Force delete asset (delete trades first, then asset)
   */
  async forceDeleteAsset(assetId: string): Promise<void> {
    await this.makeRequest<void>('DELETE', `/api/v1/assets/${assetId}/force`);
  }

  /**
   * Handle service errors
   */
  private handleServiceError(error: any): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        status: 0,
        code: 'NETWORK_ERROR',
      };
    }

    return error as ApiError;
  }
}

// Export singleton instance
export const assetService = new AssetService();
