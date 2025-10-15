import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Grid,
  Box,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { ResponsiveTypography, ResponsiveButton, ModalWrapper } from '../Common';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  AccountBalance as BankIcon,
  TrendingUp as InterestIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { formatCurrency, formatDate } from '../../utils/format';
import MoneyInput from '../Common/MoneyInput';

interface Deposit {
  depositId: string;
  portfolioId: string;
  bankName: string;
  accountNumber?: string;
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  termMonths?: number;
  status: 'ACTIVE' | 'SETTLED';
  actualInterest?: number;
  notes?: string;
  accruedInterest: number;
  totalValue: number;
  isMatured: boolean;
  canBeEdited: boolean;
  canBeSettled: boolean;
  daysUntilMaturity: number;
  termDescription: string;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
}

interface DepositSettlementModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SettleDepositDto) => void;
  deposit: Deposit | null;
}

interface SettleDepositDto {
  actualInterest: number;
  settlementDate: string;
  notes?: string;
}

const DepositSettlementModal: React.FC<DepositSettlementModalProps> = ({
  open,
  onClose,
  onSubmit,
  deposit,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string>('');

  // Create validation schema with translations
  const validationSchema = yup.object({
    actualInterest: yup
      .number()
      .required(t('deposit.settlement.validation.actualInterestRequired'))
      .min(0, t('deposit.settlement.validation.actualInterestMin')),
    settlementDate: yup
      .string()
      .required(t('deposit.settlement.validation.settlementDateRequired')),
    notes: yup.string().max(500, t('deposit.settlement.validation.notesMaxLength')),
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettleDepositDto>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      actualInterest: 0,
      settlementDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const actualInterest = watch('actualInterest') || 0;

  // Reset form when opening/closing
  useEffect(() => {
    if (open && deposit) {
      reset({
        actualInterest: deposit.accruedInterest || 0,
        settlementDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setError('');
    }
  }, [open, deposit, reset]);

  const handleFormSubmit = async (data: SettleDepositDto) => {
    try {
      setError('');
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorOccurred'));
    }
  };

  const calculateTotalSettlement = (principal: number, actualInterest: number): number => {
    return principal + actualInterest;
  };

  if (!deposit) {
    return null;
  }

  const modalTitle = `${t('deposit.settlement.title')} - ${deposit?.bankName || t('common.na')}`;
  
  const modalActions = (
    <>
      <ResponsiveButton 
        onClick={onClose} 
        disabled={isSubmitting}
        variant="outlined"
        size="medium"
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ResponsiveButton 
        type="submit" 
        variant="contained" 
        color="success"
        disabled={isSubmitting || (actualInterest || 0) < 0}
        size="medium"
        startIcon={isSubmitting ? undefined : <CheckIcon />}
      >
        {isSubmitting ? t('deposit.settlement.processing') : t('deposit.settlement.confirmSettlement')}
      </ResponsiveButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={modalTitle}
      icon={<InterestIcon sx={{ fontSize: 20 }} />}
      actions={modalActions}
      maxWidth="md"
      fullWidth
      titleColor="success"
      size="medium"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {/* Deposit Information & Financial Summary - Compact */}
        <Card sx={{ mb: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Grid container spacing={2}>
              {/* Deposit Info - Compact */}
              <Grid item xs={12} md={6}>
                <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ mb: 2 }}>
                  {t('deposit.settlement.depositInfo')}
                </ResponsiveTypography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BankIcon fontSize="small" color="primary" />
                  <ResponsiveTypography variant="cardSubtitle" color="text.secondary" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {t('deposit.settlement.bankName')}
                  </ResponsiveTypography>
                </Box>
                <ResponsiveTypography variant="cardValue" color="text.primary" sx={{ ml: 3, mb: 1, color: 'text.primary' }}>
                  {deposit.bankName || t('common.na')}
                </ResponsiveTypography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon fontSize="small" color="primary" />
                  <ResponsiveTypography variant="cardSubtitle" color="text.primary" sx={{ color: 'text.primary' }}>
                    {deposit.termDescription || t('common.na')}
                  </ResponsiveTypography>
                </Box>
                
                <ResponsiveTypography variant="cardSubtitle" color="text.secondary" sx={{ ml: 3,  color: 'text.secondary' }}>
                  {formatDate(deposit.startDate, 'short')} - {formatDate(deposit.endDate, 'short')}
                </ResponsiveTypography>
              </Grid>
              
              {/* Financial Summary - Compact */}
              <Grid item xs={12} md={6}>
                <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ mb: 2 }}>
                  {t('deposit.settlement.financialSummary')}
                </ResponsiveTypography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary" sx={{mb: 0.5, color: 'text.secondary' }}>
                        {t('deposit.settlement.principal')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="primary" fontWeight="bold" sx={{ color: 'primary.main' }}>
                        {formatCurrency(Number(deposit.principal) || 0)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary" sx={{ mb: 0.5, color: 'text.secondary' }}>
                        {t('deposit.settlement.interestRate')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="success.main" fontWeight="bold" sx={{color: 'success.main' }}>
                        {deposit.interestRate ? `${deposit.interestRate}%` : t('common.na')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary" sx={{  mb: 0.5, color: 'text.secondary' }}>
                        {t('deposit.settlement.accruedInterest')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="info.main" fontWeight="bold" sx={{ color: 'info.main' }}>
                        {formatCurrency(Number(deposit.accruedInterest) || 0)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box textAlign="center" sx={{ p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <ResponsiveTypography variant="cardSubtitle" color="text.secondary" sx={{ mb: 0.5, color: 'text.secondary' }}>
                        {t('deposit.settlement.total')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue" color="text.primary" fontWeight="bold" sx={{ color: 'text.primary' }}>
                        {formatCurrency(Number(deposit.totalValue) || 0)}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Settlement Form - Compact */}
        <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2 }}>
            <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ mb: 2, fontSize: '1rem' }}>
              {t('deposit.settlement.settlementDetails')}
            </ResponsiveTypography>
            
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="settlementDate"
                  control={control}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label={t('deposit.settlement.settlementDate')}
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => {
                          const dateString = date ? date.toISOString().split('T')[0] : '';
                          field.onChange(dateString);
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'medium',
                            error: !!errors.settlementDate,
                            required: true,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              }
                            }
                          },
                        }}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="actualInterest"
                  control={control}
                  render={({ field }) => (
                    <MoneyInput
                      value={field.value || 0}
                      onChange={(value) => field.onChange(value)}
                      label={t('deposit.settlement.actualInterest')}
                      placeholder={t('deposit.settlement.actualInterestPlaceholder')}
                      helperText={errors.actualInterest?.message}
                      error={!!errors.actualInterest}
                      currency="VND"
                      showCurrency={true}
                      align="right"
                      required
                      disabled={isSubmitting}
                      size="medium"
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
                      label={t('deposit.settlement.notes')}
                      multiline
                      rows={2}
                      error={!!errors.notes}
                      helperText={errors.notes?.message}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1,
                          minHeight: '54px',
                        }
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Settlement Summary - Compact */}
        <Card sx={{ 
          border: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}>
          <CardContent sx={{ p: 2, textAlign: 'center' }}>
            {/* Main Total - Compact */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                <ResponsiveTypography variant="cardTitle">
                  {t('deposit.settlement.totalReceived')}
                </ResponsiveTypography>
              </Box>
              <ResponsiveTypography variant="cardValueLarge" color="success.main" sx={{ 
                letterSpacing: '-0.02em'
              }}>
                {formatCurrency(calculateTotalSettlement(Number(deposit.principal) || 0, Number(actualInterest) || 0))}
              </ResponsiveTypography>
            </Box>
            
            {/* Breakdown - Compact */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 4,
              flexWrap: 'wrap'
            }}>
              <Box sx={{ 
                textAlign: 'center',
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                minWidth: 100
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                  <BankIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                  <ResponsiveTypography variant="cardSubtitle" sx={{ color: 'text.secondary' }}>
                    {t('deposit.settlement.principal')}
                  </ResponsiveTypography>
                </Box>
                <ResponsiveTypography variant="cardValueSmall" sx={{ color: 'text.primary' }}>
                  {formatCurrency(Number(deposit.principal) || 0)}
                </ResponsiveTypography>
              </Box>
              
              <Box sx={{ 
                textAlign: 'center',
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                minWidth: 100
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                  <InterestIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                  <ResponsiveTypography variant="cardSubtitle" sx={{ color: 'text.secondary' }}>
                    {t('deposit.settlement.interest')}
                  </ResponsiveTypography>
                </Box>
                <ResponsiveTypography variant="cardValueSmall" sx={{ color: 'text.primary' }}>
                  {formatCurrency(Number(actualInterest) || 0)}
                </ResponsiveTypography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </form>
    </ModalWrapper>
  );
};

export default DepositSettlementModal;
