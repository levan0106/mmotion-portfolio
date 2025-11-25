import { useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import { 
  priceHistoryService, 
  PriceHistoryQuery, 
  PriceHistoryResponse
} from '../services/priceHistory.service';

export interface UsePriceHistoryOptions {
  assetId: string;
  query?: PriceHistoryQuery;
  enabled?: boolean;
}

export interface UsePriceHistoryReturn {
  data: PriceHistoryResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

export const usePriceHistory = (options: UsePriceHistoryOptions): UsePriceHistoryReturn => {
  const { assetId, query = {}, enabled = true } = options;
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['priceHistory', assetId, query],
    queryFn: () => priceHistoryService.getPriceHistory(assetId, query),
    enabled: enabled && !!assetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const hasNextPage = data ? data.page < data.totalPages : false;
  const hasPreviousPage = data ? data.page > 1 : false;
  const currentPage = data?.page || 1;
  const totalPages = data?.totalPages || 0;
  const totalRecords = data?.total || 0;

  const nextPage = useCallback(() => {
    if (hasNextPage && data) {
      const newQuery = {
        ...query,
        offset: (data.page * data.limit) || 0
      };
      queryClient.prefetchQuery({
        queryKey: ['priceHistory', assetId, newQuery],
        queryFn: () => priceHistoryService.getPriceHistory(assetId, newQuery),
      });
    }
  }, [hasNextPage, data, query, assetId, queryClient]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage && data) {
      const newQuery = {
        ...query,
        offset: Math.max(0, ((data.page - 2) * data.limit) || 0)
      };
      queryClient.prefetchQuery({
        queryKey: ['priceHistory', assetId, newQuery],
        queryFn: () => priceHistoryService.getPriceHistory(assetId, newQuery),
      });
    }
  }, [hasPreviousPage, data, query, assetId, queryClient]);

  const goToPage = useCallback((page: number) => {
    if (data && page >= 1 && page <= data.totalPages) {
      const newQuery = {
        ...query,
        offset: ((page - 1) * data.limit) || 0
      };
      queryClient.prefetchQuery({
        queryKey: ['priceHistory', assetId, newQuery],
        queryFn: () => priceHistoryService.getPriceHistory(assetId, newQuery),
      });
    }
  }, [data, query, assetId, queryClient]);

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage,
    currentPage,
    totalPages,
    totalRecords
  };
};

/**
 * Hook for deleting a price history record
 */
export const useDeletePriceHistory = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (id: string) => {
      await priceHistoryService.deletePriceHistory(id);
    },
    {
      onSuccess: () => {
        // Invalidate all price history queries to refresh the list
        queryClient.invalidateQueries(['priceHistory']);
      },
    }
  );
};

export default usePriceHistory;
