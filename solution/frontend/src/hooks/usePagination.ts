import { useState, useCallback } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const usePagination = (initialLimit: number = 10) => {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 })); // Reset to page 1 when changing limit
  }, []);

  const nextPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page: Math.max(1, Math.min(page, prev.totalPages)) }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({
      page: 1,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  }, [initialLimit]);

  return {
    pagination,
    updatePagination,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    resetPagination,
  };
};
