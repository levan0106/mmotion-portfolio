import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  FormControl,
  FormControlLabel,
  Switch,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Paper,
  Typography,
  Stack,
  Link,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccountBalance as AccountBalanceIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import MoneyInput from '../Common/MoneyInput';
import NumberInput from '../Common/NumberInput';
import { useFinancialFreedomCalculation } from '../../hooks/useFinancialFreedomCalculation';
import {
  CalculationInputs,
  CalculationResult,
  PaymentFrequency,
  PaymentType,
  RiskTolerance,
  PlanningTemplate,
  CalculatedVariableType,
} from '../../types/financialFreedom.types';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatPercentageValue } from '../../utils/format';
import { calculateYearlyProjections } from '../../utils/financialFreedomCalculation';
import { AssetValueChart } from './AssetValueChart';
import { AssetValueTable } from './AssetValueTable';

interface CalculationFormProps {
  initialData?: Partial<CalculationInputs> & { targetMethod?: 'direct' | 'fromExpenses' };
  template?: PlanningTemplate;
  onSubmit?: (result: CalculationResult) => void;
  onSelectTemplate?: () => void;
  onCancel?: () => void;
  onInputsChange?: (inputs: CalculationInputs, targetMethod: 'direct' | 'fromExpenses') => void;
}

