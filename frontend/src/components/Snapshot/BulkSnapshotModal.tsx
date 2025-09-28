// BulkSnapshotModal Component for CR-006 Asset Snapshot System

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
import { apiService } from '../../services/api';
import { useAccount } from '../../hooks/useAccount';
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
  const [snapshotDate, setSnapshotDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [granularity, setGranularity] = useState<SnapshotGranularity>(SnapshotGranularity.DAILY);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const selectedPortfolio = portfolios.find(p => p.portfolioId === selectedPortfolioId);

  // Function to refresh portfolio data after snapshot creation
  const refreshPortfolioData = async (portfolioId: string) => {
    try {
      console.log(`🔄 Starting portfolio data refresh for: ${portfolioId}`);
      
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
      console.log(`✅ React Query cache invalidated for portfolio: ${portfolioId}`);
      
      // Call custom refresh callback if provided
      if (onPortfolioRefresh) {
        console.log(`🔄 Calling custom refresh callback for: ${portfolioId}`);
        onPortfolioRefresh(portfolioId);
      }
      
      console.log(`✅ Portfolio data refresh completed for: ${portfolioId}`);
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
    if (!selectedPortfolioId || !snapshotDate || !granularity) {
      setStatus({
        type: 'error',
        message: 'Please select a portfolio, snapshot date, and granularity'
      });
      return;
    }

    setIsCreating(true);
    setStatus({ type: null, message: '' });

    try {
      const apiUrl = `/api/v1/snapshots/portfolio/${selectedPortfolioId}`;
      const requestBody = {
        snapshotDate: snapshotDate,
        granularity: granularity,
        createdBy: accountId
      };
            
      // Create snapshot using the bulk creation endpoint for portfolio
      const response = await apiService.api.post(apiUrl, requestBody);
      
      console.log('Bulk snapshot creation response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      // Only show success if we get a valid response
      if (response && response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        
        if (responseData.count > 0) {
          setStatus({
            type: 'success',
            message: responseData.message || `Successfully created ${responseData.count} snapshots for ${selectedPortfolio?.name || 'portfolio'} on ${snapshotDate}`
          });
          
          // Call success callback
          onSuccess?.(selectedPortfolioId, snapshotDate);
          
          // Auto-refresh portfolio data after successful snapshot creation
          await refreshPortfolioData(selectedPortfolioId);
          
          // Close modal after refresh is complete
          setTimeout(() => {
            handleReset();
            onClose();
          }, 400); // Reduced delay since refresh is already complete
        } else {
          setStatus({
            type: 'info',
            message: responseData.message || `No assets found in portfolio ${selectedPortfolio?.name || 'portfolio'}. No snapshots created.`
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
    setSnapshotDate(new Date().toISOString().split('T')[0]);
    setGranularity(SnapshotGranularity.DAILY);
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

          {/* Date Selection */}
          <TextField
            fullWidth
            type="date"
            label="Snapshot Date"
            value={snapshotDate}
            onChange={(e) => setSnapshotDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={isCreating}
            helperText="Select the date for the snapshot"
          />

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
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={isCreating}
          sx={{ textTransform: 'none' }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={isCreating ? <CircularProgress size={20} /> : <AddIcon />}
          onClick={handleCreateSnapshot}
          disabled={!selectedPortfolioId || !snapshotDate || !granularity || isCreating || isLoadingPortfolios}
          sx={{ textTransform: 'none', minWidth: 140 }}
        >
          {isCreating ? 'Creating...' : 'Create Snapshot'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
