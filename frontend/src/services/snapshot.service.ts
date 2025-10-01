// Unified Snapshot Service - Merged from snapshot.service.ts and performance-snapshot.service.ts
// Handles both basic snapshots and performance snapshots

import axios, { AxiosResponse } from 'axios';
import { apiService } from './api';

// Import types from unified snapshot system
import {
  // Basic Snapshot Types
  SnapshotResponse,
  CreateSnapshotRequest,
  UpdateSnapshotRequest,
  SnapshotQueryParams,
  PaginatedSnapshotResponse,
  SnapshotStatistics,
  SnapshotAggregation,
  SnapshotTimelineQuery,
  BulkRecalculateResponse,
  CleanupResponse,
  
  // Performance Snapshot Types
  PerformanceSnapshotResult,
  CreatePerformanceSnapshotDto,
  PerformanceSnapshotQueryDto,
  PortfolioPerformanceSnapshot,
  AssetPerformanceSnapshot,
  AssetGroupPerformanceSnapshot,
  PortfolioPerformanceSummary,
  AssetPerformanceSummary,
  AssetGroupPerformanceSummary,
  PerformanceSnapshotExport,
  
  // Unified Types
  SnapshotGranularity,
} from '../types/snapshot.types';

export class UnifiedSnapshotService {
  private readonly basicSnapshotUrl = `/api/v1/snapshots`;
  private readonly performanceSnapshotUrl = `/api/v1/performance-snapshots`;

  // ============================================================================
  // BASIC SNAPSHOT OPERATIONS (from original snapshot.service.ts)
  // ============================================================================

  /**
   * Get all snapshots with optional filters
   */
  async getSnapshots(params?: SnapshotQueryParams, accountId?: string): Promise<SnapshotResponse[]> {
    const queryParams = new URLSearchParams();
    
    // Add accountId first
    if (accountId) {
      queryParams.append('accountId', accountId);
    }
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return await apiService.getSnapshots(params, accountId);
  }

  /**
   * Get paginated snapshots
   */
  async getSnapshotsPaginated(params?: SnapshotQueryParams, accountId?: string): Promise<PaginatedSnapshotResponse> {
    const queryParams = new URLSearchParams();
    
    // Add accountId first
    if (accountId) {
      queryParams.append('accountId', accountId);
    }
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return await apiService.getSnapshotsPaginated(params, accountId);
  }

  /**
   * Get portfolio snapshots with pagination
   */
  async getPortfolioSnapshotsPaginated(
    portfolioId: string,
    options?: { page?: number; limit?: number; startDate?: string; endDate?: string; granularity?: string; isActive?: boolean; orderBy?: string; orderDirection?: 'ASC' | 'DESC' }
  ): Promise<{ success: boolean; data: SnapshotResponse[]; count: number; page?: number; limit?: number; total?: number; totalPages?: number; hasNext?: boolean; hasPrev?: boolean }> {
    const params = new URLSearchParams();
    params.append('portfolioId', portfolioId);
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.granularity) params.append('granularity', options.granularity);
    if (options?.isActive !== undefined) params.append('isActive', options.isActive.toString());
    if (options?.orderBy) params.append('orderBy', options.orderBy);
    if (options?.orderDirection) params.append('orderDirection', options.orderDirection);

    return await apiService.getPortfolioSnapshotsPaginated(portfolioId, options);
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshotById(id: string): Promise<SnapshotResponse> {
    return await apiService.getSnapshotById(id);
  }

  /**
   * Create new snapshot
   */
  async createSnapshot(data: CreateSnapshotRequest): Promise<SnapshotResponse> {
    return await apiService.createSnapshot(data);
  }

  /**
   * Create portfolio snapshots (supports both single date and date range)
   */
  async createPortfolioSnapshots(
    portfolioId: string,
    options: {
      startDate?: string;
      endDate?: string;
      granularity?: string;
      createdBy?: string;
    } = {}
  ): Promise<{
    message: string;
    assetSnapshots: SnapshotResponse[];
    portfolioSnapshot: any;
    assetCount: number;
    totalSnapshots: number;
    datesProcessed: string[];
  }> {
    return await apiService.createPortfolioSnapshots(portfolioId, options);
  }

  /**
   * Update snapshot
   */
  async updateSnapshot(id: string, data: UpdateSnapshotRequest): Promise<SnapshotResponse> {
    return await apiService.updateSnapshot(id, data);
  }

