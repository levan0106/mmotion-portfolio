import React from 'react';
import { Box, Paper, Stack } from '@mui/material';
import { ResponsiveTypography } from '../components/Common/ResponsiveTypography';
import GlobalAssetManagement from '../components/GlobalAssetManagement';
import AutoSyncToggle from '../components/GlobalAssetManagement/AutoSyncToggle';
import { UpdatePriceByDateButton } from '../components/AssetPrice';
import { HistoricalPricesButton } from '../components/HistoricalPrices';
import { PermissionGuard } from '../components/Common/PermissionGuard';
import { useGlobalAssets, useCreateGlobalAsset, useUpdateGlobalAsset, useUpdateAssetPrice, useUpdateAssetPriceFromMarket, useAutoSync } from '../hooks/useGlobalAssets';
import { useSystemStatus } from '../hooks/useSystemStatus';
import { BulkUpdateResult } from '../hooks/useAssetPriceBulk';
import { apiService } from '../services/api';

const GlobalAssetsPage: React.FC = () => {
  return (
    <PermissionGuard 
      roles={["admin", "super_admin"]}
      requireAllRoles={false}
    >
      <GlobalAssetsContent />
    </PermissionGuard>
  );
};

const GlobalAssetsContent: React.FC = () => {
  // Use real API hooks with higher limit to show more assets
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);
  const { 
    data: assets = [], 
    isLoading: assetsLoading, 
    error: assetsError,
    refetch: refetchAssets,
    total,
    page: currentPage,
    totalPages
  } = useGlobalAssets({ limit, page });


  // Price update hooks
  const updateAssetPriceMutation = useUpdateAssetPrice();
  const updateAssetPriceFromMarketMutation = useUpdateAssetPriceFromMarket();
  
  // Asset management hooks
  const createGlobalAssetMutation = useCreateGlobalAsset();
  const updateGlobalAssetMutation = useUpdateGlobalAsset();
  
  // Auto sync hook
  const { } = useAutoSync();

  // System status (auto-sync status, last update, next run)
  const { lastDataUpdate, nextUpdate, isAutoSyncEnabled, isLoading: statusLoading } = useSystemStatus();

  // API handlers using real hooks
  const handleRefresh = async () => {
    await refetchAssets();
  };

  const handleChangePage = async (_event: unknown, newPage: number) => {
    // MUI TablePagination is zero-based; convert to 1-based for API
    setPage(newPage + 1);
    await refetchAssets();
  };

  const handleChangeRowsPerPage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    setLimit(newLimit);
    setPage(1);
    await refetchAssets();
  };

  const handleCreateAsset = async (data: any) => {
    try {
      await createGlobalAssetMutation.mutateAsync(data);
      // Refresh assets after successful creation
      await refetchAssets();
    } catch (error) {
      console.error('Create asset error:', error);
      throw error;
    }
  };

  const handleUpdateAsset = async (id: string, data: any) => {
    try {
      await updateGlobalAssetMutation.mutateAsync({ id, data });
      // Refresh assets after successful update
      await refetchAssets();
    } catch (error) {
      console.error('Update asset error:', error);
      throw error;
    }
  };

  const handlePriceUpdate = async (
    assetId: string, 
    price: number, 
    priceType: string, 
    priceSource: string, 
    changeReason?: string
  ) => {
    try {
      await updateAssetPriceMutation.mutateAsync({
        assetId,
        price,
        priceType,
        priceSource,
        changeReason,
      });
    } catch (error) {
      console.error('Price update error:', error);
      throw error;
    }
  };

  const handlePriceHistoryRefresh = async (_assetId: string) => {
    try {
      // Temporary comment out and will review later
      // await updateAssetPriceFromMarketMutation.mutateAsync(assetId);
    } catch (error) {
      console.error('Price history refresh error:', error);
      throw error;
    }
  };

  const handleUpdateAllPrices = async () => {
    try {
      // Trigger manual sync
      await apiService.triggerGlobalAssetsSync();
      // Refresh assets after sync
      await refetchAssets();
    } catch (error) {
      console.error('Failed to trigger manual sync:', error);
      throw error;
    }
  };

  // Combine loading states
  const isLoading = assetsLoading || updateAssetPriceMutation.isLoading || updateAssetPriceFromMarketMutation.isLoading || createGlobalAssetMutation.isLoading || updateGlobalAssetMutation.isLoading;
  
  // Combine error states
  const error = assetsError;
  const errorMessage = error ? (error as Error)?.message || String(error) : undefined;

  return (
    <Box>
      {/* Auto Sync Toggle Section */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ResponsiveTypography variant="pageHeader">
            Market Price Auto Sync
          </ResponsiveTypography>
          <Stack direction="row" spacing={1}>
            <UpdatePriceByDateButton
              onUpdateSuccess={(_result: BulkUpdateResult) => {
                // Refresh assets after successful update
                handleRefresh();
              }}
              variant="outlined"
              size="small"
            />
            <HistoricalPricesButton
              variant="button"
              size="small"
              color="secondary"
              onSuccess={(_result) => {
                // Refresh assets after successful update
                handleRefresh();
              }}
            />
          </Stack>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 2, sm: 0 },
          mb: 1 
        }}>
          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
            <ResponsiveTypography variant="cardLabel">
              Status: <strong>{isAutoSyncEnabled ? 'Enabled' : 'Disabled'}</strong>
            </ResponsiveTypography>
            <ResponsiveTypography variant="cardLabel">
              Last update: <strong>{lastDataUpdate ? new Date(lastDataUpdate).toLocaleString() : (statusLoading ? 'Loading...' : 'N/A')}</strong>
            </ResponsiveTypography>
            <ResponsiveTypography variant="cardLabel">
              Next run: <strong>{nextUpdate ? new Date(nextUpdate).toLocaleString() : (statusLoading ? 'Loading...' : 'N/A')}</strong>
            </ResponsiveTypography>
          </Stack>
          <AutoSyncToggle
            onToggle={(_enabled) => {
            }}
          />
        </Box>
      </Paper>

      <GlobalAssetManagement
        assets={assets}
        loading={isLoading}
        error={errorMessage}
        onRefresh={handleRefresh}
        onCreateAsset={handleCreateAsset}
        onUpdateAsset={handleUpdateAsset}
        total={total}
        page={currentPage || page}
        totalPages={totalPages}
        onPriceUpdate={handlePriceUpdate}
        onPriceHistoryRefresh={handlePriceHistoryRefresh}
        onUpdateAllPrices={handleUpdateAllPrices}
        onChangePage={handleChangePage}
        onChangeRowsPerPage={handleChangeRowsPerPage}
        rowsPerPage={limit}
      />
    </Box>
  );
};

export default GlobalAssetsPage;
