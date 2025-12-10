import React, { useEffect, useState, useMemo } from 'react';
import { Box, Paper, Grid, Alert, TextField, Divider, Stack, Chip } from '@mui/material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { ProgressChart } from './ProgressChart';
import { ScenarioComparison } from './ScenarioComparison';
import { AllocationChart } from './AllocationChart';
import { PlanData, ConsolidateResponse, ConsolidateRequest, PaymentFrequency, PaymentType, RiskTolerance } from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';
import { calculateConsolidate } from '../../utils/financialFreedomCalculation';
import { formatCurrency } from '../../utils/format';
import { ASSET_TYPE_TEMPLATES } from '../../config/assetTypeTemplates';
import { DebugPlanData } from './DebugPlanData';

interface Step3ConsolidatedOverviewProps {
  data: PlanData;
  onUpdate: (stepData: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSave?: () => void;
  hideNavigation?: boolean;
}

export const Step3ConsolidatedOverview: React.FC<Step3ConsolidatedOverviewProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
  onSave,
  hideNavigation = false,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>(data.step3?.planName || '');

  // Calculate consolidated data directly using calculation function (no API call)
  // Always recalculate when we have step1 and step2 data to ensure accuracy
  // Only use saved consolidationResult if we don't have enough data to calculate
  const consolidatedData = useMemo<ConsolidateResponse | null>(() => {
    // Always calculate from step1 and step2 data if available (ensures fresh calculation)
    if (data.step1?.finalResult && data.step2?.allocationSuggestion) {

    try {
      const finalResult = data.step1.finalResult;
      const request: ConsolidateRequest = {
        plans: [
          {
            targetPresentValue: finalResult.targetPresentValue ?? 0,
            futureValueRequired: finalResult.futureValueRequired ?? 0,
            initialInvestment: finalResult.initialInvestment || 0,
            periodicPayment: finalResult.periodicPayment || 0,
            paymentFrequency: finalResult.paymentFrequency || PaymentFrequency.MONTHLY,
            paymentType: finalResult.paymentType || PaymentType.CONTRIBUTION,
            investmentYears: finalResult.investmentYears ?? 15,
            requiredReturnRate: finalResult.returnRate || 0,
            inflationRate: finalResult.inflationRate || 4.5,
            riskTolerance: finalResult.riskTolerance || RiskTolerance.MODERATE,
            // Map suggestedAllocation from allocationSuggestion.assetTypes (new mapping structure)
            // Extract allocation from each assetType in the assetTypes array (contains user modifications)
            suggestedAllocation: data.step2.allocationSuggestion.assetTypes.reduce((acc, at) => {
              acc[at.code] = at.allocation;
              return acc;
            }, {} as Record<string, number>),
          },
        ],
      };

      return calculateConsolidate(request);
    } catch (err: any) {
      setError(err.message || t('financialFreedom.form.error'));
      return null;
    }
    }

    // Fallback: Only use saved consolidationResult if we don't have enough data to calculate
    // This can happen when navigating back in wizard and data hasn't been recalculated yet
    if (data.step3?.consolidationResult) {
      return data.step3.consolidationResult;
    }

    return null;
  }, [
    data.step1?.finalResult,
    data.step2?.allocationSuggestion,
    t,
  ]);

  // Save calculated data to state for persistence
  useEffect(() => {
    if (consolidatedData && !data.step3?.consolidationResult) {
      onUpdate({ 
        ...data?.step3,
        consolidationResult: consolidatedData 
      });
    }
  }, [consolidatedData, data?.step3, onUpdate]);

