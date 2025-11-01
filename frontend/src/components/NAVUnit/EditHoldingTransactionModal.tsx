/**
 * Edit Holding Transaction Modal
 * Uses ModalWrapper for consistent layout and styling
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Alert,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import {
  Edit as EditIcon,
} from '@mui/icons-material';
import { ResponsiveButton, ActionButton } from '../Common';
import { FundUnitTransactionWithCashFlow } from '../../types';
import { apiService } from '../../services/api';
import { formatCurrency, formatNumberWithSeparators } from '../../utils/format';
import MoneyInput from '../Common/MoneyInput';
import NumberInput from '../Common/NumberInput';
import ModalWrapper from '../Common/ModalWrapper';

interface EditHoldingTransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction: FundUnitTransactionWithCashFlow | null;
  onTransactionUpdated: () => void;
}

interface EditFormData {
  units: number;
  amount: number;
  description: string;
  transactionDate: string;
}

export const EditHoldingTransactionModal: React.FC<EditHoldingTransactionModalProps> = ({
  open,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<EditFormData>({
    units: 0,
    amount: 0,
    description: '',
    transactionDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    units?: string;
    amount?: string;
    transactionDate?: string;
    description?: string;
  }>({});

  // Initialize form data when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        units: transaction.transaction.units || 0,
        amount: transaction.transaction.amount || 0,
        description: transaction.cashFlow?.description || '',
        transactionDate: transaction.cashFlow?.flowDate 
          ? new Date(transaction.cashFlow.flowDate).toISOString().split('T')[0]
          : new Date(transaction.transaction.createdAt).toISOString().split('T')[0],
      });
      setError(null);
      setErrors({});
    }
  }, [transaction]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.units || formData.units <= 0) {
      newErrors.units = t('holdings.edit.validation.unitsRequired');
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = t('holdings.edit.validation.amountRequired');
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = t('holdings.edit.validation.dateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!transaction || !validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.updateHoldingTransaction(transaction.transaction.transactionId, {
        units: formData.units,
        amount: formData.amount,
        description: formData.description,
        transactionDate: new Date(formData.transactionDate).toISOString(),
      });

      onTransactionUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      setError(
        err.response?.data?.message || 
        t('holdings.edit.error.updateFailed')
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

  if (!transaction) return null;

  const isSubscription = transaction.transaction.holdingType === 'SUBSCRIBE';
  const navPerUnit = transaction.transaction.navPerUnit;

  const modalActions = (
    <>
      <ResponsiveButton 
        onClick={handleClose}
        disabled={loading}
        size="large"
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ActionButton 
        onClick={handleSubmit} 
        variant="contained" 
        disabled={loading}
        size="large"
        icon={loading ? <CircularProgress size={20} /> : <EditIcon />}
        mobileText={t('common.update')}
        desktopText={t('holdings.edit.updateTransaction')}
        forceTextOnly={true}
      >
        {loading ? t('holdings.edit.updating') : t('holdings.edit.updateTransaction')}
      </ActionButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('holdings.edit.title', { type: '' })}
      icon={<EditIcon color="primary" />}
      actions={modalActions}
      loading={loading}
      maxWidth="md"
      fullWidth
      titleColor="primary"
      size="medium"
    >
      <Box sx={{ pt: 1 }}>
        {/* Transaction Info */}
        <Box sx={{ mb: 3, backgroundColor: 'grey.50', borderRadius: 2, p: 2 }}>
          {/* <ResponsiveTypography variant="pageTitle" color="text.secondary" gutterBottom>
            {t('holdings.edit.transactionInfo')}
          </ResponsiveTypography> */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('holdings.edit.transactionType')}
              </ResponsiveTypography>
              <Chip
                label={transaction.transaction.holdingType}
                color={isSubscription ? 'success' : 'warning'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('holdings.edit.navPerUnit')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="primary">
                {formatCurrency(navPerUnit, 'VND')}
              </ResponsiveTypography>
            </Grid>
          </Grid>
        </Box>

        {/* Edit Form */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <NumberInput
              value={formData.units}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, units: value }));
                if (errors.units) {
                  setErrors(prev => ({ ...prev, units: undefined }));
                }
              }}
              label={t('holdings.edit.units')}
              placeholder={t('holdings.edit.unitsPlaceholder')}
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
            <MoneyInput
              value={formData.amount}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, amount: value }));
                if (errors.amount) {
                  setErrors(prev => ({ ...prev, amount: undefined }));
                }
              }}
              label={t('holdings.edit.amount')}
              placeholder={t('holdings.edit.amountPlaceholder')}
              helperText={errors.amount}
              error={!!errors.amount}
              disabled={loading}
              currency="VND"
              showCurrency={true}
              align="right"
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('holdings.edit.transactionDate')}
              type="date"
              value={formData.transactionDate}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, transactionDate: e.target.value }));
                if (errors.transactionDate) {
                  setErrors(prev => ({ ...prev, transactionDate: undefined }));
                }
              }}
              error={!!errors.transactionDate}
              helperText={errors.transactionDate}
              disabled={loading}
              InputLabelProps={{
                shrink: true,
              }}
              inputProps={{
                max: new Date().toISOString().split('T')[0], // Prevent future dates
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={t('holdings.edit.description')}
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              disabled={loading}
              placeholder={t('holdings.edit.descriptionPlaceholder')}
              helperText={errors.description}
              error={!!errors.description}
            />
          </Grid>
        </Grid>

        {/* Calculation Summary */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
          <ResponsiveTypography variant="pageSubtitle" color="info.main" gutterBottom>
            {t('holdings.edit.calculationSummary')}
          </ResponsiveTypography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('holdings.edit.units')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="primary">
                {formatNumberWithSeparators(formData.units, 3)}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={4}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('holdings.edit.navPerUnit')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="primary">
                {formatCurrency(navPerUnit, 'VND')}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={4}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('holdings.edit.calculatedAmount')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" color="primary">
                {formatCurrency((formData.units || 0) * navPerUnit, 'VND')}
              </ResponsiveTypography>
            </Grid>
          </Grid>
          {Math.abs((formData.units || 0) * navPerUnit - (formData.amount || 0)) > 0.01 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <ResponsiveTypography variant="labelSmall" ellipsis={false}>
                {t('holdings.edit.amountDifferenceNote', { 
                  calculated: formatCurrency((formData.units || 0) * navPerUnit, 'VND'),
                  entered: formatCurrency(formData.amount || 0, 'VND')
                })}
              </ResponsiveTypography>
            </Alert>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <ResponsiveTypography variant="tableCell">
              {error}
            </ResponsiveTypography>
          </Alert>
        )}

        {/* Date Awareness Notice */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <ResponsiveTypography variant="labelSmall" sx={{ mt: 1 }} ellipsis={false}>
            {t('holdings.edit.recalculationMessage')}
          </ResponsiveTypography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <ResponsiveTypography component="li" variant="labelSmall" ellipsis={false}>
              {t('holdings.edit.recalculationItem1')}
            </ResponsiveTypography>
            <ResponsiveTypography component="li" variant="labelSmall" ellipsis={false}>
              {t('holdings.edit.recalculationItem2')}
            </ResponsiveTypography>
            <ResponsiveTypography component="li" variant="labelSmall" ellipsis={false}>
              {t('holdings.edit.recalculationItem3')}
            </ResponsiveTypography>
          </Box>
          <ResponsiveTypography variant="labelSmall" sx={{ mt: 1, fontStyle: 'italic' }} ellipsis={false}>
            {t('holdings.edit.recalculationDate', { date: formData.transactionDate || t('common.currentDate') })}
          </ResponsiveTypography>
        </Alert>
      </Box>
    </ModalWrapper>
  );
};

export default EditHoldingTransactionModal;
