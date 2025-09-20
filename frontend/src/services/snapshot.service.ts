// Snapshot Service for CR-006 Asset Snapshot System

import { apiService } from './api';
import {
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
} from '../types/snapshot.types';

export class SnapshotService {
  private baseUrl = '/snapshots';

  // Get all snapshots with optional filters
  async getSnapshots(params?: SnapshotQueryParams): Promise<SnapshotResponse[]> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await apiService.api.get(`${this.baseUrl}?${queryParams.toString()}`);
    return response.data;
  }

  // Get paginated snapshots
  async getSnapshotsPaginated(params?: SnapshotQueryParams): Promise<PaginatedSnapshotResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await apiService.api.get(`${this.baseUrl}/paginated?${queryParams.toString()}`);
    return response.data;
  }

  // Get snapshot by ID
  async getSnapshotById(id: string): Promise<SnapshotResponse> {
    const response = await apiService.api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Create new snapshot
  async createSnapshot(data: CreateSnapshotRequest): Promise<SnapshotResponse> {
    const response = await apiService.api.post(this.baseUrl, data);
    return response.data;
  }

  // Create portfolio snapshots
  async createPortfolioSnapshots(
    portfolioId: string,
    snapshotDate?: string,
    granularity?: string,
    createdBy?: string
  ): Promise<SnapshotResponse[]> {
    const queryParams = new URLSearchParams();
    
    if (snapshotDate) queryParams.append('snapshotDate', snapshotDate);
    if (granularity) queryParams.append('granularity', granularity);
    if (createdBy) queryParams.append('createdBy', createdBy);

    const response = await apiService.api.post(
      `${this.baseUrl}/portfolio/${portfolioId}?${queryParams.toString()}`
    );
    return response.data;
  }

  // Update snapshot
  async updateSnapshot(id: string, data: UpdateSnapshotRequest): Promise<SnapshotResponse> {
    const response = await apiService.api.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Recalculate snapshot
  async recalculateSnapshot(id: string): Promise<SnapshotResponse> {
    const response = await apiService.api.put(`${this.baseUrl}/${id}/recalculate`);
    return response.data;
  }

  // Bulk recalculate snapshots
  async bulkRecalculateSnapshots(
    portfolioId: string,
    snapshotDate?: string
  ): Promise<BulkRecalculateResponse> {
    const queryParams = new URLSearchParams();
    if (snapshotDate) queryParams.append('snapshotDate', snapshotDate);

    const response = await apiService.api.post(
      `${this.baseUrl}/bulk-recalculate/${portfolioId}?${queryParams.toString()}`
    );
    return response.data;
  }

  // Delete snapshot (soft delete)
  async deleteSnapshot(id: string): Promise<void> {
    await apiService.api.delete(`${this.baseUrl}/${id}`);
  }

  // Hard delete snapshot
  async hardDeleteSnapshot(id: string): Promise<void> {
    await apiService.api.delete(`${this.baseUrl}/${id}/hard`);
  }

  // Get timeline data
  async getTimelineData(query: SnapshotTimelineQuery): Promise<SnapshotResponse[]> {
    const queryParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiService.api.get(`${this.baseUrl}/timeline?${queryParams.toString()}`);
    return response.data;
  }

  // Get aggregated timeline data
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

    const response = await apiService.api.get(`${this.baseUrl}/timeline/aggregated?${queryParams.toString()}`);
    return response.data;
  }

  // Get latest snapshot for portfolio
  async getLatestSnapshot(
    portfolioId: string,
    assetId?: string,
    granularity?: string
  ): Promise<SnapshotResponse | null> {
    const queryParams = new URLSearchParams();
    if (assetId) queryParams.append('assetId', assetId);
    if (granularity) queryParams.append('granularity', granularity);

    const response = await apiService.api.get(
      `${this.baseUrl}/latest/${portfolioId}?${queryParams.toString()}`
    );
    return response.data;
  }

  // Get snapshot statistics
  async getSnapshotStatistics(portfolioId: string): Promise<SnapshotStatistics> {
    const response = await apiService.api.get(`${this.baseUrl}/statistics/${portfolioId}`);
    return response.data;
  }

  // Cleanup old snapshots
  async cleanupOldSnapshots(portfolioId?: string): Promise<CleanupResponse> {
    const queryParams = new URLSearchParams();
    if (portfolioId) queryParams.append('portfolioId', portfolioId);

    const response = await apiService.api.post(`${this.baseUrl}/cleanup?${queryParams.toString()}`);
    return response.data;
  }

  // Delete snapshots by date range
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

    const response = await apiService.api.delete(
      `${this.baseUrl}/portfolio/${portfolioId}/date-range?${queryParams.toString()}`
    );
    return response.data;
  }

  // Delete snapshots by specific date
  async deleteSnapshotsByDate(
    portfolioId: string,
    snapshotDate: string,
    granularity?: string
  ): Promise<{ deletedCount: number; message: string }> {
    const queryParams = new URLSearchParams();
    queryParams.append('snapshotDate', snapshotDate);
    if (granularity) queryParams.append('granularity', granularity);

    const response = await apiService.api.delete(
      `${this.baseUrl}/portfolio/${portfolioId}/date?${queryParams.toString()}`
    );
    return response.data;
  }

  // Delete snapshots by granularity
  async deleteSnapshotsByGranularity(
    portfolioId: string,
    granularity: string
  ): Promise<{ deletedCount: number; message: string }> {
    const response = await apiService.api.delete(
      `${this.baseUrl}/portfolio/${portfolioId}/granularity/${granularity}`
    );
    return response.data;
  }

  // Get portfolios that have snapshots
  async getPortfoliosWithSnapshots(): Promise<{ portfolioId: string; portfolioName: string; snapshotCount: number; latestSnapshotDate: string; oldestSnapshotDate: string }[]> {
    const response = await apiService.api.get(`${this.baseUrl}/portfolios`);
    return response.data;
  }
}

// Export singleton instance
export const snapshotService = new SnapshotService();
