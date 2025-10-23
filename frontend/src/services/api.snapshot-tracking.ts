import { apiService } from './api';

export interface SnapshotTrackingRecord {
  id: string;
  executionId: string;
  portfolioId?: string;
  portfolioName?: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  type: 'automated' | 'manual' | 'test';
  startedAt: string;
  completedAt?: string;
  totalSnapshots: number;
  successfulSnapshots: number;
  failedSnapshots: number;
  executionTimeMs: number;
  totalPortfolios?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  cronExpression?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalSnapshots: number;
  successRate: number;
}

export interface TrackingFilters {
  status?: string;
  type?: string;
  portfolioId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  page?: number;
}

export interface TrackingResponse {
  success: boolean;
  data: SnapshotTrackingRecord[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TrackingStatsResponse {
  success: boolean;
  data: TrackingStats;
}

export interface DashboardData {
  recentRecords: SnapshotTrackingRecord[];
  stats: TrackingStats;
  failedRecords: SnapshotTrackingRecord[];
  lastUpdated: string;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export class SnapshotTrackingApiService {
  /**
   * Get tracking records with filters
   */
  static async getTrackingRecords(filters: TrackingFilters = {}): Promise<TrackingResponse> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.portfolioId) params.append('portfolioId', filters.portfolioId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const response = await apiService.api.get(`/api/v1/snapshot-tracking?${params.toString()}`);
    return response.data;
  }

  /**
   * Get tracking record by execution ID
   */
  static async getTrackingByExecutionId(executionId: string): Promise<{
    success: boolean;
    data: SnapshotTrackingRecord | null;
    message?: string;
  }> {
    const response = await apiService.api.get(`/api/v1/snapshot-tracking/execution/${executionId}`);
    return response.data;
  }

  /**
   * Get execution summary
   */
  static async getExecutionSummary(executionId: string): Promise<{
    success: boolean;
    data: {
      execution: SnapshotTrackingRecord | null;
      portfolioRecords: SnapshotTrackingRecord[];
    };
  }> {
    const response = await apiService.api.get(`/api/v1/snapshot-tracking/execution/${executionId}/summary`);
    return response.data;
  }

  /**
   * Get tracking statistics
   */
  static async getTrackingStats(
    startDate?: string,
    endDate?: string
  ): Promise<TrackingStatsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiService.api.get(`/api/v1/snapshot-tracking/stats?${params.toString()}`);
    return response.data;
  }

  /**
   * Get recent tracking records
   */
  static async getRecentTracking(limit: number = 10): Promise<{
    success: boolean;
    data: SnapshotTrackingRecord[];
  }> {
    const response = await apiService.api.get(`/api/v1/snapshot-tracking/recent?limit=${limit}`);
    return response.data;
  }

  /**
   * Get tracking records by portfolio
   */
  static async getTrackingByPortfolio(
    portfolioId: string,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data: SnapshotTrackingRecord[];
  }> {
    const response = await apiService.api.get(`/api/v1/snapshot-tracking/portfolio/${portfolioId}?limit=${limit}`);
    return response.data;
  }

  /**
   * Get failed tracking records
   */
  static async getFailedTracking(limit: number = 20): Promise<{
    success: boolean;
    data: SnapshotTrackingRecord[];
  }> {
    const response = await apiService.api.get(`/api/v1/snapshot-tracking/failed?limit=${limit}`);
    return response.data;
  }

  /**
   * Get dashboard data
   */
  static async getDashboardData(): Promise<DashboardResponse> {
    const response = await apiService.api.get('/api/v1/snapshot-tracking/dashboard');
    return response.data;
  }

  /**
   * Clean up old tracking records
   */
  static async cleanupOldRecords(daysToKeep: number = 30): Promise<{
    success: boolean;
    message: string;
    data: { deletedCount: number };
  }> {
    const response = await apiService.api.post(`/api/v1/snapshot-tracking/cleanup?daysToKeep=${daysToKeep}`);
    return response.data;
  }
}
