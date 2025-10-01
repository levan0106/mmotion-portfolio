/**
 * Edit Holding Transaction Modal
 * Uses ModalWrapper for consistent layout and styling
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
} from '@mui/icons-material';
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
      newErrors.units = 'Units must be greater than 0';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
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
        'Failed to update transaction. Please try again.'
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
        disabled={loading}
        size="large"
        startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
      >
        {loading ? 'Updating...' : 'Update Transaction'}
      </Button>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={`Edit ${isSubscription ? 'Subscription' : 'Redemption'} Transaction`}
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
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Transaction Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Transaction Type
              </Typography>
              <Chip
                label={transaction.transaction.holdingType}
                color={isSubscription ? 'success' : 'warning'}
                size="small"
                sx={{ mt: 0.5 }}
              />
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
              label="Units"
              placeholder="Enter number of units"
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
              label="Amount"
              placeholder="Enter amount (e.g., 1,000,000)"
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
              label="Transaction Date"
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
              label="Description"
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) {
                  setErrors(prev => ({ ...prev, description: undefined }));
                }
              }}
              disabled={loading}
              placeholder="Optional description for this transaction"
              helperText={errors.description}
              error={!!errors.description}
            />
          </Grid>
        </Grid>

        {/* Calculation Summary */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="subtitle2" color="info.main" gutterBottom>
            Calculation Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Units
              </Typography>
              <Typography variant="h6" color="primary">
                {formatNumberWithSeparators(formData.units, 3)}
              </Typography>
            </Grid>
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
                Calculated Amount
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency((formData.units || 0) * navPerUnit, 'VND')}
              </Typography>
            </Grid>
          </Grid>
          {Math.abs((formData.units || 0) * navPerUnit - (formData.amount || 0)) > 0.01 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Note: The calculated amount ({formatCurrency((formData.units || 0) * navPerUnit, 'VND')}) 
                differs from the entered amount ({formatCurrency(formData.amount || 0, 'VND')}). 
                This may be due to fees or rounding differences.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Date Awareness Notice */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 400 }}>
            📅 Data Recalculation Notice
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            When you update this transaction, the system will automatically recalculate:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
            <Typography component="li" variant="body2">
              Portfolio NAV per unit and total outstanding units
            </Typography>
            <Typography component="li" variant="body2">
              Holding metrics (units, investment, P&L) as of the transaction date
            </Typography>
            <Typography component="li" variant="body2">
              All related cash flow records
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
            Recalculation will be based on the transaction date: <strong>{formData.transactionDate || 'Current date'}</strong>
          </Typography>
        </Alert>
      </Box>
    </ModalWrapper>
  );
};

export default EditHoldingTransactionModal;
