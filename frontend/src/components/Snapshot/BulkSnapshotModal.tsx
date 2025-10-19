// BulkSnapshotModal Component for CR-006 Asset Snapshot System

import React, { useState, useEffect } from 'react';
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Box,
  alpha,
  useTheme,
  Chip,
} from '@mui/material';
import {
  CameraAlt as SnapshotIcon,
  Add as AddIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';

interface Portfolio {
  portfolioId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface BulkSnapshotModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (portfolioId: string, snapshotDate: string) => void;
  onError?: (error: string) => void;
  onPortfolioRefresh?: (portfolioId: string) => void; // Add portfolio refresh callback
  selectedPortfolioId?: string; // Add selected portfolio ID prop
}

export const BulkSnapshotModal: React.FC<BulkSnapshotModalProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  onPortfolioRefresh,
  selectedPortfolioId,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioIdState, setSelectedPortfolioIdState] = useState<string>('');
  const [granularity, setGranularity] = useState<SnapshotGranularity>(SnapshotGranularity.DAILY);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  
  // Date range mode state
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0] // today
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0] // today
  );

  const selectedPortfolio = portfolios.find(p => p.portfolioId === selectedPortfolioIdState);

  // Function to refresh portfolio data after snapshot creation
  const refreshPortfolioData = async (portfolioId: string) => {
    try {
      // Invalidate React Query cache for portfolio-related data
      const invalidationPromises = [
        queryClient.invalidateQueries(['portfolio', portfolioId]),
        queryClient.invalidateQueries(['portfolio-analytics', portfolioId]),
        queryClient.invalidateQueries(['portfolio-snapshots', portfolioId]),
        queryClient.invalidateQueries(['snapshots', portfolioId]),
        queryClient.invalidateQueries(['portfolio-performance', portfolioId]),
        queryClient.invalidateQueries(['portfolio-allocation', portfolioId]),
        queryClient.invalidateQueries(['portfolio-positions', portfolioId]),
      ];
      
      await Promise.all(invalidationPromises);
      // Call custom refresh callback if provided
      if (onPortfolioRefresh) {
        onPortfolioRefresh(portfolioId);
      }
    } catch (error) {
      console.error('❌ Error refreshing portfolio data:', error);
    }
  };

  // Load portfolios from portfolio table
  useEffect(() => {
    if (open) {
      loadPortfolios();
      // Set default selected portfolio if provided
      if (selectedPortfolioId) {
        setSelectedPortfolioIdState(selectedPortfolioId);
      }
    }
  }, [open, selectedPortfolioId]);

  const loadPortfolios = async () => {
    setIsLoadingPortfolios(true);
    try {
      const response = await apiService.api.get('/api/v1/portfolios', {
        params: {
          accountId: accountId
        }
      });
      setPortfolios(response.data || []);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      setStatus({
        type: 'error',
        message: t('snapshots.modals.createSnapshot.failedToLoadPortfolios')
      });
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedPortfolioIdState || !granularity) {
      setStatus({
        type: 'error',
        message: t('snapshots.modals.createSnapshot.selectPortfolioAndGranularity')
      });
      return;
    }

    if (!startDate) {
      setStatus({
        type: 'error',
        message: t('snapshots.modals.createSnapshot.selectStartDate')
      });
      return;
    }

    if (useDateRange && !endDate) {
      setStatus({
        type: 'error',
        message: t('snapshots.modals.createSnapshot.selectEndDate')
      });
      return;
    }

    if (useDateRange && new Date(startDate) > new Date(endDate)) {
      setStatus({
        type: 'error',
        message: t('snapshots.modals.createSnapshot.startDateBeforeEndDate')
      });
      return;
    }

    if (new Date(startDate) > new Date()) {
      setStatus({
        type: 'error',
        message: t('snapshots.modals.createSnapshot.startDateNotFuture')
      });
      return;
    }

    setIsCreating(true);
    setStatus({ type: null, message: '' });

    try {
      // Use unified endpoint for both single date and date range
      // Calculate timeout based on date range size
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const timeoutMs = Math.max(60000, daysDiff * 3000); // 3 seconds per day, minimum 60 seconds
      
      // Show progress message for large date ranges
      if (daysDiff > 7) {
        setStatus({
          type: 'info',
          message: t('snapshots.modals.createSnapshot.processingDays', { days: daysDiff })
        });
      }
      
      const response = await apiService.api.post(
        '/api/v1/snapshots/portfolio/bulk',
        {
          portfolioIds: [selectedPortfolioIdState],
          ...(useDateRange 
            ? {
                startDate: startDate,
                endDate: endDate,
                granularity: granularity,
                createdBy: accountId
              }
            : {
                startDate: startDate,
                granularity: granularity,
                createdBy: accountId
              })
        },
        { timeout: timeoutMs }
      );
      // Only show success if we get a valid response
      if (response && response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        
        if (responseData.totalSnapshots > 0) {
          setStatus({
            type: 'success',
            message: responseData.message || t('snapshots.modals.createSnapshot.successCreated', { 
              count: responseData.totalSnapshots, 
              portfolioName: selectedPortfolio?.name || 'portfolio' 
            })
          });
          
          // Call success callback
          onSuccess?.(selectedPortfolioIdState, startDate);
          
          // Auto-refresh portfolio data after successful snapshot creation
          await refreshPortfolioData(selectedPortfolioIdState);
          
          // Close modal after refresh is complete
          setTimeout(() => {
            handleReset();
            onClose();
          }, 400);
        } else {
          setStatus({
            type: 'info',
            message: responseData.message || t('snapshots.modals.createSnapshot.noSnapshotsCreated', { 
              portfolioName: selectedPortfolio?.name || 'portfolio' 
            })
          });
          
          // Close modal for info case too
          setTimeout(() => {
            handleReset();
            onClose();
          }, 500);
        }
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error: any) {
      console.error('Failed to create bulk snapshot:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
        }
      });
      
      const errorMessage = error.response?.data?.message || error.message || t('snapshots.modals.createSnapshot.errorCreating', {
        status: error.response?.status || 'Unknown',
        message: error.response?.data?.message || error.message || 'Unknown error'
      });
      
      setStatus({
        type: 'error',
        message: errorMessage
      });

      onError?.(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setSelectedPortfolioIdState('');
    setGranularity(SnapshotGranularity.DAILY);
    setUseDateRange(false);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setStatus({ type: null, message: '' });
  };

  const handleClose = () => {
    if (!isCreating) {
      handleReset();
      onClose();
    }
  };

  const modalIcon = (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '50%',
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
      }}
    >
      <SnapshotIcon fontSize="medium" />
    </Box>
  );

  const modalActions = (
    <>
      <ResponsiveButton
        variant="text"
        onClick={handleClose}
        disabled={isCreating}
        sx={{ textTransform: 'none' }}
      >
        {t('snapshots.modals.createSnapshot.cancel')}
      </ResponsiveButton>
      <ResponsiveButton
        variant="contained"
        icon={isCreating ? <CircularProgress size={20} /> : <AddIcon />}
        mobileText={t('snapshots.modals.createSnapshot.create')}
        desktopText={t('snapshots.modals.createSnapshot.createSnapshot')}
        onClick={handleCreateSnapshot}
        disabled={!selectedPortfolioIdState || !startDate || !granularity || isCreating || isLoadingPortfolios}
        sx={{ textTransform: 'none', minWidth: 140 }}
      >
        {isCreating ? t('snapshots.modals.createSnapshot.creating') : t('snapshots.modals.createSnapshot.createSnapshot')}
      </ResponsiveButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={t('snapshots.modals.createSnapshot.title')}
      icon={modalIcon}
      actions={modalActions}
      loading={isCreating}
      maxWidth="sm"
      titleColor="primary"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Portfolio Selection */}
          <FormControl fullWidth>
            <InputLabel>{t('snapshots.modals.createSnapshot.selectPortfolio')}</InputLabel>
            <Select
              value={selectedPortfolioIdState}
              onChange={(e) => setSelectedPortfolioIdState(e.target.value)}
              label={t('snapshots.modals.createSnapshot.selectPortfolio')}
              disabled={isCreating || isLoadingPortfolios}
            >
              {portfolios.map((portfolio) => (
                <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {portfolio.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        {portfolio.portfolioId}
                      </Typography>
                      {/* {portfolio.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {portfolio.description}
                        </Typography>
                      )} */}
                    </Box>
                    <Chip
                      label={`${t('snapshots.modals.createSnapshot.created')}: ${new Date(portfolio.createdAt).toLocaleDateString()}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date Range Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <ResponsiveButton
              variant={useDateRange ? 'contained' : 'outlined'}
              onClick={() => setUseDateRange(!useDateRange)}
              disabled={isCreating}
              icon={<AddIcon />}
              size="small"
            >
              {useDateRange ? t('snapshots.modals.createSnapshot.singleDateMode') : t('snapshots.modals.createSnapshot.dateRangeMode')}
            </ResponsiveButton>
            <Typography variant="body2" color="text.secondary">
              {useDateRange ? t('snapshots.modals.createSnapshot.singleDateModeDescription') : t('snapshots.modals.createSnapshot.dateRangeModeDescription')}
            </Typography>
          </Box>

          {/* Date Selection - Conditional based on mode */}
          {!useDateRange ? (
            <TextField
              fullWidth
              type="date"
              label={t('snapshots.modals.createSnapshot.snapshotDate')}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isCreating}
              // helperText={t('snapshots.modals.createSnapshot.selectDate')}
            />
          ) : (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                type="date"
                label={t('snapshots.modals.createSnapshot.startDate')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={isCreating}
                // helperText={t('snapshots.modals.createSnapshot.startDateHelper')}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <TextField
                type="date"
                label={t('snapshots.modals.createSnapshot.endDate')}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={isCreating}
                // helperText={t('snapshots.modals.createSnapshot.endDateHelper')}
                sx={{ flex: 1, minWidth: 200 }}
              />
            </Box>
          )}
          {/* Status Alert */}
          {status.type && (
            <Alert 
              severity={status.type} 
              icon={
                status.type === 'success' ? <SuccessIcon /> : 
                status.type === 'info' ? <WarningIcon /> : 
                <ErrorIcon />
              }
              onClose={() => setStatus({ type: null, message: '' })}
            >
              {status.message}
            </Alert>
          )}

      </Box>
    </ModalWrapper>
  );
};
