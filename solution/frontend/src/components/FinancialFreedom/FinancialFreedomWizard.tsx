import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
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

  const handleStepClick = (stepIndex: number) => {
    // Only allow step navigation in edit mode (when initialData exists)
    if (!initialData) {
      return;
    }

    // Only allow navigation to completed steps or current step
    // Step 0 is always accessible
    if (stepIndex === 0) {
      setActiveStep(0);
      return;
    }

    // Step 1 (allocation) requires step1 data
    if (stepIndex === 1 && planData.step1 && Object.keys(planData.step1).length > 0) {
      setActiveStep(1);
      return;
    }

    // Step 2 (overview) requires step1 and step2 data
    if (stepIndex === 2 && 
        planData.step1 && Object.keys(planData.step1).length > 0 &&
        planData.step2 && Object.keys(planData.step2).length > 0) {
      setActiveStep(2);
      return;
    }
  };

  const isStepCompleted = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        return !!(planData.step1 && Object.keys(planData.step1).length > 0);
      case 1:
        return !!(planData.step1 && Object.keys(planData.step1).length > 0 &&
               planData.step2 && Object.keys(planData.step2).length > 0);
      case 2:
        return !!(planData.step1 && Object.keys(planData.step1).length > 0 &&
               planData.step2 && Object.keys(planData.step2).length > 0 &&
               planData.step3 && Object.keys(planData.step3).length > 0);
      default:
        return false;
    }
  };

  const isStepValid = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        // Step 1: Need finalResult with required fields
        const step1FinalResult = planData.step1?.finalResult;
        return !!(
          step1FinalResult &&
          step1FinalResult.futureValueRequired !== undefined &&
          step1FinalResult.futureValueRequired !== null &&
          step1FinalResult.investmentYears !== undefined &&
          step1FinalResult.investmentYears !== null &&
          (step1FinalResult.returnRate !== undefined && step1FinalResult.returnRate !== null ||
           step1FinalResult.expectedReturnRate !== undefined && step1FinalResult.expectedReturnRate !== null)
        );
      case 1:
        // Step 2: Need allocationSuggestion or allocation
        return !!(
          planData.step2?.allocationSuggestion ||
          (planData.step2?.allocation && Object.keys(planData.step2.allocation).length > 0)
        );
      case 2:
        // Step 3: Need planName
        return !!(
          planData.step3?.planName &&
          planData.step3.planName.trim().length > 0
        );
      default:
        return false;
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
        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(index);
          const isClickable = initialData && (isCompleted || index === activeStep || index === 0);
          
          return (
            <Step key={step.key} completed={isCompleted}>
              <StepLabel
                onClick={() => isClickable && handleStepClick(index)}
                sx={{
                  cursor: isClickable ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': {
                    cursor: isClickable ? 'pointer' : 'default',
                  },
                }}
              >
                {step.label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Box sx={{ flex: 1, pb: 2 }}>
        {renderStepContent()}
      </Box>

      {/* Fixed Navigation Bar */}
      <Paper
        elevation={1}
        sx={{
          position: 'sticky',
          bottom: { xs: 0, md: "-20px" },
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
            <Tooltip title={t('common.cancel')}>
              <IconButton
                onClick={onCancel}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'text.primary',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
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
              disabled={!isStepValid(1)}
            >
              {t('common.next')}
            </ResponsiveButton>
          ) : activeStep === 2 ? (
            // Step 3: Show Save button
            <ResponsiveButton
              type="button"
              variant="contained"
              onClick={handleStep3Save}
              disabled={!isStepValid(2)}
            >
              {t('financialFreedom.step3.savePlan')}
            </ResponsiveButton>
          ) : (
            // Step 1: Show Next button
            <ResponsiveButton
              type="button"
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid(0)}
            >
              {t('common.next')}
            </ResponsiveButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

