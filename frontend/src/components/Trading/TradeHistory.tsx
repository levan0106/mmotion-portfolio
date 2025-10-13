import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { ResponsiveButton } from '../Common';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { TradeSide, TradeType, TradeSource } from '../../types/trading';
import { formatCurrency, formatNumber } from '../../utils/format';

export interface Trade {
  tradeId: string;
  portfolioId: string;
  assetId: string;
  assetSymbol?: string;
  assetName?: string;
  tradeDate: Date;
  side: TradeSide;
  quantity: number;
  price: number;
  totalValue: number;
  fee: number;
  tax: number;
  totalCost: number;
  tradeType: TradeType;
  source: TradeSource;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  realizedPl?: number;
  tradeDetailsCount?: number;
  remainingQuantity?: number;
}

export interface TradeHistoryProps {
  trades: Trade[];
  isLoading?: boolean;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  onView?: (trade: Trade) => void;
  onExport?: () => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
}

/**
 * TradeHistory component for displaying comprehensive trade history.
 * Provides advanced filtering, sorting, and export capabilities.
 */
export const TradeHistory: React.FC<TradeHistoryProps> = ({
  trades,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onExport,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sideFilter, setSideFilter] = useState<TradeSide | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TradeType | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<TradeSource | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('tradeDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Filter and sort trades
  const filteredAndSortedTrades = useMemo(() => {
    let filtered = trades.filter((trade) => {
      const matchesSearch = 
        trade.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSide = sideFilter === 'ALL' || trade.side === sideFilter;
      const matchesType = typeFilter === 'ALL' || trade.tradeType === typeFilter;
      const matchesSource = sourceFilter === 'ALL' || trade.source === sourceFilter;

      let matchesDateRange = true;
      if (dateRange !== 'ALL') {
        const tradeDate = new Date(trade.tradeDate);
        const now = new Date();
        const daysAgo = parseInt(dateRange.replace('D', ''));
        
        if (dateRange.includes('D')) {
          const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          matchesDateRange = tradeDate >= cutoffDate;
        }
      }

      return matchesSearch && matchesSide && matchesType && matchesSource && matchesDateRange;
    });

    // Sort trades
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'tradeDate':
          aValue = new Date(a.tradeDate);
          bValue = new Date(b.tradeDate);
          break;
        case 'assetSymbol':
          aValue = a.assetSymbol || '';
          bValue = b.assetSymbol || '';
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'totalValue':
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case 'realizedPl':
          aValue = a.realizedPl || 0;
          bValue = b.realizedPl || 0;
          break;
        default:
          aValue = new Date(a.tradeDate);
          bValue = new Date(b.tradeDate);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [trades, searchTerm, sideFilter, typeFilter, sourceFilter, dateRange, sortBy, sortOrder]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, trade: Trade) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrade(trade);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTrade(null);
  };

  const handleAction = (action: 'view' | 'edit' | 'delete') => {
    if (!selectedTrade) return;

    switch (action) {
      case 'view':
        onView?.(selectedTrade);
        break;
      case 'edit':
        onEdit?.(selectedTrade);
        break;
      case 'delete':
        onDelete?.(selectedTrade);
        break;
    }
    handleMenuClose();
  };

  const getSideColor = (side: TradeSide) => {
    return side === TradeSide.BUY ? 'success' : 'error';
  };

  const getSideIcon = (side: TradeSide) => {
    return side === TradeSide.BUY ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  // Calculate summary statistics
  const totalValue = filteredAndSortedTrades.reduce((sum, trade) => sum + (Number(trade.totalValue) || 0), 0);
  const totalFees = filteredAndSortedTrades.reduce((sum, trade) => sum + (Number(trade.fee) || 0) + (Number(trade.tax) || 0), 0);
  const totalRealizedPL = filteredAndSortedTrades.reduce((sum, trade) => sum + (Number(trade.realizedPl) || 0), 0);

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Trade History
          </Typography>
          <Box display="flex" gap={2}>
            <ResponsiveButton
              variant="outlined"
              icon={<FilterIcon />}
              onClick={() => {
                // Toggle filter visibility
              }}
              mobileText="Filters"
              desktopText="Filters"
            >
              Filters
            </ResponsiveButton>
            <ResponsiveButton
              variant="outlined"
              icon={<DownloadIcon />}
              onClick={onExport}
              mobileText="Export"
              desktopText="Export"
            >
              Export
            </ResponsiveButton>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {formatCurrency(totalValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(totalFees)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Fees
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h6" 
                  color={totalRealizedPL >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(totalRealizedPL)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Realized P&L
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {filteredAndSortedTrades.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Trades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Side</InputLabel>
              <Select
                value={sideFilter}
                label="Side"
                onChange={(e) => setSideFilter(e.target.value as TradeSide | 'ALL')}
              >
                <MenuItem value="ALL">All Sides</MenuItem>
                <MenuItem value={TradeSide.BUY}>Buy</MenuItem>
                <MenuItem value={TradeSide.SELL}>Sell</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value as TradeType | 'ALL')}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value={TradeType.MARKET}>Market</MenuItem>
                <MenuItem value={TradeType.LIMIT}>Limit</MenuItem>
                <MenuItem value={TradeType.STOP}>Stop</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={sourceFilter}
                label="Source"
                onChange={(e) => setSourceFilter(e.target.value as TradeSource | 'ALL')}
              >
                <MenuItem value="ALL">All Sources</MenuItem>
                <MenuItem value={TradeSource.MANUAL}>Manual</MenuItem>
                <MenuItem value={TradeSource.API}>API</MenuItem>
                <MenuItem value={TradeSource.IMPORT}>Import</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="ALL">All Time</MenuItem>
                <MenuItem value="7D">Last 7 Days</MenuItem>
                <MenuItem value="30D">Last 30 Days</MenuItem>
                <MenuItem value="90D">Last 90 Days</MenuItem>
                <MenuItem value="1Y">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {filteredAndSortedTrades.length} trades
            </Typography>
          </Grid>
        </Grid>

        {/* Sort Controls */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="tradeDate">Date</MenuItem>
                <MenuItem value="assetSymbol">Asset</MenuItem>
                <MenuItem value="quantity">Quantity</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="totalValue">Total Value</MenuItem>
                <MenuItem value="realizedPl">Realized P&L</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Trades Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell align="right">Fees</TableCell>
                <TableCell align="right">Total Cost</TableCell>
                <TableCell align="right">P&L</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography>Loading trades...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No trades found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTrades.map((trade) => (
                  <TableRow key={trade.tradeId} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {format(parseISO(trade.tradeDate.toString()), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(trade.tradeDate.toString()), 'HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {trade.assetSymbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trade.assetName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trade.side}
                        color={getSideColor(trade.side)}
                        size="small"
                        icon={getSideIcon(trade.side)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatNumber(trade.quantity, 2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(trade.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(Number(trade.totalValue) || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency((Number(trade.fee) || 0) + (Number(trade.tax) || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(trade.totalCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {trade.realizedPl !== undefined && (
                        <Typography
                          variant="body2"
                          color={trade.realizedPl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {formatCurrency(Number(trade.realizedPl) || 0)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, trade)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => onPageChange?.(page)}
              color="primary"
            />
          </Box>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleAction('view')}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Trade</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Trade</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default TradeHistory;
