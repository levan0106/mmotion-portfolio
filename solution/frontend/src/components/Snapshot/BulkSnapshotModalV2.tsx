// BulkSnapshotModalV2 Component for CR-006 Asset Snapshot System
// Enhanced version with multiple portfolio support

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
  FormControlLabel,
  Switch,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
} from '@mui/material';
import {
  CameraAlt as SnapshotIcon,
  Add as AddIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  SelectAll as SelectAllIcon,
  Deselect as DeselectIcon,
} from '@mui/icons-material';
import { ResponsiveButton, ActionButton } from '../Common';
import { ModalWrapper } from '../Common/ModalWrapper';
import { useAccount } from '../../contexts/AccountContext';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { usePortfolios } from '../../hooks/usePortfolios';
import { apiService } from '../../services/api';


interface BulkSnapshotModalV2Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: (portfolioId: string, snapshotDate: string) => void;
  onError?: (error: string) => void;
  onPortfolioRefresh?: (portfolioId: string) => void;
  selectedPortfolioId?: string;
}

export const BulkSnapshotModalV2: React.FC<BulkSnapshotModalV2Props> = ({
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
  const [selectedPortfolioIdState, setSelectedPortfolioIdState] = useState<string>('');
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>([]);
  const [useMultiplePortfolios, setUseMultiplePortfolios] = useState(true);
  const [granularity, setGranularity] = useState<SnapshotGranularity>(SnapshotGranularity.DAILY);
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });
  
  // State to store snapshot info for each portfolio
  const [portfolioSnapshotInfo, setPortfolioSnapshotInfo] = useState<Record<string, {
    lastSnapshotDate?: string;
    snapshotCount: number;
  }>>({});
  
  // Date range mode state
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0] // today
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0] // today
  );

  // Use existing hooks
  const { 
    portfolios = [], 
    isLoading: isLoadingPortfolios, 
    error: portfoliosError
  } = usePortfolios(accountId);

  const selectedPortfolio = portfolios.find((p: any) => p.portfolioId === selectedPortfolioIdState);

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

  // Set default selected portfolio if provided
  useEffect(() => {
    if (open && selectedPortfolioId) {
      setSelectedPortfolioIdState(selectedPortfolioId);
    }
  }, [open, selectedPortfolioId]);

  // Auto-select all portfolios when portfolios are loaded
  useEffect(() => {
    if (portfolios.length > 0 && useMultiplePortfolios) {
      setSelectedPortfolioIds(portfolios.map((p: any) => p.portfolioId));
    }
  }, [portfolios, useMultiplePortfolios]);

  // Auto-select all portfolios when switching to multiple mode
  useEffect(() => {
    if (useMultiplePortfolios && portfolios.length > 0) {
      setSelectedPortfolioIds(portfolios.map((p: any) => p.portfolioId));
    }
  }, [useMultiplePortfolios, portfolios]);

  // Load snapshot info for all portfolios when modal opens
  useEffect(() => {
    if (open && portfolios.length > 0 && accountId) {
      loadSnapshotInfoForAllPortfolios();
    }
  }, [open, portfolios, accountId]);

  const loadSnapshotInfoForAllPortfolios = async () => {
    try {
      // Get all snapshots for the account
      const allSnapshotsResponse = await apiService.api.get('/api/v1/snapshots', {
        params: {
          accountId: accountId
        }
      });
      const allSnapshots = allSnapshotsResponse?.data || [];
      
      // Process snapshot info for each portfolio
      const snapshotInfo: Record<string, { lastSnapshotDate?: string; snapshotCount: number }> = {};
      
      portfolios.forEach((portfolio: any) => {
        const portfolioSnapshots = allSnapshots.filter((snapshot: any) => 
          snapshot.portfolioId === portfolio.portfolioId
        );
        
        // Sort by snapshot date descending to get the latest
        const sortedSnapshots = portfolioSnapshots.sort((a: any, b: any) => 
          new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime()
        );
        
        snapshotInfo[portfolio.portfolioId] = {
          lastSnapshotDate: sortedSnapshots[0]?.snapshotDate,
          snapshotCount: portfolioSnapshots.length
        };
      });
      
      setPortfolioSnapshotInfo(snapshotInfo);
    } catch (error) {
      console.warn('Failed to load snapshot info:', error);
    }
  };


  const handleCreateSnapshot = async () => {
    // Validate portfolio selection
    if (useMultiplePortfolios) {
      if (selectedPortfolioIds.length === 0) {
        setStatus({
          type: 'error',
          message: t('snapshots.modals.createSnapshot.selectAtLeastOnePortfolio')
        });
        return;
      }
    } else {
      if (!selectedPortfolioIdState) {
        setStatus({
          type: 'error',
          message: t('snapshots.modals.createSnapshot.selectPortfolio')
        });
        return;
      }
    }

    if (!granularity) {
      setStatus({
        type: 'error',
        message: t('snapshots.modals.createSnapshot.selectGranularity')
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
      // Calculate timeout based on date range size and number of portfolios
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const portfolioCount = useMultiplePortfolios ? selectedPortfolioIds.length : 1;
      const timeoutMs = Math.max(60000, daysDiff * portfolioCount * 3000); // 3 seconds per day per portfolio
      
      // Show progress message for large operations
      if (daysDiff > 7 || portfolioCount > 5) {
        setStatus({
          type: 'info',
          message: t('snapshots.modals.createSnapshot.processing', { 
            days: daysDiff, 
            portfolios: portfolioCount 
          })
        });
      }
      
      let response;
      
      if (useMultiplePortfolios) {
        // Use bulk endpoint for multiple portfolios
        response = await apiService.api.post(
          '/api/v1/snapshots/portfolio/bulk',
          {
            portfolioIds: selectedPortfolioIds,
            startDate: useDateRange ? startDate : undefined,
            endDate: useDateRange ? endDate : undefined,
            granularity: granularity,
            createdBy: accountId
          },
          { timeout: timeoutMs }
        );
      } else {
        // Use bulk endpoint with single portfolio
        response = await apiService.api.post(
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
      }
      
      // Only show success if we get a valid response
      if (response && response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        
        if (responseData.totalSnapshots > 0) {
          setStatus({
            type: 'success',
            message: responseData.message || t('snapshots.modals.createSnapshot.successCreated', { 
              count: responseData.totalSnapshots, 
              portfolioName: useMultiplePortfolios 
                ? `${responseData.totalPortfolios} portfolios` 
                : selectedPortfolio?.name || 'portfolio' 
            })
          });
          
          // Call success callback for each portfolio
          if (useMultiplePortfolios) {
            responseData.results?.forEach((result: any) => {
              if (result.success) {
                onSuccess?.(result.portfolioId, startDate);
                refreshPortfolioData(result.portfolioId);
              }
            });
          } else {
            onSuccess?.(selectedPortfolioIdState, startDate);
            await refreshPortfolioData(selectedPortfolioIdState);
          }
          
          // Close modal after refresh is complete
          setTimeout(() => {
            handleReset();
            onClose();
          }, 2000);
        } else {
          setStatus({
            type: 'info',
            message: t('snapshots.modals.createSnapshot.noSnapshotsCreated')
          });
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
    setSelectedPortfolioIds([]);
    setUseMultiplePortfolios(true);
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

  const handleSelectAll = () => {
    setSelectedPortfolioIds(portfolios.map((p: any) => p.portfolioId));
  };

  const handleDeselectAll = () => {
    setSelectedPortfolioIds([]);
  };

  const handlePortfolioToggle = (portfolioId: string) => {
    setSelectedPortfolioIds(prev => 
      prev.includes(portfolioId) 
        ? prev.filter(id => id !== portfolioId)
        : [...prev, portfolioId]
    );
  };

  const modalIcon = (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '50%',
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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
        mobileText={t('common.cancel')}
        desktopText={t('common.cancel')}
        sx={{ textTransform: 'none', minWidth: 100 }}
      >
        {t('common.cancel')}
      </ResponsiveButton>
      <ActionButton
        variant="contained"
        color="primary"
        icon={isCreating ? <CircularProgress size={20} /> : <AddIcon />}
        mobileText={t('snapshots.modals.createSnapshot.create')}
        desktopText={t('snapshots.modals.createSnapshot.createSnapshot')}
        onClick={handleCreateSnapshot}
        disabled={
          (useMultiplePortfolios ? selectedPortfolioIds.length === 0 : !selectedPortfolioIdState) || 
          !startDate || 
          !granularity || 
          isCreating || 
          isLoadingPortfolios
        }
        forceTextOnly={true}
        sx={{ textTransform: 'none', minWidth: 140 }}
      >
        {isCreating ? t('snapshots.modals.createSnapshot.creating') : t('snapshots.modals.createSnapshot.createSnapshot')}
      </ActionButton>
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
      maxWidth="md"
      titleColor="primary"
      size="medium"
    >
      <Box sx={{ px: 2, mt:1 }}>
        {/* Multiple Portfolio Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={useMultiplePortfolios}
              onChange={(e) => setUseMultiplePortfolios(e.target.checked)}
              disabled={isCreating}
            />
          }
          label={t('snapshots.modals.createSnapshot.createForMultiplePortfolios')}
          sx={{ mb: 3 }}
        />

        {/* Portfolio Selection */}
        {useMultiplePortfolios ? (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                {t('snapshots.modals.createSnapshot.selectPortfolios')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <ResponsiveButton
                  variant="text"
                  size="small"
                  icon={<SelectAllIcon fontSize="small"/>}
                  onClick={handleSelectAll}
                  disabled={isLoadingPortfolios}
                  sx={{ 
                    textTransform: 'none',
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    '& .MuiButton-startIcon': {
                      marginRight: 0.5
                    }
                  }}
                >
                  {t('common.selectAll')}
                </ResponsiveButton>
                <ResponsiveButton
                  variant="text"
                  size="small"
                  icon={<DeselectIcon fontSize="small" />}
                  onClick={handleDeselectAll}
                  disabled={isLoadingPortfolios}
                  sx={{ 
                    textTransform: 'none',
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    '& .MuiButton-startIcon': {
                      marginRight: 0.5
                    }
                  }}
                >
                  {t('common.deselectAll')}
                </ResponsiveButton>
              </Box>
            </Box>
            
            {isLoadingPortfolios ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : portfoliosError ? (
              <Alert severity="error" sx={{ m: 2 }}>
                {t('snapshots.modals.createSnapshot.failedToLoadPortfolios')}: {String(portfoliosError)}
              </Alert>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {portfolios.map((portfolio: any) => {
                  const snapshotInfo = portfolioSnapshotInfo[portfolio.portfolioId];
                  const isSelected = selectedPortfolioIds.includes(portfolio.portfolioId);
                  
                  return (
                    <ListItem 
                      key={portfolio.portfolioId} 
                      dense
                      sx={{
                        borderLeft: isSelected ? '4px solid' : '4px solid transparent',
                        borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                        backgroundColor: isSelected ? 'action.selected' : 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handlePortfolioToggle(portfolio.portfolioId)}
                          disabled={isCreating}
                          size="small"
                        />
                      </ListItemIcon>
                      <Box sx={{ flex: 1, ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" component="div" fontWeight={600}>
                            {portfolio.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {snapshotInfo?.lastSnapshotDate ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" component="span" color="success.main" fontWeight={500}>
                                ✓
                              </Typography>
                              <Typography variant="caption" component="span" color="text.secondary">
                                {t('snapshots.modals.createSnapshot.lastSnapshot')}: {new Date(snapshotInfo.lastSnapshotDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" component="span" color="warning.main" fontWeight={500}>
                                ⚠
                              </Typography>
                              <Typography variant="caption" component="span" color="warning.main">
                                {t('snapshots.modals.createSnapshot.noSnapshots')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
            
            {selectedPortfolioIds.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`${selectedPortfolioIds.length} ${t('snapshots.modals.createSnapshot.portfoliosSelected')}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            )}
          </Box>
        ) : (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel 
              shrink
              sx={{ 
                backgroundColor: 'background.paper',
                px: 1,
                '&.Mui-focused': {
                  color: 'primary.main'
                }
              }}
            >
              {t('snapshots.modals.createSnapshot.selectPortfolio')}
            </InputLabel>
            <Select
              value={selectedPortfolioIdState}
              onChange={(e) => setSelectedPortfolioIdState(e.target.value)}
              disabled={isCreating || isLoadingPortfolios}
              label={t('snapshots.modals.createSnapshot.selectPortfolio')}
            >
              {isLoadingPortfolios ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {t('snapshots.modals.createSnapshot.loadingPortfolios')}
                </MenuItem>
              ) : (
                portfolios.map((portfolio: any) => (
                  <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                    {portfolio.name} 
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        )}

        {/* Date Range Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={useDateRange}
              onChange={(e) => setUseDateRange(e.target.checked)}
              disabled={isCreating}
            />
          }
          label={t('snapshots.modals.createSnapshot.useDateRange')}
          sx={{ mb: 2 }}
        />

        {/* Date Selection */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label={t('snapshots.modals.createSnapshot.startDate')}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isCreating}
            InputLabelProps={{ shrink: true }}
          />
          {useDateRange && (
            <TextField
              fullWidth
              label={t('snapshots.modals.createSnapshot.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isCreating}
              InputLabelProps={{ shrink: true }}
            />
          )}
        </Box>

        {/* Status Messages */}
        {status.type && (
          <Alert
            severity={status.type}
            sx={{ mb: 1 }}
            icon={
              status.type === 'success' ? <SuccessIcon /> :
              status.type === 'error' ? <ErrorIcon /> :
              status.type === 'info' ? <WarningIcon /> : undefined
            }
          >
            {status.message}
          </Alert>
        )}
      </Box>
    </ModalWrapper>
  );
};

export default BulkSnapshotModalV2;
