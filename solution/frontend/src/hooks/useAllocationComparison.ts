import { useQuery } from 'react-query';
import { financialFreedomApi } from '../services/api.financial-freedom';
import { AllocationComparison } from '../types/financialFreedom.types';
import { useAccount } from '../contexts/AccountContext';

export const useAllocationComparison = (planId: string, accountId?: string) => {
  const { accountId: contextAccountId } = useAccount();
  const effectiveAccountId = accountId || contextAccountId;

  return useQuery<AllocationComparison>({
    queryKey: ['allocationComparison', planId, effectiveAccountId],
    queryFn: () => financialFreedomApi.getAllocationComparison(planId, effectiveAccountId!),
    enabled: !!planId && !!effectiveAccountId,
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh for 5 minutes
    refetchInterval: false, // Disabled auto refresh
  });
};

