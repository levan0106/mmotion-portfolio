import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { ResponsiveButton } from '../Common';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// Removed React Hook Form - using useState instead
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';
import { TradeSide, TradeType, TradeSource, TradeFormData } from '../../types';
import { CreateAssetRequest } from '../../types/asset.types';
import { 
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
  getBaseCurrency
} from '../../utils/currency';
import { useCurrencyCache } from '../../hooks/useCurrencyCache';

// Simple validation functions
const validateForm = (formData: any) => {
  const errors: any = {};
  
  if (!formData.portfolioId) errors.portfolioId = 'Portfolio is required';
  if (!formData.assetId) errors.assetId = 'Asset is required';
  if (!formData.tradeDate) errors.tradeDate = 'Trade date is required';
  if (!formData.side) errors.side = 'Trade side is required';
  if (!formData.quantity || formData.quantity <= 0) errors.quantity = 'Quantity must be positive';
  if (formData.price === undefined || formData.price === null || formData.price < 0) errors.price = 'Price must be non-negative';
  if (formData.fee && formData.fee < 0) errors.fee = 'Fee cannot be negative';
  if (formData.tax && formData.tax < 0) errors.tax = 'Tax cannot be negative';
  
  return errors;
};

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
  // Modal props
  open?: boolean;
  onClose?: () => void;
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  size?: 'small' | 'medium' | 'large';
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
  // Modal props
  open,
  onClose,
  title,
  icon,
  actions,
  maxWidth = 'md',
  size = 'medium',
}) => {
  const { t } = useTranslation();
  const { accountId, currentAccount } = useAccount();
  const { portfolios, isLoading: portfoliosLoading, error: portfoliosError } = usePortfolios(accountId);
  // Asset creation modal state
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetFormError, setAssetFormError] = useState<string | null>(null);
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);

  
  // Form state management
  const [formData, setFormData] = useState({
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
  });

  // Validation state - only show errors after user interaction
  const [errors, setErrors] = useState<any>({});
  const [isValid, setIsValid] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Force re-render of AssetAutocomplete when assetId changes in edit mode
  const [assetKey, setAssetKey] = useState(0);

  // Form values for calculations
  const watchedQuantity = formData.quantity;
  const watchedPrice = formData.price;
  const watchedFee = formData.fee || 0;
  const watchedTax = formData.tax || 0;
  const watchedPortfolioId = formData.portfolioId;
  const watchedSide = formData.side;
  
  // Get selected portfolio for currency
  const selectedPortfolio = portfolios?.find(p => p.portfolioId === watchedPortfolioId);
  
  // Update currency cache
  useCurrencyCache(currentAccount, null); // userCurrency can be added later
  
  // Get base currency with priority: portfolio -> account (cached) -> user (cached) -> default VND
  const baseCurrency = getBaseCurrency(
    selectedPortfolio,
    'VND' // default currency
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
    const side = watchedSide;
    
    const value = quantity * price;
    
    // Calculate total cost based on trade side
    // SELL: Total Cost = Quantity*Price - Fees - Taxes (amount received)
    // BUY: Total Cost = Quantity*Price + Fees + Taxes (amount paid)
    const cost = side === TradeSide.SELL 
      ? value - fee - tax  // SELL: subtract fees and taxes
      : value + fee + tax; // BUY: add fees and taxes
    
    return { value, cost, fee, tax };
  }, [watchedQuantity, watchedPrice, watchedFee, watchedTax, watchedSide]);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        portfolioId: initialData.portfolioId || '',
        assetId: initialData.assetId || '',
        tradeDate: initialData.tradeDate || new Date().toISOString(),
        side: initialData.side || TradeSide.BUY,
        quantity: initialData.quantity || 0,
        price: initialData.price || 0,
        fee: initialData.fee || 0,
        tax: initialData.tax || 0,
        tradeType: initialData.tradeType || TradeType.MARKET,
        source: initialData.source || TradeSource.MANUAL,
        exchange: initialData.exchange || '',
        fundingSource: initialData.fundingSource || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData, mode]);

  // Validate form only after user interaction - debounced to prevent excessive re-renders
  useEffect(() => {
    if (!hasUserInteracted) return;
    
    const timeoutId = setTimeout(() => {
      const validationErrors = validateForm(formData);
      setErrors(validationErrors);
      setIsValid(Object.keys(validationErrors).length === 0);
    }, 300); // Debounce validation by 300ms

    return () => clearTimeout(timeoutId);
  }, [formData, hasUserInteracted]);

  // Only update assetKey when necessary in edit mode
  useEffect(() => {
    if (initialData?.assetId && mode === 'edit' && assetKey === 0) {
      // Force re-render of AssetAutocomplete to ensure it picks up the value
      setAssetKey(1);
    }
  }, [initialData?.assetId, mode, assetKey]);


  // Track user interaction for validation - memoized to prevent re-render
  const handleFieldChange = useCallback((field: string, value: any) => {
    setHasUserInteracted(true);
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFormSubmit = useCallback(async () => {
    try {
      // Mark as user interacted to show validation errors
      setHasUserInteracted(true);
      
      // Use the form data directly
      const submitData: TradeFormData = {
        portfolioId: formData.portfolioId,
        assetId: formData.assetId,
        tradeDate: typeof formData.tradeDate === 'string' 
          ? formData.tradeDate 
          : (formData.tradeDate as Date).toISOString(),
        side: formData.side,
        quantity: formData.quantity,
        price: formData.price,
        fee: formData.fee || 0,
        tax: formData.tax || 0,
        tradeType: formData.tradeType || TradeType.MARKET,
        source: formData.source || TradeSource.MANUAL,
        exchange: formData.exchange || '',
        fundingSource: formData.fundingSource || '',
        notes: formData.notes || '',
      };
      
      await onSubmit(submitData);
    } catch (err) {
      console.error('Error submitting trade form:', err);
    }
  }, [formData, onSubmit]);

  // Asset creation handlers
  const handleCreateAsset = useCallback(() => {
    setShowAssetForm(true);
    setAssetFormError(null);
  }, []);

  const handleCloseAssetForm = useCallback(() => {
    setShowAssetForm(false);
    setAssetFormError(null);
    setIsSubmittingAsset(false);
  }, []);

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

  const getSideColor = useCallback((side: TradeSide) => {
    return side === TradeSide.BUY ? 'success' : 'error';
  }, []);



  // Memoize default actions to prevent re-render
  const defaultActions = useMemo(() => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <ResponsiveButton 
        onClick={onClose} 
        disabled={isLoading}
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ResponsiveButton
        onClick={handleFormSubmit}
        variant="contained"
        disabled={isLoading}
        icon={mode === 'create' ? <AddIcon /> : <EditIcon />}
        mobileText={isLoading ? t('trading.form.processing') : mode === 'create' ? t('trading.form.create') : t('trading.form.update')}
        desktopText={isLoading ? t('trading.form.processing') : mode === 'create' ? t('trading.form.createTrade') : t('trading.form.updateTrade')}
      >
        {isLoading ? t('trading.form.processing') : mode === 'create' ? t('trading.form.createTrade') : t('trading.form.updateTrade')}
      </ResponsiveButton>
    </Box>
  ), [onClose, isLoading, mode, t, handleFormSubmit]);

  // Form content component - memoized to prevent unnecessary re-renders
  // MUST be called before any conditional returns to maintain hooks order
  const FormContent = useMemo(() => (
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

      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }}>
              {/* Basic Information Section */}
              <Box mb={isModal ? 0.5 : 1.5} mt={isModal ? 0.5 : 1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <ResponsiveTypography variant="cardLabel" sx={{ mb: 1 }}>
                    {t('trading.form.basicInformation')}
                  </ResponsiveTypography>
                  {/* Trade Side Toggle */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.side === TradeSide.BUY}
                        onChange={(e) => handleFieldChange('side', e.target.checked ? TradeSide.BUY : TradeSide.SELL)}
                        color="primary"
                      />
                    }
                    label={
                      <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                        {formData.side === TradeSide.BUY ? t('trading.form.buy') : t('trading.form.sell')}
                      </ResponsiveTypography>
                    }
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Grid container spacing={2} sx={{ px: 1 }}>

                  {/* Asset Selection */}
                  <Grid item xs={12} md={6}>
                    <AssetAutocomplete
                      key={assetKey}
                      value={formData.assetId}
                      onChange={(assetId) => handleFieldChange('assetId', assetId || '')}
                      error={!!errors.assetId}
                      disabled={isLoading}
                      label={t('trading.form.asset')}
                      required={true}
                      placeholder={t('trading.form.searchAsset')}
                      currency={baseCurrency}
                      showCreateOption={true}
                      onCreateAsset={handleCreateAsset}
                    />
                  </Grid>

                  {/* Trade Date */}
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label={`${t('trading.form.tradeDate')} *`}
                      disabled={isLoading}
                      value={(() => {
                        try {
                          if (!formData.tradeDate) return new Date();
                          if (typeof formData.tradeDate === 'string') {
                            const date = new Date(formData.tradeDate);
                            return isNaN(date.getTime()) ? new Date() : date;
                          }
                          return formData.tradeDate;
                        } catch {
                          return new Date();
                        }
                      })()}
                      onChange={(newValue) => {
                        try {
                          if (newValue && !isNaN(newValue.getTime())) {
                            handleFieldChange('tradeDate', newValue.toISOString());
                          } else {
                            handleFieldChange('tradeDate', new Date().toISOString());
                          }
                        } catch {
                          handleFieldChange('tradeDate', new Date().toISOString());
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
                  </Grid>
                </Grid>
              </Box>

            {/* Trade Details Section */}
            <Box>
              {/* <ResponsiveTypography variant="cardLabel" sx={{ mb: 2 , mt: 2 }}>
                {t('trading.form.tradeDetails')}
              </ResponsiveTypography> */}
              <Grid container spacing={2} sx={{ px: 1, mt: 2 }}>

                {/* Quantity */}
                <Grid item xs={12} md={6}>
                    <NumberInput
                      value={formData.quantity || 0}
                      onChange={(quantity) => handleFieldChange('quantity', quantity)}
                      label={`${t('trading.form.quantity')} *`}
                      error={!!errors.quantity}
                      disabled={isLoading}
                      decimalPlaces={5}
                      min={0.00001}
                      step={0.00001}
                    />
                  </Grid>

                  {/* Price */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ position: 'relative' }}>
                      <MoneyInput
                        value={formData.price || 0}
                        onChange={(price) => handleFieldChange('price', price)}
                        label={`${t('trading.form.pricePerUnit')} (${baseCurrency})`}
                        error={!!errors.price}
                        disabled={isLoading}
                        currency={baseCurrency}
                      />
                          {/* {watchedAssetId && (
                            <Tooltip title={t('trading.form.refreshMarketPrice')}>
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
                          )} */}
                        </Box>
                  </Grid>
                </Grid>
              </Box>

            {/* Additional Information Section */}
            <Box mb={isModal ? 0.5 : 1.5}>
                <ResponsiveTypography variant="cardLabel" sx={{ mb: 2 , mt: 2 }}>
                {t('trading.form.additionalInformation')}
              </ResponsiveTypography>
              <Grid container spacing={2} sx={{ px: 1 }}>
                {/* Fee */}
                <Grid item xs={12} md={6}>
                    <MoneyInput
                      value={formData.fee || 0}
                      onChange={(fee) => handleFieldChange('fee', fee)}
                      label={`${t('trading.form.tradingFee')} (${baseCurrency})`}
                      error={!!errors.fee}
                      disabled={isLoading}
                      currency={baseCurrency}
                    />
                  </Grid>

                  {/* Tax */}
                  <Grid item xs={12} md={6}>
                    <MoneyInput
                      value={formData.tax || 0}
                      onChange={(tax) => handleFieldChange('tax', tax)}
                      label={`${t('trading.form.tax')} (${baseCurrency})`}
                      error={!!errors.tax}
                      disabled={isLoading}
                      currency={baseCurrency}
                    />
                  </Grid>


                </Grid>
              </Box>

            {/* Exchange and Funding Source Section */}
            <Box>
              {/* <ResponsiveTypography variant="cardLabel" sx={{ mb: 2 , mt: 2 }}>
                {t('trading.form.exchangeFunding')}
              </ResponsiveTypography> */}
              <Grid container spacing={2} sx={{ px: 1, mt: 2 }}>
                {/* Exchange */}
                <Grid item xs={12} md={6}>
                  <TextField
                    value={formData.exchange}
                    onChange={(e) => handleFieldChange('exchange', e.target.value.toUpperCase())}
                    label={t('trading.form.exchangePlatform')}
                    fullWidth
                    error={!!errors.exchange}
                    disabled={isLoading}
                    placeholder={t('trading.form.enterExchangePlatform')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                    inputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
                  />
                </Grid>

                {/* Funding Source */}
                <Grid item xs={12} md={6}>
                  <TextField
                    value={formData.fundingSource}
                    onChange={(e) => handleFieldChange('fundingSource', e.target.value.toUpperCase())}
                    label={t('trading.form.fundingSource')}
                    fullWidth
                    error={!!errors.fundingSource}
                    disabled={isLoading}
                    placeholder={t('trading.form.enterFundingSource')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                    inputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Summary Section */}
            <Box >
              <Box display="flex" justifyContent="space-between" alignItems="center" >
                <ResponsiveTypography variant="cardTitle" color="primary" sx={{ mb: 1, mt: 4 }}>
                  {t('trading.form.tradeSummary')}
                </ResponsiveTypography>
              </Box>
              <Grid container spacing={2} sx={{ px: 1 }}>
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
                      <ResponsiveTypography variant="cardLabel" color="text.secondary">
                        {t('trading.form.totalValue')}
                      </ResponsiveTypography>
                    </Box>
                    <ResponsiveTypography variant="cardValue" fontWeight="bold" color="info.main">
                      {formatCurrency(calculatedValues.value, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={isModal ? 1 : 2} sx={{ 
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
                      <ResponsiveTypography variant="cardLabel" color="text.secondary">
                        {t('trading.form.feesTaxes')}
                      </ResponsiveTypography>
                    </Box>
                    <ResponsiveTypography variant="cardValue" fontWeight="bold" color="warning.main">
                      {formatCurrency(calculatedValues.fee + calculatedValues.tax, baseCurrency)}
                    </ResponsiveTypography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={isModal ? 1 : 2} sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 1, 
                    border: 1, 
                    borderColor: 'grey.300',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <ResponsiveTypography variant="cardLabel" color="text.secondary" gutterBottom>
                      {watchedSide === TradeSide.SELL ? t('trading.form.amountReceived') : t('trading.form.amountPaid')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardValue" fontWeight="bold" color="primary.main">
                      {formatCurrency(calculatedValues.cost, baseCurrency)}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="labelXSmall" color="text.secondary" sx={{ mt: 0.5 }}>
                      {watchedSide === TradeSide.SELL 
                        ? '(Value - Fees - Taxes)' 
                        : '(Value + Fees + Taxes)'}
                    </ResponsiveTypography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={isModal ? 1 : 2} sx={{ 
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
                      {watchedSide === TradeSide.BUY ? 
                        <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main', mr: 1 }} /> :
                        <TrendingDownIcon sx={{ fontSize: 20, color: 'error.main', mr: 1 }} />
                      }
                      <ResponsiveTypography variant="cardLabel" color="text.secondary">
                        {t('trading.form.tradeSide')}
                      </ResponsiveTypography>
                    </Box>
                    <Chip
                      label={watchedSide}
                      color={getSideColor(watchedSide)}
                      icon={watchedSide === TradeSide.BUY ? 
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
                  icon={isLoading ? <CircularProgress size={20} /> : mode === 'create' ? <AddIcon /> : <EditIcon />}
                  mobileText={isLoading ? t('trading.form.processing') : mode === 'create' ? t('trading.form.create') : t('trading.form.update')}
                  desktopText={isLoading ? t('trading.form.processing') : mode === 'create' ? t('trading.form.createTrade') : t('trading.form.updateTrade')}
                  sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
                >
                  {isLoading ? t('trading.form.processing') : mode === 'create' ? t('trading.form.createTrade') : t('trading.form.updateTrade')}
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
  ), [
    error, 
    formData, 
    errors, 
    isLoading, 
    mode, 
    t, 
    baseCurrency, 
    assetKey, 
    handleFieldChange, 
    handleCreateAsset, 
    calculatedValues, 
    watchedSide, 
    getSideColor,
    showAssetForm,
    handleCloseAssetForm,
    handleAssetFormSubmit,
    isSubmittingAsset,
    assetFormError,
    accountId,
    portfoliosLoading,
    portfoliosError
  ]);

  // Show loading state
  if (portfoliosLoading) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={isModal ? 1 : 2} mb={3}>
              <CircularProgress size={20} />
              <Typography variant="h5">{t('trading.form.loadingTradeForm')}</Typography>
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
              {t('trading.form.noPortfoliosAvailable')}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {portfoliosError ? `${t('trading.form.error')}: ${portfoliosError}` : t('trading.form.noPortfoliosFoundError')}
            </Typography>
          </CardContent>
        </Card>
      </LocalizationProvider>
    );
  }

  // If modal props are provided, wrap with ModalWrapper
  if (open !== undefined && onClose) {
    const defaultTitle = mode === 'create' ? t('trading.form.createTrade') : t('trading.form.updateTrade');
    const defaultIcon = mode === 'create' ? <AddIcon /> : <EditIcon />;

    return (
      <ModalWrapper
        open={open}
        onClose={onClose}
        title={title || defaultTitle}
        icon={icon || defaultIcon}
        maxWidth={maxWidth}
        size={size}
        loading={isLoading}
        actions={actions || defaultActions}
      >
        {FormContent}
      </ModalWrapper>
    );
  }

  // Return form directly if not in modal mode
  return FormContent;
};

export default TradeForm;
