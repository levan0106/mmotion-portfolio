// SnapshotManagement Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  Typography,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  List as ListIcon,
  Add as AddIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  CameraAlt as SnapshotIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { SnapshotListView } from './SnapshotListView';
import { SnapshotSimpleList } from './SnapshotSimpleList';
import { SnapshotForm } from './SnapshotForm';
import { SnapshotDashboard } from './SnapshotDashboard';
import { SnapshotExportImport } from './SnapshotExportImport';
import { PortfolioSelector } from './PortfolioSelector';
import { BulkSnapshotModal } from './BulkSnapshotModal';
import DeleteSnapshotsModal from './DeleteSnapshotsModal';
import { SnapshotResponse, SnapshotFormData, CreateSnapshotRequest, UpdateSnapshotRequest } from '../../types/snapshot.types';
import { useSnapshots } from '../../hooks/useSnapshots';
import { usePortfolioSnapshots } from '../../hooks/usePortfolioSnapshots';

interface SnapshotManagementProps {
  portfolioId?: string;
}

type ViewMode = 'dashboard' | 'list' | 'simple-list' | 'create' | 'edit' | 'export-import';

export const SnapshotManagement: React.FC<SnapshotManagementProps> = ({
  portfolioId: initialPortfolioId,
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('simple-list');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | undefined>(initialPortfolioId);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotResponse | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bulkCreateModalOpen, setBulkCreateModalOpen] = useState(false);
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

  // Memoize the params to prevent unnecessary re-renders
  const snapshotParams = useMemo(() => 
    selectedPortfolioId ? { portfolioId: selectedPortfolioId } : {},
    [selectedPortfolioId]
  );

  const {
    createSnapshot,
    updateSnapshot,
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

  const handleCreateSnapshot = async (data: CreateSnapshotRequest | UpdateSnapshotRequest) => {
    setIsFormLoading(true);
    try {
      await createSnapshot(data as CreateSnapshotRequest);
      setViewMode('list');
      refreshSnapshots();
      showSnackbar('Snapshot created successfully!', 'success');
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      showSnackbar('Failed to create snapshot. Please try again.', 'error');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleUpdateSnapshot = async (data: UpdateSnapshotRequest) => {
    if (!selectedSnapshot) return;
    
    setIsFormLoading(true);
    try {
      await updateSnapshot(selectedSnapshot.id, data);
      setViewMode('list');
      setSelectedSnapshot(null);
      refreshSnapshots();
      showSnackbar('Snapshot updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update snapshot:', error);
      showSnackbar('Failed to update snapshot. Please try again.', 'error');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleDeleteSnapshot = async (snapshot: SnapshotResponse) => {
    try {
      await deleteSnapshot(snapshot.id);
      refreshSnapshots();
      showSnackbar('Snapshot deleted successfully!', 'success');
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      showSnackbar('Failed to delete snapshot. Please try again.', 'error');
    }
  };

  const handleEditSnapshot = (snapshot: SnapshotResponse) => {
    setSelectedSnapshot(snapshot);
    setViewMode('edit');
  };

  const handleBulkRecalculate = async () => {
    if (window.confirm('Are you sure you want to recalculate all snapshots for this portfolio?')) {
      try {
        await bulkRecalculateSnapshots(selectedPortfolioId!);
        refreshSnapshots();
        showSnackbar('All snapshots recalculated successfully!', 'success');
      } catch (error) {
        console.error('Failed to bulk recalculate snapshots:', error);
        showSnackbar('Failed to recalculate snapshots. Please try again.', 'error');
      }
    }
  };


  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = async () => {
    try {
      console.log('handleRefresh called in SnapshotManagement');
      console.log('refreshSnapshots:', refreshSnapshots);
      console.log('refreshPortfolioSnapshots:', refreshPortfolioSnapshots);
      
      // Refresh asset snapshots
      if (refreshSnapshots) {
        await refreshSnapshots();
        console.log('Asset snapshots refreshed');
      } else {
        console.error('refreshSnapshots is not available');
      }
      
      // Refresh portfolio snapshots
      if (refreshPortfolioSnapshots) {
        await refreshPortfolioSnapshots();
        console.log('Portfolio snapshots refreshed');
      } else {
        console.error('refreshPortfolioSnapshots is not available');
      }
      
      // Trigger refresh for SnapshotSimpleList
      setRefreshTrigger(prev => prev + 1);
      console.log('Refresh trigger updated for SnapshotSimpleList');
      
      showSnackbar('Data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showSnackbar('Error refreshing data', 'error');
    }
  };

  const handleDeleteSuccess = (_deletedCount: number, message: string) => {
    showSnackbar(message, 'success');
    refreshSnapshots(); // Refresh the data after deletion
  };

  const handleDeleteError = (error: string) => {
    showSnackbar(`Delete failed: ${error}`, 'error');
  };

  const getFormData = (): Partial<SnapshotFormData> => {
    if (selectedSnapshot) {
      return {
        portfolioId: selectedSnapshot.portfolioId,
        assetId: selectedSnapshot.assetId,
        assetSymbol: selectedSnapshot.assetSymbol,
        snapshotDate: selectedSnapshot.snapshotDate,
        granularity: selectedSnapshot.granularity,
        quantity: selectedSnapshot.quantity,
        currentPrice: selectedSnapshot.currentPrice,
        currentValue: selectedSnapshot.currentValue,
        costBasis: selectedSnapshot.costBasis,
        avgCost: selectedSnapshot.avgCost,
        realizedPl: selectedSnapshot.realizedPl,
        unrealizedPl: selectedSnapshot.unrealizedPl,
        totalPl: selectedSnapshot.totalPl,
        allocationPercentage: selectedSnapshot.allocationPercentage,
        portfolioTotalValue: selectedSnapshot.portfolioTotalValue,
        returnPercentage: selectedSnapshot.returnPercentage,
        dailyReturn: selectedSnapshot.dailyReturn,
        cumulativeReturn: selectedSnapshot.cumulativeReturn,
        isActive: selectedSnapshot.isActive,
        createdBy: selectedSnapshot.createdBy,
        notes: selectedSnapshot.notes,
      };
    }
    return {
      portfolioId: selectedPortfolioId || '',
      isActive: true,
    };
  };

  const renderView = () => {
    if (!selectedPortfolioId) return null;
    
    switch (viewMode) {
      case 'dashboard':
        return (
          <SnapshotDashboard
            key={selectedPortfolioId}
            portfolioId={selectedPortfolioId}
            onSnapshotCreate={() => setViewMode('create')}
            onSnapshotManage={() => setViewMode('list')}
          />
        );
      
      case 'list':
        return (
          <SnapshotListView
            key={selectedPortfolioId}
            portfolioId={selectedPortfolioId}
            onSnapshotSelect={(snapshot) => {
              setSelectedSnapshot(snapshot);
              setViewMode('edit');
            }}
            onSnapshotEdit={handleEditSnapshot}
            onSnapshotDelete={handleDeleteSnapshot}
            showActions={true}
            pageSize={25}
          />
        );
      
      case 'simple-list':
        return (
          <SnapshotSimpleList
            key={selectedPortfolioId}
            portfolioId={selectedPortfolioId}
            onSnapshotSelect={(snapshot) => {
              setSelectedSnapshot(snapshot);
              setViewMode('edit');
            }}
            onSnapshotEdit={handleEditSnapshot}
            onSnapshotDelete={handleDeleteSnapshot}
            showActions={true}
            pageSize={25}
            refreshTrigger={refreshTrigger}
          />
        );
      
      case 'create':
        return (
          <SnapshotForm
            initialData={getFormData()}
            onSubmit={handleCreateSnapshot}
            onCancel={() => setViewMode('list')}
            isEdit={false}
            loading={isFormLoading}
          />
        );
      
      case 'edit':
        return (
          <SnapshotForm
            initialData={getFormData()}
            onSubmit={handleUpdateSnapshot}
            onCancel={() => {
              setViewMode('list');
              setSelectedSnapshot(null);
            }}
            isEdit={true}
            loading={isFormLoading}
          />
        );
      
      case 'export-import':
        return (
          <SnapshotExportImport
            portfolioId={selectedPortfolioId!}
            onImportComplete={(count) => {
              console.log(`Imported ${count} snapshots`);
              setViewMode('list');
            }}
            onExportComplete={(count) => {
              console.log(`Exported ${count} snapshots`);
            }}
          />
        );
      
      default:
        return null;
    }
  };

  const getTabValue = (mode: ViewMode) => {
    switch (mode) {
      case 'dashboard': return 0;
      case 'list': return 1;
      case 'simple-list': return 2;
      case 'create': return 3;
      case 'edit': return 3;
      case 'export-import': return 4;
      default: return 0;
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0: setViewMode('dashboard'); break;
      case 1: setViewMode('list'); break;
      case 2: setViewMode('simple-list'); break;
      case 3: setViewMode('create'); break;
      case 4: setViewMode('export-import'); break;
      default: setViewMode('dashboard');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2.5, 
          mb: 2, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.1),
        }}
      >
        {/* Portfolio Selector */}
        <Box sx={{ mb: 2 }}>
          <PortfolioSelector
            selectedPortfolioId={selectedPortfolioId}
            onPortfolioChange={setSelectedPortfolioId}
          />
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
          <Tabs
            value={getTabValue(viewMode)}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 44,
                px: 2,
              },
            }}
          >
            <Tab
              icon={<DashboardIcon />}
              iconPosition="start"
              label="Dashboard"
              sx={{ minWidth: 120 }}
            />
            <Tab
              icon={<ListIcon />}
              iconPosition="start"
              label="List View"
              sx={{ minWidth: 120 }}
            />
            <Tab
              icon={<ListIcon />}
              iconPosition="start"
              label="Simple List"
              sx={{ minWidth: 120 }}
            />
            <Tab
              icon={<AddIcon />}
              iconPosition="start"
              label="Create"
              sx={{ minWidth: 120 }}
            />
            <Tab
              icon={<ExportIcon />}
              iconPosition="start"
              label="Export/Import"
              sx={{ minWidth: 140 }}
            />
          </Tabs>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<SnapshotIcon />}
              onClick={() => setBulkCreateModalOpen(true)}
              size="small"
              sx={{ px: 2, textTransform: 'none' }}
            >
              Create Portfolio Snapshots
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RefreshIcon />}
              onClick={handleBulkRecalculate}
              disabled={viewMode !== 'list'}
              size="small"
              sx={{ px: 2 }}
            >
              Recalculate All
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteModalOpen(true)}
              disabled={!selectedPortfolioId}
              size="small"
              sx={{ px: 2 }}
            >
              Delete Snapshots
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Refresh Data 1">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More Actions">
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        {selectedPortfolioId ? renderView() : (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 2, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Select a Portfolio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a portfolio from the dropdown above to view its snapshots
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
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
          <ListItemText>Refresh Data</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleBulkRecalculate(); handleMenuClose(); }}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Recalculate All</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Bulk Create Modal */}
      <BulkSnapshotModal
        open={bulkCreateModalOpen}
        onClose={() => setBulkCreateModalOpen(false)}
        onSuccess={(_portfolioId, snapshotDate) => {
          showSnackbar(`Snapshot created successfully for portfolio on ${snapshotDate}`, 'success');
          refreshSnapshots();
        }}
        onError={(error) => {
          showSnackbar(`Failed to create snapshot: ${error}`, 'error');
        }}
      />

      {/* Delete Snapshots Modal */}
      <DeleteSnapshotsModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        portfolioId={selectedPortfolioId || ''}
        onSuccess={handleDeleteSuccess}
        onError={handleDeleteError}
      />
    </Box>
  );
};
