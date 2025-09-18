import React from 'react';
import { Container } from '@mui/material';
import GlobalAssetManagement from '../components/GlobalAssetManagement';
import { useGlobalAssets, useUpdateAssetPrice, useUpdateAssetPriceFromMarket } from '../hooks/useGlobalAssets';
import { useMarketDataStats, useMarketDataProviders, useRecentUpdates } from '../hooks/useMarketData';


const GlobalAssetsPage: React.FC = () => {
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

  const handlePriceHistoryRefresh = async (assetId: string) => {
    try {
      await updateAssetPriceFromMarketMutation.mutateAsync(assetId);
    } catch (error) {
      console.error('Price history refresh error:', error);
      throw error;
    }
  };

  const handleMarketDataRefresh = async () => {
    // This will be handled by the MarketDataDashboard component
  };

  const handleUpdateAllPrices = async () => {
    // This will be handled by the MarketDataDashboard component
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
