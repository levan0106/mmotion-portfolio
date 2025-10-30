/**
 * Redemption Modal Component
 * Uses ModalWrapper for consistent layout and styling
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Alert,
  Card,
  CircularProgress,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { ResponsiveButton, ResponsiveTypography } from '../Common';
import { RedeemFromFundDto, Portfolio } from '../../types';
import { apiService } from '../../services/api';
import { formatCurrency, formatNumberWithSeparators } from '../../utils/format';
import MoneyInput from '../Common/MoneyInput';
import NumberInput from '../Common/NumberInput';
import AccountAutocomplete from '../Common/AccountAutocomplete';
import ModalWrapper from '../Common/ModalWrapper';
import { useAccountsWithHoldings } from '../../hooks/useAccountsWithHoldings';
import { useTranslation } from 'react-i18next';

interface RedemptionModalProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio | null;
  onRedemptionSuccess: () => void;
  preselectedAccountId?: string;
}

interface RedemptionFormData {
  accountId: string;
  amount: number;
  units: number;
  description: string;
  transactionDate: string;
}

export const RedemptionModal: React.FC<RedemptionModalProps> = ({
  open,
  onClose,
  portfolio,
  onRedemptionSuccess,
  preselectedAccountId,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RedemptionFormData>({
    accountId: '',
    amount: 0,
    units: 0,
    description: '',
    transactionDate: new Date().toISOString().split('T')[0], // Default to current date
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    accountId?: string;
    amount?: string;
    units?: string;
    transactionDate?: string;
  }>({});

  // Get accounts that have holdings in this portfolio
  const { accounts: accountsWithHoldings, loading: accountsLoading, error: accountsError } = useAccountsWithHoldings(portfolio?.portfolioId || null);

  // Initialize form data when portfolio changes
  useEffect(() => {
    if (portfolio) {
      setFormData({
        accountId: preselectedAccountId || '',
        amount: 0,
        units: 0,
        description: '',
        transactionDate: new Date().toISOString().split('T')[0], // Default to current date
      });
      setError(null);
      setErrors({});
    }
  }, [portfolio, preselectedAccountId]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.accountId) {
      newErrors.accountId = t('holdings.redemptionModal.validation.accountRequired');
    }

    if (!formData.units || formData.units <= 0) {
      newErrors.units = t('holdings.redemptionModal.validation.unitsRequired');
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = t('holdings.redemptionModal.validation.dateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!portfolio || !validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redemptionData: RedeemFromFundDto = {
        accountId: formData.accountId,
        portfolioId: portfolio.portfolioId,
        units: formData.units,
        description: formData.description,
        redemptionDate: formData.transactionDate,
      };

      await apiService.redeemFromFund(redemptionData);
      onRedemptionSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating redemption:', err);
      setError(
        err.response?.data?.message || 
        t('holdings.redemptionModal.error.createFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setErrors({});
      onClose();
    }
  };

  if (!portfolio) return null;

  const navPerUnit = portfolio.navPerUnit || 0;
  
  // Calculate amount automatically from units
  const calculatedAmount = formData.units > 0 && navPerUnit > 0 
    ? Math.round((formData.units * navPerUnit) * 1000) / 1000 
    : 0;
  
  // Form validation
  const isFormValid = formData.accountId && 
                     formData.units > 0 && 
                     calculatedAmount > 0 && 
                     !loading;

  const modalActions = (
    <>
      <ResponsiveButton 
        onClick={handleClose}
        disabled={loading}
        size="medium"
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ResponsiveButton 
        onClick={handleSubmit} 
        variant="contained" 
        color="error"
        disabled={!isFormValid}
        size="medium"
        icon={loading ? <CircularProgress size={20} /> : <RemoveIcon />}
        mobileText={t('holdings.redemptionModal.processRedemption')}
        desktopText={t('holdings.redemptionModal.processRedemption')}
        forceTextOnly={true}
      >
        {loading ? t('holdings.redemptionModal.processing') : t('holdings.redemptionModal.processRedemption')}
      </ResponsiveButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('holdings.redemptionModal.title')}
      icon={<RemoveIcon color="error" />}
      actions={modalActions}
      loading={loading}
      maxWidth="md"
      fullWidth
      titleColor="error"
      size="medium"
    >
      <Box sx={{ pt: 1 }}>
        {/* Fund Information */}
        <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: 'grey.50' }}>
          <ResponsiveTypography variant="cardTitle" sx={{ color: 'text.secondary' }} gutterBottom>
            {t('holdings.redemptionModal.fundInformation')}
          </ResponsiveTypography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                {t('holdings.redemptionModal.fundName')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardTitle" sx={{ color: 'primary' }}>
                {portfolio.name}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                {t('holdings.redemptionModal.navPerUnit')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardTitle" sx={{ color: 'primary' }}>
                {formatCurrency(navPerUnit, 'VND')}
              </ResponsiveTypography>
            </Grid>
          </Grid>
        </Card>

        {/* Redemption Form */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <AccountAutocomplete
              value={formData.accountId}
              onChange={(accountId) => {
                // Ensure accountId is always a string
                const accountIdString = typeof accountId === 'string' ? accountId : String(accountId || '');
                setFormData(prev => ({ ...prev, accountId: accountIdString }));
                if (errors.accountId) {
                  setErrors(prev => ({ ...prev, accountId: undefined }));
                }
              }}
              label={t('holdings.redemptionModal.investorAccount')}
              placeholder={t('holdings.redemptionModal.investorAccountPlaceholder')}
              helperText={accountsError ? `Error: ${accountsError}` : t('holdings.redemptionModal.investorAccountHelper')}
              error={!!errors.accountId || !!accountsError}
              disabled={loading || accountsLoading}
              accounts={accountsWithHoldings}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <MoneyInput
              value={calculatedAmount}
              onChange={() => {}} // Disabled - auto-calculated
              label={t('holdings.redemptionModal.redemptionAmount')}
              placeholder={t('holdings.redemptionModal.redemptionAmountPlaceholder')}
              error={!!errors.amount}
              disabled={true} // Always disabled
              currency="VND"
              showCurrency={true}
              align="right"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <NumberInput
              value={formData.units}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, units: value }));
                if (errors.units) {
                  setErrors(prev => ({ ...prev, units: undefined }));
                }
              }}
              label={t('holdings.redemptionModal.unitsToRedeem')}
              placeholder={t('holdings.redemptionModal.unitsPlaceholder')}
              helperText={errors.units}
              error={!!errors.units}
              disabled={loading}
              decimalPlaces={3}
              min={0.001}
              step={0.001}
              showThousandsSeparator={true}
              align="right"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t('holdings.redemptionModal.transactionDate')}
                value={formData.transactionDate ? new Date(formData.transactionDate) : null}
                onChange={(date) => {
                  const dateString = date ? date.toISOString().split('T')[0] : '';
                  setFormData(prev => ({ ...prev, transactionDate: dateString }));
                  if (errors.transactionDate) {
                    setErrors(prev => ({ ...prev, transactionDate: undefined }));
                  }
                }}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.transactionDate,
                    required: true,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('holdings.redemptionModal.description')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              placeholder={t('holdings.redemptionModal.descriptionPlaceholder')}
            />
          </Grid>
        </Grid>

        {/* Calculation Summary */}
        <Card variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <ResponsiveTypography variant="pageTitle" sx={{ color: 'warning.main' }} gutterBottom>
            {t('holdings.redemptionModal.redemptionSummary')}
          </ResponsiveTypography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                {t('holdings.redemptionModal.navPerUnit')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
                {formatCurrency(navPerUnit, 'VND')}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={6} md={4}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                {t('holdings.redemptionModal.unitsToRedeemLabel')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
                {formatNumberWithSeparators(formData.units, 3)}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={12} md={4}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                {t('holdings.redemptionModal.calculatedAmount')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
                {formatCurrency(calculatedAmount, 'VND')}
              </ResponsiveTypography>
            </Grid>
          </Grid>
          {/* {calculatedAmount > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <ResponsiveTypography variant="labelSmall">
                {t('holdings.redemptionModal.calculationNotice')}
              </ResponsiveTypography>
            </Alert>
          )} */}
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Date Awareness Notice */}
        <Alert sx={{ mt: 2 }}>
          <ResponsiveTypography variant="labelSmall" sx={{ mt: 1 }} ellipsis={false}>
            {t('holdings.redemptionModal.dataImpactMessage')}
          </ResponsiveTypography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <ResponsiveTypography component="li" variant="labelSmall" ellipsis={false}>
              {t('holdings.redemptionModal.dataImpactItem1')}
            </ResponsiveTypography>
            <ResponsiveTypography component="li" variant="labelSmall" ellipsis={false}>
              {t('holdings.redemptionModal.dataImpactItem2')}
            </ResponsiveTypography>
            <ResponsiveTypography component="li" variant="labelSmall" ellipsis={false}>
              {t('holdings.redemptionModal.dataImpactItem3')}
            </ResponsiveTypography>
          </Box>
          <ResponsiveTypography variant="labelSmall" sx={{ mt: 1, fontStyle: 'italic' }} ellipsis={false}>
            {t('holdings.redemptionModal.dataImpactNote')}
          </ResponsiveTypography>
        </Alert>
      </Box>
    </ModalWrapper>
  );
};

export default RedemptionModal;
