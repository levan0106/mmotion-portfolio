/**
 * Step 3: Asset Restructuring Component
 * Allows users to create and compare scenarios for asset restructuring
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  CompareArrows as CompareIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { Step3AssetRestructuringProps, AnalysisScenario, PersonalFinancialAnalysis } from '../../types/personalFinancialAnalysis.types';
import { Step1CashFlowSurvey } from './Step1CashFlowSurvey';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../contexts/AccountContext';
import { formatCurrency } from '../../utils/format';
import { useSummaryMetrics, useIncomeExpenseBreakdown } from '../../hooks/useAnalysisCalculations';
import { useCreateScenario, useDeleteScenario, useUpdateScenario } from '../../hooks/usePersonalFinancialAnalysis';
import { BalanceSheetChart } from './BalanceSheetChart';
import { AssetPyramidChart } from './AssetPyramidChart';

// Helper to generate UUID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const Step3AssetRestructuring: React.FC<Step3AssetRestructuringProps> = ({
  analysis,
  onScenarioCreate,
  onScenarioUpdate,
  onScenarioDelete,
  onScenarioSelect,
}) => {
  const { t } = useTranslation();
  const { baseCurrency } = useAccount();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasAutoCreated, setHasAutoCreated] = useState(false);
  const [pendingScenarioName, setPendingScenarioName] = useState<string | null>(null);
  const [editDataModalOpen, setEditDataModalOpen] = useState(false);
  // Local state for inline editing of scenario name
  const [editingScenarioName, setEditingScenarioName] = useState<{ [key: string]: string }>({});

  const createScenarioMutation = useCreateScenario();
  const deleteScenarioMutation = useDeleteScenario();
  const updateScenarioMutation = useUpdateScenario();

  // Auto-create a default scenario if none exists and auto-select it for comparison
  useEffect(() => {
    const hasScenarios = analysis.scenarios && analysis.scenarios.length > 0;
    const hasSelectedScenario = selectedScenarioId !== null;
    const isCreating = createScenarioMutation.isLoading;
    
    // Only auto-create if:
    // - No scenarios exist
    // - No scenario is selected
    // - Not currently creating
    // - Haven't already auto-created
    // - Analysis ID exists
    if (!hasScenarios && !hasSelectedScenario && !isCreating && !hasAutoCreated && analysis.id) {
      setHasAutoCreated(true); // Mark as attempted to prevent duplicate creation
      
      const defaultScenarioName = t('personalFinancialAnalysis.scenarios.defaultName');
      
      const newScenario: AnalysisScenario = {
        id: generateId(),
        name: defaultScenarioName,
        description: t('personalFinancialAnalysis.scenarios.defaultDescription'),
        assets: [...(analysis.assets || [])],
        income: [...(analysis.income || [])],
        expenses: [...(analysis.expenses || [])],
        debts: [...(analysis.debts || [])],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create scenario and auto-select it
      createScenarioMutation.mutateAsync({
        analysisId: analysis.id,
        scenario: {
          name: newScenario.name,
          description: newScenario.description,
          assets: newScenario.assets,
          income: newScenario.income,
          expenses: newScenario.expenses,
          debts: newScenario.debts,
        },
      }).then((response) => {
        // Find the newly created scenario in the response
        const createdScenario = response.scenarios?.find(
          (s) => s.name === newScenario.name
        );
        
        if (createdScenario) {
          // Auto-select the newly created scenario using ID from server
          setSelectedScenarioId(createdScenario.id);
          if (onScenarioSelect) {
            onScenarioSelect(createdScenario.id);
          }
        } else {
          // Fallback: use client-generated ID (shouldn't happen with proper API)
          setSelectedScenarioId(newScenario.id);
          if (onScenarioSelect) {
            onScenarioSelect(newScenario.id);
          }
        }
        
        if (onScenarioCreate) {
          onScenarioCreate({
            name: newScenario.name,
            description: newScenario.description,
            assets: newScenario.assets,
            income: newScenario.income,
            expenses: newScenario.expenses,
            debts: newScenario.debts,
          });
        }
      }).catch((error) => {
        console.error('Error auto-creating scenario:', error);
        setHasAutoCreated(false); // Reset flag on error so it can retry
      });
    }
  }, [analysis.scenarios?.length, analysis.id, selectedScenarioId, createScenarioMutation.isLoading, hasAutoCreated, t, onScenarioSelect, onScenarioCreate]);

  // Auto-select newly created scenario when it appears in analysis.scenarios
  useEffect(() => {
    if (pendingScenarioName && analysis.scenarios && analysis.scenarios.length > 0) {
      const newScenario = analysis.scenarios.find(
        (s) => s.name === pendingScenarioName
      );
      
      if (newScenario) {
        setSelectedScenarioId(newScenario.id);
        if (onScenarioSelect) {
          onScenarioSelect(newScenario.id);
        }
        setPendingScenarioName(null); // Clear pending name
      }
    }
  }, [analysis.scenarios, pendingScenarioName, onScenarioSelect]);

  // Get current scenario (base analysis data)
  const currentScenario: AnalysisScenario = useMemo(() => ({
    id: 'current',
    name: t('personalFinancialAnalysis.scenarios.current'),
    description: t('personalFinancialAnalysis.scenarios.currentDescription'),
    assets: analysis.assets || [],
    income: analysis.income || [],
    expenses: analysis.expenses || [],
    debts: analysis.debts || [],
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  }), [analysis, t]);

  // Get selected scenario or current
  const selectedScenario = selectedScenarioId
    ? analysis.scenarios.find((s) => s.id === selectedScenarioId)
    : currentScenario;

  // Calculate metrics for current scenario
  const currentMetrics = useSummaryMetrics(analysis);
  const currentBreakdown = useIncomeExpenseBreakdown(analysis);

  // Calculate metrics for selected scenario
  const selectedAnalysis: PersonalFinancialAnalysis | undefined = selectedScenario && selectedScenarioId
    ? {
        ...analysis,
        assets: selectedScenario.assets,
        income: selectedScenario.income,
        expenses: selectedScenario.expenses,
        debts: selectedScenario.debts,
      }
    : undefined;

  const selectedMetrics = useSummaryMetrics(selectedAnalysis);
  const selectedBreakdown = useIncomeExpenseBreakdown(selectedAnalysis);

  // Helper function to calculate difference and get visual indicator
  const getMetricDifference = (current: number, selected: number) => {
    const diff = selected - current;
    const percentDiff = current !== 0 ? ((diff / current) * 100) : (diff !== 0 ? (diff > 0 ? 100 : -100) : 0);
    return {
      value: diff,
      percent: percentDiff,
      isPositive: diff > 0,
      isNegative: diff < 0,
      isNeutral: diff === 0,
    };
  };

  const handleUpdateScenario = async (scenarioId: string, updates: { name?: string; description?: string }) => {
    if (!analysis.id) return;

    try {
      await updateScenarioMutation.mutateAsync({
        analysisId: analysis.id,
        scenarioId,
        scenario: updates,
      });
      if (onScenarioUpdate) {
        await onScenarioUpdate(scenarioId, updates);
      }
    } catch (error) {
      console.error('Error updating scenario:', error);
    }
  };

  const handleNameBlur = (scenarioId: string, currentName: string) => {
    const editedName = editingScenarioName[scenarioId];
    if (editedName !== undefined && editedName !== currentName && editedName.trim()) {
      handleUpdateScenario(scenarioId, { name: editedName.trim() });
    }
    // Clear local state after blur
    setEditingScenarioName((prev) => {
      const newState = { ...prev };
      delete newState[scenarioId];
      return newState;
    });
  };


  const handleCreateScenario = async () => {
    if (!newScenarioName.trim() || !analysis.id) return;

    const newScenario: AnalysisScenario = {
      id: generateId(),
      name: newScenarioName.trim(),
      description: '',
      assets: [...analysis.assets],
      income: [...analysis.income],
      expenses: [...analysis.expenses],
      debts: [...analysis.debts],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await createScenarioMutation.mutateAsync({
        analysisId: analysis.id,
        scenario: {
          name: newScenario.name,
          description: newScenario.description,
          assets: newScenario.assets,
          income: newScenario.income,
          expenses: newScenario.expenses,
          debts: newScenario.debts,
        },
      });
      
      // Try to find the newly created scenario in the response
      const createdScenario = response.scenarios?.find(
        (s) => s.name === newScenario.name
      );
      
      if (createdScenario) {
        // Auto-select immediately if found in response
        setSelectedScenarioId(createdScenario.id);
        if (onScenarioSelect) {
          onScenarioSelect(createdScenario.id);
        }
      } else {
        // Fallback: set pending name to auto-select after query refetch
        setPendingScenarioName(newScenario.name);
      }
      
      setNewScenarioName('');
      setShowCreateForm(false);
      if (onScenarioCreate) {
        await onScenarioCreate({
          name: newScenario.name,
          description: newScenario.description,
          assets: newScenario.assets,
          income: newScenario.income,
          expenses: newScenario.expenses,
          debts: newScenario.debts,
        });
      }
    } catch (error) {
      console.error('Error creating scenario:', error);
      setPendingScenarioName(null); // Clear pending name on error
    }
  };

  const handleDuplicateScenario = async (scenario: AnalysisScenario) => {
    if (!analysis.id) return;

    const duplicatedScenario: AnalysisScenario = {
      ...scenario,
      id: generateId(),
      name: `${scenario.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await createScenarioMutation.mutateAsync({
        analysisId: analysis.id,
        scenario: {
          name: duplicatedScenario.name,
          description: duplicatedScenario.description,
          assets: duplicatedScenario.assets,
          income: duplicatedScenario.income,
          expenses: duplicatedScenario.expenses,
          debts: duplicatedScenario.debts,
        },
      });
      
      // Try to find the newly duplicated scenario in the response
      const createdScenario = response.scenarios?.find(
        (s) => s.name === duplicatedScenario.name
      );
      
      if (createdScenario) {
        // Auto-select immediately if found in response
        setSelectedScenarioId(createdScenario.id);
        if (onScenarioSelect) {
          onScenarioSelect(createdScenario.id);
        }
      } else {
        // Fallback: set pending name to auto-select after query refetch
        setPendingScenarioName(duplicatedScenario.name);
      }
      
      if (onScenarioCreate) {
        await onScenarioCreate({
          name: duplicatedScenario.name,
          description: duplicatedScenario.description,
          assets: duplicatedScenario.assets,
          income: duplicatedScenario.income,
          expenses: duplicatedScenario.expenses,
          debts: duplicatedScenario.debts,
        });
      }
    } catch (error) {
      console.error('Error duplicating scenario:', error);
      setPendingScenarioName(null); // Clear pending name on error
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    if (!analysis.id) return;

    try {
      await deleteScenarioMutation.mutateAsync({
        analysisId: analysis.id,
        scenarioId,
      });
      if (selectedScenarioId === scenarioId) {
        setSelectedScenarioId(null);
      }
      if (onScenarioDelete) {
        await onScenarioDelete(scenarioId);
      }
    } catch (error) {
      console.error('Error deleting scenario:', error);
    }
  };

  const handleSelectScenario = (scenarioId: string | null) => {
    setSelectedScenarioId(scenarioId);
    if (onScenarioSelect) {
      onScenarioSelect(scenarioId || 'current');
    }
  };

  const allScenarios = [currentScenario, ...analysis.scenarios];

  return (
    <Box>
      {/* <ResponsiveTypography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {t('personalFinancialAnalysis.steps.step3.title')}
      </ResponsiveTypography> */}

      <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('personalFinancialAnalysis.steps.step3.description')}
      </ResponsiveTypography>

      {/* Scenario Management */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ResponsiveTypography variant="h6">
            {t('personalFinancialAnalysis.scenarios.title')}
          </ResponsiveTypography>
          <ResponsiveButton
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {t('personalFinancialAnalysis.scenarios.create')}
          </ResponsiveButton>
        </Box>

        {/* Create Scenario Form */}
        {showCreateForm && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <TextField
              label={t('personalFinancialAnalysis.scenarios.name')}
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateScenario();
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ResponsiveButton
                variant="contained"
                onClick={handleCreateScenario}
                disabled={!newScenarioName.trim() || createScenarioMutation.isLoading}
              >
                {t('common.create')}
              </ResponsiveButton>
              <ResponsiveButton
                variant="outlined"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewScenarioName('');
                }}
              >
                {t('common.cancel')}
              </ResponsiveButton>
            </Box>
          </Box>
        )}

        {/* Scenario List */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {allScenarios.map((scenario) => (
            <Chip
              key={scenario.id}
              label={scenario.name}
              onClick={() => handleSelectScenario(scenario.id === 'current' ? null : scenario.id)}
              onDelete={
                scenario.id === 'current'
                  ? undefined
                  : () => handleDeleteScenario(scenario.id)
              }
              color={selectedScenarioId === scenario.id || (scenario.id === 'current' && !selectedScenarioId) ? 'primary' : 'default'}
              variant={selectedScenarioId === scenario.id || (scenario.id === 'current' && !selectedScenarioId) ? 'filled' : 'outlined'}
              deleteIcon={
                scenario.id !== 'current' ? (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScenario(scenario.id);
                    }}
                    disabled={deleteScenarioMutation.isLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                ) : undefined
              }
              icon={
                scenario.id !== 'current' ? (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateScenario(scenario);
                    }}
                    disabled={createScenarioMutation.isLoading}
                  >
                    <DuplicateIcon fontSize="small" />
                  </IconButton>
                ) : undefined
              }
            />
          ))}
        </Box>
      </Paper>

      {/* Scenario Comparison */}
      <Paper 
        sx={{ 
          mb: 3,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <CompareIcon sx={{ fontSize: 28 }} />
          <ResponsiveTypography variant="h5" sx={{ fontWeight: 600 }}>
            {t('personalFinancialAnalysis.scenarios.comparison')}
          </ResponsiveTypography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Current Scenario */}
            <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 3,
                        pb: 2,
                        borderBottom: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                        }}
                      />
                      <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                        {currentScenario.name}
                      </ResponsiveTypography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Total Assets */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('personalFinancialAnalysis.metrics.totalAssets')}:
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {formatCurrency(currentMetrics?.totalAssets || 0, baseCurrency)}
                        </ResponsiveTypography>
                      </Box>

                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />

                      {/* Total Debt */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('personalFinancialAnalysis.metrics.totalDebt')}:
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                          {formatCurrency(currentMetrics?.totalDebt || 0, baseCurrency)}
                        </ResponsiveTypography>
                      </Box>

                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />

                      {/* Net Worth */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('personalFinancialAnalysis.metrics.netWorth')}:
                        </ResponsiveTypography>
                        <ResponsiveTypography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: (currentMetrics?.netWorth || 0) >= 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          {formatCurrency(currentMetrics?.netWorth || 0, baseCurrency)}
                        </ResponsiveTypography>
                      </Box>

                      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />

                      {/* Debt to Asset Ratio */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                        <ResponsiveTypography variant="body2" color="text.secondary">
                          {t('personalFinancialAnalysis.metrics.debtToAssetRatio')}:
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          {(currentMetrics?.debtToAssetRatio || 0).toFixed(1)}%
                        </ResponsiveTypography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

            {/* Selected Scenario */}
            {selectedScenarioId && selectedScenario && (
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                        pb: 2,
                        borderBottom: '2px solid',
                        borderColor: 'primary.main',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                          }}
                        />
                        <TextField
                          value={editingScenarioName[selectedScenario.id] !== undefined 
                            ? editingScenarioName[selectedScenario.id] 
                            : selectedScenario.name}
                          onChange={(e) => setEditingScenarioName((prev) => ({
                            ...prev,
                            [selectedScenario.id]: e.target.value,
                          }))}
                          onBlur={() => handleNameBlur(selectedScenario.id, selectedScenario.name)}
                          fullWidth
                          variant="standard"
                          disabled={updateScenarioMutation.isLoading}
                          placeholder={t('personalFinancialAnalysis.scenarios.name')}
                          sx={{
                            '& .MuiInputBase-input': {
                              fontSize: '1.25rem',
                              fontWeight: 600,
                              color: 'text.primary',
                              py: 0.5,
                            },
                            '& .MuiInput-underline:before': {
                              borderBottom: 'none',
                            },
                            '& .MuiInput-underline:hover:before': {
                              borderBottom: '1px solid',
                              borderColor: 'primary.main',
                            },
                            '& .MuiInput-underline:after': {
                              borderBottom: '2px solid',
                              borderColor: 'primary.main',
                            },
                            '& .MuiInputBase-input::placeholder': {
                              opacity: 0.5,
                              color: 'text.secondary',
                            },
                          }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => setEditDataModalOpen(true)}
                        disabled={updateScenarioMutation.isLoading}
                        color="primary"
                        title={t('personalFinancialAnalysis.scenarios.editData')}
                        sx={{
                          border: '1px solid',
                          borderColor: 'primary.main',
                          ml: 1,
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  
                  {/* Metrics Display */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {(() => {
                      const assetsDiff = getMetricDifference(
                        currentMetrics?.totalAssets || 0,
                        selectedMetrics?.totalAssets || 0
                      );
                      const debtDiff = getMetricDifference(
                        currentMetrics?.totalDebt || 0,
                        selectedMetrics?.totalDebt || 0
                      );
                      const netWorthDiff = getMetricDifference(
                        currentMetrics?.netWorth || 0,
                        selectedMetrics?.netWorth || 0
                      );
                      const ratioDiff = getMetricDifference(
                        currentMetrics?.debtToAssetRatio || 0,
                        selectedMetrics?.debtToAssetRatio || 0
                      );

                      return (
                        <>
                          {/* Total Assets */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                            <ResponsiveTypography variant="body2" color="text.secondary">
                              {t('personalFinancialAnalysis.metrics.totalAssets')}:
                            </ResponsiveTypography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {formatCurrency(selectedMetrics?.totalAssets || 0, baseCurrency)}
                              </ResponsiveTypography>
                              {!assetsDiff.isNeutral && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  {assetsDiff.isPositive ? (
                                    <ArrowUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  ) : (
                                    <ArrowDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                  )}
                                  <ResponsiveTypography
                                    variant="caption"
                                    sx={{
                                      color: assetsDiff.isPositive ? 'success.main' : 'error.main',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {assetsDiff.isPositive ? '+' : ''}
                                    {assetsDiff.percent.toFixed(1)}%
                                  </ResponsiveTypography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />

                          {/* Total Debt */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                            <ResponsiveTypography variant="body2" color="text.secondary">
                              {t('personalFinancialAnalysis.metrics.totalDebt')}:
                            </ResponsiveTypography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'error.main' }}>
                                {formatCurrency(selectedMetrics?.totalDebt || 0, baseCurrency)}
                              </ResponsiveTypography>
                              {!debtDiff.isNeutral && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  {debtDiff.isPositive ? (
                                    <ArrowUpIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                  ) : (
                                    <ArrowDownIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  )}
                                  <ResponsiveTypography
                                    variant="caption"
                                    sx={{
                                      color: debtDiff.isPositive ? 'error.main' : 'success.main',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {debtDiff.isPositive ? '+' : ''}
                                    {debtDiff.percent.toFixed(1)}%
                                  </ResponsiveTypography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />

                          {/* Net Worth */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                            <ResponsiveTypography variant="body2" color="text.secondary">
                              {t('personalFinancialAnalysis.metrics.netWorth')}:
                            </ResponsiveTypography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ResponsiveTypography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: (selectedMetrics?.netWorth || 0) >= 0 ? 'success.main' : 'error.main',
                                }}
                              >
                                {formatCurrency(selectedMetrics?.netWorth || 0, baseCurrency)}
                              </ResponsiveTypography>
                              {!netWorthDiff.isNeutral && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  {netWorthDiff.isPositive ? (
                                    <ArrowUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  ) : (
                                    <ArrowDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                  )}
                                  <ResponsiveTypography
                                    variant="caption"
                                    sx={{
                                      color: netWorthDiff.isPositive ? 'success.main' : 'error.main',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {netWorthDiff.isPositive ? '+' : ''}
                                    {netWorthDiff.percent.toFixed(1)}%
                                  </ResponsiveTypography>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />

                          {/* Debt to Asset Ratio */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                            <ResponsiveTypography variant="body2" color="text.secondary">
                              {t('personalFinancialAnalysis.metrics.debtToAssetRatio')}:
                            </ResponsiveTypography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                {(selectedMetrics?.debtToAssetRatio || 0).toFixed(1)}%
                              </ResponsiveTypography>
                              {!ratioDiff.isNeutral && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  {ratioDiff.isPositive ? (
                                    <ArrowUpIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                  ) : (
                                    <ArrowDownIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                  )}
                                  <ResponsiveTypography
                                    variant="caption"
                                    sx={{
                                      color: ratioDiff.isPositive ? 'error.main' : 'success.main',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {ratioDiff.isPositive ? '+' : ''}
                                    {ratioDiff.percent.toFixed(1)}%
                                  </ResponsiveTypography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                </CardContent>
              </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </Paper>

      {/* Charts Comparison */}
      {currentMetrics && currentBreakdown && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <ResponsiveTypography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon />
            {t('personalFinancialAnalysis.scenarios.chartsComparison')}
          </ResponsiveTypography>

          {/* Balance Sheet Chart Comparison */}
          <Box sx={{ mb: 4 }}>
            <ResponsiveTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {t('personalFinancialAnalysis.charts.balanceSheet.title')}
            </ResponsiveTypography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  <ResponsiveTypography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
                    {currentScenario.name}
                  </ResponsiveTypography>
                  <BalanceSheetChart
                    summaryMetrics={currentMetrics}
                    incomeExpenseBreakdown={currentBreakdown}
                    analysis={analysis}
                    baseCurrency={baseCurrency}
                    height={400}
                  />
                </Box>
              </Grid>
              {selectedScenarioId && selectedScenario && selectedMetrics && selectedBreakdown && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <ResponsiveTypography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
                      {selectedScenario.name}
                    </ResponsiveTypography>
                    <BalanceSheetChart
                      summaryMetrics={selectedMetrics}
                      incomeExpenseBreakdown={selectedBreakdown}
                      analysis={selectedAnalysis}
                      baseCurrency={baseCurrency}
                      height={400}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Asset Pyramid Chart Comparison */}
          <Box>
            <ResponsiveTypography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              {t('personalFinancialAnalysis.charts.assetPyramid.title')}
            </ResponsiveTypography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box>
                  <ResponsiveTypography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
                    {currentScenario.name}
                  </ResponsiveTypography>
                  <AssetPyramidChart
                    summaryMetrics={currentMetrics}
                    baseCurrency={baseCurrency}
                    height={300}
                  />
                </Box>
              </Grid>
              {selectedScenarioId && selectedScenario && selectedMetrics && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <ResponsiveTypography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
                      {selectedScenario.name}
                    </ResponsiveTypography>
                    <AssetPyramidChart
                      summaryMetrics={selectedMetrics}
                      baseCurrency={baseCurrency}
                      height={300}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>
      )}

      {!selectedScenarioId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('personalFinancialAnalysis.scenarios.selectToCompare')}
        </Alert>
      )}

      {/* Edit Scenario Data Modal */}
      {selectedScenarioId && selectedScenario && (
        <ModalWrapper
          open={editDataModalOpen}
          onClose={() => setEditDataModalOpen(false)}
          title={t('personalFinancialAnalysis.scenarios.editData')}
          icon={<EditIcon />}
          maxWidth="xl"
          fullWidth
        >
          <Box>
            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('personalFinancialAnalysis.scenarios.editDataDescription')}
            </ResponsiveTypography>
            
            {/* Create temporary analysis object from selected scenario for editing */}
            {(() => {
              const scenarioAnalysis: PersonalFinancialAnalysis = {
                ...analysis,
                assets: selectedScenario.assets,
                income: selectedScenario.income,
                expenses: selectedScenario.expenses,
                debts: selectedScenario.debts,
              };

              return (
                <Step1CashFlowSurvey
                  analysis={scenarioAnalysis}
                  defaultCollapsed={true}
                  onUpdate={async (updates) => {
                    // Update scenario data when Step1CashFlowSurvey data changes
                    if (!analysis.id || !selectedScenarioId) return;
                    
                    const updatedScenario: AnalysisScenario = {
                      ...selectedScenario,
                      assets: updates.assets || selectedScenario.assets,
                      income: updates.income || selectedScenario.income,
                      expenses: updates.expenses || selectedScenario.expenses,
                      debts: updates.debts || selectedScenario.debts,
                      updatedAt: new Date().toISOString(),
                    };

                    try {
                      await updateScenarioMutation.mutateAsync({
                        analysisId: analysis.id,
                        scenarioId: selectedScenarioId,
                        scenario: {
                          name: updatedScenario.name,
                          description: updatedScenario.description,
                          assets: updatedScenario.assets,
                          income: updatedScenario.income,
                          expenses: updatedScenario.expenses,
                          debts: updatedScenario.debts,
                        },
                      });
                      
                      if (onScenarioUpdate) {
                        await onScenarioUpdate(selectedScenarioId, {
                          assets: updatedScenario.assets,
                          income: updatedScenario.income,
                          expenses: updatedScenario.expenses,
                          debts: updatedScenario.debts,
                        });
                      }
                    } catch (error) {
                      console.error('Error updating scenario data:', error);
                    }
                  }}
                  onPortfolioLink={async () => {}}
                  onPortfolioUnlink={async () => {}}
                />
              );
            })()}
          </Box>
        </ModalWrapper>
      )}

      {/* Note about editing scenarios */}
      <Alert severity="info">
        {t('personalFinancialAnalysis.steps.step3.note')}
      </Alert>
    </Box>
  );
};
