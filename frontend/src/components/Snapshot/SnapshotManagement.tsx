// SnapshotManagement Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CameraAlt as SnapshotIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { SnapshotSimpleList } from './SnapshotSimpleList';
import { PortfolioSelector } from './PortfolioSelector';
import SnapshotModals from './SnapshotModals';
import BulkSnapshotModalV2 from './BulkSnapshotModalV2';
import { SnapshotResponse } from '../../types/snapshot.types';
import { BulkRecalculateResponse } from '../../types/snapshot.types';
import { useSnapshots } from '../../hooks/useSnapshots';
import { usePortfolioSnapshots } from '../../hooks/usePortfolioSnapshots';
import { useAccount } from '../../contexts/AccountContext';
import { useTranslation } from 'react-i18next';
import { snapshotService } from '../../services/snapshot.service';

interface SnapshotManagementProps {
  portfolioId?: string;
}


export const SnapshotManagement: React.FC<SnapshotManagementProps> = ({
  portfolioId: initialPortfolioId,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | undefined>(initialPortfolioId);
  // const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
  const [bulkCreateModalV2Open, setBulkCreateModalV2Open] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculateConfirmOpen, setRecalculateConfirmOpen] = useState(false);

  // Memoize the params to prevent unnecessary re-renders
  const snapshotParams = useMemo(() => 
    selectedPortfolioId ? { portfolioId: selectedPortfolioId } : {},
    [selectedPortfolioId]
  );

  const {
    deleteSnapshot,
    bulkRecalculateSnapshots,
    refreshSnapshots,
  } = useSnapshots(snapshotParams);

  const { 
    refreshPortfolioSnapshots 
  } = usePortfolioSnapshots({
    portfolioId: selectedPortfolioId,
    autoFetch: true, // Enable auto fetch to ensure data is available
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };



  const handleDeleteSnapshot = async (snapshot: SnapshotResponse) => {
    try {
      await deleteSnapshot(snapshot.id);
      refreshSnapshots();
      showSnackbar(t('snapshots.snapshotDeletedSuccess'), 'success');
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      showSnackbar(t('snapshots.snapshotDeleteFailed'), 'error');
    }
  };


  const handleBulkRecalculate = () => {
    setRecalculateConfirmOpen(true);
  };

  const handleConfirmRecalculate = async () => {
    setRecalculateConfirmOpen(false);
    setIsRecalculating(true);
    showSnackbar(t('snapshots.recalculating'), 'info');
    try {
      const response: BulkRecalculateResponse = await bulkRecalculateSnapshots(selectedPortfolioId!, accountId);
      
      if (response.status === 'PROCESSING') {
        showSnackbar(
          `Bulk recalculate started. Processing ${response.dateRange ? 
            `${response.dateRange.startDate} to ${response.dateRange.endDate}` : 
            'snapshots'} in background. Estimated duration: ${response.estimatedDuration}`,
          'info'
        );
        
        // Start polling for status updates
        const pollStatus = async () => {
          try {
            const statusResponse = await snapshotService.getBulkRecalculateStatus(selectedPortfolioId!, response.trackingId);
            
            if (statusResponse.status === 'completed') {
              showSnackbar(
                `Bulk recalculate completed: ${statusResponse.summary.totalSnapshots} snapshots across ${statusResponse.summary.successfulDates} dates`,
                'success'
              );
              await refreshSnapshots();
              await refreshPortfolioSnapshots();
              setRefreshTrigger(prev => prev + 1);
              setIsRecalculating(false);
            } else if (statusResponse.status === 'failed') {
              showSnackbar('Bulk recalculate failed. Please try again.', 'error');
              setIsRecalculating(false);
            } else if (statusResponse.status === 'in_progress' || statusResponse.status === 'started') {
              // Continue polling
              setTimeout(pollStatus, 5000); // Poll every 5 seconds
            } else {
              showSnackbar('Bulk recalculate status unknown. Please check manually.', 'warning');
              setIsRecalculating(false);
            }
          } catch (error) {
            console.error('Failed to get bulk recalculate status:', error);
            showSnackbar('Failed to get recalculate status. Please check manually.', 'error');
            setIsRecalculating(false);
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollStatus, 2000);
        
      } 
    } catch (error) {
      console.error('Failed to bulk recalculate snapshots:', error);
      showSnackbar(t('snapshots.recalculateFailed'), 'error');
      setIsRecalculating(false);
    }
  };

  const handleCancelRecalculate = () => {
    setRecalculateConfirmOpen(false);
  };

  // const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
  //   setAnchorEl(event.currentTarget);
  // };

  // const handleMenuClose = () => {
  //   setAnchorEl(null);
  // };


  const handleDeleteSuccess = (_deletedCount: number, message: string) => {
    showSnackbar(message, 'success');
    refreshSnapshots(); // Refresh the data after deletion
  };

  const handleDeleteError = (error: string) => {
    showSnackbar(`${t('snapshots.deleteFailed')}: ${error}`, 'error');
  };




  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      {/* Top Header - Fixed */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <ResponsiveTypography variant="pageTitle" sx={{ color: 'text.primary', mb: 0.5 }}>
              {t('snapshots.title')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" sx={{ color: 'text.secondary' }}>
              {t('snapshots.subtitle')}
            </ResponsiveTypography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ResponsiveButton
              variant="contained"
              color="secondary"
              icon={<SnapshotIcon />}
              mobileText={t('snapshots.createForAllPortfolios')}
              desktopText={t('snapshots.createForAllPortfolios')}
              onClick={() => setBulkCreateModalV2Open(true)}
              size="medium"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {t('snapshots.createForAllPortfolios')}
            </ResponsiveButton>
            
            {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={t('snapshots.refreshDataTooltip')}>
                <IconButton onClick={handleRefresh} size="medium" sx={{ bgcolor: 'grey.100' }}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={t('snapshots.moreActionsTooltip')}>
                <IconButton onClick={handleMenuOpen} size="medium" sx={{ bgcolor: 'grey.100' }}>
                  <MoreIcon />
                </IconButton>
              </Tooltip>
            </Box> */}
          </Box>
        </Box>

        {/* Portfolio Selector */}
        <PortfolioSelector
          selectedPortfolioId={selectedPortfolioId}
          onPortfolioChange={setSelectedPortfolioId}
        />
      </Paper>

      {/* Action Bar */}
      {selectedPortfolioId && (
        <Box sx={{ 
          p: 2, 
          bgcolor: 'white', 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <ResponsiveButton
            variant="contained"
            icon={<SnapshotIcon />}
            mobileText={t('snapshots.createSnapshots')}
            desktopText={t('snapshots.createSnapshots')}
            onClick={() => setBulkCreateModalOpen(true)}
            size="medium"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('snapshots.createSnapshots')}
          </ResponsiveButton>
          
          <ResponsiveButton
            variant="outlined"
            color="warning"
            icon={isRecalculating ? <CircularProgress size={20} /> : <RefreshIcon />}
            mobileText={isRecalculating ? t('snapshots.recalculating') : t('snapshots.recalculateAll')}
            desktopText={isRecalculating ? t('snapshots.recalculating') : t('snapshots.recalculateAll')}
            onClick={handleBulkRecalculate}
            disabled={isRecalculating}
            size="medium"
            sx={{ textTransform: 'none' }}
          >
            {isRecalculating ? t('snapshots.recalculating') : t('snapshots.recalculateAll')}
          </ResponsiveButton>
          
          <ResponsiveButton
            variant="outlined"
            color="error"
            icon={<DeleteIcon />}
            mobileText={t('snapshots.deleteSnapshots')}
            desktopText={t('snapshots.deleteSnapshots')}
            onClick={() => setDeleteModalOpen(true)}
            size="medium"
            sx={{ textTransform: 'none' }}
          >
            {t('snapshots.deleteSnapshots')}
          </ResponsiveButton>
        </Box>
      )}

      {/* Global Progress Indicator */}
      {isRecalculating && (
        <LinearProgress 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 9999,
            height: 4
          }} 
        />
      )}

      {/* Main Content */}
      <Box sx={{ flexGrow: 1 }}>
        {selectedPortfolioId ? (
          <Box sx={{ p: 2 }}>
            <SnapshotSimpleList
              key={selectedPortfolioId}
              portfolioId={selectedPortfolioId}
              onSnapshotSelect={() => {
                // Snapshot selected for viewing
              }}
              onSnapshotDelete={handleDeleteSnapshot}
              showActions={true}
              pageSize={10}
              refreshTrigger={refreshTrigger}
              onPortfolioRefresh={() => {
                setRefreshTrigger(prev => prev + 1);
                refreshSnapshots();
                refreshPortfolioSnapshots();
              }}
            />
          </Box>
        ) : (
          <Box sx={{  
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'grey.50',
            width: '100%'
          }}>
            <Box sx={{ 
              p: 6, 
              textAlign: 'center', 
              width: '100%'
            }}>
              <ResponsiveTypography variant="cardLabel" color="text.secondary">
                {t('snapshots.selectPortfolioPlaceholder')}
              </ResponsiveTypography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Action Menu */}
      {/* <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { handleRefresh(); handleMenuClose(); }}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('snapshots.refreshData')}</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => { setBulkCreateModalV2Open(true); handleMenuClose(); }}
        >
          <ListItemIcon>
            <SnapshotIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('snapshots.createForAllPortfolios')}</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => { handleBulkRecalculate(); handleMenuClose(); }}
          disabled={isRecalculating}
        >
          <ListItemIcon>
            {isRecalculating ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {isRecalculating ? t('snapshots.recalculating') : t('snapshots.recalculateAll')}
          </ListItemText>
        </MenuItem>
      </Menu> */}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ 
          mt: 6, // Add margin top for better spacing from the top
          '& .MuiSnackbarContent-root': {
            minWidth: '300px',
            maxWidth: '500px'
          }
        }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* All Snapshot Modals */}
      <SnapshotModals
        // Bulk Create Modal
        bulkCreateModalOpen={bulkCreateModalOpen}
        onBulkCreateModalClose={() => setBulkCreateModalOpen(false)}
        selectedPortfolioId={selectedPortfolioId}
        onBulkCreateSuccess={(_, snapshotDate) => {
          showSnackbar(`${t('snapshots.snapshotCreatedSuccess')} ${snapshotDate}`, 'success');
          
          // Refresh all snapshot-related data
          refreshSnapshots();
          refreshPortfolioSnapshots();
          
          // Trigger refresh trigger for UI updates
          setRefreshTrigger(prev => prev + 1);
        }}
        onBulkCreateError={(error) => {
          showSnackbar(`${t('snapshots.snapshotCreateFailed')}: ${error}`, 'error');
        }}
        onPortfolioRefresh={() => {
          // Auto-refresh portfolio data when snapshot is created
          // Additional refresh actions if needed
          setRefreshTrigger(prev => prev + 1);
        }}

        // Delete Modal
        deleteModalOpen={deleteModalOpen}
        onDeleteModalClose={() => setDeleteModalOpen(false)}
        onDeleteSuccess={handleDeleteSuccess}
        onDeleteError={handleDeleteError}

        // Recalculate Modal
        recalculateConfirmOpen={recalculateConfirmOpen}
        onRecalculateConfirmClose={handleCancelRecalculate}
        onRecalculateConfirm={handleConfirmRecalculate}
        isRecalculating={isRecalculating}
      />

      {/* Bulk Create Modal V2 - Multiple Portfolios */}
      <BulkSnapshotModalV2
        open={bulkCreateModalV2Open}
        onClose={() => setBulkCreateModalV2Open(false)}
        onSuccess={(_, snapshotDate) => {
          showSnackbar(`${t('snapshots.snapshotCreatedSuccess')} ${snapshotDate}`, 'success');
          
          // Refresh all snapshot-related data
          refreshSnapshots();
          refreshPortfolioSnapshots();
          
          // Trigger refresh trigger for UI updates
          setRefreshTrigger(prev => prev + 1);
        }}
        onError={(error) => {
          showSnackbar(`${t('snapshots.snapshotCreateFailed')}: ${error}`, 'error');
        }}
        onPortfolioRefresh={() => {
          // Auto-refresh portfolio data when snapshot is created
          setRefreshTrigger(prev => prev + 1);
        }}
        selectedPortfolioId={selectedPortfolioId}
      />
    </Box>
  );
};