  /**
   * Recalculate snapshot
   */
  async recalculateSnapshot(id: string): Promise<SnapshotResponse> {
    const response = await apiService.api.put(`${this.basicSnapshotUrl}/${id}/recalculate`);
    return response.data;
  }

  /**
   * Bulk recalculate snapshots
   */
  async bulkRecalculateSnapshots(
    portfolioId: string,
    snapshotDate?: string
  ): Promise<BulkRecalculateResponse> {
    const queryParams = new URLSearchParams();
    if (snapshotDate) queryParams.append('snapshotDate', snapshotDate);

    return await apiService.bulkRecalculateSnapshots(portfolioId, snapshotDate);
  }

  /**
   * Delete snapshot (soft delete)
   */
  async deleteSnapshot(id: string): Promise<void> {
    await apiService.deleteSnapshot(id);
  }

  /**
   * Hard delete snapshot
   */
  async hardDeleteSnapshot(id: string): Promise<void> {
    await apiService.api.delete(`${this.basicSnapshotUrl}/${id}/hard`);
  }

  /**
   * Get timeline data
   */
  async getTimelineData(query: SnapshotTimelineQuery): Promise<SnapshotResponse[]> {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.api.get(`${this.basicSnapshotUrl}/timeline?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get aggregated timeline data
   */
  async getAggregatedTimelineData(
    portfolioId: string,
    startDate: string,
    endDate: string,
    granularity?: string
  ): Promise<SnapshotAggregation[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('portfolioId', portfolioId);
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    if (granularity) queryParams.append('granularity', granularity);

    const response = await apiService.api.get(`${this.basicSnapshotUrl}/timeline/aggregated?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Get latest snapshot for portfolio
   */
  async getLatestSnapshot(
    portfolioId: string,
    assetId?: string,
    granularity?: string
  ): Promise<SnapshotResponse | null> {
    const queryParams = new URLSearchParams();
    if (assetId) queryParams.append('assetId', assetId);
    if (granularity) queryParams.append('granularity', granularity);

    const response = await apiService.api.get(
      `${this.basicSnapshotUrl}/latest/${portfolioId}?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Get snapshot statistics
   */
  async getSnapshotStatistics(portfolioId: string): Promise<SnapshotStatistics> {
    return await apiService.getSnapshotStatistics(portfolioId);
  }

  /**
   * Cleanup old snapshots
   */
  async cleanupOldSnapshots(portfolioId?: string): Promise<CleanupResponse> {
    const queryParams = new URLSearchParams();
    if (portfolioId) queryParams.append('portfolioId', portfolioId);

    const response = await apiService.api.post(`${this.basicSnapshotUrl}/cleanup?${queryParams.toString()}`);
    return response.data;
  }

  /**
   * Delete snapshots by date range
   */
  async deleteSnapshotsByDateRange(
    portfolioId: string,
    startDate: string,
    endDate: string,
    granularity?: string
  ): Promise<{ deletedCount: number; message: string }> {
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    if (granularity) queryParams.append('granularity', granularity);

    return await apiService.deleteSnapshotsByDateRange(portfolioId, startDate, endDate, granularity);
  }

  /**
   * Delete snapshots by specific date
   */
  async deleteSnapshotsByDate(
    portfolioId: string,
    snapshotDate: string,
    granularity?: string
  ): Promise<{ deletedCount: number; message: string }> {
    const queryParams = new URLSearchParams();
    queryParams.append('snapshotDate', snapshotDate);
    if (granularity) queryParams.append('granularity', granularity);

    return await apiService.deleteSnapshotsByDate(portfolioId, snapshotDate, granularity);
  }

  /**
   * Delete snapshots by granularity
   */
  async deleteSnapshotsByGranularity(
    portfolioId: string,
    granularity: string
  ): Promise<{ deletedCount: number; message: string }> {
    const response = await apiService.api.delete(
      `${this.basicSnapshotUrl}/portfolio/${portfolioId}/granularity/${granularity}`
    );
    return response.data;
  }

  /**
   * Get portfolios that have snapshots
   */
  async getPortfoliosWithSnapshots(): Promise<{ 
    portfolioId: string; 
    portfolioName: string; 
    snapshotCount: number; 
    latestSnapshotDate: string; 
    oldestSnapshotDate: string; 
  }[]> {
    return await apiService.getPortfoliosWithSnapshots();
  }

  // ============================================================================
  // PERFORMANCE SNAPSHOT OPERATIONS (from performance-snapshot.service.ts)
  // ============================================================================

  /**
   * Create performance snapshots for a portfolio
   */
  async createPerformanceSnapshots(dto: CreatePerformanceSnapshotDto): Promise<PerformanceSnapshotResult> {
    return await apiService.createPerformanceSnapshots(dto);
  }

  /**
   * Get portfolio performance snapshots
   */
  async getPortfolioPerformanceSnapshots(
    portfolioId: string,
    query?: PerformanceSnapshotQueryDto
  ): Promise<PortfolioPerformanceSnapshot[]> {
    const params = new URLSearchParams();
    
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }

    return await apiService.getPortfolioPerformanceSnapshots(portfolioId, query);
  }

  /**
   * Get portfolio performance snapshots with pagination
   */
  async getPortfolioPerformanceSnapshotsPaginated(
    portfolioId: string,
    query?: PerformanceSnapshotQueryDto & { page?: number; limit?: number }
  ): Promise<{ data: PortfolioPerformanceSnapshot[]; page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }> {
    const params = new URLSearchParams();
    
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }
    if (query?.page) {
      params.append('page', query.page.toString());
    }
    if (query?.limit) {
      params.append('limit', query.limit.toString());
    }

    return await apiService.getPortfolioPerformanceSnapshots(portfolioId, query);
  }

  /**
   * Get asset performance snapshots
   */
  async getAssetPerformanceSnapshots(
    portfolioId: string,
    query?: PerformanceSnapshotQueryDto
  ): Promise<AssetPerformanceSnapshot[]> {
    const params = new URLSearchParams();
    
    if (query?.assetId) {
      params.append('assetId', query.assetId);
    }
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }

    return await apiService.getAssetPerformanceSnapshots(portfolioId, query);
  }

  /**
   * Get asset performance snapshots with pagination
   */
  async getAssetPerformanceSnapshotsPaginated(
    portfolioId: string,
    query?: PerformanceSnapshotQueryDto & { page?: number; limit?: number }
  ): Promise<{ data: AssetPerformanceSnapshot[]; page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }> {
    const params = new URLSearchParams();
    
    if (query?.assetId) {
      params.append('assetId', query.assetId);
    }
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }
    if (query?.page) {
      params.append('page', query.page.toString());
    }
    if (query?.limit) {
      params.append('limit', query.limit.toString());
    }

    return await apiService.getAssetPerformanceSnapshots(portfolioId, query);
  }

  /**
   * Get asset group performance snapshots
   */
  async getAssetGroupPerformanceSnapshots(
    portfolioId: string,
    query?: PerformanceSnapshotQueryDto
  ): Promise<AssetGroupPerformanceSnapshot[]> {
    const params = new URLSearchParams();
    
    if (query?.assetType) {
      params.append('assetType', query.assetType);
    }
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }

    const response: AxiosResponse<AssetGroupPerformanceSnapshot[]> = await axios.get(
      `${this.performanceSnapshotUrl}/group/${portfolioId}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get asset group performance snapshots with pagination
   */
  async getAssetGroupPerformanceSnapshotsPaginated(
    portfolioId: string,
    query?: PerformanceSnapshotQueryDto & { page?: number; limit?: number }
  ): Promise<{ data: AssetGroupPerformanceSnapshot[]; page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }> {
    const params = new URLSearchParams();
    
    if (query?.assetType) {
      params.append('assetType', query.assetType);
    }
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }
    if (query?.page) {
      params.append('page', query.page.toString());
    }
    if (query?.limit) {
      params.append('limit', query.limit.toString());
    }

    const response: AxiosResponse<{ data: AssetGroupPerformanceSnapshot[]; page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }> = await axios.get(
      `${this.performanceSnapshotUrl}/group/${portfolioId}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get portfolio performance summary
   */
  async getPortfolioPerformanceSummary(
    portfolioId: string,
    period: string = '1Y'
  ): Promise<PortfolioPerformanceSummary> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    return await apiService.getPortfolioPerformanceSummary(portfolioId, period);
  }

  /**
   * Get asset performance summary
   */
  async getAssetPerformanceSummary(
    portfolioId: string,
    query?: { assetId?: string; period?: string }
  ): Promise<AssetPerformanceSummary> {
    const params = new URLSearchParams();
    
    if (query?.assetId) {
      params.append('assetId', query.assetId);
    }
    if (query?.period) {
      params.append('period', query.period);
    }

    return await apiService.getAssetPerformanceSummary(portfolioId, query);
  }

  /**
   * Get asset group performance summary
   */
  async getAssetGroupPerformanceSummary(
    portfolioId: string,
    query?: { assetType?: string; period?: string }
  ): Promise<AssetGroupPerformanceSummary> {
    const params = new URLSearchParams();
    
    if (query?.assetType) {
      params.append('assetType', query.assetType);
    }
    if (query?.period) {
      params.append('period', query.period);
    }

    const response: AxiosResponse<AssetGroupPerformanceSummary> = await axios.get(
      `${this.performanceSnapshotUrl}/group/${portfolioId}/summary?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Delete performance snapshots by date range
   */
  async deletePerformanceSnapshotsByDateRange(
    portfolioId: string,
    startDate: string,
    endDate: string,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    if (granularity) {
      params.append('granularity', granularity);
    }

    return await apiService.deletePerformanceSnapshotsByDateRange(portfolioId, startDate, endDate, granularity);
  }

  /**
   * Export performance snapshots
   */
  async exportPerformanceSnapshots(
    portfolioId: string,
    query?: PerformanceSnapshotQueryDto
  ): Promise<PerformanceSnapshotExport> {
    const params = new URLSearchParams();
    
    if (query?.startDate) {
      params.append('startDate', query.startDate);
    }
    if (query?.endDate) {
      params.append('endDate', query.endDate);
    }
    if (query?.granularity) {
      params.append('granularity', query.granularity);
    }

    return await apiService.exportPerformanceSnapshots(portfolioId, query);
  }

  /**
   * Get performance metrics for dashboard
   */
  async getPerformanceDashboardData(portfolioId: string): Promise<any> {
    return await apiService.getPerformanceDashboardData(portfolioId);
  }

  /**
   * Get performance comparison data
   */
  async getPerformanceComparison(
    portfolioId: string,
    benchmarkId: string,
    period: string = '1Y'
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('benchmarkId', benchmarkId);
    params.append('period', period);

    return await apiService.getPerformanceComparison(portfolioId, benchmarkId, period);
  }

  /**
   * Get risk analysis data
   */
  async getRiskAnalysis(portfolioId: string, period: string = '1Y'): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);

    return await apiService.getRiskAnalysis(portfolioId, period);
  }

  /**
   * Get performance attribution data
   */
  async getPerformanceAttribution(
    portfolioId: string,
    period: string = '1Y'
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);

    return await apiService.getPerformanceAttribution(portfolioId, period);
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    portfolioId: string,
    metric: string,
    period: string = '1Y'
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('metric', metric);
    params.append('period', period);

    return await apiService.getPerformanceTrends(portfolioId, metric, period);
  }

  /**
   * Get benchmark data
   */
  async getBenchmarkData(
    benchmarkId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }

    return await apiService.getBenchmarkData(benchmarkId, startDate, endDate);
  }

  /**
   * Get available benchmarks
   */
  async getAvailableBenchmarks(): Promise<any[]> {
    return await apiService.getAvailableBenchmarks();
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(portfolioId: string): Promise<any[]> {
    return await apiService.getPerformanceAlerts(portfolioId);
  }

  /**
   * Create performance alert
   */
  async createPerformanceAlert(portfolioId: string, alert: any): Promise<any> {
    return await apiService.createPerformanceAlert(portfolioId, alert);
  }

  /**
   * Update performance alert
   */
  async updatePerformanceAlert(portfolioId: string, alertId: string, alert: any): Promise<any> {
    return await apiService.updatePerformanceAlert(portfolioId, alertId, alert);
  }

  /**
   * Delete performance alert
   */
  async deletePerformanceAlert(portfolioId: string, alertId: string): Promise<any> {
    return await apiService.deletePerformanceAlert(portfolioId, alertId);
  }

  // ============================================================================
  // UNIFIED UTILITY METHODS
  // ============================================================================

  /**
   * Get all snapshot types for a portfolio (both basic and performance)
   */
  async getAllSnapshotsForPortfolio(
    portfolioId: string,
    startDate?: string,
    endDate?: string,
    granularity?: string
  ): Promise<{
    basicSnapshots: SnapshotResponse[];
    performanceSnapshots: PortfolioPerformanceSnapshot[];
    assetSnapshots: AssetPerformanceSnapshot[];
    groupSnapshots: AssetGroupPerformanceSnapshot[];
  }> {
    const [basicSnapshots, performanceSnapshots, assetSnapshots, groupSnapshots] = await Promise.all([
      this.getSnapshots({
        portfolioId,
        startDate,
        endDate,
        granularity: granularity as SnapshotGranularity,
      }),
      this.getPortfolioPerformanceSnapshots(portfolioId, {
        startDate,
        endDate,
        granularity: granularity as SnapshotGranularity,
      }),
      this.getAssetPerformanceSnapshots(portfolioId, {
        startDate,
        endDate,
        granularity: granularity as SnapshotGranularity,
      }),
      this.getAssetGroupPerformanceSnapshots(portfolioId, {
        startDate,
        endDate,
        granularity: granularity as SnapshotGranularity,
      }),
    ]);

    return {
      basicSnapshots,
      performanceSnapshots,
      assetSnapshots,
      groupSnapshots,
    };
  }

  /**
   * Create both basic and performance snapshots for a portfolio
   */
  async createAllSnapshotsForPortfolio(
    portfolioId: string,
    snapshotDate: string,
    granularity: string = 'DAILY',
    createdBy?: string
  ): Promise<{
    basicSnapshots: SnapshotResponse[];
    performanceSnapshots: PerformanceSnapshotResult;
  }> {
    const [basicSnapshotsResult, performanceSnapshots] = await Promise.all([
      this.createPortfolioSnapshots(portfolioId, { startDate: snapshotDate, granularity, createdBy }),
      this.createPerformanceSnapshots({
        portfolioId,
        snapshotDate,
        granularity: granularity as SnapshotGranularity,
        createdBy,
      }),
    ]);

    return {
      basicSnapshots: basicSnapshotsResult.assetSnapshots,
      performanceSnapshots,
    };
  }

  /**
   * Delete all snapshot types for a portfolio by date range
   */
  async deleteAllSnapshotsByDateRange(
    portfolioId: string,
    startDate: string,
    endDate: string,
    granularity?: string
  ): Promise<{
    basicDeleted: { deletedCount: number; message: string };
    performanceDeleted: { deletedCount: number; message: string };
  }> {
    const [basicDeleted, performanceDeleted] = await Promise.all([
      this.deleteSnapshotsByDateRange(portfolioId, startDate, endDate, granularity),
      this.deletePerformanceSnapshotsByDateRange(
        portfolioId,
        startDate,
        endDate,
        granularity as SnapshotGranularity
      ),
    ]);

    return {
      basicDeleted,
      performanceDeleted,
    };
  }

  /**
   * Get comprehensive portfolio analysis (combines both snapshot types)
   */
  async getComprehensivePortfolioAnalysis(
    portfolioId: string,
    period: string = '1Y'
  ): Promise<{
    basicStatistics: SnapshotStatistics;
    performanceSummary: PortfolioPerformanceSummary;
    assetSummary: AssetPerformanceSummary;
    groupSummary: AssetGroupPerformanceSummary;
    riskAnalysis: any;
    performanceTrends: any;
  }> {
    const [
      basicStatistics,
      performanceSummary,
      assetSummary,
      groupSummary,
      riskAnalysis,
      performanceTrends,
    ] = await Promise.all([
      this.getSnapshotStatistics(portfolioId),
      this.getPortfolioPerformanceSummary(portfolioId, period),
      this.getAssetPerformanceSummary(portfolioId, { period }),
      this.getAssetGroupPerformanceSummary(portfolioId, { period }),
      this.getRiskAnalysis(portfolioId, period),
      this.getPerformanceTrends(portfolioId, 'twr', period),
    ]);

    return {
      basicStatistics,
      performanceSummary,
      assetSummary,
      groupSummary,
      riskAnalysis,
      performanceTrends,
    };
  }
}

// Export singleton instance
export const snapshotService = new UnifiedSnapshotService();

// Export individual service instances for backward compatibility
export const performanceSnapshotService = snapshotService;
