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

interface RedemptionModalProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio | null;
  onRedemptionSuccess: () => void;
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
}) => {
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
        accountId: '',
        amount: 0,
        units: 0,
        description: '',
        transactionDate: new Date().toISOString().split('T')[0], // Default to current date
      });
      setError(null);
      setErrors({});
    }
  }, [portfolio]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.accountId) {
      newErrors.accountId = 'Please select an account';
    }

    if (!formData.units || formData.units <= 0) {
      newErrors.units = 'Units must be greater than 0';
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
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
        'Failed to create redemption. Please try again.'
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
        size="large"
      >
        Cancel
      </ResponsiveButton>
      <ResponsiveButton 
        onClick={handleSubmit} 
        variant="contained" 
        color="error"
        disabled={!isFormValid}
        size="large"
        icon={loading ? <CircularProgress size={20} /> : <RemoveIcon />}
        mobileText="Process"
        desktopText="Process Redemption"
      >
        {loading ? 'Processing...' : 'Process Redemption'}
      </ResponsiveButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title="Process Fund Redemption"
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
          <ResponsiveTypography variant="pageTitle" sx={{ color: 'text.secondary' }} gutterBottom>
            Fund Information
          </ResponsiveTypography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                Fund Name
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
                {portfolio.name}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                NAV per Unit
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
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
                setFormData(prev => ({ ...prev, accountId }));
                if (errors.accountId) {
                  setErrors(prev => ({ ...prev, accountId: undefined }));
                }
              }}
              label="Investor Account (With Holdings)"
              placeholder="Search for an investor with holdings in this fund..."
              helperText={accountsError ? `Error: ${accountsError}` : "Only accounts with holdings in this fund are shown"}
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
              label="Redemption Amount (Auto-calculated)"
              placeholder="Amount will be calculated automatically"
              helperText="Amount is calculated automatically based on units and NAV per unit"
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
              label="Units to Redeem"
              placeholder="Enter number of units to redeem"
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
                label="Transaction Date"
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
                    helperText: errors.transactionDate || 'Select the date for this redemption',
                    required: true,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              placeholder="Optional description for this redemption"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        {/* Calculation Summary */}
        <Card variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <ResponsiveTypography variant="pageTitle" sx={{ color: 'warning.main' }} gutterBottom>
            Redemption Summary
          </ResponsiveTypography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                NAV per Unit
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
                {formatCurrency(navPerUnit, 'VND')}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={4}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                Units to Redeem
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
                {formatNumberWithSeparators(formData.units, 3)}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={4}>
              <ResponsiveTypography variant="labelSmall" sx={{ color: 'text.secondary' }}>
                Calculated Amount
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardValue" sx={{ color: 'primary' }}>
                {formatCurrency(calculatedAmount, 'VND')}
              </ResponsiveTypography>
            </Grid>
          </Grid>
          {calculatedAmount > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <ResponsiveTypography variant="labelSmall">
                Amount is automatically calculated based on the units you enter and current NAV per unit.
              </ResponsiveTypography>
            </Alert>
          )}
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Date Awareness Notice */}
        <Alert severity="warning" sx={{ mt: 2 }}>
          <ResponsiveTypography variant="labelSmall" sx={{ fontWeight: 500 }}>
            ⚠️ Data Impact Notice
          </ResponsiveTypography>
          <ResponsiveTypography variant="labelSmall" sx={{ mt: 1 }}>
            Processing this redemption will automatically update:
          </ResponsiveTypography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <ResponsiveTypography component="li" variant="labelSmall">
              Portfolio NAV per unit and total outstanding units
            </ResponsiveTypography>
            <ResponsiveTypography component="li" variant="labelSmall">
              Investor holding metrics (units, investment, P&L)
            </ResponsiveTypography>
            <ResponsiveTypography component="li" variant="labelSmall">
              Cash flow records and portfolio balance
            </ResponsiveTypography>
          </Box>
          <ResponsiveTypography variant="labelSmall" sx={{ mt: 1, fontStyle: 'italic' }}>
            All calculations will be based on current date and current NAV per unit
          </ResponsiveTypography>
        </Alert>
      </Box>
    </ModalWrapper>
  );
};

export default RedemptionModal;