export const CalculationForm: React.FC<CalculationFormProps> = ({
  initialData,
  template,
  onSubmit,
  onSelectTemplate,
  onCancel,
  onInputsChange,
}) => {
  const { t } = useTranslation();
  const calculateMutation = useFinancialFreedomCalculation();

  const [inputs, setInputs] = useState<CalculationInputs>({
    targetPresentValue: initialData?.targetPresentValue,
    monthlyExpenses: initialData?.monthlyExpenses,
    withdrawalRate: initialData?.withdrawalRate || 0.05,
    initialInvestment: initialData?.initialInvestment || 0,
    periodicPayment: initialData?.periodicPayment,
    investmentYears: initialData?.investmentYears,
    expectedReturnRate: initialData?.expectedReturnRate,
    paymentFrequency: initialData?.paymentFrequency || PaymentFrequency.YEARLY,
    paymentType: initialData?.paymentType || PaymentType.CONTRIBUTION,
    inflationRate: Number(initialData?.inflationRate) || 4.5, // Ensure it's a number
    riskTolerance: initialData?.riskTolerance || RiskTolerance.MODERATE,
  });

  const [targetMethod, setTargetMethod] = useState<'direct' | 'fromExpenses'>(
    template?.defaults.targetMethod || initialData?.targetMethod || 'direct'
  );
  const prevTargetMethodRef = useRef<'direct' | 'fromExpenses' | null>(null);
  const isInitialMountRef = useRef(true);
  const hasUserInteractedRef = useRef(false);
  const prevInitialDataRef = useRef(initialData);
  const prevTemplateRef = useRef(template);
  const isApplyingTemplateRef = useRef(false);

  // Update inputs when initialData changes (e.g., when navigating back from step 2)
  // But only on initial mount or when initialData changes from undefined/null to having values
  // Don't update if user has already started typing or if template is being applied
  useEffect(() => {
    // Skip if template is being applied (to prevent infinite loop)
    if (isApplyingTemplateRef.current) {
      return;
    }
    
    // Skip if this is not initial mount and initialData hasn't changed from undefined to defined
    const wasUndefined = !prevInitialDataRef.current || Object.keys(prevInitialDataRef.current).length === 0;
    const isNowDefined = initialData && Object.keys(initialData).length > 0;
    
    // If initialData changed from undefined to defined, reset the interaction flag
    // This means user navigated back from another step
    if (wasUndefined && isNowDefined) {
      hasUserInteractedRef.current = false;
    }
    
    // Skip if user has already interacted with the form (and we're not restoring from navigation)
    if (hasUserInteractedRef.current && !(wasUndefined && isNowDefined)) {
      prevInitialDataRef.current = initialData;
      isInitialMountRef.current = false;
      return;
    }

    // Only update if:
    // 1. Initial mount and initialData is provided
    // 2. initialData changed from undefined to defined (navigating back from another step)
    // 3. Not in the middle of template application
    if (initialData && !template && (isInitialMountRef.current || (wasUndefined && isNowDefined))) {
      setInputs({
        targetPresentValue: initialData.targetPresentValue,
        monthlyExpenses: initialData.monthlyExpenses,
        withdrawalRate: initialData.withdrawalRate || 0.05,
        initialInvestment: initialData.initialInvestment || 0,
        periodicPayment: initialData.periodicPayment,
        investmentYears: initialData.investmentYears,
        expectedReturnRate: initialData.expectedReturnRate,
        paymentFrequency: initialData.paymentFrequency || PaymentFrequency.YEARLY,
        paymentType: initialData.paymentType || PaymentType.CONTRIBUTION,
        inflationRate: Number(initialData.inflationRate) || 4.5, // Ensure it's a number
        riskTolerance: initialData.riskTolerance || RiskTolerance.MODERATE,
      });
      if (initialData?.targetMethod) {
        setTargetMethod(initialData.targetMethod);
        prevTargetMethodRef.current = initialData.targetMethod;
      }
    }
    
    prevInitialDataRef.current = initialData;
    isInitialMountRef.current = false;
  }, [initialData, template]);

  useEffect(() => {
    // Only process when template changes (not on every render)
    if (template && template !== prevTemplateRef.current) {
      isApplyingTemplateRef.current = true;
      
      const defaults = template.defaults;
      const newInputs: CalculationInputs = {
        targetPresentValue: defaults.targetPresentValue,
        monthlyExpenses: defaults.monthlyExpenses,
        withdrawalRate: defaults.withdrawalRate || 0.05,
        initialInvestment: defaults.initialInvestment,
        periodicPayment: defaults.periodicPayment,
        investmentYears: defaults.investmentYears,
        expectedReturnRate: defaults.expectedReturnRate,
        paymentFrequency: defaults.paymentFrequency,
        paymentType: defaults.paymentType,
        inflationRate: Number(defaults.inflationRate) || 4.5, // Ensure it's a number
        riskTolerance: defaults.riskTolerance,
      };
      
      // Update state first
      setInputs(newInputs);
      setTargetMethod(defaults.targetMethod);
      prevTargetMethodRef.current = defaults.targetMethod;
      
      // Call onInputsChange when template is selected
      // This saves the template inputs to parent component
      // The auto-calculate effect will then trigger calculation with the updated inputs
      // and update finalResult via onSubmit callback
      if (onInputsChange) {
        onInputsChange(newInputs, defaults.targetMethod);
      }
      
      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isApplyingTemplateRef.current = false;
      }, 100);
    }
    
    prevTemplateRef.current = template;
  }, [template, onInputsChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset values when target method changes (but not on initial mount)
  useEffect(() => {
    // Skip on initial mount
    if (prevTargetMethodRef.current === null) {
      prevTargetMethodRef.current = targetMethod;
      return;
    }

    // Only reset if method actually changed
    if (prevTargetMethodRef.current !== targetMethod) {
      setInputs((prev) => {
        if (targetMethod === 'direct') {
          // Reset fromExpenses fields when switching to direct
          return {
            ...prev,
            monthlyExpenses: undefined,
            withdrawalRate: prev.withdrawalRate || 0.05, // Keep default if not set
          };
        } else {
          // Reset direct field when switching to fromExpenses
          return {
            ...prev,
            targetPresentValue: undefined,
          };
        }
      });
      // Reset calculation result when method changes
      if (calculateMutation.data) {
        calculateMutation.reset();
      }
      prevTargetMethodRef.current = targetMethod;
    }
  }, [targetMethod]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (field: keyof CalculationInputs, value: any) => {
    // Mark that user has interacted with the form
    hasUserInteractedRef.current = true;
    
    setInputs((prev) => {
      const newInputs = {
        ...prev,
        [field]: value,
      };

      // Auto-calculate related fields based on target method
      if (targetMethod === 'fromExpenses') {
        // When in fromExpenses mode: monthlyExpenses or withdrawalRate changes → calculate targetPresentValue
        if (field === 'monthlyExpenses' || field === 'withdrawalRate') {
          const monthlyExpenses = field === 'monthlyExpenses' ? value : newInputs.monthlyExpenses;
          const withdrawalRate = field === 'withdrawalRate' ? value : newInputs.withdrawalRate;
          
          if (monthlyExpenses && monthlyExpenses > 0 && withdrawalRate && withdrawalRate > 0) {
            // targetPresentValue = (monthlyExpenses * 12) / withdrawalRate
            const calculatedTargetPresentValue = (monthlyExpenses * 12) / withdrawalRate;
            newInputs.targetPresentValue = calculatedTargetPresentValue;
          } else {
            // Clear targetPresentValue if either value is missing or invalid
            newInputs.targetPresentValue = undefined;
          }
        }
      } else if (targetMethod === 'direct') {
        // When in direct mode: targetPresentValue or withdrawalRate changes → calculate monthlyExpenses
        if (field === 'targetPresentValue' || field === 'withdrawalRate') {
          const targetPresentValue = field === 'targetPresentValue' ? value : newInputs.targetPresentValue;
          const withdrawalRate = field === 'withdrawalRate' ? value : (newInputs.withdrawalRate || 0.05); // Default 5%
          
          if (targetPresentValue && targetPresentValue > 0 && withdrawalRate > 0) {
            // monthlyExpenses = (targetPresentValue * withdrawalRate) / 12
            const calculatedMonthlyExpenses = (targetPresentValue * withdrawalRate) / 12;
            newInputs.monthlyExpenses = calculatedMonthlyExpenses;
          } else {
            // Clear monthlyExpenses if targetPresentValue is missing or invalid
            newInputs.monthlyExpenses = undefined;
          }
        }
      }

      // Notify parent of input changes
      if (onInputsChange) {
        onInputsChange(newInputs, targetMethod);
      }
      return newInputs;
    });
  };

  // Auto-calculate when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        // Check required fields
        if (!inputs.paymentFrequency || 
            inputs.paymentType === undefined || 
            inputs.inflationRate === undefined) {
          // Reset calculation data if required fields are missing
          if (calculateMutation.data) {
            calculateMutation.reset();
          }
          return;
        }

        // Check if initialInvestment or periodicPayment is provided (user's requirement)
        // Phải có ít nhất một trong hai giá trị > 0
        const hasInitialInvestment = inputs.initialInvestment !== undefined && inputs.initialInvestment !== null && inputs.initialInvestment > 0;
        const hasPeriodicPayment = inputs.periodicPayment !== undefined && inputs.periodicPayment !== null && inputs.periodicPayment !== 0;
        const hasInvestmentYears = inputs.investmentYears !== undefined && inputs.investmentYears !== null && inputs.investmentYears > 0;
        const hasExpectedReturnRate = inputs.expectedReturnRate !== undefined && inputs.expectedReturnRate !== null && inputs.expectedReturnRate > 0;

        // Count provided investment parameters (chỉ count nếu có giá trị hợp lệ)
        const providedParams = [
          hasInitialInvestment,
          hasPeriodicPayment,
          hasInvestmentYears,
          hasExpectedReturnRate,
        ].filter(Boolean).length;
        
        // Check if we have target (needed for calculating missing variable)
        const hasTarget = inputs.targetPresentValue || 
          (inputs.monthlyExpenses && inputs.withdrawalRate);
        
        // Check if user has entered initialInvestment or periodicPayment (user's requirement)
        // Phải có ít nhất một trong hai giá trị > 0
        const hasInitialOrPeriodic = hasInitialInvestment || hasPeriodicPayment;
        
        // Không tính toán nếu không có ít nhất một trong hai giá trị
        if (!hasInitialOrPeriodic) {
          if (calculateMutation.data) {
            calculateMutation.reset();
          }
          return;
        }
        
        // Special case 1: If we have initialInvestment, investmentYears, and expectedReturnRate
        // (3 params, missing periodicPayment), we can still calculate future value with periodicPayment = 0
        const hasThreeCoreParamsWithInitial = hasInitialInvestment && hasInvestmentYears && hasExpectedReturnRate && !hasPeriodicPayment;
        
        // Special case 2: If we have periodicPayment, investmentYears, and expectedReturnRate
        // (3 params, missing initialInvestment), we can still calculate future value with initialInvestment = 0
        const hasThreeCoreParamsWithPeriodic = hasPeriodicPayment && hasInvestmentYears && hasExpectedReturnRate && !hasInitialInvestment;
        
        // Auto-calculate if:
        // - 4 parameters: can calculate total future value without target
        // - 3 parameters with initialInvestment, investmentYears, expectedReturnRate (missing periodicPayment): 
        //   can calculate future value with periodicPayment = 0
        // - 3 parameters with periodicPayment, investmentYears, expectedReturnRate (missing initialInvestment):
        //   can calculate future value with initialInvestment = 0
        // - 3 parameters + target: can calculate the missing variable
        // - 2 parameters + target: can calculate missing variable (e.g., target + initial + rate → calculate years)
        //   This allows calculation when user enters: target + initial/periodic + rate/years
        const shouldCalculate = hasInitialOrPeriodic && (
          providedParams === 4 || // All 4 parameters - can calculate without target
          hasThreeCoreParamsWithInitial || // 3 core params (initial, years, rate) - can calculate with periodicPayment = 0
          hasThreeCoreParamsWithPeriodic || // 3 core params (periodic, years, rate) - can calculate with initialInvestment = 0
          (providedParams === 3 && hasTarget) || // 3 parameters + target - can calculate missing variable
          (providedParams === 2 && hasTarget && (hasExpectedReturnRate || hasInvestmentYears)) // 2 parameters + target + (rate OR years) - can calculate missing variable
        );
        
        if (shouldCalculate) {
          // For the special case of 3 core params without periodicPayment, set periodicPayment = 0
          // so the calculation function treats it as having all 4 params and calculates future value
          // For the special case of 3 core params without initialInvestment, set initialInvestment = 0
          // so the calculation function treats it as having all 4 params and calculates future value
          let calculationInputs = inputs;
          if (hasThreeCoreParamsWithInitial) {
            calculationInputs = { ...inputs, periodicPayment: 0 };
          } else if (hasThreeCoreParamsWithPeriodic) {
            calculationInputs = { ...inputs, initialInvestment: 0 };
          }
          
          calculateMutation.mutate(calculationInputs, {
            onSuccess: (result) => {
              // Only notify parent of calculation result
              // Don't call onInputsChange here because:
              // 1. handleInputChange already calls onInputsChange when user changes inputs
              // 2. Calling it here causes infinite loop: onInputsChange -> update planData -> initialData changes -> inputs update -> auto-calculate -> onInputsChange again
              if (onSubmit) {
                onSubmit(result);
              }
            },
            onError: (error) => {
              console.error('Calculation error:', error);
            },
          });
        } else {
          // Reset calculation data if not enough data to calculate
          // This ensures UI shows empty state when inputs are incomplete
          if (calculateMutation.data) {
            calculateMutation.reset();
          }
        }
      } catch (error) {
        // Silently fail - calculation will retry on next input change
        console.error('Auto-calculation error:', error);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs]);

  return (
    <Box>
      {/* Template Selection Link */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {onSelectTemplate && (
          <Link
            component="button"
            variant="body2"
            onClick={onSelectTemplate}
            sx={{
              cursor: 'pointer',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {template 
              ? t('financialFreedom.form.changeTemplate') || 'Thay đổi mẫu kế hoạch'
              : t('financialFreedom.form.selectTemplate') || 'Chọn mẫu kế hoạch'}
          </Link>
        )}
      </Box>

      {template && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>{t('financialFreedom.templates.title')}: {template.name}</AlertTitle>
          {template.guidance}
          {template.tips && template.tips.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <strong>{t('financialFreedom.form.tips')}</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {template.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </Box>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Input Form */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              
              {/* Method Selection - Switch */}
              <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                {/* <FormLabel component="legend" sx={{ mb: 1.5, fontWeight: 500 }}>
                  {t('financialFreedom.form.targetAmount.targetCalculationMethod')}
                </FormLabel> */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={targetMethod === 'fromExpenses'}
                      onChange={(e) => {
                        const newMethod = e.target.checked ? 'fromExpenses' : 'direct';
                        // Mark that user has interacted with the form
                        hasUserInteractedRef.current = true;
                        setTargetMethod(newMethod);
                        // Notify parent of target method change
                        if (onInputsChange) {
                          onInputsChange(inputs, newMethod);
                        }
                      }}
                    />
                  }
                  label={t('financialFreedom.form.targetAmount.targetCalculationMethod')}
                />
              </FormControl>

              {/* <Divider sx={{ my: 2 }} /> */}

              {/* Input Fields */}
              <Grid container spacing={2}>
                {targetMethod === 'direct' ? (
                  <Grid item xs={12}>
                    <MoneyInput
                      label={t('financialFreedom.form.targetAmount.targetAmountPresentValue')}
                      value={inputs.targetPresentValue || 0}
                      onChange={(value) => handleInputChange('targetPresentValue', value > 0 ? value : undefined)}
                      currency="VND"
                      showCurrency={true}
                    />
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} md={6}>
                      <MoneyInput
                        label={t('financialFreedom.form.targetAmount.monthlyExpenses')}
                        value={inputs.monthlyExpenses || 0}
                        onChange={(value) => handleInputChange('monthlyExpenses', value > 0 ? value : undefined)}
                        currency="VND"
                        showCurrency={true}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <NumberInput
                        label={t('financialFreedom.form.targetAmount.withdrawalRate')}
                        value={(inputs.withdrawalRate || 0) * 100}
                        onChange={(value) => handleInputChange('withdrawalRate', value > 0 ? value / 100 : 0.04)}
                        min={0}
                        max={10}
                        step={0.1}
                        decimalPlaces={2}
                        showThousandsSeparator={false}
                        suffix="%"
                        showIcon={false}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
          {t('financialFreedom.form.investmentParameters.title')}
        </ResponsiveTypography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <MoneyInput
              label={t('financialFreedom.form.investmentParameters.initialInvestment')}
              value={inputs.initialInvestment || 0}
              onChange={(value) => handleInputChange('initialInvestment', value > 0 ? value : undefined)}
              currency="VND"
              showCurrency={false}
              showIcon={false}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <MoneyInput
              label={t('financialFreedom.form.investmentParameters.periodicPayment')}
              value={inputs.periodicPayment || 0}
              onChange={(value) => handleInputChange('periodicPayment', value !== 0 ? value : undefined)}
              currency="VND"
              showCurrency={true}
              showIcon={false}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <NumberInput
              label={t('financialFreedom.form.investmentParameters.investmentYears')}
              value={inputs.investmentYears || undefined}
              onChange={(value) => handleInputChange('investmentYears', value > 0 ? value : undefined)}
              min={0.01}
              step={0.1}
              decimalPlaces={2}
              showThousandsSeparator={false}
              showIcon={false}  
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <NumberInput
              label={t('financialFreedom.form.investmentParameters.expectedReturnRate')}
              value={inputs.expectedReturnRate || undefined}
              onChange={(value) => handleInputChange('expectedReturnRate', value > 0 ? value : undefined)}
              min={0}
              max={50}
              step={0.1}
              decimalPlaces={2}
              showThousandsSeparator={false}
              suffix="%"
              showIcon={false}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="payment-frequency-label">{t('financialFreedom.form.investmentParameters.paymentFrequency')}</InputLabel>
              <Select
                labelId="payment-frequency-label"
                value={inputs.paymentFrequency}
                label={t('financialFreedom.form.investmentParameters.paymentFrequency')}
                onChange={(e) => handleInputChange('paymentFrequency', e.target.value as PaymentFrequency)}
              >
                <MenuItem value={PaymentFrequency.MONTHLY}>{t('financialFreedom.form.investmentParameters.monthly')}</MenuItem>
                <MenuItem value={PaymentFrequency.QUARTERLY}>{t('financialFreedom.form.investmentParameters.quarterly')}</MenuItem>
                <MenuItem value={PaymentFrequency.YEARLY}>{t('financialFreedom.form.investmentParameters.yearly')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="payment-type-label">{t('financialFreedom.form.investmentParameters.paymentType')}</InputLabel>
              <Select
                labelId="payment-type-label"
                value={inputs.paymentType}
                label={t('financialFreedom.form.investmentParameters.paymentType')}
                onChange={(e) => handleInputChange('paymentType', e.target.value as PaymentType)}
              >
                <MenuItem value={PaymentType.CONTRIBUTION}>{t('financialFreedom.form.investmentParameters.contribution')}</MenuItem>
                <MenuItem value={PaymentType.WITHDRAWAL}>{t('financialFreedom.form.investmentParameters.withdrawal')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <NumberInput
              label={t('financialFreedom.form.investmentParameters.inflationRate')}
              value={inputs.inflationRate}
              onChange={(value) => handleInputChange('inflationRate', value > 0 ? value : 4.5)}
              min={0}
              max={20}
              step={0.1}
              decimalPlaces={2}
              showThousandsSeparator={false}
              suffix="%"
              showIcon={false}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="risk-tolerance-label">{t('financialFreedom.form.investmentParameters.riskTolerance')}</InputLabel>
              <Select
                labelId="risk-tolerance-label"
                value={inputs.riskTolerance}
                label={t('financialFreedom.form.investmentParameters.riskTolerance')}
                onChange={(e) => handleInputChange('riskTolerance', e.target.value as RiskTolerance)}
              >
                <MenuItem value={RiskTolerance.CONSERVATIVE}>{t('financialFreedom.form.investmentParameters.conservative')}</MenuItem>
                <MenuItem value={RiskTolerance.MODERATE}>{t('financialFreedom.form.investmentParameters.moderate')}</MenuItem>
                <MenuItem value={RiskTolerance.AGGRESSIVE}>{t('financialFreedom.form.investmentParameters.aggressive')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
          </Box>
        </Grid>

        {/* Right Column: Results - Always visible */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            {/* Main Results Section */}
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <CalculateIcon color="primary" />
            <ResponsiveTypography variant="h5" fontWeight={600}>
              {t('financialFreedom.form.results.title')}
            </ResponsiveTypography>
          </Stack>

          <Box>
            {/* Group 1: Kết quả tính toán */}
            <ResponsiveTypography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary' }}>
              {t('financialFreedom.form.results.group1.title')}
            </ResponsiveTypography>
            <Box sx={{ mb: 3 }}>
              {/* Thời gian hoàn thành */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('financialFreedom.form.results.group1.completionTime')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.calculatedVariable?.type === CalculatedVariableType.YEARS
                    ? `${calculateMutation.data.calculatedVariable.value.toFixed(1)} ${t('financialFreedom.calculatedVariables.years')}`
                    : inputs.investmentYears
                    ? `${inputs.investmentYears} ${t('financialFreedom.calculatedVariables.years')}`
                    : '-'}
                </Typography>
              </Stack>

              {/* Tỷ suất % */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('financialFreedom.form.results.group1.returnRate')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.calculatedVariable?.type === CalculatedVariableType.RETURN_RATE
                    ? formatPercentageValue(calculateMutation.data.calculatedVariable.value, 2)
                    : inputs.expectedReturnRate
                    ? formatPercentageValue(inputs.expectedReturnRate, 2)
                    : '-'}
                </Typography>
              </Stack>

              {/* Tổng giá trị đạt được */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('financialFreedom.form.results.group1.totalValueAchieved')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.totalFutureValue !== undefined
                    ? formatCurrency(calculateMutation.data.totalFutureValue)
                    : calculateMutation.data?.futureValueRequired !== undefined
                    ? formatCurrency(calculateMutation.data.futureValueRequired)
                    : '-'}
                </Typography>
              </Stack>

              {/* Lợi nhuận theo tháng */}
              {/* <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('financialFreedom.form.results.group1.monthlyExpenses')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.totalFutureValue !== undefined
                    ? formatCurrency((calculateMutation.data.totalFutureValue * (inputs.withdrawalRate || 0.04)) / 12)
                    : calculateMutation.data?.futureValueRequired !== undefined
                    ? formatCurrency((calculateMutation.data.futureValueRequired * (inputs.withdrawalRate || 0.04)) / 12)
                    : '-'}
                </Typography>
              </Stack> */}

              {/* Tổng giá trị thực (trừ lạm phát) */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('financialFreedom.form.results.group1.totalFutureValuePresentValue', { 
                    inflationRate: (Number(inputs.inflationRate) || 4.5).toFixed(1)
                  })}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.totalFutureValuePresentValue !== undefined
                    ? formatCurrency(calculateMutation.data.totalFutureValuePresentValue)
                    : '-'}
                </Typography>
              </Stack>

              {/* Lợi nhuận theo tháng */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('financialFreedom.form.results.group1.monthlyExpensesPresentValue', { 
                    inflationRate: (Number(inputs.inflationRate) || 4.5).toFixed(1)
                  })}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.monthlyExpensesPresentValue !== undefined
                    ? formatCurrency(calculateMutation.data.monthlyExpensesPresentValue)
                    : '-'}
                </Typography>
              </Stack>

              {/* Kết quả khả thi */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {calculateMutation.data?.isFeasible !== undefined && (
                    calculateMutation.data.isFeasible ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <CancelIcon color="error" fontSize="small" />
                    )
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {t('financialFreedom.form.results.group1.feasibility')}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600} color={calculateMutation.data?.isFeasible === true ? 'success.main' : calculateMutation.data?.isFeasible === false ? 'error.main' : 'text.primary'}>
                  {calculateMutation.data?.isFeasible !== undefined
                    ? (calculateMutation.data.isFeasible ? t('financialFreedom.form.results.yes') : t('financialFreedom.form.results.no'))
                    : '-'}
                </Typography>
              </Stack>
            </Box>

            {/* Group 2: Mục tiêu */}
            <ResponsiveTypography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5, mt: 3, color: 'text.secondary' }}>
              {t('financialFreedom.form.results.group2.title')}
            </ResponsiveTypography>
            <Box>
              {/* Số tiền mục tiêu (quy về hiện tại) */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccountBalanceIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {t('financialFreedom.form.results.group2.targetPresentValue', { 
                      inflationRate: (Number(inputs.inflationRate) || 4.5).toFixed(1)
                    })}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.targetPresentValue !== undefined
                    ? formatCurrency(calculateMutation.data.targetPresentValue)
                    : inputs.targetPresentValue || (inputs.monthlyExpenses && inputs.withdrawalRate)
                    ? formatCurrency(inputs.targetPresentValue || ((inputs.monthlyExpenses! * 12) / (inputs.withdrawalRate || 0.04)))
                    : '-'}
                </Typography>
              </Stack>

              {/* Số tiền mục tiêu (thời điểm hoàn thành) */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AccountBalanceIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {t('financialFreedom.form.results.group2.targetFutureValue')}
                  </Typography>
                </Stack>
                <Typography variant="body1" fontWeight={600} color="text.primary">
                  {calculateMutation.data?.futureValueRequired !== undefined
                    ? formatCurrency(calculateMutation.data.futureValueRequired)
                    : '-'}
                </Typography>
              </Stack>
            </Box>
          </Box>

          {/* Warnings and Suggestions */}
          {calculateMutation.data?.warnings && calculateMutation.data.warnings.length > 0 && (
            <Alert 
              severity="warning" 
              sx={{ 
                mt: 2,
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'flex-start',
                  pt: 1,
                },
              }}
            >
              <AlertTitle sx={{ fontWeight: 600, mb: 1 }}>
                {t('financialFreedom.form.results.warnings')}
              </AlertTitle>
              <Box component="ul" sx={{ margin: 0, paddingLeft: 3, '& li': { mb: 0.5 } }}>
                {calculateMutation.data.warnings.map((warning, index) => (
                  <li key={index}>
                    <Typography variant="body2">{warning}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          {calculateMutation.data?.suggestions && calculateMutation.data.suggestions.length > 0 && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  alignItems: 'flex-start',
                  pt: 1,
                },
              }}
            >
              <AlertTitle sx={{ fontWeight: 600, mb: 1 }}>
                {t('financialFreedom.form.results.suggestions')}
              </AlertTitle>
              <Box component="ul" sx={{ margin: 0, paddingLeft: 3, '& li': { mb: 0.5 } }}>
                {calculateMutation.data.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <Typography variant="body2">{suggestion}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}
        </Paper>
          </Box>
        </Grid>
      </Grid>

      {calculateMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {t('financialFreedom.form.error')}
        </Alert>
      )}

      {/* Chart showing asset value over time */}
      {calculateMutation.data && calculateMutation.data.totalFutureValue !== undefined && (
        <>
          <Paper sx={{ p: 3, mt: 3 }}>
            <AssetValueChart
              projections={calculateYearlyProjections(inputs, calculateMutation.data)}
              baseCurrency="VND"
              height={350}
              inflationRate={Number(inputs.inflationRate) || 4.5}
            />
          </Paper>
          
          {/* Table showing detailed yearly breakdown */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <AssetValueTable
              inputs={inputs}
              result={calculateMutation.data}
              baseCurrency="VND"
            />
          </Paper>
        </>
      )}

      {/* Action Buttons */}
      {onCancel && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <ResponsiveButton
            variant="outlined"
            onClick={onCancel}
          >
            {t('common.cancel') || 'Hủy'}
          </ResponsiveButton>
        </Box>
      )}
    </Box>
  );
};

