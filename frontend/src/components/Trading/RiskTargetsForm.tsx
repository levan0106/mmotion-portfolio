import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PositionResponseDto } from '../../types/trading';
import { ResponsiveButton, ActionButton } from '../Common';

// Validation schema
const riskTargetsSchema = yup.object({
  stopLoss: yup
    .number()
    .min(0.01, 'Stop loss must be at least 0.01')
    .optional(),
  takeProfit: yup
    .number()
    .min(0.01, 'Take profit must be at least 0.01')
    .optional(),
  isActive: yup.boolean().optional(),
});

export interface RiskTargetsFormData {
  stopLoss?: number;
  takeProfit?: number;
  isActive?: boolean;
}

export interface RiskTargetsFormProps {
  position: PositionResponseDto;
  onSubmit: (data: RiskTargetsFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  initialData?: Partial<RiskTargetsFormData>;
}

/**
 * RiskTargetsForm component for setting stop-loss and take-profit targets.
 * Provides validation and real-time calculations for risk management.
 */
export const RiskTargetsForm: React.FC<RiskTargetsFormProps> = ({
  position,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  initialData,
}) => {
  const [stopLossDistance, setStopLossDistance] = useState<number>(0);
  const [takeProfitDistance, setTakeProfitDistance] = useState<number>(0);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RiskTargetsFormData>({
    resolver: yupResolver(riskTargetsSchema),
    defaultValues: {
      stopLoss: initialData?.stopLoss || undefined,
      takeProfit: initialData?.takeProfit || undefined,
      isActive: initialData?.isActive ?? true,
    },
  });

  const watchedStopLoss = watch('stopLoss');
  const watchedTakeProfit = watch('takeProfit');
  const watchedIsActive = watch('isActive');

  // Calculate distances from current price
  useEffect(() => {
    if (watchedStopLoss) {
      const distance = ((watchedStopLoss - position.marketPrice) / position.marketPrice) * 100;
      setStopLossDistance(distance);
    } else {
      setStopLossDistance(0);
    }
  }, [watchedStopLoss, position.marketPrice]);

  useEffect(() => {
    if (watchedTakeProfit) {
      const distance = ((watchedTakeProfit - position.marketPrice) / position.marketPrice) * 100;
      setTakeProfitDistance(distance);
    } else {
      setTakeProfitDistance(0);
    }
  }, [watchedTakeProfit, position.marketPrice]);

  const handleFormSubmit = async (data: RiskTargetsFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      console.error('Error submitting risk targets form:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num / 100);
  };

  const getDistanceColor = (distance: number) => {
    if (distance > 0) return 'success';
    if (distance < 0) return 'error';
    return 'default';
  };

  const getDistanceIcon = (distance: number) => {
    if (distance > 0) return '↗';
    if (distance < 0) return '↘';
    return '→';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="h5" component="h2">
            Set Risk Targets
          </Typography>
          <Chip
            label={`${position.assetSymbol} - ${position.assetName}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Position Summary */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200',
            mb: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Current Position
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="h6">
                {formatCurrency(position.marketPrice)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Quantity
              </Typography>
              <Typography variant="h6">
                {position.quantity.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Market Value
              </Typography>
              <Typography variant="h6">
                {formatCurrency(position.marketValue)}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Unrealized P&L
              </Typography>
              <Typography
                variant="h6"
                color={position.unrealizedPl >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(position.unrealizedPl)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={3}>
            {/* Stop Loss */}
            <Grid item xs={12} md={6}>
              <Controller
                name="stopLoss"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Stop Loss Price"
                    type="number"
                    fullWidth
                    error={!!errors.stopLoss}
                    helperText={errors.stopLoss?.message}
                    disabled={isLoading}
                    inputProps={{ step: '0.01', min: '0.01' }}
                    placeholder="Enter stop loss price"
                  />
                )}
              />
              {watchedStopLoss && (
                <Box mt={1}>
                  <Chip
                    label={`${getDistanceIcon(stopLossDistance)} ${formatPercentage(Math.abs(stopLossDistance))}`}
                    color={getDistanceColor(stopLossDistance)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {stopLossDistance > 0 ? 'above' : 'below'} current price
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Take Profit */}
            <Grid item xs={12} md={6}>
              <Controller
                name="takeProfit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Take Profit Price"
                    type="number"
                    fullWidth
                    error={!!errors.takeProfit}
                    helperText={errors.takeProfit?.message}
                    disabled={isLoading}
                    inputProps={{ step: '0.01', min: '0.01' }}
                    placeholder="Enter take profit price"
                  />
                )}
              />
              {watchedTakeProfit && (
                <Box mt={1}>
                  <Chip
                    label={`${getDistanceIcon(takeProfitDistance)} ${formatPercentage(Math.abs(takeProfitDistance))}`}
                    color={getDistanceColor(takeProfitDistance)}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {takeProfitDistance > 0 ? 'above' : 'below'} current price
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Active Switch */}
            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        {...field}
                        checked={field.value}
                        disabled={isLoading}
                      />
                    }
                    label="Active Risk Targets"
                  />
                )}
              />
            </Grid>

            {/* Risk Summary */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Risk Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Max Loss
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {watchedStopLoss 
                        ? formatCurrency((position.marketPrice - watchedStopLoss) * position.quantity)
                        : 'Not set'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Max Gain
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {watchedTakeProfit 
                        ? formatCurrency((watchedTakeProfit - position.marketPrice) * position.quantity)
                        : 'Not set'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Risk/Reward Ratio
                    </Typography>
                    <Typography variant="h6">
                      {watchedStopLoss && watchedTakeProfit 
                        ? ((watchedTakeProfit - position.marketPrice) / (position.marketPrice - watchedStopLoss)).toFixed(2)
                        : 'N/A'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={watchedIsActive ? 'Active' : 'Inactive'}
                      color={watchedIsActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                {onCancel && (
                  <ResponsiveButton
                    variant="outlined"
                    onClick={onCancel}
                    disabled={isLoading}
                    forceTextOnly={true}
                    mobileText="Cancel"
                    desktopText="Cancel"
                  >
                    Cancel
                  </ResponsiveButton>
                )}
                <ActionButton
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={!isValid || isLoading}
                  icon={isLoading ? <CircularProgress size={20} /> : undefined}
                  forceTextOnly={true}
                  mobileText={isLoading ? 'Saving...' : 'Save Risk Targets'}
                  desktopText={isLoading ? 'Saving...' : 'Save Risk Targets'}
                >
                  {isLoading ? 'Saving...' : 'Save Risk Targets'}
                </ActionButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default RiskTargetsForm;
