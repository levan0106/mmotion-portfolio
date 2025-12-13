/**
 * Step 3: Asset Restructuring Component
 * Allows users to create and compare scenarios for asset restructuring
 */

import React, { useState, useMemo } from 'react';
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
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common';
import { Step3AssetRestructuringProps, AnalysisScenario, PersonalFinancialAnalysis } from '../../types/personalFinancialAnalysis.types';
import { useTranslation } from 'react-i18next';
import { useAccount } from '../../contexts/AccountContext';
import { formatCurrency } from '../../utils/format';
import { useSummaryMetrics } from '../../hooks/useAnalysisCalculations';
import { useCreateScenario, useDeleteScenario } from '../../hooks/usePersonalFinancialAnalysis';

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
  onDataUpdate,
}) => {
  const { t } = useTranslation();
  const { baseCurrency } = useAccount();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createScenarioMutation = useCreateScenario();
  const deleteScenarioMutation = useDeleteScenario();

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
      await createScenarioMutation.mutateAsync({
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
      await createScenarioMutation.mutateAsync({
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
      <ResponsiveTypography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {t('personalFinancialAnalysis.steps.step3.title')}
      </ResponsiveTypography>

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
      {selectedScenarioId && selectedScenario && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <ResponsiveTypography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CompareIcon />
            {t('personalFinancialAnalysis.scenarios.comparison')}
          </ResponsiveTypography>

          <Grid container spacing={2}>
            {/* Current Scenario */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <ResponsiveTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {currentScenario.name}
                  </ResponsiveTypography>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.totalAssets')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(currentMetrics?.totalAssets || 0, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.totalDebt')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(currentMetrics?.totalDebt || 0, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.netWorth')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: (currentMetrics?.netWorth || 0) >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {formatCurrency(currentMetrics?.netWorth || 0, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.debtToAssetRatio')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                        {(currentMetrics?.debtToAssetRatio || 0).toFixed(1)}%
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Selected Scenario */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <ResponsiveTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedScenario.name}
                  </ResponsiveTypography>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.totalAssets')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(selectedMetrics?.totalAssets || 0, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.totalDebt')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatCurrency(selectedMetrics?.totalDebt || 0, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.netWorth')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: (selectedMetrics?.netWorth || 0) >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {formatCurrency(selectedMetrics?.netWorth || 0, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <ResponsiveTypography variant="body2">
                        {t('personalFinancialAnalysis.metrics.debtToAssetRatio')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                        {(selectedMetrics?.debtToAssetRatio || 0).toFixed(1)}%
                      </ResponsiveTypography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {!selectedScenarioId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('personalFinancialAnalysis.scenarios.selectToCompare')}
        </Alert>
      )}

      {/* Note about editing scenarios */}
      <Alert severity="info">
        {t('personalFinancialAnalysis.steps.step3.note')}
      </Alert>
    </Box>
  );
};
