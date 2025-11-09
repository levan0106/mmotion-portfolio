import React from 'react';
import { FormControl, FormControlProps, Select, SelectProps, MenuItem, MenuItemProps } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface ResponsiveFormControlProps extends Omit<FormControlProps, 'size'> {
  compact?: boolean;
  size?: 'small' | 'medium';
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

interface ResponsiveSelectProps extends Omit<SelectProps, 'size'> {
  compact?: boolean;
  size?: 'small' | 'medium';
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

interface ResponsiveMenuItemProps extends Omit<MenuItemProps, 'sx'> {
  compact?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Responsive FormControl component with consistent styling
 */
export const ResponsiveFormControl: React.FC<ResponsiveFormControlProps> = ({
  compact = false,
  size = 'small',
  children,
  sx = {},
  ...props
}) => {
  return (
    <FormControl
      size={size}
      sx={{
        minWidth: compact ? 60 : 70,
        ...sx,
      }}
      {...props}
    >
      {children}
    </FormControl>
  );
};

/**
 * Responsive Select component with consistent styling
 */
export const ResponsiveSelect: React.FC<ResponsiveSelectProps> = ({
  compact = false,
  size = 'small',
  options,
  placeholder,
  sx = {},
  ...props
}) => {
  return (
    <Select
      size={size}
      displayEmpty
      sx={{
        fontSize: compact ? '0.6rem!important' : '0.8rem!important',
        height: compact ? '28px' : '32px',
        '& .MuiSelect-select': {
          py: compact ? 0.3 : 0.5,
          px: compact ? 0.8 : 1,
        },
        ...sx,
      }}
      {...props}
    >
      {placeholder && (
        <ResponsiveMenuItem value="" disabled compact={compact}>
          {placeholder}
        </ResponsiveMenuItem>
      )}
      {options.map((option) => (
        <ResponsiveMenuItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          compact={compact}
        >
          {option.label}
        </ResponsiveMenuItem>
      ))}
    </Select>
  );
};

/**
 * Responsive MenuItem component with consistent styling
 */
export const ResponsiveMenuItem: React.FC<ResponsiveMenuItemProps> = ({
  compact = false,
  sx = {},
  children,
  ...props
}) => {
  return (
    <MenuItem
      sx={{
        fontSize: compact ? '0.6rem!important' : '0.8rem!important',
        ...sx,
      }}
      {...props}
    >
      {children}
    </MenuItem>
  );
};

/**
 * Combined Responsive FormControl with Select for common use cases
 */
export const ResponsiveFormSelect: React.FC<{
  compact?: boolean;
  size?: 'small' | 'medium';
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  sx?: SxProps<Theme>;
  formControlSx?: SxProps<Theme>;
  selectSx?: SxProps<Theme>;
}> = ({
  compact = false,
  size = 'small',
  options,
  placeholder,
  value,
  onChange,
  sx = {},
  formControlSx = {},
  selectSx = {},
}) => {
  return (
    <ResponsiveFormControl
      compact={compact}
      size={size}
      sx={formControlSx}
    >
      <ResponsiveSelect
        compact={compact}
        size={size}
        options={options}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value as string | number)}
        sx={{ ...sx, ...selectSx } as SxProps<Theme>}
      />
    </ResponsiveFormControl>
  );
};

export default ResponsiveFormControl;
