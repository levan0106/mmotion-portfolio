// SnapshotSimpleList Component for CR-006 Asset Snapshot System

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  ShowChart as StockIcon,
  Diamond as GoldIcon,
  AccountBalanceWallet as BondIcon,
  CurrencyExchange as ForexIcon,
  Dashboard as PortfolioIcon,
  BarChart as PerformanceIcon,
  Group as AssetGroupIcon,
  Assessment as AssetIcon,
} from '@mui/icons-material';
import { useSnapshots } from '../../../hooks/useSnapshots';
import { usePortfolios } from '../../../hooks/usePortfolios';
import { useAssets } from '../../../hooks/useAssets';
import { useAccount } from '../../../hooks/useAccount';
import { usePortfolioSnapshots } from '../../../hooks/usePortfolioSnapshots';
import { SnapshotResponse, SnapshotQueryParams, SnapshotGranularity } from '../../../types/snapshot.types';
import { snapshotService } from '../../../services/snapshot.service';

// Import tab components
import SnapshotPortfolioSummaryTab from './tabs/PortfolioSummaryTab';
import SnapshotPortfolioPerformanceTab from './tabs/SnapshotPortfolioPerformanceTab';
import SnapshotAssetGroupPerformanceTab from './tabs/SnapshotAssetGroupPerformanceTab';
import SnapshotAssetPerformanceTab from './tabs/SnapshotAssetPerformanceTab';
import SnapshotAssetSnapshotTab from './tabs/SnapshotAssetSnapshotTab';

interface SnapshotSimpleListProps {
  portfolioId?: string;
  onSnapshotSelect?: (snapshot: SnapshotResponse) => void;
  onSnapshotEdit?: (snapshot: SnapshotResponse) => void;
  onSnapshotDelete?: (snapshot: SnapshotResponse) => void;
  showActions?: boolean;
  pageSize?: number;
  refreshTrigger?: number; // Add refresh trigger prop
}

