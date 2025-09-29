// SnapshotSimpleList Component for CR-006 Asset Snapshot System

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Button,
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
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSnapshots } from '../../../hooks/useSnapshots';
import { usePortfolioSnapshots } from '../../../hooks/usePortfolioSnapshots';
import { usePortfolios } from '../../../hooks/usePortfolios';
import { useAssets } from '../../../hooks/useAssets';
import { useAccount } from '../../../hooks/useAccount';
import { usePagination } from '../../../hooks/usePagination';
import { SnapshotResponse, SnapshotQueryParams, SnapshotGranularity } from '../../../types/snapshot.types';
import { snapshotService } from '../../../services/snapshot.service';
// Simplified logic - useQueryClient removed

// Import tab components
import PortfolioSummaryTab from './tabs/PortfolioSummaryTab';
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
  onPortfolioRefresh?: (portfolioId: string) => void; // Add portfolio refresh callback
}

export const SnapshotSimpleList: React.FC<SnapshotSimpleListProps> = ({
  portfolioId,
  onSnapshotSelect,
  onSnapshotEdit,
  onSnapshotDelete,
  showActions = true,
  pageSize = 25,
  // refreshTrigger and onPortfolioRefresh removed for simplified logic
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  
  // Separate pagination state for Portfolio Summary tab
  const [portfolioSummaryPage, setPortfolioSummaryPage] = useState(0);
  const [portfolioSummaryRowsPerPage, setPortfolioSummaryRowsPerPage] = useState(pageSize);
  const [expandedAssetTypes, setExpandedAssetTypes] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [portfolioPerformanceData, setPortfolioPerformanceData] = useState<any>({ data: [], page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [assetGroupPerformanceData, setAssetGroupPerformanceData] = useState<any>({ data: [], page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [assetPerformanceData, setAssetPerformanceData] = useState<any>({ data: [], page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [performanceLoading, setPerformanceLoading] = useState(false);
  
  // Pagination hooks for each performance tab
  const portfolioPagination = usePagination(25);
  const assetGroupPagination = usePagination(25);
  const assetPagination = usePagination(25);
  
  // Simplified logic - queryClient removed

  // Simplified logic - refreshPortfolioData removed

  // Load Portfolio Performance data only
  const loadPortfolioPerformanceData = useCallback(async () => {
    if (!portfolioId) return;
    
    setPerformanceLoading(true);
    try {
      const portfolioPerf = await snapshotService.getPortfolioPerformanceSnapshotsPaginated(portfolioId, { 
        granularity: SnapshotGranularity.DAILY,
        page: portfolioPagination.pagination.page,
        limit: portfolioPagination.pagination.limit
      });

      setPortfolioPerformanceData(portfolioPerf || { data: [], page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
      
      // Update pagination state
      if (portfolioPerf) {
        portfolioPagination.updatePagination({
          page: portfolioPerf.page,
          limit: portfolioPerf.limit,
          total: portfolioPerf.total,
          totalPages: portfolioPerf.totalPages,
          hasNext: portfolioPerf.hasNext,
          hasPrev: portfolioPerf.hasPrev
        });
      }
    } catch (error) {
      console.error('Error loading portfolio performance data:', error);
    } finally {
      setPerformanceLoading(false);
    }
  }, [portfolioId, portfolioPagination.pagination]);

  // Load Asset Group Performance data only
  const loadAssetGroupPerformanceData = useCallback(async () => {
    if (!portfolioId) return;
    
    setPerformanceLoading(true);
    try {
      const assetGroupPerf = await snapshotService.getAssetGroupPerformanceSnapshotsPaginated(portfolioId, { 
        granularity: SnapshotGranularity.DAILY,
        page: assetGroupPagination.pagination.page,
        limit: assetGroupPagination.pagination.limit
      });

      setAssetGroupPerformanceData(assetGroupPerf || { data: [], page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
      
      // Update pagination state
      if (assetGroupPerf) {
        assetGroupPagination.updatePagination({
          page: assetGroupPerf.page,
          limit: assetGroupPerf.limit,
          total: assetGroupPerf.total,
          totalPages: assetGroupPerf.totalPages,
          hasNext: assetGroupPerf.hasNext,
          hasPrev: assetGroupPerf.hasPrev
        });
      }
    } catch (error) {
      console.error('Error loading asset group performance data:', error);
    } finally {
      setPerformanceLoading(false);
    }
  }, [portfolioId, assetGroupPagination.pagination]);

  // Load Asset Performance data only
  const loadAssetPerformanceData = useCallback(async () => {
    if (!portfolioId) return;
    
    setPerformanceLoading(true);
    try {
      const assetPerf = await snapshotService.getAssetPerformanceSnapshotsPaginated(portfolioId, { 
        granularity: SnapshotGranularity.DAILY,
        page: assetPagination.pagination.page,
        limit: assetPagination.pagination.limit
      });

      setAssetPerformanceData(assetPerf || { data: [], page: 1, limit: 25, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
      
      // Update pagination state
      if (assetPerf) {
        assetPagination.updatePagination({
          page: assetPerf.page,
          limit: assetPerf.limit,
          total: assetPerf.total,
          totalPages: assetPerf.totalPages,
          hasNext: assetPerf.hasNext,
          hasPrev: assetPerf.hasPrev
        });
      }
    } catch (error) {
      console.error('Error loading asset performance data:', error);
    } finally {
      setPerformanceLoading(false);
    }
  }, [portfolioId, assetPagination.pagination]);




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

  // Portfolio/Fund Snapshots - Using dedicated portfolio snapshots API with pagination
  const portfolioSnapshotsOptions = useMemo(() => ({
    portfolioId,
    autoFetch: true,
    page: portfolioSummaryPage + 1,
    limit: portfolioSummaryRowsPerPage,
  }), [portfolioId, portfolioSummaryPage, portfolioSummaryRowsPerPage]);

  const { 
    portfolioSnapshots, 
    loading: portfolioSnapshotsLoading, 
    error: portfolioSnapshotsError,
    pagination: portfolioSnapshotsPagination,
    refreshPortfolioSnapshots
  } = usePortfolioSnapshots(portfolioSnapshotsOptions);

  useEffect(() => {
    if (portfolioId) {
      // Fetch data for the active tab
      if (activeTab === 0) {
        // Portfolio Summary - manual refresh to ensure data is up to date
        if (portfolioId) {
          refreshPortfolioSnapshots();
        }
      } else if (activeTab === 1) {
        // Portfolio Performance
        loadPortfolioPerformanceData();
      } else if (activeTab === 2) {
        // Asset Group Performance
        loadAssetGroupPerformanceData();
      } else if (activeTab === 3) {
        // Asset Performance
        loadAssetPerformanceData();
      } else if (activeTab === 4) {
        // Asset Snapshots - manual fetch to ensure data is up to date
        if (portfolioId) {
          fetchSnapshotsPaginated(queryParams);
        }
      }
    }
  }, [activeTab, portfolioId]);

  useEffect(() => {
    if (portfolioId && activeTab === 1) {
      loadPortfolioPerformanceData();
    }
  }, [portfolioPagination.pagination.page, portfolioPagination.pagination.limit]);

  useEffect(() => {
    if (portfolioId && activeTab === 2) {
      loadAssetGroupPerformanceData();
    }
  }, [assetGroupPagination.pagination.page, assetGroupPagination.pagination.limit]);

  useEffect(() => {
    if (portfolioId && activeTab === 3) {
      loadAssetPerformanceData();
    }
  }, [assetPagination.pagination.page, assetPagination.pagination.limit]);

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

  // Simplified logic - only fetch when needed
  const {
    snapshots,
    loading,
    error,
    pagination,
    fetchSnapshotsPaginated,
  } = useSnapshots();



  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    if (activeTab === 4 && portfolioId) {
      fetchSnapshotsPaginated(queryParams);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    // Fetch data for Asset Snapshots tab when rows per page changes
    if (activeTab === 4 && portfolioId) {
      fetchSnapshotsPaginated(queryParams);
    }
  };

  const handleRefresh = async () => {
    
    try {
      if (portfolioId) {
        refreshPortfolioSnapshots();
      }
      
      if (activeTab === 1) {
        loadPortfolioPerformanceData();
      } else if (activeTab === 2) {
        loadAssetGroupPerformanceData();
      } else if (activeTab === 3) {
        loadAssetPerformanceData();
      } else if (activeTab === 4) {
        fetchSnapshotsPaginated(queryParams);
      }
      
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
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
        displayType: snapshot.assetType || assets.find(a => a.symbol === snapshot.assetSymbol)?.type || 'Unknown',
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
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }}
          >
            <Tab 
              icon={<PortfolioIcon />} 
              iconPosition="start" 
              label="Portfolio Summary" 
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
          
          {/* Refresh Button */}
          <Box sx={{ p: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading || portfolioSnapshotsLoading || performanceLoading}
            >
              Refresh Data
            </Button>
          </Box>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 2 }}>
          {activeTab === 0 && (
            <PortfolioSummaryTab
              portfolioSnapshots={portfolioSnapshots}
              portfolioSnapshotsLoading={portfolioSnapshotsLoading}
              portfolioSnapshotsError={portfolioSnapshotsError}
              portfolioSnapshotsPagination={portfolioSnapshotsPagination}
              baseCurrency={baseCurrency}
              onPageChange={(page: number) => {
                setPortfolioSummaryPage(page - 1); // Convert from 1-based to 0-based
                if (portfolioId) {
                  refreshPortfolioSnapshots();
                }
              }}
              onLimitChange={(limit: number) => {
                setPortfolioSummaryRowsPerPage(limit);
                setPortfolioSummaryPage(0);
                if (portfolioId) {
                  refreshPortfolioSnapshots();
                }
              }}
            />
          )}

          {activeTab === 1 && (
            <SnapshotPortfolioPerformanceTab 
              portfolioPerformanceData={portfolioPerformanceData}
              performanceLoading={performanceLoading}
              baseCurrency={baseCurrency}
              onPageChange={(page: number) => {
                portfolioPagination.setPage(page);
              }}
              onLimitChange={(limit: number) => {
                portfolioPagination.setLimit(limit);
              }}
            />
          )}

          {activeTab === 2 && (
            <SnapshotAssetGroupPerformanceTab 
              assetGroupPerformanceData={assetGroupPerformanceData}
              performanceLoading={performanceLoading}
              onPageChange={(page: number) => {
                assetGroupPagination.setPage(page);
              }}
              onLimitChange={(limit: number) => {
                assetGroupPagination.setLimit(limit);
              }}
            />
          )}

          {activeTab === 3 && (
            <SnapshotAssetPerformanceTab 
              assetPerformanceData={assetPerformanceData}
              performanceLoading={performanceLoading}
              onPageChange={(page: number) => {
                assetPagination.setPage(page);
              }}
              onLimitChange={(limit: number) => {
                assetPagination.setLimit(limit);
              }}
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
