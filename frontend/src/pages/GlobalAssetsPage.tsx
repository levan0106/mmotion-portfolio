import React from 'react';
import { Container, Box, Paper, Typography, Stack } from '@mui/material';
import GlobalAssetManagement from '../components/GlobalAssetManagement';
import AutoSyncToggle from '../components/GlobalAssetManagement/AutoSyncToggle';
import { UpdatePriceByDateButton } from '../components/AssetPrice';
import { HistoricalPricesButton } from '../components/HistoricalPrices';
import { PermissionGuard } from '../components/Common/PermissionGuard';
import { useGlobalAssets, useUpdateAssetPrice, useUpdateAssetPriceFromMarket, useAutoSync } from '../hooks/useGlobalAssets';
import { useMarketDataStats, useMarketDataProviders, useRecentUpdates } from '../hooks/useMarketData';
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
  const { 
    data: assets = [], 
    isLoading: assetsLoading, 
    error: assetsError,
    refetch: refetchAssets,
    total,
    page,
    totalPages
  } = useGlobalAssets({ limit: 50 }); // Increase limit to 50

  const { 
    data: marketDataStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useMarketDataStats();

  const { 
    data: providers = [], 
    isLoading: providersLoading, 
    error: providersError 
  } = useMarketDataProviders();

  const { 
    data: recentUpdates = [], 
    isLoading: updatesLoading, 
    error: updatesError 
  } = useRecentUpdates(50);

  // Price update hooks
  const updateAssetPriceMutation = useUpdateAssetPrice();
  const updateAssetPriceFromMarketMutation = useUpdateAssetPriceFromMarket();
  
  // Auto sync hook
  const { } = useAutoSync();

  // API handlers using real hooks
  const handleRefresh = async () => {
    await refetchAssets();
  };

  const handleCreateAsset = async (_data: any) => {
    // This will be handled by the GlobalAssetManagement component
  };

  const handleUpdateAsset = async (_id: string, _data: any) => {
    // This will be handled by the GlobalAssetManagement component
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

  const handleMarketDataRefresh = async () => {
    await refetchAssets();
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

  const handleUpdateByNation = async (_nation: string) => {
    // This will be handled by the MarketDataDashboard component
  };

  const handleUpdateByMarket = async (_marketCode: string) => {
    // This will be handled by the MarketDataDashboard component
  };

  const handleTestProvider = async (_providerName: string) => {
    // This will be handled by the MarketDataDashboard component
  };

  const handleUpdateConfig = async (_config: any) => {
    // This will be handled by the MarketDataDashboard component
  };

  // Combine loading states
  const isLoading = assetsLoading || statsLoading || providersLoading || updatesLoading || 
                   updateAssetPriceMutation.isLoading || updateAssetPriceFromMarketMutation.isLoading;
  
  // Combine error states
  const error = assetsError || statsError || providersError || updatesError;
  const errorMessage = error ? (error as Error)?.message || String(error) : undefined;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Auto Sync Toggle Section */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Market Price Auto Sync
          </Typography>
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
        <AutoSyncToggle
          onToggle={(_enabled) => {
          }}
        />
      </Paper>

      <GlobalAssetManagement
        assets={assets}
        loading={isLoading}
        error={errorMessage}
        onRefresh={handleRefresh}
        onCreateAsset={handleCreateAsset}
        onUpdateAsset={handleUpdateAsset}
        total={total}
        page={page}
        totalPages={totalPages}
        onPriceUpdate={handlePriceUpdate}
        onPriceHistoryRefresh={handlePriceHistoryRefresh}
        marketDataStats={marketDataStats}
        marketDataProviders={providers}
        recentUpdates={recentUpdates}
        onMarketDataRefresh={handleMarketDataRefresh}
        onUpdateAllPrices={handleUpdateAllPrices}
        onUpdateByNation={handleUpdateByNation}
        onUpdateByMarket={handleUpdateByMarket}
        onTestProvider={handleTestProvider}
        onUpdateConfig={handleUpdateConfig}
      />
    </Container>
  );
};

export default GlobalAssetsPage;
