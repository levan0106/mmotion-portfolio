import React, { useState } from 'react';
import { Box } from '@mui/material';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { ModalWrapper } from '../Common/ModalWrapper';
import { TemplateSelection } from './TemplateSelection';
import { CalculationForm } from './CalculationForm';
// import { DebugPlanData } from './DebugPlanData';
import {
  PlanningTemplate,
  CalculationResult,
  PlanData,
  FinalCalculationResult,
  CalculatedVariableType,
} from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';

interface Step1GoalDefinitionProps {
  data?: PlanData;
  onUpdate: (stepData: PlanData['step1']) => void;
  onNext: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
}

export const Step1GoalDefinition: React.FC<Step1GoalDefinitionProps> = ({
  data,
  onUpdate,
  onNext,
  onBack,
  hideNavigation = false,
}) => {
  const { t } = useTranslation();
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PlanningTemplate | null>(
    data?.step1?.template || null
  );

  const handleOpenTemplateModal = () => {
    setShowTemplateModal(true);
  };

  const handleCloseTemplateModal = () => {
    setShowTemplateModal(false);
  };

  const handleTemplateSelect = (template: PlanningTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
  };

  const handleSkipTemplates = () => {
    setShowTemplateModal(false);
  };

  const roundToTwoDecimals = (value: number | undefined | null): number | undefined => {
    if (value === undefined || value === null) return undefined;
    return Math.round(value * 100) / 100;
  };

  const createFinalResult = (
    inputs: any,
    result: CalculationResult
  ): FinalCalculationResult | undefined => {
    if (!inputs || !result) return undefined;

    // Merge calculationInputs and calculationResult (excluding calculatedVariable, warnings, suggestions)
    const { calculatedVariable, warnings, suggestions, ...resultWithoutCalculatedVariable } = result;
    
    // Start with inputs (rounded)
    const finalResult: FinalCalculationResult = {
      // Round all numeric fields from inputs
      targetPresentValue: roundToTwoDecimals(inputs.targetPresentValue),
      monthlyExpenses: roundToTwoDecimals(inputs.monthlyExpenses),
      withdrawalRate: roundToTwoDecimals(inputs.withdrawalRate),
      initialInvestment: roundToTwoDecimals(inputs.initialInvestment),
      periodicPayment: roundToTwoDecimals(inputs.periodicPayment),
      investmentYears: inputs.investmentYears, // Years should be integer (can be undefined)
      expectedReturnRate: roundToTwoDecimals(inputs.expectedReturnRate),
      paymentFrequency: inputs.paymentFrequency,
      paymentType: inputs.paymentType,
      inflationRate: roundToTwoDecimals(inputs.inflationRate) ?? inputs.inflationRate ?? 4.5,
      riskTolerance: inputs.riskTolerance,
      
      // Round all numeric fields from result (override if present)
      futureValueRequired: roundToTwoDecimals(resultWithoutCalculatedVariable.futureValueRequired),
      totalFutureValue: roundToTwoDecimals(resultWithoutCalculatedVariable.totalFutureValue),
      totalFutureValuePresentValue: roundToTwoDecimals(resultWithoutCalculatedVariable.totalFutureValuePresentValue),
      monthlyExpensesPresentValue: roundToTwoDecimals(resultWithoutCalculatedVariable.monthlyExpensesPresentValue),
      isFeasible: resultWithoutCalculatedVariable.isFeasible,
    };

    // Override targetPresentValue from result if present
    if (resultWithoutCalculatedVariable.targetPresentValue !== undefined) {
      finalResult.targetPresentValue = roundToTwoDecimals(resultWithoutCalculatedVariable.targetPresentValue);
    }

    // Override investmentYears from result if present
    if (resultWithoutCalculatedVariable.investmentYears !== undefined) {
      const roundedYears = roundToTwoDecimals(resultWithoutCalculatedVariable.investmentYears);
      if (roundedYears !== undefined) {
        finalResult.investmentYears = roundedYears;
      }
    }

    // Assign calculated variable value directly based on type (rounded)
    if (calculatedVariable) {
      const roundedValue = roundToTwoDecimals(calculatedVariable.value);
      switch (calculatedVariable.type) {
        case CalculatedVariableType.RETURN_RATE:
          finalResult.returnRate = roundedValue;
          break;
        case CalculatedVariableType.YEARS:
          finalResult.investmentYears = roundedValue;
          break;
        case CalculatedVariableType.PERIODIC_PAYMENT:
          finalResult.periodicPayment = roundedValue;
          break;
        case CalculatedVariableType.FUTURE_VALUE:
          finalResult.futureValue = roundedValue;
          break;
        case CalculatedVariableType.INITIAL_INVESTMENT:
          finalResult.initialInvestment = roundedValue;
          break;
      }
    }

    // Always set returnRate for consistency: use calculated returnRate if available, otherwise use expectedReturnRate
    if (!finalResult.returnRate && inputs.expectedReturnRate !== undefined) {
      finalResult.returnRate = roundToTwoDecimals(inputs.expectedReturnRate);
    }

    return finalResult;
  };

  const handleCalculationResult = (result: CalculationResult) => {
    // Get calculationInputs from data or create from template defaults
    let calculationInputs = data?.step1?.calculationInputs;
    
    // If no calculationInputs but we have a template, create from template defaults
    if (!calculationInputs && selectedTemplate) {
      calculationInputs = {
        targetPresentValue: selectedTemplate.defaults.targetPresentValue,
        monthlyExpenses: selectedTemplate.defaults.monthlyExpenses,
        withdrawalRate: selectedTemplate.defaults.withdrawalRate,
        initialInvestment: selectedTemplate.defaults.initialInvestment,
        periodicPayment: selectedTemplate.defaults.periodicPayment,
        investmentYears: selectedTemplate.defaults.investmentYears,
        expectedReturnRate: selectedTemplate.defaults.expectedReturnRate,
        paymentFrequency: selectedTemplate.defaults.paymentFrequency,
        paymentType: selectedTemplate.defaults.paymentType,
        inflationRate: selectedTemplate.defaults.inflationRate,
        riskTolerance: selectedTemplate.defaults.riskTolerance,
      };
    }

    // Create finalResult if we have both calculationInputs and result
    const finalResult = calculationInputs && result
      ? createFinalResult(calculationInputs, result)
      : undefined;

    // Merge with existing data to preserve all fields
    onUpdate({
      ...data?.step1,
      template: selectedTemplate || undefined,
      calculationInputs: calculationInputs || data?.step1?.calculationInputs,
      calculationResult: result,
      finalResult,
    });
  };

  const handleInputsChange = (inputs: any, targetMethod: 'direct' | 'fromExpenses') => {
    // Create finalResult by merging calculationInputs and calculationResult if both exist
    const finalResult = data?.step1?.calculationResult
      ? createFinalResult(inputs, data.step1.calculationResult)
      : undefined;

    // Save calculation inputs whenever they change, merge with existing data
    onUpdate({
      ...data?.step1,
      calculationInputs: inputs,
      targetMethod: targetMethod,
      finalResult,
    });
  };

  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    // Always allow navigation, even without calculation result
    onNext();
  };

  return (
    <Box>
      {/* Debug: Plan Data */}
      {/* {data && <DebugPlanData data={data} currentStep={1} />} */}

      <CalculationForm
        initialData={
          data?.step1?.calculationInputs 
            ? {
                ...data.step1.calculationInputs,
                targetMethod: data?.step1?.targetMethod,
              }
            : data?.step1?.finalResult
              ? {
                  // Fallback: create calculationInputs from finalResult if calculationInputs is not available
                  targetPresentValue: data.step1.finalResult.targetPresentValue,
                  initialInvestment: data.step1.finalResult.initialInvestment,
                  periodicPayment: data.step1.finalResult.periodicPayment,
                  investmentYears: data.step1.finalResult.investmentYears,
                  expectedReturnRate: data.step1.finalResult.returnRate || data.step1.finalResult.expectedReturnRate,
                  paymentFrequency: data.step1.finalResult.paymentFrequency,
                  paymentType: data.step1.finalResult.paymentType,
                  inflationRate: data.step1.finalResult.inflationRate,
                  riskTolerance: data.step1.finalResult.riskTolerance,
                  targetMethod: data?.step1?.targetMethod,
                }
              : undefined
        }
        template={selectedTemplate || undefined}
        onSubmit={handleCalculationResult}
        onSelectTemplate={handleOpenTemplateModal}
        onInputsChange={handleInputsChange}
      />

      {!hideNavigation && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          {onBack ? (
            <ResponsiveButton
              type="button"
              variant="outlined"
              onClick={onBack}
            >
              {t('common.back')}
            </ResponsiveButton>
          ) : (
            <Box /> // Empty box to maintain flex layout
          )}
          <ResponsiveButton
            type="button"
            variant="contained"
            onClick={handleNext}
          >
            {t('common.next')}
          </ResponsiveButton>
        </Box>
      )}

      {/* Template Selection Modal */}
      <ModalWrapper
        open={showTemplateModal}
        onClose={handleCloseTemplateModal}
        title={t('financialFreedom.templates.title')}
        maxWidth="lg"
        fullWidth
        disableCloseOnBackdrop={true}
      >
        <TemplateSelection
          onSelectTemplate={handleTemplateSelect}
          onSkip={handleSkipTemplates}
        />
      </ModalWrapper>
    </Box>
  );
};

