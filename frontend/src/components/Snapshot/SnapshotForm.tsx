// SnapshotForm Component for CR-006 Asset Snapshot System

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  LinearProgress,
  alpha,
  useTheme,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { SnapshotFormData, SnapshotGranularity, CreateSnapshotRequest, UpdateSnapshotRequest } from '../../types/snapshot.types';
import { formatPercentage } from '../../utils/format';

interface SnapshotFormProps {
  initialData?: Partial<SnapshotFormData>;
  onSubmit: (data: CreateSnapshotRequest | UpdateSnapshotRequest) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  loading?: boolean;
}

const initialFormData: SnapshotFormData = {
  portfolioId: '',
  assetId: '',
  assetSymbol: '',
  snapshotDate: new Date().toISOString().split('T')[0],
  granularity: SnapshotGranularity.DAILY,
  quantity: 0,
  currentPrice: 0,
  currentValue: 0,
  costBasis: 0,
  avgCost: 0,
  realizedPl: 0,
  unrealizedPl: 0,
  totalPl: 0,
  allocationPercentage: 0,
  portfolioTotalValue: 0,
  returnPercentage: 0,
  dailyReturn: 0,
  cumulativeReturn: 0,
  isActive: true,
  createdBy: '',
  notes: '',
};

export const SnapshotForm: React.FC<SnapshotFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState<SnapshotFormData>({
    ...initialFormData,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof SnapshotFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateDerivedValues = () => {
    const { quantity, currentPrice, costBasis, realizedPl, unrealizedPl } = formData;
    
    const currentValue = quantity * currentPrice;
    const totalPl = realizedPl + unrealizedPl;
    const avgCost = quantity > 0 ? costBasis / quantity : 0;
    const returnPercentage = costBasis > 0 ? (totalPl / costBasis) * 100 : 0;
    const allocationPercentage = formData.portfolioTotalValue > 0 
      ? (currentValue / formData.portfolioTotalValue) * 100 
      : 0;

    setFormData(prev => ({
      ...prev,
      currentValue,
      totalPl,
      avgCost,
      returnPercentage,
      allocationPercentage,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.portfolioId) {
      newErrors.portfolioId = 'Portfolio ID is required';
    }
    if (!formData.assetId) {
      newErrors.assetId = 'Asset ID is required';
    }
    if (!formData.assetSymbol) {
      newErrors.assetSymbol = 'Asset symbol is required';
    }
    if (!formData.snapshotDate) {
      newErrors.snapshotDate = 'Snapshot date is required';
    }
    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity must be non-negative';
    }
    if (formData.currentPrice < 0) {
      newErrors.currentPrice = 'Current price must be non-negative';
    }
    if (formData.costBasis < 0) {
      newErrors.costBasis = 'Cost basis must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit snapshot:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const theme = useTheme();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isEdit ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {isEdit ? 'Edit Snapshot' : 'Create Snapshot'}
              </Typography>
            </Box>
            <Chip 
              label={isEdit ? 'Edit Mode' : 'Create Mode'} 
              color={isEdit ? 'warning' : 'primary'} 
              size="small" 
            />
          </Box>

          {loading && <LinearProgress sx={{ mb: 3 }} />}

          <Box component="form" onSubmit={handleSubmit}>
            {/* Essential Fields - Single Row */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  Essential Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Asset Symbol"
                      value={formData.assetSymbol}
                      onChange={(e) => handleInputChange('assetSymbol', e.target.value)}
                      disabled={loading}
                      error={!!errors.assetSymbol}
                      helperText={errors.assetSymbol}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Snapshot Date"
                      value={formData.snapshotDate}
                      onChange={(e) => handleInputChange('snapshotDate', e.target.value)}
                      disabled={loading}
                      error={!!errors.snapshotDate}
                      helperText={errors.snapshotDate}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Position Data - Compact */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  Position Data
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Quantity"
                      type="number"
                      inputProps={{ step: "0.00000001" }}
                      value={formData.quantity}
                      onChange={(e) => {
                        handleInputChange('quantity', parseFloat(e.target.value) || 0);
                        calculateDerivedValues();
                      }}
                      disabled={loading}
                      error={!!errors.quantity}
                      helperText={errors.quantity}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Current Price"
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={formData.currentPrice}
                      onChange={(e) => {
                        handleInputChange('currentPrice', parseFloat(e.target.value) || 0);
                        calculateDerivedValues();
                      }}
                      disabled={loading}
                      error={!!errors.currentPrice}
                      helperText={errors.currentPrice}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Cost Basis"
                      type="number"
                      inputProps={{ step: "0.01" }}
                      value={formData.costBasis}
                      onChange={(e) => {
                        handleInputChange('costBasis', parseFloat(e.target.value) || 0);
                        calculateDerivedValues();
                      }}
                      disabled={loading}
                      error={!!errors.costBasis}
                      helperText={errors.costBasis}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Calculated Values - Visual Cards */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  Calculated Values
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.08), 
                      borderRadius: 1,
                      textAlign: 'center',
                      border: 1,
                      borderColor: alpha(theme.palette.primary.main, 0.2)
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Current Value
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {formatCurrency(formData.currentValue)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: alpha(formData.totalPl >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.08), 
                      borderRadius: 1,
                      textAlign: 'center',
                      border: 1,
                      borderColor: alpha(formData.totalPl >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.2)
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total P&L
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: formData.totalPl >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {formatCurrency(formData.totalPl)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.info.main, 0.08), 
                      borderRadius: 1,
                      textAlign: 'center',
                      border: 1,
                      borderColor: alpha(theme.palette.info.main, 0.2)
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Return %
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          color: formData.returnPercentage >= 0 ? 'success.main' : 'error.main'
                        }}
                      >
                        {formatPercentage(formData.returnPercentage)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.warning.main, 0.08), 
                      borderRadius: 1,
                      textAlign: 'center',
                      border: 1,
                      borderColor: alpha(theme.palette.warning.main, 0.2)
                    }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Allocation %
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.main' }}>
                        {formatPercentage(formData.allocationPercentage)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Advanced Fields - Collapsible */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  Advanced Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Granularity</InputLabel>
                      <Select
                        value={formData.granularity}
                        onChange={(e) => handleInputChange('granularity', e.target.value as SnapshotGranularity)}
                        disabled={loading}
                        label="Granularity"
                      >
                        <MenuItem value={SnapshotGranularity.DAILY}>Daily</MenuItem>
                        <MenuItem value={SnapshotGranularity.WEEKLY}>Weekly</MenuItem>
                        <MenuItem value={SnapshotGranularity.MONTHLY}>Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Notes"
                      multiline
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      disabled={loading}
                      placeholder="Optional notes..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Hidden Fields for API */}
            <input type="hidden" name="portfolioId" value={formData.portfolioId} />
            <input type="hidden" name="assetId" value={formData.assetId} />
            <input type="hidden" name="createdBy" value={formData.createdBy} />

            {/* Form Actions */}
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={onCancel}
                disabled={loading}
                sx={{ textTransform: 'none', minWidth: 100 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={{ textTransform: 'none', minWidth: 140 }}
              >
                {loading ? 'Saving...' : (isEdit ? 'Update Snapshot' : 'Create Snapshot')}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
