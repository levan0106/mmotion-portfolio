import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  Numbers as NumbersIcon,
} from '@mui/icons-material';

interface NumberInputProps {
  value: number | string | null | undefined;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  decimalPlaces?: number;
  showThousandsSeparator?: boolean;
  align?: 'left' | 'right' | 'center';
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'outlined' | 'filled' | 'standard';
  onBlur?: () => void;
  onFocus?: () => void;
  prefix?: string;
  suffix?: string;
  showIcon?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  label = 'Number',
  placeholder = 'Enter number',
  helperText,
  error = false,
  required = false,
  disabled = false,
  min,
  max,
  step = 1,
  decimalPlaces = 0,
  showThousandsSeparator = true,
  align = 'right',
  size = 'medium',
  fullWidth = true,
  margin = 'none',
  variant = 'outlined',
  onBlur,
  onFocus,
  prefix = '',
  suffix = '',
  showIcon = true,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format number with thousands separator and decimal places
  const formatNumber = (num: number): string => {
    // Convert to number if it's a string
    const numericValue = typeof num === 'string' ? parseFloat(num) : num;
    
    if (numericValue === null || numericValue === undefined || isNaN(numericValue)) return '';
    if (numericValue === 0) return '';
    
    let formatted = numericValue.toFixed(decimalPlaces);
    
    if (showThousandsSeparator && decimalPlaces === 0) {
      // Add thousands separator for integers
      formatted = numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } else if (showThousandsSeparator && decimalPlaces > 0) {
      // Add thousands separator for decimals
      formatted = numericValue.toLocaleString('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      });
    }
    
    return formatted;
  };

  // Update display value when value prop changes (only when not focused)
  useEffect(() => {
    if (!isFocused) {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      if (numericValue !== null && numericValue !== undefined && !isNaN(numericValue) && numericValue !== 0) {
        setDisplayValue(formatNumber(numericValue));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, decimalPlaces, showThousandsSeparator, isFocused]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // If input is empty, allow clearing
    if (inputValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    
    // Remove formatting characters and parse the number
    let rawValue = inputValue.replace(/[^\d.-]/g, '');
    
    // Handle negative numbers
    if (rawValue.startsWith('-')) {
      rawValue = '-' + rawValue.substring(1).replace(/[^\d.]/g, '');
    } else {
      rawValue = rawValue.replace(/[^\d.]/g, '');
    }
    
    // Remove trailing zeros but keep decimal point if user is typing
    if (rawValue.includes('.')) {
      // Only remove trailing zeros, not the decimal point
      rawValue = rawValue.replace(/0+$/, '');
      // Don't remove the decimal point as user might be typing
    }
    
    const numericValue = parseFloat(rawValue) || 0;
    
    // Apply min/max constraints
    let constrainedValue = numericValue;
    if (min !== undefined && numericValue < min) {
      constrainedValue = min;
    }
    if (max !== undefined && numericValue > max) {
      constrainedValue = max;
    }
    
    // When focused, don't round to preserve user input
    // When not focused, round to specified decimal places
    let finalValue = constrainedValue;
    if (!isFocused) {
      finalValue = Math.round(constrainedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    }
    
    // Update the numeric value
    onChange(finalValue);
    
    // When focused, show raw value for easy editing
    // When not focused, show formatted value
    if (isFocused) {
      setDisplayValue(rawValue);
    } else {
      if (finalValue !== 0) {
        setDisplayValue(formatNumber(finalValue));
      } else {
        setDisplayValue('');
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // When focusing, show raw value for easy editing
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numericValue !== null && numericValue !== undefined && !isNaN(numericValue) && numericValue !== 0) {
      setDisplayValue(numericValue.toString());
    } else {
      setDisplayValue('');
    }
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // When blurring, format the value
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numericValue !== null && numericValue !== undefined && !isNaN(numericValue) && numericValue !== 0) {
      setDisplayValue(formatNumber(numericValue));
    } else {
      setDisplayValue('');
    }
    onBlur?.();
  };

  const getHelperText = () => {
    if (helperText) return helperText;
    return undefined;
  };

  const getInputProps = () => {
    const props: any = {
      style: { textAlign: align }
    };
    
    if (min !== undefined) props.min = min;
    if (max !== undefined) props.max = max;
    if (step !== undefined) props.step = step;
    
    return props;
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
      inputProps={getInputProps()}
      InputProps={{
        startAdornment: showIcon ? (
          <InputAdornment position="start">
            <NumbersIcon color="action" />
          </InputAdornment>
        ) : prefix ? (
          <InputAdornment position="start">
            <Typography variant="body2" color="text.secondary">
              {prefix}
            </Typography>
          </InputAdornment>
        ) : undefined,
        endAdornment: suffix ? (
          <InputAdornment position="end">
            <Typography variant="body2" color="text.secondary">
              {suffix}
            </Typography>
          </InputAdornment>
        ) : undefined,
      }}
      helperText={getHelperText()}
    />
  );
};

export default NumberInput;
