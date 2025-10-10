import React, { useState, useEffect } from 'react';
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
  Grid,
  Box,
  CircularProgress,
  Typography,
  Chip,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Types
interface GlobalAssetFormData {
  symbol: string;
  name: string;
  type: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  description?: string;
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
    .matches(/^[A-Z0-9.-]+$/, 'Symbol must contain only uppercase letters, numbers, dots, and hyphens'),
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  type: yup
    .string()
    .required('Asset type is required')
    .oneOf(['STOCK', 'BOND', 'CRYPTO', 'COMMODITY', 'CURRENCY', 'ETF', 'MUTUAL_FUND'], 'Invalid asset type'),
  nation: yup
    .string()
    .required('Nation is required'),
  marketCode: yup
    .string()
    .required('Market code is required'),
  currency: yup
    .string()
    .required('Currency is required'),
  timezone: yup
    .string()
    .required('Timezone is required'),
  description: yup
    .string()
    .max(500, 'Description must be at most 500 characters'),
});

// Asset types
const ASSET_TYPES = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'BOND', label: 'Bond' },
  { value: 'CRYPTO', label: 'Cryptocurrency' },
  { value: 'COMMODITY', label: 'Commodity' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'ETF', label: 'ETF' },
  { value: 'MUTUAL_FUND', label: 'Mutual Fund' },
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
      STOCK: '^[A-Z]{3,4}$',
      BOND: '^[A-Z]{2,4}[0-9]{2,4}$',
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
      STOCK: '^[A-Z]{1,5}$',
      BOND: '^[A-Z]{2,4}[0-9]{2,4}$',
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
      STOCK: '^[A-Z]{2,4}$',
      BOND: '^[A-Z]{2,4}[0-9]{2,4}$',
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
  const [selectedNation, setSelectedNation] = useState<string>('');
  const [availableMarketCodes, setAvailableMarketCodes] = useState<Array<{ code: string; name: string }>>([]);
  const [symbolValidation, setSymbolValidation] = useState<{ isValid: boolean; message: string }>({ isValid: true, message: '' });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<GlobalAssetFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      symbol: '',
      name: '',
      type: 'STOCK',
      nation: '',
      marketCode: '',
      currency: '',
      timezone: '',
      description: '',
      ...initialData,
    },
  });

  const watchedNation = watch('nation');
  const watchedType = watch('type');
  const watchedSymbol = watch('symbol');

  // Update market codes when nation changes
  useEffect(() => {
    if (watchedNation) {
      const nationConfig = NATION_CONFIG.find(n => n.code === watchedNation);
      if (nationConfig) {
        setAvailableMarketCodes(nationConfig.marketCodes);
        setValue('currency', nationConfig.currency);
        setValue('timezone', nationConfig.timezone);
        setSelectedNation(watchedNation);
      }
    }
  }, [watchedNation, setValue]);

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
      }
    }
  }, [watchedSymbol, watchedNation, watchedType]);

  const handleClose = () => {
    reset();
    setSelectedNation('');
    setAvailableMarketCodes([]);
    setSymbolValidation({ isValid: true, message: '' });
    onClose();
  };

  const handleFormSubmit = async (data: GlobalAssetFormData) => {
    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getNationDisplayName = (code: string) => {
    const nation = NATION_CONFIG.find(n => n.code === code);
    return nation ? `${nation.name} (${code})` : code;
  };

  const getMarketCodeDisplayName = (code: string) => {
    const market = availableMarketCodes.find(m => m.code === code);
    return market ? `${market.name} (${code})` : code;
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

              {/* Nation */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="nation"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.nation}>
                      <InputLabel>Nation</InputLabel>
                      <Select {...field} label="Nation">
                        {NATION_CONFIG.map((nation) => (
                          <MenuItem key={nation.code} value={nation.code}>
                            {getNationDisplayName(nation.code)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.nation && (
                        <Typography variant="caption" color="error">
                          {errors.nation.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Market Code */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="marketCode"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.marketCode} disabled={!watchedNation}>
                      <InputLabel>Market Code</InputLabel>
                      <Select {...field} label="Market Code">
                        {availableMarketCodes.map((market) => (
                          <MenuItem key={market.code} value={market.code}>
                            {getMarketCodeDisplayName(market.code)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.marketCode && (
                        <Typography variant="caption" color="error">
                          {errors.marketCode.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Currency */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Currency"
                      fullWidth
                      error={!!errors.currency}
                      helperText={errors.currency?.message}
                      disabled
                    />
                  )}
                />
              </Grid>

              {/* Timezone */}
              <Grid item xs={12} sm={6}>
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Timezone"
                      fullWidth
                      error={!!errors.timezone}
                      helperText={errors.timezone?.message}
                      disabled
                    />
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
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                      placeholder="Optional description of the asset"
                    />
                  )}
                />
              </Grid>

              {/* Nation Info Display */}
              {selectedNation && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Nation Configuration
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Currency: ${watch('currency')}`} size="small" />
                      <Chip label={`Timezone: ${watch('timezone')}`} size="small" />
                      <Chip label={`Markets: ${availableMarketCodes.length}`} size="small" />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isDirty || !symbolValidation.isValid}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Asset' : 'Update Asset'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default GlobalAssetForm;
