/**
 * Personal Financial Analysis 4-Step Wizard Component
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { PersonalFinancialAnalysis, AnalysisStatus } from '../../types/personalFinancialAnalysis.types';
import { useTranslation } from 'react-i18next';
import { useCreateAnalysis, useUpdateAnalysis } from '../../hooks/usePersonalFinancialAnalysis';
import { Step1CashFlowSurvey } from './Step1CashFlowSurvey';
import { Step2FinancialAnalysis } from './Step2FinancialAnalysis';
import { Step3AssetRestructuring } from './Step3AssetRestructuring';
import { Step4FinancialPlanning } from './Step4FinancialPlanning';

interface PersonalFinancialAnalysisWizardProps {
  analysis?: PersonalFinancialAnalysis | null;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const PersonalFinancialAnalysisWizard: React.FC<PersonalFinancialAnalysisWizardProps> = ({
  analysis,
  onComplete,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const createAnalysisMutation = useCreateAnalysis();
  const updateAnalysisMutation = useUpdateAnalysis();
  
  // Initialize analysis data
  const [analysisData, setAnalysisData] = useState<Partial<PersonalFinancialAnalysis>>(
    analysis || {
      assets: [],
      income: [],
      expenses: [],
      debts: [],
      linkedPortfolioIds: [],
      scenarios: [],
      status: AnalysisStatus.DRAFT,
    }
  );

  // Update analysisData when analysis prop changes
  useEffect(() => {
    if (analysis) {
      setAnalysisData(analysis);
    }
  }, [analysis]);

  const steps = [
    { label: t('personalFinancialAnalysis.steps.step1.title'), key: 'step1' },
    { label: t('personalFinancialAnalysis.steps.step2.title'), key: 'step2' },
    { label: t('personalFinancialAnalysis.steps.step3.title'), key: 'step3' },
    { label: t('personalFinancialAnalysis.steps.step4.title'), key: 'step4' },
  ];

  const handleDataUpdate = (updates: Partial<PersonalFinancialAnalysis>) => {
    setAnalysisData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleNext = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (activeStep < steps.length - 1) {
      // Auto-save on step change
      await handleAutoSave();
      setActiveStep((prev) => prev + 1);
    } else {
      // Last step - save and complete
      await handleSave();
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleAutoSave = async () => {
    try {
      if (analysis?.id) {
        // Update existing analysis
        await updateAnalysisMutation.mutateAsync({
          id: analysis.id,
          data: {
            assets: analysisData.assets,
            income: analysisData.income,
            expenses: analysisData.expenses,
            debts: analysisData.debts,
          },
        });
      } else {
        // Create new analysis (only on first step)
        if (activeStep === 0) {
          const newAnalysis = await createAnalysisMutation.mutateAsync({
            name: analysisData.name,
            assets: analysisData.assets,
            income: analysisData.income,
            expenses: analysisData.expenses,
            debts: analysisData.debts,
          });
          setAnalysisData((prev) => ({ ...prev, id: newAnalysis.id }));
        }
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
      // Don't block navigation on auto-save errors
    }
  };

  const handleSave = async () => {
    try {
      if (analysis?.id) {
        await updateAnalysisMutation.mutateAsync({
          id: analysis.id,
          data: {
            ...analysisData,
            status: AnalysisStatus.FINAL,
          },
        });
      } else if (analysisData.id) {
        await updateAnalysisMutation.mutateAsync({
          id: analysisData.id,
          data: {
            ...analysisData,
            status: AnalysisStatus.FINAL,
          },
        });
      } else {
        await createAnalysisMutation.mutateAsync({
          name: analysisData.name,
          assets: analysisData.assets,
          income: analysisData.income,
          expenses: analysisData.expenses,
          debts: analysisData.debts,
        });
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to any step (can be restricted later)
    setActiveStep(stepIndex);
  };

  const canProceedToNext = (): boolean => {
    // Basic validation - can be enhanced
    switch (activeStep) {
      case 0:
        // Step 1: At least some data should be entered
        return !!(
          (analysisData.assets && analysisData.assets.length > 0) ||
          (analysisData.income && analysisData.income.length > 0) ||
          (analysisData.expenses && analysisData.expenses.length > 0)
        );
      case 1:
        // Step 2: Always allow (calculated from step 1)
        return true;
      case 2:
        // Step 3: Always allow (optional scenarios)
        return true;
      case 3:
        // Step 4: Always allow (optional plan linking)
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    const currentAnalysis: PersonalFinancialAnalysis | undefined = analysisData.id && analysis
      ? { ...analysis, ...analysisData, id: analysisData.id }
      : analysis || (analysisData.id ? { ...analysisData as PersonalFinancialAnalysis, id: analysisData.id } : undefined);

    switch (activeStep) {
      case 0:
        const defaultAnalysis: PersonalFinancialAnalysis = {
          id: '',
          accountId: '',
          analysisDate: new Date().toISOString().split('T')[0],
          baseCurrency: 'VND',
          assets: analysisData.assets || [],
          income: analysisData.income || [],
          expenses: analysisData.expenses || [],
          debts: analysisData.debts || [],
          linkedPortfolioIds: analysisData.linkedPortfolioIds || [],
          scenarios: [],
          status: AnalysisStatus.DRAFT,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return (
          <Step1CashFlowSurvey
            analysis={currentAnalysis || defaultAnalysis}
            onUpdate={handleDataUpdate}
            onPortfolioLink={async (portfolioId: string) => {
              // Will be implemented with API
              console.log('Link portfolio:', portfolioId);
            }}
            onPortfolioUnlink={async (portfolioId: string) => {
              // Will be implemented with API
              console.log('Unlink portfolio:', portfolioId);
            }}
          />
        );
      case 1:
        return (
          <Step2FinancialAnalysis
            analysis={currentAnalysis!}
            summaryMetrics={{} as any}
            incomeExpenseBreakdown={{} as any}
          />
        );
      case 2:
        return (
          <Step3AssetRestructuring
            analysis={currentAnalysis!}
            onScenarioCreate={async () => {}}
            onScenarioUpdate={async () => {}}
            onScenarioDelete={async () => {}}
            onScenarioSelect={() => {}}
            onDataUpdate={handleDataUpdate}
          />
        );
      case 3:
        return (
          <Step4FinancialPlanning
            analysis={currentAnalysis!}
            onPlanCreate={() => {}}
            onPlanLink={async () => {}}
            onPlanUnlink={async () => {}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.key} completed={index < activeStep}>
            <StepLabel
              onClick={() => handleStepClick(index)}
              sx={{ cursor: index <= activeStep ? 'pointer' : 'default' }}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Paper sx={{ p: 3, minHeight: '500px' }}>
        {renderStepContent()}
      </Paper>

      {/* Navigation Buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mt: 3,
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          pt: 2,
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ResponsiveButton onClick={onCancel} variant="outlined">
            {t('common.cancel')}
          </ResponsiveButton>
          {activeStep > 0 && (
            <ResponsiveButton onClick={handleBack} variant="outlined">
              {t('common.back')}
            </ResponsiveButton>
          )}
        </Box>
        <ResponsiveButton
          onClick={handleNext}
          variant="contained"
          disabled={!canProceedToNext() || createAnalysisMutation.isLoading || updateAnalysisMutation.isLoading}
        >
          {activeStep === steps.length - 1
            ? t('common.save')
            : t('common.next')}
        </ResponsiveButton>
      </Box>
    </Box>
  );
};

