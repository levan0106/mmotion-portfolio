/**
 * Convert to Fund Modal Component
 * Allows converting a portfolio to a fund with optional snapshot date
 */

import React, { useState } from 'react';
import {
  TextField,
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
import { useTranslation } from 'react-i18next';
import { ResponsiveButton, ActionButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
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
  const { t, i18n } = useTranslation();
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
          setError(t('nav.holdings.convertToFundModal.validation.invalidDateFormat'));
          return;
        }
        
        // Check if date is not in the future
        if (date > new Date()) {
          setError(t('nav.holdings.convertToFundModal.validation.dateInFuture'));
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
        t('nav.holdings.convertToFundModal.error.convertFailed')
      );
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Get locale for date formatting based on current language
  const getDateLocale = (): string => {
    const language = i18n.language || 'vi';
    return language === 'en' ? 'en-US' : 'vi-VN';
  };

  const modalActions = (
    <>
      <ResponsiveButton 
        onClick={handleClose}
        disabled={loading}
        size="medium"
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ActionButton 
        onClick={handleConvert} 
        variant="contained" 
        disabled={loading || (useSnapshotDate && !snapshotDate)}
        size="medium"
        icon={loading ? <CircularProgress size={20} /> : <AccountBalanceIcon />}
        mobileText={t('nav.holdings.convertToFundModal.convert')}
        desktopText={t('nav.holdings.convertToFundModal.convertToFund')}
        forceTextOnly={true}
      >
        {loading ? t('nav.holdings.convertToFundModal.converting') : t('nav.holdings.convertToFundModal.convertToFund')}
      </ActionButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('nav.holdings.convertToFundModal.title')}
      icon={<AccountBalanceIcon color="primary" />}
      actions={modalActions}
      loading={loading}
      maxWidth="md"
      titleColor="primary"
      size="medium"
    >
      <Box sx={{ pt: 1 }}>
        {/* Portfolio Information */}
        <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: 'grey.50' }}>
          {/* <ResponsiveTypography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('nav.holdings.convertToFundModal.portfolioInformation')}
          </ResponsiveTypography> */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('nav.holdings.convertToFundModal.portfolioName')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardTitle">
                {portfolio.name}
              </ResponsiveTypography>
            </Grid>
            <Grid item xs={6}>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                {t('nav.holdings.convertToFundModal.baseCurrency')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardTitle">
                {portfolio.baseCurrency}
              </ResponsiveTypography>
            </Grid>
          </Grid>
        </Card>

        {/* Conversion Options */}
        <Box sx={{ mb: 3 }}>
          <ResponsiveTypography variant="cardTitle" gutterBottom>
            {t('nav.holdings.convertToFundModal.conversionOptions')}
          </ResponsiveTypography>
          
          <FormControlLabel
            control={
              <Checkbox
                checked={useSnapshotDate}
                onChange={(e) => setUseSnapshotDate(e.target.checked)}
                disabled={loading}
              />
            }
            label={
              <ResponsiveTypography variant="body2">
                {t('nav.holdings.convertToFundModal.useSnapshotDate')}
              </ResponsiveTypography>
            }
          />
          
          {useSnapshotDate && (
            <Box sx={{ mt: 2, ml: 4 }}>
              <TextField
                fullWidth
                label={t('nav.holdings.convertToFundModal.snapshotDate')}
                type="date"
                value={snapshotDate}
                onChange={(e) => setSnapshotDate(e.target.value)}
                helperText={t('nav.holdings.convertToFundModal.snapshotDateHelper')}
                disabled={loading}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <CalendarIcon sx={{ fontSize: 16, color: 'info.main' }} />
            <ResponsiveTypography variant="subtitle2" color="info.main">
              {t('nav.holdings.convertToFundModal.conversionInformation')}
            </ResponsiveTypography>
          </Box>
          <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 1 }} ellipsis={false}>
            {useSnapshotDate && snapshotDate ? (
              <>
                {t('nav.holdings.convertToFundModal.conversionInfoWithDate', {
                  date: new Date(snapshotDate).toLocaleDateString(getDateLocale())
                })}
              </>
            ) : (
              <>
                {t('nav.holdings.convertToFundModal.conversionInfoCurrent')}
              </>
            )}
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
            {t('nav.holdings.convertToFundModal.conversionInfoAfter')}
          </ResponsiveTypography>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </ModalWrapper>
  );
};

// Remove default export to use only named export
