import React, { useState, useEffect, useRef } from 'react';
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with thousands separator and decimal places
  const formatNumber = (num: number): string => {
    // Convert to number if it's a string
    const numericValue = typeof num === 'string' ? parseFloat(num) : num;
    
    if (numericValue === null || numericValue === undefined || isNaN(numericValue)) return '';
    if (numericValue === 0) return '0';
    
    let formatted;
    
    if (showThousandsSeparator) {
      // Add thousands separator with flexible decimal places
      formatted = numericValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalPlaces
      });
    } else {
      // No thousands separator, but still respect max decimal places
      formatted = numericValue.toFixed(Math.min(decimalPlaces, 10)); // Cap at 10 to avoid issues
    }
    
    return formatted;
  };

  // Update display value when value prop changes (only when not focused)
  useEffect(() => {
    if (!isFocused) {
      const numericValue = typeof value === 'string' ? parseFloat(value) : value;
      if (numericValue !== null && numericValue !== undefined && !isNaN(numericValue)) {
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
    
    // Validate decimal places - don't allow more than decimalPlaces
    if (rawValue.includes('.')) {
      const parts = rawValue.split('.');
      if (parts[1] && parts[1].length > decimalPlaces) {
        // Truncate to max decimal places
        rawValue = parts[0] + '.' + parts[1].substring(0, decimalPlaces);
      }
    }
    
    // Don't remove trailing zeros - preserve user input exactly
    // User might be typing "1.00" and we should show "1.00"
    
    const numericValue = parseFloat(rawValue) || 0;
    
    // Apply min/max constraints
    let constrainedValue = numericValue;
    if (min !== undefined && numericValue < min) {
      constrainedValue = min;
    }
    if (max !== undefined && numericValue > max) {
      constrainedValue = max;
    }
    
    // Only call onChange when not focused to avoid losing focus during typing
    if (!isFocused) {
      onChange(constrainedValue);
    }
    
    // When focused, show exactly what user typed
    // When not focused, show formatted value
    if (isFocused) {
      setDisplayValue(rawValue);
    } else {
      setDisplayValue(formatNumber(constrainedValue));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // When focusing, show raw value for easy editing
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numericValue !== null && numericValue !== undefined && !isNaN(numericValue)) {
      setDisplayValue(numericValue.toString());
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
    const currentValue = parseFloat(displayValue);
    
    // If displayValue is empty, don't change the value
    if (displayValue.trim() === '') {
      return;
    }
    
    // If displayValue is invalid, don't change the value
    if (isNaN(currentValue)) {
      return;
    }
    
    // Apply min/max constraints only if user entered a valid number
    let constrainedValue = currentValue;
    
    // Only apply min constraint if user entered a positive number that's too small
    // Allow 0 to remain as 0 (don't force it to min value)
    if (min !== undefined && currentValue > 0 && currentValue < min) {
      constrainedValue = min;
    }
    
    // Apply max constraint normally
    if (max !== undefined && currentValue > max) {
      constrainedValue = max;
    }
    
    // Only call onChange if the value actually changed to prevent unnecessary re-renders
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (constrainedValue !== numericValue) {
      onChange(constrainedValue);
    }
    
    // When blurring, format the value but preserve decimal places
    if (constrainedValue !== null && constrainedValue !== undefined && !isNaN(constrainedValue)) {
      setDisplayValue(formatNumber(constrainedValue));
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
