import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ResponsiveButton } from './Common';
import { useAccount } from '../contexts/AccountContext';

// Types
interface GlobalAssetFormData {
  symbol: string;
  name: string;
  type: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  description?: string | null;
  createdBy?: string | null;
  priceMode: string;
  isActive: boolean;
}

interface NationConfig {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  marketCodes: Array<{
    code: string;
    name: string;
  }>;
  defaultPriceSource: string;
  assetTypePatterns: Record<string, string>;
  tradingHours: {
    timezone: string;
    days: Array<{
      day: string;
      open: string;
      close: string;
    }>;
  };
}

interface GlobalAssetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GlobalAssetFormData) => Promise<void>;
  initialData?: Partial<GlobalAssetFormData>;
  mode: 'create' | 'edit';
  loading?: boolean;
}

// Validation schema
const validationSchema = yup.object({
  symbol: yup
    .string()
    .required('Symbol is required')
    .min(1, 'Symbol must be at least 1 character')
    .max(20, 'Symbol must be at most 20 characters')
    .matches(/^[A-Z0-9-]+$/, 'Symbol must contain only uppercase letters, numbers, and hyphens'),
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  type: yup
    .string()
    .required('Asset type is required')
    .oneOf(['STOCK', 'BOND', 'CRYPTO', 'COMMODITY', 'GOLD', 'REALESTATE', 'OTHER'], 'Invalid asset type'),
  // Hidden fields - set default values
  nation: yup.string().default('VN'),
  marketCode: yup.string().default('HOSE'),
  currency: yup.string().default('VND'),
  timezone: yup.string().default('Asia/Ho_Chi_Minh'),
  createdBy: yup.string().nullable().optional(),
  priceMode: yup
    .string()
    .required('Price mode is required')
    .oneOf(['AUTOMATIC', 'MANUAL'], 'Invalid price mode'),
  isActive: yup.boolean().required('Status is required'),
  description: yup
    .string()
    .nullable()
    .max(500, 'Description must be at most 500 characters'),
});

// Asset types
const ASSET_TYPES = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'BOND', label: 'Bond' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'COMMODITY', label: 'Commodity' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'REALESTATE', label: 'Real Estate' },
  { value: 'OTHER', label: 'Other' }
];

// Price modes
const PRICE_MODES = [
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
];

// Mock nation configuration (in real app, this would come from API)
const NATION_CONFIG: NationConfig[] = [
  {
    code: 'VN',
    name: 'Vietnam',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    marketCodes: [
      { code: 'HOSE', name: 'Ho Chi Minh Stock Exchange' },
      { code: 'HNX', name: 'Hanoi Stock Exchange' },
      { code: 'UPCOM', name: 'Unlisted Public Company Market' },
    ],
    defaultPriceSource: 'EXTERNAL_API',
    assetTypePatterns: {
      STOCK: '^[A-Z0-9-]+$',
      BOND: '^[A-Z0-9-]+$',
      CRYPTO: '^[A-Z0-9-]+$',
      COMMODITY: '^[A-Z0-9-]+$',
      GOLD: '^[A-Z0-9-]+$',
      REALESTATE: '^[A-Z0-9-]+$',
      OTHER: '^[A-Z0-9-]+$',
    },
    tradingHours: {
      timezone: 'Asia/Ho_Chi_Minh',
      days: [
        { day: 'Monday', open: '09:00', close: '15:00' },
        { day: 'Tuesday', open: '09:00', close: '15:00' },
        { day: 'Wednesday', open: '09:00', close: '15:00' },
        { day: 'Thursday', open: '09:00', close: '15:00' },
        { day: 'Friday', open: '09:00', close: '15:00' },
      ],
    },
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    timezone: 'America/New_York',
    marketCodes: [
      { code: 'NYSE', name: 'New York Stock Exchange' },
      { code: 'NASDAQ', name: 'NASDAQ' },
      { code: 'AMEX', name: 'American Stock Exchange' },
    ],
    defaultPriceSource: 'EXTERNAL_API',
    assetTypePatterns: {
      STOCK: '^[A-Z0-9-]+$',
      BOND: '^[A-Z0-9-]+$',
      CRYPTO: '^[A-Z0-9-]+$',
      COMMODITY: '^[A-Z0-9-]+$',
      GOLD: '^[A-Z0-9-]+$',
      REALESTATE: '^[A-Z0-9-]+$',
      OTHER: '^[A-Z0-9-]+$',
    },
    tradingHours: {
      timezone: 'America/New_York',
      days: [
        { day: 'Monday', open: '09:30', close: '16:00' },
        { day: 'Tuesday', open: '09:30', close: '16:00' },
        { day: 'Wednesday', open: '09:30', close: '16:00' },
        { day: 'Thursday', open: '09:30', close: '16:00' },
        { day: 'Friday', open: '09:30', close: '16:00' },
      ],
    },
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    currency: 'GBP',
    timezone: 'Europe/London',
    marketCodes: [
      { code: 'LSE', name: 'London Stock Exchange' },
      { code: 'AIM', name: 'Alternative Investment Market' },
    ],
    defaultPriceSource: 'EXTERNAL_API',
    assetTypePatterns: {
      STOCK: '^[A-Z0-9-]+$',
      BOND: '^[A-Z0-9-]+$',
      CRYPTO: '^[A-Z0-9-]+$',
      COMMODITY: '^[A-Z0-9-]+$',
      GOLD: '^[A-Z0-9-]+$',
      REALESTATE: '^[A-Z0-9-]+$',
      OTHER: '^[A-Z0-9-]+$',
    },
    tradingHours: {
      timezone: 'Europe/London',
      days: [
        { day: 'Monday', open: '08:00', close: '16:30' },
        { day: 'Tuesday', open: '08:00', close: '16:30' },
        { day: 'Wednesday', open: '08:00', close: '16:30' },
        { day: 'Thursday', open: '08:00', close: '16:30' },
        { day: 'Friday', open: '08:00', close: '16:30' },
      ],
    },
  },
];

