import { useQuery, useMutation, useQueryClient } from 'react-query';
import { goalApi } from '../services/api.goal';
import {
  CreateGoalRequest,
  UpdateGoalRequest,
  CreateGoalAssetAllocationRequest,
  UpdateGoalAssetAllocationRequest,
  AlertType,
  GoalStatus,
  RebalanceType,
} from '../types/goal.types';

// Goal CRUD hooks
export const useGoals = (accountId: string, portfolioId?: string) => {
  return useQuery({
    queryKey: ['goals', accountId, portfolioId],
    queryFn: () => goalApi.getAllGoals(accountId, portfolioId),
    enabled: !!accountId,
  });
};

export const useGoal = (id: string, accountId: string) => {
  return useQuery({
    queryKey: ['goal', id, accountId],
    queryFn: () => goalApi.getGoalById(id, accountId),
    enabled: !!id && !!accountId,
  });
};

export const useCreateGoal = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateGoalRequest) => goalApi.createGoal(data, accountId),
    onSuccess: () => {
      // Invalidate all goals lists
      queryClient.invalidateQueries({ queryKey: ['goals', accountId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Invalidate filtered goals
      queryClient.invalidateQueries({ queryKey: ['goals', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'primary', accountId] });
      
      // Refetch goals data immediately
      queryClient.refetchQueries({ queryKey: ['goals', accountId] });
    },
  });
};

export const useUpdateGoal = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) => 
      goalApi.updateGoal(id, data, accountId),
    onSuccess: (_data: any, { id }: { id: string }) => {
      // Invalidate specific goal
      queryClient.invalidateQueries({ queryKey: ['goal', id, accountId] });
      
      // Invalidate all goals lists
      queryClient.invalidateQueries({ queryKey: ['goals', accountId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Invalidate filtered goals
      queryClient.invalidateQueries({ queryKey: ['goals', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'primary', accountId] });
      
      // Invalidate goal progress
      queryClient.invalidateQueries({ queryKey: ['goal-progress', id, accountId] });
      
      // Refetch goals data immediately
      queryClient.refetchQueries({ queryKey: ['goals', accountId] });
    },
  });
};

export const useDeleteGoal = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => goalApi.deleteGoal(id, accountId),
    onSuccess: () => {
      // Invalidate all goals lists
      queryClient.invalidateQueries({ queryKey: ['goals', accountId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Invalidate filtered goals
      queryClient.invalidateQueries({ queryKey: ['goals', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'primary', accountId] });
      
      // Refetch goals data immediately
      queryClient.refetchQueries({ queryKey: ['goals', accountId] });
    },
  });
};

// Goal progress hooks
export const useUpdateGoalProgress = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => goalApi.updateGoalProgress(id, accountId),
    onSuccess: (_data: any, id: string) => {
      queryClient.invalidateQueries({ queryKey: ['goal', id, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goals', accountId] });
    },
  });
};

export const useGoalProgress = (id: string, accountId: string) => {
  return useQuery({
    queryKey: ['goal-progress', id, accountId],
    queryFn: () => goalApi.getGoalProgress(id, accountId),
    enabled: !!id && !!accountId,
  });
};

// Goal filtering hooks
export const useGoalsByStatus = (status: GoalStatus, accountId: string) => {
  return useQuery({
    queryKey: ['goals', 'status', status, accountId],
    queryFn: () => goalApi.getGoalsByStatus(status, accountId),
    enabled: !!accountId,
  });
};

export const usePrimaryGoals = (accountId: string) => {
  return useQuery({
    queryKey: ['goals', 'primary', accountId],
    queryFn: () => goalApi.getPrimaryGoals(accountId),
    enabled: !!accountId,
  });
};

export const useSetPrimaryGoal = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => goalApi.setPrimaryGoal(id, accountId),
    onSuccess: () => {
      // Invalidate all goals lists
      queryClient.invalidateQueries({ queryKey: ['goals', accountId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      
      // Invalidate primary goals specifically
      queryClient.invalidateQueries({ queryKey: ['goals', 'primary', accountId] });
      
      // Refetch goals data immediately
      queryClient.refetchQueries({ queryKey: ['goals', accountId] });
    },
  });
};

// Asset allocation hooks
export const useAssetAllocations = (goalId: string, accountId: string) => {
  return useQuery({
    queryKey: ['goal-allocations', goalId, accountId],
    queryFn: () => goalApi.getAssetAllocations(goalId, accountId),
    enabled: !!goalId && !!accountId,
  });
};

export const useAssetAllocationSummary = (goalId: string, accountId: string) => {
  return useQuery({
    queryKey: ['goal-allocation-summary', goalId, accountId],
    queryFn: () => goalApi.getAssetAllocationSummary(goalId, accountId),
    enabled: !!goalId && !!accountId,
  });
};

