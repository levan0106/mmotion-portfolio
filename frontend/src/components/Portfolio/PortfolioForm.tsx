/**
 * Portfolio form component for creating and editing portfolios
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CreatePortfolioDto, UpdatePortfolioDto } from '../../types';
import { useAccount } from '../../contexts/AccountContext';

interface PortfolioFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePortfolioDto | UpdatePortfolioDto) => void;
  initialData?: Partial<CreatePortfolioDto>;
  isEditing?: boolean;
  isLoading?: boolean;
  error?: string;
}

const schema = yup.object({
  name: yup.string().required('Portfolio name is required').min(2, 'Name must be at least 2 characters'),
  baseCurrency: yup.string().required('Base currency is required'),
  fundingSource: yup.string().optional(),
  accountId: yup.string().required('Account ID is required'),
});

const currencies = [
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
];

// Funding source is now a free text input, no predefined options

const PortfolioForm: React.FC<PortfolioFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  isLoading = false,
  error,
}) => {
  const { accountId } = useAccount();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePortfolioDto>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      baseCurrency: initialData?.baseCurrency || 'VND',
      fundingSource: initialData?.fundingSource || '',
      accountId: initialData?.accountId || accountId,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name || '',
        baseCurrency: initialData?.baseCurrency || 'VND',
        fundingSource: initialData?.fundingSource || '',
        accountId: initialData?.accountId || accountId,
      });
    }
  }, [open, initialData, reset, accountId]);

  // Additional effect to handle initialData changes when form is already open
  React.useEffect(() => {
    if (open && initialData) {
      reset({
        name: initialData.name || '',
        baseCurrency: initialData.baseCurrency || 'VND',
        fundingSource: initialData.fundingSource || '',
        accountId: initialData.accountId || accountId,
      });
    }
  }, [initialData, open, reset, accountId]);

  const handleFormSubmit = (data: CreatePortfolioDto) => {
    onSubmit(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Portfolio' : 'Create New Portfolio'}
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Portfolio Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="e.g., Growth Portfolio, Retirement Fund"
                />
              )}
            />

            <Controller
              name="baseCurrency"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.baseCurrency}>
                  <InputLabel>Base Currency</InputLabel>
                  <Select {...field} label="Base Currency">
                    {currencies.map((currency) => (
                      <MenuItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.baseCurrency && (
                    <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                      {errors.baseCurrency.message}
                    </Box>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="fundingSource"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Funding Source (Optional)"
                  fullWidth
                  error={!!errors.fundingSource}
                  helperText={errors.fundingSource?.message || "Optional: Enter the source of funding for this portfolio (e.g., VIETCOMBANK, TPBANK, etc.)"}
                  placeholder="VIETCOMBANK, TPBANK, etc."
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />

            <Controller
              name="accountId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Account ID"
                  fullWidth
                  error={!!errors.accountId}
                  helperText={errors.accountId?.message}
                  placeholder="Enter account ID"
                  disabled={isEditing} // Don't allow changing account ID when editing
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PortfolioForm;
