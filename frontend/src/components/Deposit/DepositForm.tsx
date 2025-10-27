import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Grid,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import MoneyInput from '../Common/MoneyInput';
import NumberInput from '../Common/NumberInput';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { Save, AccountBalance } from '@mui/icons-material';

interface DepositFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDepositDto) => void;
  portfolioId: string;
  initialData?: CreateDepositDto;
  isEdit?: boolean;
  standalone?: boolean; // New prop to control if form should be wrapped in ModalWrapper
  hideButtons?: boolean; // New prop to hide form buttons
}

interface CreateDepositDto {
  portfolioId: string;
  bankName: string;
  accountNumber?: string;
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  termMonths?: number;
  notes?: string;
}

// Term options will be generated dynamically using translations

// Validation schema will be created dynamically using translations

const DepositForm: React.FC<DepositFormProps> = ({
  open,
  onClose,
  onSubmit,
  portfolioId,
  initialData,
  isEdit = false,
  standalone = true,
  hideButtons = false,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string>('');

  // Create validation schema with translations
  const validationSchema = yup.object({
    portfolioId: yup.string().required(t('deposit.form.validation.portfolioIdRequired')),
    bankName: yup.string().required(t('deposit.form.validation.bankNameRequired')).max(100, t('deposit.form.validation.bankNameMaxLength')),
    accountNumber: yup.string().optional().max(50, t('deposit.form.validation.accountNumberMaxLength')),
    principal: yup.number().required(t('deposit.form.validation.principalRequired')).min(0, t('deposit.form.validation.principalMin')),
    interestRate: yup.number().required(t('deposit.form.validation.interestRateRequired')).min(0, t('deposit.form.validation.interestRateMin')).max(100, t('deposit.form.validation.interestRateMax')),
    startDate: yup.string().required(t('deposit.form.validation.startDateRequired')),
    endDate: yup.string().required(t('deposit.form.validation.endDateRequired')),
    termMonths: yup.number().optional(),
    notes: yup.string().max(500, t('deposit.form.validation.notesMaxLength')),
  });

  // Create term options with translations

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDepositDto>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      portfolioId: portfolioId || '',
      bankName: '',
      accountNumber: '',
      principal: 0,
      interestRate: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      termMonths: 0,
      notes: '',
    },
  });

  // Create a ref to access the form element
  const formRef = React.useRef<HTMLFormElement>(null);

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          ...initialData,
          portfolioId: initialData.portfolioId || portfolioId,
          bankName: initialData.bankName || '',
          accountNumber: initialData.accountNumber || '',
          principal: initialData.principal || 0,
          interestRate: initialData.interestRate || 0,
          startDate: initialData.startDate || new Date().toISOString().split('T')[0],
          endDate: initialData.endDate || '',
          termMonths: initialData.termMonths || 0,
          notes: initialData.notes || '',
        });
      } else {
        reset({
          portfolioId: portfolioId || '',
          bankName: '',
          accountNumber: '',
          principal: 0,
          interestRate: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          termMonths: 0,
          notes: '',
        });
      }
      setError('');
    }
  }, [open, initialData, portfolioId, reset]);

  const handleFormSubmit = async (data: CreateDepositDto) => {
    try {
      setError('');
      
      // Validate dates
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      
      if (start >= end) {
        setError(t('deposit.form.validation.endDateAfterStart'));
        return;
      }
      
      // Check if term is not too long (10 years)
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 3650) {
        setError(t('deposit.form.validation.termTooLong'));
        return;
      }
      
      // Clean up data before submitting
      const cleanedData = {
        ...data,
        accountNumber: data.accountNumber?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };
      
      await onSubmit(cleanedData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deposit.form.validation.errorOccurred'));
    }
  };

  const formContent = (
    <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Hidden submit button for form submission */}
      <button type="submit" style={{ display: 'none' }} />
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="bankName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('deposit.form.bankName')}
                error={!!errors.bankName}
                helperText={errors.bankName?.message}
                required
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Controller
            name="accountNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('deposit.form.accountNumber')}
                error={!!errors.accountNumber}
                helperText={errors.accountNumber?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Controller
            name="principal"
            control={control}
            render={({ field }) => (
              <MoneyInput
                value={field.value || 0}
                onChange={(value) => field.onChange(value)}
                label={t('deposit.form.principal')}
                placeholder={t('deposit.form.principalPlaceholder')}
                helperText={errors.principal?.message}
                error={!!errors.principal}
                currency="VND"
                showCurrency={true}
                align="right"
                required
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Controller
            name="interestRate"
            control={control}
            render={({ field }) => (
              <NumberInput
                value={field.value || 0}
                onChange={(value) => field.onChange(value)}
                label={t('deposit.form.interestRate')}
                placeholder={t('deposit.form.interestRatePlaceholder')}
                helperText={errors.interestRate?.message}
                error={!!errors.interestRate}
                decimalPlaces={2}
                min={0}
                max={100}
                step={0.01}
                showThousandsSeparator={false}
                align="right"
                required
                disabled={isSubmitting}
              />
            )}
          />
        </Grid>
        
        {/* <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label={t('deposit.form.term')}
            select
            value={selectedTerm}
            onChange={(e) => handleTermChange(e.target.value)}
            helperText={t('deposit.form.termHelper')}
          >
            {termOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid> */}
        
        <Grid item xs={12} md={6}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('deposit.form.startDate')}
                type="date"
                InputLabelProps={{ shrink: true }}
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
                required
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Controller
            name="endDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('deposit.form.endDate')}
                type="date"
                InputLabelProps={{ shrink: true }}
                error={!!errors.endDate}
                helperText={errors.endDate?.message}
                required
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('deposit.form.notes')}
                multiline
                rows={2}
                error={!!errors.notes}
                helperText={errors.notes?.message}
              />
            )}
          />
        </Grid>
      </Grid>
    </form>
  );

  // Return standalone ModalWrapper or just form content
  if (standalone) {
    return (
      <ModalWrapper
        open={open}
        onClose={onClose}
        title={isEdit ? t('deposit.form.editTitle') : t('deposit.form.createTitle')}
        icon={<AccountBalance />}
        maxWidth="md"
        fullWidth
        loading={isSubmitting}
        actions={
          !hideButtons ? (
            <>
              <ResponsiveButton onClick={onClose} disabled={isSubmitting}>
                {t('deposit.form.cancel')}
              </ResponsiveButton>
              <ResponsiveButton 
                variant="contained" 
                disabled={isSubmitting}
                icon={<Save />}
                forceTextOnly={true}
                mobileText={t('deposit.form.save')}
                desktopText={t('deposit.form.save')}
                onClick={() => {
                  // Trigger form submission by clicking the submit button inside the form
                  if (formRef.current) {
                    const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement;
                    if (submitButton) {
                      submitButton.click();
                    }
                  }
                }}
              >
                {isSubmitting ? t('deposit.form.processing') : (isEdit ? t('deposit.form.update') : t('deposit.form.create'))}
              </ResponsiveButton>
            </>
          ) : undefined
        }
      >
        {formContent}
      </ModalWrapper>
    );
  }

  // Return just form content for generic modal usage
  return formContent;
};

export default DepositForm;
