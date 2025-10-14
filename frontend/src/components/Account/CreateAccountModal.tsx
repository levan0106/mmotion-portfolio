import React, { useState } from 'react';
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
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ModalWrapper } from '../Common/ModalWrapper';
import { AccountBalance as AccountIcon } from '@mui/icons-material';
import { Account } from '../../types';
import { apiService } from '../../services/api';

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAccountCreated: (account: Account) => void;
}

interface CreateAccountFormData {
  name: string;
  email?: string;
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

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  open,
  onClose,
  onAccountCreated,
}) => {
  const [formData, setFormData] = useState<CreateAccountFormData>({
    name: '',
    email: '',
    baseCurrency: 'VND',
    isInvestor: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateAccountFormData) => (
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
    setLoading(true);
    setError(null);

    try {
      // Prepare data - only include email if it's not empty
      const submitData = {
        name: formData.name,
        baseCurrency: formData.baseCurrency,
        isInvestor: formData.isInvestor,
        ...(formData.email && formData.email.trim() !== '' && { email: formData.email.trim() })
      };

      const response = await apiService.api.post('/api/v1/accounts', submitData);
      const newAccount: Account = {
        id: response.data.accountId,
        accountId: response.data.accountId,
        name: response.data.name,
        email: response.data.email,
        baseCurrency: response.data.baseCurrency,
        isInvestor: response.data.isInvestor,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
      };

      onAccountCreated(newAccount);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        baseCurrency: 'VND',
        isInvestor: false,
      });
    } catch (err: any) {
      console.error('Error creating account:', err);
      setError(
        err.response?.data?.message || 
        'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setFormData({
        name: '',
        email: '',
        baseCurrency: 'VND',
        isInvestor: false,
      });
      onClose();
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title="Create New Account"
      icon={<AccountIcon />}
      loading={loading}
      maxWidth="sm"
      size="medium"
      actions={
        <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
          <ResponsiveButton 
            onClick={handleClose} 
            disabled={loading}
            color="inherit"
            mobileText="Cancel"
            desktopText="Cancel"
            sx={{ flex: 1 }}
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name}
            icon={loading && <CircularProgress size={16} />}
            mobileText={loading ? 'Creating...' : 'Create'}
            desktopText={loading ? 'Creating...' : 'Create Account'}
            sx={{ flex: 1 }}
          >
            {loading ? 'Creating...' : 'Create Account'}
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
        <ResponsiveTypography variant="pageTitle" sx={{ mt: 2 }}>
          Account Information
        </ResponsiveTypography>
        
        <TextField
          fullWidth
          label="Account Holder Name"
          value={formData.name}
          onChange={handleInputChange('name')}
          margin="normal"
          required
          disabled={loading}
          helperText="Enter the full name of the account holder"
        />

        <TextField
          fullWidth
          label="Email Address (Optional)"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          margin="normal"
          disabled={loading}
          helperText="Optional: Enter email address for account identification"
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel>Base Currency</InputLabel>
          <Select
            value={formData.baseCurrency}
            onChange={handleInputChange('baseCurrency')}
            label="Base Currency"
            disabled={loading}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isInvestor}
                onChange={handleInputChange('isInvestor')}
                disabled={loading}
              />
            }
            label={
              <ResponsiveTypography variant="body2">
                Can invest in funds
              </ResponsiveTypography>
            }
          />
          <ResponsiveTypography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Enable this if this account can invest in fund portfolios
          </ResponsiveTypography>
        </Box>
      </Box>
    </ModalWrapper>
  );
};

export default CreateAccountModal;

