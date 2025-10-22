import { apiService } from './api';

export interface ApiCallDetail {
  id: string;
  provider: string;
  endpoint: string;
  method: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  symbolsProcessed: number;
  successfulSymbols: number;
  failedSymbols: number;
  requestData?: Record<string, any>;
  responseData?: Record<string, any>;
  startedAt: string;
  completedAt?: string;
}

export interface GlobalAssetTracking {
  id: string;
  executionId: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  type: 'scheduled' | 'manual' | 'triggered';
  source: 'cron_job' | 'api_trigger' | 'manual_trigger' | 'system_recovery';
  startedAt: string;
  completedAt?: string;
  executionTimeMs: number;
  totalSymbols: number;
  successfulUpdates: number;
  failedUpdates: number;
  successRate: number | null;
  totalApis: number;
  successfulApis: number;
  failedApis: number;
  failedSymbols?: string[];
  errorMessage?: string;
  errorCode?: string;
  stackTrace?: string;
  cronExpression?: string;
  timezone?: string;
  autoSyncEnabled: boolean;
  metadata?: Record<string, any>;
  triggeredBy?: string;
  triggerIp?: string;
  apiCalls?: ApiCallDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface GlobalAssetTrackingQuery {
  status?: string;
  type?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface GlobalAssetTrackingResponse {
  data: GlobalAssetTracking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GlobalAssetStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  averageSuccessRate: number;
  lastExecutionTime: string | null;
  successRateTrend: Array<{
    date: string;
    successRate: number;
  }>;
  errorFrequency: Array<{
    errorCode: string;
    count: number;
  }>;
}

export class GlobalAssetTrackingService {
  /**
   * Get tracking records with filtering and pagination
   */
  static async getTrackingRecords(query: GlobalAssetTrackingQuery = {}): Promise<GlobalAssetTrackingResponse> {
    const params = new URLSearchParams();
    
    if (query.status) params.append('status', query.status);
    if (query.type) params.append('type', query.type);
    if (query.source) params.append('source', query.source);
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiService.get(`/api/v1/global-asset-tracking?${params.toString()}`);
    return response;
  }

  /**
   * Get tracking record by execution ID
   */
  static async getTrackingByExecutionId(executionId: string): Promise<GlobalAssetTracking> {
    const response = await apiService.get(`/api/v1/global-asset-tracking/${executionId}`);
    return response.data;
  }

  /**
   * Get tracking statistics
   */
  static async getTrackingStats(days: number = 30): Promise<GlobalAssetStats> {
    const response = await apiService.get(`/api/v1/global-asset-tracking/stats/summary?days=${days}`);
    return response.data;
  }

  /**
   * Get recent tracking records
   */
  static async getRecentTracking(limit: number = 10): Promise<GlobalAssetTracking[]> {
    const response = await apiService.get(`/api/v1/global-asset-tracking/recent/list?limit=${limit}`);
    return response.data;
  }

  /**
   * Get currently running sync operations
   */
  static async getRunningSyncs(): Promise<GlobalAssetTracking[]> {
    const response = await apiService.get('/api/v1/global-asset-tracking/running/list');
    return response.data;
  }

  /**
   * Get API call details for a specific execution
   */
  static async getApiCallDetails(executionId: string): Promise<ApiCallDetail[]> {
    const response = await apiService.get(`/api/v1/global-asset-tracking/${executionId}/api-calls`);
    return response.data;
  }

  /**
   * Clean up old tracking records
   */
  static async cleanupOldData(days: number = 90): Promise<{ deletedRecords: number; message: string }> {
    const response = await apiService.post(`/api/v1/global-asset-tracking/cleanup/execute`, { days });
    return response;
  }
}

export default GlobalAssetTrackingService;
