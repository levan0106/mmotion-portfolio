import React, { useEffect, useState } from 'react';
import { Box, Paper, Grid, Alert, AlertTitle, CircularProgress, Slider, IconButton } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { AllocationChart } from './AllocationChart';
import NumberInput from '../Common/NumberInput';
import { PlanData, AllocationSuggestion, SuggestAllocationRequest, RiskTolerance, AssetAllocation } from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';
import { formatPercentageValue } from '../../utils/format';
import { financialFreedomApi } from '../../services/api.financial-freedom';

interface Step2AllocationSuggestionsProps {
  data: PlanData;
  onUpdate: (stepData: any) => void;
  onNext: () => void;
  onBack: () => void;
  hideNavigation?: boolean;
}

export const Step2AllocationSuggestions: React.FC<Step2AllocationSuggestionsProps> = ({
  data,
  onUpdate,
  onBack,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [allocationSuggestion, setAllocationSuggestion] = useState<AllocationSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<AssetAllocation>({
    stocks: 0,
    bonds: 0,
    gold: 0,
    other: 0,
    cash: 0,
  });
  const [expectedReturns, setExpectedReturns] = useState<AssetAllocation>({
    stocks: 0,
    bonds: 0,
    gold: 0,
    other: 0,
    cash: 0,
  });

  // Restore allocationSuggestion from data if available (when navigating back)
  // This should run first to restore data before fetching
  useEffect(() => {
    if (data.step2?.allocationSuggestion) {
      setAllocationSuggestion(data.step2.allocationSuggestion);
      // Restore allocation from suggestion or saved allocation
      const savedAllocation = (data.step2 as any)?.allocation;
      if (savedAllocation) {
        setAllocation(savedAllocation);
      } else if (data.step2.allocationSuggestion.assetTypes) {
        // Extract allocation from assetTypes
        const suggestedAllocation = data.step2.allocationSuggestion.assetTypes.reduce((acc, at) => {
          acc[at.code] = at.allocation;
          return acc;
        }, {} as Record<string, number>);
        setAllocation(suggestedAllocation);
      }
      // Restore expected returns if available
      const savedExpectedReturns = (data.step2 as any)?.expectedReturns;
      if (savedExpectedReturns) {
        setExpectedReturns(savedExpectedReturns);
      } else if (data.step2.allocationSuggestion.assetTypes) {
        // Extract expected returns from assetTypes
        const expectedReturns = data.step2.allocationSuggestion.assetTypes.reduce((acc, at) => {
          acc[at.code] = at.expectedReturn;
          return acc;
        }, {} as Record<string, number>);
        setExpectedReturns(expectedReturns);
      }
      setError(null); // Clear any errors when restoring
    }
  }, [data.step2?.allocationSuggestion]);

  useEffect(() => {
    const fetchAllocation = async () => {
      if (!data.step1?.finalResult) {
        setError(t('financialFreedom.step2.noAllocation'));
        return;
      }

      // Skip if we already have allocationSuggestion (either from restore or previous fetch)
      if (allocationSuggestion) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const finalResult = data.step1.finalResult;
        const request: SuggestAllocationRequest = {
          requiredReturnRate: finalResult.returnRate || 0,
          riskTolerance: finalResult.riskTolerance || RiskTolerance.MODERATE,
          investmentYears: finalResult.investmentYears,
        };

        const suggestion = await financialFreedomApi.suggestAllocation(request);
        setAllocationSuggestion(suggestion);
        // Initialize allocation from suggestion if not already set
        if (suggestion.assetTypes) {
          const suggestedAllocation = suggestion.assetTypes.reduce((acc, at) => {
            acc[at.code] = at.allocation;
            return acc;
          }, {} as Record<string, number>);
          setAllocation(suggestedAllocation);
        }
        // Initialize expected returns from suggestion if available, otherwise use defaults
        const expectedReturns = suggestion.assetTypes ? suggestion.assetTypes.reduce((acc, at) => {
          acc[at.code] = at.expectedReturn;
          return acc;
        }, {} as Record<string, number>) : {
          stocks: 12,
          bonds: 6,
          gold: 8,
          other: 10,
          cash: 3,
        };
        setExpectedReturns(expectedReturns);
        // Merge with existing data to preserve all fields
        onUpdate({ 
          ...data?.step2,
          allocationSuggestion: suggestion,
          allocation: suggestion.assetTypes ? suggestion.assetTypes.reduce((acc, at) => {
            acc[at.code] = at.allocation;
            return acc;
          }, {} as Record<string, number>) : {},
          expectedReturns: expectedReturns,
        });
      } catch (err: any) {
        setError(err.message || t('financialFreedom.form.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchAllocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.step1?.finalResult?.returnRate, data.step2?.allocationSuggestion]);

  const handleAllocationChange = (key: keyof AssetAllocation, value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    const newAllocation = {
      ...allocation,
      [key]: clampedValue,
    };

    setAllocation(newAllocation);
    
    // Update parent component
    onUpdate({
      ...data?.step2,
      allocation: newAllocation,
      allocationSuggestion: allocationSuggestion,
      expectedReturns: expectedReturns,
    });
  };

  const handleExpectedReturnChange = (key: keyof AssetAllocation, value: number) => {
    const newExpectedReturns = {
      ...expectedReturns,
      [key]: Math.max(0, Math.min(100, value)), // Clamp between 0 and 100
    };
    setExpectedReturns(newExpectedReturns);
    
    // Update parent component
    onUpdate({
      ...data?.step2,
      allocation: allocation,
      allocationSuggestion: allocationSuggestion,
      expectedReturns: newExpectedReturns,
    });
  };

  const getTotalAllocation = () => {
    return Object.values(allocation).reduce((sum, val) => sum + (val || 0), 0);
  };

  const calculatePortfolioReturn = () => {
    if (totalAllocation === 0) return 0;
    // Calculate weighted average return
    // Each asset's contribution = (allocation percentage / 100) * expected return
    const weightedSum = 
      (allocation.stocks / 100 * expectedReturns.stocks) +
      (allocation.bonds / 100 * expectedReturns.bonds) +
      (allocation.gold / 100 * expectedReturns.gold) +
      (allocation.other / 100 * expectedReturns.other) +
      (allocation.cash / 100 * expectedReturns.cash);
    return weightedSum;
  };

  const totalAllocation = getTotalAllocation();
  const isTotalValid = Math.abs(totalAllocation - 100) < 0.01; // Allow small floating point differences
  const portfolioReturn = calculatePortfolioReturn();
  const requiredReturn = data.step1?.finalResult?.returnRate || 0;
  const returnDifference = portfolioReturn - requiredReturn;
  const isReturnMet = returnDifference >= 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          <AlertTitle>{t('common.error')}</AlertTitle>
          {error}
        </Alert>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <ResponsiveButton type="button" variant="outlined" onClick={onBack}>
            {t('common.back')}
          </ResponsiveButton>
        </Box>
      </Box>
    );
  }

  if (!allocationSuggestion) {
    return (
      <Box>
        <Alert severity="info">
          <AlertTitle>{t('financialFreedom.step2.noAllocation')}</AlertTitle>
        </Alert>
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
      {/* Debug: Plan Data */}
      {/* <DebugPlanData data={data} currentStep={2} /> */}

      {/* <Paper sx={{ p: 3, mb: 3 }}>
        <ResponsiveTypography variant="h5" sx={{ mb: 1 }}>
          {t('financialFreedom.step2.title')}
        </ResponsiveTypography>
        <ResponsiveTypography variant="body2" color="text.secondary">
          {t('financialFreedom.step2.subtitle')}
        </ResponsiveTypography>
      </Paper> */}

      <Grid container spacing={3}>
        {/* Left: Allocation Input Form (2/3 width) */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
              {t('financialFreedom.step2.suggestedAllocation')}
            </ResponsiveTypography>
            
            {/* Allocation Input Form */}
            <Box>
              {/* Stocks */}
              <Box sx={{ mb: 2 }}>
                <ResponsiveTypography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {t('financialFreedom.allocation.stocks')}
                </ResponsiveTypography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('stocks', Math.max(0, Math.round(allocation.stocks) - 1))}
                        disabled={allocation.stocks <= 0}
                        sx={{ p: 0.5 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Slider
                        value={allocation.stocks}
                        onChange={(_, value) => handleAllocationChange('stocks', value as number)}
                        min={0}
                        max={100}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('stocks', Math.min(100, Math.round(allocation.stocks) + 1))}
                        disabled={allocation.stocks >= 100 || totalAllocation >= 100}
                        sx={{ p: 0.5 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 50, textAlign: 'right', ml: 0.5 }}>
                        {formatPercentageValue(allocation.stocks)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <NumberInput
                      label={t('financialFreedom.step2.expectedReturn')}
                      value={expectedReturns.stocks}
                      onChange={(value) => handleExpectedReturnChange('stocks', value)}
                      min={0}
                      max={100}
                      step={0.1}
                      decimalPlaces={1}
                      showThousandsSeparator={false}
                      suffix="%"
                      showIcon={false}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Bonds */}
              <Box sx={{ mb: 2 }}>
                <ResponsiveTypography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {t('financialFreedom.allocation.bonds')}
                </ResponsiveTypography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('bonds', Math.max(0, Math.round(allocation.bonds) - 1))}
                        disabled={allocation.bonds <= 0}
                        sx={{ p: 0.5 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Slider
                        value={allocation.bonds}
                        onChange={(_, value) => handleAllocationChange('bonds', value as number)}
                        min={0}
                        max={100}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('bonds', Math.min(100, Math.round(allocation.bonds) + 1))}
                        disabled={allocation.bonds >= 100 || totalAllocation >= 100}
                        sx={{ p: 0.5 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 50, textAlign: 'right', ml: 0.5 }}>
                        {formatPercentageValue(allocation.bonds)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <NumberInput
                      label={t('financialFreedom.step2.expectedReturn')}
                      value={expectedReturns.bonds}
                      onChange={(value) => handleExpectedReturnChange('bonds', value)}
                      min={0}
                      max={100}
                      step={0.1}
                      decimalPlaces={1}
                      showThousandsSeparator={false}
                      suffix="%"
                      showIcon={false}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Gold */}
              <Box sx={{ mb: 2 }}>
                <ResponsiveTypography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {t('financialFreedom.allocation.gold')}
                </ResponsiveTypography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('gold', Math.max(0, Math.round(allocation.gold) - 1))}
                        disabled={allocation.gold <= 0}
                        sx={{ p: 0.5 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Slider
                        value={allocation.gold}
                        onChange={(_, value) => handleAllocationChange('gold', value as number)}
                        min={0}
                        max={100}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('gold', Math.min(100, Math.round(allocation.gold) + 1))}
                        disabled={allocation.gold >= 100 || totalAllocation >= 100}
                        sx={{ p: 0.5 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 50, textAlign: 'right', ml: 0.5 }}>
                        {formatPercentageValue(allocation.gold)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <NumberInput
                      label={t('financialFreedom.step2.expectedReturn')}
                      value={expectedReturns.gold}
                      onChange={(value) => handleExpectedReturnChange('gold', value)}
                      min={0}
                      max={100}
                      step={0.1}
                      decimalPlaces={1}
                      showThousandsSeparator={false}
                      suffix="%"
                      showIcon={false}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Other */}
              <Box sx={{ mb: 2 }}>
                <ResponsiveTypography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {t('financialFreedom.allocation.other')}
                </ResponsiveTypography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('other', Math.max(0, Math.round(allocation.other) - 1))}
                        disabled={allocation.other <= 0}
                        sx={{ p: 0.5 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Slider
                        value={allocation.other}
                        onChange={(_, value) => handleAllocationChange('other', value as number)}
                        min={0}
                        max={100}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('other', Math.min(100, Math.round(allocation.other) + 1))}
                        disabled={allocation.other >= 100 || totalAllocation >= 100}
                        sx={{ p: 0.5 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 50, textAlign: 'right', ml: 0.5 }}>
                        {formatPercentageValue(allocation.other)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <NumberInput
                      label={t('financialFreedom.step2.expectedReturn')}
                      value={expectedReturns.other}
                      onChange={(value) => handleExpectedReturnChange('other', value)}
                      min={0}
                      max={100}
                      step={0.1}
                      decimalPlaces={1}
                      showThousandsSeparator={false}
                      suffix="%"
                      showIcon={false}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Cash */}
              <Box sx={{ mb: 2 }}>
                <ResponsiveTypography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {t('financialFreedom.allocation.cash')}
                </ResponsiveTypography>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('cash', Math.max(0, Math.round(allocation.cash) - 1))}
                        disabled={allocation.cash <= 0}
                        sx={{ p: 0.5 }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Slider
                        value={allocation.cash}
                        onChange={(_, value) => handleAllocationChange('cash', value as number)}
                        min={0}
                        max={100}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleAllocationChange('cash', Math.min(100, Math.round(allocation.cash) + 1))}
                        disabled={allocation.cash >= 100 || totalAllocation >= 100}
                        sx={{ p: 0.5 }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 50, textAlign: 'right', ml: 0.5 }}>
                        {formatPercentageValue(allocation.cash)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <NumberInput
                      label={t('financialFreedom.step2.expectedReturn')}
                      value={expectedReturns.cash}
                      onChange={(value) => handleExpectedReturnChange('cash', value)}
                      min={0}
                      max={100}
                      step={0.1}
                      decimalPlaces={1}
                      showThousandsSeparator={false}
                      suffix="%"
                      showIcon={false}
                      fullWidth
                      margin="dense"
                    />
                  </Grid>
                </Grid>
              </Box>
              
              {/* Total Validation */}
              <Box sx={{ mt: 2, p: 2, borderRadius: 1, border: '1px solid', borderColor: isTotalValid ? 'success.main' : 'error.main' }}>
                <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: isTotalValid ? 'success.main' : 'error.main' }}>
                  {t('financialFreedom.step2.totalAllocation')}: {formatPercentageValue(totalAllocation)}
                </ResponsiveTypography>
                {/* {!isTotalValid && (
                  <ResponsiveTypography variant="caption" color="error">
                    {t('financialFreedom.step2.totalMustBe100')}
                  </ResponsiveTypography>
                )} */}
              </Box>

              
            </Box>
          </Paper>
        </Grid>

        {/* Right: Preview Chart and Info (1/3 width) */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
              {t('financialFreedom.step2.allocationChart')}
            </ResponsiveTypography>
            
            <Box sx={{ mb: 3 }}>
              <AllocationChart
                allocation={allocation}
                height={300}
              />
            </Box>

            {/* {allocationSuggestion && (
              <Box>
                <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('financialFreedom.step2.expectedReturn')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatPercentageValue(allocationSuggestion.expectedReturn)}
                </ResponsiveTypography>
              </Box>
            )} */}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
              {t('financialFreedom.step2.recommendations')}
            </ResponsiveTypography>
            {/* Portfolio Return Calculation and Comparison */}
            {isTotalValid && totalAllocation > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {t('financialFreedom.step2.portfolioReturn')}
                  </ResponsiveTypography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('financialFreedom.step2.calculatedReturn')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatPercentageValue(portfolioReturn)}
                    </ResponsiveTypography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {t('financialFreedom.step2.requiredReturn')}:
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatPercentageValue(requiredReturn)}
                    </ResponsiveTypography>
                  </Box>
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 600 }}>
                        {t('financialFreedom.step2.difference')}:
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: isReturnMet ? 'success.main' : 'error.main'
                        }}
                      >
                        {isReturnMet ? '+' : ''}{formatPercentageValue(returnDifference)}
                      </ResponsiveTypography>
                    </Box>
                    {!isReturnMet && (
                      <ResponsiveTypography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {t('financialFreedom.step2.returnNotMet')}
                      </ResponsiveTypography>
                    )}
                  </Box>
                </Box>
              )}
            {/* {allocationSuggestion.recommendations.map((rec, index) => (
              <Alert key={index} severity="info" sx={{ mb: 1 }}>
                {rec}
              </Alert>
            ))} */}
          </Paper>
        </Grid>
      </Grid>

    </Box>
  );
};

