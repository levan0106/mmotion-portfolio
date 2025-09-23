import React from 'react';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { formatCurrency, formatPercentage, formatDate, formatNumber } from '../../../../utils/format';
import { SnapshotResponse } from '../../../../types/snapshot.types';

interface SnapshotAssetSnapshotTabProps {
  transformedSnapshots: any[];
  expandedAssetTypes: Set<string>;
  allExpanded: boolean;
  toggleAssetType: (assetType: string) => void;
  toggleAll: () => void;
  getAssetTypeIcon: (assetType: string) => React.ReactElement;
  baseCurrency: string;
  showActions: boolean;
  onSnapshotSelect?: (snapshot: SnapshotResponse) => void;
  onSnapshotEdit?: (snapshot: SnapshotResponse) => void;
  onSnapshotDelete?: (snapshot: SnapshotResponse) => void;
  loading: boolean;
  pagination: any;
  page: number;
  rowsPerPage: number;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  snapshots: any[];
  portfolios: any[];
}

const SnapshotAssetSnapshotTab: React.FC<SnapshotAssetSnapshotTabProps> = ({
  transformedSnapshots,
  expandedAssetTypes,
  allExpanded,
  toggleAssetType,
  toggleAll,
  getAssetTypeIcon,
  baseCurrency,
  showActions,
  onSnapshotSelect,
  onSnapshotEdit,
  onSnapshotDelete,
  loading,
  pagination,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
  snapshots,
  portfolios,
}) => {
  return (
    <Box>
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
              <Alert severity="warning" sx={{ mb: 2 }}>
                Some snapshots reference portfolios that are not found: {missingPortfolios.map(id => id.substring(0, 8) + '...').join(', ')}
              </Alert>
            );
          }
          return null;
        })()
      )}

      {/* Collapsible Table Layout */}
      <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100 }}>
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

              const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
              
              return dates.map((date) => {
                const dateGroups = groupedByDate[date];
                const assetTypes = Object.keys(dateGroups).sort();
                
                return assetTypes.map((assetType) => {
                  const typeSnapshots = dateGroups[assetType];
                  const isExpanded = expandedAssetTypes.has(`${date}_${assetType}`);
                  
                  // Calculate totals for asset type
                  const totalValue = typeSnapshots.reduce((sum: number, s: any) => sum + Number(s.currentValue || 0), 0);
                  const totalPl = typeSnapshots.reduce((sum: number, s: any) => sum + Number(s.totalPl || 0), 0);
                  const totalUnrealizedPl = typeSnapshots.reduce((sum: number, s: any) => sum + Number(s.unrealizedPl || 0), 0);
                  const totalRealizedPl = typeSnapshots.reduce((sum: number, s: any) => sum + Number(s.realizedPl || 0), 0);
                  const totalQuantity = typeSnapshots.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0);
                  const avgPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
                  const avgReturn = typeSnapshots.length > 0 ? 
                    typeSnapshots.reduce((sum: number, s: any) => sum + Number(s.returnPercentage || 0), 0) / typeSnapshots.length : 0;
                  
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
    </Box>
  );
};

export default SnapshotAssetSnapshotTab;
