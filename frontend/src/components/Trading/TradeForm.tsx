import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../hooks/useAccount';
import { TradeSide, TradeType, TradeSource, TradeFormData } from '../../types';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { AssetAutocomplete } from '../Common/AssetAutocomplete';

// Re-export TradeFormData for components that need it
export type { TradeFormData };
import { formatCurrency, CURRENCY_SYMBOLS, formatNumber } from '../../utils/format';

// Validation schema
const tradeSchema = yup.object({
  portfolioId: yup.string().uuid('Invalid portfolio ID').required('Portfolio is required'),
  assetId: yup.string().uuid('Invalid asset ID').required('Asset is required'),
  tradeDate: yup.string().required('Trade date is required'),
  side: yup.mixed<TradeSide>().oneOf(Object.values(TradeSide)).required('Trade side is required'),
  quantity: yup
    .number()
    .positive('Quantity must be positive')
    .min(0.01, 'Quantity must be at least 0.01')
    .required('Quantity is required'),
  price: yup
    .number()
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01')
    .required('Price is required'),
  fee: yup.number().min(0, 'Fee cannot be negative').optional(),
  tax: yup.number().min(0, 'Tax cannot be negative').optional(),
  tradeType: yup.mixed<TradeType>().oneOf(Object.values(TradeType)).optional(),
  source: yup.mixed<TradeSource>().oneOf(Object.values(TradeSource)).optional(),
  exchange: yup.string().max(100, 'Exchange cannot exceed 100 characters').optional(),
  fundingSource: yup.string().max(100, 'Funding source cannot exceed 100 characters').optional(),
  notes: yup.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});


