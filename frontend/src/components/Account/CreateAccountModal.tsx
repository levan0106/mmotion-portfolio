import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Account } from '../../types';
import { apiService } from '../../services/api';

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onAccountCreated: (account: Account) => void;
}

interface CreateAccountFormData {
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
      const response = await apiService.api.post('/api/v1/accounts', formData);
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
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          Create New Account
        </Typography>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ 
            minWidth: 'auto', 
            p: 1,
            '&:hover': { backgroundColor: 'error.light', color: 'white' }
          }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            margin="normal"
            required
            disabled={loading}
            helperText="This will be used for account identification"
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

          <FormControlLabel
            control={
              <Switch
                checked={formData.isInvestor}
                onChange={handleInputChange('isInvestor')}
                disabled={loading}
              />
            }
            label="Can invest in funds"
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Enable this if this account can invest in fund portfolios
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name || !formData.email}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? 'Creating...' : 'Create Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAccountModal;

