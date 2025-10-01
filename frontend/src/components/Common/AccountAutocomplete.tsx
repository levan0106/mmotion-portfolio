/**
 * Account Autocomplete Component
 * Provides autocomplete functionality for account selection
 */

import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Account } from '../../types';
import { useAccounts } from '../../hooks/useAccounts';

interface AccountAutocompleteProps {
  value: string;
  onChange: (accountId: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'outlined' | 'filled' | 'standard';
  onBlur?: () => void;
  onFocus?: () => void;
  filterInvestorOnly?: boolean;
  accounts?: Account[]; // Optional prop to override default accounts
}

const AccountAutocomplete: React.FC<AccountAutocompleteProps> = ({
  value,
  onChange,
  label = 'Account',
  placeholder = 'Search for an account...',
  helperText,
  error = false,
  required = false,
  disabled = false,
  fullWidth = true,
  margin = 'normal',
  variant = 'outlined',
  onBlur,
  onFocus,
  filterInvestorOnly = false,
  accounts: customAccounts,
}) => {
  const { accounts: defaultAccounts, loading, error: accountsError } = useAccounts();
  
  // Use custom accounts if provided, otherwise use default accounts
  const accounts = customAccounts || defaultAccounts;
  const [inputValue, setInputValue] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Filter accounts based on investor status if needed
  const filteredAccounts = filterInvestorOnly 
    ? accounts.filter(account => account.isInvestor)
    : accounts;

  // Find selected account when value changes
  useEffect(() => {
    if (value && accounts.length > 0) {
      const account = accounts.find(acc => acc.accountId === value);
      setSelectedAccount(account || null);
    } else {
      setSelectedAccount(null);
    }
  }, [value, accounts]);

  const handleChange = (_event: any, newValue: Account | null) => {
    setSelectedAccount(newValue);
    onChange(newValue?.accountId || '');
  };

  const handleInputChange = (_event: any, newInputValue: string) => {
    setInputValue(newInputValue);
  };

  const getOptionLabel = (option: Account) => {
    return `${option.name} (ID: ${option.accountId})`;
  };

  const isOptionEqualToValue = (option: Account, value: Account) => {
    return option.accountId === value.accountId;
  };

  const renderOption = (props: any, option: Account) => (
    <Box component="li" {...props}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {option.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {option.isMainAccount && (
              <Chip label="Main" size="small" color="primary" />
            )}
            {option.isInvestor && (
              <Chip label="Investor" size="small" color="success" />
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          ID: {option.accountId}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Email: {option.email} • Currency: {option.baseCurrency}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Autocomplete
      value={selectedAccount}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={filteredAccounts}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      renderOption={renderOption}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      onBlur={onBlur}
      onFocus={onFocus}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText || accountsError}
          error={error || !!accountsError}
          required={required}
          margin={margin}
          variant={variant}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={
        loading ? 'Loading accounts...' : 
        filterInvestorOnly ? 'No investor accounts found' : 
        'No accounts found'
      }
      loadingText="Loading accounts..."
    />
  );
};

export default AccountAutocomplete;
