/**
 * Subscription Modal Component
 * Uses ModalWrapper for consistent layout and styling
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  Card,
  CircularProgress,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { SubscribeToFundDto, Portfolio } from '../../types';
import { apiService } from '../../services/api';
import { formatCurrency, formatNumberWithSeparators } from '../../utils/format';
import MoneyInput from '../Common/MoneyInput';
import NumberInput from '../Common/NumberInput';
import AccountAutocomplete from '../Common/AccountAutocomplete';
import ModalWrapper from '../Common/ModalWrapper';

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio | null;
  onSubscriptionSuccess: () => void;
}

interface SubscriptionFormData {
  accountId: string;
  amount: number;
  units: number;
  description: string;
  transactionDate: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  open,
  onClose,
  portfolio,
  onSubscriptionSuccess,
}) => {
  const [formData, setFormData] = useState<SubscriptionFormData>({
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

  // Helper function to clear form data
  const clearFormData = () => {
    setFormData({
      accountId: '',
      amount: 0,
      units: 0,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
    });
    setError(null);
    setErrors({});
  };

  // Initialize form data when portfolio changes
  useEffect(() => {
    if (portfolio) {
      clearFormData();
    }
  }, [portfolio]);

  // Clear form data when modal opens/closes
  useEffect(() => {
    if (open && portfolio) {
      // Reset form when modal opens
      clearFormData();
    }
  }, [open, portfolio]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.accountId || formData.accountId.trim() === '') {
      newErrors.accountId = 'Please select an account or enter an account ID';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    // Units are auto-calculated, so no need to validate them
    if (calculatedUnits <= 0) {
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
      const subscriptionData: SubscribeToFundDto = {
        accountId: formData.accountId,
        portfolioId: portfolio.portfolioId,
        amount: formData.amount,
        description: formData.description,
        subscriptionDate: formData.transactionDate,
      };

      console.log('SubscriptionModal: Submitting with data:', subscriptionData);
      console.log('SubscriptionModal: Account ID:', subscriptionData.accountId);
      console.log('SubscriptionModal: Portfolio ID:', subscriptionData.portfolioId);
      console.log('SubscriptionModal: Amount:', subscriptionData.amount);
      
      await apiService.subscribeToFund(subscriptionData);
      
      // Clear form data after successful submission
      clearFormData();
      
      onSubscriptionSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      // Handle specific error cases
      let errorMessage = 'Failed to create subscription. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = 'Account is not authorized to invest in this fund. Please contact administrator.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid subscription data. Please check your input.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Portfolio or account not found. Please refresh and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Clear all form data when closing
      clearFormData();
      onClose();
    }
  };

  if (!portfolio) return null;

  const navPerUnit = portfolio.navPerUnit || 0;
  const calculatedUnits = formData.amount > 0 && navPerUnit > 0 
    ? Math.round((formData.amount / navPerUnit) * 1000) / 1000 
    : 0;
  
  // Form validation - simplified for custom account ID
  const isFormValid = formData.accountId && 
                     formData.accountId.trim() !== '' &&
                     formData.amount > 0 && 
                     !loading;

  // Additional validation for custom account ID
  const hasValidAccountId = formData.accountId && formData.accountId.trim() !== '';
  const hasValidAmount = formData.amount > 0;
  const hasValidUnits = calculatedUnits > 0;
  const isNotLoading = !loading;

  // Enhanced validation for custom account ID
  console.log('Custom account ID check:', {
    accountId: formData.accountId,
    hasValidAccountId,
    hasValidAmount,
    isFormValid
  });

  // Debug logging for form validation
  console.log('Form validation:', {
    accountId: formData.accountId,
    amount: formData.amount,
    calculatedUnits,
    loading,
    isFormValid,
    hasValidAccountId,
    hasValidAmount,
    hasValidUnits,
    isNotLoading
  });

  // Test validation logic
  if (formData.accountId && formData.accountId.trim() !== '') {
    console.log('✅ Account ID is valid:', formData.accountId);
  } else {
    console.log('❌ Account ID is invalid:', formData.accountId);
  }

  const modalActions = (
    <>
      <Button 
        onClick={handleClose}
        disabled={loading}
        size="large"
      >
        Cancel
      </Button>
      <Button 
        onClick={handleSubmit} 
        variant="contained" 
        disabled={!isFormValid}
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
      >
        {loading ? 'Creating...' : 'Create Subscription'}
      </Button>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title="New Fund Subscription"
      icon={<AddIcon color="primary" />}
      actions={modalActions}
      loading={loading}
      maxWidth="md"
      fullWidth
      titleColor="primary"
      size="medium"
    >
      <Box sx={{ pt: 1 }}>
        {/* Fund Information */}
        <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Fund Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Fund Name
              </Typography>
              <Typography variant="h6" color="primary">
                {portfolio.name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                NAV per Unit
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(navPerUnit, 'VND')}
              </Typography>
            </Grid>
          </Grid>
        </Card>

        {/* Subscription Form */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <AccountAutocomplete
              value={formData.accountId}
              onChange={(accountId) => {
                console.log('SubscriptionModal: Account ID changed to:', accountId);
                setFormData(prev => ({ ...prev, accountId }));
                if (errors.accountId) {
                  setErrors(prev => ({ ...prev, accountId: undefined }));
                }
              }}
              label="Account"
              placeholder="Search for an account or enter new account ID..."
              helperText={errors.accountId}
              error={!!errors.accountId}
              disabled={loading}
              filterInvestorOnly={false}
              portfolioId={portfolio.portfolioId}
              allowCustomAccountId={true}
              showPortfolioInvestors={true}
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
              label="Investment Amount"
              placeholder="Enter investment amount (e.g., 1,000,000)"
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
            <NumberInput
              value={calculatedUnits}
              onChange={() => {}} // Disabled - auto-calculated
              label="Units (Auto-calculated)"
              placeholder="Units will be calculated automatically"
              helperText="Units are calculated automatically based on amount and NAV per unit"
              error={!!errors.units}
              disabled={true} // Always disabled
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
                    helperText: errors.transactionDate || 'Select the date for this subscription',
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              placeholder="Optional description for this subscription"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        {/* Calculation Summary */}
        <Card variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="subtitle2" color="info.main" gutterBottom>
            Calculation Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                NAV per Unit
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(navPerUnit, 'VND')}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Calculated Units
              </Typography>
              <Typography variant="h6" color="primary">
                {formatNumberWithSeparators(calculatedUnits, 3)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Investment Amount
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(formData.amount, 'VND')}
              </Typography>
            </Grid>
          </Grid>
          {calculatedUnits > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Units are automatically calculated based on the investment amount and current NAV per unit.
              </Typography>
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
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            📅 Data Impact Notice
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Creating this subscription will automatically update:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <Typography component="li" variant="body2">
              Portfolio NAV per unit and total outstanding units
            </Typography>
            <Typography component="li" variant="body2">
              Investor holding metrics (units, investment, P&L)
            </Typography>
            <Typography component="li" variant="body2">
              Cash flow records and portfolio balance
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
            All calculations will be based on current date and current NAV per unit
          </Typography>
        </Alert>
      </Box>
    </ModalWrapper>
  );
};

export default SubscriptionModal;
