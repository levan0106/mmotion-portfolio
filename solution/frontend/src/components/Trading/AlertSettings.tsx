import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Grid,
  Divider,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ResponsiveButton, ActionButton } from '../Common';
import { Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';

// Validation schema
const alertSettingsSchema = yup.object({
  emailAlerts: yup.boolean().optional(),
  smsAlerts: yup.boolean().optional(),
  pushNotifications: yup.boolean().optional(),
  emailAddress: yup.string().email('Invalid email address').optional(),
  phoneNumber: yup.string().optional(),
  alertFrequency: yup.string().oneOf(['IMMEDIATE', 'DAILY', 'WEEKLY']).optional(),
  priceChangeThreshold: yup.number().min(0.1).max(50).optional(),
  volumeThreshold: yup.number().min(1).max(1000).optional(),
});

export interface AlertSettingsData {
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  pushNotifications?: boolean;
  emailAddress?: string;
  phoneNumber?: string;
  alertFrequency?: 'IMMEDIATE' | 'DAILY' | 'WEEKLY';
  priceChangeThreshold?: number;
  volumeThreshold?: number;
}

export interface AlertSettingsProps {
  onSubmit: (data: AlertSettingsData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string;
  initialData?: Partial<AlertSettingsData>;
}

/**
 * AlertSettings component for configuring risk alert preferences.
 * Allows users to set up email, SMS, and push notification preferences.
 */
export const AlertSettings: React.FC<AlertSettingsProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  initialData,
}) => {
  const [priceThreshold, setPriceThreshold] = useState(initialData?.priceChangeThreshold || 5);
  const [volumeThreshold, setVolumeThreshold] = useState(initialData?.volumeThreshold || 100);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<AlertSettingsData>({
    resolver: yupResolver(alertSettingsSchema),
    defaultValues: {
      emailAlerts: initialData?.emailAlerts ?? false,
      smsAlerts: initialData?.smsAlerts ?? false,
      pushNotifications: initialData?.pushNotifications ?? true,
      emailAddress: initialData?.emailAddress || '',
      phoneNumber: initialData?.phoneNumber || '',
      alertFrequency: initialData?.alertFrequency || 'IMMEDIATE',
      priceChangeThreshold: initialData?.priceChangeThreshold || 5,
      volumeThreshold: initialData?.volumeThreshold || 100,
    },
  });

  const watchedEmailAlerts = watch('emailAlerts');
  const watchedSmsAlerts = watch('smsAlerts');

  const handleFormSubmit = async (data: AlertSettingsData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      console.error('Error submitting alert settings:', err);
    }
  };

  const handlePriceThresholdChange = (_event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setPriceThreshold(value);
  };

  const handleVolumeThresholdChange = (_event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setVolumeThreshold(value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Alert Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Grid container spacing={3}>
            {/* Notification Methods */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Methods
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="pushNotifications"
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
                        label="Push Notifications"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="emailAlerts"
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
                        label="Email Alerts"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="smsAlerts"
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
                        label="SMS Alerts"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="emailAddress"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email Address"
                    type="email"
                    fullWidth
                    error={!!errors.emailAddress}
                    helperText={errors.emailAddress?.message}
                    disabled={isLoading || !watchedEmailAlerts}
                    placeholder="Enter your email address"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    type="tel"
                    fullWidth
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                    disabled={isLoading || !watchedSmsAlerts}
                    placeholder="Enter your phone number"
                  />
                )}
              />
            </Grid>

            {/* Alert Frequency */}
            <Grid item xs={12} md={6}>
              <Controller
                name="alertFrequency"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.alertFrequency}>
                    <InputLabel>Alert Frequency</InputLabel>
                    <Select
                      {...field}
                      label="Alert Frequency"
                      disabled={isLoading}
                    >
                      <MenuItem value="IMMEDIATE">Immediate</MenuItem>
                      <MenuItem value="DAILY">Daily Summary</MenuItem>
                      <MenuItem value="WEEKLY">Weekly Summary</MenuItem>
                    </Select>
                    {errors.alertFrequency && (
                      <Typography variant="caption" color="error">
                        {errors.alertFrequency.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Alert Thresholds */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Alert Thresholds
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Price Change Threshold: {priceThreshold}%
              </Typography>
              <Controller
                name="priceChangeThreshold"
                control={control}
                render={({ field }) => (
                  <Slider
                    {...field}
                    value={priceThreshold}
                    onChange={handlePriceThresholdChange}
                    min={0.1}
                    max={50}
                    step={0.1}
                    marks={[
                      { value: 1, label: '1%' },
                      { value: 5, label: '5%' },
                      { value: 10, label: '10%' },
                      { value: 25, label: '25%' },
                    ]}
                    disabled={isLoading}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary">
                Alert when price changes by this percentage
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Volume Threshold: {volumeThreshold}x
              </Typography>
              <Controller
                name="volumeThreshold"
                control={control}
                render={({ field }) => (
                  <Slider
                    {...field}
                    value={volumeThreshold}
                    onChange={handleVolumeThresholdChange}
                    min={1}
                    max={1000}
                    step={1}
                    marks={[
                      { value: 10, label: '10x' },
                      { value: 100, label: '100x' },
                      { value: 500, label: '500x' },
                      { value: 1000, label: '1000x' },
                    ]}
                    disabled={isLoading}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary">
                Alert when volume exceeds this multiple of average
              </Typography>
            </Grid>

            {/* Alert Types */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Alert Types
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Chip
                    label="Stop Loss Triggered"
                    color="error"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Chip
                    label="Take Profit Hit"
                    color="success"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Chip
                    label="Price Movement"
                    color="warning"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Chip
                    label="Volume Spike"
                    color="info"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Summary */}
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
                  Alert Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Notifications
                    </Typography>
                    <Typography variant="body2">
                      {watchedEmailAlerts ? 'Email' : ''} 
                      {watchedEmailAlerts && watchedSmsAlerts ? ', ' : ''}
                      {watchedSmsAlerts ? 'SMS' : ''}
                      {!watchedEmailAlerts && !watchedSmsAlerts ? 'Push only' : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Frequency
                    </Typography>
                    <Typography variant="body2">
                      {watch('alertFrequency')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Price Threshold
                    </Typography>
                    <Typography variant="body2">
                      {priceThreshold}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Volume Threshold
                    </Typography>
                    <Typography variant="body2">
                      {volumeThreshold}x
                    </Typography>
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
                    icon={<CloseIcon />}
                    mobileText="Cancel"
                    desktopText="Cancel"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </ResponsiveButton>
                )}
                <ActionButton
                  type="submit"
                  variant="contained"
                  size="large"
                  icon={<SaveIcon />}
                  mobileText="Save"
                  desktopText="Save Alert Settings"
                  disabled={!isValid || isLoading}
                  forceTextOnly={true}
                >
                  {isLoading ? 'Saving...' : 'Save Alert Settings'}
                </ActionButton>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default AlertSettings;
