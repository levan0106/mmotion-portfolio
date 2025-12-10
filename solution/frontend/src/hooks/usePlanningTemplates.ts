import { useQuery } from 'react-query';
import { financialFreedomApi } from '../services/api.financial-freedom';

export const usePlanningTemplates = () => {
  return useQuery({
    queryKey: ['planningTemplates'],
    queryFn: () => financialFreedomApi.getTemplates(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const usePlanningTemplate = (id: string) => {
  return useQuery({
    queryKey: ['planningTemplate', id],
    queryFn: () => financialFreedomApi.getTemplateById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

