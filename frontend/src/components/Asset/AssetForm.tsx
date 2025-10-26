/**
 * Asset Form Component
 * Form for creating and editing assets
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ResponsiveButton, ResponsiveTypography, MoneyInput } from '../Common';
import { CreateAssetRequest, Asset, AssetType, PriceMode } from '../../types/asset.types';
import { useAssetTypes } from '../../hooks/useAssetTypes';
import { useAccount } from '../../contexts/AccountContext';
import { globalAssetService } from '../../services/global-asset.service';

export interface AssetFormProps {
  onSubmit: (assetData: CreateAssetRequest) => void;
  onCancel?: () => void;
  userId?: string;
  currentUserId?: string; // Current user ID for permission checking
  globalAsset?: any; // Global asset data for permission checking
  initialData?: Partial<CreateAssetRequest>;
  submitText?: string;
  asset?: Asset;
  mode?: string;
  loading?: boolean;
  className?: string;
  standalone?: boolean; // New prop to control if form should be wrapped in Card
}

export const AssetForm: React.FC<AssetFormProps> = ({
  onSubmit,
  onCancel,
  userId,
  currentUserId,
  globalAsset,
  initialData,
  submitText = 'Create Asset',
  asset,
  mode = 'create',
  loading: _loading = false,
  className: _className = '',
  standalone = true, // Default to standalone mode
}) => {
  const { t } = useTranslation();
  // Get current user ID from useAccount hook as fallback
  const { accountId } = useAccount();
  const effectiveCurrentUserId = currentUserId || userId || accountId;
  
  // Determine if we're in edit mode based on whether we have an asset or initialData with symbol
  const isEditMode = mode === 'edit' || (initialData && initialData.symbol);
  const { assetTypes, loading: typesLoading, error: typesError } = useAssetTypes();
  
  // Permission for price mode editing will be determined by global asset data
  const [canEditPriceMode, setCanEditPriceMode] = useState(true);
  
  // State for auto-fetching global asset data in create mode
  const [isFetchingGlobalAsset, setIsFetchingGlobalAsset] = useState(false);
  const [fetchedGlobalAsset, setFetchedGlobalAsset] = useState<any>(null);
  
  // Ref to maintain focus on symbol input
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const [shouldMaintainFocus, setShouldMaintainFocus] = useState(false);

  // Maintain focus on symbol input after re-render
  useEffect(() => {
    if (shouldMaintainFocus && symbolInputRef.current) {
      symbolInputRef.current.focus();
      setShouldMaintainFocus(false);
    }
  }, [shouldMaintainFocus]);

  // Check permission based on global asset data
  React.useEffect(() => {
    if (isEditMode && globalAsset) {
      // Only allow editing price mode if current user created the global asset
      const hasPermission = globalAsset.createdBy === accountId;
      setCanEditPriceMode(hasPermission);
    } else if (!isEditMode) {
      // In create mode, check if we have fetched global asset data
      if (fetchedGlobalAsset) {
        const hasPermission = fetchedGlobalAsset.createdBy === accountId;
        setCanEditPriceMode(hasPermission);
      } else {
        setCanEditPriceMode(true);
      }
    }
  }, [isEditMode, globalAsset, fetchedGlobalAsset, accountId]);

  // Function to fetch global asset data by symbol
  const fetchGlobalAssetBySymbol = async (symbol: string) => {
    if (!symbol || symbol.length < 3) {
      setFetchedGlobalAsset(null);
      return;
    }

    setIsFetchingGlobalAsset(true);
    setShouldMaintainFocus(true); // Set flag to maintain focus after re-render
    try {
      const globalAssetData = await globalAssetService.getGlobalAssetBySymbol(symbol);
      setFetchedGlobalAsset(globalAssetData);
      
      if (globalAssetData) {
        // Auto-fill form data from global asset
        setFormData(prev => ({
          ...prev,
          name: globalAssetData.name || prev.name,
          type: globalAssetData.type || prev.type,
          description: globalAssetData.description || prev.description,
          priceMode: (globalAssetData.priceMode as PriceMode) || prev.priceMode,
          // Auto-fill current price if available
          currentValue: globalAssetData.assetPrice?.currentPrice || prev.currentValue,
          manualPrice: globalAssetData.assetPrice?.currentPrice || prev.manualPrice,
        }));
        
        // Check if current user owns this global asset
        const hasPermission = (globalAssetData as any).createdBy === accountId;
        setCanEditPriceMode(hasPermission);
      } else {
        // Reset to default permission when no global asset found
        setCanEditPriceMode(true);
      }
    } catch (error) {
      setFetchedGlobalAsset(null);
      setCanEditPriceMode(true);
    } finally {
      setIsFetchingGlobalAsset(false);
    }
  };
  
  const [formData, setFormData] = useState<CreateAssetRequest>({
    name: '',
    symbol: '',
    type: (assetTypes[0]?.value as AssetType) || AssetType.STOCK,
    description: '',
    priceMode: PriceMode.AUTOMATIC,
    manualPrice: undefined,
    initialValue: undefined,
    initialQuantity: undefined,
    currentValue: undefined,
    currentQuantity: undefined,
    createdBy: effectiveCurrentUserId,
    updatedBy: effectiveCurrentUserId,
    ...initialData,
  });

  // Auto-fill manualPrice with currentPrice when editing
  React.useEffect(() => {
    if (isEditMode && asset && asset.currentPrice) {
      setFormData(prev => ({
        ...prev,
        manualPrice: asset.currentPrice
      }));
    }
  }, [isEditMode, asset]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('asset.form.validation.nameRequired');
    }

    // Only validate symbol in create mode
    if (!isEditMode && !formData.symbol?.trim()) {
      newErrors.symbol = t('asset.form.validation.symbolRequired');
    } else if (!isEditMode && formData.symbol && !/^[A-Z0-9]+$/.test(formData.symbol)) {
      newErrors.symbol = t('asset.form.validation.symbolInvalidFormat');
    }

    if (!formData.type) {
      newErrors.type = t('asset.form.validation.typeRequired');
    }

    if (!formData.priceMode) {
      newErrors.priceMode = t('asset.form.validation.priceModeRequired');
    }

    // Validate manual price when priceMode is MANUAL
    if (formData.priceMode === PriceMode.MANUAL) {
      if (!formData.manualPrice || formData.manualPrice <= 0) {
        newErrors.manualPrice = t('asset.form.validation.manualPriceRequired');
      }
    }

    // Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
    // and don't need validation as they are calculated automatically

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    } else {
    }
  };

  const handleChange = (field: keyof CreateAssetRequest) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    // Skip handling for computed fields as they are disabled
    if (field === 'initialValue' || field === 'initialQuantity' || 
        field === 'currentValue' || field === 'currentQuantity') {
      return;
    }

    let value = event.target.value;
    
    // Ensure symbol is always uppercase and only contains letters and numbers
    if (field === 'symbol') {
      // Remove any non-alphanumeric characters
      value = value.replace(/[^A-Za-z0-9]/g, '');
      // Convert to uppercase
      value = value.toUpperCase();
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Handle symbol blur event to fetch global asset data
  const handleSymbolBlur = () => {
    if (!isEditMode && formData.symbol && formData.symbol.length >= 3) {
      fetchGlobalAssetBySymbol(formData.symbol);
    }
  };

  const formContent = (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
      <Grid container spacing={3}>
        {!isEditMode && (
          <Grid item xs={12} sm={6}>
            <TextField
              ref={symbolInputRef}
              fullWidth
              label={t('asset.form.fields.symbol')}
              value={formData.symbol}
              onChange={handleChange('symbol')}
              onBlur={handleSymbolBlur}
              placeholder={t('asset.form.fields.symbolPlaceholder')}
              error={!!errors.symbol}
              helperText={
                fetchedGlobalAsset 
                  ? t('asset.form.fields.symbolFoundInSystem') 
                  : t('asset.form.fields.symbolHelper')
              }
              required
              disabled={isFetchingGlobalAsset}
            />
            {isFetchingGlobalAsset && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {t('asset.form.loading.fetchingGlobalAsset')}
              </Alert>
            )}
          </Grid> 
        )}

        {isEditMode && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('asset.form.fields.symbol')}
              value={formData.symbol || ''}
              disabled
              helperText={t('asset.form.fields.symbolDisabledHelper')}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label={t('asset.form.fields.name')}
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel>{t('asset.form.fields.type')}</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label={t('asset.form.fields.type')}
              disabled={!!(typesLoading || (!canEditPriceMode && (isEditMode || fetchedGlobalAsset)))}
            >
              {typesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {t('asset.form.loading.types')}
                </MenuItem>
              ) : typesError ? (
                <MenuItem disabled>
                  {t('asset.form.error.typesLoadFailed')}
                </MenuItem>
              ) : (
                assetTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.type && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.type}
              </Alert>
            )}
            {typesError && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                {typesError}
              </Alert>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.priceMode}>
            <InputLabel>{t('asset.form.fields.priceMode')}</InputLabel>
            <Select
              value={formData.priceMode}
              onChange={handleChange('priceMode')}
              label={t('asset.form.fields.priceMode')}
              disabled={!canEditPriceMode || (fetchedGlobalAsset && !isEditMode)}
            >
              <MenuItem value={PriceMode.AUTOMATIC}>
                <Box>
                  <Box sx={{ fontWeight: 600, fontSize: '0.925rem' }}>
                    {t('asset.form.priceMode.automatic')}
                  </Box>
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {t('asset.form.priceMode.automaticDescription')}
                  </Box>
                </Box>
              </MenuItem>
              <MenuItem value={PriceMode.MANUAL}>
                <Box>
                  <Box sx={{ fontWeight: 600, fontSize: '0.925rem' }}>
                    {t('asset.form.priceMode.manual')}
                  </Box>
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {t('asset.form.priceMode.manualDescription')}
                  </Box>
                </Box>
              </MenuItem>
            </Select>
            {errors.priceMode && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.priceMode}
              </Alert>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <TextField
            fullWidth
            label={t('asset.form.fields.description')}
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={1}
            placeholder={t('asset.form.fields.descriptionPlaceholder')}
          />
        </Grid>

        {/* Manual Price Input */}        
          <Grid item xs={12} sm={6}>
            <MoneyInput
              value={formData.manualPrice || 0}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  manualPrice: value
                }));
                // Clear error when user starts typing
                if (errors.manualPrice) {
                  setErrors(prev => ({
                    ...prev,
                    manualPrice: '',
                  }));
                }
              }}
              label={t('asset.form.fields.manualPrice')}
              placeholder={t('asset.form.fields.manualPricePlaceholder')}
              helperText={formData.priceMode === PriceMode.MANUAL ? t('asset.form.fields.manualPriceHelper') : ''}
              error={!!errors.manualPrice}
              currency="VND"
              showCurrency={true}
              align="right"
              disabled={!canEditPriceMode || (fetchedGlobalAsset && !isEditMode)}
            />
            {errors.manualPrice && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.manualPrice}
              </Alert>
            )}
          </Grid>
        </Grid>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end', 
          mt: 4,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          {onCancel && (
            <ResponsiveButton
              type="button"
              variant="outlined"
              onClick={onCancel}
              size="large"
              forceTextOnly={true}
              mobileText={t('common.cancel')}
              desktopText={t('common.cancel')}
            >
              {t('common.cancel')}
            </ResponsiveButton>
          )}
          <ResponsiveButton
            type="submit"
            variant="contained"
            size="large"
            disabled={_loading}
            icon={_loading ? <CircularProgress size={20} /> : undefined}
            forceTextOnly={true}
            mobileText={_loading ? t('common.processing') : submitText}
            desktopText={_loading ? t('common.processing') : submitText}
          >
            {_loading ? t('common.processing') : submitText}
          </ResponsiveButton>
        </Box>
      </Box>
  );

  // Return standalone Card wrapper or just form content
  if (standalone) {
    return (
      <Card sx={{ maxWidth: 800, mx: 'auto' }}>
        <CardHeader
          title={
            <ResponsiveTypography variant="h5" component="h2">
              {submitText}
            </ResponsiveTypography>
          }
          action={
            onCancel && (
              <IconButton
                onClick={onCancel}
                aria-label="Close form"
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon />
              </IconButton>
            )
          }
          sx={{ pb: 1 }}
        />
        <Divider />
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    );
  }

  // Return just form content for modal usage
  return formContent;
};
