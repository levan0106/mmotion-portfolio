/**
 * Convert to Fund Modal Component
 * Allows converting a portfolio to a fund with optional snapshot date
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Card,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { Portfolio } from '../../types';

interface ConvertToFundModalProps {
  open: boolean;
  onClose: () => void;
  portfolio: Portfolio;
  onConvert: (snapshotDate?: string) => Promise<void>;
  loading?: boolean;
}

export const ConvertToFundModal: React.FC<ConvertToFundModalProps> = ({
  open,
  onClose,
  portfolio,
  onConvert,
  loading = false,
}) => {
  const [useSnapshotDate, setUseSnapshotDate] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setUseSnapshotDate(false);
    setSnapshotDate('');
    setError(null);
    onClose();
  };

  const handleConvert = async () => {
    setError(null);

    try {
      if (useSnapshotDate && snapshotDate) {
        // Validate date format
        const date = new Date(snapshotDate);
        if (isNaN(date.getTime())) {
          setError('Invalid date format. Please use YYYY-MM-DD format.');
          return;
        }
        
        // Check if date is not in the future
        if (date > new Date()) {
          setError('Snapshot date cannot be in the future.');
          return;
        }

        await onConvert(snapshotDate);
      } else {
        await onConvert();
      }
      
      handleClose();
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to convert portfolio to fund'
      );
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceIcon color="primary" />
          <Typography variant="h6">Convert Portfolio to Fund</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Portfolio Information */}
          <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Portfolio Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Portfolio Name
                </Typography>
                <Typography variant="h6">
                  {portfolio.name}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Base Currency
                </Typography>
                <Typography variant="h6">
                  {portfolio.baseCurrency}
                </Typography>
              </Grid>
            </Grid>
          </Card>

          {/* Conversion Options */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Conversion Options
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={useSnapshotDate}
                  onChange={(e) => setUseSnapshotDate(e.target.checked)}
                />
              }
              label="Use historical snapshot date for conversion"
            />
            
            {useSnapshotDate && (
              <Box sx={{ mt: 2, ml: 4 }}>
                <TextField
                  fullWidth
                  label="Snapshot Date"
                  type="date"
                  value={snapshotDate}
                  onChange={(e) => setSnapshotDate(e.target.value)}
                  helperText="Select the historical date to use for NAV calculation during conversion"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    max: formatDateForInput(new Date()), // Prevent future dates
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Information Card */}
          <Card variant="outlined" sx={{ p: 2, backgroundColor: 'info.50', borderColor: 'info.200' }}>
            <Typography variant="subtitle2" color="info.main" gutterBottom>
              <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              Conversion Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {useSnapshotDate && snapshotDate ? (
                <>
                  This will convert the portfolio to a fund using the portfolio's state as of{' '}
                  <strong>{new Date(snapshotDate).toLocaleDateString('vi-VN')}</strong>.
                  The NAV per unit will be calculated based on the portfolio's value at that specific date.
                </>
              ) : (
                <>
                  This will convert the portfolio to a fund using the current portfolio state.
                  The NAV per unit will be calculated based on the current portfolio value.
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              After conversion, you'll be able to manage fund subscriptions, redemptions, and track investor holdings.
            </Typography>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          size="large"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConvert} 
          variant="contained" 
          disabled={loading || (useSnapshotDate && !snapshotDate)}
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
        >
          {loading ? 'Converting...' : 'Convert to Fund'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Remove default export to use only named export
