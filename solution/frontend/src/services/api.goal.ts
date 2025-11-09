import apiService from './api';
import {
  Goal,
  GoalWithAllocation,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalProgress,
  GoalAssetAllocation,
  CreateGoalAssetAllocationRequest,
  UpdateGoalAssetAllocationRequest,
  AssetAllocationSummary,
  RebalancingCandidate,
  GoalAlert,
  AlertStats,
  GoalRebalancingHistory,
  RebalancingStats,
  RebalancingPerformance,
  AlertType,
  GoalStatus,
  RebalanceType,
} from '../types/goal.types';

export const goalApi = {
  // Goal CRUD operations
  createGoal: (data: CreateGoalRequest, accountId: string): Promise<Goal> =>
    apiService.post('/api/v1/goals', data, { params: { accountId } }),

  getAllGoals: (accountId: string, portfolioId?: string): Promise<Goal[]> =>
    apiService.get('/api/v1/goals', { params: { accountId, portfolioId } }),

  getGoalById: (id: string, accountId: string): Promise<GoalWithAllocation> =>
    apiService.get(`/api/v1/goals/${id}`, { params: { accountId } }),

  updateGoal: (id: string, data: UpdateGoalRequest, accountId: string): Promise<Goal> =>
    apiService.put(`/api/v1/goals/${id}`, data, { params: { accountId } }),

  deleteGoal: (id: string, accountId: string): Promise<{ message: string }> =>
    apiService.delete(`/api/v1/goals/${id}`, { params: { accountId } }),

  // Goal progress operations
  updateGoalProgress: (id: string, accountId: string): Promise<Goal> =>
    apiService.post(`/api/v1/goals/${id}/update-progress`, {}, { params: { accountId } }),

  getGoalProgress: (id: string, accountId: string): Promise<GoalProgress> =>
    apiService.get(`/api/v1/goals/${id}/progress`, { params: { accountId } }),

  // Goal filtering operations
  getGoalsByStatus: (status: GoalStatus, accountId: string): Promise<Goal[]> =>
    apiService.get(`/api/v1/goals/status/${status}`, { params: { accountId } }),

  getPrimaryGoals: (accountId: string): Promise<Goal[]> =>
    apiService.get('/api/v1/goals/primary/list', { params: { accountId } }),

  setPrimaryGoal: (id: string, accountId: string): Promise<Goal> =>
    apiService.post(`/api/v1/goals/${id}/set-primary`, {}, { params: { accountId } }),

  // Asset allocation operations
  createAssetAllocation: (goalId: string, data: CreateGoalAssetAllocationRequest, accountId: string): Promise<GoalAssetAllocation> =>
    apiService.post(`/api/v1/goals/${goalId}/allocations`, data, { params: { accountId } }),

  getAssetAllocations: (goalId: string, accountId: string): Promise<GoalAssetAllocation[]> =>
    apiService.get(`/api/v1/goals/${goalId}/allocations`, { params: { accountId } }),

  getAssetAllocationSummary: (goalId: string, accountId: string): Promise<AssetAllocationSummary> =>
    apiService.get(`/api/v1/goals/${goalId}/allocations/summary`, { params: { accountId } }),

  getAssetRebalancingCandidates: (accountId: string): Promise<RebalancingCandidate[]> =>
    apiService.get('/api/v1/goals/allocations/rebalancing-candidates', { params: { accountId } }),

  updateAssetAllocation: (goalId: string, allocationId: string, data: UpdateGoalAssetAllocationRequest, accountId: string): Promise<GoalAssetAllocation> =>
    apiService.put(`/api/v1/goals/${goalId}/allocations/${allocationId}`, data, { params: { accountId } }),

  deleteAssetAllocation: (goalId: string, allocationId: string, accountId: string): Promise<{ message: string }> =>
    apiService.delete(`/api/v1/goals/${goalId}/allocations/${allocationId}`, { params: { accountId } }),

  rebalanceAssetAllocation: (goalId: string, allocationId: string, newAllocation: Record<string, number>, accountId: string): Promise<GoalAssetAllocation> =>
    apiService.post(`/api/v1/goals/${goalId}/allocations/${allocationId}/rebalance`, newAllocation, { params: { accountId } }),

  // Alert operations
  createAlert: (goalId: string, data: {
    alertType: AlertType;
    message: string;
    thresholdValue?: number;
    currentValue?: number;
  }, accountId: string): Promise<GoalAlert> =>
    apiService.post(`/api/v1/goals/${goalId}/alerts`, data, { params: { accountId } }),

  getAlertsByGoal: (goalId: string, accountId: string): Promise<GoalAlert[]> =>
    apiService.get(`/api/v1/goals/${goalId}/alerts`, { params: { accountId } }),

  getPendingAlerts: (accountId: string): Promise<GoalAlert[]> =>
    apiService.get('/api/v1/goals/alerts/pending', { params: { accountId } }),

  getAlertStats: (accountId: string): Promise<AlertStats> =>
    apiService.get('/api/v1/goals/alerts/stats', { params: { accountId } }),

  getAlertsByType: (type: AlertType, accountId: string): Promise<GoalAlert[]> =>
    apiService.get(`/api/v1/goals/alerts/type/${type}`, { params: { accountId } }),

  getCriticalAlerts: (accountId: string): Promise<GoalAlert[]> =>
    apiService.get('/api/v1/goals/alerts/critical', { params: { accountId } }),

  getWarningAlerts: (accountId: string): Promise<GoalAlert[]> =>
    apiService.get('/api/v1/goals/alerts/warnings', { params: { accountId } }),

  getAchievementAlerts: (accountId: string): Promise<GoalAlert[]> =>
    apiService.get('/api/v1/goals/alerts/achievements', { params: { accountId } }),

  getRebalanceAlerts: (accountId: string): Promise<GoalAlert[]> =>
    apiService.get('/api/v1/goals/alerts/rebalance', { params: { accountId } }),

  getDeadlineAlerts: (accountId: string): Promise<GoalAlert[]> =>
    apiService.get('/api/v1/goals/alerts/deadlines', { params: { accountId } }),

  acknowledgeAlert: (alertId: string, accountId: string): Promise<GoalAlert> =>
    apiService.put(`/api/v1/goals/alerts/${alertId}/acknowledge`, {}, { params: { accountId } }),

  dismissAlert: (alertId: string, accountId: string): Promise<GoalAlert> =>
    apiService.put(`/api/v1/goals/alerts/${alertId}/dismiss`, {}, { params: { accountId } }),

  cleanupOldAlerts: (accountId: string, daysOld?: number): Promise<{ message: string }> =>
    apiService.delete('/api/v1/goals/alerts/cleanup', { params: { accountId, daysOld } }),

  // Rebalancing operations
  getRebalancingHistory: (goalId: string, accountId: string): Promise<GoalRebalancingHistory[]> =>
    apiService.get(`/api/v1/goals/${goalId}/rebalancing/history`, { params: { accountId } }),

  getRebalancingStats: (goalId: string, accountId: string): Promise<RebalancingStats> =>
    apiService.get(`/api/v1/goals/${goalId}/rebalancing/stats`, { params: { accountId } }),

  getRebalancingPerformance: (goalId: string, accountId: string, days?: number): Promise<RebalancingPerformance> =>
    apiService.get(`/api/v1/goals/${goalId}/rebalancing/performance`, { params: { accountId, days } }),

  getRebalancingCandidates: (accountId: string): Promise<RebalancingCandidate[]> =>
    apiService.get('/api/v1/goals/rebalancing/candidates', { params: { accountId } }),

  executeRebalancing: (goalId: string, data: {
    newAllocations: Record<string, number>;
    rebalanceType?: RebalanceType;
    triggerReason?: string;
  }, accountId: string): Promise<{
    success: boolean;
    message: string;
    rebalancingHistory: GoalRebalancingHistory;
  }> =>
    apiService.post(`/api/v1/goals/${goalId}/rebalancing/execute`, data, { params: { accountId } }),

  createRebalancingHistory: (goalId: string, data: {
    rebalanceType: RebalanceType;
    triggerReason: string;
    oldAllocation: Record<string, any>;
    newAllocation: Record<string, any>;
    changesMade: Record<string, any>;
    expectedImprovement?: number;
    costOfRebalancing?: number;
  }, accountId: string): Promise<GoalRebalancingHistory> =>
    apiService.post(`/api/v1/goals/${goalId}/rebalancing/history`, data, { params: { accountId } }),

  // Portfolio management
  getAvailablePortfolios: (accountId: string): Promise<{ portfolios: Array<{ portfolioId: string; accountId: string; name: string }> }> =>
    apiService.get('/api/v1/goals/portfolios/available', { params: { accountId } }),
};
