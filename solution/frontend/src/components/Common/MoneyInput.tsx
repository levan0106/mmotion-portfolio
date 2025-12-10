import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  InputAdornment,
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
  showIcon?: boolean;
  InputLabelProps?: {
    shrink?: boolean;
    [key: string]: any;
  };
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
  showIcon = true,
  InputLabelProps,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update display value when value prop changes (only when not focused)
  useEffect(() => {
    if (!isFocused) {
      if (value !== null && value !== undefined && !isNaN(value)) {
        setDisplayValue(formatCurrency(value, currency));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused, currency]);

  // Set cursor to end when displayValue changes and input is focused
  useEffect(() => {
    if (isFocused && inputRef.current && inputRef.current.value) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [displayValue, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // If input is empty, allow clearing
    if (inputValue === '') {
      setDisplayValue('');
      // Don't call onChange here - wait for blur to handle it
      // This allows user to clear the field without triggering onChange immediately
      return;
    }
    
    // Remove formatting characters but keep minus sign
    // Allow minus sign only at the beginning
    let rawValue = inputValue.replace(/[^\d.-]/g, '');
    
    // Handle negative numbers - ensure minus is only at the start
    if (rawValue.startsWith('-')) {
      rawValue = '-' + rawValue.substring(1).replace(/[^\d.]/g, '');
    } else {
      rawValue = rawValue.replace(/[^\d.]/g, '');
    }
    
    // Allow just a minus sign while typing
    if (rawValue === '-' || rawValue === '') {
      setDisplayValue(rawValue);
      return;
    }
    
    const numericValue = parseFloat(rawValue);
    
    // When focused, show formatted number (without currency)
    // When not focused, show formatted currency
    if (isFocused) {
      if (!isNaN(numericValue)) {
        // Format number with thousands separator but no currency
        setDisplayValue(numericValue.toLocaleString('en-US'));
      } else if (rawValue === '-') {
        setDisplayValue('-');
      } else {
        setDisplayValue('');
      }
    } else {
      if (!isNaN(numericValue)) {
        setDisplayValue(formatCurrency(numericValue, currency));
        // Only call onChange when not focused to avoid losing focus during typing
        onChange(numericValue);
      } else {
        setDisplayValue('');
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // When focusing, show formatted number (without currency)
    if (value !== null && value !== undefined && !isNaN(value)) {
      setDisplayValue(value.toLocaleString('en-US'));
    } else {
      setDisplayValue('');
    }
    
    // Auto-select all text when focusing (especially useful for Tab navigation)
    setTimeout(() => {
      if (inputRef.current && typeof inputRef.current.select === 'function') {
        inputRef.current.select();
      }
    }, 0);
    
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Get the current display value and parse it
    let cleanedValue = displayValue.replace(/[^\d.-]/g, '');
    
    // Handle negative numbers
    if (cleanedValue.startsWith('-')) {
      cleanedValue = '-' + cleanedValue.substring(1).replace(/[^\d.]/g, '');
    } else {
      cleanedValue = cleanedValue.replace(/[^\d.]/g, '');
    }
    
    // If displayValue is empty or just a minus sign, call onChange with 0 to clear the value
    if (cleanedValue.trim() === '' || cleanedValue === '-') {
      if (value !== 0) {
        onChange(0);
      }
      setDisplayValue('');
      onBlur?.();
      return;
    }
    
    const currentValue = parseFloat(cleanedValue);
    
    // If displayValue is invalid, don't change the value
    if (isNaN(currentValue)) {
      // If invalid, restore the previous value
      if (value !== null && value !== undefined && !isNaN(value)) {
        setDisplayValue(formatCurrency(value, currency));
      } else {
        setDisplayValue('');
      }
      onBlur?.();
      return;
    }
    
    // Only call onChange if the value actually changed to prevent unnecessary re-renders
    if (currentValue !== value) {
      onChange(currentValue);
    }
    
    // When blurring, format the value
    if (!isNaN(currentValue)) {
      setDisplayValue(formatCurrency(currentValue, currency));
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
      ref={inputRef}
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
      InputLabelProps={InputLabelProps}
      InputProps={{
        startAdornment: showIcon ? (
          <InputAdornment position="start">
            <BalanceIcon color="action" />
          </InputAdornment>
        ) : undefined,
        endAdornment: showCurrency && value !== null && value !== undefined && !isNaN(value) && (
          <InputAdornment position="end">
            {/* <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                // minWidth: 60, 
                textAlign: 'right',
                fontWeight: 500
              }}
            >
              {currency}
            </Typography> */}
          </InputAdornment>
        ),
      }}
      helperText={getHelperText()}
    />
  );
};

export default MoneyInput;
