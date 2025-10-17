import { apiService } from './api';

export interface AutomatedSnapshotStatus {
  isRunning: boolean;
  isEnabled: boolean;
  lastExecutionTime: string | null;
  executionStats: {
    totalPortfolios: number;
    successfulPortfolios: number;
    failedPortfolios: number;
    totalSnapshots: number;
    executionTime: number;
  };
  nextScheduledTime: string;
  cronExpression: string;
  timezone: string;
  scheduleDescription: string;
}

export interface ManualTriggerResponse {
  message: string;
  stats: {
    totalPortfolios: number;
    successfulPortfolios: number;
    failedPortfolios: number;
    totalSnapshots: number;
    executionTime: number;
  };
}

export interface TestSnapshotResponse {
  success: boolean;
  message: string;
  snapshotsCreated: number;
}

export interface ScheduleInfo {
  cronExpression: string;
  timezone: string;
  description: string;
  nextExecution: string;
}

export interface ServiceToggleResponse {
  message: string;
  enabled: boolean;
}

export class AutomatedSnapshotApi {
  /**
   * Get the current status of the automated snapshot service
   */
  static async getStatus(): Promise<AutomatedSnapshotStatus> {
    const response = await apiService.api.get('/api/v1/automated-snapshots/status');
    return response.data;
  }

  /**
   * Manually trigger snapshot creation for all portfolios
   */
  static async triggerManual(): Promise<ManualTriggerResponse> {
    const response = await apiService.api.post('/api/v1/automated-snapshots/trigger');
    return response.data;
  }

  /**
   * Test snapshot creation for a specific portfolio
   */
  static async testPortfolio(portfolioId: string): Promise<TestSnapshotResponse> {
    const response = await apiService.api.post(`/api/v1/automated-snapshots/test/${portfolioId}`);
    return response.data;
  }

  /**
   * Get schedule information
   */
  static async getScheduleInfo(): Promise<ScheduleInfo> {
    const response = await apiService.api.get('/api/v1/automated-snapshots/schedule-info');
    return response.data;
  }

  /**
   * Enable automated snapshot service
   */
  static async enableService(): Promise<ServiceToggleResponse> {
    const response = await apiService.api.post('/api/v1/automated-snapshots/enable');
    return response.data;
  }

  /**
   * Disable automated snapshot service
   */
  static async disableService(): Promise<ServiceToggleResponse> {
    const response = await apiService.api.post('/api/v1/automated-snapshots/disable');
    return response.data;
  }
}
