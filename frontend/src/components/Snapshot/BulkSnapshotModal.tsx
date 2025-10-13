// BulkSnapshotModal Component for CR-006 Asset Snapshot System

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as SnapshotIcon,
  Add as AddIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { useQueryClient } from 'react-query';

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
}

export const BulkSnapshotModal: React.FC<BulkSnapshotModalProps> = ({
  open,
  onClose,
  onSuccess,
  onError,
  onPortfolioRefresh,
}) => {
  const { accountId } = useAccount();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
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

  const selectedPortfolio = portfolios.find(p => p.portfolioId === selectedPortfolioId);

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
    }
  }, [open]);

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
        message: 'Failed to load portfolios'
      });
    } finally {
      setIsLoadingPortfolios(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedPortfolioId || !granularity) {
      setStatus({
        type: 'error',
        message: 'Please select a portfolio and granularity'
      });
      return;
    }

    if (!startDate) {
      setStatus({
        type: 'error',
        message: 'Please select a start date'
      });
      return;
    }

    if (useDateRange && !endDate) {
      setStatus({
        type: 'error',
        message: 'Please select an end date'
      });
      return;
    }

    if (useDateRange && new Date(startDate) > new Date(endDate)) {
      setStatus({
        type: 'error',
        message: 'Start date must be before end date'
      });
      return;
    }

    if (new Date(startDate) > new Date()) {
      setStatus({
        type: 'error',
        message: 'Start date cannot be in the future'
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
          message: `Processing ${daysDiff} days of snapshots... This may take a few minutes.`
        });
      }
      
      const response = await apiService.api.post(
        `/api/v1/snapshots/portfolio/${selectedPortfolioId}`,
        useDateRange 
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
            },
        { timeout: timeoutMs }
      );
      // Only show success if we get a valid response
      if (response && response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        
        if (responseData.totalSnapshots > 0) {
          setStatus({
            type: 'success',
            message: responseData.message || `Successfully created ${responseData.totalSnapshots} snapshots for ${selectedPortfolio?.name || 'portfolio'}`
          });
          
          // Call success callback
          onSuccess?.(selectedPortfolioId, startDate);
          
          // Auto-refresh portfolio data after successful snapshot creation
          await refreshPortfolioData(selectedPortfolioId);
          
          // Close modal after refresh is complete
          setTimeout(() => {
            handleReset();
            onClose();
          }, 400);
        } else {
          setStatus({
            type: 'info',
            message: responseData.message || `No snapshots created for portfolio ${selectedPortfolio?.name || 'portfolio'}.`
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
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create snapshot';
      
      setStatus({
        type: 'error',
        message: `Error ${error.response?.status}: ${errorMessage}`
      });

      onError?.(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setSelectedPortfolioId('');
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <SnapshotIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Create Snapshot for All Assets
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generate a snapshot for all assets in the selected portfolio
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} disabled={isCreating} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Portfolio Selection */}
          <FormControl fullWidth>
            <InputLabel>Select Portfolio</InputLabel>
            <Select
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
              label="Select Portfolio"
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
                      {portfolio.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {portfolio.description}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={`Created: ${new Date(portfolio.createdAt).toLocaleDateString()}`}
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
              {useDateRange ? 'Date Range Mode' : 'Single Date Mode'}
            </ResponsiveButton>
            <Typography variant="body2" color="text.secondary">
              {useDateRange ? 'Create snapshots for multiple dates' : 'Create snapshot for a single date'}
            </Typography>
          </Box>

          {/* Date Selection - Conditional based on mode */}
          {!useDateRange ? (
            <TextField
              fullWidth
              type="date"
              label="Snapshot Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isCreating}
              helperText="Select the date for the snapshot"
            />
          ) : (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={isCreating}
                helperText="Start date for snapshot range"
                sx={{ flex: 1, minWidth: 200 }}
              />
              <TextField
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={isCreating}
                helperText="End date for snapshot range"
                sx={{ flex: 1, minWidth: 200 }}
              />
            </Box>
          )}

          {/* Granularity Selection */}
          <FormControl fullWidth>
            <InputLabel>Snapshot Granularity</InputLabel>
            <Select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as SnapshotGranularity)}
              label="Snapshot Granularity"
              disabled={isCreating}
            >
              <MenuItem value={SnapshotGranularity.DAILY}>Daily</MenuItem>
              <MenuItem value={SnapshotGranularity.WEEKLY}>Weekly</MenuItem>
              <MenuItem value={SnapshotGranularity.MONTHLY}>Monthly</MenuItem>
            </Select>
          </FormControl>

          {/* Selected Portfolio Info */}
          {selectedPortfolio && (
            <Box sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.info.main, 0.05), 
              borderRadius: 1,
              border: 1,
              borderColor: alpha(theme.palette.info.main, 0.2),
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Selected Portfolio Details
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip
                  label={`Name: ${selectedPortfolio.name}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
                <Chip
                  label={`ID: ${selectedPortfolio.portfolioId}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
                <Chip
                  label={`Created: ${new Date(selectedPortfolio.createdAt).toLocaleDateString()}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Box>
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

          <Divider />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <ResponsiveButton
          variant="outlined"
          onClick={handleReset}
          disabled={isCreating}
          sx={{ textTransform: 'none' }}
        >
          Reset
        </ResponsiveButton>
        <ResponsiveButton
          variant="contained"
          icon={isCreating ? <CircularProgress size={20} /> : <AddIcon />}
          mobileText="Create"
          desktopText="Create Snapshot"
          onClick={handleCreateSnapshot}
          disabled={!selectedPortfolioId || !startDate || !granularity || isCreating || isLoadingPortfolios}
          sx={{ textTransform: 'none', minWidth: 140 }}
        >
          {isCreating ? 'Creating...' : 'Create Snapshot'}
        </ResponsiveButton>
      </DialogActions>
    </Dialog>
  );
};
