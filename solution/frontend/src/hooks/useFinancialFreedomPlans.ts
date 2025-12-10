import { useQuery, useMutation, useQueryClient } from 'react-query';
import { financialFreedomApi } from '../services/api.financial-freedom';
import { CreatePlanRequest, UpdatePlanRequest } from '../types/financialFreedom.types';
import { useAccount } from '../contexts/AccountContext';

export const useFinancialFreedomPlans = (accountId?: string) => {
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useQuery({
    queryKey: ['financialFreedomPlans', effectiveAccountId],
    queryFn: () => financialFreedomApi.getPlans(effectiveAccountId!),
    enabled: !!effectiveAccountId,
  });
};

export const useFinancialFreedomPlan = (id: string, accountId?: string) => {
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useQuery({
    queryKey: ['financialFreedomPlan', id, effectiveAccountId],
    queryFn: () => financialFreedomApi.getPlanById(id, effectiveAccountId!),
    enabled: !!id && !!effectiveAccountId,
  });
};

export const useCreateFinancialFreedomPlan = (accountId?: string) => {
  const queryClient = useQueryClient();
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useMutation({
    mutationFn: (data: CreatePlanRequest) => 
      financialFreedomApi.createPlan(data, effectiveAccountId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialFreedomPlans', effectiveAccountId] });
      queryClient.invalidateQueries({ queryKey: ['financialFreedomPlans'] });
    },
  });
};

export const useUpdateFinancialFreedomPlan = (accountId?: string) => {
  const queryClient = useQueryClient();
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanRequest }) =>
      financialFreedomApi.updatePlan(id, data, effectiveAccountId!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['financialFreedomPlans', effectiveAccountId] });
      queryClient.invalidateQueries({ queryKey: ['financialFreedomPlan', variables.id] });
    },
  });
};

export const useDeleteFinancialFreedomPlan = (accountId?: string) => {
  const queryClient = useQueryClient();
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useMutation({
    mutationFn: (id: string) => financialFreedomApi.deletePlan(id, effectiveAccountId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialFreedomPlans', effectiveAccountId] });
      queryClient.invalidateQueries({ queryKey: ['financialFreedomPlans'] });
    },
  });
};

export const useDuplicateFinancialFreedomPlan = (accountId?: string) => {
  const queryClient = useQueryClient();
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useMutation({
    mutationFn: (id: string) => financialFreedomApi.duplicatePlan(id, effectiveAccountId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialFreedomPlans', effectiveAccountId] });
    },
  });
};