export interface TradeFormProps {
  onSubmit: (data: TradeFormData) => Promise<void>;
  initialData?: Partial<TradeFormData>;
  isLoading?: boolean;
  error?: string;
  mode?: 'create' | 'edit';
  defaultPortfolioId?: string;
  showSubmitButton?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

/**
 * TradeForm component for creating and editing trades.
 * Provides a comprehensive form with validation and real-time calculations.
 */
// Custom Number TextField component with formatting
const FormattedNumberField: React.FC<{
  field: any;
  label: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  inputProps?: any;
  currency?: string;
}> = ({ field, label, error, helperText, disabled, inputProps, currency }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format number for display
  const formatDisplayValue = (value: number | string) => {
    if (!value || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';
    return formatNumber(numValue, currency === 'VND' ? 0 : 2);
  };

  // Parse display value back to number
  const parseDisplayValue = (value: string) => {
    if (!value || value.trim() === '') return '';
    // Remove thousand separators and parse
    const cleanValue = value.replace(/,/g, '').trim();
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? '' : numValue.toString();
  };

  // Check if input is valid number while typing
  const isValidNumberInput = (value: string) => {
    if (!value) return true; // Allow empty
    const cleanValue = value.replace(/,/g, '').trim();
    // Allow partial numbers like "123.", "123.4", etc.
    return /^\d*\.?\d*$/.test(cleanValue);
  };

  // Update display value when field value changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplayValue(field.value));
    }
  }, [field.value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show clean raw value when focused for easier editing
    let rawValue = field.value?.toString() || '';
    
    // Clean up trailing zeros and decimal point if not needed
    if (rawValue.includes('.')) {
      // Remove trailing zeros
      rawValue = rawValue.replace(/\.?0+$/, '');
      // If only decimal point left, remove it
      if (rawValue.endsWith('.')) {
        rawValue = rawValue.slice(0, -1);
      }
    }
    
    setDisplayValue(rawValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Parse current display value and update field
    const parsedValue = parseDisplayValue(displayValue);
    if (parsedValue) {
      field.onChange(parseFloat(parsedValue));
    } else {
      field.onChange('');
    }
    // Format value for display
    const formatted = formatDisplayValue(field.value);
    setDisplayValue(formatted);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    
    // Only allow valid number input
    if (!isValidNumberInput(rawValue)) {
      return; // Don't update if invalid
    }
    
    setDisplayValue(rawValue);
    
    // Only update form field if it's a complete valid number
    const parsedValue = parseDisplayValue(rawValue);
    if (parsedValue) {
      field.onChange(parseFloat(parsedValue));
    } else if (rawValue === '') {
      field.onChange('');
    }
  };

  return (
    <TextField
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      label={label}
      type="text"
      fullWidth
      error={error}
      helperText={helperText}
      disabled={disabled}
      inputProps={inputProps}
      InputProps={{
        startAdornment: currency ? (
          <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>
            {CURRENCY_SYMBOLS[currency] || currency}
          </Typography>
        ) : undefined,
      }}
    />
  );
};

export const TradeForm: React.FC<TradeFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  error,
  mode = 'create',
  defaultPortfolioId,
  showSubmitButton = true,
  formRef,
}) => {

  const { accountId } = useAccount();
  const { portfolios, isLoading: portfoliosLoading, error: portfoliosError } = usePortfolios(accountId);

  // Debug logging (can be removed in production)
  // console.log('TradeForm Debug:', { accountId, portfolios: portfolios?.length || 0, assets: assets?.length || 0 });
  
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<TradeFormData>({
    resolver: yupResolver(tradeSchema),
    defaultValues: {
      portfolioId: initialData?.portfolioId || defaultPortfolioId || '',
      assetId: initialData?.assetId || '',
      tradeDate: initialData?.tradeDate || new Date().toISOString(),
      side: initialData?.side || TradeSide.BUY,
      quantity: initialData?.quantity || 0,
      price: initialData?.price || 0,
      fee: initialData?.fee || 0,
      tax: initialData?.tax || 0,
      tradeType: initialData?.tradeType || TradeType.MARKET,
      source: initialData?.source || TradeSource.MANUAL,
      exchange: initialData?.exchange || '',
      fundingSource: initialData?.fundingSource || '',
      notes: initialData?.notes || '',
    },
  });

  // Form validation state available for debugging if needed

  const watchedQuantity = watch('quantity');
  const watchedPrice = watch('price');
  const watchedFee = watch('fee') || 0;
  const watchedTax = watch('tax') || 0;
  const watchedPortfolioId = watch('portfolioId');
  const watchedAssetId = watch('assetId');
  
  // Get selected portfolio for currency
  const selectedPortfolio = portfolios?.find(p => p.portfolioId === watchedPortfolioId);
  const portfolioCurrency = selectedPortfolio?.baseCurrency || 'VND';

  // Auto-fill market price when asset is selected
  // Note: AssetAutocomplete will handle asset selection, but we need to get current price
  // This will be handled by the refreshMarketPrice function when user clicks refresh button

  // Calculate total value and cost with memoization for better performance
  const calculatedValues = useMemo(() => {
    const quantity = Number(watchedQuantity) || 0;
    const price = Number(watchedPrice) || 0;
    const fee = Number(watchedFee) || 0;
    const tax = Number(watchedTax) || 0;
    
    const value = quantity * price;
    const cost = value + fee + tax;
    
    return { value, cost, fee, tax };
  }, [watchedQuantity, watchedPrice, watchedFee, watchedTax]);



  // Update form values when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setValue('portfolioId', initialData.portfolioId || '');
      setValue('assetId', initialData.assetId || '');
      setValue('tradeDate', initialData.tradeDate || new Date().toISOString());
      setValue('side', initialData.side || TradeSide.BUY);
      setValue('quantity', initialData.quantity || 0);
      setValue('price', initialData.price || 0);
      setValue('fee', initialData.fee || 0);
      setValue('tax', initialData.tax || 0);
      setValue('tradeType', initialData.tradeType || TradeType.MARKET);
      setValue('source', initialData.source || TradeSource.MANUAL);
      setValue('exchange', initialData.exchange || '');
      setValue('fundingSource', initialData.fundingSource || '');
      setValue('notes', initialData.notes || '');
    }
  }, [initialData, mode, setValue]);

  // Force re-render of AssetAutocomplete when assetId changes in edit mode
  const [assetKey, setAssetKey] = useState(0);
  useEffect(() => {
    if (initialData?.assetId && mode === 'edit') {
      // Force re-render of AssetAutocomplete to ensure it picks up the value
      setAssetKey(prev => prev + 1);
    }
  }, [initialData?.assetId, mode]);

  const handleFormSubmit = async (_data: TradeFormData) => {
    try {
      // Get all form values instead of relying on validated data
      const allFormValues = watch();
      
      // Ensure all required fields are present
      const submitData: TradeFormData = {
        portfolioId: allFormValues.portfolioId,
        assetId: allFormValues.assetId,
        tradeDate: typeof allFormValues.tradeDate === 'string' 
          ? allFormValues.tradeDate 
          : (allFormValues.tradeDate as Date).toISOString(),
        side: allFormValues.side,
        quantity: allFormValues.quantity,
        price: allFormValues.price,
        fee: allFormValues.fee || 0,
        tax: allFormValues.tax || 0,
        tradeType: allFormValues.tradeType || TradeType.MARKET,
        source: allFormValues.source || TradeSource.MANUAL,
        exchange: allFormValues.exchange || '',
        fundingSource: allFormValues.fundingSource || '',
        notes: allFormValues.notes || '',
      };
      
      await onSubmit(submitData);
    } catch (err) {
      console.error('Error submitting trade form:', err);
    }
  };

  const getSideColor = (side: TradeSide) => {
    return side === TradeSide.BUY ? 'success' : 'error';
  };

  const getSideIcon = (side: TradeSide) => {
    return side === TradeSide.BUY ? '↗' : '↘';
  };

  // Function to refresh market price
  const refreshMarketPrice = () => {
    // TODO: Implement market price refresh functionality
    // This would typically call an API to get the latest price for the selected asset
    console.log('Refresh market price for asset:', watchedAssetId);
  };

  // Show loading state
  if (portfoliosLoading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <CircularProgress size={20} />
              <Typography variant="h5">Loading trade form...</Typography>
            </Box>
          </CardContent>
        </Card>
      </LocalizationProvider>
    );
  }

  // Show error state if no portfolios or assets available (only if not loading)
  if (!portfolios?.length && !portfoliosLoading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Card>
          <CardContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              No portfolios available. Please create a portfolio first.
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {portfoliosError ? `Error: ${portfoliosError}` : 'No portfolios found. Please check if the backend is running and try again.'}
            </Typography>
          </CardContent>
        </Card>
      </LocalizationProvider>
    );
  }


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          {error}
        </Alert>
      )}

      <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)}>
              {/* Basic Information Section */}
              <Box mb={1.5}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
                  Basic Information
                </Typography>
                <Grid container spacing={1.5}>
                  {/* Portfolio Selection */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="portfolioId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.portfolioId}>
                          <InputLabel>Portfolio *</InputLabel>
                          <Select
                            {...field}
                            label="Portfolio *"
                            disabled={isLoading || portfoliosLoading}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          >
                            {portfoliosLoading ? (
                              <MenuItem disabled>Loading portfolios...</MenuItem>
                            ) : portfolios?.length > 0 ? (
                              portfolios.map((portfolio) => (
                                <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                                  {portfolio.name}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem disabled>No portfolios found</MenuItem>
                            )}
                          </Select>
                          {errors.portfolioId && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              {errors.portfolioId.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {/* Asset Selection */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="assetId"
                      control={control}
                      render={({ field }) => (
                        <AssetAutocomplete
                          key={assetKey}
                          value={field.value}
                          onChange={field.onChange}
                          error={!!errors.assetId}
                          helperText={errors.assetId?.message}
                          disabled={isLoading}
                          label="Asset"
                          required={true}
                          placeholder="Search and select asset..."
                          currency={portfolioCurrency}
                          showCreateOption={true}
                          onCreateAsset={() => {
                            // TODO: Implement create asset functionality
                            console.log('Create new asset clicked');
                          }}
                        />
                      )}
                    />
                    
                  </Grid>

                  {/* Trade Date */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="tradeDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          label="Trade Date *"
                          disabled={isLoading}
                          value={(() => {
                            try {
                              if (!field.value) return new Date();
                              if (typeof field.value === 'string') {
                                const date = new Date(field.value);
                                return isNaN(date.getTime()) ? new Date() : date;
                              }
                              return field.value;
                            } catch {
                              return new Date();
                            }
                          })()}
                          onChange={(newValue) => {
                            try {
                              if (newValue && !isNaN(newValue.getTime())) {
                                field.onChange(newValue.toISOString());
                              } else {
                                field.onChange(new Date().toISOString());
                              }
                            } catch {
                              field.onChange(new Date().toISOString());
                            }
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: !!errors.tradeDate,
                              helperText: errors.tradeDate?.message,
                              sx: {
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2
                                }
                              }
                            },
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Trade Details Section */}
              <Box mb={1.5}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
                  Trade Details
                </Typography>
                <Grid container spacing={1.5}>
                  {/* Trade Side */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="side"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.side}>
                          <InputLabel>Trade Side *</InputLabel>
                          <Select
                            {...field}
                            label="Trade Side *"
                            disabled={isLoading}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                          >
                            <MenuItem value={TradeSide.BUY}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography color="success.main" fontWeight="medium">↗ BUY</Typography>
                              </Box>
                            </MenuItem>
                            <MenuItem value={TradeSide.SELL}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography color="error.main" fontWeight="medium">↘ SELL</Typography>
                              </Box>
                            </MenuItem>
                          </Select>
                          {errors.side && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                              {errors.side.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  {/* Quantity */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="quantity"
                      control={control}
                      render={({ field }) => (
                        <FormattedNumberField
                          field={field}
                          label="Quantity *"
                          error={!!errors.quantity}
                          helperText={errors.quantity?.message}
                          disabled={isLoading}
                          inputProps={{ step: '0.01', min: '0.01' }}
                        />
                      )}
                    />
                  </Grid>

                  {/* Price */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="price"
                      control={control}
                      render={({ field }) => (
                        <Box sx={{ position: 'relative' }}>
                          <FormattedNumberField
                            field={field}
                            label={`Price per Unit (${portfolioCurrency}) *`}
                            error={!!errors.price}
                            helperText={errors.price?.message}
                            disabled={isLoading}
                            inputProps={{ step: '0.01', min: '0.01' }}
                            currency={portfolioCurrency}
                          />
                          {watchedAssetId && (
                            <Tooltip title="Refresh market price">
                              <IconButton
                                size="small"
                                onClick={refreshMarketPrice}
                                disabled={isLoading}
                                sx={{
                                  position: 'absolute',
                                  right: 8,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  zIndex: 1,
                                  bgcolor: 'background.paper',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                }}
                              >
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Additional Information Section */}
              <Box mb={1.5}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
                  Additional Information
                </Typography>
                <Grid container spacing={1.5}>
                  {/* Fee */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="fee"
                      control={control}
                      render={({ field }) => (
                        <FormattedNumberField
                          field={field}
                          label={`Trading Fee (${portfolioCurrency})`}
                          error={!!errors.fee}
                          helperText={errors.fee?.message}
                          disabled={isLoading}
                          inputProps={{ step: '0.01', min: '0' }}
                          currency={portfolioCurrency}
                        />
                      )}
                    />
                  </Grid>

                  {/* Tax */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="tax"
                      control={control}
                      render={({ field }) => (
                        <FormattedNumberField
                          field={field}
                          label={`Tax (${portfolioCurrency})`}
                          error={!!errors.tax}
                          helperText={errors.tax?.message}
                          disabled={isLoading}
                          inputProps={{ step: '0.01', min: '0' }}
                          currency={portfolioCurrency}
                        />
                      )}
                    />
                  </Grid>

                  {/* Trade Type */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="tradeType"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.tradeType}>
                          <InputLabel>Trade Type</InputLabel>
                          <Select
                            {...field}
                            label="Trade Type"
                            disabled={isLoading}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2
                              }
                            }}
                      >
                        <MenuItem value={TradeType.MARKET}>Market Order</MenuItem>
                        <MenuItem value={TradeType.LIMIT}>Limit Order</MenuItem>
                        <MenuItem value={TradeType.STOP}>Stop Order</MenuItem>
                      </Select>
                      {errors.tradeType && (
                        <Typography variant="caption" color="error">
                          {errors.tradeType.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
                  </Grid>
                </Grid>
              </Box>

            {/* Exchange, Funding Source and Notes Section */}
            <Box mb={1.5}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
                Exchange, Funding & Notes
              </Typography>
              <Grid container spacing={1.5}>
                {/* Exchange */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="exchange"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Exchange/Platform"
                        fullWidth
                        error={!!errors.exchange}
                        helperText={errors.exchange?.message || 'e.g., VNDIRECT, BINANCE, COINBASE'}
                        disabled={isLoading}
                        placeholder="Enter exchange or platform name"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                        inputProps={{
                          style: { textTransform: 'uppercase' }
                        }}
                        onChange={(e) => {
                          // Auto UPPERCASE on input
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Funding Source */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="fundingSource"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Funding Source"
                        fullWidth
                        error={!!errors.fundingSource}
                        helperText={errors.fundingSource?.message || 'e.g., VIETCOMBANK, BANK_ACCOUNT_001'}
                        disabled={isLoading}
                        placeholder="Enter funding source"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                        inputProps={{
                          style: { textTransform: 'uppercase' }
                        }}
                        onChange={(e) => {
                          // Auto UPPERCASE on input
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Notes */}
                <Grid item xs={12} md={4}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Notes"
                        multiline
                        rows={3}
                        fullWidth
                        error={!!errors.notes}
                        helperText={errors.notes?.message || 'Optional notes about this trade'}
                        disabled={isLoading}
                        placeholder="Enter any additional notes about this trade"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>


            {/* Summary Section */}
            <Box mb={2} p={1.5} sx={{ bgcolor: 'grey.50', borderRadius: 2, border: 1, borderColor: 'grey.200' }}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
                Trade Summary
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'grey.300' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Value
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {formatCurrency(calculatedValues.value, portfolioCurrency)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'grey.300' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fees & Taxes
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {formatCurrency(calculatedValues.fee + calculatedValues.tax, portfolioCurrency)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'grey.300' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Cost
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(calculatedValues.cost, portfolioCurrency)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'grey.300' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Trade Side
                    </Typography>
                    <Chip
                      label={watch('side')}
                      color={getSideColor(watch('side'))}
                      icon={<span>{getSideIcon(watch('side'))}</span>}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>


            {/* Submit Button */}
            {showSubmitButton && (
              <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isValid || isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
                >
                  {isLoading ? 'Processing...' : mode === 'create' ? 'Create Trade' : 'Update Trade'}
                </Button>
              </Box>
            )}
          </form>
        </LocalizationProvider>
  );
};

export default TradeForm;
