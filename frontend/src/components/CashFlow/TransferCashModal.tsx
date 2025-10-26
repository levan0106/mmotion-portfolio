import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import MoneyInput from '../Common/MoneyInput';
import FundingSourceInput from '../Common/FundingSourceInput';
import { formatCurrency } from '../../utils/format';

interface TransferCashData {
  fromSource: string;
  toSource: string;
  amount: number;
  description: string;
  transferDate: string;
}

interface TransferCashModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transferData: TransferCashData) => Promise<void>;
  loading: boolean;
  error: string | null;
  fundingSources: string[];
}

const TransferCashModal: React.FC<TransferCashModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  fundingSources,
}) => {
  const { t } = useTranslation();
  
  const [transferData, setTransferData] = useState<TransferCashData>({
    fromSource: '',
    toSource: '',
    amount: 0,
    description: '',
    transferDate: '',
  });

  // Helper function to get current local date for form
  const getCurrentLocalDate = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setTransferData({
        fromSource: '',
        toSource: '',
        amount: 0,
        description: '',
        transferDate: getCurrentLocalDate(),
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    await onSubmit(transferData);
  };

  return (
    <ModalWrapper
      open={open}
      onClose={() => {
        onClose();
      }}
      title={t('cashflow.transfer.title')}
      icon={<TransferIcon color="secondary" />}
      maxWidth="md"
      fullWidth
      loading={loading}
      titleColor="secondary"
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ResponsiveButton 
            onClick={() => {
              onClose();
            }}
            mobileText={t('common.cancel')}
            desktopText={t('common.cancel')}
          >
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleSubmit}
            variant="contained"
            color="secondary"
            icon={<TransferIcon />}
            mobileText={loading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transfer')}
            desktopText={loading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transferCash')}
            disabled={
              loading || 
              !transferData.fromSource || 
              !transferData.toSource ||
              transferData.amount <= 0 || 
              transferData.fromSource === transferData.toSource
            }
          >
            {loading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transferCash')}
          </ResponsiveButton>
        </Box>
      }
    >
      <Box sx={{ pt: 1 }}>
        <ResponsiveTypography variant="formHelper" sx={{ mb: 2, display: 'block' }}>
          {t('cashflow.transfer.description')}
        </ResponsiveTypography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <ResponsiveTypography variant="tableCell">
              <strong>Error:</strong> {error}
            </ResponsiveTypography>
            <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
              Please check your input and try again.
            </ResponsiveTypography>
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ pr: { md: 1.5 } }}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>{t('cashflow.transfer.fromSource')}</InputLabel>
                <Select
                  value={transferData.fromSource}
                  label={t('cashflow.transfer.fromSource')}
                  onChange={(e) => setTransferData({ ...transferData, fromSource: e.target.value })}
                >
                  {fundingSources.map((source) => (
                    <MenuItem key={source} value={source}>
                      {source}
                    </MenuItem>
                  ))}
                </Select>
                <ResponsiveTypography variant="formHelper" sx={{ mt: 0.5, display: 'block' }}>
                  {t('cashflow.transfer.fromSourceHelper')}
                </ResponsiveTypography>
              </FormControl>
              
              <FundingSourceInput
                value={transferData.toSource}
                onChange={(toSource) => setTransferData({ ...transferData, toSource })}
                existingSources={fundingSources}
                label={t('cashflow.transfer.toSource')}
                placeholder={t('cashflow.transfer.toSourcePlaceholder')}
                required
                allowNew={true}
              />
              
              <MoneyInput
                value={transferData.amount}
                onChange={(amount) => setTransferData({ ...transferData, amount })}
                label={t('cashflow.transfer.amount')}
                placeholder={t('cashflow.transfer.amountPlaceholder')}
                required
                margin="normal"
                error={!!(transferData.amount && transferData.amount <= 0)}
              />
            </Box>
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ pl: { md: 1.5 } }}>
              <TextField
                fullWidth
                label={t('cashflow.transfer.date')}
                type="date"
                value={transferData.transferDate}
                onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                helperText={t('cashflow.transfer.dateHelper')}
              />
              
              <TextField
                fullWidth
                label={t('cashflow.transfer.description')}
                value={transferData.description}
                onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
                placeholder={t('cashflow.transfer.descriptionPlaceholder', { 
                  from: transferData.fromSource || t('cashflow.transfer.source'), 
                  to: transferData.toSource || t('cashflow.transfer.destination') 
                })}
                helperText={t('cashflow.transfer.descriptionHelper')}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Transfer Summary */}
        {transferData.fromSource && transferData.toSource && transferData.amount > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 'bold' }}>
              {t('cashflow.transfer.summary')}:
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell">
              {t('cashflow.transfer.summaryText', { 
                amount: formatCurrency(transferData.amount), 
                from: transferData.fromSource, 
                to: transferData.toSource 
              })}
            </ResponsiveTypography>
            <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
              {t('cashflow.transfer.summaryHelper')}
            </ResponsiveTypography>
          </Alert>
        )}
      </Box>
    </ModalWrapper>
  );
};

export default TransferCashModal;
