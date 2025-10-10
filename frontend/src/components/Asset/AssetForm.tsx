/**
 * Asset Form Component
 * Form for creating and editing assets
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CreateAssetRequest, Asset, AssetType } from '../../types/asset.types';
import { useAssetTypes } from '../../hooks/useAssetTypes';
import { useAccount } from '../../contexts/AccountContext';
import './AssetForm.styles.css';

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
}) => {
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
      newErrors.name = 'Asset name is required';
    }

    // Only validate symbol in create mode
    if (!isEditMode && !formData.symbol?.trim()) {
      newErrors.symbol = 'Asset symbol is required';
    }

    if (!formData.type) {
      newErrors.type = 'Asset type is required';
    }

    // Note: initialValue, initialQuantity, currentValue, currentQuantity are computed fields
    // and don't need validation as they are calculated automatically

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('AssetForm handleSubmit called');
    console.log('Form data:', formData);
    console.log('Form validation result:', validateForm());
    
    if (validateForm()) {
      console.log('Calling onSubmit with formData');
      onSubmit(formData);
    } else {
      console.log('Form validation failed');
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

  return (
    <div className="asset-form">
      <div className="asset-form__header">
        <h2>{submitText}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn--secondary btn--icon"
          aria-label="Close form"
        >
          ✕
        </button>
      </div>
      
      <div className="asset-form__content">
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Asset Name"
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
              label="Asset Symbol"
              value={formData.symbol}
              onChange={handleChange('symbol')}
              placeholder="e.g., AAPL, HPG"
              error={!!errors.symbol}
              helperText="Symbol cannot be changed after creation. "
              required
            />
          </Grid> 
        )}

        {isEditMode && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Asset Symbol"
              value={formData.symbol || ''}
              disabled
              helperText="Symbol cannot be changed after creation"
            />
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel>Asset Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label="Asset Type"
              disabled={typesLoading}
            >
              {typesLoading ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading asset types...
                </MenuItem>
              ) : typesError ? (
                <MenuItem disabled>
                  Error loading asset types
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
            label="Currency"
            value="VND"
            disabled
            helperText="Currently only VND is supported"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            multiline
            rows={2}
            placeholder="Optional description of the asset"
          />
        </Grid>

        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Computed Fields:</strong> Initial value, initial quantity, current value, and current quantity are automatically calculated based on your trades and market prices. These fields will be updated when you create trades for this asset.
          </Alert>
        </Grid>
{/* 
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Initial Value"
            type="number"
            value={formData.initialValue ?? ''}
            disabled
            helperText="Calculated from first trade"
            inputProps={{ min: 0, step: 0.01 }}
            placeholder={formData.initialValue ? undefined : "No data available"}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Initial Quantity"
            type="number"
            value={formData.initialQuantity ?? ''}
            disabled
            helperText="Calculated from first trade"
            inputProps={{ min: 0.0001, step: 0.0001 }}
            placeholder={formData.initialQuantity ? undefined : "No data available"}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Current Value"
            type="number"
            value={formData.currentValue ?? ''}
            disabled
            helperText="Calculated from trades × current market price"
            inputProps={{ min: 0, step: 0.01 }}
            placeholder={formData.currentValue ? undefined : "No data available"}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Current Quantity"
            type="number"
            value={formData.currentQuantity ?? ''}
            disabled
            helperText="Calculated from all trades"
            inputProps={{ min: 0, step: 0.0001 }}
            placeholder={formData.currentQuantity ? undefined : "No data available"}
          />
        </Grid> */}
      </Grid>
      
      <div className="asset-form__actions">
        <Button
          type="button"
          variant="outlined"
          onClick={onCancel}
          size="large"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={_loading}
        >
          {_loading ? 'Đang xử lý...' : submitText}
        </Button>
      </div>
        </Box>
      </div>
    </div>
  );
};
