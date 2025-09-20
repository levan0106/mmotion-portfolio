// SnapshotSimpleList Component for CR-006 Asset Snapshot System

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ShowChart as StockIcon,
  Diamond as GoldIcon,
  AccountBalanceWallet as BondIcon,
  CurrencyExchange as ForexIcon,
} from '@mui/icons-material';
import { useSnapshots } from '../../hooks/useSnapshots';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAssets } from '../../hooks/useAssets';
import { useAccount } from '../../hooks/useAccount';
import { usePortfolioSnapshots } from '../../hooks/usePortfolioSnapshots';
import { SnapshotResponse, SnapshotQueryParams } from '../../types/snapshot.types';
import { formatCurrency, formatPercentage, formatDate, formatNumber } from '../../utils/format';

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

        {/* Portfolio Snapshots List View */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Portfolio Summary
          </Typography>
          
          {portfolioSnapshotsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          {portfolioSnapshotsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {portfolioSnapshotsError}
            </Alert>
          )}
          
          {portfolioSnapshots && portfolioSnapshots.length > 0 ? (
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Portfolio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total Value</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Total P&L</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Unrealized P&L</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Realized P&L</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Cash Balance</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Daily Return</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Assets</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Granularity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolioSnapshots.map((snapshot) => (
                    <TableRow key={snapshot.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(snapshot.snapshotDate)}
                      </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                        {snapshot.portfolioName}
                      </Typography>
                      </TableCell>
                      <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(Number(snapshot.totalValue || 0), baseCurrency)}
                          </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={snapshot.totalPl && Number(snapshot.totalPl) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {snapshot.totalPl && Number(snapshot.totalPl) >= 0 ? '+' : ''}
                          {formatCurrency(Number(snapshot.totalPl || 0), baseCurrency)}
                          </Typography>
                      </TableCell>
                      <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                          color={snapshot.unrealizedPl && Number(snapshot.unrealizedPl) >= 0 ? 'success.main' : 'error.main'}
                          >
                          {snapshot.unrealizedPl && Number(snapshot.unrealizedPl) >= 0 ? '+' : ''}
                          {formatCurrency(Number(snapshot.unrealizedPl || 0), baseCurrency)}
                          </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={snapshot.realizedPl && Number(snapshot.realizedPl) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {snapshot.realizedPl && Number(snapshot.realizedPl) >= 0 ? '+' : ''}
                          {formatCurrency(Number(snapshot.realizedPl || 0), baseCurrency)}
                          </Typography>
                      </TableCell>
                      <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(Number(snapshot.cashBalance || 0), baseCurrency)}
                          </Typography>
                      </TableCell>
                      <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontWeight={600}
                          color={snapshot.dailyReturn && Number(snapshot.dailyReturn) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {snapshot.dailyReturn && Number(snapshot.dailyReturn) >= 0 ? '+' : ''}
                          {formatPercentage(Number(snapshot.dailyReturn || 0))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {snapshot.assetCount || 0}
                          </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={snapshot.granularity} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                No portfolio snapshots available
              </Typography>
            </Box>
          )}
        </Box>

        {/* Warning for missing portfolios */}
        {snapshots && portfolios.length > 0 && (
          (() => {
            const missingPortfolios = snapshots
              .map(s => s.portfolioId)
              .filter((portfolioId, index, self) => 
                self.indexOf(portfolioId) === index && 
                !portfolios.find(p => p.portfolioId === portfolioId)
              );
            
            if (missingPortfolios.length > 0) {
              return (
                <Alert severity="warning" sx={{ m: 2 }}>
                  Some snapshots reference portfolios that are not found: {missingPortfolios.map(id => id.substring(0, 8) + '...').join(', ')}
                </Alert>
              );
            }
            return null;
          })()
        )}

        {/* Collapsible Table Layout */}
        <TableContainer sx={{ flexGrow: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={allExpanded ? "Collapse All" : "Expand All"}>
                      <IconButton 
                        size="small" 
                        onClick={toggleAll} 
                        disabled={loading}
                        sx={{ p: 0.5 }}
                      >
                        {allExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Date
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                  </Box>
                </TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Total P&L</TableCell>
                <TableCell>Unrealized P&L</TableCell>
                <TableCell>Realized P&L</TableCell>
                <TableCell>Return %</TableCell>
                <TableCell>Granularity</TableCell>
                {showActions && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                // Group by date first, then by asset type
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

                const dates = Object.keys(groupedByDate).sort();
                
                return dates.map((date) => {
                  const dateGroups = groupedByDate[date];
                  const assetTypes = Object.keys(dateGroups).sort();
                  
                  return assetTypes.map((assetType) => {
                    const typeSnapshots = dateGroups[assetType];
                    const isExpanded = expandedAssetTypes.has(`${date}_${assetType}`);
                    
                    // Calculate totals for asset type
                    const totalValue = typeSnapshots.reduce((sum, s) => sum + Number(s.currentValue || 0), 0);
                    const totalPl = typeSnapshots.reduce((sum, s) => sum + Number(s.totalPl || 0), 0);
                    const totalUnrealizedPl = typeSnapshots.reduce((sum, s) => sum + Number(s.unrealizedPl || 0), 0);
                    const totalRealizedPl = typeSnapshots.reduce((sum, s) => sum + Number(s.realizedPl || 0), 0);
                    const totalQuantity = typeSnapshots.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
                    const avgPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                    const avgReturn = typeSnapshots.length > 0 ? 
                      typeSnapshots.reduce((sum, s) => sum + Number(s.returnPercentage || 0), 0) / typeSnapshots.length : 0;
                    
                    return (
                      <React.Fragment key={`${date}_${assetType}`}>
                        {/* Level 1: Date + Asset Type Row with full fields */}
                        <TableRow 
                          hover 
                          sx={{ 
                            bgcolor: isExpanded ? 'action.hover' : 'transparent',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => toggleAssetType(`${date}_${assetType}`)}
                        >
                  <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatDate(date)}
                              </Typography>
                            </Box>
                  </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getAssetTypeIcon(assetType)}
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {assetType.toUpperCase()}
                              </Typography>
                              <Chip
                                label={`${typeSnapshots.length} assets`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatNumber(totalQuantity, 4)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatCurrency(avgPrice, baseCurrency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatCurrency(totalValue, baseCurrency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ fontWeight: 500 }}
                              color={totalPl >= 0 ? 'success.main' : 'error.main'}
                            >
                              {totalPl >= 0 ? '+' : ''}{formatCurrency(totalPl, baseCurrency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ fontWeight: 500 }}
                              color={totalUnrealizedPl >= 0 ? 'success.main' : 'error.main'}
                            >
                              {totalUnrealizedPl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPl, baseCurrency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ fontWeight: 500 }}
                              color={totalRealizedPl >= 0 ? 'success.main' : 'error.main'}
                            >
                              {totalRealizedPl >= 0 ? '+' : ''}{formatCurrency(totalRealizedPl, baseCurrency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ fontWeight: 500 }}
                              color={avgReturn >= 0 ? 'success.main' : 'error.main'}
                            >
                              {avgReturn >= 0 ? '+' : ''}{formatPercentage(avgReturn)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {typeSnapshots[0]?.granularity || 'DAILY'}
                            </Typography>
                          </TableCell>
                          {showActions && (
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Could show aggregated details
                                    }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          )}
                        </TableRow>
                        
                        {/* Level 2: Asset Details */}
                        {typeSnapshots.map((snapshot: any, index: number) => (
                          <TableRow 
                            key={snapshot.id || `${snapshot.assetSymbol}_${index}`} 
                            hover
                            sx={{ 
                              display: isExpanded ? 'table-row' : 'none',
                              '& td': { borderTop: 0 }
                            }}
                          >
                            <TableCell sx={{ pl: 4 }}>
                              {formatDate(snapshot.snapshotDate)}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUpIcon fontSize="small" color="primary" />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {snapshot.displayName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatNumber(Number(snapshot.quantity || 0), 4)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatCurrency(Number(snapshot.currentPrice || 0), baseCurrency)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatCurrency(Number(snapshot.currentValue || 0), baseCurrency)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ fontWeight: 500 }}
                                color={Number(snapshot.totalPl || 0) >= 0 ? 'success.main' : 'error.main'}
                              >
                                {Number(snapshot.totalPl || 0) >= 0 ? '+' : ''}{formatCurrency(Number(snapshot.totalPl || 0), baseCurrency)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ fontWeight: 500 }}
                                color={Number(snapshot.unrealizedPl || 0) >= 0 ? 'success.main' : 'error.main'}
                              >
                                {Number(snapshot.unrealizedPl || 0) >= 0 ? '+' : ''}{formatCurrency(Number(snapshot.unrealizedPl || 0), baseCurrency)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ fontWeight: 500 }}
                                color={Number(snapshot.realizedPl || 0) >= 0 ? 'success.main' : 'error.main'}
                              >
                                {Number(snapshot.realizedPl || 0) >= 0 ? '+' : ''}{formatCurrency(Number(snapshot.realizedPl || 0), baseCurrency)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ fontWeight: 500 }}
                                color={Number(snapshot.returnPercentage || 0) >= 0 ? 'success.main' : 'error.main'}
                              >
                                {Number(snapshot.returnPercentage || 0) >= 0 ? '+' : ''}{formatPercentage(Number(snapshot.returnPercentage || 0))}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {snapshot.granularity}
                              </Typography>
                            </TableCell>
                            {showActions && (
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => onSnapshotSelect?.(snapshot)}
                                    >
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="small"
                                      onClick={() => onSnapshotEdit?.(snapshot)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => onSnapshotDelete?.(snapshot)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  });
                }).flat();
              })()}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={pagination.total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default SnapshotSimpleList;
