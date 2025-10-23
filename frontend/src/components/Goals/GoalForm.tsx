import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  Autocomplete,
} from '@mui/material';
import {
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
  GoalStatus,
} from '../../types/goal.types';
import { usePortfolios } from '../../hooks/usePortfolios';
import { goalApi } from '../../services/api.goal';
import { ModalWrapper } from '../Common/ModalWrapper';
import MoneyInput from '../Common/MoneyInput';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { useTranslation } from 'react-i18next';

interface GoalFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalRequest | UpdateGoalRequest) => void;
  goal?: Goal;
  loading?: boolean;
  accountId: string;
}


const getPriorityOptions = (t: any) => [
  { value: 5, label: t('goals.priority.highest') },
  { value: 4, label: t('goals.priority.high') },
  { value: 3, label: t('goals.priority.medium') },
  { value: 2, label: t('goals.priority.low') },
  { value: 1, label: t('goals.priority.lowest') },
];

export const GoalForm: React.FC<GoalFormProps> = ({
  open,
  onClose,
  onSubmit,
  goal,
  loading = false,
  accountId,
}) => {
  const { t } = useTranslation();
  const { portfolios = [] } = usePortfolios(accountId);
  const [availablePortfolios, setAvailablePortfolios] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateGoalRequest>({
    portfolioIds: [],
    name: '',
    description: '',
    targetValue: 0,
    targetDate: undefined,
    priority: 3,
    status: GoalStatus.ACTIVE,
    isPrimary: false,
    autoTrack: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load available portfolios only once when component mounts
  useEffect(() => {
    if (accountId) {
      goalApi.getAvailablePortfolios(accountId)
        .then(response => {
          // Set available portfolios directly
          setAvailablePortfolios(response.portfolios);
        })
        .catch(error => {
          console.error('Error loading available portfolios:', error);
        });
    }
  }, [accountId]); // Only depend on accountId

  // Set default portfolio when available portfolios load
  useEffect(() => {
    if (availablePortfolios.length > 0 && formData.portfolioIds.length === 0) {
      // Only set default if creating new goal and there are available portfolios
      if (!goal) {
        setFormData(prev => ({ ...prev, portfolioIds: [availablePortfolios[0].portfolioId] }));
      }
    }
  }, [availablePortfolios, goal]);


  useEffect(() => {
    if (goal) {
      setFormData({
        portfolioIds: goal.portfolioId || [],
        name: goal.name || '',
        description: goal.description || '',
        targetValue: goal.targetValue || 0,
        targetDate: goal.targetDate || undefined,
        priority: goal.priority || 3,
        status: goal.status || GoalStatus.ACTIVE,
        isPrimary: goal.isPrimary || false,
        autoTrack: goal.autoTrack !== undefined ? goal.autoTrack : true,
      });
    } else {
      setFormData({
        portfolioIds: [],
        name: '',
        description: '',
        targetValue: 0,
        targetDate: undefined,
        priority: 3,
        status: GoalStatus.ACTIVE,
        isPrimary: false,
        autoTrack: true,
      });
    }
    setErrors({});
  }, [goal, open]);

  // Ensure portfolios are loaded before setting formData for edit mode
  useEffect(() => {
    if (goal && portfolios.length > 0 && formData.portfolioIds.length === 0) {
      setFormData(prev => ({
        ...prev,
        portfolioIds: goal.portfolioId || [],
      }));
    }
  }, [goal, portfolios, formData.portfolioIds.length]);

  const handleChange = (field: string, value: any) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.portfolioIds || formData.portfolioIds.length === 0) {
      // Check if there are any available portfolios
      if (availablePortfolios.length === 0 && !goal) {
        newErrors.portfolioIds = t('goals.form.noPortfolios');
      } else {
        newErrors.portfolioIds = t('goals.form.selectPortfolio');
      }
    }

    if (!formData.name.trim()) {
      newErrors.name = t('goals.form.nameRequired');
    }

    if (!formData.targetValue || formData.targetValue <= 0) {
      newErrors.targetValue = t('goals.form.valueRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    setFormData({
      portfolioIds: [],
      name: '',
      description: '',
      targetValue: 0,
      targetDate: undefined,
      priority: 3,
      status: GoalStatus.ACTIVE,
      isPrimary: false,
      autoTrack: true,
    });
    setErrors({});
    onClose();
  };

  const actions = (
    <Stack direction="row" gap={2}>
      <Button 
        onClick={handleClose} 
        disabled={loading}
        sx={{ 
          textTransform: 'none',
          fontWeight: 500,
          px: 3
        }}
      >
        {t('common.cancel')}
      </Button>
      <Button 
        onClick={handleSubmit} 
        variant="contained" 
        disabled={loading}
        sx={{ 
          textTransform: 'none',
          fontWeight: 500,
          px: 3,
          borderRadius: 2
        }}
      >
        {loading ? t('goals.form.saving') : (goal ? t('goals.form.update') : t('goals.form.create'))}
      </Button>
    </Stack>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={goal ? t('goals.edit') : t('goals.create')}
      actions={actions}
      loading={loading}
      maxWidth="md"
      size="large"
    >
        <ResponsiveTypography variant="pageTitle" color="text.secondary" mb={3}>
          {goal ? t('goals.form.editTitle') : t('goals.form.title')}
        </ResponsiveTypography>
        
        <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  key={goal?.id || 'new'}
                  multiple
                  options={availablePortfolios}
                  getOptionLabel={(option) => option.name || ''}
                  value={(() => {
                    if (!formData.portfolioIds || formData.portfolioIds.length === 0) {
                      return [];
                    }
                    return availablePortfolios.filter(portfolio => 
                      formData.portfolioIds.includes(portfolio.portfolioId)
                    );
                  })()}
                  onChange={(_, newValue) => {
                    const selectedIds = newValue.map(portfolio => portfolio.portfolioId);
                    handleChange('portfolioIds', selectedIds);
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.portfolioId}
                        label={option.name}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('goals.form.linkedPortfolios')}
                      error={!!errors.portfolioIds}
                      helperText={errors.portfolioIds}
                      InputLabelProps={{
                        children: (
                          <ResponsiveTypography variant="body2" fontWeight={500}>
                            {t('goals.form.linkedPortfolios')}
                          </ResponsiveTypography>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <ResponsiveTypography variant="body2">
                            {option.name}
                          </ResponsiveTypography>
                        </Stack>
                      </Box>
                    );
                  }}
                  isOptionEqualToValue={(option, value) => 
                    option.portfolioId === value.portfolioId
                  }
                  noOptionsText={
                    goal 
                      ? t('goals.form.noPortfoliosEdit')
                      : t('goals.form.noPortfolios')
                  }
                  loadingText={t('common.loading')}
                  size="medium"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('goals.form.name')}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  placeholder={t('goals.form.namePlaceholder')}
                  InputLabelProps={{
                    children: (
                      <ResponsiveTypography variant="body2" fontWeight={500}>
                        {t('goals.form.name')}
                      </ResponsiveTypography>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('goals.form.description')}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={2}
                  placeholder={t('goals.form.descriptionPlaceholder')}
                  InputLabelProps={{
                    children: (
                      <ResponsiveTypography variant="body2" fontWeight={500}>
                        {t('goals.form.description')}
                      </ResponsiveTypography>
                    )
                  }}
                />
              </Grid>


              <Grid item xs={12} sm={4}>
                <MoneyInput
                  value={formData.targetValue || 0}
                  onChange={(value) => handleChange('targetValue', value)}
                  label={t('goals.form.targetValue')}
                  placeholder={t('goals.form.targetValuePlaceholder')}
                  error={!!errors.targetValue}
                  helperText={errors.targetValue}
                  currency="VND"
                  showCurrency={true}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label={t('goals.form.targetDate')}
                  type="date"
                  fullWidth
                  value={formData.targetDate || ''}
                  onChange={(e) => handleChange('targetDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>
                    <ResponsiveTypography variant="body2" fontWeight={500}>
                      {t('goals.form.priority')}
                    </ResponsiveTypography>
                  </InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', Number(e.target.value))}
                    label={t('goals.form.priority')}
                  >
                    {getPriorityOptions(t).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <ResponsiveTypography variant="body2">
                          {option.label}
                        </ResponsiveTypography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" gap={3} flexWrap="wrap" alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.status === GoalStatus.ACTIVE}
                        onChange={(e) => handleChange('status', e.target.checked ? GoalStatus.ACTIVE : GoalStatus.PAUSED)}
                        color="primary"
                      />
                    }
                    label={
                      <ResponsiveTypography variant="body2" fontWeight={500}>
                        {formData.status === GoalStatus.ACTIVE ? t('goals.status.active') : t('goals.status.paused')}
                      </ResponsiveTypography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPrimary}
                        onChange={(e) => handleChange('isPrimary', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <ResponsiveTypography variant="body2" fontWeight={500}>
                        {t('goals.form.isPrimary')}
                      </ResponsiveTypography>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoTrack}
                        onChange={(e) => handleChange('autoTrack', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <ResponsiveTypography variant="body2" fontWeight={500}>
                        {t('goals.form.autoTrack')}
                      </ResponsiveTypography>
                    }
                  />
                </Stack>
              </Grid>
            </Grid>
      </ModalWrapper>
  );
};
