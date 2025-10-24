/**
 * Asset Form Component
 * Form for creating and editing assets
 */

import React, { useState } from 'react';
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
import { ResponsiveButton, ResponsiveTypography } from '../Common';
import { CreateAssetRequest, Asset, AssetType } from '../../types/asset.types';
import { useAssetTypes } from '../../hooks/useAssetTypes';
import { useAccount } from '../../contexts/AccountContext';

export interface AssetFormProps {
  onSubmit: (assetData: CreateAssetRequest) => void;
  onCancel?: () => void;
  userId?: string;
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
  initialData,
  submitText = 'Create Asset',
  mode = 'create',
  loading: _loading = false,
  className: _className = '',
  standalone = true, // Default to standalone mode
}) => {
  const { t } = useTranslation();
  // Get current user ID from useAccount hook
  const { accountId } = useAccount();
  const currentUserId = userId || accountId;
  
  // Determine if we're in edit mode based on whether we have an asset or initialData with symbol
  const isEditMode = mode === 'edit' || (initialData && initialData.symbol);
  const { assetTypes, loading: typesLoading, error: typesError } = useAssetTypes();
  
  const [formData, setFormData] = useState<CreateAssetRequest>({
    name: '',
    symbol: '',
    type: (assetTypes[0]?.value as AssetType) || AssetType.STOCK,
    description: '',
    initialValue: undefined,
    initialQuantity: undefined,
    currentValue: undefined,
    currentQuantity: undefined,
    createdBy: currentUserId,
    updatedBy: currentUserId,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = t('asset.form.validation.nameRequired');
    }

    // Only validate symbol in create mode
    if (!isEditMode && !formData.symbol?.trim()) {
      newErrors.symbol = t('asset.form.validation.symbolRequired');
    }

    if (!formData.type) {
      newErrors.type = t('asset.form.validation.typeRequired');
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
    
    // Ensure symbol is always uppercase
    if (field === 'symbol') {
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

  const formContent = (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
      <Grid container spacing={3}>
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

        {!isEditMode && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('asset.form.fields.symbol')}
              value={formData.symbol}
              onChange={handleChange('symbol')}
              placeholder={t('asset.form.fields.symbolPlaceholder')}
              error={!!errors.symbol}
              helperText={t('asset.form.fields.symbolHelper')}
              required
            />
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
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel>{t('asset.form.fields.type')}</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label={t('asset.form.fields.type')}
              disabled={typesLoading}
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
          <TextField
            fullWidth
            label={t('asset.form.fields.description')}
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={2}
            placeholder={t('asset.form.fields.descriptionPlaceholder')}
          />
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
