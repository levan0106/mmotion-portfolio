import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Grid, 
  Alert, 
  AlertTitle, 
  CircularProgress, 
  Slider, 
  IconButton, 
  Button
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { AllocationChart } from './AllocationChart';
import NumberInput from '../Common/NumberInput';
import { 
  PlanData, 
  AllocationSuggestion, 
  SuggestAllocationRequest, 
  RiskTolerance, 
  AssetAllocation, 
  AssetTypeMetadata
} from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';
import { formatPercentageValue } from '../../utils/format';
import { financialFreedomApi } from '../../services/api.financial-freedom';
import { ASSET_TYPE_TEMPLATES } from '../../config/assetTypeTemplates';
import { SelectAssetTypeModal } from './SelectAssetTypeModal';
import { AssetTypeTemplate } from '../../types/financialFreedom.types';

interface Step2AllocationSuggestionsProps {
  data: PlanData;
  onUpdate: (stepData: any) => void;
  onNext: () => void;
  onBack: () => void;
  hideNavigation?: boolean;
}

export const Step2AllocationSuggestionsDynamic: React.FC<Step2AllocationSuggestionsProps> = ({
  data,
  onUpdate,
  onBack,
}) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [allocationSuggestion, setAllocationSuggestion] = useState<AllocationSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<AssetAllocation>({});
  const [expectedReturns, setExpectedReturns] = useState<AssetAllocation>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Get assetTypes from allocationSuggestion, fallback to empty array
  const assetTypes = allocationSuggestion?.assetTypes || [];

  // Restore data from step2 - this should run first to restore saved data
  // Use a ref to track if we've already restored to avoid unnecessary updates
  const hasRestoredRef = useRef(false);
  
  useEffect(() => {
    if (data.step2?.allocationSuggestion) {
      const suggestion = data.step2.allocationSuggestion;
      
      // Only restore if allocationSuggestion is different from current state
      // or if we haven't restored yet
      if (!hasRestoredRef.current || allocationSuggestion !== suggestion) {
        setAllocationSuggestion(suggestion);
        
        // Extract allocation and expectedReturns from assetTypes
        if (suggestion.assetTypes && suggestion.assetTypes.length > 0) {
          const extractedAllocation: AssetAllocation = {};
          const extractedExpectedReturns: AssetAllocation = {};
          
          suggestion.assetTypes.forEach(assetType => {
            extractedAllocation[assetType.code] = assetType.allocation;
            extractedExpectedReturns[assetType.code] = assetType.expectedReturn;
          });
          
          setAllocation(extractedAllocation);
          setExpectedReturns(extractedExpectedReturns);
        }
        
        hasRestoredRef.current = true;
        setError(null);
      }
    }
  }, [data.step2?.allocationSuggestion, allocationSuggestion]);

  useEffect(() => {
    const fetchAllocation = async () => {
      if (!data.step1?.finalResult) {
        setError(t('financialFreedom.step2.noAllocation'));
        return;
      }

      // Don't fetch if we already have allocationSuggestion from saved data
      // This prevents resetting user modifications when navigating back
      if (data.step2?.allocationSuggestion || allocationSuggestion) {
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
        
        // Extract allocation and expectedReturns from assetTypes
        if (suggestion.assetTypes && suggestion.assetTypes.length > 0) {
          const extractedAllocation: AssetAllocation = {};
          const extractedExpectedReturns: AssetAllocation = {};
          
          suggestion.assetTypes.forEach(assetType => {
            extractedAllocation[assetType.code] = assetType.allocation;
            extractedExpectedReturns[assetType.code] = assetType.expectedReturn;
          });
          
          setAllocation(extractedAllocation);
          setExpectedReturns(extractedExpectedReturns);
        }
        
        // When fetching from API, save suggestion only
        // User modifications will be saved separately if different
        onUpdate({ 
          allocationSuggestion: suggestion,
        });
      } catch (err: any) {
        setError(err.message || t('financialFreedom.form.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchAllocation();
    // Only fetch when step1 data changes, not when step2 data changes (to avoid resetting saved data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.step1?.finalResult?.returnRate]);

  const handleAllocationChange = (assetTypeCode: string, value: number) => {
    if (!allocationSuggestion) return;
    
    const clampedValue = Math.max(0, Math.min(100, value));
    const newAllocation = {
      ...allocation,
      [assetTypeCode]: clampedValue,
    };

    setAllocation(newAllocation);
    
    // Update allocationSuggestion.assetTypes with new allocation
    const updatedAssetTypes = allocationSuggestion.assetTypes.map(at => 
      at.code === assetTypeCode 
        ? { ...at, allocation: clampedValue }
        : at
    );
    
    // Update allocationSuggestion with new assetTypes
    const updatedAllocationSuggestion: AllocationSuggestion = {
      ...allocationSuggestion,
      assetTypes: updatedAssetTypes,
    };
    
    setAllocationSuggestion(updatedAllocationSuggestion);
    
    // Always save updated allocationSuggestion
    onUpdate({ 
      allocationSuggestion: updatedAllocationSuggestion,
    });
  };

  const handleExpectedReturnChange = (assetTypeCode: string, value: number) => {
    if (!allocationSuggestion) return;
    
    const clampedValue = Math.max(0, Math.min(100, value));
    const newExpectedReturns = {
      ...expectedReturns,
      [assetTypeCode]: clampedValue,
    };
    setExpectedReturns(newExpectedReturns);
    
    // Update allocationSuggestion.assetTypes with new expectedReturn
    const updatedAssetTypes = allocationSuggestion.assetTypes.map(at => 
      at.code === assetTypeCode 
        ? { ...at, expectedReturn: clampedValue }
        : at
    );
    
    // Update allocationSuggestion with new assetTypes
    const updatedAllocationSuggestion: AllocationSuggestion = {
      ...allocationSuggestion,
      assetTypes: updatedAssetTypes,
    };
    
    setAllocationSuggestion(updatedAllocationSuggestion);
    
    // Always save updated allocationSuggestion
    onUpdate({ 
      allocationSuggestion: updatedAllocationSuggestion,
    });
  };

  const handleSelectAssetType = (template: AssetTypeTemplate) => {
    if (!allocationSuggestion) return;
    
    // Check if asset type already exists
    if (allocationSuggestion.assetTypes.some(at => at.code === template.code)) {
      return;
    }
    
    const newAssetType: AssetTypeMetadata = {
      code: template.code,
      name: template.name,
      nameEn: template.nameEn,
      allocation: 0,
      expectedReturn: template.defaultExpectedReturn,
    };
    
    const updatedAssetTypes = [...allocationSuggestion.assetTypes, newAssetType];
    const updatedAllocation = { ...allocation, [template.code]: 0 };
    const updatedExpectedReturns = { ...expectedReturns, [template.code]: template.defaultExpectedReturn };
    
    setAllocation(updatedAllocation);
    setExpectedReturns(updatedExpectedReturns);
    
    // Update allocationSuggestion with new assetTypes
    const updatedAllocationSuggestion: AllocationSuggestion = {
      ...allocationSuggestion,
      assetTypes: updatedAssetTypes,
    };
    
    setAllocationSuggestion(updatedAllocationSuggestion);
    
    // Always save updated allocationSuggestion
    onUpdate({ 
      allocationSuggestion: updatedAllocationSuggestion,
    });
  };

  const handleRemoveAssetType = (assetTypeCode: string) => {
    if (!allocationSuggestion) return;
    
    // Don't allow removing if it's the only asset type
    if (allocationSuggestion.assetTypes.length <= 1) return;
    
    const updatedAssetTypes = allocationSuggestion.assetTypes.filter(at => at.code !== assetTypeCode);
    const newAllocation = { ...allocation };
    delete newAllocation[assetTypeCode];
    setAllocation(newAllocation);
    
    const newExpectedReturns = { ...expectedReturns };
    delete newExpectedReturns[assetTypeCode];
    setExpectedReturns(newExpectedReturns);
    
    // Update allocationSuggestion with new assetTypes
    const updatedAllocationSuggestion: AllocationSuggestion = {
      ...allocationSuggestion,
      assetTypes: updatedAssetTypes,
    };
    
    setAllocationSuggestion(updatedAllocationSuggestion);
    
    // Always save updated allocationSuggestion
    onUpdate({ 
      allocationSuggestion: updatedAllocationSuggestion,
    });
  };

  const getTotalAllocation = () => {
    return Object.values(allocation).reduce((sum, val) => sum + (val || 0), 0);
  };

  const calculatePortfolioReturn = () => {
    if (getTotalAllocation() === 0) return 0;
    
    let weightedSum = 0;
    assetTypes.forEach(assetType => {
      const allocationValue = allocation[assetType.code] || 0;
      const expectedReturn = expectedReturns[assetType.code] || 0;
      weightedSum += (allocationValue / 100 * expectedReturn);
    });
    
    return weightedSum;
  };

  const totalAllocation = getTotalAllocation();
  const isTotalValid = Math.abs(totalAllocation - 100) < 0.01;
  const portfolioReturn = calculatePortfolioReturn();
  const requiredReturn = data.step1?.finalResult?.returnRate || 0;
  const returnDifference = portfolioReturn - requiredReturn;
  const isReturnMet = returnDifference >= 0;

  const getAssetTypeName = (assetType: AssetTypeMetadata) => {
    return i18n.language === 'en' && assetType.nameEn ? assetType.nameEn : assetType.name;
  };

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

      <Grid container spacing={3}>
        {/* Left: Allocation Input Form (2/3 width) */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <ResponsiveTypography variant="h6">
                {t('financialFreedom.step2.suggestedAllocation')}
              </ResponsiveTypography>
              <Button
                startIcon={<AddCircleIcon />}
                variant="outlined"
                size="small"
                onClick={() => setShowAddDialog(true)}
              >
                {t('common.add')}
              </Button>
            </Box>
            
            {/* Dynamic Asset Types */}
            <Box>
              {assetTypes.map((assetType) => {
                return (
                  <Box 
                    key={assetType.code} 
                    sx={{ 
                      mb: 0,
                      '&:hover .delete-icon': {
                        opacity: 1,
                        visibility: 'visible',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 600 }}>
                          {getAssetTypeName(assetType)}
                        </ResponsiveTypography>
                      </Box>
                      {assetTypes.length > 1 && (
                        <IconButton
                          className="delete-icon"
                          size="small"
                          onClick={() => handleRemoveAssetType(assetType.code)}
                          sx={{ 
                            p: 0.5,
                            opacity: 0,
                            visibility: 'hidden',
                            transition: 'opacity 0.2s, visibility 0.2s',
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleAllocationChange(assetType.code, Math.max(0, Math.round((allocation[assetType.code] || 0) - 1)))}
                            disabled={(allocation[assetType.code] || 0) <= 0}
                            sx={{ p: 0.5 }}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Slider
                            value={allocation[assetType.code] || 0}
                            onChange={(_, value) => handleAllocationChange(assetType.code, value as number)}
                            min={0}
                            max={100}
                            step={0.1}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value.toFixed(1)}%`}
                            sx={{ flex: 1 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleAllocationChange(assetType.code, Math.min(100, Math.round((allocation[assetType.code] || 0) + 1)))}
                            disabled={(allocation[assetType.code] || 0) >= 100 || totalAllocation >= 100}
                            sx={{ p: 0.5 }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                          <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 50, textAlign: 'right', ml: 0.5 }}>
                            {formatPercentageValue(allocation[assetType.code] || 0)}
                          </ResponsiveTypography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <NumberInput
                          label={t('financialFreedom.step2.expectedReturn')}
                          value={expectedReturns[assetType.code] || 0}
                          onChange={(value) => handleExpectedReturnChange(assetType.code, value)}
                          min={0}
                          max={100}
                          step={0.1}
                          decimalPlaces={1}
                          showThousandsSeparator={false}
                          suffix="%"
                          showIcon={false}
                          fullWidth
                          margin="dense"
                          size='medium'
                        />
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
              
              {/* Total Validation */}
              <Box sx={{ mt: 2, p: 2, borderRadius: 1, border: '1px solid', borderColor: isTotalValid ? 'success.main' : 'error.main' }}>
                <ResponsiveTypography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: isTotalValid ? 'success.main' : 'error.main' }}>
                  {t('financialFreedom.step2.totalAllocation')}: {formatPercentageValue(totalAllocation)}
                </ResponsiveTypography>
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
            
              <AllocationChart
                key={`chart-${assetTypes.map(at => at.code).join('-')}-${Object.keys(allocation).join('-')}`}
                allocation={allocation}
                showAllAssetTypes={true}
                assetTypes={assetTypes.map(at => {
                  const template = ASSET_TYPE_TEMPLATES.find(t => t.code === at.code);
                  return {
                    id: at.code,
                    name: at.name,
                    nameEn: at.nameEn,
                    color: template?.color,
                  };
                })}
              />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
              {t('financialFreedom.step2.recommendations')}
            </ResponsiveTypography>

            {/* Portfolio Return Calculation and Comparison */}
            {totalAllocation > 0 && (
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
          </Paper>
        </Grid>
      </Grid>

      {/* Add Asset Type Modal */}
      <SelectAssetTypeModal
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSelect={handleSelectAssetType}
        existingAssetTypes={assetTypes}
      />
    </Box>
  );
};

