import { useQuery } from 'react-query';
import { financialFreedomApi } from '../services/api.financial-freedom';
import { ProgressResult } from '../types/financialFreedom.types';
import { useAccount } from '../contexts/AccountContext';

export const useProgressTracking = (planId: string, accountId?: string) => {
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useQuery<ProgressResult>({
    queryKey: ['planProgress', planId, effectiveAccountId],
    queryFn: () => financialFreedomApi.getProgress(planId, effectiveAccountId!),
    enabled: !!planId && !!effectiveAccountId,
    staleTime: 30 * 1000, // 30 seconds - progress can change frequently
    refetchInterval: 60 * 1000, // Refetch every minute for real-time updates
  });
};