const GlobalAssetForm: React.FC<GlobalAssetFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
}) => {
  const { accountId } = useAccount();
  const [symbolValidation, setSymbolValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GlobalAssetFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      symbol: '',
      name: '',
      type: 'STOCK',
      nation: 'VN', // Default to Vietnam
      marketCode: 'HOSE', // Default to Ho Chi Minh Stock Exchange
      currency: 'VND', // Default to Vietnamese Dong
      timezone: 'Asia/Ho_Chi_Minh', // Default to Vietnam timezone
      description: '',
      createdBy: mode === 'create' ? accountId : '', // Set current accountId for create mode
      priceMode: 'AUTOMATIC', // Default to automatic pricing
      isActive: true, // Default to active
      ...initialData,
    },
  });

  const watchedNation = watch('nation');
  const watchedType = watch('type');
  const watchedSymbol = watch('symbol');

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        symbol: initialData.symbol || '',
        name: initialData.name || '',
        type: initialData.type || 'STOCK',
        nation: initialData.nation || 'VN',
        marketCode: initialData.marketCode || 'HOSE',
        currency: initialData.currency || 'VND',
        timezone: initialData.timezone || 'Asia/Ho_Chi_Minh',
        description: initialData.description || '',
        createdBy: initialData.createdBy || '',
        priceMode: initialData.priceMode || 'AUTOMATIC',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
      
      // Update market codes state for edit mode - removed since fields are hidden
      // if (initialData.nation) {
      //   const nationConfig = NATION_CONFIG.find(n => n.code === initialData.nation);
      //   if (nationConfig) {
      //     setAvailableMarketCodes(nationConfig.marketCodes);
      //   }
      // }
    }
  }, [initialData, mode, reset]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Reset form to default values when modal opens
      reset({
        symbol: '',
        name: '',
        type: 'STOCK',
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        description: '',
        createdBy: mode === 'create' ? accountId : '',
        priceMode: 'AUTOMATIC',
        isActive: true,
        ...initialData,
      });
      
      // Reset symbol validation
      setSymbolValidation({ isValid: true, message: '' });
    }
  }, [open, mode, accountId, initialData, reset]);

  // Set current accountId for create mode
  useEffect(() => {
    if (mode === 'create' && accountId) {
      setValue('createdBy', accountId);
    }
  }, [mode, accountId, setValue]);

  // Update market codes when nation changes - removed since fields are hidden
  // useEffect(() => {
  //   if (watchedNation) {
  //     const nationConfig = NATION_CONFIG.find(n => n.code === watchedNation);
  //     if (nationConfig) {
  //       setAvailableMarketCodes(nationConfig.marketCodes);
  //       setValue('currency', nationConfig.currency);
  //       setValue('timezone', nationConfig.timezone);
  //     }
  //   }
  // }, [watchedNation, setValue]);

  // Validate symbol format based on nation and type
  useEffect(() => {
    if (watchedSymbol && watchedNation && watchedType) {
      const nationConfig = NATION_CONFIG.find(n => n.code === watchedNation);
      if (nationConfig && nationConfig.assetTypePatterns[watchedType]) {
        const pattern = new RegExp(nationConfig.assetTypePatterns[watchedType]);
        const isValid = pattern.test(watchedSymbol);
        setSymbolValidation({
          isValid,
          message: isValid ? '' : `Symbol format is invalid for ${watchedType} in ${nationConfig.name}`,
        });
      } else {
        // For asset types without specific patterns (REALESTATE, CRYPTO, etc.), always consider valid
        setSymbolValidation({ isValid: true, message: '' });
      }
    }
  }, [watchedSymbol, watchedNation, watchedType]);

  const handleClose = () => {
    reset();
    setSymbolValidation({ isValid: true, message: '' });
    onClose();
  };

  const handleFormSubmit = async (data: GlobalAssetFormData) => {
    try {
      // Clean up data before submission
      const cleanedData: any = {
        symbol: data.symbol,
        name: data.name,
        type: data.type,
        nation: data.nation,
        marketCode: data.marketCode,
        currency: data.currency,
        timezone: data.timezone,
        priceMode: data.priceMode,
        isActive: data.isActive,
        createdBy: data.createdBy,
      };
      
      // Include description if it exists (can be empty string or null)
      if (data.description !== undefined && data.description !== null) {
        cleanedData.description = data.description.trim() || null;
      }
      
      await onSubmit(cleanedData);
      handleClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            {mode === 'create' ? 'Create New Global Asset' : 'Edit Global Asset'}
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Grid container spacing={3}>
              {/* Symbol */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="symbol"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Symbol"
                      fullWidth
                      error={!!errors.symbol || !symbolValidation.isValid}
                      helperText={errors.symbol?.message || symbolValidation.message}
                      placeholder="e.g., AAPL, HPG"
                      disabled={mode === 'edit'}
                      onChange={(e) => {
                        // Ensure symbol is always uppercase
                        const uppercaseValue = e.target.value.toUpperCase();
                        field.onChange(uppercaseValue);
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Name */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Asset Name"
                      fullWidth
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      placeholder="e.g., Apple Inc., Hoa Phat Group"
                    />
                  )}
                />
              </Grid>

              {/* Type */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <InputLabel>Asset Type</InputLabel>
                      <Select {...field} label="Asset Type">
                        {ASSET_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.type && (
                        <Typography variant="caption" color="error">
                          {errors.type.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Created By - Read Only */}
              {(mode === 'edit') || (mode === 'create' && accountId) ? (
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="createdBy"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value || ''}
                        label="Created By (Account ID)"
                        fullWidth
                        disabled
                        helperText={
                          mode === 'create' 
                            ? "Account ID of the current user who will create this asset"
                            : "Account ID of the user who created this asset"
                        }
                        sx={{
                          '& .MuiInputBase-input.Mui-disabled': {
                            color: 'text.secondary',
                            WebkitTextFillColor: 'unset',
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              ) : null}

              {/* Price Mode */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="priceMode"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.priceMode}>
                      <InputLabel>Price Mode</InputLabel>
                      <Select {...field} label="Price Mode">
                        {PRICE_MODES.map((mode) => (
                          <MenuItem key={mode.value} value={mode.value}>
                            {mode.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.priceMode && (
                        <Typography variant="caption" color="error">
                          {errors.priceMode.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Status (Active/Inactive) */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.isActive}>
                      <InputLabel>Status</InputLabel>
                      <Select 
                        {...field} 
                        label="Status"
                        value={field.value ? 'true' : 'false'}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                      >
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                      </Select>
                      {errors.isActive && (
                        <Typography variant="caption" color="error">
                          {errors.isActive.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value || ''}
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      placeholder="Optional description of the asset"
                    />
                  )}
                />
              </Grid>

            </Grid>
          </DialogContent>

          <DialogActions>
            <ResponsiveButton onClick={handleClose} disabled={loading} mobileText="Cancel" desktopText="Cancel">
              Cancel
            </ResponsiveButton>
            <ResponsiveButton
              type="submit"
              variant="contained"
              disabled={loading || !symbolValidation.isValid}
              icon={loading ? <CircularProgress size={20} /> : undefined}
              mobileText={loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              desktopText={loading ? 'Saving...' : mode === 'create' ? 'Create Asset' : 'Update Asset'}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Asset' : 'Update Asset'}
            </ResponsiveButton>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default GlobalAssetForm;
