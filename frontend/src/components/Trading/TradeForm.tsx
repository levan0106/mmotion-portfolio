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
  Grid,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ResponsiveButton } from '../Common';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';
import { TradeSide, TradeType, TradeSource, TradeFormData } from '../../types';
import { CreateAssetRequest } from '../../types/asset.types';
import { 
  Refresh as RefreshIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { AssetAutocomplete } from '../Common/AssetAutocomplete';
import { NumberInput, MoneyInput } from '../Common';
import { AssetFormModal } from '../Asset/AssetFormModal';
import { assetService } from '../../services/asset.service';

// Re-export TradeFormData for components that need it
export type { TradeFormData };
import { formatCurrency } from '../../utils/format';
import { 
  getBaseCurrency, 
  getCurrencySymbol, 
  getCurrencyPriorityInfo
} from '../../utils/currency';
import { useCurrencyCache } from '../../hooks/useCurrencyCache';

// Validation schema
const tradeSchema = yup.object({
  portfolioId: yup.string().uuid('Invalid portfolio ID').required('Portfolio is required'),
  assetId: yup.string().uuid('Invalid asset ID').required('Asset is required'),
  tradeDate: yup.string().required('Trade date is required'),
  side: yup.mixed<TradeSide>().oneOf(Object.values(TradeSide)).required('Trade side is required'),
  quantity: yup
    .number()
    .positive('Quantity must be positive')
    .min(0.00001, 'Quantity must be at least 0.00001')
    .required('Quantity is required'),
  price: yup
    .number()
    .min(0, 'Price must be non-negative')
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
  isModal?: boolean;
  onAssetCreated?: (asset: any) => void; // Callback when asset is created
}

/**
 * TradeForm component for creating and editing trades.
 * Provides a comprehensive form with validation and real-time calculations.
 */

export const TradeForm: React.FC<TradeFormProps> = ({
  onSubmit,
  initialData,
  isLoading = false,
  error,
  mode = 'create',
  defaultPortfolioId,
  showSubmitButton = true,
  formRef,
  isModal = false,
  onAssetCreated,
}) => {

  const { accountId, currentAccount } = useAccount();
  const { portfolios, isLoading: portfoliosLoading, error: portfoliosError } = usePortfolios(accountId);

  // Asset creation modal state
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetFormError, setAssetFormError] = useState<string | null>(null);
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);

  
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
  
  // Update currency cache
  useCurrencyCache(currentAccount, null); // userCurrency can be added later
  
  // Get base currency with priority: portfolio -> account (cached) -> user (cached) -> default VND
  const baseCurrency = getBaseCurrency(
    selectedPortfolio,
    'VND' // default currency
  );
  
  // Get currency priority info for debugging/display
  const currencyInfo = getCurrencyPriorityInfo(
    selectedPortfolio,
    'VND'
  );

  // Auto-fill market price when asset is selected
  // Note: AssetAutocomplete will handle asset selection, but we need to get current price
  // This will be handled by the refreshMarketPrice function when user clicks refresh button

  // Calculate total value and cost with memoization for better performance
  const calculatedValues = useMemo(() => {
    const quantity = Number(watchedQuantity) || 0;
    const price = Number(watchedPrice) || 0;
    const fee = Number(watchedFee) || 0;
    const tax = Number(watchedTax) || 0;
    const side = watch('side');
    
    const value = quantity * price;
    
    // Calculate total cost based on trade side
    // SELL: Total Cost = Quantity*Price - Fees - Taxes (amount received)
    // BUY: Total Cost = Quantity*Price + Fees + Taxes (amount paid)
    const cost = side === TradeSide.SELL 
      ? value - fee - tax  // SELL: subtract fees and taxes
      : value + fee + tax; // BUY: add fees and taxes
    
    return { value, cost, fee, tax };
  }, [watchedQuantity, watchedPrice, watchedFee, watchedTax, watch('side')]);

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

  // Asset creation handlers
  const handleCreateAsset = () => {
    setShowAssetForm(true);
    setAssetFormError(null);
  };

  const handleCloseAssetForm = () => {
    setShowAssetForm(false);
    setAssetFormError(null);
    setIsSubmittingAsset(false);
  };

  const handleAssetFormSubmit = async (assetData: CreateAssetRequest) => {
    setIsSubmittingAsset(true);
    setAssetFormError(null);
    
    try {
      // Call the actual API to create asset
      const createdAsset = await assetService.createAsset(assetData, accountId);
      // Notify parent component about the created asset
      if (onAssetCreated) {
        onAssetCreated(createdAsset);
      }
      
      // Close the modal
      handleCloseAssetForm();
      
    } catch (error) {
      console.error('Error creating asset:', error);
      setAssetFormError(error instanceof Error ? error.message : `An error occurred while creating asset. Asset symbol "${assetData.symbol}" maybe duplicated or already exists for this user.`);
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  const getSideColor = (side: TradeSide) => {
    return side === TradeSide.BUY ? 'success' : 'error';
  };

  // Function to refresh market price
  const refreshMarketPrice = () => {
    // TODO: Implement market price refresh functionality
    // This would typically call an API to get the latest price for the selected asset
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
              <Box mb={isModal ? 1 : 1.5} mt={isModal ? 1 : 1.5}>
                <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: isModal ? 1 : 1.5 }}>
                  Basic Information
                </Typography>
                <Grid container spacing={isModal ? 1 : 1.5}>
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
                          disabled={isLoading}
                          label="Asset"
                          required={true}
                          placeholder="Search and select asset..."
                          currency={baseCurrency}
                          showCreateOption={true}
                          onCreateAsset={handleCreateAsset}
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
            <Box mb={isModal ? 1 : 1.5}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: isModal ? 1 : 1.5 }}>
                Trade Details
              </Typography>
              <Grid container spacing={isModal ? 1 : 1.5}>
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
                        <NumberInput
                          value={typeof field.value === 'string' ? parseFloat(field.value) || 0 : field.value || 0}
                          onChange={(value) => field.onChange(value)}
                          label="Quantity *"
                          error={!!errors.quantity}
                          disabled={isLoading}
                          decimalPlaces={5}
                          min={0.00001}
                          step={0.00001}
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
                          <MoneyInput
                            value={typeof field.value === 'string' ? parseFloat(field.value) || 0 : field.value || 0}
                            onChange={(value) => field.onChange(value)}
                            label={`Price per Unit (${baseCurrency}) *`}
                            error={!!errors.price}
                            disabled={isLoading}
                            currency={baseCurrency}
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
            <Box mb={isModal ? 1 : 1.5}>
              <Typography variant="h6" gutterBottom color="primary" fontWeight="bold" sx={{ mb: isModal ? 1 : 1.5 }}>
                Additional Information
              </Typography>
              <Grid container spacing={isModal ? 1 : 1.5}>
                  {/* Fee */}
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="fee"
                      control={control}
                      render={({ field }) => (
                          <MoneyInput
                            value={typeof field.value === 'string' ? parseFloat(field.value) || 0 : field.value || 0}
                            onChange={(value) => field.onChange(value)}
                            label={`Trading Fee (${baseCurrency})`}
                            error={!!errors.fee}
                            disabled={isLoading}
                            currency={baseCurrency}
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
                          <MoneyInput
                            value={typeof field.value === 'string' ? parseFloat(field.value) || 0 : field.value || 0}
                            onChange={(value) => field.onChange(value)}
                            label={`Tax (${baseCurrency})`}
                            error={!!errors.tax}
                            disabled={isLoading}
                            currency={baseCurrency}
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
            <Box mb={isModal ? 1 : 2} p={isModal ? 1 : 1.5} sx={{ bgcolor: 'grey.50', borderRadius: 2, border: 1, borderColor: 'grey.200' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={isModal ? 1 : 1.5}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  Trade Summary
                </Typography>
                <Tooltip title={`Currency source: ${currencyInfo.source} (priority ${currencyInfo.priority})`}>
                  <Chip
                    size="small"
                    label={`${baseCurrency} ${getCurrencySymbol(baseCurrency)}`}
                    color={currencyInfo.source === 'portfolio' ? 'primary' : currencyInfo.source === 'account' ? 'secondary' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Tooltip>
              </Box>
              <Grid container spacing={isModal ? 1 : 1.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 1, 
                    border: 1, 
                    borderColor: 'grey.300',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                      <MonetizationOnIcon sx={{ fontSize: 20, color: 'info.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Total Value
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="info.main">
                      {formatCurrency(calculatedValues.value, baseCurrency)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 1, 
                    border: 1, 
                    borderColor: 'grey.300',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                      <AssessmentIcon sx={{ fontSize: 20, color: 'warning.main', mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Fees & Taxes
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {formatCurrency(calculatedValues.fee + calculatedValues.tax, baseCurrency)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 1, 
                    border: 1, 
                    borderColor: 'grey.300',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {watch('side') === TradeSide.SELL ? 'Amount Received' : 'Amount Paid'}
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(calculatedValues.cost, baseCurrency)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', mt: 0.5 }}>
                      {watch('side') === TradeSide.SELL 
                        ? '(Value - Fees - Taxes)' 
                        : '(Value + Fees + Taxes)'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2} sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 1, 
                    border: 1, 
                    borderColor: 'grey.300',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                      {watch('side') === TradeSide.BUY ? 
                        <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} /> :
                        <TrendingDownIcon sx={{ fontSize: 20, color: 'error.main', mr: 1 }} />
                      }
                      <Typography variant="body2" color="text.secondary">
                        Trade Side
                      </Typography>
                    </Box>
                    <Chip
                      label={watch('side')}
                      color={getSideColor(watch('side'))}
                      icon={watch('side') === TradeSide.BUY ? 
                        <TrendingUpIcon sx={{ fontSize: 16 }} /> :
                        <TrendingDownIcon sx={{ fontSize: 16 }} />
                      }
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
                <ResponsiveButton
                  type="submit"
                  variant="contained"
                  disabled={!isValid || isLoading}
                  icon={isLoading ? <CircularProgress size={20} /> : null}
                  mobileText={isLoading ? 'Processing...' : mode === 'create' ? 'Create' : 'Update'}
                  desktopText={isLoading ? 'Processing...' : mode === 'create' ? 'Create Trade' : 'Update Trade'}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
                >
                  {isLoading ? 'Processing...' : mode === 'create' ? 'Create Trade' : 'Update Trade'}
                </ResponsiveButton>
              </Box>
            )}
          </form>

          {/* Asset Creation Modal */}
          <AssetFormModal
            open={showAssetForm}
            onClose={handleCloseAssetForm}
            onSubmit={handleAssetFormSubmit}
            onCancel={handleCloseAssetForm}
            loading={isSubmittingAsset}
            error={assetFormError}
            accountId={accountId}
          />
        </LocalizationProvider>
  );
};

export default TradeForm;
