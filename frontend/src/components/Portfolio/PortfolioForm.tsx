/**
 * Portfolio form component for creating and editing portfolios
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextField,
  Box,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CreatePortfolioDto, UpdatePortfolioDto, Portfolio } from '../../types';
import { useAccount } from '../../contexts/AccountContext';
import { ResponsiveButton, ActionButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { PublicPortfolioSelector } from './PublicPortfolioSelector';
import { usePermissions } from '../../hooks/usePermissions';

interface PortfolioFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePortfolioDto | UpdatePortfolioDto) => void;
  onCopyFromPublic?: (sourcePortfolioId: string, name: string) => void;
  initialData?: Partial<CreatePortfolioDto>;
  isEditing?: boolean;
  isLoading?: boolean;
  error?: string;
}

const schema = yup.object({
  name: yup.string().required('Portfolio name is required').min(2, 'Name must be at least 2 characters'),
  baseCurrency: yup.string().required('Base currency is required'),
  fundingSource: yup.string().optional(),
  accountId: yup.string().required('Account ID is required'),
});

// const currencies = [
//   { code: 'VND', name: 'Vietnamese Dong' },
//   { code: 'USD', name: 'US Dollar' }
// ];

const PortfolioForm: React.FC<PortfolioFormProps> = ({
  open,
  onClose,
  onSubmit,
  onCopyFromPublic,
  initialData,
  isEditing = false,
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const { hasPermission } = usePermissions();
  const [creationMode, setCreationMode] = useState<'create' | 'copy'>('create');
  const [selectedPublicPortfolio, setSelectedPublicPortfolio] = useState<Portfolio | null>(null);
  const [showPublicSelector, setShowPublicSelector] = useState(false);
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [description, setDescription] = useState('');
  const [templateName, setTemplateName] = useState('');
  
  const canManageVisibility = hasPermission('portfolio.visibility.manage');
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePortfolioDto>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      baseCurrency: initialData?.baseCurrency || 'VND',
      fundingSource: initialData?.fundingSource || '',
      accountId: initialData?.accountId || accountId,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        name: initialData?.name || '',
        baseCurrency: initialData?.baseCurrency || 'VND',
        fundingSource: initialData?.fundingSource || '',
        accountId: initialData?.accountId || accountId,
      });
      
      // Load visibility data when editing
      if (isEditing && initialData) {
        //   visibility: initialData.visibility,
        //   description: initialData.description,
        //   templateName: initialData.templateName
        // });
        setVisibility(initialData.visibility || 'PRIVATE');
        setDescription(initialData.description || '');
        setTemplateName(initialData.templateName || '');
      }
    }
  }, [open, initialData, reset, accountId, isEditing]);


  const handleClose = () => {
    reset();
    setCreationMode('create');
    setSelectedPublicPortfolio(null);
    setShowPublicSelector(false);
    setVisibility('PRIVATE');
    setDescription('');
    setTemplateName('');
    onClose();
  };

  const handleModeChange = (mode: 'create' | 'copy') => {
    setCreationMode(mode);
    if (mode === 'create') {
      setSelectedPublicPortfolio(null);
      setShowPublicSelector(false);
    }
  };

  const handlePublicPortfolioSelect = (portfolio: Portfolio) => {
    setSelectedPublicPortfolio(portfolio);
    setShowPublicSelector(false);
    // Update form with portfolio name and copy baseCurrency and fundingSource from template
    reset({
      name: `${portfolio.templateName || portfolio.name} Copy`,
      baseCurrency: portfolio.baseCurrency,
      fundingSource: portfolio.fundingSource || '',
      accountId: accountId || '',
    });
  };

  const handleFormSubmit = (data: CreatePortfolioDto) => {
    if (creationMode === 'copy' && selectedPublicPortfolio && onCopyFromPublic) {
      onCopyFromPublic(selectedPublicPortfolio.portfolioId, data.name);
    } else {
      const submitData = { ...data };
      
      // Only include visibility data when editing
      if (isEditing) {
        submitData.visibility = visibility;
        submitData.description = visibility === 'PUBLIC' ? description : undefined;
        submitData.templateName = visibility === 'PUBLIC' ? templateName : undefined;
      }
      
      onSubmit(submitData);
    }
  };

  return (
    <>
      <ModalWrapper
      open={open}
      onClose={handleClose}
      title={isEditing ? t('portfolio.form.editTitle') : t('portfolio.form.createTitle')}
      maxWidth="sm"
      fullWidth
      loading={isLoading}
      actions={
        <>
          <ResponsiveButton onClick={handleClose} disabled={isLoading} mobileText={t('common.cancel')} desktopText={t('common.cancel')}>
            {t('common.cancel')}
          </ResponsiveButton>
          <ActionButton
            onClick={handleSubmit(handleFormSubmit)}
            variant="contained"
            disabled={isLoading || (creationMode === 'copy' && !selectedPublicPortfolio)}
            forceTextOnly={true}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
            mobileText={isLoading ? t('portfolio.form.saving') : isEditing ? t('common.update') : t('common.create')}
            desktopText={isLoading ? t('portfolio.form.saving') : isEditing ? t('common.update') : t('common.create')}
          >
            {isLoading ? t('portfolio.form.saving') : isEditing ? t('common.update') : t('common.create')}
          </ActionButton>
        </>
      }
    >
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                '& .MuiAlert-message': {
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }
              }}
            >
              {error}
            </Alert>
          )}

          {/* Creation Mode Toggle - Only for new portfolios */}
          {!isEditing && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('portfolio.form.creationMode.title')}
              </Typography>
              <ToggleButtonGroup
                value={creationMode}
                exclusive
                onChange={(_, value) => value && handleModeChange(value)}
                fullWidth
              >
                <ToggleButton value="create">
                  <AddIcon sx={{ mr: 1 }} />
                  {t('portfolio.form.creationMode.createNew')}
                </ToggleButton>
                <ToggleButton value="copy">
                  <CopyIcon sx={{ mr: 1 }} />
                  {t('portfolio.form.creationMode.copyFromTemplate')}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Public Portfolio Selection */}
          {!isEditing && creationMode === 'copy' && (
            <Box sx={{ mb: 3 }}>
              {selectedPublicPortfolio ? (
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{selectedPublicPortfolio.templateName || selectedPublicPortfolio.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedPublicPortfolio.description || 'No description available'}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip label={selectedPublicPortfolio.baseCurrency} size="small" />
                          <Chip 
                            label={`${selectedPublicPortfolio.trades?.length || 0} trades`} 
                            size="small" 
                            sx={{ ml: 1 }} 
                          />
                        </Box>
                      </Box>
                      <IconButton onClick={() => setShowPublicSelector(true)}>
                        <SearchIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ textAlign: 'center', pt: 0 }}>
                  <Typography variant="body1" gutterBottom>
                    {t('portfolio.form.templateSelector.selectTemplate')}
                  </Typography>
                  <ResponsiveButton
                    onClick={() => setShowPublicSelector(true)}
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    forceTextOnly={true}
                  >
                    {t('portfolio.form.templateSelector.browseTemplates')}
                  </ResponsiveButton>
                </Box>
              )}
            </Box>
          )}

          <Box display="flex" flexDirection="column" gap={2}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('portfolio.form.fields.name')}
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder={t('portfolio.form.fields.namePlaceholder')}
                />
              )}
            />

            {/* Only show baseCurrency and fundingSource when not copying from template */}
            {!(!isEditing && creationMode === 'copy') && (
              <>
                <Controller
                  name="fundingSource"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('portfolio.form.fields.fundingSource')}
                      fullWidth
                      error={!!errors.fundingSource}
                      helperText={errors.fundingSource?.message}
                      placeholder={t('portfolio.form.fields.fundingSourcePlaceholder')}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />

                {/* <Controller
                  name="baseCurrency"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.baseCurrency}>
                      <InputLabel>{t('portfolio.form.fields.baseCurrency')}</InputLabel>
                      <Select {...field} label={t('portfolio.form.fields.baseCurrency')} disabled={true}>
                        {currencies.map((currency) => (
                          <MenuItem key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.baseCurrency && (
                        <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                          {errors.baseCurrency.message}
                        </Box>
                      )}
                    </FormControl>
                  )}
                /> */}
              </>
            )}

          </Box>

          {/* Portfolio Visibility Settings - Only for editing portfolios and users with permission */}
          {isEditing && canManageVisibility && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              
              <Tooltip 
                title="Control who can view and copy this portfolio. Public portfolios can be copied by other users."
                placement="top"
                arrow
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={visibility === 'PUBLIC'}
                      onChange={(e) => setVisibility(e.target.checked ? 'PUBLIC' : 'PRIVATE')}
                      color="primary"
                    />
                  }
                  label={visibility === 'PUBLIC' ? t('portfolio.form.visibility.public') : t('portfolio.form.visibility.private')}
                />
              </Tooltip>
              
              {visibility === 'PUBLIC' && (
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={t('portfolio.form.fields.templateName')}
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    fullWidth
                    placeholder={t('portfolio.form.fields.templateNamePlaceholder')}
                    helperText={t('portfolio.form.fields.templateNameHelper')}
                  />
                  <TextField
                    label={t('portfolio.form.fields.description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={t('portfolio.form.fields.descriptionPlaceholder')}
                    helperText={t('portfolio.form.fields.descriptionHelper')}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </ModalWrapper>

      {/* Public Portfolio Selector Modal */}
      <PublicPortfolioSelector
        open={showPublicSelector}
        onClose={() => setShowPublicSelector(false)}
        onSelect={handlePublicPortfolioSelect}
      />
    </>
  );
};

export default PortfolioForm;
