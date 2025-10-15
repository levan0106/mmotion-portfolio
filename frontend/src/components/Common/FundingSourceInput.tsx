import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  InputAdornment,
  Typography,
  Box,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

interface FundingSourceInputProps {
  value: string;
  onChange: (value: string) => void;
  existingSources: string[];
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  disabled?: boolean;
  allowNew?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'outlined' | 'filled' | 'standard';
  onBlur?: () => void;
  onFocus?: () => void;
  onCreateNew?: (source: string) => void;
}

const FundingSourceInput: React.FC<FundingSourceInputProps> = ({
  value,
  onChange,
  existingSources = [],
  label,
  placeholder,
  helperText,
  error = false,
  required = false,
  disabled = false,
  allowNew = true,
  size = 'medium',
  fullWidth = true,
  margin = 'normal',
  variant = 'outlined',
  onBlur,
  onFocus,
  onCreateNew: _onCreateNew,
}) => {
  const { t } = useTranslation();
  const [isNewSource, setIsNewSource] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredSources, setFilteredSources] = useState<string[]>([]);

  // Filter sources based on current value
  useEffect(() => {
    if (!value) {
      setFilteredSources(existingSources);
    } else {
      const filtered = existingSources.filter(source =>
        source.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSources(filtered);
    }
  }, [value, existingSources]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toUpperCase();
    setShowDropdown(true);
    
    if (isNewSource) {
      onChange(inputValue);
    } else {
      onChange(inputValue);
      // Check if it matches an existing source
      if (existingSources.includes(inputValue)) {
        setIsNewSource(false);
        setShowDropdown(false);
      }
    }
  };

  const handleFocus = () => {
    setShowDropdown(true);
    onFocus?.();
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow clicks
    setTimeout(() => setShowDropdown(false), 200);
    onBlur?.();
  };

  const handleSourceSelect = (source: string) => {
    onChange(source);
    setIsNewSource(false);
    setShowDropdown(false);
  };

  const handleCreateNew = () => {
    setIsNewSource(true);
    onChange('');
    setShowDropdown(false);
  };

  const handleToggleMode = () => {
    if (isNewSource) {
      setIsNewSource(false);
      onChange('');
    } else {
      setIsNewSource(true);
      onChange('');
    }
    setShowDropdown(false);
  };

  const getHelperText = () => {
    if (helperText) return helperText;
    if (isNewSource) return t('fundingSource.enterNew');
    return t('fundingSource.typeToSearch');
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        fullWidth={fullWidth}
        label={label || t('fundingSource.label')}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        margin={margin}
        required={required}
        disabled={disabled}
        error={error}
        variant={variant}
        size={size}
        placeholder={placeholder || t('fundingSource.placeholder')}
        inputProps={{
          style: { textTransform: 'uppercase' }
        }}
        InputProps={{
          endAdornment: allowNew && (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                onClick={handleToggleMode}
                size="small"
                disabled={disabled}
              >
                {isNewSource ? <CancelIcon fontSize="small" /> : <AddIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        helperText={getHelperText()}
      />
      
      {/* Dropdown for existing sources */}
      {!isNewSource && showDropdown && filteredSources.length > 0 && (
        <Paper 
          sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            maxHeight: 200,
            overflow: 'auto',
            mt: 0.5,
            boxShadow: 2
          }}
        >
          {filteredSources.map((source) => (
            <Box
              key={source}
              sx={{
                p: 1.5,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
              onClick={() => handleSourceSelect(source)}
            >
              <Typography variant="body2">{source}</Typography>
            </Box>
          ))}
          
          {/* Add new source option */}
          {allowNew && (
            <Box
              sx={{
                p: 1.5,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'primary.light',
              }}
              onClick={handleCreateNew}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {t('fundingSource.enterNewSource')}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FundingSourceInput;