export const useCreateAssetAllocation = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: CreateGoalAssetAllocationRequest }) =>
      goalApi.createAssetAllocation(goalId, data, accountId),
    onSuccess: (_data: any, { goalId }: { goalId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['goal-allocations', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal-allocation-summary', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId, accountId] });
    },
  });
};

export const useUpdateAssetAllocation = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, allocationId, data }: { 
      goalId: string; 
      allocationId: string; 
      data: UpdateGoalAssetAllocationRequest 
    }) => goalApi.updateAssetAllocation(goalId, allocationId, data, accountId),
    onSuccess: (_data: any, { goalId }: { goalId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['goal-allocations', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal-allocation-summary', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId, accountId] });
    },
  });
};

export const useDeleteAssetAllocation = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, allocationId }: { goalId: string; allocationId: string }) =>
      goalApi.deleteAssetAllocation(goalId, allocationId, accountId),
    onSuccess: (_data: any, { goalId }: { goalId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['goal-allocations', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal-allocation-summary', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId, accountId] });
    },
  });
};

export const useRebalancingCandidates = (accountId: string) => {
  return useQuery({
    queryKey: ['rebalancing-candidates', accountId],
    queryFn: () => goalApi.getRebalancingCandidates(accountId),
    enabled: !!accountId,
  });
};

export const useRebalanceAssetAllocation = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, allocationId, newAllocation }: {
      goalId: string;
      allocationId: string;
      newAllocation: Record<string, number>;
    }) => goalApi.rebalanceAssetAllocation(goalId, allocationId, newAllocation, accountId),
    onSuccess: (_data: any, { goalId }: { goalId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['goal-allocations', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal-allocation-summary', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId, accountId] });
    },
  });
};

// Alert hooks
export const useAlertsByGoal = (goalId: string, accountId: string) => {
  return useQuery({
    queryKey: ['goal-alerts', goalId, accountId],
    queryFn: () => goalApi.getAlertsByGoal(goalId, accountId),
    enabled: !!goalId && !!accountId,
  });
};

export const usePendingAlerts = (accountId: string) => {
  return useQuery({
    queryKey: ['alerts', 'pending', accountId],
    queryFn: () => goalApi.getPendingAlerts(accountId),
    enabled: !!accountId,
  });
};

export const useAlertStats = (accountId: string) => {
  return useQuery({
    queryKey: ['alerts', 'stats', accountId],
    queryFn: () => goalApi.getAlertStats(accountId),
    enabled: !!accountId,
  });
};

export const useAlertsByType = (type: AlertType, accountId: string) => {
  return useQuery({
    queryKey: ['alerts', 'type', type, accountId],
    queryFn: () => goalApi.getAlertsByType(type, accountId),
    enabled: !!accountId,
  });
};

export const useCreateAlert = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: {
      alertType: AlertType;
      message: string;
      thresholdValue?: number;
      currentValue?: number;
    } }) => goalApi.createAlert(goalId, data, accountId),
    onSuccess: (_data: any, { goalId }: { goalId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['goal-alerts', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['alerts', accountId] });
    },
  });
};

export const useAcknowledgeAlert = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => goalApi.acknowledgeAlert(alertId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', accountId] });
    },
  });
};

export const useDismissAlert = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => goalApi.dismissAlert(alertId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', accountId] });
    },
  });
};

// Rebalancing hooks
export const useRebalancingHistory = (goalId: string, accountId: string) => {
  return useQuery({
    queryKey: ['rebalancing-history', goalId, accountId],
    queryFn: () => goalApi.getRebalancingHistory(goalId, accountId),
    enabled: !!goalId && !!accountId,
  });
};

export const useRebalancingStats = (goalId: string, accountId: string) => {
  return useQuery({
    queryKey: ['rebalancing-stats', goalId, accountId],
    queryFn: () => goalApi.getRebalancingStats(goalId, accountId),
    enabled: !!goalId && !!accountId,
  });
};

export const useRebalancingPerformance = (goalId: string, accountId: string, days?: number) => {
  return useQuery({
    queryKey: ['rebalancing-performance', goalId, accountId, days],
    queryFn: () => goalApi.getRebalancingPerformance(goalId, accountId, days),
    enabled: !!goalId && !!accountId,
  });
};

export const useExecuteRebalancing = (accountId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: {
      newAllocations: Record<string, number>;
      rebalanceType?: RebalanceType;
      triggerReason?: string;
    } }) => goalApi.executeRebalancing(goalId, data, accountId),
    onSuccess: (_data: any, { goalId }: { goalId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['rebalancing-history', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['rebalancing-stats', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal-allocations', goalId, accountId] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId, accountId] });
    },
  });
};
