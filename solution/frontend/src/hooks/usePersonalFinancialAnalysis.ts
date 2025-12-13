/**
 * React hooks for Personal Financial Analysis System
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  getAllAnalyses,
  getAnalysisById,
  createAnalysis,
  updateAnalysis,
  deleteAnalysis,
  linkPortfolio,
  unlinkPortfolio,
  createScenario,
  updateScenario,
  deleteScenario,
  linkPlan,
  unlinkPlan,
  calculateMetrics,
} from '../services/api.personal-financial-analysis';
import {
  CreateAnalysisRequest,
  UpdateAnalysisRequest,
  CreateScenarioRequest,
  UpdateScenarioRequest,
} from '../types/personalFinancialAnalysis.types';

/**
 * Hook to get all analyses for current user
 */
export const useAnalyses = () => {
  return useQuery({
    queryKey: ['personalFinancialAnalyses'],
    queryFn: getAllAnalyses,
  });
};

/**
 * Hook to get single analysis by ID
 */
export const useAnalysis = (id: string | undefined) => {
  return useQuery({
    queryKey: ['personalFinancialAnalysis', id],
    queryFn: () => getAnalysisById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to create new analysis
 */
export const useCreateAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnalysisRequest) => createAnalysis(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalFinancialAnalyses'] });
    },
  });
};

/**
 * Hook to update analysis
 */
export const useUpdateAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnalysisRequest }) =>
      updateAnalysis(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['personalFinancialAnalyses'] });
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', variables.id],
      });
    },
  });
};

/**
 * Hook to delete analysis
 */
export const useDeleteAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalFinancialAnalyses'] });
    },
  });
};

/**
 * Hook to link portfolio
 */
export const useLinkPortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, portfolioId }: { analysisId: string; portfolioId: string }) =>
      linkPortfolio(analysisId, portfolioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', variables.analysisId],
      });
      queryClient.invalidateQueries({ queryKey: ['personalFinancialAnalyses'] });
    },
  });
};

/**
 * Hook to unlink portfolio
 */
export const useUnlinkPortfolio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, portfolioId }: { analysisId: string; portfolioId: string }) =>
      unlinkPortfolio(analysisId, portfolioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', variables.analysisId],
      });
      queryClient.invalidateQueries({ queryKey: ['personalFinancialAnalyses'] });
    },
  });
};

/**
 * Hook to create scenario
 */
export const useCreateScenario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      analysisId,
      scenario,
    }: {
      analysisId: string;
      scenario: CreateScenarioRequest;
    }) => createScenario(analysisId, scenario),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', variables.analysisId],
      });
    },
  });
};

/**
 * Hook to update scenario
 */
export const useUpdateScenario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      analysisId,
      scenarioId,
      scenario,
    }: {
      analysisId: string;
      scenarioId: string;
      scenario: UpdateScenarioRequest;
    }) => updateScenario(analysisId, scenarioId, scenario),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', variables.analysisId],
      });
    },
  });
};

/**
 * Hook to delete scenario
 */
export const useDeleteScenario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      analysisId,
      scenarioId,
    }: {
      analysisId: string;
      scenarioId: string;
    }) => deleteScenario(analysisId, scenarioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', variables.analysisId],
      });
    },
  });
};

/**
 * Hook to link Financial Freedom Plan
 */
export const useLinkPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ analysisId, planId }: { analysisId: string; planId: string }) =>
      linkPlan(analysisId, planId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', variables.analysisId],
      });
    },
  });
};

/**
 * Hook to unlink Financial Freedom Plan
 */
export const useUnlinkPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (analysisId: string) => unlinkPlan(analysisId),
    onSuccess: (_, analysisId) => {
      queryClient.invalidateQueries({
        queryKey: ['personalFinancialAnalysis', analysisId],
      });
    },
  });
};

/**
 * Hook to calculate metrics
 */
export const useCalculateMetrics = (analysisId: string | undefined) => {
  return useQuery({
    queryKey: ['personalFinancialAnalysisMetrics', analysisId],
    queryFn: () => calculateMetrics(analysisId!),
    enabled: !!analysisId,
  });
};

