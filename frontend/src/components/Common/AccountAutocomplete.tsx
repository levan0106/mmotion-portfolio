/**
 * Account Autocomplete Component
 * Provides autocomplete functionality for account selection
 * Enhanced with portfolio investor suggestions and custom account ID input
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
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { Account } from '../../types';
import { useAccounts } from '../../hooks/useAccounts';
import { apiService } from '../../services/api';

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
  portfolioId?: string; // Portfolio ID to get existing investors
  allowCustomAccountId?: boolean; // Allow entering custom account ID
  showPortfolioInvestors?: boolean; // Show accounts that have invested in this portfolio
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
  portfolioId,
  allowCustomAccountId = false,
  showPortfolioInvestors = false,
}) => {
  const { accounts: defaultAccounts, loading, error: accountsError } = useAccounts();
  
  const [inputValue, setInputValue] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [portfolioInvestors, setPortfolioInvestors] = useState<any[]>([]);
  const [loadingPortfolioInvestors, setLoadingPortfolioInvestors] = useState(false);
  const [customAccountId, setCustomAccountId] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Use custom accounts if provided, otherwise use default accounts
  const accounts = customAccounts || defaultAccounts;

  // Load portfolio investors when component mounts or when portfolioId changes
  useEffect(() => {
    if (portfolioId && showPortfolioInvestors && portfolioInvestors.length === 0) {
      loadPortfolioInvestors();
    }
  }, [portfolioId, showPortfolioInvestors]);

  // Load portfolio investors when component is opened/focused
  const handleFocus = () => {
    if (portfolioId && showPortfolioInvestors && portfolioInvestors.length === 0) {
      loadPortfolioInvestors();
    }
    onFocus?.();
  };

  const loadPortfolioInvestors = async () => {
    if (!portfolioId) return;
    
    try {
      setLoadingPortfolioInvestors(true);
      const investors = await apiService.getFundInvestors(portfolioId);
      setPortfolioInvestors(investors || []);
    } catch (err) {
      console.error('Error loading portfolio investors:', err);
      setPortfolioInvestors([]);
    } finally {
      setLoadingPortfolioInvestors(false);
    }
  };

  // Load data when input is clicked/opened
  const handleInputClick = () => {
    if (portfolioId && showPortfolioInvestors && portfolioInvestors.length === 0) {
      loadPortfolioInvestors();
    }
  };

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

  // Check if input value is valid (existing account or valid UUID)
  useEffect(() => {
    // Don't process if inputValue is undefined or matches selected account
    if (inputValue === undefined || inputValue === 'undefined') {
      return;
    }
    
    if (selectedAccount && inputValue === `${selectedAccount.name} (ID: ${selectedAccount.accountId})`) {
      return;
    }
    
    if (inputValue && !selectedAccount) {
      const isExistingAccount = accounts.find(acc => acc.accountId === inputValue);
      
      if (isExistingAccount) {
        // Existing account found - auto-select it
        setSelectedAccount(isExistingAccount);
        setIsCustomMode(false);
        setCustomAccountId('');
        onChange(isExistingAccount.accountId);
      } else if (allowCustomAccountId && isValidUUID(inputValue)) {
        // Custom UUID - valid format
        setIsCustomMode(true);
        setCustomAccountId(inputValue);
        onChange(inputValue);
      } else {
        // Invalid format - clear everything
        setSelectedAccount(null);
        setIsCustomMode(false);
        setCustomAccountId('');
        onChange('');
      }
    } else if (selectedAccount || (!inputValue && !customAccountId)) {
      setIsCustomMode(false);
      setCustomAccountId('');
    }
  }, [inputValue, accounts, allowCustomAccountId, selectedAccount, customAccountId, onChange]);

  // Reset custom mode when a valid account is selected
  useEffect(() => {
    if (selectedAccount && isCustomMode) {
      setIsCustomMode(false);
      setCustomAccountId('');
    }
  }, [selectedAccount, isCustomMode]);

  const handleChange = (_event: any, newValue: string | Account | null) => {
    if (typeof newValue === 'string') {
      // Custom account ID entered
      setSelectedAccount(null);
      onChange(newValue);
      setIsCustomMode(true);
      setCustomAccountId(newValue);
    } else if (newValue && typeof newValue === 'object') {
      // Account object selected
      setSelectedAccount(newValue);
      onChange(newValue.accountId);
      setIsCustomMode(false);
      setCustomAccountId('');
    } else {
      // Cleared or undefined
      setSelectedAccount(null);
      onChange('');
      setIsCustomMode(false);
      setCustomAccountId('');
    }
  };

  // Simple UUID validation function
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleInputChange = (_event: any, newInputValue: string) => {
    setInputValue(newInputValue);
    
    // Don't process input changes when an account is already selected
    if (selectedAccount && newInputValue === `${selectedAccount.name} (ID: ${selectedAccount.accountId})`) {
      return;
    }
    
    // Simple logic: check if input is valid
    if (newInputValue) {
      // Check if it's an existing account in the portfolio
      const isExistingAccount = accounts.find(acc => acc.accountId === newInputValue);
      
      if (isExistingAccount) {
        // Existing account found - auto-select it
        setSelectedAccount(isExistingAccount);
        setIsCustomMode(false);
        setCustomAccountId('');
        onChange(isExistingAccount.accountId);
      } else if (allowCustomAccountId && isValidUUID(newInputValue)) {
        // Custom UUID - valid format
        setIsCustomMode(true);
        setCustomAccountId(newInputValue);
        onChange(newInputValue);
      } else {
        // Invalid format - clear everything
        setSelectedAccount(null);
        setIsCustomMode(false);
        setCustomAccountId('');
        onChange('');
      }
    } else {
      // Empty input - clear everything
      setSelectedAccount(null);
      setIsCustomMode(false);
      setCustomAccountId('');
      onChange('');
    }
  };

  const handleBlur = () => {
    // Preserve custom account ID when blurring
    if (allowCustomAccountId && isCustomMode && customAccountId) {
      onChange(customAccountId);
    }
    onBlur?.();
  };

  // Preserve custom account ID when component loses focus
  useEffect(() => {
    if (allowCustomAccountId && isCustomMode && customAccountId && !selectedAccount) {
      onChange(customAccountId);
    }
  }, [allowCustomAccountId, isCustomMode, customAccountId, selectedAccount, onChange]);

  const getOptionLabel = (option: string | Account) => {
    if (typeof option === 'string') {
      return option;
    }
    return `${option.name} (ID: ${option.accountId})`;
  };

  const isOptionEqualToValue = (option: string | Account, value: string | Account) => {
    if (typeof option === 'string' && typeof value === 'string') {
      return option === value;
    }
    if (typeof option === 'object' && typeof value === 'object') {
      return option.accountId === value.accountId;
    }
    return false;
  };

  // Get all available options
  const getAllOptions = () => {
    // If showPortfolioInvestors is enabled and we have portfolio investors data, use it directly
    if (showPortfolioInvestors && portfolioInvestors.length > 0) {
      // Convert portfolio investors to Account objects
      return portfolioInvestors.map(investor => {
        const accountData = investor.account || {};
        
        // Create Account object from InvestorHolding
        const account: Account = {
          id: investor.holdingId || investor.id,
          accountId: investor.accountId,
          name: accountData.name || accountData.accountId || `Investor ${investor.accountId}`,
          email: accountData.email || 'N/A',
          baseCurrency: accountData.baseCurrency || 'VND',
          isInvestor: accountData.isInvestor || false,
          isMainAccount: accountData.isMainAccount || false,
          createdAt: accountData.createdAt || investor.createdAt,
          updatedAt: accountData.updatedAt || investor.updatedAt
        };
        
        return account;
      });
    }
    
    // Otherwise use regular accounts
    return filteredAccounts;
  };

  const renderOption = (props: any, option: string | Account) => {
    // Extract key from props to avoid React warning
    const { key, ...otherProps } = props;
    
    if (typeof option === 'string') {
      return (
        <Box key={key} component="li" {...otherProps}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {option} (New Account)
            </Typography>
          </Box>
        </Box>
      );
    }
    
    const isPortfolioInvestor = showPortfolioInvestors && 
      portfolioInvestors.some(inv => inv.accountId === option.accountId);
    
    return (
      <Box key={key} component="li" {...otherProps}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isPortfolioInvestor ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <AccountBalanceIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              )}
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {option.name || option.accountId || `Account ${option.accountId}`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {option.isMainAccount && (
                <Chip label="Main" size="small" color="primary" />
              )}
              {option.isInvestor && (
                <Chip label="Investor" size="small" color="success" />
              )}
              {isPortfolioInvestor && (
                <Chip label="Portfolio Investor" size="small" color="info" />
              )}
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            ID: {option.accountId}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Email: {option.email || 'N/A'} • Currency: {option.baseCurrency || 'N/A'}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Autocomplete
        value={isCustomMode ? customAccountId : selectedAccount}
        onChange={handleChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        options={getAllOptions()}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={isOptionEqualToValue}
        renderOption={renderOption}
        loading={loading || loadingPortfolioInvestors}
        disabled={disabled}
        fullWidth={fullWidth}
        onBlur={handleBlur}
        onFocus={handleFocus}
        freeSolo={allowCustomAccountId}
        selectOnFocus={false}
        clearOnBlur={false}
        handleHomeEndKeys
        onOpen={() => {
          // Load data when dropdown opens
          if (portfolioId && showPortfolioInvestors && portfolioInvestors.length === 0) {
            loadPortfolioInvestors();
          }
        }}
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
              onClick: handleInputClick,
              endAdornment: (
                <>
                  {loading || loadingPortfolioInvestors ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText={
          loading || loadingPortfolioInvestors ? 'Loading accounts...' : 
          filterInvestorOnly ? 'No investor accounts found' : 
          'No accounts found'
        }
        loadingText="Loading accounts..."
        openOnFocus={true}
      />

      {/* Portfolio Investors Info */}
      {showPortfolioInvestors && (
        <Box sx={{ mt: 1 }}>
          {loadingPortfolioInvestors ? (
            <Typography variant="caption" color="text.secondary">
              <CircularProgress size={12} sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              Loading portfolio investors...
            </Typography>
          ) : portfolioInvestors.length > 0 ? (
            <Typography variant="caption" color="text.secondary">
              <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              {portfolioInvestors.length} existing investor(s) in this portfolio
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary">
              <TrendingUpIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              No existing investors found in this portfolio
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AccountAutocomplete;