export const SnapshotSimpleList: React.FC<SnapshotSimpleListProps> = ({
  portfolioId,
  onSnapshotSelect,
  onSnapshotEdit,
  onSnapshotDelete,
  showActions = true,
  pageSize = 25,
  refreshTrigger,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [expandedAssetTypes, setExpandedAssetTypes] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [portfolioPerformanceData, setPortfolioPerformanceData] = useState<any[]>([]);
  const [assetGroupPerformanceData, setAssetGroupPerformanceData] = useState<any[]>([]);
  const [assetPerformanceData, setAssetPerformanceData] = useState<any[]>([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Load performance data
  const loadPerformanceData = async () => {
    if (!portfolioId) return;
    
    setPerformanceLoading(true);
    try {
      const [portfolioPerf, assetGroupPerf, assetPerf] = await Promise.all([
        snapshotService.getPortfolioPerformanceSnapshots(portfolioId, { granularity: SnapshotGranularity.DAILY }),
        snapshotService.getAssetGroupPerformanceSnapshots(portfolioId, { granularity: SnapshotGranularity.DAILY }),
        snapshotService.getAssetPerformanceSnapshots(portfolioId, { granularity: SnapshotGranularity.DAILY }),
      ]);

      setPortfolioPerformanceData(portfolioPerf || []);
      setAssetGroupPerformanceData(assetGroupPerf || []);
      setAssetPerformanceData(assetPerf || []);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Load performance data when portfolioId changes
  useEffect(() => {
    loadPerformanceData();
  }, [portfolioId, refreshTrigger]);

  // Helper functions
  const toggleAssetType = (assetType: string) => {
    const newExpanded = new Set(expandedAssetTypes);
    if (newExpanded.has(assetType)) {
      newExpanded.delete(assetType);
    } else {
      newExpanded.add(assetType);
    }
    setExpandedAssetTypes(newExpanded);
    
    // Update allExpanded state based on current expanded items
    const totalGroups = transformedSnapshots.reduce((acc, snapshot) => {
      const date = snapshot.snapshotDate;
      const assetType = snapshot.displayType;
      const key = `${date}_${assetType}`;
      if (!acc.has(key)) {
        acc.add(key);
      }
      return acc;
    }, new Set<string>());
    
    setAllExpanded(newExpanded.size === totalGroups.size);
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedAssetTypes(new Set());
    } else {
      // Group by date and asset type to get all unique keys
      const groupedByDate = transformedSnapshots.reduce((acc, snapshot) => {
        const date = snapshot.snapshotDate;
        if (!acc[date]) {
          acc[date] = {};
        }
        
        const assetType = snapshot.displayType;
        if (!acc[date][assetType]) {
          acc[date][assetType] = [];
        }
        
        acc[date][assetType].push(snapshot);
        return acc;
      }, {} as Record<string, Record<string, any[]>>);

      const allKeys = new Set<string>();
      Object.keys(groupedByDate).forEach(date => {
        Object.keys(groupedByDate[date]).forEach(assetType => {
          allKeys.add(`${date}_${assetType}`);
        });
      });
      
      setExpandedAssetTypes(allKeys);
    }
    setAllExpanded(!allExpanded);
  };

  // Helper function for asset type icons
  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType.toLowerCase()) {
      case 'stock':
      case 'equity':
        return <StockIcon />;
      case 'gold':
      case 'commodity':
        return <GoldIcon />;
      case 'bond':
      case 'fixed income':
        return <BondIcon />;
      case 'forex':
      case 'currency':
        return <ForexIcon />;
      default:
        return <CategoryIcon />;
    }
  };

  // Real data from APIs
  const { accountId } = useAccount();
  const { portfolios, isLoading: portfoliosLoading } = usePortfolios(accountId);
  const baseCurrency = portfolios.find(p => p.portfolioId === portfolioId)?.baseCurrency || 'VND';
  const { assets, loading: assetsLoading } = useAssets({ autoFetch: true });

  // Portfolio Snapshots
  const { 
    portfolioSnapshots, 
    loading: portfolioSnapshotsLoading, 
    error: portfolioSnapshotsError,
    refreshPortfolioSnapshots
  } = usePortfolioSnapshots({
    portfolioId,
    autoFetch: true,
  });

  // Debug logging
  console.log('SnapshotSimpleList Debug:', {
    portfolioId,
    portfolioSnapshots,
    portfolioSnapshotsLoading,
    portfolioSnapshotsError,
    portfolioSnapshotsLength: portfolioSnapshots?.length
  });

  // Build query params
  const queryParams: SnapshotQueryParams = useMemo(() => {
    const params: SnapshotQueryParams = {
      page: page + 1,
      limit: rowsPerPage,
    };

    if (portfolioId) {
      params.portfolioId = portfolioId;
    }

    return params;
  }, [portfolioId, page, rowsPerPage]);

  const {
    snapshots,
    loading,
    error,
    pagination,
    fetchSnapshotsPaginated,
    refreshSnapshots,
  } = useSnapshots(queryParams);

  useEffect(() => {
    if (queryParams) {
      fetchSnapshotsPaginated(queryParams);
    }
  }, [queryParams, fetchSnapshotsPaginated]);

  // Trigger refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('SnapshotSimpleList: refreshTrigger changed, refreshing data');
      handleRefresh();
    }
  }, [refreshTrigger]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    console.log('handleRefresh called');
    console.log('refreshSnapshots:', refreshSnapshots);
    console.log('refreshPortfolioSnapshots:', refreshPortfolioSnapshots);
    
    if (refreshSnapshots) {
      refreshSnapshots();
    } else {
      console.error('refreshSnapshots is not available');
    }
    
    if (refreshPortfolioSnapshots) {
      refreshPortfolioSnapshots();
    } else {
      console.error('refreshPortfolioSnapshots is not available');
    }
    
    // Note: portfolios and assets will refresh automatically due to their hooks
  };

  // Transform snapshots based on view mode
  const transformedSnapshots = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      return [];
    }

    // Simple list - no grouping, just add display properties and sort by date descending
    return snapshots
      .map((snapshot) => ({
        ...snapshot,
        displayName: snapshot.assetSymbol,
        displayType: assets.find(a => a.symbol === snapshot.assetSymbol)?.type || 'Unknown',
        displayIcon: <TrendingUpIcon fontSize="small" />,
      }))
      .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
  }, [snapshots, assets]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Content */}
      <Paper elevation={0} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: 1, borderColor: 'divider' }}>
        {/* Loading */}
        {(loading || portfoliosLoading || assetsLoading || portfolioSnapshotsLoading) && <LinearProgress />}

        {/* Error */}
        {(error || portfolioSnapshotsError) && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error || portfolioSnapshotsError}
          </Alert>
        )}

        {/* Performance Snapshots Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              icon={<PortfolioIcon />} 
              iconPosition="start" 
              label="Portfolios" 
              sx={{ minWidth: 120 }}
            />
            <Tab 
              icon={<PerformanceIcon />} 
              iconPosition="start" 
              label="Portfolio Performance" 
              sx={{ minWidth: 160 }}
            />
            <Tab 
              icon={<AssetGroupIcon />} 
              iconPosition="start" 
              label="Asset Group Performance" 
              sx={{ minWidth: 180 }}
            />
            <Tab 
              icon={<AssetIcon />} 
              iconPosition="start" 
              label="Asset Performance" 
              sx={{ minWidth: 160 }}
            />
            <Tab 
              icon={<TrendingUpIcon />} 
              iconPosition="start" 
              label="Asset Snapshots" 
              sx={{ minWidth: 140 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {activeTab === 0 && (
            <SnapshotPortfolioSummaryTab 
              portfolioSnapshots={portfolioSnapshots}
              portfolioSnapshotsLoading={portfolioSnapshotsLoading}
              portfolioSnapshotsError={portfolioSnapshotsError}
              baseCurrency={baseCurrency}
            />
          )}

          {activeTab === 1 && (
            <SnapshotPortfolioPerformanceTab 
              portfolioPerformanceData={portfolioPerformanceData}
              performanceLoading={performanceLoading}
              baseCurrency={baseCurrency}
            />
          )}

          {activeTab === 2 && (
            <SnapshotAssetGroupPerformanceTab 
              assetGroupPerformanceData={assetGroupPerformanceData}
              performanceLoading={performanceLoading}
            />
          )}

          {activeTab === 3 && (
            <SnapshotAssetPerformanceTab 
              assetPerformanceData={assetPerformanceData}
              performanceLoading={performanceLoading}
              baseCurrency={baseCurrency}
            />
          )}

          {activeTab === 4 && (
            <SnapshotAssetSnapshotTab 
              transformedSnapshots={transformedSnapshots}
              expandedAssetTypes={expandedAssetTypes}
              allExpanded={allExpanded}
              toggleAssetType={toggleAssetType}
              toggleAll={toggleAll}
              getAssetTypeIcon={getAssetTypeIcon}
              baseCurrency={baseCurrency}
              showActions={showActions}
              onSnapshotSelect={onSnapshotSelect}
              onSnapshotEdit={onSnapshotEdit}
              onSnapshotDelete={onSnapshotDelete}
              loading={loading}
              pagination={pagination}
              page={page}
              rowsPerPage={rowsPerPage}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              snapshots={snapshots}
              portfolios={portfolios}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SnapshotSimpleList;
