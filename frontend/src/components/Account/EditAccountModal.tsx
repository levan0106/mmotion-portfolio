import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { AccountBalance as AccountIcon } from '@mui/icons-material';
import { Account } from '../../types';
import { apiService } from '../../services/api';

interface EditAccountModalProps {
  open: boolean;
  onClose: () => void;
  account: Account | null;
  onAccountUpdated: (updatedAccount: Account) => void;
}

interface EditAccountFormData {
  name: string;
  email: string;
  baseCurrency: string;
  isInvestor: boolean;
}

const CURRENCY_OPTIONS = [
  { value: 'VND', label: 'Vietnamese Dong (VND)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
];

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  open,
  onClose,
  account,
  onAccountUpdated,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<EditAccountFormData>({
    name: '',
    email: '',
    baseCurrency: 'VND',
    isInvestor: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when account changes
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        email: account.email,
        baseCurrency: account.baseCurrency,
        isInvestor: account.isInvestor || false,
      });
      setError(null);
    }
  }, [account]);

  const handleInputChange = (field: keyof EditAccountFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = field === 'isInvestor' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.api.put(`/api/v1/accounts/${account.accountId}`, formData);
      const updatedAccount: Account = {
        id: response.data.accountId,
        accountId: response.data.accountId,
        name: response.data.name,
        email: response.data.email,
        baseCurrency: response.data.baseCurrency,
        isInvestor: response.data.isInvestor,
        isMainAccount: response.data.isMainAccount,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };

      onAccountUpdated(updatedAccount);
      onClose();
    } catch (err: any) {
      console.error('Error updating account:', err);
      setError(
        err.response?.data?.message || 
        t('editAccountModal.error.updateFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  if (!account) return null;

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('editAccountModal.title')}
      icon={<AccountIcon />}
      loading={loading}
      maxWidth="sm"
      size="medium"
      actions={
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
          <ResponsiveButton 
            onClick={handleClose} 
            disabled={loading}
            color="inherit"
            mobileText={t('common.cancel')}
            desktopText={t('common.cancel')}
            sx={{ width: 'auto' }}
          >
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.email}
            icon={loading && <CircularProgress size={16} />}
            mobileText={loading ? t('editAccountModal.updating') : t('editAccountModal.update')}
            desktopText={loading ? t('editAccountModal.updating') : t('editAccountModal.updateAccount')}
            sx={{ width: 'auto' }}
          >
            {loading ? t('editAccountModal.updating') : t('editAccountModal.updateAccount')}
          </ResponsiveButton>
        </Box>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label={t('editAccountModal.fields.name')}
          value={formData.name}
          onChange={handleInputChange('name')}
          margin="normal"
          required
          disabled={loading}
          helperText={t('editAccountModal.fields.nameHelper')}
        />

        <TextField
          fullWidth
          label={t('editAccountModal.fields.email')}
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          margin="normal"
          required
          disabled={loading}
          helperText={t('editAccountModal.fields.emailHelper')}
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel>{t('editAccountModal.fields.baseCurrency')}</InputLabel>
          <Select
            value={formData.baseCurrency}
            onChange={handleInputChange('baseCurrency')}
            label={t('editAccountModal.fields.baseCurrency')}
            disabled={loading}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={formData.isInvestor}
              onChange={handleInputChange('isInvestor')}
              disabled={loading}
            />
          }
          label={t('editAccountModal.fields.canInvest')}
          sx={{ mt: 2 }}
        />
        <Box sx={{ mt: 0.5 }}>
          <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {t('editAccountModal.fields.canInvestHelper')}
          </Box>
        </Box>
      </Box>
    </ModalWrapper>
  );
};

export default EditAccountModal;