  // Update plan name in state when it changes
  const handlePlanNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setPlanName(newName);
    onUpdate({
      ...data?.step3,
      planName: newName,
    });
  };

  const handleSave = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Validate plan name
    if (!planName || planName.trim() === '') {
      setError(t('financialFreedom.step3.planNameRequired') || 'Plan name is required');
      return;
    }
    
    // Only call API when actually saving
    if (consolidatedData && onSave) {
      try {
        onSave();
      } catch (err: any) {
        setError(err.message || t('financialFreedom.form.error'));
      }
    } else {
      // If no onSave callback, just proceed to next step
      onNext();
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <ResponsiveButton type="button" variant="outlined" onClick={onBack}>
            {t('common.back')}
          </ResponsiveButton>
        </Box>
      </Box>
    );
  }

  if (!consolidatedData) {
    return (
      <Box>
        <Alert severity="info">No consolidated data available</Alert>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <ResponsiveButton type="button" variant="outlined" onClick={onBack}>
            {t('common.back')}
          </ResponsiveButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* <Paper sx={{ p: 3, mb: 3 }}>
        <ResponsiveTypography variant="h5" sx={{ mb: 1 }}>
          {t('financialFreedom.step3.title')}
        </ResponsiveTypography>
        <ResponsiveTypography variant="body2" color="text.secondary">
          {t('financialFreedom.step3.subtitle')}
        </ResponsiveTypography>
      </Paper> */}

      {/* Debug: Plan Data */}
      <DebugPlanData data={data} currentStep={3} />

      {/* Plan Name Input */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
          {t('financialFreedom.step3.planName')}
        </ResponsiveTypography> */}
        <TextField
          fullWidth
          label={t('financialFreedom.step3.planNameLabel')}
          placeholder={t('financialFreedom.step3.planNamePlaceholder')}
          value={planName}
          onChange={handlePlanNameChange}
          error={error !== null && (!planName || planName.trim() === '')}
          helperText={error && (!planName || planName.trim() === '') ? error : t('financialFreedom.step3.planNameHelper')}
          sx={{ mb: 2 }}
        />
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <ProgressChart
              projections={consolidatedData.yearlyProjections}
              targetValue={consolidatedData.totalFutureValueRequired || consolidatedData.totalTargetValue}
              title={t('financialFreedom.step3.yearlyProjections')}
              height={350}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <ScenarioComparison
              scenarios={consolidatedData.scenarios}
              recommended={consolidatedData.recommendedScenario || 'moderate'}
              title={t('financialFreedom.step3.scenarioComparison')}
              investmentYears={data.step1?.finalResult?.investmentYears}
            />
          </Paper>
        </Grid>

        {consolidatedData.combinedAllocation && (
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
              <AllocationChart
                allocation={consolidatedData.combinedAllocation}
                title={t('financialFreedom.step3.combinedAllocation')}
                assetTypes={data.step2?.allocationSuggestion?.assetTypes?.map((at) => {
                  const template = ASSET_TYPE_TEMPLATES.find((t) => t.code === at.code);
                  return {
                    id: at.code,
                    name: at.name,
                    nameEn: at.nameEn,
                    color: template?.color,
                  };
                })}
              />
            </Paper>
          </Grid>
        )}

        {consolidatedData.milestones && consolidatedData.milestones.length > 0 && (
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <Paper sx={{ p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
              <ResponsiveTypography variant="h6" sx={{ mb: 3 }}>
                {t('financialFreedom.step3.milestones')}
              </ResponsiveTypography>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack spacing={0} divider={<Divider />} sx={{ flex: 1 }}>
                  {consolidatedData.milestones.map((milestone, index) => {
                    const targetValue = (milestone.targetValue ?? milestone.value) || 0;
                    return (
                      <Box
                        key={index}
                        sx={{
                          py: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Chip
                              label={`${t('financialFreedom.scenario.years')} ${milestone.year}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                          <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {milestone.description}
                          </ResponsiveTypography>
                        </Box>
                        <Box sx={{ ml: 2, textAlign: 'right' }}>
                          <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {formatCurrency(targetValue, 'VND')}
                          </ResponsiveTypography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {!hideNavigation && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <ResponsiveButton type="button" variant="outlined" onClick={onBack}>
            {t('common.back')}
          </ResponsiveButton>
          <ResponsiveButton type="button" variant="contained" onClick={handleSave}>
            {t('financialFreedom.step3.savePlan')}
          </ResponsiveButton>
        </Box>
      )}
    </Box>
  );
};

