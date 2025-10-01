import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  currency?: string;
  showCurrency?: boolean;
  align?: 'left' | 'right';
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'outlined' | 'filled' | 'standard';
  onBlur?: () => void;
  onFocus?: () => void;
}

const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  label = 'Amount',
  placeholder = 'Enter amount (e.g., 1,000,000)',
  helperText,
  error = false,
  required = false,
  disabled = false,
  currency = 'VND',
  showCurrency = true,
  align = 'right',
  size = 'medium',
  fullWidth = true,
  margin = 'none',
  variant = 'outlined',
  onBlur,
  onFocus,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display value when value prop changes (only when not focused)
  useEffect(() => {
    if (!isFocused) {
      if (value > 0) {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // If input is empty, allow clearing
    if (inputValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    
    // Remove formatting characters and parse the number
    const rawValue = inputValue.replace(/[^\d.-]/g, '');
    const numericValue = parseFloat(rawValue) || 0;
    
    // Update the numeric value
    onChange(numericValue);
    
    // When focused, show formatted number (without currency)
    // When not focused, show formatted currency
    if (isFocused) {
      if (numericValue > 0) {
        // Format number with thousands separator but no currency
        setDisplayValue(numericValue.toLocaleString('en-US'));
      } else {
        setDisplayValue('');
      }
    } else {
      if (numericValue > 0) {
        setDisplayValue(formatCurrency(numericValue));
      } else {
        setDisplayValue('');
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // When focusing, show formatted number (without currency)
    if (value > 0) {
      setDisplayValue(value.toLocaleString('en-US'));
    } else {
      setDisplayValue('');
    }
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // When blurring, format the value
    if (value > 0) {
      setDisplayValue(formatCurrency(value));
    } else {
      setDisplayValue('');
    }
    onBlur?.();
  };

  const getHelperText = () => {
    if (helperText) return helperText;
    return undefined;
  };

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      margin={margin}
      required={required}
      disabled={disabled}
      error={error}
      variant={variant}
      size={size}
      placeholder={placeholder}
      autoComplete="off"
      inputProps={{
        style: { textAlign: align }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <BalanceIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: showCurrency && value > 0 && (
          <InputAdornment position="end">
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                minWidth: 60, 
                textAlign: 'right',
                fontWeight: 500
              }}
            >
              {currency}
            </Typography>
          </InputAdornment>
        ),
      }}
      helperText={getHelperText()}
    />
  );
};

export default MoneyInput;
