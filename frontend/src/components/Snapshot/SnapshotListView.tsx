// SnapshotListView Component for CR-006 Asset Snapshot System

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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as PortfolioIcon,
  Category as CategoryIcon,
  Visibility as ViewIcon,
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
import SnapshotListFilters, { SnapshotListFilters as FilterType } from './SnapshotListFilters';
import { formatCurrency, formatPercentage, formatDate, formatNumber } from '../../utils/format';

interface SnapshotListViewProps {
  portfolioId?: string;
  onSnapshotSelect?: (snapshot: SnapshotResponse) => void;
  onSnapshotEdit?: (snapshot: SnapshotResponse) => void;
  onSnapshotDelete?: (snapshot: SnapshotResponse) => void;
  showActions?: boolean;
  pageSize?: number;
}

export const SnapshotListView: React.FC<SnapshotListViewProps> = ({
  portfolioId,
  onSnapshotSelect,
  onSnapshotEdit,
  onSnapshotDelete,
  showActions = true,
  pageSize = 25,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [filters, setFilters] = useState<FilterType>({
    viewMode: 'portfolio',
  });

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
  console.log('SnapshotListView Debug:', {
    portfolioId,
    portfolioSnapshots,
    portfolioSnapshotsLoading,
    portfolioSnapshotsError,
    portfolioSnapshotsLength: portfolioSnapshots?.length
  });

  // Build query params based on filters
  const queryParams: SnapshotQueryParams = useMemo(() => {
    const params: SnapshotQueryParams = {
      page: page + 1,
      limit: rowsPerPage,
    };

    if (filters.portfolioId) {
      params.portfolioId = filters.portfolioId;
    } else if (portfolioId) {
      params.portfolioId = portfolioId;
    }

    if (filters.assetId) {
      params.assetId = filters.assetId;
    }

    if (filters.granularity) {
      params.granularity = filters.granularity;
    }

    if (filters.startDate) {
      params.startDate = filters.startDate;
    }

    if (filters.endDate) {
      params.endDate = filters.endDate;
    }

    return params;
  }, [filters, portfolioId, page, rowsPerPage]);

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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    refreshSnapshots();
    refreshPortfolioSnapshots();
  };


  // Group snapshots by view mode
  const groupedSnapshots = useMemo(() => {
    if (!snapshots) return {};

    switch (filters.viewMode) {
      case 'portfolio':
        return snapshots.reduce((acc, snapshot) => {
          const key = snapshot.portfolioId;
          if (!acc[key]) {
            acc[key] = {
              portfolioId: snapshot.portfolioId,
              portfolioName: portfolios.find(p => p.portfolioId === snapshot.portfolioId)?.name || 'Unknown Portfolio',
              snapshots: [],
              totalValue: 0,
              totalPl: 0,
              totalQuantity: 0,
              assetCount: 0,
              uniqueAssets: new Set(),
            };
          }
          acc[key].snapshots.push(snapshot);
          acc[key].totalValue += Number(snapshot.currentValue || 0);
          acc[key].totalPl += Number(snapshot.totalPl || 0);
          acc[key].totalQuantity += Number(snapshot.quantity || 0);
          acc[key].uniqueAssets.add(snapshot.assetSymbol);
          acc[key].assetCount = acc[key].uniqueAssets.size;
          return acc;
        }, {} as Record<string, any>);

      case 'asset':
        return snapshots.reduce((acc, snapshot) => {
          const key = snapshot.assetSymbol;
          if (!acc[key]) {
            acc[key] = {
              assetSymbol: snapshot.assetSymbol,
              assetType: assets.find(a => a.symbol === snapshot.assetSymbol)?.type || 'Unknown',
              snapshots: [],
              totalValue: 0,
              totalPl: 0,
              totalQuantity: 0,
              portfolioCount: 0,
              uniquePortfolios: new Set(),
            };
          }
          acc[key].snapshots.push(snapshot);
          acc[key].totalValue += Number(snapshot.currentValue || 0);
          acc[key].totalPl += Number(snapshot.totalPl || 0);
          acc[key].totalQuantity += Number(snapshot.quantity || 0);
          acc[key].unrealizedPl = (acc[key].unrealizedPl || 0) + Number(snapshot.unrealizedPl || 0);
          acc[key].realizedPl = (acc[key].realizedPl || 0) + Number(snapshot.realizedPl || 0);
          acc[key].uniquePortfolios.add(snapshot.portfolioId);
          acc[key].portfolioCount = acc[key].uniquePortfolios.size;
          return acc;
        }, {} as Record<string, any>);

      case 'assetType':
        return snapshots.reduce((acc, snapshot) => {
          const assetType = assets.find(a => a.symbol === snapshot.assetSymbol)?.type || 'Unknown';
          if (!acc[assetType]) {
            acc[assetType] = {
              assetType,
              snapshots: [],
              totalValue: 0,
              totalPl: 0,
              totalQuantity: 0,
              assetCount: 0,
              portfolioCount: 0,
              uniqueAssets: new Set(),
              uniquePortfolios: new Set(),
            };
          }
          acc[assetType].snapshots.push(snapshot);
          acc[assetType].totalValue += snapshot.currentValue;
          acc[assetType].totalPl += snapshot.totalPl;
          acc[assetType].totalQuantity += snapshot.quantity;
          acc[assetType].unrealizedPl = (acc[assetType].unrealizedPl || 0) + Number(snapshot.unrealizedPl || 0);
          acc[assetType].realizedPl = (acc[assetType].realizedPl || 0) + Number(snapshot.realizedPl || 0);
          acc[assetType].uniqueAssets.add(snapshot.assetSymbol);
          acc[assetType].uniquePortfolios.add(snapshot.portfolioId);
          acc[assetType].assetCount = acc[assetType].uniqueAssets.size;
          acc[assetType].portfolioCount = acc[assetType].uniquePortfolios.size;
          return acc;
        }, {} as Record<string, any>);

      default:
        return { 'All': { snapshots, totalValue: 0, totalPl: 0, totalQuantity: 0 } };
    }
  }, [snapshots, filters.viewMode, portfolios, assets]);

  const renderGroupedView = () => {
    const groups = Object.values(groupedSnapshots);
    
    if (groups.length === 0) {
      return (
        <Alert severity="info" sx={{ m: 2 }}>
          No snapshots found with the current filters.
        </Alert>
      );
    }

    return (
      <Box>
        {groups.map((group: any, index) => (
          <Accordion key={index} defaultExpanded={groups.length <= 3}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                {filters.viewMode === 'portfolio' && (
                  <>
                    <PortfolioIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {group.portfolioName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {group.portfolioId.substring(0, 8)}... • {group.snapshots.length} snapshots • {group.assetCount} assets
                      </Typography>
                    </Box>
                  </>
                )}
                {filters.viewMode === 'asset' && (
                  <>
                    <TrendingUpIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {group.assetSymbol}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {group.assetType} • {group.snapshots.length} snapshots • {group.portfolioCount} portfolios
                      </Typography>
                    </Box>
                  </>
                )}
                {filters.viewMode === 'assetType' && (
                  <>
                    {getAssetTypeIcon(group.assetType)}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {group.assetType.toUpperCase()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {group.snapshots.length} snapshots • {group.assetCount} assets • {group.portfolioCount} portfolios
                      </Typography>
                    </Box>
                  </>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Value: ${formatCurrency(group.totalValue, 'USD')}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`P&L: ${formatCurrency(group.totalPl, 'USD')}`}
                    color={group.totalPl >= 0 ? 'success' : 'error'}
                    variant="outlined"
                    size="small"
                  />
                  {group.totalUnrealizedPl !== undefined && (
                    <Chip
                      label={`Unrealized: ${formatCurrency(group.totalUnrealizedPl, 'USD')}`}
                      color={group.totalUnrealizedPl >= 0 ? 'success' : 'error'}
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {group.totalRealizedPl !== undefined && (
                    <Chip
                      label={`Realized: ${formatCurrency(group.totalRealizedPl, 'USD')}`}
                      color={group.totalRealizedPl >= 0 ? 'success' : 'error'}
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {group.totalQuantity && (
                    <Chip
                      label={`Qty: ${formatNumber(Number(group.totalQuantity || 0), 2)}`}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      {filters.viewMode === 'portfolio' && <TableCell>Asset</TableCell>}
                      {filters.viewMode === 'asset' && <TableCell>Portfolio</TableCell>}
                      {filters.viewMode === 'assetType' && (
                        <>
                          <TableCell>Asset</TableCell>
                          <TableCell>Portfolio</TableCell>
                        </>
                      )}
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
                    {group.snapshots.map((snapshot: SnapshotResponse) => (
                      <TableRow key={snapshot.id} hover>
                        <TableCell>
                          {formatDate(snapshot.snapshotDate)}
                        </TableCell>
                        
                        {/* Portfolio View: Show Asset */}
                        {filters.viewMode === 'portfolio' && (
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TrendingUpIcon fontSize="small" />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {snapshot.assetSymbol}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {assets.find(a => a.symbol === snapshot.assetSymbol)?.type || 'Unknown'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                        )}
                        
                        {/* Asset View: Show Portfolio */}
                        {filters.viewMode === 'asset' && (
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PortfolioIcon fontSize="small" />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {portfolios.find(p => p.portfolioId === snapshot.portfolioId)?.name || 'Unknown Portfolio'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {snapshot.portfolioId.substring(0, 8)}...
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                        )}
                        
                        {/* Asset Type View: Show both Asset and Portfolio */}
                        {filters.viewMode === 'assetType' && (
                          <>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TrendingUpIcon fontSize="small" />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {snapshot.assetSymbol}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PortfolioIcon fontSize="small" />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {portfolios.find(p => p.portfolioId === snapshot.portfolioId)?.name || 'Unknown Portfolio'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {snapshot.portfolioId.substring(0, 8)}...
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                          </>
                        )}
                        
                        <TableCell>{formatNumber(Number(snapshot.quantity || 0), 4)}</TableCell>
                        <TableCell>{formatCurrency(Number(snapshot.currentPrice || 0), 'USD')}</TableCell>
                        <TableCell>{formatCurrency(Number(snapshot.currentValue || 0), 'USD')}</TableCell>
                        <TableCell>
                          <Chip
                            label={formatCurrency(Number(snapshot.totalPl || 0), 'USD')}
                            color={Number(snapshot.totalPl || 0) >= 0 ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatCurrency(Number(snapshot.unrealizedPl || 0), 'USD')}
                            color={Number(snapshot.unrealizedPl || 0) >= 0 ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatCurrency(Number(snapshot.realizedPl || 0), 'USD')}
                            color={Number(snapshot.realizedPl || 0) >= 0 ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatPercentage(Number(snapshot.returnPercentage || 0))}
                            color={Number(snapshot.returnPercentage || 0) >= 0 ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={snapshot.granularity}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </TableCell>
                        {showActions && (
                          <TableCell>
                            <Stack direction="row" spacing={0.5}>
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
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      <SnapshotListFilters
        filters={filters}
        onFiltersChange={setFilters}
        portfolios={portfolios}
        assets={assets}
        loading={loading}
      />

      {/* Content */}
      <Paper elevation={0} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, border: 1, borderColor: 'divider' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Snapshot List
              </Typography>
              <Chip
                label={filters.viewMode === 'portfolio' ? 'By Portfolio' : 
                       filters.viewMode === 'asset' ? 'By Asset' : 'By Asset Type'}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
            <Tooltip title="Refresh Data 2">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

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
            Portfolio Overview
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
                          {formatCurrency(Number(snapshot.totalValue || 0), 'VND')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={snapshot.totalPl && Number(snapshot.totalPl) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {snapshot.totalPl && Number(snapshot.totalPl) >= 0 ? '+' : ''}
                          {formatCurrency(Number(snapshot.totalPl || 0), 'VND')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={snapshot.unrealizedPl && Number(snapshot.unrealizedPl) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {snapshot.unrealizedPl && Number(snapshot.unrealizedPl) >= 0 ? '+' : ''}
                          {formatCurrency(Number(snapshot.unrealizedPl || 0), 'VND')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={snapshot.realizedPl && Number(snapshot.realizedPl) >= 0 ? 'success.main' : 'error.main'}
                        >
                          {snapshot.realizedPl && Number(snapshot.realizedPl) >= 0 ? '+' : ''}
                          {formatCurrency(Number(snapshot.realizedPl || 0), 'VND')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(Number(snapshot.cashBalance || 0), 'VND')}
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

        {/* Content */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {renderGroupedView()}
        </Box>

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

export default SnapshotListView;
