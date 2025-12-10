import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { Step1GoalDefinition } from './Step1GoalDefinition';
import { Step2AllocationSuggestionsDynamic as Step2AllocationSuggestions } from './Step2AllocationSuggestionsDynamic';
import { Step3ConsolidatedOverview } from './Step3ConsolidatedOverview';
import { PlanData } from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';

interface FinancialFreedomWizardProps {
  onComplete?: (planData: PlanData) => void;
  onCancel?: () => void;
  initialData?: PlanData; // Optional initial data for edit mode
}

export const FinancialFreedomWizard: React.FC<FinancialFreedomWizardProps> = ({
  onComplete,
  onCancel,
  initialData,
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [planData, setPlanData] = useState<PlanData>(
    initialData || {
      step1: {},
      step2: {},
      step3: {},
    }
  );

  // Update planData when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setPlanData(initialData);
      setActiveStep(0); // Reset to first step when editing
    }
  }, [initialData]);

  const steps = [
    { label: t('financialFreedom.steps.step1.title'), key: 'step1' },
    { label: t('financialFreedom.steps.step2.title'), key: 'step2' },
    { label: t('financialFreedom.steps.step3.title'), key: 'step3' },
  ];

  const handleStepUpdate = (step: keyof PlanData, stepData: any) => {
    setPlanData((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        ...stepData,
      },
    }));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Last step - complete
      if (onComplete) {
        onComplete(planData);
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

  const handleStep2Next = () => {
    // Update step2 data to mark as accepted and proceed
    if (planData.step2?.allocationSuggestion) {
      // Extract allocation from assetTypes
      const suggestedAllocation = planData.step2.allocationSuggestion.assetTypes.reduce((acc, at) => {
        acc[at.code] = at.allocation;
        return acc;
      }, {} as Record<string, number>);
      
      handleStepUpdate('step2', {
        ...planData.step2,
        accepted: true,
        allocation: suggestedAllocation,
        allocationSuggestion: planData.step2.allocationSuggestion,
      });
    }
    handleNext();
  };

  const handleStep3Save = () => {
    if (onComplete) {
      onComplete(planData);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Step1GoalDefinition
            data={planData}
            onUpdate={(stepData) => handleStepUpdate('step1', stepData)}
            onNext={handleNext}
            onBack={handleBack}
            hideNavigation
          />
        );
      case 1:
        return (
          <Step2AllocationSuggestions
            data={planData}
            onUpdate={(stepData) => handleStepUpdate('step2', stepData)}
            onNext={handleNext}
            onBack={handleBack}
            hideNavigation
          />
        );
      case 2:
        return (
          <Step3ConsolidatedOverview
            data={planData}
            onUpdate={(stepData) => handleStepUpdate('step3', stepData)}
            onNext={handleNext}
            onBack={handleBack}
            onSave={handleStep3Save}
            hideNavigation
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step) => (
          <Step key={step.key}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ flex: 1, pb: 10 }}>
        {renderStepContent()}
      </Box>

      {/* Fixed Navigation Bar */}
      <Paper
        elevation={3}
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', maxWidth: 1200, mx: 'auto', gap: 2 }}>
          {onCancel && (
            <ResponsiveButton
              type="button"
              variant="outlined"
              onClick={onCancel}
            >
              {t('common.cancel')}
            </ResponsiveButton>
          )}
          {activeStep > 0 && (
            <ResponsiveButton
              type="button"
              variant="outlined"
              onClick={handleBack}
            >
              {t('common.back')}
            </ResponsiveButton>
          )}
          {activeStep === 1 && planData.step2?.allocationSuggestion ? (
            // Step 2: Show Next button
            <ResponsiveButton
              type="button"
              variant="contained"
              onClick={handleStep2Next}
            >
              {t('common.next')}
            </ResponsiveButton>
          ) : activeStep === 2 ? (
            // Step 3: Show Save button
            <ResponsiveButton
              type="button"
              variant="contained"
              onClick={handleStep3Save}
            >
              {t('financialFreedom.step3.savePlan')}
            </ResponsiveButton>
          ) : (
            // Step 1: Show Next button
            <ResponsiveButton
              type="button"
              variant="contained"
              onClick={handleNext}
            >
              {t('common.next')}
            </ResponsiveButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

